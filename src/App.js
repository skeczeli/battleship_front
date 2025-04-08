// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Rules from "./pages/Rules";
import Play from "./pages/play/Play";
import PlayLayout from "./pages/play/PlayLayout";
import Bots from "./pages/play/play-mode/Bots";
import RandomUser from "./pages/play/play-mode/RandomUser";
import PrivateRooms from "./pages/play/play-mode/PrivateRooms";
import Ranking from "./pages/Ranking";
import Navbar from "./components/Navbar";
import ProfileEditor from './pages/ProfileEditor';
import Profile from './pages/Profile';


function App() {
  return (
    <Router>
      <Navbar /> {/* 👈 Navbar arriba de todas las rutas */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/editprofile" element={<ProfileEditor />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/register" element={<Register />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/play" element={<Play />} />
        <Route path="/play-mode" element={<PlayLayout />}>
          <Route
            index
            element={
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
            }
          />
          <Route path="bots" element={<Bots />} />
          <Route path="randomuser" element={<RandomUser />} />
          <Route path="privaterooms" element={<PrivateRooms />} />
        </Route>
        <Route path="/ranking" element={<Ranking />} />
      </Routes>
    </Router>
  );
}

export default App;
