# Implementierungsstatus CoachBoard

Stand: 02.11.2026 – Version 0.1.0

## Erledigt

| Bereich | Umfang |
| --- | --- |
| Grundgerüst | Next.js 16 (App Router), TypeScript strict, Tailwind v4, shadcn/ui-Stil (Radix), Lucide, Zustand, react-konva, Dexie, Zod, React Hook Form, Vitest, Playwright, ESLint, Prettier |
| Design | Design-Tokens (hell/dunkel) laut Vorgabe, Inter, Layout: Toolbar oben, Werkzeuge links (260 px, einklappbar), Spielfeld mittig, Seitenleiste rechts (300 px, Tabs Schritte/Objekte/Eigenschaften/Info, einklappbar), Timeline unten (180 px, einklappbar, Höhe ziehbar) |
| Spielfeld | 11er, 9er (D-Jugend), 7er (E-Jugend), 5er (F-Jugend), halbes Großfeld, freie Fläche; Tore, Außen-/Mittellinie, Mittelkreis, Anstoßpunkt, Straf-/Torräume, Elfmeterpunkte, Strafraumbögen, Eckviertel; Rasenstreifen an/aus, dunkle Variante |
| Objekte | Spieler Team A/B/Neutral (auto-nummeriert), Torwart, Trainer, Ball, Hütchen, Teller, Stange, Hürde, Ring, Minitor, Großtor, Koordinationsleiter, Dummy, Zone (skalierbar), Text; Farbe, Größe, Drehung, Beschriftung, Sperren |
| Editor | Platzieren per Klick oder Drag & Drop, Verschieben, Drehen/Skalieren (Transformer), Zoom (Mausrad/Buttons), Hand-Werkzeug, Einpassen, Raster-Snap, Undo/Redo, Kopieren/Einfügen/Duplizieren, Tastenkürzel, „Geister“ der vorherigen Positionen |
| Wege | Laufweg (gestrichelt), Pass (gelb), Dribbling (Wellenlinie), Torschuss (dick, rot); Freihand mit Glättung, automatische Verknüpfung mit Spieler/Ball, Ballmitnahme beim Dribbling, Stützpunkte nachträglich ziehbar |
| Animation | Eigene Engine (requestAnimationFrame), Schritte als Keyframes, Wegfolge, Zeitfenster pro Weg, Easing, Tempo 0,5–2×, Schleife, Scrubbing |
| Speicherung | IndexedDB (Dexie), Autospeichern mit Statusanzeige, Vorschaubilder, JSON-Import/-Export (einzeln, Einheit, komplettes Backup) mit Zod-Validierung |
| Export | PNG (2400 px), PDF (alle Schritte + Übungsinfos), Video MP4 (nativ, falls Browser kann) bzw. WebM-Fallback, JSON |
| Bibliothek | Suche, Filter Kategorie/Altersklasse, Neu (leer oder aus Vorlage), Duplizieren, Löschen, 3 Beispielübungen beim ersten Start |
| Trainingseinheiten | Anlegen, Übungen hinzufügen/sortieren/entfernen, Dauer + Hinweis je Übung, Zeitplan, PDF- und JSON-Export |
| Mobil | Abspielansicht `/play?id=…` (Vollbild, im Hochformat gedreht, Schritt-Navigation, Tempo); Editor klappt Leisten auf kleinen Displays ein |
| Betrieb | Dockerfile (standalone), docker-compose, Doku zu Reverse Proxy |

## Tatsächlich ausgeführte Prüfungen (02.11.2026)

- `npm run build` – erfolgreich
- `npx tsc --noEmit`, `npm run lint` – ohne Fehler
- `npm test` – 28/28 Unit-Tests grün (Geometrie, Animationsengine, Store, Schema/JSON, Repository mit fake-indexeddb)
- `npm run test:e2e` – 6/6 grün (Chromium headless, Desktop + Pixel 7): Bibliothek, Übung erstellen/platzieren/Weg zeichnen/Autospeichern/Neu laden, Schritte + Undo, PNG/PDF/JSON-Download, Trainingseinheit, Smartphone-Wiedergabe
- Manuell per Skript: Video-Export in Chromium erzeugt MP4 (7,7 s, Inhalt per Einzelbild geprüft)
- **Nicht getestet:** Docker-Image-Build (kein Docker in der Build-Umgebung), Safari/Firefox, echte Touch-Geräte

## Bekannte Einschränkungen

- Videoaufnahme läuft in Echtzeit; der Tab muss währenddessen sichtbar bleiben.
- MP4 nur, wenn der Browser es nativ aufnehmen kann – sonst WebM (kein ffmpeg.wasm, siehe docs/ARCHITECTURE.md).
- Mehrfachauswahl (Rahmen ziehen) noch nicht vorhanden.
- Daten liegen nur lokal im Browser (kein Sync zwischen Geräten). Abspielen auf dem Smartphone setzt voraus, dass die Übung dort importiert wurde (JSON).
- Verknüpfte Wege werden beim Löschen eines Spielers nur entkoppelt, nicht mitgelöscht.

## Nächste Schritte

1. Mehrfachauswahl + Gruppieren, Ausrichten/Verteilen.
2. Teilen per Link (erfordert Backend): API-Routen + `ApiRepository`, PostgreSQL, Benutzerkonten.
3. PWA (Offline-Installation auf dem Smartphone).
4. Weitere Vorlagen und Altersklassen-Presets (Funino, 3 gegen 3).
5. Optional ffmpeg.wasm als Fallback für MP4 in Firefox.
