// src/pages/Register.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/register.css";

function Register() {
  const [formData, setFormData] = useState({
    username: "",
    nickname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    const userDTO = {
      username: formData.username,
      password: formData.password,
      name: formData.nickname, // o como corresponda
      email: formData.email,
    };

    try {
      const response = await fetch("http://localhost:8080/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userDTO),
      });

      const result = await response.text();
      console.log("Respuesta del servidor:", result);

      if (response.ok) {
        alert("Usuario registrado correctamente");
        // Guardar sesión simple
        localStorage.setItem("user", JSON.stringify(userDTO));

        // Redirigir (por ejemplo, a /dashboard o donde tengas la parte logueada)
        window.location.href = "/"; // o usar navigate si usás react-router v6
      } else {
        alert("Error al registrar: " + result);
      }
    } catch (error) {
      console.error("Error en el fetch:", error);
      alert("Error al conectar con el servidor");
    }
  };

  return (
    <div className="container">
      <div className="top-buttons">
        <Link to="/">
          <button className="button">Home</button>
        </Link>
        <Link to="/login">
          <button className="button">Log in</button>
        </Link>
      </div>

      <h1>Registro</h1>
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
          <label htmlFor="nickname">Nickname:</label>
          <input
            type="text"
            id="nickname"
            name="nickname"
            value={formData.nickname}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
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
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="button">
          Register
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Login in here</Link>
      </p>
    </div>
  );
}

export default Register;
