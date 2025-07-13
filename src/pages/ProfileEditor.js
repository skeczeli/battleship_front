import React, { useState, useEffect } from "react";
import "../styles/register.css";

const UserProfile = () => {
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData) {
      setUser(userData);
      setFormData((prev) => ({
        ...prev,
        name: userData.name || "",
        email: userData.email || "",
        username: userData.username || "",
      }));
    }
  }, []);

  // Auto-ocultar mensajes después de 3 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    if (!user?.token) {
      // Limpiar mensajes anteriores
      setSuccess("");
      setError("Invalid session. Please log in again.");
      return;
    }

    e.preventDefault();

    if (formData.password && formData.password !== formData.confirmPassword) {
      // Limpiar mensajes anteriores
      setSuccess("");
      setError("Passwords don't match.");
      return;
    }

    const updates = {};
    Object.keys(formData).forEach((key) => {
      if (key !== "confirmPassword" && formData[key]) {
        updates[key] = formData[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      // Limpiar mensajes anteriores
      setSuccess("");
      setError("You didn't change anything.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        const newUserData = { ...user, ...updatedUser };
        setUser(newUserData);
        localStorage.setItem("user", JSON.stringify(newUserData));
        // Limpiar mensajes anteriores
        setError("");
        setSuccess("Data updated successfully.");
        setFormData({
          username: "",
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
      } else {
        // Limpiar mensajes anteriores
        setSuccess("");
        setError("Error updating data.");
      }
    } catch (err) {
      console.error(err);
      // Limpiar mensajes anteriores
      setSuccess("");
      setError("Network error.");
    }
  };

  if (!user)
    return (
      <p style={{ textAlign: "center" }}>Iniciá sesión para ver tu perfil.</p>
    ); // --------------------------------------

  return (
    <>
      {/* Mensajes flotantes hermosos */}
      {error && <div className="floating-message error-floating">{error}</div>}
      {success && (
        <div className="floating-message success-floating">{success}</div>
      )}

      <div className="profile-container">
        <h2>Editar Perfil</h2>
        <form className="profile-form" onSubmit={handleSubmit}>
          <label>Usuario: {user.username}</label>
          <label>
            Apodo:
            <input
              name="name"
              placeholder={user.name || "Sin apodo"}
              value={formData.name}
              onChange={handleChange}
            />
          </label>
          <label>
            Email:
            <input
              type="email"
              name="email"
              placeholder={user.email}
              value={formData.email}
              onChange={handleChange}
            />
          </label>
          <label>
            Nueva contraseña:
            <input
              type="password"
              name="password"
              placeholder="********"
              value={formData.password}
              onChange={handleChange}
            />
          </label>
          <label>
            Confirmar contraseña:
            <input
              type="password"
              name="confirmPassword"
              placeholder="********"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </label>
          <button type="submit">Actualizar</button>
        </form>
      </div>
    </>
  );
};

export default UserProfile;
