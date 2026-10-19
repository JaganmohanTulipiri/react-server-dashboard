import React, { useState } from "react";

const projects = {
  FITNESSGRAM: Array.from({ length: 10 }, (_, index) => `FG-Server-${index + 1}`),
  WDO: ["WDO-Server-1", "WDO-Server-2", "WDO-Server-3"],
  CHATBOT: ["Chat-Server-1", "Chat-Server-2"],
  DOCUX: ["Docux-Server-1", "Docux-Server-2", "Docux-Server-3"],
  REVERELY: ["Reverely-Server-1", "Reverely-Server-2"],
};

const environments = ["DEV", "UAT", "PROD"];

const initialLogs = [
  { time: "10:42:12", message: "Deployment succeeded for DEV", color: "emerald" },
  { time: "10:43:01", message: "Health check passed", color: "cyan" },
  { time: "10:44:18", message: "Auto-scaling event detected", color: "amber" },
  { time: "10:45:26", message: "Cache refresh completed", color: "rose" },
  { time: "10:46:03", message: "Container restart completed", color: "emerald" },
  { time: "10:47:00", message: "Traffic spike mitigated", color: "cyan" },
  { time: "10:48:12", message: "New build queued", color: "amber" },
];

const logBorderColors = {
  emerald: "border-emerald-400",
  cyan: "border-cyan-400",
  amber: "border-amber-400",
  rose: "border-rose-400",
};

const navigation = [
  { id: "overview", label: "Overview", icon: "⌂" },
  { id: "connect", label: "Server Connect", icon: "↔" },
  { id: "logs", label: "Server Logs", icon: "≡" },
  { id: "monitor", label: "Server Monitor", icon: "◷" },
];

const sectionTitles = {
  overview: "Overview",
  connect: "Server Connect",
  logs: "Server Logs",
  monitor: "Server Monitor",
};

function MetricCard({ label, value, detail }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#1b2a34]/75 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-emerald-300">{detail}</p>
    </div>
  );
}

function LogsPanel({ logs, compact = false }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#101b27]/85 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Activity</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Server Logs</h2>
        </div>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
          LIVE
        </span>
      </div>
      <div className={`space-y-3 overflow-y-auto pr-1 ${compact ? "max-h-52" : "max-h-[28rem]"}`}>
        {logs.length ? (
          logs.map((log, index) => (
            <div
              key={`${log.time}-${index}`}
              className={`border-l-2 ${logBorderColors[log.color]} py-1 pl-3 text-sm text-slate-300`}
            >
              <span className="mr-2 text-slate-500">[{log.time}]</span>
              {log.message}
            </div>
          ))
        ) : (
          <p className="py-4 text-sm text-slate-400">No server activity yet.</p>
        )}
      </div>
    </section>
  );
}

function MonitorPanel({ project, server }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#101b27]/85 p-5">
      <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">Monitoring</p>
          <h2 className="mt-1 text-xl font-semibold text-white">{project}</h2>
          <p className="mt-1 text-sm text-slate-400">{server}</p>
        </div>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
          Healthy
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="CPU" value="42%" detail="Normal usage" />
        <MetricCard label="Memory" value="68%" detail="Within limits" />
        <MetricCard label="Latency" value="21ms" detail="Last 5 minutes" />
        <MetricCard label="Uptime" value="99.96%" detail="Last 30 days" />
      </div>
    </section>
  );
}

export default function Dashboard({ onLogout, username = "admin" }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState("FITNESSGRAM");
  const [selectedEnvironment, setSelectedEnvironment] = useState("DEV");
  const [selectedServer, setSelectedServer] = useState(projects.FITNESSGRAM[0]);
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState(initialLogs);

  const handleProjectChange = (event) => {
    const project = event.target.value;
    setSelectedProject(project);
    setSelectedServer(projects[project][0]);
    setConnected(false);
  };

  const handleConnect = () => {
    const nextConnection = !connected;
    setConnected(nextConnection);
    setLogs((currentLogs) => [
      {
        time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
        message: `${nextConnection ? "Connected to" : "Disconnected from"} ${selectedServer} (${selectedEnvironment})`,
        color: nextConnection ? "emerald" : "amber",
      },
      ...currentLogs,
    ]);
  };

  const openSection = (section) => {
    setActiveSection(section);
    setSidebarOpen(false);
  };

  const connectPanel = (
    <section className="rounded-2xl border border-white/10 bg-[#101b27]/85 p-5">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Manage your infrastructure</p>
        <h2 className="mt-1 text-xl font-semibold text-white">Connect to a server</h2>
        <p className="mt-2 text-sm text-slate-400">Choose a project, environment, and server to manage.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-sm text-slate-300">
          Project
          <select
            value={selectedProject}
            onChange={handleProjectChange}
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#1b2a34] px-4 py-3 text-white outline-none focus:border-cyan-400"
          >
            {Object.keys(projects).map((project) => <option key={project}>{project}</option>)}
          </select>
        </label>
        <label className="text-sm text-slate-300">
          Environment
          <select
            value={selectedEnvironment}
            onChange={(event) => setSelectedEnvironment(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#1b2a34] px-4 py-3 text-white outline-none focus:border-cyan-400"
          >
            {environments.map((environment) => <option key={environment}>{environment}</option>)}
          </select>
        </label>
        <label className="text-sm text-slate-300">
          Server
          <select
            value={selectedServer}
            onChange={(event) => {
              setSelectedServer(event.target.value);
              setConnected(false);
            }}
            className="mt-2 w-full rounded-xl border border-white/10 bg-[#1b2a34] px-4 py-3 text-white outline-none focus:border-cyan-400"
          >
            {projects[selectedProject].map((server) => <option key={server}>{server}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={handleConnect}
          className={`rounded-xl px-5 py-3 font-semibold text-white transition ${
            connected ? "bg-rose-600 hover:bg-rose-500" : "bg-blue-600 hover:bg-blue-500"
          }`}
        >
          {connected ? "Disconnect" : "Connect to server"}
        </button>
        <span className={`flex items-center gap-2 text-sm ${connected ? "text-emerald-300" : "text-slate-400"}`}>
          <span className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-emerald-400" : "bg-slate-500"}`} />
          {connected ? "Connected" : "Not connected"}
        </span>
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Demo interface: connection status is shown locally and does not open a live server session.
      </p>
    </section>
  );

  return (
    <div className="relative min-h-screen w-full bg-[#020d1b] text-white">
      <video autoPlay loop muted playsInline className="fixed inset-0 h-full w-full object-cover opacity-25">
        <source src="/dashboard-bg.mp4" type="video/mp4" />
      </video>
      <div className="fixed inset-0 bg-[linear-gradient(180deg,_rgba(2,13,27,0.82)_0%,_rgba(2,13,27,0.96)_100%)]" />

      <div className="relative z-10 flex min-h-screen">
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-black/60 md:hidden"
          />
        )}
        <aside
          className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-white/10 bg-[#091522]/95 p-5 backdrop-blur-xl transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-9 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-xl text-cyan-300">⌘</div>
            <div>
              <p className="font-semibold text-white">DevOps Portal</p>
              <p className="text-xs text-slate-400">Server dashboard</p>
            </div>
          </div>

          <p className="mb-3 px-3 text-xs uppercase tracking-[0.18em] text-slate-500">Menu</p>
          <nav className="space-y-1">
            {navigation.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openSection(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                  activeSection === item.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-950/40"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="w-5 text-center text-lg">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/15 font-semibold text-cyan-200">
                {(username || "A").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{username || "admin"}</p>
                <p className="text-xs text-slate-400">Signed in</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="mt-4 w-full rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-200"
            >
              Log out
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-4 md:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Open navigation menu"
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg border border-white/10 px-3 py-2 text-slate-200 hover:bg-white/5 md:hidden"
              >
                ☰
              </button>
              <div>
                <p className="text-xs text-slate-400">DevOps Connection Portal</p>
                <h1 className="text-xl font-semibold text-white md:text-2xl">{sectionTitles[activeSection]}</h1>
              </div>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-xs text-slate-400">Welcome back</p>
              <p className="text-sm font-medium text-white">{username || "admin"}</p>
            </div>
          </header>

          <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">
            {activeSection === "overview" && (
              <>
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-2xl font-semibold">Welcome, {username || "admin"}</h2>
                    <p className="mt-1 text-sm text-slate-400">Manage server connections, activity, and health in one place.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openSection("connect")}
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                  >
                    + Connect a server
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard label="Servers" value={Object.values(projects).flat().length} detail="Across all projects" />
                  <MetricCard label="Connection" value={connected ? "Online" : "Offline"} detail={selectedServer} />
                  <MetricCard label="CPU usage" value="42%" detail="Normal usage" />
                  <MetricCard label="Uptime" value="99.96%" detail="Last 30 days" />
                </div>
                <div className="grid gap-5 xl:grid-cols-2">
                  {connectPanel}
                  <MonitorPanel project={selectedProject} server={selectedServer} />
                </div>
                <LogsPanel logs={logs} compact />
              </>
            )}
            {activeSection === "connect" && connectPanel}
            {activeSection === "logs" && <LogsPanel logs={logs} />}
            {activeSection === "monitor" && (
              <div className="space-y-5">
                <MonitorPanel project={selectedProject} server={selectedServer} />
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard label="Environment" value={selectedEnvironment} detail={selectedProject} />
                  <MetricCard label="Connection" value={connected ? "Online" : "Offline"} detail={selectedServer} />
                  <MetricCard label="CPU usage" value="42%" detail="Normal usage" />
                  <MetricCard label="Memory" value="68%" detail="Within limits" />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
