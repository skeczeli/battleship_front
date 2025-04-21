// src/pages/Play.js
import React from "react";
import { Link } from "react-router-dom";
import "styles/main.css";

function Play() {
  return (
    <div className="container">
      <div className="middle-message">Choose your opponent</div>
      <div className="middle-buttons">
        <Link to="/play-mode/bots/setup">
          <button className="button">Battleship Bot</button>
        </Link>
        <Link to="/play-mode/random/setup">
          <button className="button">Random user</button>
        </Link>
        <Link to="/play-mode/private/setup">
          <button className="button">Private rooms</button>
        </Link>
      </div>
    </div>
  );
}

export default Play;
