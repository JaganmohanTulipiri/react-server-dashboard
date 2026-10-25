import React, { useState } from "react";
import "./LoginPage.css";

const features = [
  { icon: "⌘", title: "Server Connections", detail: "SSH · RDP · SFTP", color: "cyan" },
  { icon: "🚀", title: "Deployments", detail: "CI/CD · Docker · Kubernetes", color: "purple" },
  { icon: "↗", title: "Monitoring", detail: "Metrics · Alerts · Uptime", color: "green" },
  { icon: "▤", title: "Centralized Logs", detail: "Application · System · Containers", color: "orange" },
  { icon: "⚙", title: "Infrastructure", detail: "DEV · UAT · PROD", color: "blue" },
];

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }

    if (!onLogin) {
      setError("Authentication is not configured yet.");
      return;
    }

    try {
      setLoading(true);
      const result = await onLogin({ username: username.trim(), password });

      if (result === false) {
        setError("Invalid username or password.");
      }
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="ops-login">
      <video className="ops-video" autoPlay muted loop playsInline>
        <source src="/140582-775389269_medium.mp4" type="video/mp4" />
      </video>

      <div className="ops-overlay" />

      <header className="ops-topbar">
        <div className="ops-brand-stack">
          <a className="ops-brand" href="/" aria-label="OpsOne home">
            <span className="ops-brand-icon">⌘</span>
            <span>
              Ops<span>One</span>
            </span>
          </a>
        </div>

        <span className="ops-top-label">
          <span className="status-dot" /> UNIFIED DEVOPS PLATFORM
        </span>
      </header>

      <section className="ops-layout">
        <aside className="ops-intro">
          <span className="ops-eyebrow">ALL IN ONE PLATFORM</span>

          <h1>
            Everything for your
            <span> infrastructure.</span>
          </h1>

          <p className="ops-description">
            Connect, deploy, monitor and manage all your servers,
            applications and environments from one unified platform.
          </p>

          <div className="ops-features">
            {features.map((feature) => (
              <div className="ops-feature" key={feature.title}>
                <div className={`feature-icon ${feature.color}`}>
                  {feature.icon}
                </div>
                <div>
                  <h3>{feature.title}</h3>
                  <p>{feature.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="ops-glass-card">
          <div className="ops-logo">
            <div className="ops-cloud-icon">☁</div>
            <h2>
              Ops<span>One</span>
            </h2>
            <p>UNIFIED DEVOPS PLATFORM</p>
          </div>

          <div className="ops-capabilities">
            Connect <b>·</b> Deploy <b>·</b> Monitor <b>·</b> Manage
          </div>

          <form className="ops-form" onSubmit={handleSubmit}>
            <label htmlFor="ops-username">Username</label>
            <div className="ops-input-wrap">
              <span aria-hidden="true">♙</span>
              <input
                id="ops-username"
                type="text"
                placeholder="Enter your username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <label htmlFor="ops-password">Password</label>
            <div className="ops-input-wrap">
              <span aria-hidden="true">♙</span>
              <input
                id="ops-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                className="ops-show-password"
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {error && <p className="ops-error" role="alert">{error}</p>}

            <button className="ops-submit" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
              <span aria-hidden="true"> →</span>
            </button>
          </form>

          <div className="ops-security">
            <span aria-hidden="true">♢</span>
            Authorized access only
          </div>
        </section>
      </section>

      <footer className="ops-footer">
        <span>© {new Date().getFullYear()} OpsOne</span>
        <span>CONNECT · DEPLOY · MONITOR · CONTROL</span>
      </footer>
    </main>
  );
}
