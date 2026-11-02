"use client";
import { useEffect, useRef } from "react";
import { Circle, Group, Transformer } from "react-konva";
import type Konva from "konva";
import type { Exercise } from "@/lib/model/schema";
import type { Frame, PoseMap } from "@/lib/animation/engine";
import { OBJECT_SPECS } from "@/lib/model/catalog";
import { PITCH_MARGIN } from "@/lib/model/pitch";
import { PitchLayer } from "./PitchLayer";
import { ObjectGraphic } from "./ObjectShape";
import { PathShape } from "./PathShape";
import type { Selection } from "@/store/editorStore";

export interface SceneHandlers {
  onSelect?: (sel: Selection) => void;
  onMoveObject?: (id: string, x: number, y: number) => void;
  onTransformObject?: (id: string, attrs: { x: number; y: number; rotation: number; width?: number; height?: number }) => void;
  onPathPoints?: (id: string, points: number[]) => void;
}

interface Props extends SceneHandlers {
  exercise: Exercise;
  frame: Frame;
  /** edit = interaktiv, play/static = nur Anzeige */
  mode: "edit" | "play" | "static";
  selection?: Selection;
  ghosts?: PoseMap | null;
  draggable?: boolean;
  snap?: boolean;
}

const snapTo = (v: number, on?: boolean) => (on ? Math.round(v * 2) / 2 : v);

export function BoardScene({
  exercise,
  frame,
  mode,
  selection,
  ghosts,
  draggable,
  snap,
  onSelect,
  onMoveObject,
  onTransformObject,
  onPathPoints,
}: Props) {
  const interactive = mode === "edit";
  const trRef = useRef<Konva.Transformer>(null);
  const nodeRefs = useRef(new Map<string, Konva.Group>());
  const phase = exercise.phases[frame.phaseIndex];

  const selectedObj = selection?.type === "object" ? exercise.objects.find((o) => o.id === selection.id) : undefined;
  const transformable = interactive && selectedObj && !selectedObj.locked && OBJECT_SPECS[selectedObj.kind].rotatable;

  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const node = transformable && selectedObj ? nodeRefs.current.get(selectedObj.id) : undefined;
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [transformable, selectedObj, frame]);

  // Zonen zuerst (unten), Bälle zuletzt (oben)
  const order = (k: string) => (k === "zone" ? 0 : k === "text" ? 3 : k === "ball" ? 2 : 1);
  const objects = [...exercise.objects].sort((a, b) => order(a.kind) - order(b.kind));

  const visiblePaths = phase ? phase.paths : [];

  return (
    <Group x={PITCH_MARGIN} y={PITCH_MARGIN}>
      <PitchLayer pitch={exercise.pitch} />

      {/* Geister: Positionen vor dem aktuellen Schritt */}
      {ghosts &&
        exercise.objects.map((o) => {
          const g = ghosts[o.id];
          const p = frame.poses[o.id];
          if (!g || !p || (Math.abs(g.x - p.x) < 0.05 && Math.abs(g.y - p.y) < 0.05)) return null;
          return (
            <Group key={`g-${o.id}`} x={g.x} y={g.y} rotation={g.rotation} opacity={0.32} listening={false}>
              <ObjectGraphic obj={o} />
            </Group>
          );
        })}

      {/* Zonen unter den Wegen */}
      {objects
        .filter((o) => o.kind === "zone")
        .map((o) => renderObject(o.id))}

      {visiblePaths.map((path) => (
        <PathShape
          key={path.id}
          path={path}
          progress={frame.pathProgress[path.id] ?? 1}
          selected={selection?.type === "path" && selection.id === path.id}
          listening={interactive}
          onSelect={interactive ? () => onSelect?.({ type: "path", id: path.id }) : undefined}
        />
      ))}

      {objects.filter((o) => o.kind !== "zone").map((o) => renderObject(o.id))}

      {/* Stützpunkte des gewählten Weges */}
      {interactive &&
        selection?.type === "path" &&
        visiblePaths
          .filter((p) => p.id === selection.id)
          .map((path) =>
            Array.from({ length: path.points.length / 2 }, (_, i) => (
              <Circle
                key={`${path.id}-${i}`}
                x={path.points[i * 2]}
                y={path.points[i * 2 + 1]}
                radius={0.38}
                fill="#ffffff"
                stroke="#00BFA6"
                strokeWidth={0.12}
                draggable
                onDragEnd={(e) => {
                  const pts = [...path.points];
                  pts[i * 2] = snapTo(e.target.x(), snap);
                  pts[i * 2 + 1] = snapTo(e.target.y(), snap);
                  onPathPoints?.(path.id, pts);
                }}
                onMouseEnter={(e) => {
                  const c = e.target.getStage()?.container();
                  if (c) c.style.cursor = "move";
                }}
                onMouseLeave={(e) => {
                  const c = e.target.getStage()?.container();
                  if (c) c.style.cursor = "";
                }}
              />
            )),
          )}

      {interactive && (
        <Transformer
          ref={trRef}
          rotateEnabled
          resizeEnabled={selectedObj?.kind === "zone"}
          keepRatio={false}
          ignoreStroke
          borderStroke="#00BFA6"
          anchorStroke="#00BFA6"
          anchorFill="#ffffff"
          anchorSize={10}
          anchorCornerRadius={3}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          flipEnabled={false}
        />
      )}
    </Group>
  );

  function renderObject(id: string) {
    const o = exercise.objects.find((x) => x.id === id);
    if (!o) return null;
    const pose = frame.poses[o.id] ?? { x: o.x, y: o.y, rotation: o.rotation };
    const isSel = selection?.type === "object" && selection.id === o.id;
    const canDrag = interactive && draggable && !o.locked;
    return (
      <Group
        key={o.id}
        ref={(n) => {
          if (n) nodeRefs.current.set(o.id, n);
          else nodeRefs.current.delete(o.id);
        }}
        x={pose.x}
        y={pose.y}
        rotation={pose.rotation}
        draggable={canDrag}
        listening={interactive}
        onMouseDown={(e) => {
          if (!interactive || !draggable) return;
          e.cancelBubble = true;
          onSelect?.({ type: "object", id: o.id });
        }}
        onTouchStart={(e) => {
          if (!interactive || !draggable) return;
          e.cancelBubble = true;
          onSelect?.({ type: "object", id: o.id });
        }}
        onDragEnd={(e) => {
          const n = e.target;
          const x = snapTo(n.x(), snap);
          const y = snapTo(n.y(), snap);
          n.position({ x, y });
          onMoveObject?.(o.id, x, y);
        }}
        onTransformEnd={(e) => {
          const n = e.target;
          const sx = n.scaleX();
          const sy = n.scaleY();
          n.scale({ x: 1, y: 1 });
          onTransformObject?.(o.id, {
            x: n.x(),
            y: n.y(),
            rotation: Math.round(n.rotation()),
            ...(o.kind === "zone" ? { width: (o.width ?? 10) * sx, height: (o.height ?? 8) * sy } : {}),
          });
        }}
        onMouseEnter={(e) => {
          const c = e.target.getStage()?.container();
          if (c && canDrag) c.style.cursor = "grab";
        }}
        onMouseLeave={(e) => {
          const c = e.target.getStage()?.container();
          if (c) c.style.cursor = "";
        }}
      >
        <ObjectGraphic obj={o} selected={isSel && !transformable} />
      </Group>
    );
  }
}
