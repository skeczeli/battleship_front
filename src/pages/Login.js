import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { setPlayerId } from "services/PlayerService";
import { useUser } from "contexts/UserContext";
import { GoogleLogin } from "@react-oauth/google";
import "styles/register.css";

function Login() {
  // CAMBIO: Usar la variable de entorno correcta
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

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

    console.log("Intentando login con API_BASE_URL:", API_BASE_URL); // Debug

    try {
      // CAMBIO: Usar la URL correcta con /api prefix
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      console.log("Response status:", response.status); // Debug
      console.log("Response ok:", response.ok); // Debug

      if (response.ok) {
        const user = await response.json();
        const authHeader = response.headers.get("Authorization");
        const token = authHeader?.replace("Bearer ", "");

        if (!token) {
          console.error("No se pudo extraer el token");
          setError("Authentication failed - no token received");
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
        console.error("Error response:", errorData); // Debug
        setError(errorData || "Authentication error");
      }
    } catch (err) {
      console.error("Error en login:", err);
      setError("Could not connect to server: " + err.message);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const idToken = credentialResponse.credential;

    try {
      const response = await fetch(`${API_BASE_URL}/api/google-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      if (response.ok) {
        const { user, token } = await response.json();
        login(user, token);
        setPlayerId(user.username, false);
        navigate("/");
      } else {
        const errorData = await response.text();
        setError(errorData || "Error en login con Google");
      }
    } catch (err) {
      console.error("Error en login con Google:", err);
      setError("No se pudo conectar al servidor: " + err.message);
    }
  };

 return (
    <>
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

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <p>O iniciá sesión con Google:</p>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Falló el login con Google")}
          />
        </div>
      </div>
    </>
  );
}

export default Login;