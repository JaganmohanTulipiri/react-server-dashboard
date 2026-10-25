import React, { useState } from "react";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import RobotCursor from "./components/RobotCursor";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");

  async function handleLogin(credentials) {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const fallbackDemo = credentials.username === "admin" && credentials.password === "1234";
        if (!fallbackDemo) return false;
      }
    } catch {
      if (credentials.username !== "admin" || credentials.password !== "1234") {
        return false;
      }
    }

    setUsername(credentials.username);
    setLoggedIn(true);
    return true;
  }

  const handleLogout = () => {
    setLoggedIn(false);
    setUsername("");
  };

  return (
    <>
      <RobotCursor />
      {!loggedIn ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <Dashboard onLogout={handleLogout} username={username} />
      )}
    </>
  );
}
