import React, { useRef, useState } from "react";
import ConnectRobotAnimation from "./ConnectRobotAnimation";
import ServerOperations from "./ServerOperations";

const projects = {
  FITNESSGRAM: Array.from({ length: 10 }, (_, index) => `FG-Server-${index + 1}`),
  WDO: ["WDO-Server-1", "WDO-Server-2", "WDO-Server-3"],
  CHATBOT: ["Chat-Server-1", "Chat-Server-2"],
  DOCUX: ["Docux-Server-1", "Docux-Server-2", "Docux-Server-3"],
  REVERELY: ["Reverely-Server-1", "Reverely-Server-2"],
};

const environments = ["DEV", "UAT", "PROD"];
const sampleProjects = ["Fitness", "WDO", "Rely", "GLL"];
const connectionsStorageKey = "react-server-dashboard-connections";
const projectsStorageKey = "react-server-dashboard-projects";

const getSampleServerName = (projectName, environment) => `${projectName}-${environment}-Server-1`;

const gllExampleCsv = [
  "Project,ServerName,Environment,Host,Port,Username,Authentication",
  ...["DEV", "UAT", "PROD"].flatMap((environment) => {
    const serverCount = environment === "PROD" ? 10 : 5;
    return Array.from({ length: serverCount }, (_, index) => (
      `GLL,GLL-${environment}-Server-${index + 1},${environment},192.0.2.${10 + index},22,ubuntu,PEM`
    ));
  }),
].join("\n");

function parseCsvRows(csvText) {
  const rows = [];
  let row = [];
  let field = "";
  let insideQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const character = csvText[index];
    if (insideQuotes) {
      if (character === '"' && csvText[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        insideQuotes = false;
      } else {
        field += character;
      }
    } else if (character === '"' && field.length === 0) {
      insideQuotes = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && csvText[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (insideQuotes) throw new Error("CSV contains an unfinished quoted value.");
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function parseServerConnectionsCsv(csvText) {
  const rows = parseCsvRows(csvText.replace(/^\uFEFF/, ""));
  if (rows.length < 2) throw new Error("CSV needs a header row and at least one server row.");

  const normalizeHeader = (header) => header.trim().toLowerCase().replace(/[\s_-]+/g, "");
  const headers = rows[0].map(normalizeHeader);
  const requiredHeaders = ["project", "servername", "environment", "host", "port", "username", "authentication"];
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
  if (missingHeaders.length) {
    throw new Error(`CSV is missing required columns: ${missingHeaders.join(", ")}.`);
  }

  const columnIndex = Object.fromEntries(headers.map((header, index) => [header, index]));
  return rows.slice(1).map((values, index) => {
    const line = index + 2;
    const value = (header) => (values[columnIndex[header]] || "").trim();
    const projectName = value("project");
    const serverName = value("servername");
    const environment = value("environment").toUpperCase();
    const sshHost = value("host");
    const sshPort = value("port");
    const sshUsername = value("username");
    const authValue = value("authentication").toLowerCase();
    const connectionMethod = ["pem", "pem private key"].includes(authValue)
      ? "pem"
      : ["direct", "direct ssh", "direct ssh (password)"].includes(authValue)
        ? "direct"
        : null;

    if (!projectName || !serverName || !environment || !sshHost || !sshPort || !sshUsername) {
      throw new Error(`CSV row ${line} has an empty required value.`);
    }
    if (!environments.includes(environment)) {
      throw new Error(`CSV row ${line} has an invalid environment. Use DEV, UAT, or PROD.`);
    }
    if (!Number.isInteger(Number(sshPort)) || Number(sshPort) < 1 || Number(sshPort) > 65535) {
      throw new Error(`CSV row ${line} has an invalid SSH port.`);
    }
    if (!connectionMethod) {
      throw new Error(`CSV row ${line} has an invalid authentication value. Use PEM or Direct SSH.`);
    }

    return {
      projectName,
      serverName,
      environment,
      connectionMethod,
      sshHost,
      sshPort,
      sshUsername,
      isConnected: false,
    };
  });
}

function loadSavedProjects() {
  try {
    const savedProjects = window.localStorage.getItem(projectsStorageKey);
    if (!savedProjects) return sampleProjects;

    const parsedProjects = JSON.parse(savedProjects);
    if (!Array.isArray(parsedProjects) || !parsedProjects.every((project) => typeof project === "string")) {
      throw new Error("Saved project names must be a list of strings.");
    }

    return [...new Set([...sampleProjects, ...parsedProjects])];
  } catch (error) {
    console.error("Unable to load saved project names.", error);
    return sampleProjects;
  }
}

function loadSavedConnections() {
  try {
    const savedConnections = window.localStorage.getItem(connectionsStorageKey);
    if (!savedConnections) return [];

    const parsedConnections = JSON.parse(savedConnections);
    if (!Array.isArray(parsedConnections)) {
      throw new Error("Saved server connections must be a list.");
    }

    return parsedConnections.filter((connection) => (
      connection &&
      typeof connection.id === "string" &&
      typeof connection.projectName === "string" &&
      typeof connection.serverName === "string" &&
      typeof connection.environment === "string" &&
      typeof connection.connectionMethod === "string" &&
      typeof connection.sshHost === "string" &&
      typeof connection.sshPort === "string" &&
      typeof connection.sshUsername === "string"
    )).map((connection) => ({
      ...connection,
      isConnected: typeof connection.isConnected === "boolean" ? connection.isConnected : true,
    }));
  } catch (error) {
    console.error("Unable to load saved server connections.", error);
    return [];
  }
}

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
  { id: "operations", label: "Server Operations", icon: "⚡" },
  { id: "connect", label: "New Server Connection", icon: "+" },
  { id: "logs", label: "Server Logs", icon: "≡" },
  { id: "monitor", label: "Server Monitor", icon: "◷" },
];

const sectionTitles = {
  overview: "Overview",
  operations: "Server Operations",
  connect: "New Server Connection",
  serverConnection: "Server Connection",
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
  const [expandedProjects, setExpandedProjects] = useState({});
  const [expandedEnvironments, setExpandedEnvironments] = useState({});
  const [projectNames, setProjectNames] = useState(loadSavedProjects);
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [bulkImportMessage, setBulkImportMessage] = useState("");
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [isLoadingSampleData, setIsLoadingSampleData] = useState(false);
  const [projectName, setProjectName] = useState(sampleProjects[0]);
  const [serverName, setServerName] = useState(getSampleServerName(sampleProjects[0], "DEV"));
  const [selectedEnvironment, setSelectedEnvironment] = useState("DEV");
  const selectedProject = projectName || "FITNESSGRAM";
  const selectedServer = serverName || projects.FITNESSGRAM[0];
  const [connectionMethod, setConnectionMethod] = useState("pem");
  const [sshHost, setSshHost] = useState("");
  const [sshPort, setSshPort] = useState("22");
  const [sshUsername, setSshUsername] = useState("");
  const connectionFormRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [connections, setConnections] = useState(loadSavedConnections);
  const [selectedConnectionId, setSelectedConnectionId] = useState(null);
  const [currentConnectionId, setCurrentConnectionId] = useState(null);
  const [formVersion, setFormVersion] = useState(0);
  const [storageError, setStorageError] = useState("");
  const [logs, setLogs] = useState(initialLogs);

  const saveImportedProfiles = (importedProfiles) => {
    const existingProfileKeys = new Set(
      connections.map((connection) => (
        `${connection.projectName}\u0000${connection.serverName}\u0000${connection.environment}`.toLowerCase()
      )),
    );
    const uniqueProfiles = [];
    let skippedCount = 0;

    importedProfiles.forEach((profile, index) => {
      const profileKey = `${profile.projectName}\u0000${profile.serverName}\u0000${profile.environment}`.toLowerCase();
      if (existingProfileKeys.has(profileKey)) {
        skippedCount += 1;
        return;
      }
      existingProfileKeys.add(profileKey);
      uniqueProfiles.push({
        ...profile,
        id: `sample-${Date.now()}-${index}`,
      });
    });

    if (!uniqueProfiles.length) {
      return { importedCount: 0, skippedCount };
    }

    const nextConnections = [...connections, ...uniqueProfiles];
    const nextProjectNames = [...new Set([
      ...projectNames,
      ...uniqueProfiles.map((profile) => profile.projectName),
    ])];
    window.localStorage.setItem(connectionsStorageKey, JSON.stringify(nextConnections));
    window.localStorage.setItem(
      projectsStorageKey,
      JSON.stringify(nextProjectNames.filter((name) => !sampleProjects.includes(name))),
    );
    setConnections(nextConnections);
    setProjectNames(nextProjectNames);
    return { importedCount: uniqueProfiles.length, skippedCount };
  };

  const makeImportMessage = ({ importedCount, skippedCount }) => (
    importedCount
      ? `Added ${importedCount} sample server ${importedCount === 1 ? "profile" : "profiles"}${skippedCount ? `; skipped ${skippedCount} duplicate ${skippedCount === 1 ? "row" : "rows"}` : ""}.`
      : `No new servers added. ${skippedCount} duplicate ${skippedCount === 1 ? "row was" : "rows were"} skipped.`
  );

  const handleLoadGllSamples = () => {
    setIsLoadingSampleData(true);
    setStorageError("");
    setBulkImportMessage("");
    try {
      const result = saveImportedProfiles(parseServerConnectionsCsv(gllExampleCsv));
      setBulkImportMessage(makeImportMessage(result));
    } catch (error) {
      console.error("Unable to add GLL sample server data.", error);
      setStorageError(error instanceof Error
        ? error.message
        : "Could not add the sample server data. Check browser storage and try again.");
    } finally {
      setIsLoadingSampleData(false);
    }
  };

  const handleCsvImport = async (event) => {
    event.preventDefault();
    const importForm = event.currentTarget;
    if (!csvFile) {
      setStorageError("Choose a CSV file to import.");
      return;
    }

    setIsImportingCsv(true);
    setStorageError("");
    setBulkImportMessage("");
    try {
      const importedProfiles = parseServerConnectionsCsv(await csvFile.text());
      const result = saveImportedProfiles(importedProfiles);
      setBulkImportMessage(makeImportMessage(result));
      setCsvFile(null);
      importForm.reset();
    } catch (error) {
      console.error("Unable to import server connections from CSV.", error);
      setStorageError(error instanceof Error
        ? error.message
        : "Could not import this CSV file. Check the file format and browser storage, then try again.");
    } finally {
      setIsImportingCsv(false);
    }
  };

  const handleAddProject = () => {
    const trimmedProjectName = newProjectName.trim();
    if (!trimmedProjectName) {
      setStorageError("Enter a project name before adding it.");
      return;
    }
    if (projectNames.some((name) => name.toLowerCase() === trimmedProjectName.toLowerCase())) {
      setStorageError("That project already exists. Select it from the project list.");
      return;
    }

    const nextProjectNames = [...projectNames, trimmedProjectName];
    try {
      window.localStorage.setItem(
        projectsStorageKey,
        JSON.stringify(nextProjectNames.filter((name) => !sampleProjects.includes(name))),
      );
    } catch (error) {
      console.error("Unable to save project name.", error);
      setStorageError("Could not save this project in browser storage. Check browser storage settings and try again.");
      return;
    }

    setStorageError("");
    setProjectNames(nextProjectNames);
    setProjectName(trimmedProjectName);
    setServerName(getSampleServerName(trimmedProjectName, selectedEnvironment));
    setNewProjectName("");
    setShowAddProject(false);
  };

  const handleConnect = (event) => {
    event.preventDefault();
    const connection = {
      id: `${Date.now()}-${connections.length}`,
      projectName,
      serverName,
      environment: selectedEnvironment,
      connectionMethod,
      sshHost,
      sshPort,
      sshUsername,
      isConnected: true,
    };

    const nextConnections = [...connections, connection];
    try {
      window.localStorage.setItem(connectionsStorageKey, JSON.stringify(nextConnections));
    } catch (error) {
      console.error("Unable to save server connection.", error);
      setStorageError("Could not save this server connection in this browser. Check browser storage settings and try again.");
      return;
    }

    setStorageError("");
    setConnections(nextConnections);
    setSelectedConnectionId(connection.id);
    setCurrentConnectionId(connection.id);
    setConnected(true);
    setLogs((currentLogs) => [
      {
        time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
        message: `Demo ${connection.connectionMethod === "pem" ? "PEM" : "direct SSH"} connection requested for ${connection.serverName} (${connection.projectName}, ${connection.environment}) at ${connection.sshUsername}@${connection.sshHost}:${connection.sshPort}`,
        color: "amber",
      },
      ...currentLogs,
    ]);
  };

  const handleDisconnect = (connectionId = currentConnectionId) => {
    const connection = connections.find((item) => item.id === connectionId);
    if (!connection) return;

    const nextConnections = connections.map((item) => (
      item.id === connectionId ? { ...item, isConnected: false } : item
    ));
    try {
      window.localStorage.setItem(connectionsStorageKey, JSON.stringify(nextConnections));
    } catch (error) {
      console.error("Unable to update saved server connection.", error);
      setStorageError("Could not update this saved server in browser storage. Check browser storage settings and try again.");
      return;
    }

    setStorageError("");
    setConnections(nextConnections);
    if (connectionId === currentConnectionId) {
      setConnected(false);
      setCurrentConnectionId(null);
    }
    setLogs((currentLogs) => [
      {
        time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
        message: `Disconnected from ${connection.serverName} (${connection.projectName}, ${connection.environment})`,
        color: "amber",
      },
      ...currentLogs,
    ]);
  };

  const handleReconnect = (connectionId) => {
    const connection = connections.find((item) => item.id === connectionId);
    if (!connection || connection.isConnected) return;

    const nextConnections = connections.map((item) => (
      item.id === connectionId ? { ...item, isConnected: true } : item
    ));
    try {
      window.localStorage.setItem(connectionsStorageKey, JSON.stringify(nextConnections));
    } catch (error) {
      console.error("Unable to update saved server connection.", error);
      setStorageError("Could not update this saved server in browser storage. Check browser storage settings and try again.");
      return;
    }

    setStorageError("");
    setConnections(nextConnections);
    setCurrentConnectionId(connectionId);
    setSelectedConnectionId(connectionId);
    setConnected(true);
    setLogs((currentLogs) => [
      {
        time: new Date().toLocaleTimeString("en-GB", { hour12: false }),
        message: `Demo reconnected to ${connection.serverName} (${connection.projectName}, ${connection.environment})`,
        color: "emerald",
      },
      ...currentLogs,
    ]);
  };

  const startNewConnection = () => {
    setProjectName(sampleProjects[0]);
    setServerName(getSampleServerName(sampleProjects[0], "DEV"));
    setSelectedEnvironment("DEV");
    setConnectionMethod("pem");
    setSshHost("");
    setSshPort("22");
    setSshUsername("");
    setConnected(false);
    setCurrentConnectionId(null);
    setSelectedConnectionId(null);
    setFormVersion((version) => version + 1);
    openSection("connect");
  };

  const openSection = (section) => {
    setActiveSection(section);
    setSidebarOpen(false);
  };

  const selectedConnection = connections.find((item) => item.id === selectedConnectionId);
  const latestConnection = connections[connections.length - 1];
  const connectionsByProject = connections.reduce((groupedConnections, connection) => {
    const projectConnections = groupedConnections[connection.projectName] || {};
    const environmentConnections = projectConnections[connection.environment] || [];
    return {
      ...groupedConnections,
      [connection.projectName]: {
        ...projectConnections,
        [connection.environment]: [...environmentConnections, connection],
      },
    };
  }, {});

  const connectPanel = (
    <section className="rounded-2xl border border-white/10 bg-[#101b27]/85 p-5">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Manage your infrastructure</p>
        <h2 className="mt-1 text-xl font-semibold text-white">Connect to a server</h2>
        <p className="mt-2 text-sm text-slate-400">Name the project and server, choose an environment, and enter SSH details.</p>
      </div>

      <form onSubmit={handleCsvImport} className="mb-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-medium text-white">Bulk import servers</h3>
            <p className="mt-1 text-xs text-slate-400">
              Import many project, server, and environment profiles from a CSV file.
            </p>
          </div>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(gllExampleCsv)}`}
            download="gll-server-connections-example.csv"
            className="text-xs font-medium text-cyan-300 hover:text-cyan-200"
          >
            Download GLL PEM example CSV
          </a>
        </div>
        <button
          type="button"
          onClick={handleLoadGllSamples}
          disabled={isLoadingSampleData}
          className="mt-3 rounded-lg border border-cyan-400/30 px-4 py-2 text-sm font-medium text-cyan-200 transition hover:bg-cyan-400/10 disabled:opacity-60"
        >
          {isLoadingSampleData ? "Adding sample servers..." : "Load GLL sample servers"}
        </button>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".csv,text/csv"
            required
            disabled={isImportingCsv}
            onChange={(event) => {
              setCsvFile(event.target.files?.[0] || null);
              setBulkImportMessage("");
              setStorageError("");
            }}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#1b2a34] px-3 py-2 text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-500/20 file:px-3 file:py-2 file:text-cyan-200"
          />
          <button
            type="submit"
            disabled={isImportingCsv}
            className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-60"
          >
            {isImportingCsv ? "Importing..." : "Import CSV"}
          </button>
        </div>
        {bulkImportMessage && <p role="status" className="mt-3 text-sm text-emerald-300">{bulkImportMessage}</p>}
        <p className="mt-3 text-xs text-slate-500">
          Required columns: Project, ServerName, Environment, Host, Port, Username, Authentication. Do not include passwords or private keys.
        </p>
        <p className="mt-2 text-xs text-amber-200/80">
          Example uses the placeholder username <code>ubuntu</code> and reserved test IPs (192.0.2.x). Replace them with your server details. PEM files must be provided separately; CSV import never includes private keys.
        </p>
      </form>

      <form ref={connectionFormRef} key={formVersion} onSubmit={handleConnect}>
        <div className="mb-4 grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm text-slate-300">
              Project name
              <select
                value={projectName}
                onChange={(event) => {
                  const nextProject = event.target.value;
                  setProjectName(nextProject);
                  setServerName(getSampleServerName(nextProject, selectedEnvironment));
                  setStorageError("");
                }}
                required
                disabled={connected}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#1b2a34] px-4 py-3 text-white outline-none focus:border-cyan-400 disabled:opacity-60"
              >
                {projectNames.map((project) => <option key={project}>{project}</option>)}
              </select>
            </label>
            <button
              type="button"
              onClick={() => {
                setShowAddProject((show) => !show);
                setNewProjectName("");
                setStorageError("");
              }}
              disabled={connected}
              className="mt-2 text-xs font-medium text-cyan-300 hover:text-cyan-200 disabled:opacity-60"
            >
              {showAddProject ? "Cancel adding project" : "+ Add new project"}
            </button>
          </div>
          <label className="text-sm text-slate-300">
            Server name
            <input
              type="text"
              value={serverName}
              onChange={(event) => setServerName(event.target.value)}
              required
              disabled={connected}
              placeholder="e.g. web-server-01"
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#1b2a34] px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 disabled:opacity-60"
            />
          </label>
          <label className="text-sm text-slate-300">
            Environment
            <select
              value={selectedEnvironment}
              onChange={(event) => {
                const nextEnvironment = event.target.value;
                setSelectedEnvironment(nextEnvironment);
                setServerName(getSampleServerName(projectName, nextEnvironment));
                setConnected(false);
              }}
              disabled={connected}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#1b2a34] px-4 py-3 text-white outline-none focus:border-cyan-400 disabled:opacity-60"
            >
              {environments.map((environment) => <option key={environment}>{environment}</option>)}
            </select>
          </label>
        </div>

        {showAddProject && (
          <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <label className="block text-sm text-slate-300">
              New project name
              <input
                type="text"
                value={newProjectName}
                onChange={(event) => setNewProjectName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAddProject();
                  }
                }}
                autoFocus
                placeholder="Enter a project name"
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#1b2a34] px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-cyan-400"
              />
            </label>
            <button
              type="button"
              onClick={handleAddProject}
              className="mt-3 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
            >
              Save project
            </button>
          </div>
        )}

        <div>
          <label className="block text-sm text-slate-300">
            SSH authentication
            <select
              value={connectionMethod}
              onChange={(event) => {
                setConnectionMethod(event.target.value);
                setConnected(false);
              }}
              disabled={connected}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#1b2a34] px-4 py-3 text-white outline-none focus:border-cyan-400 disabled:opacity-60"
            >
              <option value="pem">PEM private key</option>
              <option value="direct">Direct SSH (password)</option>
            </select>
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="text-sm text-slate-300">
            Host or IP address
            <input
              type="text"
              value={sshHost}
              onChange={(event) => setSshHost(event.target.value)}
              placeholder="e.g. 203.0.113.10"
              autoComplete="off"
              required
              disabled={connected}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#1b2a34] px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 disabled:opacity-60"
            />
          </label>
          <label className="text-sm text-slate-300">
            SSH port
            <input
              type="number"
              value={sshPort}
              onChange={(event) => setSshPort(event.target.value)}
              min="1"
              max="65535"
              required
              disabled={connected}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#1b2a34] px-4 py-3 text-white outline-none focus:border-cyan-400 disabled:opacity-60"
            />
          </label>
          <label className="text-sm text-slate-300">
            SSH username
            <input
              type="text"
              value={sshUsername}
              onChange={(event) => setSshUsername(event.target.value)}
              autoComplete="username"
              required
              disabled={connected}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#1b2a34] px-4 py-3 text-white outline-none focus:border-cyan-400 disabled:opacity-60"
            />
          </label>
          {connectionMethod === "pem" ? (
            <label className="text-sm text-slate-300 md:col-span-2">
              PEM private key file
              <input
                type="file"
                accept=".pem,.key,application/x-pem-file"
                required
                disabled={connected}
                className="mt-2 block w-full rounded-xl border border-white/10 bg-[#1b2a34] px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-500/20 file:px-3 file:py-2 file:text-cyan-200 disabled:opacity-60"
              />
            </label>
          ) : (
            <label className="text-sm text-slate-300 md:col-span-2">
              SSH password
              <input
                type="password"
                autoComplete="current-password"
                required
                disabled={connected}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#1b2a34] px-4 py-3 text-white outline-none focus:border-cyan-400 disabled:opacity-60"
              />
            </label>
          )}
        </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        {connected ? (
          <button
            type="button"
            onClick={handleDisconnect}
            className="rounded-xl bg-rose-600 px-5 py-3 font-semibold text-white transition hover:bg-rose-500"
          >
            Disconnect
          </button>
        ) : (
          <ConnectRobotAnimation
            canSubmit={() => connectionFormRef.current?.reportValidity() ?? false}
            onConnect={() => connectionFormRef.current?.requestSubmit()}
          />
        )}
        <span className={`flex items-center gap-2 text-sm ${connected ? "text-emerald-300" : "text-slate-400"}`}>
          <span className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-emerald-400" : "bg-slate-500"}`} />
          {connected ? "Demo connected" : "Not connected"}
        </span>
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Demo only: no SSH session is opened, and credentials or key files are not sent anywhere. A secure backend is required for live connections.
      </p>
      </form>
    </section>
  );

  const serverConnectionPanel = selectedConnection && (
    <section className="rounded-2xl border border-white/10 bg-[#101b27]/85 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Connected server</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">{selectedConnection.serverName}</h2>
          <p className="mt-1 text-sm text-slate-400">{selectedConnection.projectName} · {selectedConnection.environment}</p>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
          selectedConnection.isConnected
            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
            : "border-slate-400/30 bg-slate-400/10 text-slate-300"
        }`}>
          <span className={`h-2 w-2 rounded-full ${selectedConnection.isConnected ? "bg-emerald-400" : "bg-slate-400"}`} />
          {selectedConnection.isConnected ? "Demo connected" : "Disconnected"}
        </span>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        {[
          ["Host", selectedConnection.sshHost],
          ["SSH port", selectedConnection.sshPort],
          ["SSH username", selectedConnection.sshUsername],
          ["Authentication", selectedConnection.connectionMethod === "pem" ? "PEM private key" : "Direct SSH (password)"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
            <dd className="mt-2 break-all font-medium text-white">{value}</dd>
          </div>
        ))}
      </dl>

      <button
        type="button"
        onClick={() => (
          selectedConnection.isConnected
            ? handleDisconnect(selectedConnection.id)
            : handleReconnect(selectedConnection.id)
        )}
        className={`mt-6 rounded-xl px-5 py-3 font-semibold text-white transition ${
          selectedConnection.isConnected ? "bg-rose-600 hover:bg-rose-500" : "bg-blue-600 hover:bg-blue-500"
        }`}
      >
        {selectedConnection.isConnected ? "Disconnect" : "Reconnect"}
      </button>
      <p className="mt-4 text-xs text-slate-500">
        Demo only: this view displays connection details but does not represent a live SSH session.
      </p>
    </section>
  );

  return (
    <div className="relative min-h-screen w-full bg-[#020d1b] text-white">
      <video autoPlay loop muted playsInline className="fixed inset-0 h-full w-full object-cover opacity-25">
        <source src="/140582-775389269_medium.mp4" type="video/mp4" />
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
              <p className="font-semibold text-white">OpsOne</p>
              <p className="text-xs text-slate-400">Unified DevOps Platform</p>
            </div>
          </div>

          <p className="mb-3 px-3 text-xs uppercase tracking-[0.18em] text-slate-500">Menu</p>
          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
            {navigation.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === "connect") {
                    startNewConnection();
                    return;
                  }
                  if (item.connectionId) {
                    setSelectedConnectionId(item.connectionId);
                  }
                  openSection(item.id);
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                  activeSection === item.id &&
                  (!item.connectionId || item.connectionId === selectedConnectionId)
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-950/40"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="w-5 text-center text-lg">{item.icon}</span>
                {item.label}
              </button>
            ))}
            {Object.entries(connectionsByProject).map(([project, projectConnections]) => {
              const isProjectExpanded = Boolean(expandedProjects[project]);
              const projectPanelId = `project-servers-${project.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
              return (
                <div key={project} className="mt-4 border-t border-white/10 pt-3">
                <button
                  type="button"
                  aria-expanded={isProjectExpanded}
                  aria-controls={projectPanelId}
                  onClick={() => {
                    setExpandedProjects((currentProjects) => ({
                      ...currentProjects,
                      [project]: !currentProjects[project],
                    }));
                  }}
                  className="flex w-full items-center justify-between px-3 pb-1 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 hover:text-slate-300"
                >
                  {project}
                  <span className="transition-transform duration-200 hover:scale-125" aria-hidden="true">
                    {isProjectExpanded ? "−" : "+"}
                  </span>
                </button>
                <div
                  id={projectPanelId}
                  aria-hidden={!isProjectExpanded}
                  inert={!isProjectExpanded}
                  className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
                    isProjectExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    {Object.entries(projectConnections)
                      .sort(([firstEnvironment], [secondEnvironment]) => (
                        environments.indexOf(firstEnvironment) - environments.indexOf(secondEnvironment)
                      ))
                      .map(([environment, environmentConnections]) => {
                        const isEnvironmentExpanded = expandedEnvironments[project]?.[environment] !== false;
                        const environmentPanelId = `${projectPanelId}-${environment.toLowerCase()}`;
                        return (
                          <div key={environment} className="mt-1">
                            <button
                              type="button"
                              aria-expanded={isEnvironmentExpanded}
                              aria-controls={environmentPanelId}
                              onClick={() => {
                                setExpandedEnvironments((currentProjects) => ({
                                  ...currentProjects,
                                  [project]: {
                                    ...currentProjects[project],
                                    [environment]: currentProjects[project]?.[environment] === false,
                                  },
                                }));
                              }}
                              className="flex w-full items-center justify-between px-6 py-2 text-left text-xs font-semibold uppercase tracking-wide text-cyan-300 hover:text-cyan-100"
                            >
                              {environment}
                              <span className="transition-transform duration-200 hover:scale-125" aria-hidden="true">
                                {isEnvironmentExpanded ? "−" : "+"}
                              </span>
                            </button>
                            <div
                              id={environmentPanelId}
                              aria-hidden={!isEnvironmentExpanded}
                              inert={!isEnvironmentExpanded}
                              className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
                                isEnvironmentExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                              }`}
                            >
                              <div className="min-h-0 overflow-hidden">
                                {environmentConnections.map((connection) => (
                                  <button
                                    key={connection.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedConnectionId(connection.id);
                                      setConnected(connection.isConnected);
                                      openSection("serverConnection");
                                    }}
                                    className={`flex w-full items-center gap-3 rounded-xl py-2 pl-9 pr-3 text-left text-sm transition ${
                                      activeSection === "serverConnection" && selectedConnectionId === connection.id
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-950/40"
                                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                                    }`}
                                  >
                                    <span className="w-5 text-center text-xs">↳</span>
                                    <span className="truncate">{connection.serverName}</span>
                                    <span className={`ml-auto h-2 w-2 shrink-0 rounded-full ${
                                      connection.isConnected ? "bg-emerald-400" : "bg-slate-500"
                                    }`} />
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
                </div>
              );
            })}
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
                <p className="text-xs text-slate-400">OpsOne</p>
                <h1 className="text-xl font-semibold text-white md:text-2xl">{sectionTitles[activeSection]}</h1>
              </div>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-xs text-slate-400">Welcome back</p>
              <p className="text-sm font-medium text-white">{username || "admin"}</p>
            </div>
          </header>

          <div className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">
            {storageError && (
              <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                {storageError}
              </p>
            )}
            {activeSection === "overview" && (
              <>
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-2xl font-semibold">Welcome, {username || "admin"}</h2>
                    <p className="mt-1 text-sm text-slate-400">Manage server connections, activity, and health in one place.</p>
                  </div>
                  <button
                    type="button"
                    onClick={startNewConnection}
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                  >
                    + Connect a server
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard label="Servers" value={Object.values(projects).flat().length} detail="Across all projects" />
                  <MetricCard
                    label="Connection"
                    value={connections.length ? "Online" : "Offline"}
                    detail={latestConnection?.serverName || selectedServer}
                  />
                  <MetricCard label="CPU usage" value="42%" detail="Normal usage" />
                  <MetricCard label="Uptime" value="99.96%" detail="Last 30 days" />
                </div>
                <div className="grid gap-5 xl:grid-cols-2">
                  {connectPanel}
                  <MonitorPanel
                    project={latestConnection?.projectName || selectedProject}
                    server={latestConnection?.serverName || selectedServer}
                  />
                </div>
                <LogsPanel logs={logs} compact />
              </>
            )}
            {activeSection === "operations" && <ServerOperations />}
            {activeSection === "connect" && connectPanel}
            {activeSection === "serverConnection" && selectedConnection && serverConnectionPanel}
            {activeSection === "logs" && <LogsPanel logs={logs} />}
            {activeSection === "monitor" && (
              <div className="space-y-5">
                <MonitorPanel
                  project={latestConnection?.projectName || selectedProject}
                  server={latestConnection?.serverName || selectedServer}
                />
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Environment"
                    value={latestConnection?.environment || selectedEnvironment}
                    detail={latestConnection?.projectName || selectedProject}
                  />
                  <MetricCard
                    label="Connection"
                    value={connections.length ? "Online" : "Offline"}
                    detail={latestConnection?.serverName || selectedServer}
                  />
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
