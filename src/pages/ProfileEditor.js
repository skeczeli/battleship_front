import React, { useState, useEffect } from "react";
import "../styles/register.css";

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

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

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    const updates = {};
    Object.keys(formData).forEach((key) => {
      if (key !== "confirmPassword" && formData[key]) {
        updates[key] = formData[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      setError("No cambiaste nada.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/users/update", {
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
        alert("Datos actualizados correctamente.");
        setFormData({
          username: "",
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
        setError("");
      } else {
        setError("Error al actualizar los datos.");
      }
    } catch (err) {
      console.error(err);
      setError("Error de red.");
    }
  };

  if (!user)
    return (
      <p style={{ textAlign: "center" }}>Iniciá sesión para ver tu perfil.</p>
    ); // --------------------------------------

  return (
    <div className="profile-container">
      <h2>Editar Perfil</h2>
      {error && <p className="error-message">{error}</p>}
      <form className="profile-form" onSubmit={handleSubmit}>
        <label>
          Usuario:
          <input
            name="username"
            placeholder={user.username}
            value={formData.username}
            onChange={handleChange}
          />
        </label>
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
          Nueva Contraseña:
          <input
            type="password"
            name="password"
            placeholder="********"
            value={formData.password}
            onChange={handleChange}
          />
        </label>
        <label>
          Confirmar Contraseña:
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
  );
};

export default UserProfile;
