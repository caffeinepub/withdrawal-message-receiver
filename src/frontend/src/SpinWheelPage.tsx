import { useEffect, useRef, useState } from "react";

interface SpinWheelPageProps {
  username: string;
  spinTickets: number;
  onBack: () => void;
  onEarnTickets: (tickets: number) => void;
  onEarnPoints: (points: number) => void;
}

// Probabilities: 20pts=50%, 40pts=30%, 60pts=14%, 100pts=2.5%, 120pts=1.5%, ₹1=1%, ₹3=1%
const PRIZES = [
  {
    label: "20 pts",
    points: 20,
    isRupee: false,
    probability: 0.5,
    color: "#34C759",
    emoji: "🟢",
  },
  {
    label: "40 pts",
    points: 40,
    isRupee: false,
    probability: 0.3,
    color: "#FF9500",
    emoji: "🟠",
  },
  {
    label: "60 pts",
    points: 60,
    isRupee: false,
    probability: 0.14,
    color: "#007AFF",
    emoji: "🔵",
  },
  {
    label: "100 pts",
    points: 100,
    isRupee: false,
    probability: 0.025,
    color: "#FF2D55",
    emoji: "🔴",
  },
  {
    label: "120 pts",
    points: 120,
    isRupee: false,
    probability: 0.015,
    color: "#FFD60A",
    emoji: "🟡",
  },
  {
    label: "₹1",
    points: 0,
    rupees: 1,
    isRupee: true,
    probability: 0.01,
    color: "#BF5AF2",
    emoji: "💜",
  },
  {
    label: "₹3",
    points: 0,
    rupees: 3,
    isRupee: true,
    probability: 0.01,
    color: "#FF375F",
    emoji: "💎",
  },
];

function weightedRandom(): number {
  const r = Math.random();
  let cumulative = 0;
  for (let i = 0; i < PRIZES.length; i++) {
    cumulative += PRIZES[i].probability;
    if (r < cumulative) return i;
  }
  return PRIZES.length - 1;
}

export default function SpinWheelPage({
  username,
  spinTickets,
  onBack,
  onEarnTickets,
  onEarnPoints,
}: SpinWheelPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const currentAngleRef = useRef(0);
  const [result, setResult] = useState<(typeof PRIZES)[0] | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [adCountdown, setAdCountdown] = useState<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const segmentAngle = (2 * Math.PI) / PRIZES.length;

  function drawWheel(angle: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = cx - 8;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Outer glow ring
    const grad = ctx.createRadialGradient(cx, cy, r - 10, cx, cy, r + 8);
    grad.addColorStop(0, "rgba(251,191,36,0.8)");
    grad.addColorStop(1, "rgba(251,191,36,0)");
    ctx.beginPath();
    ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    for (let i = 0; i < PRIZES.length; i++) {
      const startAngle = angle + i * segmentAngle;
      const endAngle = startAngle + segmentAngle;
      const prize = PRIZES[i];

      // Segment fill
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = prize.color;
      ctx.fill();

      // Glossy overlay
      const glossGrad = ctx.createRadialGradient(
        cx + Math.cos(startAngle + segmentAngle / 2) * r * 0.5,
        cy + Math.sin(startAngle + segmentAngle / 2) * r * 0.5,
        0,
        cx,
        cy,
        r,
      );
      glossGrad.addColorStop(0, "rgba(255,255,255,0.25)");
      glossGrad.addColorStop(1, "rgba(0,0,0,0.1)");
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = glossGrad;
      ctx.fill();

      // Border line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(startAngle) * r, cy + Math.sin(startAngle) * r);
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${prize.label.length > 3 ? 11 : 13}px sans-serif`;
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 4;
      ctx.fillText(prize.label, r - 8, 4);
      ctx.restore();
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, Math.PI * 2);
    const centerGrad = ctx.createRadialGradient(cx - 6, cy - 6, 2, cx, cy, 24);
    centerGrad.addColorStop(0, "#fde68a");
    centerGrad.addColorStop(0.5, "#f59e0b");
    centerGrad.addColorStop(1, "#78350f");
    ctx.fillStyle = centerGrad;
    ctx.fill();
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 3;
    ctx.fillText("SPIN", cx, cy);
    ctx.shadowBlur = 0;
    ctx.textBaseline = "alphabetic";
  }

  useEffect(() => {
    drawWheel(currentAngle);
  });

  const handleSpin = () => {
    if (spinning || spinTickets <= 0) return;
    onEarnTickets(-1); // use 1 ticket
    setShowResult(false);
    setResult(null);
    setSpinning(true);

    const prizeIndex = weightedRandom();
    const prize = PRIZES[prizeIndex];
    const duration = 3000 + Math.random() * 2000;

    const totalRotation =
      Math.PI * 2 * (5 + Math.floor(Math.random() * 5)) -
      Math.PI / 2 -
      prizeIndex * segmentAngle -
      segmentAngle / 2 -
      (currentAngleRef.current % (Math.PI * 2));

    const startAngle = currentAngleRef.current;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - (1 - progress) ** 3;
      const newAngle = startAngle + totalRotation * eased;
      currentAngleRef.current = newAngle;
      setCurrentAngle(newAngle);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setResult(prize);
        setShowResult(true);
        // Credit reward: rupee prizes credit rupees directly, points prizes credit points
        if (prize.isRupee && prize.rupees) {
          // Credit rupees as points equivalent: pass negative value to signal rupee reward
          // We use a special encoding: rupee amount * -1000 to signal rupee credit
          onEarnPoints(-(prize.rupees * 1000));
        } else {
          onEarnPoints(prize.points);
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const handleWatchAd = () => {
    if (adCountdown !== null) return;
    setAdCountdown(15);
  };

  useEffect(() => {
    if (adCountdown === null) return;
    if (adCountdown === 0) {
      onEarnTickets(1);
      onEarnPoints(10);
      setAdCountdown(null);
      return;
    }
    const t = setTimeout(
      () => setAdCountdown((c) => (c !== null ? c - 1 : null)),
      1000,
    );
    return () => clearTimeout(t);
  }, [adCountdown, onEarnTickets, onEarnPoints]);

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
          data-ocid="spin.close_button"
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
        <div style={{ textAlign: "center" }}>
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
            🎰 SPIN WHEEL
          </div>
          <div style={{ fontSize: "0.7rem", color: "#a5b4fc" }}>
            Hi, {username}
          </div>
        </div>
        <div
          data-ocid="spin.ticket_panel"
          style={{
            background: "rgba(251,191,36,0.15)",
            border: "1px solid #fbbf24",
            borderRadius: 8,
            padding: "4px 10px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "1rem" }}>🎟️</div>
          <div
            style={{ fontSize: "0.9rem", fontWeight: 900, color: "#fbbf24" }}
          >
            {spinTickets}
          </div>
        </div>
      </div>

      {/* Wheel */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "16px 0 8px",
        }}
      >
        {/* Pointer */}
        <div style={{ position: "relative", width: 280, height: 280 }}>
          <div
            style={{
              position: "absolute",
              top: -14,
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "14px solid transparent",
              borderRight: "14px solid transparent",
              borderTop: "28px solid #fbbf24",
              filter: "drop-shadow(0 2px 6px rgba(251,191,36,0.8))",
              zIndex: 10,
            }}
          />
          <canvas
            ref={canvasRef}
            width={280}
            height={280}
            style={{
              borderRadius: "50%",
              boxShadow:
                "0 0 30px rgba(251,191,36,0.5), 0 0 60px rgba(251,191,36,0.2)",
            }}
          />
        </div>
      </div>

      {/* Result Banner */}
      {showResult && result && (
        <div
          data-ocid="spin.success_state"
          style={{
            margin: "0 16px 8px",
            padding: "12px",
            borderRadius: 12,
            background:
              "linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.05))",
            border: "2px solid #fbbf24",
            textAlign: "center",
            animation: "pulse 0.5s ease",
          }}
        >
          <div style={{ fontSize: "2rem" }}>🎉</div>
          <div
            style={{
              fontSize: "1.2rem",
              fontWeight: 900,
              color: result.color,
              textShadow: `0 0 12px ${result.color}`,
            }}
          >
            You won {result.label}!
          </div>
          <div style={{ fontSize: "0.8rem", color: "#a5b4fc", marginTop: 4 }}>
            {result.isRupee
              ? `₹${result.rupees} credited to your balance!`
              : `+${result.points} points added to your balance`}
          </div>
        </div>
      )}

      {/* Spin Button */}
      <div style={{ padding: "0 16px 8px" }}>
        <button
          type="button"
          data-ocid="spin.primary_button"
          onClick={handleSpin}
          disabled={spinning || spinTickets <= 0}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 12,
            fontSize: "1.1rem",
            fontWeight: 900,
            letterSpacing: "0.1em",
            cursor: spinning || spinTickets <= 0 ? "not-allowed" : "pointer",
            border: "2px solid #fbbf24",
            background:
              spinning || spinTickets <= 0
                ? "rgba(100,100,100,0.3)"
                : "linear-gradient(135deg, #b45309, #d97706, #f59e0b, #d97706, #b45309)",
            color: spinning || spinTickets <= 0 ? "#555" : "#fff",
            boxShadow:
              spinning || spinTickets <= 0
                ? "none"
                : "0 0 20px rgba(251,191,36,0.5), inset 0 1px 0 rgba(255,255,255,0.3)",
            transition: "all 0.2s",
          }}
        >
          {spinning
            ? "⏳ SPINNING..."
            : spinTickets <= 0
              ? "❌ NO TICKETS"
              : `🎰 SPIN (${spinTickets} 🎟️)`}
        </button>
      </div>

      {/* Watch Ad Button */}
      <div style={{ padding: "0 16px 8px" }}>
        <button
          type="button"
          data-ocid="spin.secondary_button"
          onClick={handleWatchAd}
          disabled={adCountdown !== null}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 12,
            fontSize: "0.95rem",
            fontWeight: 700,
            cursor: adCountdown !== null ? "not-allowed" : "pointer",
            border: "2px solid rgba(99,102,241,0.6)",
            background:
              adCountdown !== null
                ? "rgba(30,27,75,0.6)"
                : "linear-gradient(135deg, #1e1b4b, #3730a3, #4f46e5)",
            color: adCountdown !== null ? "#6366f1" : "#c7d2fe",
            boxShadow:
              adCountdown !== null ? "none" : "0 0 12px rgba(99,102,241,0.3)",
          }}
        >
          {adCountdown !== null
            ? `📺 Watching ad... ${adCountdown}s`
            : "📺 Watch Ad (+1 Ticket +10 pts)"}
        </button>
      </div>

      {/* Daily Tickets Info */}
      <div
        style={{
          margin: "0 16px 8px",
          padding: "10px 14px",
          borderRadius: 12,
          background: "rgba(16,185,129,0.1)",
          border: "1px solid rgba(16,185,129,0.3)",
          fontSize: "0.8rem",
          color: "#6ee7b7",
          lineHeight: 1.6,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 4 }}>
          🎟️ How to earn tickets:
        </div>
        <div>• Max 5 tickets per day from playing</div>
        <div>• Watch an ad to get 1 extra ticket + 10 pts</div>
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

      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0; }
          60% { transform: scale(1.02); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
