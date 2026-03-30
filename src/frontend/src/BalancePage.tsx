interface BalancePageProps {
  totalRupees: number;
  spinEarnings: number;
  onBack: () => void;
}

const CONVERSION_TIERS = [
  { pts: 3000, rupees: 5 },
  { pts: 6000, rupees: 10 },
  { pts: 12000, rupees: 20 },
  { pts: 18000, rupees: 30 },
  { pts: 30000, rupees: 50 },
  { pts: 60000, rupees: 100 },
  { pts: 90000, rupees: 150 },
  { pts: 120000, rupees: 200 },
];

export default function BalancePage({
  totalRupees,
  spinEarnings,
  onBack,
}: BalancePageProps) {
  const gameEarnings = Math.max(0, totalRupees - spinEarnings);
  const rupeesValue = totalRupees / 600;
  const spinRupeesValue = spinEarnings / 600;

  // Find current tier
  let currentTierIdx = -1;
  for (let i = 0; i < CONVERSION_TIERS.length; i++) {
    if (totalRupees >= CONVERSION_TIERS[i].pts) {
      currentTierIdx = i;
    }
  }

  const nextTier =
    currentTierIdx < CONVERSION_TIERS.length - 1
      ? CONVERSION_TIERS[currentTierIdx + 1]
      : null;
  const ptsToNext = nextTier ? nextTier.pts - totalRupees : 0;

  return (
    <div
      style={{
        minHeight: "100dvh",
        background:
          "linear-gradient(180deg, #0f0a2e 0%, #1a0a3e 40%, #0d1a3e 100%)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "sans-serif",
        color: "#fff",
        overflowY: "auto",
        paddingBottom: 20,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "2px solid rgba(251,191,36,0.3)",
          background: "rgba(0,0,0,0.4)",
        }}
      >
        <button
          type="button"
          data-ocid="balance.close_button"
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(251,191,36,0.4)",
            borderRadius: 8,
            color: "#fbbf24",
            padding: "6px 14px",
            fontSize: "0.85rem",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          ← Back
        </button>
        <div
          style={{
            fontSize: "1.1rem",
            fontWeight: 900,
            background: "linear-gradient(90deg, #fbbf24, #fff, #fbbf24)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "0.1em",
          }}
        >
          💰 MY BALANCE
        </div>
        <div style={{ width: 60 }} />
      </div>

      {/* Main balance card */}
      <div
        style={{
          margin: "16px",
          padding: "20px",
          borderRadius: 16,
          background:
            "linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(217,119,6,0.08) 100%)",
          border: "2px solid #fbbf24",
          boxShadow:
            "0 0 30px rgba(251,191,36,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "0.7rem",
            color: "#fde68a",
            letterSpacing: "0.2em",
            marginBottom: 6,
          }}
        >
          TOTAL POINTS BALANCE
        </div>
        <div
          style={{
            fontSize: "2.8rem",
            fontWeight: 900,
            color: "#fcd34d",
            textShadow: "0 0 20px rgba(252,211,77,0.7)",
            lineHeight: 1.1,
          }}
        >
          {Math.floor(totalRupees).toLocaleString()}
        </div>
        <div style={{ fontSize: "0.8rem", color: "#fde68a", marginBottom: 12 }}>
          pts
        </div>
        <div
          style={{
            fontSize: "1.6rem",
            fontWeight: 900,
            color: "#34C759",
            textShadow: "0 0 12px rgba(52,199,89,0.7)",
          }}
        >
          ≈ ₹{rupeesValue.toFixed(2)}
        </div>
        <div style={{ fontSize: "0.75rem", color: "#86efac", marginTop: 4 }}>
          at 3,000 pts = ₹5
        </div>
      </div>

      {/* Progress to next tier */}
      {nextTier && (
        <div
          style={{
            margin: "0 16px 16px",
            padding: "14px",
            borderRadius: 12,
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div
            style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: 8 }}
          >
            Next tier: {nextTier.pts.toLocaleString()} pts = ₹{nextTier.rupees}
          </div>
          <div
            style={{
              width: "100%",
              height: 8,
              background: "rgba(255,255,255,0.1)",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 4,
                background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
                width: `${Math.min(100, (totalRupees / nextTier.pts) * 100)}%`,
                transition: "width 0.5s ease",
                boxShadow: "0 0 8px rgba(251,191,36,0.6)",
              }}
            />
          </div>
          <div
            style={{
              fontSize: "0.7rem",
              color: "#fbbf24",
              marginTop: 6,
              textAlign: "right",
            }}
          >
            {Math.max(0, Math.floor(ptsToNext)).toLocaleString()} pts to next
            tier
          </div>
        </div>
      )}

      {/* Earnings breakdown */}
      <div
        style={{
          margin: "0 16px 16px",
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            background: "rgba(0,0,0,0.5)",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "#fbbf24",
            letterSpacing: "0.1em",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          📊 EARNINGS BREAKDOWN
        </div>
        {/* Game earnings */}
        <div
          style={{
            padding: "12px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(0,0,0,0.2)",
          }}
        >
          <div>
            <div
              style={{ fontSize: "0.85rem", fontWeight: 700, color: "#c7d2fe" }}
            >
              🎮 Game Points
            </div>
            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
              From block placements
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{ fontSize: "1rem", fontWeight: 900, color: "#a5b4fc" }}
            >
              {Math.floor(gameEarnings).toLocaleString()} pts
            </div>
            <div style={{ fontSize: "0.75rem", color: "#6366f1" }}>
              ≈ ₹{(gameEarnings / 600).toFixed(2)}
            </div>
          </div>
        </div>
        {/* Spin earnings */}
        <div
          style={{
            padding: "12px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(0,0,0,0.2)",
          }}
        >
          <div>
            <div
              style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fde68a" }}
            >
              🎰 Spin Earnings
            </div>
            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
              From spin wheel
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{ fontSize: "1rem", fontWeight: 900, color: "#fcd34d" }}
            >
              {Math.floor(spinEarnings).toLocaleString()} pts
            </div>
            <div style={{ fontSize: "0.75rem", color: "#f59e0b" }}>
              ≈ ₹{spinRupeesValue.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Minimum withdrawal notice */}
      <div
        style={{
          margin: "0 16px 16px",
          padding: "12px 14px",
          borderRadius: 12,
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.3)",
          fontSize: "0.8rem",
          color: "#fca5a5",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ fontSize: "1.2rem" }}>⚠️</span>
        <div>
          <span style={{ fontWeight: 700 }}>Minimum withdrawal: </span>
          3,000 points (₹5). You need{" "}
          {Math.max(0, 3000 - Math.floor(totalRupees)).toLocaleString()} more
          pts.
        </div>
      </div>

      {/* Conversion chart */}
      <div
        style={{
          margin: "0 16px 16px",
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div
          style={{
            padding: "10px 14px",
            background: "rgba(0,0,0,0.5)",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "#fbbf24",
            letterSpacing: "0.1em",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          📈 CONVERSION CHART
        </div>
        {CONVERSION_TIERS.map((tier, i) => {
          const isCurrentTier =
            totalRupees >= tier.pts &&
            (i === CONVERSION_TIERS.length - 1 ||
              totalRupees < CONVERSION_TIERS[i + 1].pts);
          return (
            <div
              key={tier.pts}
              style={{
                padding: "8px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: isCurrentTier
                  ? "rgba(251,191,36,0.15)"
                  : i % 2 === 0
                    ? "rgba(0,0,0,0.2)"
                    : "rgba(0,0,0,0.1)",
                borderLeft: isCurrentTier
                  ? "3px solid #fbbf24"
                  : "3px solid transparent",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <span
                style={{
                  fontSize: "0.85rem",
                  color: isCurrentTier ? "#fcd34d" : "#94a3b8",
                  fontWeight: isCurrentTier ? 700 : 400,
                }}
              >
                {tier.pts.toLocaleString()} pts
                {isCurrentTier && " 👈 YOU"}
              </span>
              <span
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  color: isCurrentTier ? "#fbbf24" : "#64748b",
                }}
              >
                ₹{tier.rupees}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          padding: "12px",
          fontSize: "0.7rem",
          color: "rgba(255,255,255,0.3)",
          marginTop: "auto",
        }}
      >
        2026. This game built for entertainment and earning purpose ❤️🤑
      </div>
    </div>
  );
}
