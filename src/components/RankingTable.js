import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "styles/ranking.css";

const RankingTable = () => {
  const [rankingData, setRankingData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
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
    const fetchRanking = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/ranking");
        const data = await response.json();
        setRankingData(data);
      } catch (error) {
        console.error("Error al obtener el ranking:", error);
      }
    };

    fetchRanking();
  }, []);

  return (
    <div className="ranking-container">
      <h1 className="ranking-title">Tabla de Ranking</h1>

      <div className="ranking-card">
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
                return (
                  <tr key={player.rank}>
                    <td>
                      <div
                        className={`rank-badge ${
                          player.rank <= 3 ? "top-rank" : ""
                        }`}
                      >
                        {player.rank}
                      </div>
                    </td>
                    <td>
                      <div className="player-name">
                        <Link to={`/profile/${player.username}`}>
                          {player.username}
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
      </div>
    </div>
  );
};

export default RankingTable;
