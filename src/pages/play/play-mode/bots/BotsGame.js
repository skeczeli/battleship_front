import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Board from "components/Board";
import useTurnSystem from "hooks/useTurnSystem";

function BotsGame() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // Estado para almacenar el ID de sesión del juego
  const [sessionId, setSessionId] = useState(null);
  // Estado para el tablero del jugador
  const [playerBoard, setPlayerBoard] = useState(Array.from({ length: 10 }, () => Array(10).fill(null)));
  // Estado para el tablero del bot
  const [enemyBoard, setEnemyBoard] = useState(Array.from({ length: 10 }, () => Array(10).fill(null)));
  // Estado para indicar si el juego ha terminado
  const [gameOver, setGameOver] = useState(false);
  // Estado para indicar quién ha ganado
  const [winner, setWinner] = useState(null);
  // Estado para mensajes del juego
  const [gameMessage, setGameMessage] = useState("Iniciando juego...");
  // Estado para controlar el turno
  const { currentTurn, nextTurn, setCurrentTurn } = useTurnSystem();
  // Estado para indicar si se está cargando una acción
  const [loading, setLoading] = useState(false);

  // API base URL - Ahora usamos el nuevo GameController
  const API_BASE_URL = "/api/game"; 

  // Efecto para inicializar el juego cuando se carga el componente
  useEffect(() => {
    if (state?.board) {
      setPlayerBoard(state.board);
      initializeGame(state.board);
    } else {
      console.warn("No board data found in state. Using default empty board.");
    }
  }, [state]);

  // Función para inicializar el juego con el backend
  const initializeGame = async (playerBoardData) => {
    try {
      setLoading(true);
      
      // Inicializar el tablero enemigo (vacío inicialmente)
      const emptyEnemyBoard = Array.from({ length: 10 }, () => Array(10).fill(null));
      setEnemyBoard(emptyEnemyBoard);
      
      // Convertir el formato del tablero si es necesario (por ejemplo, de strings a integers)
      const formattedBoard = playerBoardData.map(row => 
        row.map(cell => cell === null ? null : parseInt(cell))
      );

      // Iniciar el juego en el backend usando el nuevo endpoint
      const response = await fetch(`${API_BASE_URL}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ board: formattedBoard })
      });
      
      // Verificar si la respuesta es correcta
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const gameInfo = await response.json();
      // Guardar el sessionId que viene del backend
      setSessionId(gameInfo.sessionId);
      
      // Establecer el turno inicial
      setCurrentTurn("player");
      setGameMessage("¡Juego iniciado! Tu turno para disparar.");
      
      console.log("Juego inicializado con éxito. SessionID:", gameInfo.sessionId);
    } catch (error) {
      console.error("Error al inicializar el juego:", error);
      setGameMessage("Error al inicializar el juego. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Función para verificar si todos los barcos enemigos han sido hundidos
  const checkAllShipsHit = (board) => {
    // Contar el número de celdas "hit" y "sunk"
    let hitCount = 0;
    board.forEach(row => {
      row.forEach(cell => {
        if (cell === "hit" || cell === "sunk") {
          hitCount++;
        }
      });
    });
    
    // En un tablero real, deberíamos verificar contra el número total de celdas de barcos
    // Por ahora usamos una aproximación: 5+4+3+3+2 = 17 celdas de barcos
    return hitCount >= 17;
  };

  // Función para verificar si todos los barcos del jugador han sido hundidos
  const checkAllPlayerShipsHit = (board) => {
    let shipCells = 0;
    let hitShipCells = 0;
    
    board.forEach(row => {
      row.forEach(cell => {
        // Si la celda tiene un barco (número > 0) o ha sido tocada
        if (cell !== null && cell !== "miss") {
          shipCells++;
          if (cell === "hit" || cell === "sunk") {
            hitShipCells++;
          }
        }
      });
    });
    
    return shipCells > 0 && hitShipCells === shipCells;
  };

  // Función para manejar el disparo del jugador
  const handlePlayerShot = async (row, col) => {
    // Verificar si es el turno del jugador y el juego está activo
    if (currentTurn !== "player" || gameOver || loading) {
      return;
    }
    
    // Verificar si ya se disparó a esa celda
    if (enemyBoard[row][col] === "hit" || enemyBoard[row][col] === "miss") {
      setGameMessage("Ya has disparado en esa posición. Elige otra.");
      return;
    }
    
    try {
      setLoading(true);
      console.log(`Disparando a [${row},${col}]...`);
      
      // Enviar el disparo al backend usando fetch con el nuevo endpoint
      const shotData = { row, col };
      const response = await fetch(`${API_BASE_URL}/shot?sessionId=${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(shotData)
      });
      
      // Verificar si la respuesta es correcta
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Resultado del disparo:", result);
      
      // Extraer los resultados del jugador y el bot
      const playerShotResult = result.playerShot;
      
      // Actualizar el tablero enemigo con el resultado del disparo del jugador
      const newEnemyBoard = [...enemyBoard.map(boardRow => [...boardRow])];
      newEnemyBoard[playerShotResult.row][playerShotResult.col] = playerShotResult.result;
      setEnemyBoard(newEnemyBoard);
      
      // Actualizar mensaje según resultado
      let message = "";
      if (playerShotResult.result === "hit") {
        message = "¡Tocado! Has impactado un barco enemigo.";
      } else if (playerShotResult.result === "miss") {
        message = "¡Agua! No has impactado ningún barco.";
      } else if (playerShotResult.result === "sunk") {
        message = "¡Hundido! Has destruido un barco enemigo.";
      }
      
      // Verificar si el jugador ha ganado
      if (result.gameStatus?.winner === "player") {
        setGameOver(true);
        setWinner("player");
        setGameMessage(`${message} ¡Has ganado la partida!`);
        return;
      }
      
      // Procesar el disparo del bot si existe
      if (result.botShot) {
        // Procesar turno del bot automáticamente
        await processBotShot(result.botShot);
      } else {
        // Si no hay disparo del bot, cambiar al turno del bot y esperar
        setGameMessage(`${message} Turno del enemigo...`);
        nextTurn();
        
        // Simular el turno del bot después de un pequeño delay
        setTimeout(() => {
          handleBotTurn();
        }, 1000);
      }
      
    } catch (error) {
      console.error("Error al procesar el disparo:", error);
      setGameMessage("Error al procesar el disparo. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Procesar el resultado del disparo del bot
  const processBotShot = async (shotResult) => {
    // Actualizar el tablero del jugador con el resultado
    const newPlayerBoard = [...playerBoard.map(boardRow => [...boardRow])];
    const row = shotResult.row;
    const col = shotResult.col;
    
    // Marcar la celda según el resultado del disparo
    if (shotResult.result === "hit" || shotResult.result === "sunk") {
      newPlayerBoard[row][col] = "hit";
    } else {
      newPlayerBoard[row][col] = "miss";
    }
    
    setPlayerBoard(newPlayerBoard);
    
    // Actualizar mensaje según resultado
    let message = "";
    const coordLabel = `${String.fromCharCode(65 + col)}${row + 1}`;
    
    if (shotResult.result === "hit") {
      message = `El enemigo ha disparado a ${coordLabel} y ha impactado uno de tus barcos!`;
    } else if (shotResult.result === "miss") {
      message = `El enemigo ha disparado a ${coordLabel} y ha fallado.`;
    } else if (shotResult.result === "sunk") {
      message = `El enemigo ha disparado a ${coordLabel} y ha hundido uno de tus barcos!`;
    }
    
    // Verificar si el bot ha ganado
    const allShipsHit = checkAllPlayerShipsHit(newPlayerBoard);
    if (allShipsHit) {
      setGameOver(true);
      setWinner("bot");
      setGameMessage(`${message} Has perdido la partida.`);
      return;
    }
    
    // Cambiar al turno del jugador
    setGameMessage(`${message} Tu turno.`);
    setCurrentTurn("player");
  };

  // Función para manejar el turno del bot
  const handleBotTurn = async () => {
    if (currentTurn !== "enemy" || gameOver) {
      return;
    }
    
    try {
      setLoading(true);
      console.log("Procesando turno del bot...");
      
      // Solicitar turno del bot al backend
      const response = await fetch(`${API_BASE_URL}/bot-turn?sessionId=${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Verificar si la respuesta es correcta
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const shotResult = await response.json();
      console.log("Disparo del bot:", shotResult);
      
      // Procesar el resultado del disparo del bot
      await processBotShot(shotResult);
      
    } catch (error) {
      console.error("Error en el turno del bot:", error);
      setGameMessage("Error en el turno del bot. Inténtalo de nuevo.");
      nextTurn(); // Devolver el turno al jugador en caso de error
    } finally {
      setLoading(false);
    }
  };
  
  // Función para reiniciar el juego
  const resetGame = async () => {
    try {
      setLoading(true);
      console.log("Reiniciando juego...");
      
      // Reiniciar el juego en el backend
      if (sessionId) {
        await fetch(`${API_BASE_URL}/reset?sessionId=${sessionId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      // Navegar de vuelta a la configuración
      navigate("/play-mode/bots/setup");
      
    } catch (error) {
      console.error("Error al reiniciar el juego:", error);
    } finally {
      setLoading(false);
    }
  };

  // Si no se recibió el tablero configurado en el state, mostramos mensaje de error
  if (!state?.board) {
    return (
      <div className="error-container">
        <p>No se recibió la configuración del tablero. Por favor, vuelve a configurarlo.</p>
        <button 
          className="setup-button" 
          onClick={() => navigate("/play-mode/bots/setup")}
          disabled={loading}
        >
          Ir a Setup
        </button>
      </div>
    );
  }

  return (
    <div className="bots-game-container">
      <h3>Juego contra Bot</h3>
      
      {/* Mensaje de estado del juego */}
      <div className="game-status">
        <p className="status-message">{gameMessage}</p>
        <p className="turn-info">
          Turno actual: {currentTurn === "player" ? "Jugador" : "Enemigo"}
        </p>
        
        {/* Botón para simular turno del enemigo (solo para debug) */}
        {process.env.NODE_ENV === 'development' && currentTurn === "enemy" && (
          <button 
            onClick={handleBotTurn} 
            disabled={loading || gameOver}
            className="debug-button"
          >
            Forzar turno del enemigo
          </button>
        )}
      </div>
      
      {/* Contenedor de tableros */}
      <div className="boards-container">
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
            onCellClick={(row, col) => handlePlayerShot(row, col)}
            highlightedCells={[]}
            onCellHover={() => {}}
            onBoardLeave={() => {}}
            isGameMode={true}
            disabled={currentTurn !== "player" || gameOver || loading}
          />
        </div>
      </div>
      
      {/* Controles del juego */}
      <div className="game-controls">
        {gameOver && (
          <div className="game-over-message">
            <h3>{winner === "player" ? "¡Has ganado!" : "Has perdido"}</h3>
            <button 
              onClick={resetGame}
              disabled={loading}
              className="reset-button"
            >
              Jugar de nuevo
            </button>
          </div>
        )}
        
        {!gameOver && (
          <button 
            onClick={resetGame}
            disabled={loading}
            className="reset-button"
          >
            Reiniciar juego
          </button>
        )}
      </div>
    </div>
  );
}

export default BotsGame;