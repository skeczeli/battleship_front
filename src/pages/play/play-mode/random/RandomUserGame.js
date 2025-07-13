import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import GameBoard from "components/Board";
import { useUser } from "contexts/UserContext";
import "styles/game.css";
import "styles/enhanced-board.css";

function RandomUserGame() {
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

  const location = useLocation();
  const { gameId } = useParams();
  const { user, playerId, isReady } = useUser();
  const navigate = useNavigate();

  const [playerBoard, setPlayerBoard] = useState(
    location.state?.playerBoard || null
  );
  const [opponentBoard, setOpponentBoard] = useState(() => {
    const savedSize =
      location.state?.playerBoard?.length ||
      JSON.parse(sessionStorage.getItem("gameConfig") || "{}")?.boardSize ||
      10;
    return Array(savedSize)
      .fill()
      .map(() => Array(savedSize).fill(null));
  });

  const [sunkShips, setSunkShips] = useState({ player: [], opponent: [] });
  const [shotHistory, setShotHistory] = useState([]);
  const [lastShot, setLastShot] = useState(null);
  const [gameStatus, setGameStatus] = useState("Cargando partida...");
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState(null);
  const [gameConfig, setGameConfig] = useState(null);

  // Estados para el chat
  const [activeTab, setActiveTab] = useState("history"); // "history" o "chat"
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [opponentName] = useState("Oponente");

  const chatInputRef = useRef(null);
  const chatListRef = useRef(null);

  const { playerBoard: initialBoard } = location.state || {};
  const [initialBoardState, setInitialBoardState] = useState(initialBoard);

  const stompClient = useRef(null);
  const stompInitialized = useRef(false);

  const mapBoardToNames = (board) => {
    const shipIdToName = {
      1: "portaaviones",
      2: "acorazado",
      3: "submarino",
      4: "destructor",
      5: "lancha",
      6: "fragata",
      7: "superportaaviones",
    };
    return board.map((row) =>
      row.map((cell) => {
        if (cell === null) return null;
        if (cell === 0) return "miss";
        if (cell < 0) return "hit";
        return shipIdToName[cell] ?? null;
      })
    );
  };

  const handleGameEvent = useCallback(
    (data) => {
      switch (data.type) {
        case "GAME_START":
          setGameStarted(true);
          const isMyTurn = data.turn === playerId;
          setIsPlayerTurn(isMyTurn);
          setGameStatus(isMyTurn ? "Tu turno" : "Turno del oponente");
          resume();
          break;
        case "SHOT_RESULT":
          const isOwn = data.playerId === playerId;

          const shotData = {
            row: data.row,
            col: data.col,
            hit: data.hit,
            player: isOwn ? "player" : "opponent",
            message: data.shipSunk
              ? isOwn
                ? "¡Hundiste un barco!"
                : "¡El oponente hundió tu barco!"
              : undefined,
          };

          setShotHistory((prev) => [...prev, shotData]);
          setLastShot(shotData);

          if (isOwn) {
            setOpponentBoard((prev) =>
              prev.map((row, r) =>
                row.map((cell, c) =>
                  r === data.row && c === data.col ? data.hit : cell
                )
              )
            );
            if (data.shipSunk) {
              setSunkShips((prev) => ({
                ...prev,
                opponent: [...prev.opponent, "unknown"],
              }));
            }
          } else {
            setPlayerBoard((prev) =>
              prev.map((row, r) =>
                row.map((cell, c) =>
                  r === data.row && c === data.col ? data.hit : cell
                )
              )
            );
            if (data.shipSunk) {
              setSunkShips((prev) => ({
                ...prev,
                player: [...prev.player, "unknown"],
              }));
            }
          }

          if (data.gameOver) {
            setGameOver(true);
            setWinner(data.winner === playerId);
            setGameStatus(
              data.winner === playerId ? "¡Ganaste!" : "¡Perdiste!"
            );
          } else {
            setIsPlayerTurn(data.nextTurn === playerId);
            setGameStatus(
              data.nextTurn === playerId ? "Tu turno" : "Turno del oponente"
            );
          }
          break;
        case "CHAT_MESSAGE":
          // Nuevo: manejar mensajes de chat
          const chatMessage = {
            id: Date.now() + Math.random(),
            text: data.message,
            sender: data.senderId === playerId ? "me" : "opponent",
            senderName:
              data.senderId === playerId
                ? user?.username || "Tú"
                : opponentName,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
          setChatMessages((prev) => [...prev, chatMessage]);

          // Auto-scroll al final del chat
          setTimeout(() => {
            if (chatListRef.current) {
              chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
            }
          }, 100);
          break;
        case "GAME_ABANDONED":
          setGameStatus("El oponente abandonó la partida");
          setGameOver(true);
          setWinner(true);
          sessionStorage.removeItem("isFirstPlayer");
          sessionStorage.removeItem("joinedAlready");
          break;
        case "ERROR":
          setGameStatus("Error: " + data.message);
          break;
        default:
          break;
      }
    },
    [playerId, user, opponentName]
  );

  const resume = () => {
    console.log("🟢 Ejecutando resume()");
    fetch(`${API_BASE_URL}/api/game/resume/multiplayer/${gameId}/${playerId}`)
      .then((res) => {
        if (!res.ok && !res.status === "bad_request")
          throw new Error("No se encontró la partida");
        return res.json();
      })
      .then((data) => {
        console.log("📦 Datos de resume:", data);
        if (data.status === "WAITING_FOR_OPPONENT") {
          setGameStatus("Esperando a que el oponente se una...");
          return;
        }

        if (data.error !== undefined) {
          setGameStatus(data.error);
          navigate("/");
          return;
        }

        console.log("🔄 Estado reanudado:", data);
        setPlayerBoard(mapBoardToNames(data.playerBoard));
        setOpponentBoard(data.opponentBoard);
        setSunkShips(data.sunkShips);
        setShotHistory(data.shotHistory || []);
        setLastShot(data.lastShot || null);
        setChatMessages(data.chatMessages || []); // ← Restaurar mensajes de chat
        setGameConfig(data.gameConfig);
        setGameOver(data.gameOver);
        setWinner(data.winner === playerId);
        setIsPlayerTurn(data.turn === playerId && !data.gameOver);
        setGameStatus(
          data.gameOver
            ? data.winner === playerId
              ? "¡Ganaste!"
              : "¡Perdiste!"
            : data.turn === playerId
            ? "Tu turno"
            : "Turno del oponente"
        );
        setGameStarted(true);
      })
      .catch((err) => {
        console.error("❌ Error al reanudar la partida:", err);
        setGameStatus("Error al reanudar la partida. Empezá una nueva.");
        sessionStorage.removeItem("sessionId");
      });
  };

  useEffect(() => {
    if (!isReady || !gameId || !playerId || stompInitialized.current) return;
    stompInitialized.current = true;

    const socket = new SockJS(`${API_BASE_URL}/ws`);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      console.log("✅ Conectado al WebSocket");

      client.subscribe(`/topic/game/${gameId}`, (msg) => {
        const data = JSON.parse(msg.body);
        console.log("📩 Evento recibido:", data);
        handleGameEvent(data);
      });

      /*const savedConfig = JSON.parse(
        sessionStorage.getItem("gameConfig") || "null"
      );
      setGameConfig(savedConfig);*/
      const joinedAlready = sessionStorage.getItem("joinedAlready") === "true";

      if (
        !joinedAlready &&
        sessionStorage.getItem("isFirstPlayer") === "false" &&
        initialBoardState
      ) {
        console.log("Jugador 2 se une enviando su board:", initialBoardState);
        client.publish({
          destination: `/app/game/multiplayer/${gameId}/join`,
          body: JSON.stringify({ playerId, board: initialBoardState }),
        });

        sessionStorage.setItem("joinedAlready", "true");

        setTimeout(() => {
          setInitialBoardState(null);
          resume();
        }, 500);
      } else {
        resume();
      }
    };

    client.onStompError = (err) => {
      console.error("❌ Error STOMP:", err);
    };

    client.activate();
    stompClient.current = client;

    return () => {
      stompClient.current?.deactivate();
      stompClient.current = null;
      stompInitialized.current = false;
    };
  }, [isReady, gameId, playerId, handleGameEvent]);

  const handleCellClick = (row, col) => {
    if (!isPlayerTurn || gameOver || opponentBoard?.[row]?.[col] !== null)
      return;
    stompClient.current?.publish({
      destination: `/app/game/multiplayer/${gameId}/shot`,
      body: JSON.stringify({ row, col, playerId }),
    });
    setIsPlayerTurn(false);
    setGameStatus("Esperando respuesta...");
  };

  const handleExitGame = () => {
    if (!gameOver) {
      stompClient.current?.publish({
        destination: `/app/game/multiplayer/${gameId}/abandon`,
        body: JSON.stringify({ playerId }),
      });
    }

    // ⭐ NO desconectar WebSocket para mantener el chat activo
    // Solo limpiar session storage y navegar
    sessionStorage.removeItem("isFirstPlayer");
    sessionStorage.removeItem("joinedAlready");
    navigate("/");
  };

  // Función para enviar mensajes de chat
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !stompClient.current) return;

    stompClient.current.publish({
      destination: `/app/game/multiplayer/${gameId}/chat`,
      body: JSON.stringify({
        senderId: playerId,
        message: newMessage.trim(),
      }),
    });

    setNewMessage("");
  };

  const renderLastShot = () => {
    if (!lastShot) return null;

    const { row, col, hit, player, message } = lastShot;
    const isHit = hit === "hit";
    const resultText = isHit ? "¡Impacto!" : "Agua";
    const playerText =
      player === "player" ? "Tu disparo" : "Disparo del oponente";
    const position = `[${String.fromCharCode(65 + col)}${row + 1}]`;

    return (
      <div className="last-shot">
        <p>
          {playerText} en {position}:{" "}
          <span className={isHit ? "hit" : "miss"}>{resultText}</span>
        </p>
        {message && <p className="shot-message">{message}</p>}
      </div>
    );
  };

  const renderShotHistory = () => {
    if (!shotHistory || shotHistory.length === 0) {
      return (
        <div className="history-content">
          <div
            className="history-item"
            style={{
              textAlign: "center",
              color: "#64748b",
              fontStyle: "italic",
            }}
          >
            No hay disparos aún...
          </div>
        </div>
      );
    }

    const reversedHistory = [...shotHistory].reverse();

    return (
      <div className="history-content">
        {reversedHistory.map((shot, index) => {
          const isHit = shot.hit === "hit";
          const playerText = shot.player === "player" ? "Tú" : "Oponente";
          const position = `${String.fromCharCode(65 + shot.col)}${
            shot.row + 1
          }`;
          const originalIndex = shotHistory.length - index;

          return (
            <div
              key={`${shot.row}-${shot.col}-${shot.player}-${originalIndex}`}
              className="history-item"
            >
              <div style={{ fontWeight: "600", color: "#475569" }}>
                #{originalIndex} {playerText} → {position}
              </div>
              <span className={isHit ? "hit" : "miss"}>
                {isHit ? "IMPACTO" : "AGUA"}
              </span>
              {shot.message && (
                <div className="shot-message">{shot.message}</div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Nueva función para renderizar el chat
  const renderChat = () => {
    return (
      <div className="chat-content">
        <div className="chat-messages" ref={chatListRef}>
          {chatMessages.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: "#64748b",
                fontStyle: "italic",
                padding: "20px",
              }}
            >
              No hay mensajes aún...
            </div>
          ) : (
            chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message ${
                  msg.sender === "me" ? "my-message" : "opponent-message"
                }`}
              >
                <div className="message-header">
                  <span className="sender-name">{msg.senderName}</span>
                  <span className="message-time">{msg.timestamp}</span>
                </div>
                <div className="message-text">{msg.text}</div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSendMessage} className="chat-input-form">
          <input
            ref={chatInputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="chat-input"
            maxLength={200}
          />
          <button
            type="submit"
            className="chat-send-button"
            disabled={!newMessage.trim()}
          >
            Enviar
          </button>
        </form>
      </div>
    );
  };

  // Nueva función para renderizar el panel con pestañas
  const renderHistoryAndChat = () => {
    return (
      <div className="history-and-chat-panel">
        {/* Pestañas */}
        <div className="panel-tabs">
          <button
            className={`tab-button ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            📊 Historial
          </button>
          <button
            className={`tab-button ${activeTab === "chat" ? "active" : ""}`}
            onClick={() => setActiveTab("chat")}
          >
            💬 Chat
          </button>
        </div>

        {/* Contenido */}
        <div className="panel-content">
          {activeTab === "history" ? renderShotHistory() : renderChat()}
        </div>
      </div>
    );
  };

  const renderShipCounter = () => {
    if (!gameConfig) return null;
    const totalShips = gameConfig.totalShips;

    return (
      <div className="ship-counter">
        <div className="player-counter">
          <p>
            Tus barcos hundidos:{" "}
            <span className="counter">
              {sunkShips.player.length}/{totalShips}
            </span>
          </p>
        </div>
        <div className="opponent-counter">
          <p>
            Barcos enemigos hundidos:{" "}
            <span className="counter">
              {sunkShips.opponent.length}/{totalShips}
            </span>
          </p>
        </div>
      </div>
    );
  };

  if (!playerBoard || !opponentBoard || !gameStarted || !gameConfig) {
    return (
      <div className="game-container">
        <h2>{gameStatus}</h2>
      </div>
    );
  }

  return (
    <div className="game-container bots-setup-container">
      <h2>Modo Multijugador Aleatorio</h2>

      <div className="player-info">
        <p>
          Jugando como:{" "}
          <span className={user ? "auth-player" : "guest-player"}>
            {user?.username || "Invitado"}
          </span>
        </p>
      </div>

      <div className="game-status">
        <p className={gameOver ? (winner ? "win-status" : "lose-status") : ""}>
          {gameStatus}
        </p>
      </div>

      {renderShipCounter()}

      <div className="boards-container">
        <div className="board-section">
          <h3>Tu tablero</h3>
          <div className="board-wrapper">
            <GameBoard
              board={playerBoard}
              boardSize={gameConfig.boardSize}
              isPlayerBoard={true}
              onCellClick={() => {}}
              sunkShips={sunkShips.player}
              isGameMode={true}
              className="player-board"
            />
          </div>
        </div>

        <div className="board-section">
          <h3>Tablero del oponente</h3>
          <div className="board-wrapper">
            <GameBoard
              board={opponentBoard}
              boardSize={gameConfig.boardSize}
              isPlayerBoard={false}
              onCellClick={handleCellClick}
              isPlayerTurn={isPlayerTurn}
              sunkShips={sunkShips.opponent}
              isGameMode={true}
              className="opponent-board"
            />
          </div>
        </div>

        {/* Panel combinado de historial y chat */}
        <div className="board-section history-section">
          {renderHistoryAndChat()}
        </div>
      </div>

      {renderLastShot()}

      {gameOver ? (
        <div className="game-over">
          <h3>
            {winner ? "¡Felicidades! Has ganado! 🎉" : "Has perdido esta vez"}
          </h3>
          {winner && (
            <>
              <span className="share-label">Compartir resultado:</span>
              <div className="social-buttons">
                <button
                  className="social-button x-button"
                  onClick={() => {
                    const text = `¡${user?.username || "Un jugador"} ganó una partida de Battleship multijugador! 🚢🔥 ¿Podés ganarme?`;
                    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
                    window.open(tweetUrl, "_blank");
                  }}
                  title="Compartir en X"
                />

                <button
                  className="social-button whatsapp-button"
                  onClick={() => {
                    const text = `¡${user?.username || "Un jugador"} ganó una partida de Battleship multijugador! 🚢🔥 ¿Te animás a intentarlo?`;
                    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
                    window.open(whatsappUrl, "_blank");
                  }}
                  title="Compartir por WhatsApp"
                />
              </div>
            </>
          )}

          <button onClick={handleExitGame} className="exit-button">
            Salir
          </button>
        </div>
      ) : (
        <button onClick={handleExitGame} className="exit-button">
          Abandonar juego
        </button>
      )}

    </div>
  );
}

export default RandomUserGame;
