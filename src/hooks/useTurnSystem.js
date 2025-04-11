// hooks/useTurnSystem.js
import { useState, useCallback } from "react";

const useTurnSystem = () => {
  // Estado para controlar los turnos
  const [currentTurn, setCurrentTurn] = useState("player"); // "player" o "enemy"

  // Función para cambiar al siguiente turno
  const nextTurn = useCallback(() => {
    setCurrentTurn(currentTurn === "player" ? "enemy" : "player");
  }, [currentTurn]);

  return {
    currentTurn,
    nextTurn,
  };
};

export default useTurnSystem;
