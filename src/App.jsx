import React, { useState } from "react";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard"; // your Dashboard component

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  const handleLogout = () => {
    setLoggedIn(false);
    setUsername("");
  };

  return !loggedIn ? (
    <LoginPage
      onLogin={(loginUsername) => {
        setUsername(loginUsername);
        setLoggedIn(true);
      }}
    />
  ) : (
    <Dashboard onLogout={handleLogout} username={username} />
  );
}

export default App;
