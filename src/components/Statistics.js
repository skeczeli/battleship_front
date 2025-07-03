import React, { useEffect, useState } from "react";

const Statistics = ({ username, profile }) => {
  useEffect(() => {
    console.log("Componente Statistics montado");
  }, []);

  const [gameHistory, setGameHistory] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchGameHistory();
  }, [username]);

  const fetchGameHistory = async () => {
    setLoadingGames(true);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      console.log("Iniciando fetch de historial de juegos para:", username);

      const res = await fetch(
        `http://localhost:8080/api/users/${username}/games`,
        {
          headers,
        }
      );

      console.log("Respuesta recibida:", res);
      if (!res.ok) throw new Error("Could not load game history");
      const data = await res.json();
      console.log("Historial de juegos recibido:", data);

      setGameHistory(data);
      console.log("Historial de juegos recibido:", data);
      data.forEach((game, i) => {
        console.log(
          `Juego ${i + 1}: sessionId = ${game.sessionId}, id = ${game.id}`
        );
      });
    } catch (err) {
      setError("Error cargando historial de juegos");
    } finally {
      setLoadingGames(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getGameStatus = (startTime, endTime) => {
    if (!endTime) return "Activa";
    return "Finalizada";
  };

  const goToGame = (game) => {
    if (!game.sessionId) return;
    const path =
      game.opponent === "BOT"
        ? `/play-mode/bots/game/${game.sessionId}`
        : `/play-mode/random/game/${game.sessionId}`;
    window.location.href = path;
  };

  const totalGames = profile.wins + profile.losses;
  const winRate =
    totalGames > 0 ? ((profile.wins / totalGames) * 100).toFixed(1) : 0;

  return (
    <div className="statistics-container">
      <h3>Estadísticas Generales</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{profile.wins}</div>
          <div className="stat-label">Victorias</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{profile.losses}</div>
          <div className="stat-label">Derrotas</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{totalGames}</div>
          <div className="stat-label">Total Jugadas</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{winRate}%</div>
          <div className="stat-label">Tasa de Victoria</div>
        </div>
      </div>

      <h3>Historial de Juegos</h3>
      {error && <div className="error-message">{error}</div>}

      {loadingGames ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando historial de juegos...</p>
        </div>
      ) : (
        <div className="game-history">
          {gameHistory.length === 0 ? (
            <p className="no-games">No hay juegos registrados</p>
          ) : (
            <div className="games-list">
              {gameHistory.map((game, index) => (
                <div key={game.sessionId || index} className="game-item">
                  <div className="game-info">
                    <div className="game-header">
                      <span className="game-id">Juego #{index + 1}</span>
                      <span
                        className={`game-status ${getGameStatus(
                          game.startTime,
                          game.endTime
                        ).toLowerCase()}`}
                      >
                        {getGameStatus(game.startTime, game.endTime)}
                      </span>
                    </div>
                    <div className="game-details">
                      <div className="game-time">
                        <span>
                          <strong>Inicio:</strong> {formatDate(game.startTime)}
                        </span>
                        <span>
                          <strong>Fin:</strong> {formatDate(game.endTime)}
                        </span>
                      </div>
                      {game.opponent && (
                        <div className="game-opponent">
                          <strong>Oponente:</strong> {game.opponent}
                        </div>
                      )}
                      {game.result && (
                        <div
                          className={`game-result ${game.result.toLowerCase()}`}
                        >
                          <strong>Resultado:</strong> {game.result}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    className="game-button"
                    onClick={() => goToGame(game)}
                    disabled={!game.sessionId}
                  >
                    Ver Juego
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Statistics;
