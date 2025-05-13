import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Rules from "./pages/Rules";
import Play from "./pages/play/Play";
import BotsSetup from "./pages/play/play-mode/bots/BotsSetup";
import BotsGame from "./pages/play/play-mode/bots/BotsGame";
import RandomUserSetup from "./pages/play/play-mode/random/RandomUserSetup";
import RandomUserGame from "./pages/play/play-mode/random/RandomUserGame";
import PrivateRoomSetup from "./pages/play/play-mode/private/PrivateRoomSetup";
import PrivateRoomGame from "./pages/play/play-mode/private/PrivateRoomGame";
import Ranking from "./pages/Ranking";
import Navbar from "./components/Navbar";
import ProfileEditor from "./pages/ProfileEditor";
import Profile from "./pages/Profile";
import SocketTest from "./pages/socketTest";

import { UserProvider } from "./contexts/UserContext";

function App() {
  return (
    <Router>
      <UserProvider>
        {" "}
        <Navbar />
        <Routes>
          <Route path="/socket-test" element={<SocketTest />} />
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/editprofile" element={<ProfileEditor />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/register" element={<Register />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/play" element={<Play />} />
          <Route path="/play-mode/bots/setup" element={<BotsSetup />} />
          <Route path="/play-mode/bots/game/:gameId" element={<BotsGame />} />
          <Route path="/play-mode/random/setup" element={<RandomUserSetup />} />
          <Route path="/play-mode/random/game" element={<RandomUserGame />} />
          <Route
            path="/play-mode/private/setup"
            element={<PrivateRoomSetup />}
          />
          <Route path="/play-mode/private/game" element={<PrivateRoomGame />} />
          <Route path="/ranking" element={<Ranking />} />
        </Routes>
      </UserProvider>
    </Router>
  );
}

export default App;
