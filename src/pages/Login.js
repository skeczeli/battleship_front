import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { setPlayerId } from "services/PlayerService";
import { useUser } from "contexts/UserContext";
import "styles/register.css";

function Login() {
  const { login } = useUser();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData) {
      // Redirect logged-in users to the home page or profile page
      navigate(`/profile/${userData.username}`);
    }
  }, [navigate]);

  // Auto-ocultar mensajes después de 3 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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
          setError("Authentication failed");
          return;
        }

        console.log("Token extraído:", token); // Debug
        console.log("Usuario:", user); // Debug

        // Pasar user y token por separado al login
        login(user, token);
        setPlayerId(user.username, false);

        // Verificar que se guardó correctamente
        setTimeout(() => {
          console.log("Token en localStorage:", localStorage.getItem("token"));
        }, 100);

        navigate("/");
      } else {
        const errorData = await response.text();
        setError(errorData || "Authentication error");
      }
    } catch (err) {
      console.error("Error en login:", err);
      setError("Could not connect to server");
    }
  };

  return (
    <>
      {/* Mensaje flotante hermoso */}
      {error && <div className="floating-message error-floating">{error}</div>}

      <div className="profile-container">
        <h1>Iniciar sesión</h1>
        <form onSubmit={handleSubmit} className="profile-form">
          <label htmlFor="username">Usuario:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <label htmlFor="password">Contraseña:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <button type="submit">Iniciar Sesión</button>
          <p className="auth-link">
            ¿No tienes una cuenta? <Link to="/register">Registrate aquí</Link>
          </p>
        </form>
      </div>
    </>
  );
}

export default Login;
