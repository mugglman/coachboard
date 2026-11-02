#!/usr/bin/env node
// CoachBoard-Starter: prüft Abhängigkeiten, sucht einen freien Port,
// startet den Dev-Server und öffnet den Browser.
// Beendet NIEMALS fremde Prozesse – belegte Ports werden nur übersprungen.
//
// Optionen (Umgebungsvariablen):
//   PORT=3000          Wunsch-Port (Standard 3000)
//   PORT_STRICT=1      Kein Ausweichen: bei belegtem Port abbrechen
//   NO_BROWSER=1       Browser nicht automatisch öffnen

import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const START_PORT = Number(process.env.PORT || 3000);
const MAX_TRIES = 20;
const STRICT = process.env.PORT_STRICT === "1";
const OPEN_BROWSER = process.env.NO_BROWSER !== "1";
const IS_WIN = process.platform === "win32";

const log = (msg) => console.log(`[CoachBoard] ${msg}`);
const fail = (msg) => {
  console.error(`[CoachBoard] FEHLER: ${msg}`);
  process.exit(1);
};

// --- 1. Node-Version ---------------------------------------------------------
const major = Number(process.versions.node.split(".")[0]);
if (major < 20) fail(`Node.js ${process.versions.node} ist zu alt – benötigt wird Version 20 oder neuer.`);

// --- 2. Abhängigkeiten -------------------------------------------------------
const nextBin = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
if (!existsSync(nextBin)) {
  log("Abhängigkeiten fehlen – führe 'npm install' aus (einmalig, dauert etwas) …");
  const res = spawnSync(IS_WIN ? "npm.cmd" : "npm", ["install"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: IS_WIN,
  });
  if (res.status !== 0 || !existsSync(nextBin)) fail("'npm install' ist fehlgeschlagen.");
}

// --- 3. Port-Prüfung ---------------------------------------------------------
// Belegt = irgendein Prozess lauscht (IPv4 oder IPv6). Wir testen per Bind,
// genau wie Next.js es später tun würde.
function canBind(port, host) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once("error", (err) => resolve(err.code === "EADDRNOTAVAIL" || err.code === "EAFNOSUPPORT"));
    srv.once("listening", () => srv.close(() => resolve(true)));
    srv.listen({ port, host, exclusive: true });
  });
}
async function isFree(port) {
  return (await canBind(port, "0.0.0.0")) && (await canBind(port, "::"));
}

// Läuft auf dem Port bereits CoachBoard? Dann nur Browser öffnen.
async function isCoachBoard(port, timeoutMs = 1500) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`http://localhost:${port}/`, { signal: ctrl.signal });
    clearTimeout(t);
    const html = await res.text();
    return html.includes("<title>CoachBoard");
  } catch {
    return false;
  }
}

function openBrowser(url) {
  if (!OPEN_BROWSER) return;
  const [cmd, args] = IS_WIN ? ["cmd", ["/c", "start", "", url]] : process.platform === "darwin" ? ["open", [url]] : ["xdg-open", [url]];
  try {
    const child = spawn(cmd, args, { stdio: "ignore", detached: true });
    child.on("error", () => log(`Browser konnte nicht geöffnet werden – bitte manuell aufrufen: ${url}`));
    child.unref();
  } catch {
    log(`Browser konnte nicht geöffnet werden – bitte manuell aufrufen: ${url}`);
  }
}

let port = null;
const busy = [];
for (let p = START_PORT; p < START_PORT + (STRICT ? 1 : MAX_TRIES); p++) {
  if (await isFree(p)) {
    port = p;
    break;
  }
  if (await isCoachBoard(p)) {
    const url = `http://localhost:${p}`;
    log(`CoachBoard läuft bereits auf ${url} – öffne nur den Browser.`);
    openBrowser(url);
    process.exit(0);
  }
  busy.push(p);
}

if (port === null) {
  fail(
    STRICT
      ? `Port ${START_PORT} ist von einer anderen Anwendung belegt. Diese wird NICHT beendet. ` +
          `Anderen Port wählen (z. B. PORT=3001) oder PORT_STRICT weglassen.`
      : `Kein freier Port zwischen ${START_PORT} und ${START_PORT + MAX_TRIES - 1} gefunden. ` + `Mit PORT=<nummer> einen anderen Bereich wählen.`,
  );
}
if (busy.length) {
  log(`Port ${busy.join(", ")} belegt durch eine andere Anwendung (wird nicht angetastet).`);
}

// --- 4. Dev-Server starten ---------------------------------------------------
const url = `http://localhost:${port}`;
log(`Starte CoachBoard auf ${url} …  (Beenden: Strg+C)`);

const server = spawn(process.execPath, [nextBin, "dev", "-p", String(port)], {
  cwd: ROOT,
  stdio: "inherit",
  env: { ...process.env, PORT: String(port) },
});

const stop = () => {
  if (!server.killed) server.kill("SIGINT");
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
server.on("exit", (code) => process.exit(code ?? 0));

// --- 5. Warten bis erreichbar, dann Browser öffnen ---------------------------
const deadline = Date.now() + 120_000;
while (Date.now() < deadline) {
  if (server.exitCode !== null) break;
  if (await isCoachBoard(port, 60_000)) {
    log(`Bereit: ${url}`);
    openBrowser(url);
    break;
  }
  await new Promise((r) => setTimeout(r, 1000));
}
