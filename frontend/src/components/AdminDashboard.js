import React, { useState, useEffect } from "react";
import axios from "axios";
// ADDED: Import `Link` to create the "View Details" button
import { useNavigate, Link } from "react-router-dom";
import { Modal, Button, Spinner, Alert } from "react-bootstrap";

export default function AdminDashboard() {
  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState({ taskTitle: "", description: "", assignee: "", deadline: "" });
  
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "employee" });
  const [formMessage, setFormMessage] = useState({ type: "", text: "" });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // --- All existing functions below are unchanged ---

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get("http://localhost:5000/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      setError("Failed to fetch tasks. Please try again later.");
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        handleLogout();
      }
    } finally {
        setIsLoading(false);
    }
  };
  
  const fetchEmployees = async () => {
    try {
      const res = await axios.get("http://localhost:5000/users?role=employee", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(res.data);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  };

  const handleCreateTask = async () => {
    if (!task.assignee) {
        alert("Please select an employee to assign the task to.");
        return;
    }
    try {
      await axios.post("http://localhost:5000/tasks", task, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTasks();
      setTask({ taskTitle: "", description: "", assignee: "", deadline: "" });
    } catch (error) {
      console.error("Failed to create task:", error);
      alert("Failed to create the task. Please check the details and try again.");
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setFormMessage({ type: "", text: "" });

    try {
      await axios.post("http://localhost:5000/register", newUser, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setFormMessage({ type: "success", text: "User created successfully!" });
      setNewUser({ username: "", password: "", role: "employee" });
      
      if (newUser.role === 'employee') {
          fetchEmployees();
      }

      setTimeout(() => {
        setShowAddUserModal(false);
        setFormMessage({ type: "", text: "" });
      }, 2000);

    } catch (error) {
      console.error("Failed to add user:", error);
      setFormMessage({ type: "danger", text: error.response?.data?.message || "Failed to add user." });
    }
  };

  useEffect(() => {
    if (token) {
      fetchTasks();
      fetchEmployees();
    } else {
      navigate("/login");
    }
  }, []);

  return (
    <>
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="text-primary">Admin Dashboard</h1>
          <div>
            <Button variant="info" className="me-2" onClick={() => setShowAddUserModal(true)}>
              ➕ Add User
            </Button>
            <button className="btn btn-danger" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        <div className="card shadow mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Assign New Task</h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">Task Title</label>
              <input type="text" className="form-control" placeholder="Enter task title" value={task.taskTitle} onChange={(e) => setTask({ ...task, taskTitle: e.target.value })}/>
            </div>
            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows="3" placeholder="Enter task description" value={task.description} onChange={(e) => setTask({ ...task, description: e.target.value })}></textarea>
            </div>
            <div className="mb-3">
              <label className="form-label">Assign To</label>
              <select 
                  className="form-select" 
                  value={task.assignee} 
                  onChange={(e) => setTask({ ...task, assignee: e.target.value })}>
                  <option value="">Select an employee</option>
                  {employees.map(emp => (
                      <option key={emp.id} value={emp.username}>{emp.username}</option>
                  ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Deadline</label>
              <input type="date" className="form-control" value={task.deadline} onChange={(e) => setTask({ ...task, deadline: e.target.value })}/>
            </div>
            <button className="btn btn-success" onClick={handleCreateTask}>➕ Create Task</button>
          </div>
        </div>

        <div className="card shadow">
          <div className="card-header bg-secondary text-white">
            <h5 className="mb-0">All Assigned Tasks</h5>
          </div>
          <div className="card-body table-responsive">
            {isLoading ? (
              <div className="text-center">
                  <Spinner animation="border" variant="primary" />
                  <p>Loading tasks...</p>
              </div>
            ) : error ? (
              <Alert variant="danger">{error}</Alert>
            ) : (
              <table className="table table-bordered table-hover align-middle">
                <thead className="table-light">
                  {/* REQUIREMENT ADDED: "View" column header */}
                  <tr>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Assignee</th>
                    <th>Deadline</th>
                    <th>Status</th>
                    <th>View</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.length > 0 ? tasks.map((t) => (
                    <tr key={t.id}>
                      <td>{t.taskTitle}</td>
                      <td>{t.description}</td>
                      <td>{t.assignee}</td>
                      <td>{new Date(t.deadline).toLocaleDateString()}</td>
                      <td><span className="badge bg-info text-dark">{t.status}</span></td>
                      {/* REQUIREMENT ADDED: "View Details" button linking to the task detail page */}
                      <td className="text-center">
                        <Link to={`/task/${t.id}`} className="btn btn-sm btn-outline-info">
                          View Details
                        </Link>
                      </td>
                    </tr>
                  )) : (
                      <tr><td colSpan="6" className="text-center">No tasks found.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <Modal show={showAddUserModal} onHide={() => setShowAddUserModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleAddUser}>
            <div className="form-floating mb-3">
              <input type="text" className="form-control" id="newUsername" placeholder="Username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} required />
              <label htmlFor="newUsername">Username</label>
            </div>
            <div className="form-floating mb-3">
              <input type="password" className="form-control" id="newPassword" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
              <label htmlFor="newPassword">Password</label>
            </div>
            <div className="form-floating mb-3">
              <select className="form-select" id="newRole" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
              <label htmlFor="newRole">Role</label>
            </div>
            {formMessage.text && (<div className={`alert alert-${formMessage.type} py-2`}>{formMessage.text}</div>)}
            <div className="d-grid">
              <Button variant="primary" type="submit">Submit</Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </>
  );
}