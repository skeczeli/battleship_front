// src/pages/Login.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { setPlayerId } from "services/PlayerService";
import { useUser } from "contexts/UserContext";

import "styles/register.css";

function Login() {
  const { login } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData) {
      // Redirect logged-in users to the home page or profile page
      navigate(`/profile/${userData.username}`);
    }
  }, [navigate]);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:8080/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const user = await response.json();
        const authHeader = response.headers.get("Authorization");

        const token = authHeader?.replace("Bearer ", "");

        if (!token) {
          console.error("No se pudo extraer el token");
          alert("Falló la autenticación");
          return;
        }

        const fullUser = { ...user, token };
        login(fullUser);
        setPlayerId(user.username, false);

        navigate("/");
      } else {
        const errorData = await response.text();
        alert(errorData || "Error en la autenticación");
      }
    } catch (err) {
      console.error("Error en login:", err);
      alert("No se pudo conectar con el servidor");
    }
  };

  return (
    <div className="container">
      <h1>Login</h1>
      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="button">
          Login
        </button>
      </form>
      <p>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
}

export default Login;
