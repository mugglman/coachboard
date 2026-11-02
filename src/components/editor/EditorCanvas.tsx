"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Group, Layer, Line, Stage } from "react-konva";
import type Konva from "konva";
import { useEditor, isScrubbing } from "@/store/editorStore";
import { boardSize, PITCH_MARGIN } from "@/lib/model/pitch";
import { editFrame, frameAt, phaseStates } from "@/lib/animation/engine";
import { BoardScene } from "@/components/board/BoardScene";
import { PATH_SPECS } from "@/lib/model/catalog";
import { toFlat, type Pt } from "@/lib/geometry/path";
import type { ObjectKind, Team } from "@/lib/model/schema";

import { DND_MIME } from "./constants";

export default function EditorCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [size, setSize] = useState({ w: 800, h: 500 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [drawing, setDrawing] = useState<Pt[] | null>(null);
  const lastZoom = useRef(1);
  const userPanned = useRef(false);

  const exercise = useEditor((s) => s.exercise);
  const phaseIndex = useEditor((s) => s.phaseIndex);
  const time = useEditor((s) => s.time);
  const playing = useEditor((s) => s.playing);
  const tool = useEditor((s) => s.tool);
  const selection = useEditor((s) => s.selection);
  const zoom = useEditor((s) => s.zoom);
  const fitRequest = useEditor((s) => s.fitRequest);
  const onionSkin = useEditor((s) => s.onionSkin);
  const snap = useEditor((s) => s.snap);

  const format = exercise?.pitch.format ?? "7er";
  const board = boardSize(format);
  const fitScale = Math.max(0.5, Math.min(size.w / board.w, size.h / board.h) * 0.94);
  const scale = fitScale * zoom;

  // Containergröße beobachten
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: Math.max(100, Math.floor(width)), h: Math.max(100, Math.floor(height)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const center = useCallback(
    (z: number) => {
      const sc = fitScale * z;
      setPan({ x: (size.w - board.w * sc) / 2, y: (size.h - board.h * sc) / 2 });
    },
    [fitScale, size.w, size.h, board.w, board.h],
  );

  // Einpassen bei Größenänderung, Formatwechsel und auf Anforderung
  useEffect(() => {
    if (!userPanned.current || fitRequest) {
      center(useEditor.getState().zoom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w, size.h, format]);

  useEffect(() => {
    if (fitRequest === 0) return;
    userPanned.current = false;
    lastZoom.current = 1;
    useEditor.getState().setZoom(1);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Einpassen auf externe Anforderung
    center(1);
  }, [fitRequest, center]);

  // Zoom-Buttons: um die Bildmitte zoomen
  useEffect(() => {
    if (lastZoom.current === zoom) return;
    const old = fitScale * lastZoom.current;
    const next = fitScale * zoom;
    const cx = size.w / 2;
    const cy = size.h / 2;
    setPan((p) => ({ x: cx - ((cx - p.x) / old) * next, y: cy - ((cy - p.y) / old) * next }));
    lastZoom.current = zoom;
  }, [zoom, fitScale, size.w, size.h]);

  const states = useMemo(() => (exercise ? phaseStates(exercise) : null), [exercise]);
  const scrubbing = useEditor((s) => isScrubbing(s));
  const frame = useMemo(() => {
    if (!exercise || !states) return null;
    return scrubbing ? frameAt(exercise, time, states) : editFrame(exercise, phaseIndex, states);
  }, [exercise, states, scrubbing, time, phaseIndex]);

  const pointerMeters = (): Pt | null => {
    const st = stageRef.current;
    const p = st?.getRelativePointerPosition();
    if (!p) return null;
    return { x: p.x - PITCH_MARGIN, y: p.y - PITCH_MARGIN };
  };

  const editable = !playing && !scrubbing;

  const onStageDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!editable) {
      // Klick ins Feld beendet die Vorschau und kehrt in den Bearbeitungsmodus zurück
      const st = useEditor.getState();
      st.setPlaying(false);
      st.setPhaseIndex(st.phaseIndex);
      return;
    }
    const st = useEditor.getState();
    const p = pointerMeters();
    if (!p) return;
    if (tool.type === "place") {
      st.addObject(tool.kind, p.x, p.y, tool.team);
      return;
    }
    if (tool.type === "path") {
      setDrawing([p]);
      return;
    }
    if (tool.type === "select" && e.target === e.target.getStage()) st.select(null);
  };

  const onStageMove = () => {
    if (!drawing) return;
    const p = pointerMeters();
    if (!p) return;
    const last = drawing[drawing.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) > 0.25) setDrawing([...drawing, p]);
  };

  const onStageUp = () => {
    if (!drawing || tool.type !== "path") return;
    const id = useEditor.getState().addPath(tool.kind, drawing);
    setDrawing(null);
    if (id) useEditor.getState().setUi({ rightTab: "properties" });
  };

  const onWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const st = stageRef.current;
    const pointer = st?.getPointerPosition();
    if (!pointer) return;
    const factor = e.evt.deltaY > 0 ? 1 / 1.1 : 1.1;
    const z = Math.max(0.2, Math.min(5, zoom * factor));
    const old = scale;
    const next = fitScale * z;
    const mx = (pointer.x - pan.x) / old;
    const my = (pointer.y - pan.y) / old;
    lastZoom.current = z;
    userPanned.current = true;
    useEditor.getState().setZoom(z);
    setPan({ x: pointer.x - mx * next, y: pointer.y - my * next });
  };

  const onDrop = (e: React.DragEvent) => {
    const raw = e.dataTransfer.getData(DND_MIME);
    if (!raw) return;
    e.preventDefault();
    const st = stageRef.current;
    if (!st) return;
    st.setPointersPositions(e.nativeEvent);
    const p = pointerMeters();
    if (!p) return;
    const { kind, team } = JSON.parse(raw) as { kind: ObjectKind; team?: Team };
    useEditor.getState().setTool({ type: "select" });
    useEditor.getState().addObject(kind, p.x, p.y, team);
  };

  const cursor = tool.type === "pan" ? "grab" : tool.type === "select" ? "default" : "crosshair";

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-canvas"
      style={{ cursor, touchAction: "none" }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes(DND_MIME)) e.preventDefault();
      }}
      onDrop={onDrop}
      data-testid="editor-canvas"
    >
      {exercise && frame && (
        <Stage
          ref={stageRef}
          width={size.w}
          height={size.h}
          scaleX={scale}
          scaleY={scale}
          x={pan.x}
          y={pan.y}
          draggable={tool.type === "pan"}
          onDragEnd={(e) => {
            if (e.target === stageRef.current) {
              userPanned.current = true;
              setPan({ x: e.target.x(), y: e.target.y() });
            }
          }}
          onMouseDown={onStageDown}
          onTouchStart={onStageDown}
          onMouseMove={onStageMove}
          onTouchMove={onStageMove}
          onMouseUp={onStageUp}
          onTouchEnd={onStageUp}
          onWheel={onWheel}
        >
          <Layer>
            <BoardScene
              exercise={exercise}
              frame={frame}
              mode={editable ? "edit" : "play"}
              selection={selection}
              ghosts={editable && onionSkin && states ? states.before[phaseIndex] : null}
              draggable={tool.type === "select"}
              snap={snap}
              onSelect={(sel) => {
                useEditor.getState().select(sel);
              }}
              onMoveObject={(id, x, y) => useEditor.getState().moveObject(id, x, y)}
              onTransformObject={(id, a) => {
                const st = useEditor.getState();
                const obj = st.exercise?.objects.find((o) => o.id === id);
                if (!obj) return;
                if (obj.kind === "zone") st.resizeZone(id, a.x, a.y, a.width ?? 1, a.height ?? 1, a.rotation);
                else st.rotateObject(id, a.rotation);
              }}
              onPathPoints={(id, points) => useEditor.getState().updatePath(id, { points })}
            />
            {drawing && tool.type === "path" && (
              <Group x={PITCH_MARGIN} y={PITCH_MARGIN} listening={false}>
                <Line
                  points={toFlat(drawing)}
                  stroke={PATH_SPECS[tool.kind].color}
                  strokeWidth={0.18}
                  dash={PATH_SPECS[tool.kind].dash ?? undefined}
                  lineCap="round"
                  lineJoin="round"
                  opacity={0.8}
                />
              </Group>
            )}
          </Layer>
        </Stage>
      )}
      {!editable && (
        <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-slate-900/75 px-3 py-1 text-[12px] font-medium text-white">
          Vorschau – zum Bearbeiten ins Feld klicken
        </div>
      )}
    </div>
  );
}
