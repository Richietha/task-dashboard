import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("admin");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post("http://localhost:5000/login", {
        username,
        password,
        role: activeTab.toLowerCase(), // ✅ ensure lowercase for backend
      });

      const { token, role, username: loggedInUsername } = res.data;

      // Save session
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("username", loggedInUsername);

      // Navigate based on role
      if (role.toLowerCase() === "admin") {
        navigate("/admin");
      } else {
        navigate("/employee");
      }
    } catch (err) {
      if (err.response) {
        if (err.response.status === 404) {
          setError("Invalid username or password.");
        } else if (err.response.status === 403) {
          setError("Role does not match for this user.");
        } else {
          setError("Server error. Please try again later.");
        }
      } else {
        setError("Network error. Please check your connection.");
      }
      console.error("Login failed:", err);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}
    >
      <div className="card shadow-lg" style={{ width: "100%", maxWidth: "450px" }}>
        <div className="card-body p-4 p-md-5">
          <h2 className="card-title text-center text-primary mb-4">
            Task Management Dashboard
          </h2>

          {/* Role Tabs */}
          <ul className="nav nav-pills nav-fill mb-4">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${activeTab === "admin" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("admin");
                  setError(""); // ✅ clear error on tab change
                }}
              >
                Admin
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${activeTab === "employee" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("employee");
                  setError(""); // ✅ clear error on tab change
                }}
              >
                Employee
              </button>
            </li>
          </ul>

          {/* Login Form */}
          <form onSubmit={handleLogin}>
            <div className="form-floating mb-3">
              <input
                type="text"
                className="form-control"
                id="floatingUsername"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
              <label htmlFor="floatingUsername">Username</label>
            </div>

            <div className="form-floating mb-4">
              <input
                type="password"
                className="form-control"
                id="floatingPassword"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <label htmlFor="floatingPassword">Password</label>
            </div>

            {/* Error Message */}
            {error && <div className="alert alert-danger py-2">{error}</div>}

            <div className="d-grid">
              <button
                type="submit"
                className="btn btn-primary btn-lg text-uppercase fw-bold"
              >
                Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}