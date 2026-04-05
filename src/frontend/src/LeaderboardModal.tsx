import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getUsers } from "./auth";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function LeaderboardModal({ open, onClose }: Props) {
  const allUsers = getUsers()
    .sort((a, b) => b.highScore - a.highScore)
    .slice(0, 20);

  const medals: Record<number, string> = { 0: "🥇", 1: "🥈", 2: "🥉" };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        data-ocid="leaderboard.dialog"
        style={{
          background: "linear-gradient(180deg, #1e1043 0%, #0d0520 100%)",
          border: "2px solid #f5c842",
          borderRadius: 20,
          color: "white",
          maxWidth: 480,
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "24px 20px",
        }}
      >
        <DialogHeader>
          <DialogTitle
            style={{
              color: "#FCD34D",
              fontSize: "1.3rem",
              fontWeight: 900,
              letterSpacing: "0.15em",
              textAlign: "center",
              textTransform: "uppercase",
              textShadow: "0 0 20px #FCD34D88",
            }}
          >
            🏆 Leaderboard
          </DialogTitle>
        </DialogHeader>

        <p
          style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.4)",
            fontSize: "0.72rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Top 20 Players
        </p>

        {allUsers.length === 0 ? (
          <div
            data-ocid="leaderboard.empty_state"
            style={{
              textAlign: "center",
              padding: "32px 0",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: 8 }}>🎮</div>
            <p style={{ fontSize: "0.9rem" }}>No players yet. Be the first!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {/* Header row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "36px 1fr 90px",
                gap: 8,
                padding: "6px 10px",
                color: "rgba(255,255,255,0.4)",
                fontSize: "0.65rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                borderBottom: "1px solid rgba(245,200,66,0.2)",
              }}
            >
              <span>#</span>
              <span>Player</span>
              <span style={{ textAlign: "right" }}>High Score</span>
            </div>

            {allUsers.map((user, i) => (
              <div
                key={user.username}
                data-ocid={`leaderboard.item.${i + 1}` as string}
                style={{
                  display: "grid",
                  gridTemplateColumns: "36px 1fr 90px",
                  gap: 8,
                  padding: "8px 10px",
                  background:
                    i === 0
                      ? "linear-gradient(90deg, rgba(252,211,77,0.15), rgba(252,211,77,0.05))"
                      : i === 1
                        ? "linear-gradient(90deg, rgba(192,192,192,0.12), transparent)"
                        : i === 2
                          ? "linear-gradient(90deg, rgba(205,127,50,0.12), transparent)"
                          : i % 2 === 0
                            ? "rgba(255,255,255,0.03)"
                            : "transparent",
                  borderRadius: 10,
                  alignItems: "center",
                  border:
                    i < 3
                      ? `1px solid rgba(${i === 0 ? "252,211,77" : i === 1 ? "192,192,192" : "205,127,50"},0.25)`
                      : "1px solid transparent",
                }}
              >
                <span
                  style={{
                    fontSize: i < 3 ? "1.2rem" : "0.9rem",
                    fontWeight: 700,
                    color: i < 3 ? "#FCD34D" : "rgba(255,255,255,0.5)",
                  }}
                >
                  {medals[i] ?? `${i + 1}`}
                </span>
                <span
                  style={{
                    fontWeight: i < 3 ? 800 : 600,
                    color:
                      i === 0
                        ? "#FCD34D"
                        : i < 3
                          ? "rgba(255,255,255,0.9)"
                          : "rgba(255,255,255,0.7)",
                    fontSize: "0.9rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.username}
                </span>
                <span
                  style={{
                    textAlign: "right",
                    fontWeight: 700,
                    color: "#a78bfa",
                    fontSize: "0.9rem",
                  }}
                >
                  {user.highScore.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          data-ocid="leaderboard.close_button"
          onClick={onClose}
          style={{
            marginTop: 20,
            width: "100%",
            background: "linear-gradient(135deg, #7c3aed, #9333ea)",
            border: "1.5px solid #a78bfa",
            borderRadius: 16,
            padding: "10px",
            color: "white",
            fontWeight: 800,
            fontSize: "0.9rem",
            letterSpacing: "0.08em",
            cursor: "pointer",
            textTransform: "uppercase",
          }}
        >
          Close
        </button>
      </DialogContent>
    </Dialog>
  );
}
