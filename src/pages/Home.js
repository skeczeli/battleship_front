// src/pages/Home.js
import React, { useEffect, useState } from 'react';
import Button from "../components/Button";
import "../styles/main.css";

function Home() {
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    // Verificar si hay mensaje de éxito en sessionStorage al cargar
    const deleteSuccess = sessionStorage.getItem("deleteSuccess");
    if (deleteSuccess) {
      setSuccessMessage(deleteSuccess);
      // Limpiar el mensaje del sessionStorage
      sessionStorage.removeItem("deleteSuccess");
      
      // Auto-ocultar después de 4 segundos
      setTimeout(() => {
        setSuccessMessage("");
      }, 4000);
    }
  }, []);

  return (
    <div>
      {/* Mensaje de éxito flotante */}
      {successMessage && (
        <div className="floating-message success-floating">
          {successMessage}
        </div>
      )}
      
      <div className="container">
        <h1>Battleship</h1>
        <div className="middle-buttons">
          <Button to="/play">Jugar</Button>
          <Button to="/ranking">Ranking</Button>
          <Button to="/rules">Reglas</Button>
        </div>
      </div>
    </div>
  );
}

export default Home;