import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Statistics from "../components/Statistics";
import "styles/register.css";
import "styles/statistics.css";

const Profile = () => {
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("general");
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deleteUsername, setDeleteUsername] = useState("");
  const [deletePassword, setDeletePassword] = useState("");

  const getCategoryInfo = (points) => {
    if (points >= 1000) return { name: "Diamante" };
    if (points >= 700) return { name: "Platino" };
    if (points >= 400) return { name: "Oro" };
    if (points >= 100) return { name: "Plata" };
    return { name: "Bronce" };
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) setCurrentUser(storedUser);

    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = {
          "Content-Type": "application/json",
        };

        // Incluir token si existe para obtener información de seguimiento
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_BASE_URL}/api/users/${username}`, {
          headers,
        });

        if (!res.ok) throw new Error("Could not load profile");
        const data = await res.json();
        setProfile(data);

        // El backend ya nos dice si seguimos a este usuario
        if (data.isFollowing !== null) {
          setIsFollowing(data.isFollowing);
        }
      } catch (err) {
        setError("Error al cargar el perfil");
      }
    };

    fetchProfile();
  }, [username]);

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

  const handleFollow = async () => {
    if (!currentUser) {
      setSuccess("");
      setError("Inicia sesión para seguir a otros usuarios.");
      return;
    }

    const token = localStorage.getItem("token");
    console.log("Token encontrado:", token); // Debug

    if (!token) {
      console.error("No hay token en localStorage"); // Debug
      setSuccess("");
      setError("Tu sesión ha expirado. Inicia sesión nuevamente.");
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isFollowing ? "unfollow" : "follow";
      console.log(
        "Enviando petición a:",
        `${API_BASE_URL}/api/follow/${endpoint}`
      ); // Debug
      console.log("Con token:", `Bearer ${token}`); // Debug
      console.log("Para usuario:", username); // Debug

      const res = await fetch(`${API_BASE_URL}/api/follow/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          usernameToFollow: username,
        }),
      });

      console.log("Respuesta status:", res.status); // Debug
      console.log("Respuesta ok:", res.ok); // Debug

      if (!res.ok) {
        const errorData = await res.text();
        console.error("Error del servidor:", errorData); // Debug
        setSuccess("");
        setError("Error: " + errorData);
        return;
      }

      const responseText = await res.text();
      console.log("Respuesta exitosa:", responseText); // Debug

      // Actualizar estado local
      setIsFollowing(!isFollowing);

      // Actualizar contador en el perfil
      if (profile) {
        setProfile((prev) => ({
          ...prev,
          followersCount: isFollowing
            ? prev.followersCount - 1
            : prev.followersCount + 1,
        }));
      }
    } catch (error) {
      console.error("Error al procesar seguimiento:", error);
      setSuccess("");
      setError("Error de conexión: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUsername || !deletePassword) {
      setSuccess("");
      setError("Completá tu nombre de usuario y contraseña.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/delete-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: deleteUsername,
          password: deletePassword,
        }),
      });

      if (!res.ok) {
        const errorData = await res.text();
        setSuccess("");
        setError(errorData || "No se pudo eliminar la cuenta.");
        return;
      }

      sessionStorage.setItem("deleteSuccess", "Cuenta eliminada correctamente.");
      
      // Limpiar TODA la información de sesión
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("playerId");
      localStorage.removeItem("sessionId");
      localStorage.removeItem("gameConfig");
      localStorage.removeItem("isFirstPlayer");
      localStorage.removeItem("joinedAlready");
      
      // Limpiar también sessionStorage (excepto nuestro mensaje)
      const deleteMessage = sessionStorage.getItem("deleteSuccess");
      sessionStorage.clear();
      sessionStorage.setItem("deleteSuccess", deleteMessage);
      
      // Forzar recarga completa de la página para reset total
      window.location.href = "/";
      
    } catch (error) {
      setSuccess("");
      setError("Error al conectar con el servidor.");
      console.error(error);
    }
  };

  if (!profile)
    return (
      <div className="profile-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );

  const isCurrentUser =
    currentUser && currentUser.username === profile.username;

  return (
    <>
      {/* Mensajes flotantes hermosos */}
      {error && <div className="floating-message error-floating">{error}</div>}
      {success && (
        <div className="floating-message success-floating">{success}</div>
      )}

      <div className="profile-container">
        <h2>Perfil de {profile.username}</h2>

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            className={`tab-button ${activeTab === "general" ? "active" : ""}`}
            onClick={() => setActiveTab("general")}
          >
            General
          </button>
          <button
            className={`tab-button ${
              activeTab === "estadisticas" ? "active" : ""
            }`}
            onClick={() => {
              console.log("activeTab es:", activeTab);
              setActiveTab("estadisticas");
            }}
          >
            Estadísticas
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === "general" && (
            <div className="general-tab">
              <p>
                <strong>Apodo:</strong> {profile.name || "Sin apodo"}
              </p>
              <p>
                <strong>Email:</strong> {profile.email}
              </p>
              <p>
                <strong>Nivel:</strong>{" "}
                {getCategoryInfo(10 * profile.wins - 10 * profile.losses).name}
              </p>

              {/* Mostrar estadísticas de seguimiento si están disponibles */}
              {profile.followersCount !== undefined && (
                <>
                  <p>
                    <strong>Seguidores:</strong> {profile.followersCount}
                  </p>
                  <p>
                    <strong>Siguiendo:</strong> {profile.followingCount}
                  </p>
                </>
              )}

              {isCurrentUser ? (
                <>
                  <button
                    className="form-button"
                    onClick={() => (window.location.href = "/editprofile")}
                  >
                    Editar perfil
                  </button>
                  {showDeleteForm ? (
                    <div className="delete-form">
                      <p>Confirmá tu identidad para eliminar la cuenta:</p>
                      <input
                        type="text"
                        placeholder="Usuario"
                        value={deleteUsername}
                        onChange={(e) => setDeleteUsername(e.target.value)}
                      />
                      <input
                        type="password"
                        placeholder="Contraseña"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                      />
                      <button
                        className="confirm-delete-button"
                        onClick={handleDelete}
                      >
                        Confirmar eliminación
                      </button>
                      <button
                        className="form-button"
                        onClick={() => setShowDeleteForm(false)}
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      className="form-button delete-button"
                      onClick={() => setShowDeleteForm(true)}
                    >
                      Eliminar cuenta
                    </button>
                  )}
                </>
              ) : (
                <button
                  className={`${
                    isFollowing ? "following-button" : "follow-button"
                  } ${isLoading ? "loading" : ""}`}
                  onClick={handleFollow}
                  disabled={isLoading}
                >
                  {isLoading ? "..." : isFollowing ? "Siguiendo" : "Seguir"}
                </button>
              )}
            </div>
          )}

          {activeTab === "estadisticas" && (
            <Statistics username={username} profile={profile} />
          )}
        </div>
      </div>
    </>
  );
};

export default Profile;