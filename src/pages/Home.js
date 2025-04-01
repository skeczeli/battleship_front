// src/pages/Home.js
import Button from "../components/Button";
import "../styles/main.css";

function Home() {
  return (
    <div>
      <div className="container">
        <h1>Battleship</h1>
        <div className="middle-buttons">
          <Button to="/play">Play</Button>
          <Button to="/rules">Rules</Button>
          <Button to="/ranking">Ranking</Button>
        </div>
      </div>
    </div>
  );
}

export default Home;
