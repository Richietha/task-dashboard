import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Spinner, Alert } from "react-bootstrap";

export default function EmployeeDashboard() {
  const [tasks, setTasks] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // --- All functions below are correct, only handleUpload is modified ---

  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

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
      setError("Could not fetch your assigned tasks. Please try again later.");
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        handleLogout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTasks();
    } else {
      navigate("/login");
    }
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await axios.put(
        `http://localhost:5000/tasks/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTasks();
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update task status. Please try again.");
    }
  };

  const handleFileSelect = (e, taskId) => {
    if (e.target.files[0]) {
      setSelectedFiles({
        ...selectedFiles,
        [taskId]: e.target.files[0]
      });
    }
  };

  // --- THIS IS THE MODIFIED FUNCTION ---
  const handleUpload = async (id) => {
    const fileToUpload = selectedFiles[id];
    if (!fileToUpload) {
      alert("Please select a file for this task first.");
      return;
    }
    const formData = new FormData();
    formData.append("file", fileToUpload);
    try {
      // The API call remains the same
      await axios.post(`http://localhost:5000/tasks/${id}/upload`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("File uploaded successfully!");

      // REQUIREMENT ADDED: Update the UI instantly without a full refresh
      setTasks(currentTasks => 
        currentTasks.map(task => {
          if (task.id === id) {
            // Find the task that was just updated and give it a filePath
            // so the UI knows to show "Uploaded"
            return { ...task, filePath: 'uploaded' }; // The exact path doesn't matter, just that it's not null
          }
          return task;
        })
      );
      
      const newSelectedFiles = { ...selectedFiles };
      delete newSelectedFiles[id];
      setSelectedFiles(newSelectedFiles);
      
    } catch (error) {
      console.error("File upload failed:", error);
      alert("File upload failed. Please try again.");
    }
  };

  const handleSubmitTask = (id) => {
    if (window.confirm("Are you sure you want to submit this task?")) {
      alert("Task Submitted Successfully!");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed": return "bg-success text-white";
      case "in-progress": return "bg-primary text-white";
      case "not yet started": return "bg-warning text-dark";
      default: return "bg-secondary text-white";
    }
  };

  return (
    <div className="container-fluid py-5 px-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="text-primary">Employee Dashboard</h1>
        <button className="btn btn-danger" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="card shadow">
        <div className="card-header bg-info text-white">
          <h5 className="mb-0">My Tasks</h5>
        </div>
        <div className="card-body table-responsive">
          {isLoading ? (
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading your tasks...</p>
            </div>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : (
            <table className="table table-bordered table-hover align-middle" style={{ tableLayout: 'fixed', width: '100%' }}>
              <thead className="table-light">
                <tr>
                  <th style={{ width: '15%' }}>Title</th>
                  <th style={{ width: '25%' }}>Description</th>
                  <th style={{ width: '10%' }}>Deadline</th>
                  <th style={{ width: '15%' }}>Status</th>
                  <th style={{ width: '25%' }}>File Action</th>
                  <th style={{ width: '10%' }}>View</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length > 0 ? (
                  tasks.map((t) => (
                    <tr key={t.id}>
                      <td style={{ wordBreak: 'break-word' }}>{t.taskTitle}</td>
                      <td style={{ wordBreak: 'break-word' }}>{t.description}</td>
                      <td>{new Date(t.deadline).toLocaleDateString()}</td>
                      <td>
                        <select
                          className={`form-select ${getStatusBadge(t.status)}`}
                          value={t.status}
                          onChange={(e) => handleStatusChange(t.id, e.target.value)}
                        >
                          <option value="not yet started">Not Yet Started</option>
                          <option value="in-progress">In-Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                      <td>
                        <div className="input-group">
                          <input
                            type="file"
                            className="form-control"
                            onChange={(e) => handleFileSelect(e, t.id)}
                            // MODIFICATION: Disable the input if a file is already uploaded for this task
                            disabled={!!t.filePath}
                          />
                          {/* --- REQUIREMENT ADDED: Conditional Rendering for the button --- */}
                          {t.filePath ? (
                            // If a file path exists, show the "Uploaded" confirmation
                            <button className="btn btn-success" disabled>
                              Uploaded
                            </button>
                          ) : (
                            // Otherwise, show the "Upload" button
                            <button
                              className="btn btn-outline-success"
                              onClick={() => handleUpload(t.id)}
                            >
                              Upload
                            </button>
                          )}
                          <button
                            className="btn btn-success"
                            onClick={() => handleSubmitTask(t.id)}
                          >
                            Submit Task
                          </button>
                        </div>
                      </td>
                      <td className="text-center">
                        <Link to={`/task/${t.id}`} className="btn btn-sm btn-outline-primary">
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center text-muted">
                      You have no tasks assigned to you.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}