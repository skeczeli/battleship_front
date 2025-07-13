import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

const Statistics = ({ username, profile }) => {
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";
  const { user } = useUser();
  const [gameHistory, setGameHistory] = useState([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchGameHistory = useCallback(async () => {
    setLoadingGames(true);
    try {
      const headers = { "Content-Type": "application/json" };
      if (user?.token) headers["Authorization"] = `Bearer ${user.token}`;

      const res = await fetch(`${API_BASE_URL}/api/users/${username}/games`, {
        headers,
      });
      if (!res.ok) throw new Error("Could not load game history");
      const data = await res.json();
      setGameHistory(data);
    } catch (err) {
      setError("Error cargando historial de juegos");
    } finally {
      setLoadingGames(false);
    }
  }, [username, user]);

  useEffect(() => {
    fetchGameHistory();
  }, [fetchGameHistory]);

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

  const getGameStatus = (start, end) => (!end ? "Activa" : "Finalizada");

  const goToGame = (game) => {
    if (!game.sessionId) return;
    const path =
      game.opponent === "BOT"
        ? `/play-mode/bots/game/${game.sessionId}`
        : `/play-mode/random/game/${game.sessionId}`;
    navigate(path);
  };

  const canViewGame = (game) =>
    user && user.username === username && game.sessionId;

  const totalGames = gameHistory.filter(
    (g) => g.result && g.status === "Finalizada"
  ).length;
  const winRate =
    totalGames > 0 ? ((profile.wins / totalGames) * 100).toFixed(1) : 0;
  const gameCompletionRate =
    gameHistory.length > 0
      ? ((totalGames / gameHistory.length) * 100).toFixed(1)
      : 0;
  const realOpponentCount = gameHistory.filter(
    (g) => g.opponent && g.opponent !== "BOT"
  ).length;
  const realOpponentRate =
    gameHistory.length > 0
      ? ((realOpponentCount / gameHistory.length) * 100).toFixed(1)
      : 0;
  const gameAverageTime =
    gameHistory.reduce((total, g) => {
      if (g.startTime && g.endTime) {
        return total + (new Date(g.endTime) - new Date(g.startTime));
      }
      return total;
    }, 0) / gameHistory.length;

  const formatted =
    gameAverageTime && !isNaN(gameAverageTime)
      ? `${Math.floor(gameAverageTime / 60000)}:${Math.round(
          (gameAverageTime % 60000) / 1000
        )
          .toString()
          .padStart(2, "0")}`
      : "N/A";

  const boardSizesCount = gameHistory.reduce((acc, g) => {
    if (g.boardSize) acc[g.boardSize] = (acc[g.boardSize] || 0) + 1;
    return acc;
  }, {});
  const mostCommonBoardSize = Object.entries(boardSizesCount).reduce(
    (a, b) => (a[1] > b[1] ? a : b),
    [null, 0]
  )[0];

  return (
    <div className="statistics-container">
      <h3>Estadísticas Generales</h3>
      <h4>Resultados de juego</h4>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{totalGames}</div>
          <div className="stat-label">Partidas Completadas</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{gameHistory.length}</div>
          <div className="stat-label">Partidas Totales</div>
        </div>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{profile.wins}</div>
          <div className="stat-label">Victorias</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{profile.losses}</div>
          <div className="stat-label">Derrotas</div>
        </div>
      </div>
      <h4>Tasas de juego</h4>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{winRate}%</div>
          <div className="stat-label">Victorias</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{gameCompletionRate}%</div>
          <div className="stat-label">Juegos completados</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{realOpponentRate}%</div>
          <div className="stat-label">Juegos con oponentes reales</div>
        </div>
      </div>
      <h4>Promedios de juego</h4>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{formatted}</div>
          <div className="stat-label">Tiempo promedio por juego</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{mostCommonBoardSize || "N/A"}</div>
          <div className="stat-label">Tamaño de tablero más común</div>
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
                  {canViewGame(game) && (
                    <button
                      className="game-button"
                      onClick={() => goToGame(game)}
                    >
                      Ver Juego
                    </button>
                  )}
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
