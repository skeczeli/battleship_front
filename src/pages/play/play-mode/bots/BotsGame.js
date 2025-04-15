import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Board from "components/Board";
import useBoard from "hooks/useBoard";
import useTurnSystem from "hooks/useTurnSystem"; // Importamos el nuevo hook

function BotsGame() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // Usamos el hook useBoard para el tablero del jugador (solo visualización)
  const playerBoardState = state?.playerBoard;
  const botBoardState = state?.botBoard;


  // Usamos otro hook useBoard para el tablero enemigo (para gestionar disparos)
  const { board: enemyBoard, handleShot } = useBoard(botBoardState);

  // Usamos el hook de sistema de turnos
  const { currentTurn, nextTurn } = useTurnSystem();

  // Estado para mensaje del juego
  const [gameMessage, setGameMessage] = useState(
    "Haz clic en el tablero enemigo para disparar"
  );

  // Si no se recibió la board del jugador, mostramos error
  if (!playerBoardState) {
    return (
      <div>
        <p>
          No se recibió la configuración del tablero. Por favor, vuelve a
          configurarlo.
        </p>
        <button onClick={() => navigate("/play-mode/bots/setup")}>
          Ir a Setup
        </button>
      </div>
    );
  }

  // Manejador para cuando el jugador dispara
  const handlePlayerShot = (row, col) => {
    // Verificar si es el turno del jugador
    if (currentTurn !== "player") {
      setGameMessage("No es tu turno para disparar.");
      return;
    }

    // Usamos la función handleShot de useBoard
    const shotResult = handleShot(row, col);

    // Si el disparo fue válido, actualizamos el mensaje
    if (shotResult) {
      const coordLabel = `${String.fromCharCode(65 + shotResult.col)}${
        shotResult.row + 1
      }`;
      let result;
      if (shotResult.result === "hit") {
        result = "¡Tocado!";
      } else if (shotResult.result === "miss") {
        result = "¡Agua!";
      }
      setGameMessage(
        `Has disparado a ${coordLabel}. Resultado: ${result}. Turno del enemigo.`
      );

      // Cambiamos al turno del enemigo
      nextTurn();
    }
  };

  // Manejador para cuando el enemigo dispara (simulado por un botón)
  const handleEnemyTurn = () => {
    // Verificar si es el turno del enemigo
    if (currentTurn !== "enemy") {
      setGameMessage("No es el turno del enemigo.");
      return;
    }

    // Simulamos un disparo del enemigo (esto lo expandirás luego con la IA)
    setGameMessage("El enemigo ha disparado. Tu turno.");

    // Cambiamos al turno del jugador
    nextTurn();
  };

  return (
    <div>
      <h3>Juego en modo Bots</h3>
      <div className="game-status">
        <p>{gameMessage}</p>
        <p>Turno actual: {currentTurn === "player" ? "Jugador" : "Enemigo"}</p>

        {/* Botón temporal para simular el turno del enemigo */}
        {currentTurn === "enemy" && (
          <button onClick={handleEnemyTurn}>Simular turno del enemigo</button>
        )}
      </div>
      <div
        className="boards-container"
        style={{ display: "flex", gap: "20px" }}
      >
        <div className="board-wrapper">
          <h4>Tu Tablero</h4>
          <Board
            board={playerBoardState}
            onCellClick={() => {}} // No se permite interacción con tu propio tablero
            highlightedCells={[]}
            onCellHover={() => {}}
            onBoardLeave={() => {}}
            isGameMode={true}
          />
        </div>
        <div className="board-wrapper">
          <h4>Tablero Enemigo</h4>
          <Board
            board={enemyBoard}
            onCellClick={handlePlayerShot}
            highlightedCells={[]}
            onCellHover={() => {}}
            onBoardLeave={() => {}}
            isGameMode={true}
          />
        </div>
      </div>
    </div>
  );
}

export default BotsGame;
