import { useEffect, useRef, useState } from "react";

interface Props {
  totalRupees: number;
  onBack: () => void;
}

const RATE = 0.005; // ₹ per point
const MIN_POINTS = 3000;
const MAX_POINTS = 120000;
const STEP = 100;

function pointsToRupees(pts: number): number {
  return pts * RATE;
}

export default function PointsConverterPage({ totalRupees, onBack }: Props) {
  const userPoints = Math.floor(totalRupees);
  const [inputValue, setInputValue] = useState(String(userPoints));
  const highlightRef = useRef<HTMLTableRowElement>(null);

  const parsed = Number.parseInt(inputValue, 10);
  const calcResult =
    !Number.isNaN(parsed) && parsed >= 0 ? pointsToRupees(parsed) : null;

  // Build rows array
  const rows: { pts: number; rupees: number }[] = [];
  for (let pts = MIN_POINTS; pts <= MAX_POINTS; pts += STEP) {
    rows.push({ pts, rupees: pointsToRupees(pts) });
  }

  const nearestHundred = Math.round(userPoints / 100) * 100;
  const highlightPts =
    nearestHundred >= MIN_POINTS ? nearestHundred : MIN_POINTS;

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }
  }, []);

  const headerStyle: React.CSSProperties = {
    position: "sticky",
    top: 0,
    background: "linear-gradient(135deg, #1e0533 0%, #2d0a4e 100%)",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    borderBottom: "2px solid #fbbf24",
    boxShadow: "0 4px 20px rgba(251,191,36,0.25)",
    zIndex: 10,
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background:
          "linear-gradient(180deg, #0f0218 0%, #1a0330 50%, #0f0218 100%)",
        color: "white",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        paddingBottom: 70,
      }}
    >
      {/* Header */}
      <div style={headerStyle}>
        <button
          type="button"
          data-ocid="points_converter.close_button"
          onClick={onBack}
          style={{
            background: "linear-gradient(135deg, #4c1d95, #7c3aed)",
            border: "2px solid #a78bfa",
            borderRadius: 12,
            color: "white",
            fontWeight: 800,
            fontSize: "0.85rem",
            padding: "6px 14px",
            cursor: "pointer",
            boxShadow: "0 0 12px rgba(139,92,246,0.5)",
            whiteSpace: "nowrap",
          }}
        >
          ◀ Back
        </button>
        <h1
          style={{
            flex: 1,
            textAlign: "center",
            margin: 0,
            fontSize: "1.25rem",
            fontWeight: 900,
            letterSpacing: "0.12em",
            background:
              "linear-gradient(90deg, #fbbf24, #f59e0b, #ef4444, #a855f7, #3b82f6, #22c55e, #fbbf24)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textTransform: "uppercase",
          }}
        >
          🔄 Points Converter
        </h1>
      </div>

      <div
        style={{
          padding: "16px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Current Points Badge */}
        <div
          style={{
            background: "linear-gradient(135deg, #1c0535, #2d0a4e)",
            border: "2px solid #fbbf24",
            borderRadius: 16,
            padding: "16px 20px",
            textAlign: "center",
            boxShadow:
              "0 0 24px rgba(251,191,36,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <div
            style={{
              fontSize: "0.7rem",
              color: "#fde68a",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Your Current Points
          </div>
          <div
            style={{
              fontSize: "2.5rem",
              fontWeight: 900,
              color: "#FCD34D",
              textShadow: "0 0 20px #FCD34DAA",
              letterSpacing: "0.04em",
            }}
          >
            {userPoints.toLocaleString()}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#a78bfa", marginTop: 4 }}>
            Worth ₹{pointsToRupees(userPoints).toFixed(2)}
          </div>
        </div>

        {/* Live Calculator */}
        <div
          style={{
            background: "linear-gradient(135deg, #1c0535, #2d0a4e)",
            border: "3px solid #fbbf24",
            borderRadius: 16,
            padding: "16px 20px",
            boxShadow:
              "0 0 30px rgba(251,191,36,0.4), 0 0 60px rgba(124,58,237,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              color: "#fbbf24",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: 12,
              fontWeight: 800,
              textShadow: "0 0 12px rgba(251,191,36,0.6)",
            }}
          >
            💰 POINTS CALCULATOR
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              data-ocid="points_converter.input"
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter points..."
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.08)",
                border: "2px solid #7c3aed",
                borderRadius: 10,
                padding: "12px 16px",
                color: "white",
                fontSize: "1.1rem",
                fontWeight: 700,
                outline: "none",
              }}
            />
            <div style={{ fontSize: "1.4rem", color: "#fbbf24" }}>→</div>
            <div
              style={{
                flex: 1,
                background: "rgba(251,191,36,0.1)",
                border:
                  calcResult !== null
                    ? "2px solid #fbbf24"
                    : "2px solid #fbbf24",
                borderRadius: 10,
                padding: "12px 16px",
                color: "#FCD34D",
                fontSize: "1.1rem",
                fontWeight: 900,
                textAlign: "center",
                textShadow:
                  calcResult !== null
                    ? "0 0 16px #FCD34DCC"
                    : "0 0 10px #FCD34D88",
                boxShadow:
                  calcResult !== null
                    ? "0 0 20px rgba(251,191,36,0.4)"
                    : "none",
              }}
            >
              {calcResult !== null ? `₹${calcResult.toFixed(2)}` : "—"}
            </div>
          </div>
          <div
            style={{
              fontSize: "0.7rem",
              color: "#9ca3af",
              marginTop: 10,
              textAlign: "center",
            }}
          >
            Rate: 100 points = ₹0.50
          </div>
        </div>

        {/* Conversion Chart */}
        <div
          style={{
            background: "linear-gradient(135deg, #1c0535, #2d0a4e)",
            border: "2px solid #4c1d95",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 0 20px rgba(76,29,149,0.3)",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid #4c1d95",
              fontSize: "0.75rem",
              color: "#c4b5fd",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontWeight: 700,
              background: "rgba(76,29,149,0.3)",
            }}
          >
            📊 Full Conversion Chart (3,000 – 1,20,000 pts)
          </div>
          <div
            style={{
              maxHeight: 400,
              overflowY: "auto",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    background: "rgba(76,29,149,0.5)",
                    position: "sticky",
                    top: 0,
                  }}
                >
                  <th
                    style={{
                      padding: "10px 16px",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      color: "#c4b5fd",
                      letterSpacing: "0.1em",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    Points
                  </th>
                  <th
                    style={{
                      padding: "10px 16px",
                      textAlign: "right",
                      fontSize: "0.75rem",
                      color: "#fde68a",
                      letterSpacing: "0.1em",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    You Receive (₹)
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const isHighlighted = row.pts === highlightPts;
                  return (
                    <tr
                      key={row.pts}
                      ref={isHighlighted ? highlightRef : undefined}
                      data-ocid={`points_converter.item.${i + 1}`}
                      style={{
                        background: isHighlighted
                          ? "linear-gradient(90deg, rgba(251,191,36,0.25), rgba(251,191,36,0.1))"
                          : i % 2 === 0
                            ? "rgba(255,255,255,0.02)"
                            : "transparent",
                        borderLeft: isHighlighted
                          ? "3px solid #fbbf24"
                          : "3px solid transparent",
                        transition: "background 0.2s",
                      }}
                    >
                      <td
                        style={{
                          padding: "7px 16px",
                          fontSize: "0.9rem",
                          fontWeight: isHighlighted ? 800 : 500,
                          color: isHighlighted ? "#FCD34D" : "#e5e7eb",
                        }}
                      >
                        {isHighlighted && "⭐ "}
                        {row.pts.toLocaleString()}
                      </td>
                      <td
                        style={{
                          padding: "7px 16px",
                          textAlign: "right",
                          fontSize: "0.9rem",
                          fontWeight: isHighlighted ? 800 : 600,
                          color: isHighlighted ? "#FCD34D" : "#86efac",
                          textShadow: isHighlighted
                            ? "0 0 8px #FCD34D88"
                            : "none",
                        }}
                      >
                        ₹{row.rupees.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Formula note */}
        <div
          style={{
            textAlign: "center",
            fontSize: "0.75rem",
            color: "#6b7280",
            padding: "4px 0 8px",
          }}
        >
          Formula: ₹ = Points × 0.005 &nbsp;|&nbsp; 1 point = ₹0.005
        </div>
      </div>
    </div>
  );
}
