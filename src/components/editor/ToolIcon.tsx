import type { ObjectKind, PathKind, Team } from "@/lib/model/schema";
import { TEAM_COLORS } from "@/lib/model/catalog";

/** Kleine SVG-Vorschau für Werkzeuge, angelehnt an die Darstellung auf dem Feld */
export function ObjectIcon({ kind, team, size = 22 }: { kind: ObjectKind; team?: Team; size?: number }) {
  const c = kind === "player" ? TEAM_COLORS[team ?? "A"] : undefined;
  const common = { width: size, height: size, viewBox: "0 0 24 24" };
  switch (kind) {
    case "player":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" fill={c} stroke="white" strokeWidth="1.5" />
          <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="700" fill={team === "N" ? "#111" : "#fff"}>
            {team === "B" ? "2" : team === "N" ? "N" : "1"}
          </text>
        </svg>
      );
    case "goalkeeper":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" fill="#16A34A" stroke="white" strokeWidth="1.5" />
          <text x="12" y="15.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="#fff">TW</text>
        </svg>
      );
    case "coach":
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="4" fill="#334155" />
          <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">T</text>
        </svg>
      );
    case "ball":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" fill="#fff" stroke="#111827" strokeWidth="1.3" />
          <polygon points="12,8.5 15.3,10.9 14,14.8 10,14.8 8.7,10.9" fill="#111827" />
        </svg>
      );
    case "cone":
      return (
        <svg {...common}>
          <polygon points="12,3.5 20.5,19.5 3.5,19.5" fill="#F97316" stroke="#c2410c" strokeWidth="1" />
          <line x1="9" y1="14" x2="15" y2="14" stroke="white" strokeWidth="1.6" />
        </svg>
      );
    case "marker":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" fill="#FACC15" stroke="#a16207" strokeWidth="1" />
          <circle cx="12" cy="12" r="3" fill="rgba(0,0,0,.25)" />
        </svg>
      );
    case "pole":
      return (
        <svg {...common}>
          <line x1="12" y1="2" x2="12" y2="22" stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="12" y1="7" x2="12" y2="10" stroke="white" strokeWidth="3.5" />
          <line x1="12" y1="14" x2="12" y2="17" stroke="white" strokeWidth="3.5" />
        </svg>
      );
    case "hurdle":
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="3.5" rx="1" fill="#3B82F6" />
          <rect x="4" y="7" width="2.4" height="12" fill="#1d4ed8" />
          <rect x="17.6" y="7" width="2.4" height="12" fill="#1d4ed8" />
        </svg>
      );
    case "ring":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7.5" fill="none" stroke="#A855F7" strokeWidth="3" />
        </svg>
      );
    case "minigoal":
    case "goal":
      return (
        <svg {...common}>
          <path d={kind === "goal" ? "M2 18V6h20v12" : "M5 18V9h14v9"} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d={kind === "goal" ? "M6 6v12M10 6v12M14 6v12M18 6v12M2 10h20M2 14h20" : "M9 9v9M13 9v9M17 9v9M5 13h14"} stroke="currentColor" strokeWidth=".7" opacity=".5" />
        </svg>
      );
    case "ladder":
      return (
        <svg {...common}>
          <rect x="2" y="8" width="20" height="8" fill="none" stroke="#EAB308" strokeWidth="1.6" />
          <path d="M6 8v8M10 8v8M14 8v8M18 8v8" stroke="#EAB308" strokeWidth="1.4" />
        </svg>
      );
    case "mannequin":
      return (
        <svg {...common}>
          <ellipse cx="12" cy="13" rx="9" ry="4" fill="#64748B" />
          <circle cx="12" cy="13" r="3" fill="#475569" stroke="white" strokeWidth="1" />
        </svg>
      );
    case "zone":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" fill="rgba(56,189,248,.25)" stroke="#38BDF8" strokeWidth="1.6" strokeDasharray="3 2" />
        </svg>
      );
    case "text":
      return (
        <svg {...common}>
          <text x="12" y="17" textAnchor="middle" fontSize="15" fontWeight="700" fill="currentColor">T</text>
        </svg>
      );
  }
}

export function PathIcon({ kind, size = 22 }: { kind: PathKind; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none" };
  const arrow = <path d="M16 5l4 1-1 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />;
  switch (kind) {
    case "run":
      return (
        <svg {...common}>
          <path d="M4 20L19 6" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 2.5" strokeLinecap="round" />
          {arrow}
        </svg>
      );
    case "pass":
      return (
        <svg {...common}>
          <path d="M4 20L19 6" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" />
          <path d="M16 5l4 1-1 4" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "dribble":
      return (
        <svg {...common}>
          <path d="M4 20c2-1 1-3 3-4s3 0 4-2 0-3 2-4 3 0 4-2l2-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          {arrow}
        </svg>
      );
    case "shot":
      return (
        <svg {...common}>
          <path d="M4 20L19 6" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
          <path d="M15.5 4.5l5 1-1 5" stroke="#EF4444" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}
