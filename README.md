# CoachBoard

Visueller Fußball-Trainingsplaner im Browser: Übungen auf einem 2D-Spielfeld aufbauen, Lauf-, Pass- und Dribbelwege zeichnen, in Schritten animieren, lokal speichern, als PNG/PDF/Video/JSON exportieren und zu Trainingseinheiten zusammenstellen. Schwerpunkt: F-, E- und D-Jugend.

## Schnellstart

```bash
npm install
npm run dev          # http://localhost:3000
```

Voraussetzung: Node.js ≥ 20.

## Skripte

| Befehl | Zweck |
| --- | --- |
| `npm run dev` | Entwicklungsserver |
| `npm run build` / `npm start` | Produktions-Build / -Server |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm test` | Unit-Tests (Vitest) |
| `npm run test:e2e` | E2E-Tests (Playwright, startet `next start` selbst; vorher `npm run build`) |

Falls Playwright die Browser nicht findet: `npx playwright install chromium` oder `PW_CHROMIUM_PATH=/pfad/zu/chrome` setzen.

## Bedienung (Kurzfassung)

- **Linke Leiste:** Spieler, Ball, Material, Zonen/Text per Klick ins Feld oder Drag & Drop platzieren. Wege (Laufweg, Pass, Dribbling, Torschuss) frei zeichnen.
- **Weg am Spieler/Ball beginnen** → das Objekt folgt dem Weg in der Animation. Dribbling nimmt einen nahen Ball automatisch mit.
- **Schritte (rechts):** Jeder Schritt ist ein Keyframe. Spieler in einem Schritt verschieben erzeugt eine Bewegung vom vorherigen Schritt.
- **Timeline (unten):** Abspielen, Tempo, Schleife, Schrittdauer ziehen, Start/Ende einzelner Wege verschieben.
- **Tastenkürzel:** `V` Auswahl, `H` Hand, `L/P/D/S` Wege, `Entf` löschen, `Strg+Z/Y` Undo/Redo, `Strg+C/V/D` Kopieren/Einfügen/Duplizieren, `Leertaste` Play/Pause, Pfeiltasten verschieben (Shift = 2 m), `F` einpassen, `Esc` Werkzeug zurücksetzen.
- **Smartphone:** `/play?id=…` – Vollbild-Wiedergabe, im Hochformat automatisch gedreht.

## Deployment (VPS mit Docker)

```bash
docker compose up -d --build    # lauscht auf 127.0.0.1:3000
```

Reverse Proxy (Beispiel Caddy):

```
coachboard.example.de {
  reverse_proxy 127.0.0.1:3000
}
```

Daten liegen aktuell im Browser (IndexedDB) – Backups über „Backup“ (JSON) in der Bibliothek.

Weitere Details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), Stand: [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md).
