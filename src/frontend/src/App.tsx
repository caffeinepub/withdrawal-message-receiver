import { useCallback, useEffect, useRef, useState } from "react";
import LeaderboardModal from "./LeaderboardModal";
import LoginScreen from "./LoginScreen";
import PointsConverterPage from "./PointsConverterPage";
import WithdrawalPage from "./WithdrawalPage";
import {
  type User,
  clearSession,
  getSavedSession,
  getUsers,
  saveSession,
  saveUsers,
  updateUserHighScore,
} from "./auth";

// ─── Constants ──────────────────────────────────────────────────────────────
const GRID_SIZE = 10;

// Candy Crush colors
const CANDY_COLORS = [
  "#FF2D55", // Red candy
  "#FF9500", // Orange candy
  "#FFD60A", // Yellow candy
  "#34C759", // Green candy
  "#007AFF", // Blue candy
  "#BF5AF2", // Purple candy
  "#FF375F", // Pink candy
  "#5AC8FA", // Teal
] as const;

const C = CANDY_COLORS;

const SHAPES = [
  { name: "I5H", cells: [[1, 1, 1, 1, 1]], color: C[4] },
  { name: "I5V", cells: [[1], [1], [1], [1], [1]], color: C[0] },
  { name: "I3H", cells: [[1, 1, 1]], color: C[3] },
  { name: "I3V", cells: [[1], [1], [1]], color: C[2] },
  {
    name: "O2",
    cells: [
      [1, 1],
      [1, 1],
    ],
    color: C[1],
  },
  {
    name: "O3",
    cells: [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ],
    color: C[5],
  },
  {
    name: "L",
    cells: [
      [1, 0],
      [1, 0],
      [1, 1],
    ],
    color: C[6],
  },
  {
    name: "J",
    cells: [
      [0, 1],
      [0, 1],
      [1, 1],
    ],
    color: C[7],
  },
  {
    name: "LR",
    cells: [
      [1, 1],
      [1, 0],
      [1, 0],
    ],
    color: C[4],
  },
  {
    name: "JR",
    cells: [
      [1, 1],
      [0, 1],
      [0, 1],
    ],
    color: C[0],
  },
  {
    name: "T",
    cells: [
      [1, 1, 1],
      [0, 1, 0],
    ],
    color: C[3],
  },
  {
    name: "TD",
    cells: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: C[2],
  },
  {
    name: "TL",
    cells: [
      [1, 0],
      [1, 1],
      [1, 0],
    ],
    color: C[1],
  },
  {
    name: "TR",
    cells: [
      [0, 1],
      [1, 1],
      [0, 1],
    ],
    color: C[5],
  },
  {
    name: "S",
    cells: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: C[6],
  },
  {
    name: "Z",
    cells: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: C[7],
  },
  {
    name: "CTL",
    cells: [
      [1, 1],
      [1, 0],
    ],
    color: C[4],
  },
  {
    name: "CTR",
    cells: [
      [1, 1],
      [0, 1],
    ],
    color: C[3],
  },
  {
    name: "CBL",
    cells: [
      [1, 0],
      [1, 1],
    ],
    color: C[1],
  },
  {
    name: "CBR",
    cells: [
      [0, 1],
      [1, 1],
    ],
    color: C[5],
  },
  { name: "D2", cells: [[1, 1]], color: C[7] },
] as const;

type Shape = (typeof SHAPES)[number];
type Grid = (string | null)[][];
type GameState =
  | "splash"
  | "auth"
  | "idle"
  | "loading"
  | "playing"
  | "gameover";

interface DragState {
  pieceIndex: number;
  piece: Shape;
  x: number;
  y: number;
  snapTarget?: { row: number; col: number } | null;
}

interface ScorePopup {
  id: number;
  value: number;
  x: number;
  y: number;
}

interface Sparkle {
  id: number;
  left: number;
  top: number;
  color: string;
  tx: string;
}

interface SweepLine {
  id: number;
  type: "row" | "col";
  index: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function makeEmptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
}
function randomPiece(): Shape {
  return SHAPES[Math.floor(Math.random() * SHAPES.length)];
}
function randomQueue(): [Shape, Shape, Shape] {
  return [randomPiece(), randomPiece(), randomPiece()];
}
function canPlace(grid: Grid, piece: Shape, row: number, col: number): boolean {
  for (let r = 0; r < piece.cells.length; r++) {
    for (let c = 0; c < piece.cells[r].length; c++) {
      if (piece.cells[r][c] === 1) {
        const gr = row + r;
        const gc = col + c;
        if (gr < 0 || gr >= GRID_SIZE || gc < 0 || gc >= GRID_SIZE)
          return false;
        if (grid[gr][gc] !== null) return false;
      }
    }
  }
  return true;
}
function hasAnyValidPlacement(grid: Grid, piece: Shape): boolean {
  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++)
      if (canPlace(grid, piece, r, c)) return true;
  return false;
}
function placePiece(grid: Grid, piece: Shape, row: number, col: number): Grid {
  const newGrid = grid.map((r) => [...r]);
  for (let r = 0; r < piece.cells.length; r++)
    for (let c = 0; c < piece.cells[r].length; c++)
      if (piece.cells[r][c] === 1) newGrid[row + r][col + c] = piece.color;
  return newGrid;
}
function findClearedLines(grid: Grid): { rows: number[]; cols: number[] } {
  const rows: number[] = [];
  const cols: number[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    const cells = grid[r];
    if (cells.every((c) => c !== null)) rows.push(r);
  }
  for (let c = 0; c < GRID_SIZE; c++) {
    const col = grid.map((row) => row[c]);
    if (col.every((c) => c !== null)) cols.push(c);
  }
  return { rows, cols };
}
function clearLines(grid: Grid, rows: number[], cols: number[]): Grid {
  const newGrid = grid.map((r) => [...r]);
  for (const r of rows)
    for (let c = 0; c < GRID_SIZE; c++) newGrid[r][c] = null;
  for (const c of cols)
    for (let r = 0; r < GRID_SIZE; r++) newGrid[r][c] = null;
  return newGrid;
}
const STEP_PTS = [2, 3, 5, 6, 9];
function calcScore(_rows: number[], _cols: number[]): number {
  return 0; // Points come from block placement steps, not line clears
}

function calcCellPx(): number {
  const vw = typeof window !== "undefined" ? window.innerWidth : 400;
  const raw = Math.floor((Math.min(vw, 400) - 32) / 10);
  return Math.min(40, Math.max(28, raw));
}

// ─── Candy color helpers ──────────────────────────────────────────────────
function lightenColor(hex: string): string {
  const map: Record<string, string> = {
    "#FF2D55": "#FF6B8A",
    "#FF9500": "#FFB84D",
    "#FFD60A": "#FFE566",
    "#34C759": "#6DDD8C",
    "#007AFF": "#4DA6FF",
    "#BF5AF2": "#D48AF6",
    "#FF375F": "#FF7294",
    "#5AC8FA": "#8DDCFC",
  };
  return map[hex] ?? hex;
}
function darkenColor(hex: string): string {
  const map: Record<string, string> = {
    "#FF2D55": "#CC0033",
    "#FF9500": "#CC6600",
    "#FFD60A": "#CC9900",
    "#34C759": "#1A7A35",
    "#007AFF": "#004FCC",
    "#BF5AF2": "#8822CC",
    "#FF375F": "#CC003D",
    "#5AC8FA": "#1A99CC",
  };
  return map[hex] ?? hex;
}

// ─── Sound ────────────────────────────────────────────────────────────────────
function playSound(type: "place" | "clear" | "gameover"): void {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === "place") {
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === "clear") {
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    }
  } catch (_) {}
}
function playArpeggio(): void {
  try {
    const ctx = new AudioContext();
    const notes = [400, 500, 650];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      const t = ctx.currentTime + i * 0.08;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.start(t);
      osc.stop(t + 0.12);
    });
  } catch (_) {}
}

const SPARK_COLORS = [...CANDY_COLORS];
const SPARK_DIRS = [
  { x: 0, y: -1 },
  { x: 0.7, y: -0.7 },
  { x: 1, y: 0 },
  { x: 0.7, y: 0.7 },
  { x: 0, y: 1 },
  { x: -0.7, y: 0.7 },
  { x: -1, y: 0 },
  { x: -0.7, y: -0.7 },
];

// ─── Floating block shapes for splash ─────────────────────────────────────
const FLOAT_BLOCKS = [
  { id: "fb-0", color: "#FF2D55", top: "5%", left: "8%", size: 22, delay: 0 },
  {
    id: "fb-1",
    color: "#FF9500",
    top: "12%",
    left: "80%",
    size: 18,
    delay: 0.4,
  },
  {
    id: "fb-2",
    color: "#34C759",
    top: "25%",
    left: "60%",
    size: 26,
    delay: 0.8,
  },
  {
    id: "fb-3",
    color: "#FFD60A",
    top: "40%",
    left: "5%",
    size: 20,
    delay: 1.2,
  },
  {
    id: "fb-4",
    color: "#007AFF",
    top: "55%",
    left: "88%",
    size: 24,
    delay: 0.2,
  },
  {
    id: "fb-5",
    color: "#BF5AF2",
    top: "65%",
    left: "15%",
    size: 16,
    delay: 0.6,
  },
  {
    id: "fb-6",
    color: "#FF375F",
    top: "75%",
    left: "70%",
    size: 22,
    delay: 1.0,
  },
  {
    id: "fb-7",
    color: "#5AC8FA",
    top: "85%",
    left: "40%",
    size: 18,
    delay: 0.3,
  },
  {
    id: "fb-8",
    color: "#FF9500",
    top: "90%",
    left: "5%",
    size: 20,
    delay: 0.7,
  },
  {
    id: "fb-9",
    color: "#34C759",
    top: "20%",
    left: "30%",
    size: 14,
    delay: 1.5,
  },
];

const ICON_COLORS = [
  "#FF2D55",
  "#FF9500",
  "#FFD60A",
  "#34C759",
  "#007AFF",
  "#BF5AF2",
] as const;

// ─── Main Component ──────────────────────────────────────────────────────────
export default function App() {
  const [gameState, setGameState] = useState<GameState>("splash");
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [grid, setGrid] = useState<Grid>(makeEmptyGrid());
  const [queue, setQueue] = useState<[Shape, Shape, Shape]>(randomQueue());
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [totalRupees, setTotalRupees] = useState(0);
  const [clearingCells, setClearingCells] = useState<Set<string>>(new Set());
  const [placedCells, setPlacedCells] = useState<Set<string>>(new Set());
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [hoverCell, setHoverCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [cellPx, setCellPx] = useState(calcCellPx);
  const [showWinCelebration, setShowWinCelebration] = useState(false);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [sweepLines, setSweepLines] = useState<SweepLine[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);
  const popupIdRef = useRef(0);
  const sparkleIdRef = useRef(0);
  const sweepIdRef = useRef(0);
  const stepIndexRef = useRef(0);
  const prevRupeesRef = useRef(0);
  const gridRef = useRef<Grid>(makeEmptyGrid());

  const cellPreviewPx = Math.max(16, Math.floor(cellPx * 0.62));

  const [view, setView] = useState<"game" | "withdraw" | "points">("game");

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    const OWNER = "ADARSH_CHAUDHARY_OWNER";
    const t = setTimeout(() => {
      // Read session at timeout time, not mount time
      const savedUser = getSavedSession();
      if (savedUser) {
        const users = getUsers();
        const user = users.find((u) => u.username === savedUser);
        if (user) {
          setCurrentUser(savedUser);
          setHighScore(user.highScore);
          setTotalRupees(user.rupees ?? 0);
          setGameState("idle");
          return;
        }
      }
      // Auto-login as ADARSH_CHAUDHARY_OWNER if no active session
      const users = getUsers();
      let ownerUser = users.find((u) => u.username === OWNER);
      if (!ownerUser) {
        const newOwner: User = {
          username: OWNER,
          email: "owner@blockcraft.local",
          passwordHash: "auto",
          highScore: 0,
          rupees: 3000,
          failedAttempts: 0,
          lockoutUntil: 0,
        };
        saveUsers([...users, newOwner]);
        ownerUser = newOwner;
      }
      // Ensure owner always has at least ₹3000 for testing
      if ((ownerUser.rupees ?? 0) < 3000) {
        const updatedOwner = { ...ownerUser, rupees: 3000 };
        saveUsers(users.map((u) => (u.username === OWNER ? updatedOwner : u)));
        ownerUser = updatedOwner;
      }
      setCurrentUser(OWNER);
      setHighScore(ownerUser.highScore);
      setTotalRupees(ownerUser.rupees ?? 0);
      saveSession(OWNER);
      setGameState("idle");
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onResize = () => setCellPx(calcCellPx());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (totalRupees >= 50 && prevRupeesRef.current < 50) {
      setShowWinCelebration(true);
      setTimeout(() => setShowWinCelebration(false), 3000);
    }
    prevRupeesRef.current = totalRupees;
  }, [totalRupees]);

  const getCellFromPointer = useCallback(
    (clientX: number, clientY: number): { row: number; col: number } | null => {
      if (!boardRef.current) return null;
      const rect = boardRef.current.getBoundingClientRect();
      const relX = clientX - rect.left - 8;
      const relY = clientY - rect.top - 8;
      const col = Math.floor(relX / cellPx);
      const row = Math.floor(relY / cellPx);
      if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE)
        return null;
      return { row, col };
    },
    [cellPx],
  );

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      const cx = e.clientX;
      const cy = e.clientY;
      // Compute snap target: find nearest valid grid position
      let snapTarget: { row: number; col: number } | null = null;
      if (boardRef.current && dragging) {
        const rect = boardRef.current.getBoundingClientRect();
        let bestDist = Number.POSITIVE_INFINITY;
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (canPlace(gridRef.current, dragging.piece, r, c)) {
              const centerX =
                rect.left +
                8 +
                (c + dragging.piece.cells[0].length / 2) * cellPx;
              const centerY =
                rect.top + 8 + (r + dragging.piece.cells.length / 2) * cellPx;
              const dist = Math.hypot(cx - centerX, cy - centerY);
              if (dist < bestDist) {
                bestDist = dist;
                snapTarget = { row: r, col: c };
              }
            }
          }
        }
      }
      setDragging((d) => (d ? { ...d, x: cx, y: cy, snapTarget } : null));
      const cell = getCellFromPointer(cx, cy);
      setHoverCell(cell);
    };
    const onUp = (e: PointerEvent) => {
      if (dragging && gameState === "playing") {
        // Use snapTarget if available
        if (dragging.snapTarget) {
          attemptPlace(
            dragging.pieceIndex,
            dragging.piece,
            dragging.snapTarget.row,
            dragging.snapTarget.col,
          );
        } else {
          // Fallback: offset search from cursor
          const cell = getCellFromPointer(e.clientX, e.clientY);
          if (cell) {
            const offsets = [
              [0, 0],
              [0, 1],
              [1, 0],
              [0, -1],
              [-1, 0],
              [1, 1],
              [1, -1],
              [-1, 1],
              [-1, -1],
            ];
            for (const [dr, dc] of offsets) {
              const tr = cell.row + dr;
              const tc = cell.col + dc;
              if (canPlace(gridRef.current, dragging.piece, tr, tc)) {
                attemptPlace(dragging.pieceIndex, dragging.piece, tr, tc);
                break;
              }
            }
          }
        }
      }
      setDragging(null);
      setHoverCell(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, gameState, getCellFromPointer, cellPx]); // eslint-disable-line react-hooks/exhaustive-deps

  const spawnSparkles = useCallback(
    (clearing: Set<string>) => {
      if (!boardRef.current) return;
      const newSparkles: Sparkle[] = [];
      const dist = cellPx * 1.8;
      for (const key of clearing) {
        const [r, c] = key.split(",").map(Number);
        const cellLeft = 8 + c * cellPx + cellPx / 2;
        const cellTop = 8 + r * cellPx + cellPx / 2;
        const dirs = SPARK_DIRS.filter(
          (_, i) => i % (clearing.size > 20 ? 2 : 1) === 0,
        ).slice(0, 6);
        for (const dir of dirs) {
          const color =
            SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)];
          const d = dist * (0.6 + Math.random() * 0.8);
          newSparkles.push({
            id: ++sparkleIdRef.current,
            left: cellLeft,
            top: cellTop,
            color,
            tx: `translate(${dir.x * d}px, ${dir.y * d}px)`,
          });
        }
      }
      setSparkles((prev) => [...prev, ...newSparkles]);
      setTimeout(() => {
        const ids = new Set(newSparkles.map((s) => s.id));
        setSparkles((prev) => prev.filter((s) => !ids.has(s.id)));
      }, 520);
    },
    [cellPx],
  );

  const spawnSweepLines = useCallback((rows: number[], cols: number[]) => {
    const newSweeps: SweepLine[] = [
      ...rows.map((index) => ({
        id: ++sweepIdRef.current,
        type: "row" as const,
        index,
      })),
      ...cols.map((index) => ({
        id: ++sweepIdRef.current,
        type: "col" as const,
        index,
      })),
    ];
    setSweepLines((prev) => [...prev, ...newSweeps]);
    setTimeout(() => {
      const ids = new Set(newSweeps.map((s) => s.id));
      setSweepLines((prev) => prev.filter((s) => !ids.has(s.id)));
    }, 200);
  }, []);

  const showPlacementPopup = useCallback(
    (pts: number, row: number, col: number, _color: string) => {
      if (!boardRef.current) return;
      const rect = boardRef.current.getBoundingClientRect();
      const px = rect.left + col * cellPx;
      const py = rect.top + row * cellPx;
      const popup: ScorePopup = {
        id: ++popupIdRef.current,
        value: pts,
        x: px,
        y: py,
      };
      setScorePopups((prev) => [...prev, popup]);
      setTimeout(() => {
        setScorePopups((prev) => prev.filter((p) => p.id !== popup.id));
      }, 900);
    },
    [cellPx],
  );

  const attemptPlace = useCallback(
    (pieceIndex: number, piece: Shape, row: number, col: number) => {
      const placementPts = STEP_PTS[stepIndexRef.current % STEP_PTS.length];
      stepIndexRef.current += 1;
      setGrid((currentGrid) => {
        if (!canPlace(currentGrid, piece, row, col)) return currentGrid;
        playSound("place");
        const placed = placePiece(currentGrid, piece, row, col);
        const newPlaced = new Set<string>();
        for (let r = 0; r < piece.cells.length; r++)
          for (let c = 0; c < piece.cells[r].length; c++)
            if (piece.cells[r][c] === 1) newPlaced.add(`${row + r},${col + c}`);
        setPlacedCells(newPlaced);
        setTimeout(() => setPlacedCells(new Set()), 200);
        const { rows, cols } = findClearedLines(placed);
        const lineClearPts = calcScore(rows, cols);
        if (rows.length > 0 || cols.length > 0) {
          playSound("clear");
          if (rows.length + cols.length >= 2) playArpeggio();
          const clearing = new Set<string>();
          for (const r of rows)
            for (let c = 0; c < GRID_SIZE; c++) clearing.add(`${r},${c}`);
          for (const c of cols)
            for (let r = 0; r < GRID_SIZE; r++) clearing.add(`${r},${c}`);
          spawnSweepLines(rows, cols);
          setTimeout(() => spawnSparkles(clearing), 100);
          setClearingCells(clearing);
          const totalPts = placementPts + lineClearPts;
          showPlacementPopup(totalPts, row, col, piece.color);
          setTimeout(() => {
            const cleared = clearLines(placed, rows, cols);
            setClearingCells(new Set());
            setQueue((currentQueue) => {
              const newQueue = [...currentQueue] as [Shape, Shape, Shape];
              newQueue[pieceIndex] = randomPiece();
              const isOver = newQueue.every(
                (p) => !hasAnyValidPlacement(cleared, p),
              );
              if (isOver) {
                setGameState("gameover");
                playSound("gameover");
                setTotalRupees((r) => Math.max(0, r - 10));
                setTimeout(() => setShowLeaderboard(true), 1200);
              }
              setScore((s) => {
                const ns = s + totalPts;
                setHighScore((h) => {
                  const nh = Math.max(h, ns);
                  return nh;
                });
                setTotalRupees((r) => (isOver ? r : r + totalPts * 0.1));
                if (isOver && currentUser) {
                  updateUserHighScore(
                    currentUser,
                    ns,
                    Math.max(0, totalRupees - 10),
                  );
                }
                return ns;
              });
              return newQueue;
            });
            setGrid(cleared);
          }, 420);
          return placed;
        }
        showPlacementPopup(placementPts, row, col, piece.color);
        setScore((s) => {
          const ns = s + placementPts;
          setHighScore((h) => {
            const nh = Math.max(h, ns);
            return nh;
          });
          setTotalRupees((r) => r + placementPts * 0.1);
          return ns;
        });
        setQueue((currentQueue) => {
          const newQueue = [...currentQueue] as [Shape, Shape, Shape];
          newQueue[pieceIndex] = randomPiece();
          const isOver = newQueue.every(
            (p) => !hasAnyValidPlacement(placed, p),
          );
          if (isOver) {
            setGameState("gameover");
            playSound("gameover");
            setTotalRupees((r) => Math.max(0, r - 10));
            setTimeout(() => setShowLeaderboard(true), 1200);
            // Save score - read from ref since state is stale here
            if (currentUser) {
              setScore((finalScore) => {
                updateUserHighScore(
                  currentUser,
                  finalScore + placementPts,
                  Math.max(0, totalRupees - 10),
                );
                return finalScore + placementPts;
              });
            }
          }
          return newQueue;
        });
        return placed;
      });
    },
    [
      spawnSparkles,
      spawnSweepLines,
      showPlacementPopup,
      currentUser,
      totalRupees,
    ], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const startGame = () => {
    setGameState("loading");
    setTimeout(() => {
      setGrid(makeEmptyGrid());
      setQueue(randomQueue());
      setScore(0);
      setClearingCells(new Set());
      setPlacedCells(new Set());
      setSparkles([]);
      setSweepLines([]);
      setDragging(null);
      setHoverCell(null);
      setGameState("playing");
    }, 1500);
  };

  const hoverPlacement =
    hoverCell && dragging
      ? {
          valid: canPlace(grid, dragging.piece, hoverCell.row, hoverCell.col),
          cells: (() => {
            const s = new Set<string>();
            if (!hoverCell || !dragging) return s;
            for (let r = 0; r < dragging.piece.cells.length; r++)
              for (let c = 0; c < dragging.piece.cells[r].length; c++)
                if (dragging.piece.cells[r][c] === 1)
                  s.add(`${hoverCell.row + r},${hoverCell.col + c}`);
            return s;
          })(),
        }
      : null;

  const snapPlacement = dragging?.snapTarget
    ? (() => {
        const s = new Set<string>();
        const { row, col } = dragging.snapTarget;
        for (let r = 0; r < dragging.piece.cells.length; r++)
          for (let c = 0; c < dragging.piece.cells[r].length; c++)
            if (dragging.piece.cells[r][c] === 1)
              s.add(`${row + r},${col + c}`);
        return s;
      })()
    : null;

  const currentYear = new Date().getFullYear();
  const queueSlotKeys = ["slot-0", "slot-1", "slot-2"] as const;
  const dismissSplash = () => setGameState("auth");

  const handleLogin = (username: string) => {
    setCurrentUser(username);
    const users = getUsers();
    const user = users.find((u) => u.username === username);
    if (user) {
      setHighScore(user.highScore);
      setTotalRupees(user.rupees ?? 0);
    }
    saveSession(username);
    setGameState("idle");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setHighScore(0);
    setScore(0);
    setTotalRupees(0);
    setGrid(makeEmptyGrid());
    clearSession();
    setGameState("auth");
  };

  // ─── Splash Screen ──────────────────────────────────────────────────────
  if (gameState === "splash") {
    return (
      <button
        type="button"
        className="splash-screen"
        aria-label="Tap to play"
        style={{
          position: "fixed",
          inset: 0,
          background:
            "linear-gradient(160deg, #3b1f6e 0%, #1a0a3d 60%, #0d0520 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          cursor: "pointer",
          zIndex: 9999,
        }}
        onClick={dismissSplash}
      >
        {/* Spinning stars */}
        <div
          className="star-bg"
          style={{
            position: "absolute",
            fontSize: "8rem",
            color: "#BF5AF2",
            top: "10%",
            left: "5%",
            animationDuration: "8s",
            animationDelay: "0s",
            pointerEvents: "none",
          }}
        >
          ✦
        </div>
        <div
          className="star-bg"
          style={{
            position: "absolute",
            fontSize: "5rem",
            color: "#FF9500",
            top: "60%",
            left: "75%",
            animationDuration: "12s",
            animationDelay: "2s",
            pointerEvents: "none",
          }}
        >
          ✦
        </div>
        <div
          className="star-bg"
          style={{
            position: "absolute",
            fontSize: "11rem",
            color: "#007AFF",
            top: "35%",
            left: "50%",
            animationDuration: "10s",
            animationDelay: "4s",
            pointerEvents: "none",
          }}
        >
          ✦
        </div>

        {/* Floating candy blocks */}
        {FLOAT_BLOCKS.map((b) => (
          <div
            key={b.id}
            className="float-block"
            style={{
              position: "absolute",
              top: b.top,
              left: b.left,
              width: b.size,
              height: b.size,
              borderRadius: 6,
              background: `linear-gradient(145deg, ${lightenColor(b.color)}, ${b.color}, ${darkenColor(b.color)})`,
              animationDelay: `${b.delay}s`,
              boxShadow: `0 0 18px ${b.color}, 0 0 36px ${b.color}66`,
            }}
          />
        ))}

        <div
          className="splash-content"
          style={{ textAlign: "center", zIndex: 1 }}
        >
          <div
            className="splash-welcome"
            style={{
              fontSize: "clamp(3rem, 15vw, 5.5rem)",
              fontWeight: 900,
              letterSpacing: "0.15em",
              lineHeight: 1.05,
              background:
                "linear-gradient(90deg, #FF2D55, #FF9500, #FFD60A, #34C759, #007AFF, #BF5AF2)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontFamily: "BricolageGrotesque, sans-serif",
            }}
          >
            WELCOME
          </div>
          <div
            className="splash-users"
            style={{
              fontSize: "clamp(2.5rem, 12vw, 4.5rem)",
              fontWeight: 900,
              letterSpacing: "0.2em",
              lineHeight: 1.05,
              background:
                "linear-gradient(90deg, #BF5AF2, #FF375F, #FF9500, #FFD60A)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontFamily: "BricolageGrotesque, sans-serif",
              marginBottom: "2rem",
            }}
          >
            USERS
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              marginBottom: "2rem",
            }}
          >
            {ICON_COLORS.map((c, idx) => (
              <div
                key={c}
                className="splashBlockBounce"
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 5,
                  background: `linear-gradient(145deg, ${lightenColor(c)}, ${c}, ${darkenColor(c)})`,
                  boxShadow: `0 0 14px ${c}, 0 0 28px ${c}88`,
                  animation: "splashBlockBounce 1.2s ease-in-out infinite",
                  animationDelay: `${idx * 0.12}s`,
                }}
              />
            ))}
          </div>

          <div
            style={{
              fontSize: "0.8rem",
              color: "rgba(255,255,255,0.45)",
              letterSpacing: "0.12em",
              marginBottom: "0.3rem",
              textTransform: "uppercase",
            }}
          >
            Developed by
          </div>
          <div
            className="splash-dev"
            style={{
              fontSize: "clamp(1rem, 5vw, 1.5rem)",
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "#FFD60A",
              textShadow: "0 0 20px #FFD60AAA, 0 0 40px #FFD60A66",
              textTransform: "uppercase",
              marginBottom: "2.5rem",
            }}
          >
            ADARSH CHAUDHARY
          </div>

          <button
            type="button"
            className="tap-to-play"
            style={{
              background:
                "linear-gradient(180deg, #4ade80 0%, #16a34a 50%, #15803d 100%)",
              border: "2px solid #86efac",
              borderRadius: 24,
              padding: "14px 40px",
              color: "white",
              fontSize: "1.1rem",
              fontWeight: 900,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              textShadow: "0 2px 0 rgba(0,0,0,0.3)",
              boxShadow: "0 6px 0 #14532d, 0 8px 20px rgba(0,0,0,0.4)",
              cursor: "pointer",
            }}
          >
            TAP TO PLAY
          </button>
        </div>
      </button>
    );
  }

  if (gameState === "loading") {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "linear-gradient(160deg, #3b1f6e 0%, #1a0a3d 60%, #0d0520 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}
      >
        <div
          style={{
            fontSize: "clamp(2rem, 10vw, 3.5rem)",
            fontWeight: 900,
            letterSpacing: "0.15em",
            background:
              "linear-gradient(90deg, #FF2D55, #FF9500, #FFD60A, #34C759, #007AFF, #BF5AF2)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontFamily: "BricolageGrotesque, sans-serif",
            marginBottom: "2rem",
            textAlign: "center",
          }}
        >
          BLOCKCRAFT PUZZLE
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: "2rem" }}>
          {CANDY_COLORS.slice(0, 5).map((c, i) => (
            <div
              key={c}
              style={{
                width: 20,
                height: 20,
                borderRadius: 5,
                background: `linear-gradient(145deg, ${lightenColor(c)}, ${c}, ${darkenColor(c)})`,
                boxShadow: `0 0 14px ${c}`,
                animation: "splashBlockBounce 1.2s ease-in-out infinite",
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: "0.9rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          Loading...
        </div>
      </div>
    );
  }

  // ─── Main Game UI ────────────────────────────────────────────────────────
  if (view === "withdraw") {
    return (
      <WithdrawalPage
        totalRupees={totalRupees}
        onBack={() => setView("game")}
        onWithdraw={(amount) => {
          setTotalRupees((r) => Math.max(0, r - amount));
          if (currentUser) {
            updateUserHighScore(
              currentUser,
              score,
              Math.max(0, totalRupees - amount),
            );
          }
        }}
      />
    );
  }

  if (view === "points") {
    return (
      <PointsConverterPage
        totalRupees={totalRupees}
        onBack={() => setView("game")}
      />
    );
  }

  return (
    <>
      {gameState === "auth" && <LoginScreen onLogin={handleLogin} />}
      <LeaderboardModal
        open={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />
      {gameState !== "auth" && (
        <div
          className="min-h-screen flex flex-col no-select"
          style={{
            background:
              "linear-gradient(180deg, #3b1f6e 0%, #1a0a3d 40%, #0d0520 100%)",
            minHeight: "100vh",
            maxWidth: "100vw",
            overflowX: "hidden",
          }}
        >
          {/* Rupees Earnings Bar */}
          <div
            data-ocid="rupees.panel"
            style={{
              background: "linear-gradient(90deg, #78350f, #b45309, #78350f)",
              borderBottom: "2px solid #f59e0b",
              padding: "6px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <span
              style={{
                fontSize: "0.65rem",
                color: "#fde68a",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              YOUR POINTS
            </span>
            <span
              style={{
                fontSize: "1.5rem",
                fontWeight: 900,
                color: "#FCD34D",
                textShadow: "0 0 16px #FCD34DAA, 0 0 30px #FCD34D66",
                letterSpacing: "0.04em",
              }}
            >
              {Math.floor(totalRupees).toLocaleString()} PTS
            </span>
            <span
              style={{
                fontSize: "0.65rem",
                color: "#fde68a",
                letterSpacing: "0.1em",
              }}
            >
              BALANCE
            </span>
          </div>

          {/* Header */}
          <header style={{ padding: "10px 16px 4px", textAlign: "center" }}>
            {currentUser && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <button
                  type="button"
                  data-ocid="leaderboard.open_modal_button"
                  onClick={() => setShowLeaderboard(true)}
                  style={{
                    background: "linear-gradient(135deg, #78350f, #b45309)",
                    border: "1.5px solid #fcd34d",
                    borderRadius: 16,
                    padding: "4px 10px",
                    color: "#fcd34d",
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    letterSpacing: "0.05em",
                  }}
                >
                  🏆 Leaderboard
                </button>
                <span
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  👤 {currentUser}
                </span>
                <button
                  type="button"
                  data-ocid="auth.secondary_button"
                  onClick={handleLogout}
                  style={{
                    background: "rgba(239,68,68,0.15)",
                    border: "1px solid rgba(239,68,68,0.4)",
                    borderRadius: 16,
                    padding: "4px 10px",
                    color: "#fca5a5",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Logout
                </button>
              </div>
            )}
            <h1
              style={{
                fontSize: "clamp(1.4rem, 6vw, 2rem)",
                fontWeight: 900,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                background:
                  "linear-gradient(90deg, #FF2D55, #FF9500, #FFD60A, #34C759, #007AFF, #BF5AF2)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontFamily: "BricolageGrotesque, sans-serif",
                margin: 0,
              }}
            >
              BLOCKCRAFT PUZZLE
            </h1>
          </header>

          {/* Score bar */}
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              padding: "6px 16px",
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #6b21a8, #9333ea)",
                borderRadius: 20,
                padding: "6px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                minWidth: 80,
                boxShadow: "0 0 16px #9333ea66, 0 4px 8px rgba(0,0,0,0.3)",
              }}
            >
              <span
                style={{
                  fontSize: "0.6rem",
                  color: "rgba(255,255,255,0.75)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                Score
              </span>
              <span
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 900,
                  color: "#fff",
                  textShadow: "0 0 8px rgba(255,255,255,0.5)",
                }}
              >
                {score.toLocaleString()}
              </span>
            </div>
            <div
              style={{
                background: "linear-gradient(135deg, #92400e, #d97706)",
                borderRadius: 20,
                padding: "6px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                minWidth: 80,
                boxShadow: "0 0 16px #d9770666, 0 4px 8px rgba(0,0,0,0.3)",
              }}
            >
              <span
                style={{
                  fontSize: "0.6rem",
                  color: "rgba(255,255,255,0.75)",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                Best
              </span>
              <span
                style={{ fontSize: "1.4rem", fontWeight: 900, color: "#fff" }}
              >
                {highScore.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Main content */}
          <main
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "4px 16px 8px",
              gap: 10,
            }}
          >
            {/* Board with golden wooden frame */}
            <div
              style={{
                background:
                  "linear-gradient(135deg, #c8860a, #f5c842, #c8860a)",
                borderRadius: 20,
                padding: 6,
                boxShadow:
                  "0 0 30px #f5c84244, 0 8px 32px rgba(0,0,0,0.6), inset 0 2px 0 rgba(255,255,255,0.3)",
              }}
            >
              <div
                ref={boardRef}
                data-ocid="game.canvas_target"
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${GRID_SIZE}, ${cellPx}px)`,
                  gridTemplateRows: `repeat(${GRID_SIZE}, ${cellPx}px)`,
                  gap: "2px",
                  padding: "8px",
                  background: "#1a0840",
                  backgroundImage:
                    "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
                  backgroundSize: `${cellPx + 2}px ${cellPx + 2}px`,
                  borderRadius: 16,
                  boxShadow: "inset 0 0 30px rgba(0,0,0,0.6)",
                  touchAction: "none",
                  position: "relative",
                }}
              >
                {Array.from({ length: GRID_SIZE }, (_, row) =>
                  Array.from({ length: GRID_SIZE }, (_, col) => {
                    const key = `${row},${col}`;
                    const cellColor = grid[row][col];
                    const isClearing = clearingCells.has(key);
                    const isPlaced = placedCells.has(key);
                    const isHovered = hoverPlacement?.cells.has(key);
                    const isValidHover = hoverPlacement?.valid;
                    const isSnap = !isHovered && snapPlacement?.has(key);

                    let extraClass = "";
                    if (isClearing) extraClass = "cell-clearing";
                    else if (isPlaced && cellColor) extraClass = "cell-placed";
                    if (isHovered && isValidHover) extraClass += " hover-valid";
                    if (isSnap) extraClass += " snap-target";

                    if (isSnap) {
                      return (
                        <div
                          key={key}
                          className={extraClass}
                          style={{
                            width: cellPx - 2,
                            height: cellPx - 2,
                            borderRadius: 6,
                            background: `linear-gradient(145deg, ${dragging?.piece.color}55, ${dragging?.piece.color}33)`,
                            border: `2px solid ${dragging?.piece.color}`,
                            boxShadow: `0 0 12px ${dragging?.piece.color}aa, 0 0 24px ${dragging?.piece.color}55`,
                            opacity: 0.85,
                            animation:
                              "snapPulse 0.7s ease-in-out infinite alternate",
                            position: "relative",
                          }}
                        />
                      );
                    }

                    if (isHovered) {
                      const hoverColor = isValidHover ? "#34C759" : "#FF2D55";
                      const hoverLight = isValidHover ? "#6DDD8C" : "#FF6B8A";
                      const hoverDark = isValidHover ? "#1A7A35" : "#CC0033";
                      return (
                        <div
                          key={key}
                          className={extraClass}
                          style={{
                            width: cellPx - 2,
                            height: cellPx - 2,
                            borderRadius: 6,
                            background: `linear-gradient(145deg, ${hoverLight} 0%, ${hoverColor} 50%, ${hoverDark} 100%)`,
                            border: `2px solid ${hoverLight}`,
                            boxShadow: `0 4px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4), 0 0 10px ${hoverColor}88`,
                            opacity: 0.8,
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              borderRadius: 6,
                              background:
                                "radial-gradient(ellipse at 40% 25%, rgba(255,255,255,0.55) 0%, transparent 65%)",
                              pointerEvents: "none",
                            }}
                          />
                        </div>
                      );
                    }

                    if (cellColor) {
                      const light = lightenColor(cellColor);
                      const dark = darkenColor(cellColor);
                      return (
                        <div
                          key={key}
                          className={extraClass}
                          style={{
                            width: cellPx - 2,
                            height: cellPx - 2,
                            borderRadius: 6,
                            background: `linear-gradient(145deg, ${light} 0%, ${cellColor} 50%, ${dark} 100%)`,
                            border: `2px solid ${light}`,
                            boxShadow: `0 4px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4), 0 0 10px ${cellColor}88`,
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              borderRadius: 6,
                              background:
                                "radial-gradient(ellipse at 40% 25%, rgba(255,255,255,0.55) 0%, transparent 65%)",
                              pointerEvents: "none",
                            }}
                          />
                        </div>
                      );
                    }

                    return (
                      <div
                        key={key}
                        style={{
                          width: cellPx - 2,
                          height: cellPx - 2,
                          borderRadius: 4,
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      />
                    );
                  }),
                )}

                {/* Sweep lines */}
                {sweepLines.map((sweep) =>
                  sweep.type === "row" ? (
                    <div
                      key={sweep.id}
                      className="sweep-row"
                      style={
                        {
                          top: 8 + sweep.index * cellPx + cellPx / 2 - 1,
                          "--sweep-w": `${GRID_SIZE * cellPx + (GRID_SIZE - 1) * 2}px`,
                        } as React.CSSProperties
                      }
                    />
                  ) : (
                    <div
                      key={sweep.id}
                      className="sweep-col"
                      style={
                        {
                          left: 8 + sweep.index * cellPx + cellPx / 2 - 1,
                          "--sweep-h": `${GRID_SIZE * cellPx + (GRID_SIZE - 1) * 2}px`,
                        } as React.CSSProperties
                      }
                    />
                  ),
                )}

                {/* Sparkle particles */}
                {sparkles.map((spark) => (
                  <div
                    key={spark.id}
                    className="sparkle-particle"
                    style={
                      {
                        left: spark.left - 3,
                        top: spark.top - 3,
                        width: 8,
                        height: 8,
                        background: spark.color,
                        boxShadow: `0 0 8px ${spark.color}, 0 0 16px ${spark.color}88`,
                        "--spark-tx": spark.tx,
                      } as React.CSSProperties
                    }
                  />
                ))}

                {/* Game over overlay */}
                {gameState === "gameover" && (
                  <div
                    data-ocid="game.modal"
                    className="game-over-overlay absolute inset-0 flex flex-col items-center justify-center"
                    style={{
                      background: "rgba(10,3,30,0.92)",
                      backdropFilter: "blur(6px)",
                      borderRadius: 16,
                      zIndex: 10,
                    }}
                  >
                    <p
                      style={{
                        fontSize: "2rem",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "#FF2D55",
                        textShadow: "0 0 30px #FF2D55, 0 0 60px #FF2D5588",
                        marginBottom: 4,
                      }}
                    >
                      GAME OVER
                    </p>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "rgba(255,255,255,0.6)",
                        marginBottom: 4,
                      }}
                    >
                      Final Score
                    </p>
                    <p
                      style={{
                        fontSize: "2.5rem",
                        fontWeight: 900,
                        background:
                          "linear-gradient(90deg, #FF2D55, #FF9500, #FFD60A, #34C759, #007AFF, #BF5AF2)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        marginBottom: 4,
                      }}
                    >
                      {score.toLocaleString()}
                    </p>
                    <p
                      style={{
                        fontSize: "1rem",
                        color: "#FCD34D",
                        fontWeight: 700,
                        marginBottom: 20,
                      }}
                    >
                      {Math.floor(totalRupees).toLocaleString()} PTS earned
                    </p>
                    <button
                      type="button"
                      data-ocid="leaderboard.secondary_button"
                      onClick={() => setShowLeaderboard(true)}
                      style={{
                        background: "linear-gradient(135deg, #78350f, #b45309)",
                        border: "1.5px solid #fcd34d",
                        borderRadius: 20,
                        padding: "10px 24px",
                        color: "#fcd34d",
                        fontWeight: 800,
                        fontSize: "0.85rem",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        marginBottom: 8,
                      }}
                    >
                      🏆 Leaderboard
                    </button>
                    <button
                      type="button"
                      data-ocid="game.primary_button"
                      onClick={startGame}
                      style={{
                        background:
                          "linear-gradient(180deg, #4ade80 0%, #16a34a 50%, #15803d 100%)",
                        border: "2px solid #86efac",
                        borderRadius: 24,
                        padding: "12px 32px",
                        color: "white",
                        fontWeight: 900,
                        fontSize: "1rem",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        textShadow: "0 2px 0 rgba(0,0,0,0.3)",
                        boxShadow:
                          "0 6px 0 #14532d, 0 8px 20px rgba(0,0,0,0.4)",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.transform =
                          "translateY(2px)";
                        (e.currentTarget as HTMLButtonElement).style.boxShadow =
                          "0 4px 0 #14532d, 0 6px 16px rgba(0,0,0,0.4)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.transform =
                          "";
                        (e.currentTarget as HTMLButtonElement).style.boxShadow =
                          "0 6px 0 #14532d, 0 8px 20px rgba(0,0,0,0.4)";
                      }}
                    >
                      PLAY AGAIN
                    </button>
                  </div>
                )}

                {/* Idle overlay */}
                {gameState === "idle" && (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center"
                    style={{
                      background: "rgba(10,3,30,0.85)",
                      backdropFilter: "blur(4px)",
                      borderRadius: 16,
                      zIndex: 10,
                    }}
                  >
                    <p
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        background:
                          "linear-gradient(90deg, #FF2D55, #FF9500, #FFD60A, #34C759, #007AFF, #BF5AF2)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        marginBottom: 20,
                      }}
                    >
                      BLOCKCRAFT PUZZLE
                    </p>
                    <button
                      type="button"
                      data-ocid="game.primary_button"
                      onClick={startGame}
                      style={{
                        background:
                          "linear-gradient(180deg, #4ade80 0%, #16a34a 50%, #15803d 100%)",
                        border: "2px solid #86efac",
                        borderRadius: 24,
                        padding: "14px 40px",
                        color: "white",
                        fontWeight: 900,
                        fontSize: "1.1rem",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        textShadow: "0 2px 0 rgba(0,0,0,0.3)",
                        boxShadow:
                          "0 6px 0 #14532d, 0 8px 20px rgba(0,0,0,0.4)",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.transform =
                          "translateY(2px)";
                        (e.currentTarget as HTMLButtonElement).style.boxShadow =
                          "0 4px 0 #14532d";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.transform =
                          "";
                        (e.currentTarget as HTMLButtonElement).style.boxShadow =
                          "0 6px 0 #14532d, 0 8px 20px rgba(0,0,0,0.4)";
                      }}
                    >
                      START GAME
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Piece queue */}
            <div
              style={{
                border: "3px solid #9333ea",
                background: "rgba(88,28,135,0.4)",
                backdropFilter: "blur(10px)",
                borderRadius: 16,
                padding: "8px 16px",
                width: "100%",
                maxWidth: `${cellPx * GRID_SIZE + 30}px`,
                boxShadow: "0 0 20px #9333ea44",
              }}
            >
              <p
                style={{
                  fontSize: "0.6rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  background:
                    "linear-gradient(90deg, #FF2D55, #FF9500, #FFD60A)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  marginBottom: 8,
                  textAlign: "center",
                  fontWeight: 900,
                }}
              >
                Next Pieces
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  justifyContent: "space-around",
                }}
              >
                {queue.map((piece, idx) => (
                  <div
                    key={queueSlotKeys[idx]}
                    data-ocid={`queue.item.${idx + 1}`}
                    className="piece-float"
                    style={{
                      touchAction: "none",
                      opacity: dragging?.pieceIndex === idx ? 0.3 : 1,
                      transition: "opacity 0.15s",
                      cursor: "grab",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: 1,
                      animationDelay: `${idx * 0.3}s`,
                    }}
                    onPointerDown={(e) => {
                      if (gameState !== "playing") return;
                      e.preventDefault();
                      (e.target as Element).setPointerCapture(e.pointerId);
                      setDragging({
                        pieceIndex: idx,
                        piece,
                        x: e.clientX,
                        y: e.clientY,
                      });
                    }}
                  >
                    <PiecePreview piece={piece} cellSize={cellPreviewPx} />
                  </div>
                ))}
              </div>
            </div>

            {/* Restart button */}
            {gameState !== "idle" && (
              <button
                type="button"
                data-ocid="game.secondary_button"
                onClick={startGame}
                style={{
                  background:
                    "linear-gradient(180deg, #818cf8 0%, #4f46e5 100%)",
                  border: "2px solid #a5b4fc",
                  borderRadius: 20,
                  color: "white",
                  padding: "8px 28px",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  boxShadow: "0 4px 0 #3730a3, 0 6px 16px rgba(0,0,0,0.3)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    "translateY(2px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 2px 0 #3730a3";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = "";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 4px 0 #3730a3, 0 6px 16px rgba(0,0,0,0.3)";
                }}
              >
                Restart
              </button>
            )}

            {/* How to play */}
            <div
              style={{
                background: "rgba(88,28,135,0.2)",
                border: "1px solid rgba(147,51,234,0.3)",
                borderRadius: 12,
                padding: "8px 14px",
                fontSize: "0.7rem",
                color: "rgba(255,255,255,0.45)",
                lineHeight: 1.5,
                width: "100%",
                maxWidth: `${cellPx * GRID_SIZE + 30}px`,
              }}
            >
              <strong style={{ color: "rgba(147,51,234,0.9)" }}>
                How to play:
              </strong>{" "}
              Drag pieces onto the board. Fill complete rows or columns to clear
              them and earn ₹ rewards!
            </div>
          </main>

          {/* Floating ghost piece while dragging */}
          {dragging && (
            <div
              style={{
                position: "fixed",
                left:
                  dragging.x - (dragging.piece.cells[0].length * cellPx) / 2,
                top: dragging.y - (dragging.piece.cells.length * cellPx) / 2,
                pointerEvents: "none",
                zIndex: 1000,
                opacity: 0.9,
                filter: `drop-shadow(0 0 15px ${dragging.piece.color}) drop-shadow(0 0 30px ${dragging.piece.color}88)`,
              }}
            >
              <PiecePreview
                piece={dragging.piece}
                cellSize={cellPx - 2}
                ghost
              />
            </div>
          )}

          {/* Score popups */}
          {scorePopups.map((popup) => (
            <div
              key={popup.id}
              className="score-popup pointer-events-none fixed"
              style={{
                left: popup.x,
                top: popup.y,
                fontWeight: 900,
                fontSize: "1.6rem",
                zIndex: 2000,
                whiteSpace: "nowrap",
                background: "linear-gradient(90deg, #FFD60A, #FF9500)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 8px #FFD60AAA)",
              }}
            >
              ⭐ +{popup.value}
            </div>
          ))}

          {/* Win Celebration Overlay */}
          {showWinCelebration && (
            <div
              data-ocid="rupees.success_state"
              className="win-celebration"
              style={{
                position: "fixed",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 3000,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  background: "linear-gradient(135deg, #3b0764, #6b21a8)",
                  border: "3px solid #FCD34D",
                  borderRadius: 24,
                  padding: "24px 40px",
                  textAlign: "center",
                  boxShadow: "0 0 60px #FCD34DAA, 0 0 120px #9333ea66",
                }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🏆</div>
                <div
                  style={{
                    fontSize: "1.4rem",
                    fontWeight: 900,
                    color: "#FCD34D",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    textShadow: "0 0 20px #FCD34D",
                  }}
                >
                  BIG WIN!
                </div>
                <div
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: 900,
                    color: "#FCD34D",
                    textShadow: "0 0 30px #FCD34D",
                  }}
                >
                  {Math.floor(totalRupees).toLocaleString()} PTS EARNED!
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <footer
            style={{
              padding: "10px 16px",
              textAlign: "center",
              fontSize: "0.65rem",
              color: "rgba(255,255,255,0.25)",
            }}
          >
            <span
              style={{ color: "rgba(252,211,77,0.6)", letterSpacing: "0.05em" }}
            >
              Developed by ADARSH CHAUDHARY
            </span>
            <span style={{ margin: "0 6px", opacity: 0.3 }}>·</span>©{" "}
            {currentYear} Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "rgba(147,51,234,0.7)" }}
            >
              caffeine.ai
            </a>
          </footer>

          {/* Fixed Bottom Bar */}
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 500,
              borderTop: "2px solid #fbbf24",
              boxShadow:
                "0 -4px 20px rgba(251,191,36,0.4), 0 -2px 8px rgba(0,0,0,0.6)",
              display: "flex",
            }}
          >
            {/* Withdraw Button */}
            <button
              type="button"
              data-ocid="withdraw.open_modal_button"
              style={{
                flex: 1,
                background:
                  "linear-gradient(90deg, #78350f 0%, #b45309 40%, #d97706 60%, #b45309 80%, #78350f 100%)",
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer",
                border: "none",
                borderRight: "1px solid rgba(251,191,36,0.3)",
              }}
              onClick={() => setView("withdraw")}
              aria-label="Open withdrawal page"
            >
              <span style={{ fontSize: "1.2rem" }}>💰</span>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  lineHeight: 1.2,
                }}
              >
                <span
                  style={{
                    fontSize: "0.55rem",
                    color: "#fde68a",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  TOTAL EARNINGS
                </span>
                <span
                  style={{
                    fontSize: "1rem",
                    fontWeight: 900,
                    color: "#FCD34D",
                    textShadow: "0 0 12px #FCD34DAA",
                  }}
                >
                  {Math.floor(totalRupees).toLocaleString()} PTS
                </span>
              </div>
            </button>
            {/* Points Converter Button */}
            <button
              type="button"
              data-ocid="points_converter.open_modal_button"
              style={{
                flex: 1,
                background:
                  "linear-gradient(90deg, #1e1b4b 0%, #3730a3 40%, #4f46e5 60%, #3730a3 80%, #1e1b4b 100%)",
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer",
                border: "none",
              }}
              onClick={() => setView("points")}
              aria-label="Open points converter"
            >
              <span style={{ fontSize: "1.2rem" }}>🔄</span>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  lineHeight: 1.2,
                }}
              >
                <span
                  style={{
                    fontSize: "0.55rem",
                    color: "#c7d2fe",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  MY POINTS
                </span>
                <span
                  style={{
                    fontSize: "1rem",
                    fontWeight: 900,
                    color: "#a5b4fc",
                    textShadow: "0 0 12px #818cf888",
                  }}
                >
                  {Math.floor(totalRupees).toLocaleString()}
                </span>
              </div>
            </button>
          </div>
          {/* Spacer so footer content isn't hidden by fixed bar */}
          <div style={{ height: 70 }} />
        </div>
      )}
    </>
  );
}

// ─── PiecePreview component ───────────────────────────────────────────────────
function PiecePreview({
  piece,
  cellSize,
  ghost = false,
}: {
  piece: Shape;
  cellSize: number;
  ghost?: boolean;
}) {
  const rows = piece.cells.length;
  const cols = piece.cells[0].length;
  const light = lightenColor(piece.color);
  const dark = darkenColor(piece.color);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        gap: "2px",
      }}
    >
      {piece.cells.flatMap((row, r) =>
        row.map((cell, c) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: cells are positional and static
            key={`cell-${r}-${c}`}
            style={{
              width: cellSize,
              height: cellSize,
              borderRadius: Math.max(3, Math.floor(cellSize * 0.2)),
              background:
                cell === 1
                  ? ghost
                    ? `linear-gradient(145deg, ${light}, ${piece.color}, ${dark})`
                    : `linear-gradient(145deg, ${light} 0%, ${piece.color} 50%, ${dark} 100%)`
                  : "transparent",
              border: cell === 1 ? `1px solid ${light}` : "none",
              boxShadow:
                cell === 1
                  ? `0 4px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4), 0 0 ${ghost ? 12 : 6}px ${piece.color}88`
                  : "none",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {cell === 1 && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: Math.max(3, Math.floor(cellSize * 0.2)),
                  background:
                    "radial-gradient(ellipse at 40% 25%, rgba(255,255,255,0.55) 0%, transparent 65%)",
                  pointerEvents: "none",
                }}
              />
            )}
          </div>
        )),
      )}
    </div>
  );
}
