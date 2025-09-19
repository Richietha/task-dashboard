import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState({ taskTitle: "", description: "", assignee: "", deadline: "" });
  const [file, setFile] = useState(null);

  // ✅ Get token from localStorage and useNavigate hook
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const fetchTasks = async () => {
    try {
      // ✅ Add authorization header to the request
      const res = await axios.get("http://localhost:5000/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      // ✅ Redirect to login if token is invalid or expired
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        navigate("/login");
      }
    }
  };

  // ✅ Check for token on component load
  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else {
      fetchTasks();
    }
  }, []);

  const handleCreateTask = async () => {
    try {
        // ✅ Add authorization header to the request
        await axios.post("http://localhost:5000/tasks", task, {
            headers: { Authorization: `Bearer ${token}` },
        });
        fetchTasks();
        setTask({ taskTitle: "", description: "", assignee: "", deadline: "" });
    } catch (error) {
        console.error("Failed to create task:", error);
    }
  };

  const handleUpload = async (id) => {
    if (!file) return alert("Please select a file first.");
    const formData = new FormData();
    formData.append("file", file);
    try {
        // ✅ Add authorization header to the request
        await axios.post(`http://localhost:5000/tasks/${id}/upload`, formData, {
            headers: { Authorization: `Bearer ${token}` },
        });
        fetchTasks();
    } catch (error) {
        console.error("File upload failed:", error);
    }
  };

  return (
    <div className="container py-5">
      <h1 className="text-center text-primary mb-4">📊 Task Management Dashboard</h1>

      {/* Task Assignment Form */}
      <div className="card shadow mb-4">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">Assign New Task</h5>
        </div>
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label">Task Title</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter task title"
              value={task.taskTitle}
              onChange={(e) => setTask({ ...task, taskTitle: e.target.value })}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Enter task description"
              value={task.description}
              onChange={(e) => setTask({ ...task, description: e.target.value })}
            ></textarea>
          </div>

          <div className="mb-3">
            <label className="form-label">Assign To</label>
            <input
              type="text"
              className="form-control"
              placeholder="Employee Name"
              value={task.assignee}
              onChange={(e) => setTask({ ...task, assignee: e.target.value })}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Deadline</label>
            <input
              type="date"
              className="form-control"
              value={task.deadline}
              onChange={(e) => setTask({ ...task, deadline: e.target.value })}
            />
          </div>

          <button className="btn btn-success" onClick={handleCreateTask}>
            ➕ Create Task
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="card shadow">
        <div className="card-header bg-secondary text-white">
          <h5 className="mb-0">All Tasks</h5>
        </div>
        <div className="card-body table-responsive">
          <table className="table table-bordered table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Title</th>
                <th>Assignee</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>File Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td>{t.taskTitle}</td>
                  <td>{t.assignee}</td>
                  <td>{new Date(t.deadline).toLocaleDateString()}</td>
                  <td>
                    <span
                      className={`badge ${
                        t.status === "completed" ? "bg-success" : "bg-warning text-dark"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td>
                    {t.filePath ? (
                      <a
                        href={`http://localhost:5000/download/${t.id}`}
                        className="btn btn-sm btn-primary"
                      >
                        ⬇ Download
                      </a>
                    ) : (
                      <div className="d-flex gap-2">
                        <input
                          type="file"
                          className="form-control form-control-sm"
                          onChange={(e) => setFile(e.target.files[0])}
                        />
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleUpload(t.id)}
                        >
                          ⬆ Upload
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-muted">
                    No tasks available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}