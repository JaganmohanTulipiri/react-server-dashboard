const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const { Client } = require("ssh2");
const { WebSocketServer } = require("ws");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = Number(process.env.PORT || 5000);
const HOST = process.env.HOST || "127.0.0.1";
const API_TOKEN = process.env.OPSONE_API_TOKEN || "opsone-dev-token";
const SERVERS_FILE = path.join(__dirname, "servers.json");

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "ws:", "wss:"],
      imgSrc: ["'self'", "data:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

app.use(express.json({ limit: "1mb" }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

function readServers() {
  return JSON.parse(fs.readFileSync(SERVERS_FILE, "utf8"));
}

function requireToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token || token !== API_TOKEN) {
    return res.status(401).json({ error: "Unauthorized: invalid or missing token." });
  }

  next();
}

app.get("/health", (_, res) => {
  res.json({ status: "ok", service: "opsone-backend" });
});

app.get("/api/servers", requireToken, (_, res) => {
  try {
    const servers = readServers();
    res.json(servers);
  } catch (error) {
    res.status(500).json({ error: "Unable to read server configuration." });
  }
});

app.post("/api/deploy", requireToken, (req, res) => {
  const { serverId } = req.body || {};

  if (!serverId) {
    return res.status(400).json({ error: "serverId is required." });
  }

  const servers = readServers();
  const server = servers.find((item) => item.id === serverId);

  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  res.json({
    ok: true,
    message: `Deployment job queued for ${server.name} (${server.environment}).`,
    serverId,
  });
});

const wss = new WebSocketServer({
  noServer: true,
});

const server = app.listen(PORT, HOST, () => {
  console.log(`OpsOne backend listening on http://${HOST}:${PORT}`);
});

server.on("upgrade", (request, socket, head) => {
  const params = new URL(request.url, `http://${request.headers.host}`);
  const token = params.searchParams.get("token");
  const serverId = params.searchParams.get("serverId");

  if (!token || token !== API_TOKEN || !serverId) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  const servers = readServers();
  const requested = servers.find((item) => item.id === serverId);

  if (!requested) {
    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    const connection = new Client();

    connection.on("ready", () => {
      ws.send(Buffer.from("\u001b[32mConnected to SSH session...\u001b[0m\r\n").toString("base64"));
      connection.shell((shellError, stream) => {
        if (shellError) {
          ws.send(Buffer.from(`Shell error: ${shellError.message}\r\n`).toString("base64"));
          return;
        }

        stream.on("data", (chunk) => {
          ws.send(Buffer.from(chunk).toString("base64"));
        });

        stream.on("close", () => {
          ws.close();
        });

        ws.on("message", (message) => {
          try {
            const packet = JSON.parse(message.toString());
            if (packet.type === "input") {
              stream.write(packet.data);
            }
            if (packet.type === "resize") {
              stream.setWindow(packet.rows || 24, packet.cols || 80, 0, 0);
            }
          } catch {
            // ignore malformed packets
          }
        });

        ws.on("close", () => {
          stream.end();
          connection.end();
        });
      });
    });

    connection.on("error", (sshError) => {
      ws.send(Buffer.from(`SSH connection error: ${sshError.message}\r\n`).toString("base64"));
      ws.close();
    });

    connection.connect({
      host: requested.host,
      port: requested.port || 22,
      username: requested.username,
      privateKey: fs.readFileSync(requested.privateKeyPath),
      readyTimeout: 10000,
      strictHostKeyChecking: false,
      hostHash: "sha256",
    });
  });
});

module.exports = { app, server };
