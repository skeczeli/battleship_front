import React, { useState } from "react";
import RankingTable from "components/RankingTable";
import "styles/ranking.css";

const Ranking = () => {
  const [activeTab, setActiveTab] = useState("global");

  return (
    <div className="ranking-container">
      {/* 1. TÍTULO PRIMERO */}
      <h1 className="ranking-title">Tabla de Ranking</h1>
      
      {/* 2. PESTAÑAS SEGUNDO */}
      <div className="ranking-tabs">
        <button
          className={`ranking-tab ${activeTab === "global" ? "active" : ""}`}
          onClick={() => setActiveTab("global")}
        >
          Global
        </button>
        <button
          className={`ranking-tab ${activeTab === "friends" ? "active" : ""}`}
          onClick={() => setActiveTab("friends")}
        >
          Amigos
        </button>
      </div>

      {/* 3. CONTENIDO TERCERO */}
      <div className="ranking-content">
        {activeTab === "global" ? (
          // Solo renderizar RankingTable sin wrapper extra
          <RankingTable />
        ) : (
          <div className="ranking-card">
            <div className="empty-state">
              <span className="empty-icon">👥</span>
              <h3>Próximamente</h3>
              <p>El ranking de amigos estará disponible pronto</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ranking;