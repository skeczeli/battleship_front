import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Board from "components/Board";
import useBoard from "hooks/useBoard";
import useTurnSystem from "hooks/useTurnSystem";

function BotsGame() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // Usamos el hook useBoard para el tablero del jugador (solo visualización)
  const playerBoardState = state?.playerBoard;
  const botBoardState = state?.botBoard;

  //-----------------
  // Creamos dos instancias separadas del hook useBoard:
  // 1. Una para el tablero del jugador (que el bot disparará)
  const { board: playerBoard, handleShot: handlePlayerBoardShot } = useBoard(playerBoardState);
  
  // 2. Otra para el tablero del bot (que el jugador disparará)
  const { board: enemyBoard, handleShot: handleEnemyBoardShot } = useBoard(botBoardState);
  //-----------------

  // Usamos el hook de sistema de turnos
  const { currentTurn, nextTurn } = useTurnSystem();

  // Estado para mensaje del juego
  const [gameMessage, setGameMessage] = useState(
    "Haz clic en el tablero enemigo para disparar"
  );

  // Lógica para cuando el turno cambia al bot (enemigo)
  useEffect(() => {
    if (currentTurn === "enemy") {
      // El bot dispara después de un retraso de 2 segundos
      setTimeout(() => {
        // Genera coordenadas aleatorias para el disparo del bot
        let row, col;
  
        //-----------------
        // Buscar una celda vacía aleatoria en el tablero del JUGADOR
        do {
          row = Math.floor(Math.random() * 10);
          col = Math.floor(Math.random() * 10);
        } while (playerBoard[row][col] === "hit" || playerBoard[row][col] === "miss");
  
        // El bot dispara al tablero del JUGADOR usando handlePlayerBoardShot
        const shotResult = handlePlayerBoardShot(row, col);
        //-----------------
  
        // Si el disparo fue válido, actualizamos el mensaje
        if (shotResult) {
          const coordLabel = `${String.fromCharCode(65 + shotResult.col)}${
            shotResult.row + 1
          }`;
          let result;
          if (shotResult.result === "hit") {
            result = "¡El enemigo acertó!";
          } else if (shotResult.result === "miss") {
            result = "El disparo del enemigo falló.";
          }
          setGameMessage(
            `El enemigo disparó a ${coordLabel}. Resultado: ${result}. Tu turno.`
          );
  
          // Cambiar al turno del jugador después del disparo
          nextTurn();
        }
      }, 2000); // Espera 2 segundos antes de que el bot dispare
    }
  }, [currentTurn, nextTurn, handlePlayerBoardShot, playerBoard]);

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

    //-----------------
    // Usamos la función handleEnemyBoardShot para disparar al tablero enemigo
    const shotResult = handleEnemyBoardShot(row, col);
    //-----------------

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

  return (
    <div>
      <h3>Juego en modo Bots</h3>
      <div className="game-status">
        <p>{gameMessage}</p>
        <p>Turno actual: {currentTurn === "player" ? "Jugador" : "Enemigo"}</p>
      </div>
      <div
        className="boards-container"
        style={{ display: "flex", gap: "20px" }}
      >
        <div className="board-wrapper">
          <h4>Tu Tablero</h4>
          <Board
            board={playerBoard}
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