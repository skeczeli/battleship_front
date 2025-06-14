import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "styles/register.css";

const Profile = () => {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

        const res = await fetch(`http://localhost:8080/api/users/${username}`, {
          headers
        });
        
        if (!res.ok) throw new Error("No se pudo cargar el perfil");
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

  const handleFollow = async () => {
    if (!currentUser) {
      alert("Inicia sesión para seguir a otros usuarios.");
      return;
    }

    const token = localStorage.getItem("token");
    console.log("Token encontrado:", token); // Debug
    
    if (!token) {
      console.error("No hay token en localStorage"); // Debug
      alert("Tu sesión ha expirado. Inicia sesión nuevamente.");
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = isFollowing ? "unfollow" : "follow";
      console.log("Enviando petición a:", `http://localhost:8080/api/follow/${endpoint}`); // Debug
      console.log("Con token:", `Bearer ${token}`); // Debug
      console.log("Para usuario:", username); // Debug
      
      const res = await fetch(`http://localhost:8080/api/follow/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
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
        alert("Error: " + errorData);
        return;
      }

      const responseText = await res.text();
      console.log("Respuesta exitosa:", responseText); // Debug

      // Actualizar estado local
      setIsFollowing(!isFollowing);
      
      // Actualizar contador en el perfil
      if (profile) {
        setProfile(prev => ({
          ...prev,
          followersCount: isFollowing 
            ? prev.followersCount - 1 
            : prev.followersCount + 1
        }));
      }

    } catch (error) {
      console.error("Error al procesar seguimiento:", error);
      alert("Error de conexión: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    const usernameInput = prompt("Escribí tu nombre de usuario:");
    const passwordInput = prompt("Escribí tu contraseña:");

    if (!usernameInput || !passwordInput) return;

    try {
      const res = await fetch("http://localhost:8080/api/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: usernameInput,
          password: passwordInput,
        }),
      });

      if (!res.ok) {
        const errorData = await res.text();
        alert(errorData || "No se pudo eliminar la cuenta.");
        return;
      }

      alert("Cuenta eliminada correctamente.");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      window.location.href = "/";
    } catch (error) {
      alert("Error al conectar con el servidor.");
      console.error(error);
    }
  };

  if (error) return (
    <div className="profile-container">
      <div className="error-state">
        <span className="error-icon">⚠️</span>
        <p>{error}</p>
      </div>
    </div>
  );
  
  if (!profile) return (
    <div className="profile-container">
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Cargando perfil...</p>
      </div>
    </div>
  );

  const isCurrentUser = currentUser && currentUser.username === profile.username;
  const totalGames = profile.wins + profile.losses;

  return (
    <div className="profile-container">
      <h2>Perfil de {profile.username}</h2>
      <p>
        <strong>Apodo:</strong> {profile.name || "Sin apodo"}
      </p>
      <p>
        <strong>Email:</strong> {profile.email}
      </p>
      <p>
        <strong>Partidas ganadas:</strong> {profile.wins}
      </p>
      <p>
        <strong>Partidas perdidas:</strong> {profile.losses}
      </p>
      <p>
        <strong>Total jugadas:</strong> {totalGames}
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
          <button className="form-button delete-button" onClick={handleDelete}>
            Eliminar cuenta
          </button>
        </>
      ) : (
        <button 
          className={`${isFollowing ? "following-button" : "follow-button"} ${isLoading ? "loading" : ""}`}
          onClick={handleFollow}
          disabled={isLoading}
        >
          {isLoading ? "..." : (isFollowing ? "Siguiendo" : "Seguir")}
        </button>
      )}
    </div>
  );
};

export default Profile;