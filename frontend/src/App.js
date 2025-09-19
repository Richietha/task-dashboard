import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import EmployeeDashboard from "./components/EmployeeDashboard";
import ProtectedRoute from "./components/ProtectedRoute"; // Your gatekeeper component
import TaskDetail from "./components/TaskDetail"; // Your detail page component
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Protected Admin Route */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Protected Employee Route */}
      <Route
        path="/employee"
        element={
          <ProtectedRoute allowedRoles={['employee']}>
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />

      {/* --- THIS IS THE CORRECTED ROUTE --- */}
      {/* It now allows BOTH admins and employees to access it */}
      <Route
        path="/task/:id"
        element={
          <ProtectedRoute allowedRoles={['admin', 'employee']}>
            <TaskDetail />
          </ProtectedRoute>
        }
      />

      {/* Catch-all route to redirect any unknown paths */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;