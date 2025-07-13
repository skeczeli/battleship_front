import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "contexts/UserContext"; // ✅ agregado
import "../styles/register.css";

function Register() {
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";
  const navigate = useNavigate();
  const { login } = useUser(); // ✅ movido aquí (fuera de handleSubmit)
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData) {
      navigate(`/profile/${userData.username}`);
    }
  }, [navigate]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const [formData, setFormData] = useState({
    username: "",
    name: "",
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
      setError("Las contraseñas no coinciden");
      return;
    }

    const userDTO = {
      username: formData.username,
      password: formData.password,
      name: formData.name,
      email: formData.email,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userDTO),
      });

      const result = await response.text();
      console.log("Respuesta del servidor:", result);

      if (response.ok) {
        setMessage("¡Usuario registrado correctamente! 🎉");

        // ✅ login automático
        const loginResponse = await fetch(`${API_BASE_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: userDTO.username,
            password: userDTO.password,
          }),
        });

        if (loginResponse.ok) {
          const user = await loginResponse.json();
          const authHeader = loginResponse.headers.get("Authorization");
          const token = authHeader?.replace("Bearer ", "");

          if (token) {
            login(user, token); // ✅ se guarda correctamente
            navigate("/");
          } else {
            console.error("No se recibió token tras el registro");
            setError("Error al iniciar sesión automáticamente");
          }
        } else {
          setError("Error al iniciar sesión tras el registro");
        }
      } else if (response.status === 409) {
        setError("❌ Ese nombre de usuario ya está en uso. Elegí otro.");
      } else {
        setError("❌ Error al registrar: " + result);
      }
    } catch (error) {
      console.error("Error en el fetch:", error);
      setError("❌ Error al conectar con el servidor");
    }
  };

  return (
    <>
      {error && <div className="floating-message error-floating">{error}</div>}
      {message && (
        <div className="floating-message success-floating">{message}</div>
      )}

      <div className="profile-container">
        <h1>Register</h1>
        <form onSubmit={handleSubmit} className="profile-form">
          <label>
            Usuario:
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Nombre:
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Email:
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Contraseña:
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Confirmar constraseña:
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </label>

          <button type="submit">Registrarse</button>
          <p className="auth-link">
            ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión aquí</Link>
          </p>
        </form>
      </div>
    </>
  );
}

export default Register;
