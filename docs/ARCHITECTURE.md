# Architekturentscheidungen

## Überblick

```
src/
  app/                 Next.js App Router (/, /editor, /play, /sessions) – reine Client-Seiten
  components/
    board/             Konva-Szene: Spielfeld, Objekte, Wege (rein darstellend, wiederverwendbar)
    editor/            Editor-UI: Toolbar, Seitenleisten, Timeline, Canvas, Hooks
    player/            Abspielansicht
    ui/                shadcn/ui-artige Basiskomponenten (Radix + Tailwind + cva)
  lib/
    model/             Zod-Schemas, Fabriken, Katalog, Spielfeldmaße, Vorlagen
    geometry/          Pfad-Geometrie (Glättung, Abtastung, Wellenlinie)
    animation/         Zeitbasierte Animationsengine
    db/                Dexie (IndexedDB), Repository-Interface, JSON-Transfer
    export/            Offscreen-Rendering, PNG/PDF/Video/JSON
  store/               Zustand-Store des Editors (inkl. Undo/Redo)
```

## Entscheidungen

1. **Koordinaten in Metern.** Alle Objekte und Wege werden in Metern relativ zur Spielfläche gespeichert. Darstellung, Zoom und Exportauflösung sind reine Skalierung. Spielfeldformate (11er, 9er, 7er, 5er, halbes Feld, freie Fläche) sind als Maßtabelle hinterlegt.
2. **Schritte = Keyframes.** Ein Schritt animiert vom Endzustand des vorherigen Schritts zu seinem Endzustand. Ein Schritt speichert nur Änderungen (`positions`) und Wege (`paths`). Wege mit `objectId` bestimmen die Endposition des Objekts; `carryId` führt beim Dribbling den Ball mit. Jeder Weg hat ein Zeitfenster `start/end` (0–1) und eine Easing-Funktion.
3. **Gleiche Geometrie für Anzeige und Animation.** Wege werden per Catmull-Rom-Spline abgetastet; die gezeichnete Linie und die Bewegungsbahn nutzen dieselben Punkte.
4. **Material ist statisch.** Hütchen, Tore usw. gelten in allen Schritten gleich; nur Spieler, Trainer und Bälle sind animierbar.
5. **Eine Render-Komponente für alles.** `BoardScene` rendert Editor, Abspielansicht und Exporte. Exporte nutzen eine Offscreen-Stage (`createOffscreenBoard`) in fester Auflösung, unabhängig vom Editor-Zoom.
6. **Undo/Redo über Snapshots.** Jede Änderung über `update()` erzeugt eine Kopie (`structuredClone`) – einfach und robust, bei der Datenmenge einer Übung unkritisch (max. 100 Schritte Historie).
7. **Persistenz über Repository-Interface.** UI spricht nur `Repository`. Aktuell `DexieRepository` (IndexedDB). Für PostgreSQL wird eine `ApiRepository`-Implementierung + API-Routen ergänzt; die Tabellen entsprechen den Zod-Schemas (`exercises`, `sessions`, später `users`/`teams`). `schemaVersion` ist für Migrationen vorgesehen.
8. **Video-Export.** Echtzeit-Aufnahme der Offscreen-Canvas per `MediaRecorder`. MP4 (H.264), wenn der Browser es nativ kann (aktuelles Chrome/Edge, Safari), sonst WebM. ffmpeg.wasm wurde bewusst **nicht** eingebaut: ca. 30 MB Download und benötigt Cross-Origin-Isolation (COOP/COEP-Header), was den Nutzen gegenüber nativer MP4-Aufnahme nicht rechtfertigt.
9. **PDF** über jsPDF mit Bildern je Schritt und Übungsinfos; Trainingseinheiten als PDF mit Ablaufplan.
10. **shadcn/ui:** Komponenten wurden im shadcn-Stil (Radix-Primitives + Tailwind + cva) direkt im Projekt angelegt statt über die CLI, um nur benötigte Bausteine mitzunehmen.
11. **Routing ohne dynamische Segmente** (`/editor?id=…`), damit die App vollständig statisch vorgerendert werden kann und später auch als reine statische Seite oder PWA auslieferbar ist.
