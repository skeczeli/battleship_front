// src/pages/Play.js
import React from "react";
import { Link } from "react-router-dom";
import "../../styles/main.css";

function Play() {
  return (
    <div className="container">
      <div className="topper-button">
        <Link to="/">
          <button className="button">Home</button>
        </Link>
      </div>
      <div className="middle-message">Choose your opponent</div>
      <div className="middle-buttons">
        <Link to="/play-mode/bots">
          <button className="button">Battleship Bot</button>
        </Link>
        <Link to="/play-mode/randomuser">
          <button className="button">Random user</button>
        </Link>
        <Link to="/play-mode/privaterooms">
          <button className="button">Private rooms</button>
        </Link>
      </div>
    </div>
  );
}

export default Play;
