const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const PDFDocument = require("pdfkit"); // ADDED: Import the PDF library

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

const saltRounds = 10;

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "task_management",
});

db.connect((err) => {
  if (err) {
    console.error("DB connection failed:", err);
    return;
  }
  console.log("DB connected successfully");
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.status(403).send("A token is required for authentication");
  jwt.verify(token, "your_jwt_secret", (err, user) => {
    if (err) return res.status(401).send("Invalid Token");
    req.user = user;
    next();
  });
};

// --- ALL YOUR EXISTING ROUTES ARE UNCHANGED ---
app.post("/register", verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') { return res.status(403).send({ message: "Access denied."}); }
  const { username, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    db.query( "INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [username, hashedPassword, role], (err, result) => {
        if (err) { console.error(err); return res.status(500).send({ message: "Username may already be taken."}); }
        res.status(201).send({ message: "User created successfully!" });
    });
  } catch (err) { console.error(err); res.status(500).send({ message: "Error hashing password." }); }
});

app.post("/login", (req, res) => {
  const { username, password, role } = req.body;
  db.query("SELECT * FROM users WHERE username = ? AND role = ?", [username, role], async (err, results) => {
      if (err) return res.status(500).send(err);
      if (results.length === 0) { return res.status(404).send({ message: "Invalid credentials." }); }
      const user = results[0];
      try {
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (passwordMatch) {
          const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, "your_jwt_secret", { expiresIn: "2h" });
          res.json({ token, role: user.role, username: user.username });
        } else { res.status(404).send({ message: "Invalid credentials." }); }
      } catch (err) { res.status(500).send({ message: "Error during authentication." }); }
    }
  );
});

app.get("/users", verifyToken, (req, res) => {
  if (req.user.role !== 'admin') { return res.status(403).send({ message: "Access denied."}); }
  const role = req.query.role;
  let sql = "SELECT id, username FROM users";
  const params = [];
  if (role) {
    sql += " WHERE role = ?";
    params.push(role);
  }
  db.query(sql, params, (err, results) => {
    if (err) { console.error("Failed to fetch users:", err); return res.status(500).send(err); }
    res.json(results);
  });
});

app.post("/tasks", verifyToken, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).send("Access denied.");
  const { taskTitle, description, assignee, deadline } = req.body;
  db.query("INSERT INTO tasks (taskTitle, description, assignee, deadline) VALUES (?, ?, ?, ?)", [taskTitle, description, assignee, deadline], (err, result) => {
      if (err) return res.status(500).send(err);
      res.status(201).send({ message: "Task created successfully!" });
    }
  );
});

app.get("/tasks", verifyToken, (req, res) => {
  if (req.user.role === "admin") {
    db.query("SELECT * FROM tasks", (err, results) => {
      if (err) return res.status(500).send(err);
      res.json(results);
    });
  } else {
    db.query("SELECT * FROM tasks WHERE assignee = ?", [req.user.username], (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
      }
    );
  }
});

app.get("/tasks/:id", verifyToken, (req, res) => {
  const taskId = req.params.id;
  const user = req.user;
  db.query("SELECT * FROM tasks WHERE id = ?", [taskId], (err, results) => {
    if (err) return res.status(500).send(err);
    if (results.length === 0) return res.status(404).send("Task not found");
    const task = results[0];
    if (user.role === 'admin' || task.assignee === user.username) {
      return res.json(task);
    } else {
      return res.status(403).send("Access denied to this task.");
    }
  });
});

app.put("/tasks/:id/status", verifyToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  db.query("UPDATE tasks SET status = ? WHERE id = ?", [status, id], (err) => {
    if (err) return res.status(500).send(err);
    res.send({ message: "Task status updated successfully." });
  });
});

app.post("/tasks/:id/upload", verifyToken, upload.single("file"), (req, res) => {
  const { id } = req.params;
  const fileData = req.file.buffer;
  const filePath = `uploads/${Date.now()}_${req.file.originalname}`;
  db.query("UPDATE tasks SET filePath=?, fileData=? WHERE id=?", [filePath, fileData, id], (err) => {
      if (err) return res.status(500).send(err);
      res.send({ message: "File uploaded successfully." });
    }
  );
});

app.get("/download/:id", (req, res) => {
  const { id } = req.params;
  db.query("SELECT filePath, fileData FROM tasks WHERE id=?", [id], (err, results) => {
      if (err) return res.status(500).send(err);
      if (results.length === 0) return res.status(404).send("File not found");
      const file = results[0];
      const fileName = path.basename(file.filePath);
      res.setHeader("Content-Disposition", "attachment; filename=" + fileName);
      res.send(file.fileData);
    }
  );
});


// --- NEW REQUIREMENT: Generate and download a PDF summary of the task ---
app.get("/task/:id/download-summary", verifyToken, (req, res) => {
  const { id } = req.params;
  const user = req.user;

  db.query("SELECT * FROM tasks WHERE id = ?", [id], (err, results) => {
    if (err) { return res.status(500).send("Error fetching task from database."); }
    if (results.length === 0) { return res.status(404).send("Task not found."); }
    
    const task = results[0];

    // Security check: an employee can only download summaries for their own tasks
    if (user.role === 'employee' && task.assignee !== user.username) {
        return res.status(403).send("Access denied.");
    }

    // PDF GENERATION LOGIC
    const doc = new PDFDocument({ margin: 50 });
    const fileName = `Task-Summary-${task.id}-${task.taskTitle.replace(/\s+/g, '_')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    doc.pipe(res);

    doc.fontSize(22).font('Helvetica-Bold').text('Task Summary', { align: 'center' });
    doc.moveDown(2);
    
    doc.fontSize(16).font('Helvetica-Bold').text(task.taskTitle);
    doc.lineCap('round').moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown();

    doc.fontSize(12).font('Helvetica-Bold').text('Description:').font('Helvetica').text(task.description, { width: 500 });
    doc.moveDown();
    
    doc.font('Helvetica-Bold').text('Assignee:', { continued: true }).font('Helvetica').text(` ${task.assignee}`);
    doc.moveDown(0.5);

    doc.font('Helvetica-Bold').text('Deadline:', { continued: true }).font('Helvetica').text(` ${new Date(task.deadline).toLocaleDateString()}`);
    doc.moveDown(0.5);

    doc.font('Helvetica-Bold').text('Status:', { continued: true }).font('Helvetica').text(` ${task.status}`);
    doc.moveDown(0.5);

    doc.font('Helvetica-Bold').text('Attached File Path:', { continued: true }).font('Helvetica').text(` ${task.filePath || 'None'}`);
    doc.moveDown();

    doc.end();
  });
});


// --- Start Server ---
app.listen(5000, () => console.log("Server running on http://localhost:5000"));