// src/components/ProfilePage.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../styles/register.css";

const ProfilePage = () => {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) setCurrentUser(storedUser);

    // Obtener datos del perfil
    const fetchProfile = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/users/${username}`);
        if (!res.ok) throw new Error("No se pudo cargar el perfil");
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        setError("Error al cargar el perfil");
      }
    };

    fetchProfile();
  }, [username]);

  const handleFollow = async () => {
    // lógica para seguir usuario
    alert("Ahora estás siguiendo a este usuario.");
  };

  const handleDelete = async () => {
    const usernameInput = prompt("Escribí tu nombre de usuario:");
    const passwordInput = prompt("Escribí tu contraseña:");
  
    if (!usernameInput || !passwordInput) return;
  
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
  
    const result = await res.json();
  
    if (result.success) {
      alert("Cuenta eliminada correctamente.");
      localStorage.removeItem("user");
      window.location.href = "/";
    } else {
      alert(result.message || "No se pudo eliminar la cuenta.");
    }
  };

  if (error) return <p>{error}</p>;
  if (!profile) return <p>Cargando perfil...</p>;

  const isCurrentUser =
    currentUser && currentUser.username === profile.username;
  const totalGames = profile.wins + profile.losses;

  return (
    <div className="profile-container">
      <h2>Perfil de {profile.username}</h2>
      <p>
        <strong>Apodo:</strong> {profile.name || "Sin apodo"}
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

      {isCurrentUser ? (
        <><button onClick={() => (window.location.href = "/editprofile")}>
          Editar perfil
        </button>
        <button onClick={handleDelete}>Eliminar cuenta</button></>
      ) : (
        <button onClick={handleFollow}>Seguir</button>
      )}
    </div>
  );
};

export default ProfilePage;
