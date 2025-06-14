import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "styles/ranking.css";

const FriendsRanking = () => {
  const [rankingData, setRankingData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const itemsPerPage = 10;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = rankingData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(rankingData.length / itemsPerPage);

  const getCategoryInfo = (points) => {
    if (points >= 1000) return { name: "Diamante" };
    if (points >= 700) return { name: "Platino" };
    if (points >= 400) return { name: "Oro" };
    if (points >= 100) return { name: "Plata" };
    return { name: "Bronce" };
  };

  useEffect(() => {
    const fetchFriendsRanking = async () => {
      try {
        const token = localStorage.getItem("token");
        
        if (!token) {
          setError("Debes iniciar sesión para ver el ranking de amigos");
          setLoading(false);
          return;
        }

        const response = await fetch("http://localhost:8080/api/follow/friends-ranking", {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError("Tu sesión ha expirado. Inicia sesión nuevamente.");
          } else {
            setError("Error al cargar el ranking de amigos");
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setRankingData(data);
        setError("");
      } catch (error) {
        console.error("Error al obtener el ranking de amigos:", error);
        setError("Error de conexión");
      } finally {
        setLoading(false);
      }
    };

    fetchFriendsRanking();
  }, []);

  if (loading) {
    return (
      <div className="table-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando ranking de amigos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ranking-card">
        <div className="empty-state">
          <span className="empty-icon">⚠️</span>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (rankingData.length === 0) {
    return (
      <div className="ranking-card">
        <div className="empty-state">
          <span className="empty-icon">👥</span>
          <h3>Sin amigos en el ranking</h3>
          <p>Sigue a otros jugadores para ver su ranking aquí</p>
          <Link to="/ranking" className="form-button" style={{marginTop: "1rem"}}>
            Ver ranking global
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="table-container">
        <table className="ranking-table">
          <thead>
            <tr>
              <th>Posición</th>
              <th>Jugador</th>
              <th>Puntos</th>
              <th>Categoría</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((player) => {
              const category = getCategoryInfo(player.score);
              const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
              const isCurrentUser = currentUser.username === player.username;
              
              return (
                <tr key={player.username}>
                  <td>
                    <div
                      className={`rank-badge ${
                        player.rank <= 3 ? "top-rank" : ""
                      }`}
                    >
                      {player.rank}
                      {isCurrentUser && (
                        <span className="you-badge">Tú</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="player-name">
                      <Link to={`/profile/${player.username}`}>
                        {player.username}
                        {isCurrentUser && <span className="you-text"> (Tú)</span>}
                      </Link>
                    </div>
                  </td>
                  <td>
                    <div className="player-score">{player.score}</div>
                  </td>
                  <td>
                    <div
                      className={`category-badge category-${category.name.toLowerCase()}`}
                    >
                      {category.name}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <div className="pagination-info">
          Mostrando {indexOfFirstItem + 1} a{" "}
          {Math.min(indexOfLastItem, rankingData.length)} de{" "}
          {rankingData.length} resultados
        </div>
        <div className="pagination-controls">
          <button
            className="pagination-button"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </button>
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index + 1}
              className={`pagination-button ${
                currentPage === index + 1 ? "active" : ""
              }`}
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </button>
          ))}
          <button
            className="pagination-button"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Siguiente
          </button>
        </div>
      </div>
    </>
  );
};

export default FriendsRanking;