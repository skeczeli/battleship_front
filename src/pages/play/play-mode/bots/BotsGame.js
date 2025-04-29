import React, { useState, useEffect, useCallback } from "react";
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

  //Tablero del jugador (el bot dispara a este)
  const { board: playerBoard, handleShot: handlePlayerBoardShot } =
    useBoard(playerBoardState);

  //Tablero del bot (el jugador dispara a este)
  const { board: enemyBoard, handleShot: handleEnemyBoardShot } =
    useBoard(botBoardState);

  // Usamos el hook de sistema de turnos
  const { currentTurn, nextTurn } = useTurnSystem();

  // Estado para mensaje del juego
  const [gameMessage, setGameMessage] = useState(
    "Haz clic en el tablero enemigo para disparar"
  );

  // Estado para llevar la cuenta de barcos hundidos
  const [playerSunkShips, setPlayerSunkShips] = useState(0);
  const [enemySunkShips, setEnemySunkShips] = useState(0);

  // Estado para controlar fin del juego
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);

  // Verificar condición de victoria
  const checkVictoryCondition = useCallback(() => {
    if (playerSunkShips >= 5) return "player";
    if (enemySunkShips >= 5) return "enemy";
    return null;
  }, [playerSunkShips, enemySunkShips]);

  useEffect(() => {
    if (gameOver) return;

    const winner = checkVictoryCondition();
    if (!winner) return;

    setGameOver(true);
    setWinner(winner);

    if (winner === "player") {
      setGameMessage("¡Felicidades! Has ganado la partida.");
    } else {
      setGameMessage(
        "¡Has perdido la partida! El enemigo ha hundido todos tus barcos."
      );
    }

    const updateScore = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem("user"));
        if (!userData?.token) {
          console.error("Token no encontrado. Iniciá sesión nuevamente.");
          return;
        }

        const token = userData.token;

        const res = await fetch(
          "http://localhost:8080/api/users/update-score",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              score: 1,
              isWin: winner === "player",
            }),
            credentials: "include",
          }
        );

        if (!res.ok) {
          if (res.status === 401) {
            console.error("Autenticación fallida. Iniciá sesión nuevamente.");
          } else {
            console.error(`Error del servidor: ${res.status}`);
          }
        } else {
          console.log("Puntaje actualizado");
        }
      } catch (error) {
        console.error("Error al actualizar el puntaje:", error.message);
      }
    };

    updateScore();

    setTimeout(() => {
      navigate("/play");
    }, 3000);
  }, [checkVictoryCondition, gameOver, navigate]);

  // Lógica para cuando el turno cambia al bot
  useEffect(() => {
    if (currentTurn === "enemy") {
      setTimeout(() => {
        if (gameOver) return;
        // Genera coordenadas aleatorias para el disparo del bot
        let row, col;

        do {
          row = Math.floor(Math.random() * 10);
          col = Math.floor(Math.random() * 10);
        } while (
          playerBoard[row][col] === "hit" ||
          playerBoard[row][col] === "miss"
        );

        // usa handlePlayerBoardShot porque esta vinculado a la tabla del jugador (modifica esta)
        const shotResult = handlePlayerBoardShot(row, col);

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

          // Verificar barco hundido
          if (shotResult.message && shotResult.message.includes("hundido")) {
            setEnemySunkShips((prev) => {
              const newCount = prev + 1;
              setGameMessage(
                <span style={{ color: "red" }}>{"Barco hundido!"}</span>
              );
              return newCount;
            });
          } else {
            setGameMessage(
              <>
                El enemigo disparó a {coordLabel}. Resultado:{" "}
                <span style={{ color: "red" }}>{result}</span> Tu turno.
              </>
            );
          }

          // Cambiar al turno del jugador después del disparo
          if (!checkVictoryCondition()) {
            nextTurn();
          }
        }
      }, 500); // Espera 2 segundos antes de que el bot dispare
    }
  }, [
    currentTurn,
    nextTurn,
    handlePlayerBoardShot,
    playerBoard,
    checkVictoryCondition,
    gameOver,
  ]);

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

    // Usamos la función handleEnemyBoardShot para disparar al tablero enemigo
    const shotResult = handleEnemyBoardShot(row, col);

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

      // Verificar barco hundido
      if (shotResult.message && shotResult.message.includes("hundido")) {
        setPlayerSunkShips((prev) => {
          const newCount = prev + 1;
          setGameMessage(
            <span style={{ color: "red" }}>{"Barco hundido!"}</span>
          );
          return newCount;
        });
      } else {
        setGameMessage(
          <>
            Disparaste a {coordLabel}. Resultado:{" "}
            <span style={{ color: "red" }}>{result}</span>
          </>
        );
      }

      // Cambiamos al turno del enemigo
      if (!checkVictoryCondition()) {
        nextTurn();
      }
    }
  };

  return (
    <div>
      <h3>Juego en modo Bots</h3>
      <div className="game-status">
        <p>{gameMessage}</p>
        {!gameOver && (
          <p>
            Turno actual: {currentTurn === "player" ? "Jugador" : "Enemigo"}
          </p>
        )}
        <div className="score-container">
          <p>Barcos enemigos hundidos: {playerSunkShips}/5</p>{" "}
          {/* cambiar depende la cant de barcos */}
          <p>Tus barcos hundidos: {enemySunkShips}/5</p>{" "}
          {/* cambiar depende la cant de barcos */}
        </div>
        {gameOver && (
          <div className="game-over-message">
            <h4>{winner === "player" ? "¡Victoria!" : "¡Derrota!"}</h4>
            <p>Redirigiendo a seleccion de modos...</p>
          </div>
        )}
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
            onCellClick={handlePlayerShot} //usa handleplayershot que dentro esta handleEnemyBoardShot
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
