import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import "./ServerOperations.css";

const API_URL = import.meta.env.VITE_OPS_API_URL || "";
const DASHBOARD_CONNECTIONS_KEY = "react-server-dashboard-connections";

function loadDashboardConnections() {
  try {
    const connections = JSON.parse(
      window.localStorage.getItem(DASHBOARD_CONNECTIONS_KEY) || "[]"
    );
    return Array.isArray(connections) ? connections : [];
  } catch {
    return [];
  }
}

export default function ServerOperations() {
  const [token, setToken] = useState("");
  const [servers, setServers] = useState([]);
  const [dashboardConnections, setDashboardConnections] = useState(loadDashboardConnections);
  const [projectFilter, setProjectFilter] = useState("all");
  const [environmentFilter, setEnvironmentFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [showToken, setShowToken] = useState(true);
  const terminalRef = useRef(null);
  const terminalInstance = useRef(null);
  const socketRef = useRef(null);

  const selected = servers.find((server) => server.id === selectedId);
  const projects = [...new Set(dashboardConnections.map((connection) => connection.projectName).filter(Boolean))].sort();
  const environments = [...new Set(dashboardConnections.map((connection) => connection.environment).filter(Boolean))].sort();
  const filteredConnections = dashboardConnections.filter((connection) => (
    (projectFilter === "all" || connection.projectName === projectFilter) &&
    (environmentFilter === "all" || connection.environment === environmentFilter)
  ));

  function findDeploymentServer(connection) {
    return servers.find((server) => (
      server.host?.trim().toLowerCase() === connection.sshHost?.trim().toLowerCase() &&
      String(server.port || 22) === String(connection.sshPort || 22) &&
      server.username?.trim().toLowerCase() === connection.sshUsername?.trim().toLowerCase()
    ));
  }

  async function loadServers() {
    setStatus("");
    setDashboardConnections(loadDashboardConnections());
    try {
      const response = await fetch(`${API_URL}/api/servers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Could not load servers. Check your token.");

      const data = await response.json();
      setServers(data);
      setSelectedId((current) => (
        data.some((server) => server.id === current)
          ? current
          : data[0]?.id || ""
      ));
      setShowToken(false);
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function deploy() {
    if (!selected) return;

    const confirmed = window.confirm(
      `Deploy ${selected.project} to ${selected.name} (${selected.environment})?`
    );
    if (!confirmed) return;

    setBusy(true);
    setStatus("Deployment started. Waiting for completion...");

    try {
      const response = await fetch(`${API_URL}/api/deploy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ serverId: selected.id }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || result.message || "Deployment failed.");

      setStatus(result.message || "Deployment completed.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  function openTerminal() {
    if (!selected || !terminalRef.current) return;

    if (socketRef.current) socketRef.current.close();
    if (terminalInstance.current) terminalInstance.current.dispose();

    const terminal = new Terminal({
      cursorBlink: true,
      convertEol: true,
      fontSize: 13,
      fontFamily: "JetBrains Mono, monospace",
      theme: {
        background: "#07111f",
        foreground: "#e2e8f0",
        cursor: "#38bdf8",
      },
    });

    const fit = new FitAddon();
    terminal.loadAddon(fit);
    terminal.open(terminalRef.current);
    fit.fit();
    terminalInstance.current = terminal;

    const base = API_URL || window.location.origin;
    const wsBase = base.replace(/^http/, "ws");
    const socket = new WebSocket(
      `${wsBase}/terminal?serverId=${encodeURIComponent(selected.id)}&token=${encodeURIComponent(token)}`
    );

    socketRef.current = socket;

    socket.onopen = () => {
      terminal.writeln("\r\nConnecting to server...");
      socket.send(JSON.stringify({
        type: "resize",
        cols: terminal.cols,
        rows: terminal.rows,
      }));
    };

    socket.onmessage = (event) => {
      try {
        const decoded = atob(event.data);
        const bytes = Uint8Array.from(decoded, (c) => c.charCodeAt(0));
        terminal.write(bytes);
      } catch {
        terminal.writeln(String(event.data));
      }
    };

    socket.onerror = () => terminal.writeln("\r\nTerminal connection error.");
    socket.onclose = () => terminal.writeln("\r\nTerminal disconnected.");

    terminal.onData((data) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "input", data }));
      }
    });

    terminal.onResize(({ cols, rows }) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "resize", cols, rows }));
      }
    });

    window.setTimeout(() => {
      try {
        fit.fit();
      } catch {
        // terminal may have closed
      }
    }, 100);
  }

  useEffect(() => () => {
    if (socketRef.current) socketRef.current.close();
    if (terminalInstance.current) terminalInstance.current.dispose();
  }, []);

  return (
    <main className="ops-server-page">
      <header className="ops-server-header">
        <div>
          <span className="ops-server-kicker">OPSONE CONTROL CENTER</span>
          <h1>Server Operations</h1>
          <p>Connect, deploy and manage your infrastructure.</p>
        </div>
        <span className="ops-server-pill">DEVOPS PLATFORM</span>
      </header>

      <section className="ops-server-panel">
        <div className="ops-panel-heading">
          <h2>Server connection</h2>
          <span>SSH / Deployment</span>
        </div>

        {showToken && (
          <div className="ops-token-area">
            <label htmlFor="ops-api-token">Backend API token</label>
            <input
              id="ops-api-token"
              type="password"
              autoComplete="off"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Enter your backend token"
            />
            <button className="ops-btn ops-btn-primary" onClick={loadServers}>
              Load servers
            </button>
          </div>
        )}

        {!showToken && (
          <button className="ops-link-btn" onClick={() => setShowToken(true)}>
            Change API token
          </button>
        )}

        <div className="ops-saved-connections">
          <div className="ops-panel-heading">
            <h2>Servers from New Server Connection</h2>
            <span>{filteredConnections.length} of {dashboardConnections.length} shown</span>
          </div>
          {dashboardConnections.length ? (
            <>
              <div className="ops-saved-filters">
                <label>
                  Project
                  <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}>
                    <option value="all">All projects</option>
                    {projects.map((project) => <option key={project} value={project}>{project}</option>)}
                  </select>
                </label>
                <label>
                  Environment
                  <select value={environmentFilter} onChange={(event) => setEnvironmentFilter(event.target.value)}>
                    <option value="all">All environments</option>
                    {environments.map((environment) => <option key={environment} value={environment}>{environment}</option>)}
                  </select>
                </label>
              </div>
              {filteredConnections.length ? (
                <div className="ops-saved-list">
                  {filteredConnections.map((connection) => {
                const configuredServer = findDeploymentServer(connection);
                return (
                  <div className="ops-saved-server" key={connection.id}>
                    <div className="ops-saved-server-info">
                      <strong>{connection.serverName}</strong>
                      <span>
                        {connection.projectName} · {connection.environment} · {connection.sshUsername}@{connection.sshHost}:{connection.sshPort}
                      </span>
                    </div>
                    {configuredServer ? (
                      <button
                        className="ops-btn ops-btn-terminal"
                        onClick={() => setSelectedId(configuredServer.id)}
                      >
                        Select for deployment
                      </button>
                    ) : (
                      <span className="ops-config-needed">Needs backend configuration</span>
                    )}
                  </div>
                );
                  })}
                </div>
              ) : (
                <p className="ops-saved-empty">No saved servers match these filters.</p>
              )}
            </>
          ) : (
            <p className="ops-saved-empty">No saved server profiles yet.</p>
          )}
          <p className="ops-saved-note">
            These profiles are saved in this browser. Add a matching host, port, username, SSH key path, and verified host fingerprint to backend/servers.json before using deployment operations.
          </p>
        </div>

        {servers.length > 0 && (
          <>
            <label htmlFor="ops-server-select">Select server / project</label>
            <select
              id="ops-server-select"
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {servers.map((server) => (
                <option key={server.id} value={server.id}>
                  {server.name} — {server.environment} — {server.project}
                </option>
              ))}
            </select>

            {selected && (
              <div className="ops-server-details">
                <div><span>Environment</span><strong>{selected.environment}</strong></div>
                <div><span>Project</span><strong>{selected.project}</strong></div>
                <div><span>Remote path</span><code>{selected.remotePath}</code></div>
                <div><span>Deployment method</span><strong>{selected.deployMethod}</strong></div>
              </div>
            )}

            <div className="ops-server-actions">
              <button className="ops-btn ops-btn-terminal" onClick={openTerminal}>
                Open SSH terminal
              </button>
              <button
                className="ops-btn ops-btn-primary"
                onClick={deploy}
                disabled={!selected || busy}
              >
                {busy ? "Deploying..." : "Deploy application"}
              </button>
            </div>
          </>
        )}

        {status && <p className="ops-server-status" role="status">{status}</p>}
      </section>

      <section className="ops-terminal-panel">
        <div className="ops-panel-heading">
          <h2>Web terminal</h2>
          <span>{selected ? selected.name : "No server selected"}</span>
        </div>
        <div className="ops-terminal-window" ref={terminalRef} />
      </section>

      <p className="ops-server-footnote">
        Only connect to authorized servers. Verify your environment before deploying.
      </p>
    </main>
  );
}
