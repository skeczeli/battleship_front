import React, { useState } from "react";
import RankingTable from "components/RankingTable";
import FriendsRanking from "./FriendsRanking";
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
          <RankingTable />
        ) : (
          <FriendsRanking />
        )}
      </div>
    </div>
  );
};

export default Ranking;