import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, ListGroup, Spinner, Alert } from 'react-bootstrap';

export default function TaskDetail() {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  useEffect(() => {
    const fetchTask = async () => {
      if (!token) { navigate('/login'); return; }
      setIsLoading(true);
      setError(null);
      try {
        const res = await axios.get(`http://localhost:5000/tasks/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTask(res.data);
      } catch (err) {
        console.error("Failed to fetch task details:", err);
        setError("Could not fetch task details. It may not exist or you may not have permission to view it.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTask();
  }, [id, token, navigate]);

  const handleDownloadSummary = () => {
    axios({
        url: `http://localhost:5000/task/${task.id}/download-summary`,
        method: 'GET',
        responseType: 'blob', // Important for handling file downloads
        headers: { Authorization: `Bearer ${token}` }
    }).then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const fileName = `Task-Summary-${task.id}.pdf`;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
    }).catch(err => {
        console.error("PDF download failed:", err);
        alert("Failed to download the task summary PDF.");
    });
  };

  if (isLoading) {
    return (<div className="text-center container py-5"><Spinner animation="border" /></div>);
  }

  if (error) {
    return <Alert variant="danger" className="container mt-5">{error}</Alert>;
  }

  if (!task) {
    return <Alert variant="warning" className="container mt-5">Task not found.</Alert>;
  }
  
  const dashboardLink = userRole === 'admin' ? '/admin' : '/employee';

  return (
    <div className="container py-5">
      <Card className="shadow-lg">
        <Card.Header as="h2" className="bg-primary text-white">Title:    {task.taskTitle}</Card.Header>
        <Card.Body>
          <Card.Text><strong>Description:</strong><p style={{ whiteSpace: 'pre-wrap' }}>{task.description}</p></Card.Text>
          <ListGroup variant="flush" className="my-3">
            <ListGroup.Item><strong>Assignee:</strong> {task.assignee}</ListGroup.Item>
            <ListGroup.Item><strong>Deadline:</strong> {new Date(task.deadline).toLocaleDateString()}</ListGroup.Item>
            <ListGroup.Item><strong>Status:</strong> <span className="text-capitalize badge bg-info">{task.status}</span></ListGroup.Item>
            <ListGroup.Item><strong>Uploaded File Path:</strong> {task.filePath ? <code>{task.filePath}</code> : 'No file has been uploaded.'}</ListGroup.Item>
          </ListGroup>
          <div className="mt-4">
            {/* NEW BUTTON TO DOWNLOAD THE FULL PDF SUMMARY */}
            <button className="btn btn-primary" onClick={handleDownloadSummary}>
              ⬇️ Download Complete Task File (PDF)
            </button>
            
            {/* Existing button to download only the attachment */}
            {task.filePath && (
              <a href={`http://localhost:5000/download/${task.id}`} className="btn btn-success ms-2" download>
                Download Attached File Only
              </a>
            )}

            <Link to={dashboardLink} className="btn btn-secondary ms-2">
              Back to Dashboard
            </Link>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}