import { useState } from "react";
import type { WithdrawalRequest } from "./backend.d";
import { useActor } from "./hooks/useActor";

interface WithdrawalAdminPanelProps {
  onBack: () => void;
}

function formatDate(ts: bigint): string {
  if (ts === 0n) return "—";
  const ms = Number(ts);
  return new Date(ms).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusColors: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  pending: { bg: "rgba(252,211,77,0.15)", color: "#FCD34D", label: "PENDING" },
  paid: { bg: "rgba(74,222,128,0.15)", color: "#4ade80", label: "PAID" },
  rejected: { bg: "rgba(239,68,68,0.15)", color: "#f87171", label: "REJECTED" },
};

export default function WithdrawalAdminPanel({
  onBack,
}: WithdrawalAdminPanelProps) {
  const { actor } = useActor();
  const [requests, setRequests] = useState<WithdrawalRequest[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<bigint | null>(null);

  const loadRequests = async () => {
    if (!actor) return;
    setLoading(true);
    setError("");
    try {
      const all = await actor.getAllWithdrawals();
      const sorted = [...all].sort((a, b) => {
        if (b.timestamp > a.timestamp) return 1;
        if (b.timestamp < a.timestamp) return -1;
        return 0;
      });
      setRequests(sorted);
    } catch {
      setError("Failed to load requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load on mount
  if (requests === null && !loading && actor) {
    loadRequests();
  }

  const handleStatus = async (id: bigint, status: string) => {
    if (!actor) return;
    setActionLoading(id);
    try {
      await actor.updateWithdrawalStatus(id, status);
      await loadRequests();
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  const cardStyle: React.CSSProperties = {
    background: "linear-gradient(180deg, #1e1043 0%, #0d0520 100%)",
    border: "2px solid #7c3aed",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  };

  const labelStyle: React.CSSProperties = {
    color: "rgba(255,255,255,0.45)",
    fontSize: "0.68rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: 2,
  };

  const valueStyle: React.CSSProperties = {
    color: "white",
    fontSize: "0.9rem",
    fontWeight: 600,
  };

  const rowStyle: React.CSSProperties = {
    display: "flex",
    gap: 16,
    flexWrap: "wrap" as const,
  };

  const fieldStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 120,
  };

  return (
    <div
      data-ocid="admin.panel"
      style={{
        position: "fixed",
        inset: 0,
        background:
          "linear-gradient(180deg, #3b1f6e 0%, #1a0a3d 40%, #0d0520 100%)",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 16px 40px",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          width: "100%",
          maxWidth: 600,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 0 8px",
        }}
      >
        <button
          type="button"
          data-ocid="admin.close_button"
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1.5px solid rgba(255,255,255,0.2)",
            borderRadius: 20,
            padding: "6px 16px",
            color: "white",
            fontSize: "0.85rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ← Back to Game
        </button>
        <button
          type="button"
          data-ocid="admin.secondary_button"
          onClick={loadRequests}
          disabled={loading}
          style={{
            marginLeft: "auto",
            background: "rgba(124,58,237,0.25)",
            border: "1.5px solid #7c3aed",
            borderRadius: 20,
            padding: "6px 16px",
            color: "#a78bfa",
            fontSize: "0.85rem",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "⏳ Loading..." : "🔄 Refresh"}
        </button>
      </div>

      {/* Title */}
      <h1
        style={{
          color: "#FCD34D",
          fontSize: "clamp(1.3rem, 5vw, 1.8rem)",
          fontWeight: 900,
          letterSpacing: "0.12em",
          textAlign: "center",
          margin: "8px 0 4px",
          textTransform: "uppercase",
        }}
      >
        🔐 Admin Panel
      </h1>
      <p
        style={{
          color: "rgba(255,255,255,0.4)",
          fontSize: "0.78rem",
          marginBottom: 20,
        }}
      >
        All withdrawal requests from game users
      </p>

      <div style={{ width: "100%", maxWidth: 600 }}>
        {error && (
          <div
            data-ocid="admin.error_state"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 10,
              padding: "10px 16px",
              color: "#f87171",
              fontSize: "0.85rem",
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {loading && requests === null && (
          <div
            data-ocid="admin.loading_state"
            style={{
              textAlign: "center",
              padding: "60px 0",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>⏳</div>
            <p>Loading withdrawal requests...</p>
          </div>
        )}

        {!loading && requests !== null && requests.length === 0 && (
          <div
            data-ocid="admin.empty_state"
            style={{
              textAlign: "center",
              padding: "60px 0",
              background: "linear-gradient(180deg, #1e1043 0%, #0d0520 100%)",
              border: "2px solid #7c3aed",
              borderRadius: 20,
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>📭</div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
              No withdrawal requests yet
            </p>
            <p
              style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: "0.8rem",
                marginTop: 6,
              }}
            >
              Requests from game users will appear here
            </p>
          </div>
        )}

        {requests?.map((req, idx) => {
          const statusInfo = statusColors[req.status] ?? statusColors.pending;
          const isBank = req.paymentMethod === "bank";
          const isActing = actionLoading === req.id;

          return (
            <div
              key={String(req.id)}
              data-ocid={`admin.item.${idx + 1}`}
              style={cardStyle}
            >
              {/* Header row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div>
                  <span
                    style={{
                      color: "#FCD34D",
                      fontWeight: 900,
                      fontSize: "1rem",
                    }}
                  >
                    {req.fullName || req.username}
                  </span>
                  <span
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      fontSize: "0.75rem",
                      marginLeft: 8,
                    }}
                  >
                    @{req.username}
                  </span>
                </div>
                <span
                  data-ocid={`admin.item.${idx + 1}.toggle`}
                  style={{
                    background: statusInfo.bg,
                    color: statusInfo.color,
                    border: `1px solid ${statusInfo.color}55`,
                    borderRadius: 20,
                    padding: "3px 12px",
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                  }}
                >
                  {statusInfo.label}
                </span>
              </div>

              {/* Contact info */}
              <div style={rowStyle}>
                <div style={fieldStyle}>
                  <div style={labelStyle}>Email</div>
                  <div style={valueStyle}>{req.email || "—"}</div>
                </div>
              </div>

              {req.address && (
                <div>
                  <div style={labelStyle}>Address</div>
                  <div style={{ ...valueStyle, fontSize: "0.82rem" }}>
                    {req.address}
                  </div>
                </div>
              )}

              <div>
                <div style={labelStyle}>Phone</div>
                <div style={valueStyle}>{req.phone || "—"}</div>
              </div>

              {/* Amount */}
              <div
                style={{
                  background: "rgba(252,211,77,0.08)",
                  border: "1px solid rgba(252,211,77,0.2)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div>
                  <div style={labelStyle}>Points Withdrawn</div>
                  <div
                    style={{
                      color: "#FCD34D",
                      fontWeight: 900,
                      fontSize: "1.1rem",
                    }}
                  >
                    {Number(req.points).toLocaleString("en-IN")} PTS
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={labelStyle}>Payout Amount</div>
                  <div
                    style={{
                      color: "#4ade80",
                      fontWeight: 900,
                      fontSize: "1.1rem",
                    }}
                  >
                    ₹{req.payoutRupees.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Payment method */}
              <div>
                <div style={labelStyle}>Payment Method</div>
                <div style={{ ...valueStyle, textTransform: "capitalize" }}>
                  {req.paymentMethod === "phonepay"
                    ? "PhonePe"
                    : req.paymentMethod === "paytm"
                      ? "Paytm"
                      : req.paymentMethod === "bank"
                        ? "Bank Transfer"
                        : req.paymentMethod || "—"}
                </div>
              </div>

              {/* UPI details */}
              {!isBank && req.upiId && (
                <div>
                  <div style={labelStyle}>UPI ID</div>
                  <div style={{ ...valueStyle, fontFamily: "monospace" }}>
                    {req.upiId}
                  </div>
                </div>
              )}

              {/* Bank details */}
              {isBank && (
                <div style={rowStyle}>
                  {req.bankAccount && (
                    <div style={fieldStyle}>
                      <div style={labelStyle}>Account Number</div>
                      <div style={{ ...valueStyle, fontFamily: "monospace" }}>
                        {req.bankAccount}
                      </div>
                    </div>
                  )}
                  {req.bankIfsc && (
                    <div style={fieldStyle}>
                      <div style={labelStyle}>IFSC Code</div>
                      <div style={{ ...valueStyle, fontFamily: "monospace" }}>
                        {req.bankIfsc}
                      </div>
                    </div>
                  )}
                  {req.bankHolderName && (
                    <div style={{ width: "100%" }}>
                      <div style={labelStyle}>Account Holder</div>
                      <div style={valueStyle}>{req.bankHolderName}</div>
                    </div>
                  )}
                </div>
              )}

              {/* QR Codes */}
              {(req.upiQrUrl || req.uploadedQrBase64) && (
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {req.upiQrUrl && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <div style={labelStyle}>Auto-Generated UPI QR</div>
                      <img
                        src={req.upiQrUrl}
                        alt="UPI QR"
                        style={{
                          width: 140,
                          height: 140,
                          borderRadius: 10,
                          border: "2px solid #7c3aed",
                          background: "white",
                        }}
                      />
                    </div>
                  )}
                  {req.uploadedQrBase64 && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <div style={labelStyle}>Uploaded QR Code</div>
                      <img
                        src={req.uploadedQrBase64}
                        alt="Uploaded QR"
                        style={{
                          width: 140,
                          height: 140,
                          objectFit: "contain",
                          borderRadius: 10,
                          border: "2px solid #4ade80",
                          background: "white",
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Timestamp */}
              <div
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: "0.72rem",
                }}
              >
                Submitted: {formatDate(req.timestamp)}
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  data-ocid={`admin.item.${idx + 1}.confirm_button`}
                  onClick={() => handleStatus(req.id, "paid")}
                  disabled={req.status === "paid" || isActing}
                  style={{
                    flex: 1,
                    background:
                      req.status === "paid"
                        ? "rgba(74,222,128,0.1)"
                        : "rgba(74,222,128,0.2)",
                    border: `1.5px solid ${req.status === "paid" ? "rgba(74,222,128,0.2)" : "#4ade80"}`,
                    borderRadius: 10,
                    padding: "10px",
                    color:
                      req.status === "paid"
                        ? "rgba(74,222,128,0.4)"
                        : "#4ade80",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    cursor:
                      req.status === "paid" || isActing
                        ? "not-allowed"
                        : "pointer",
                    opacity: req.status === "paid" ? 0.6 : 1,
                  }}
                >
                  {isActing ? "..." : "✅ Mark Paid"}
                </button>
                <button
                  type="button"
                  data-ocid={`admin.item.${idx + 1}.delete_button`}
                  onClick={() => handleStatus(req.id, "rejected")}
                  disabled={req.status === "rejected" || isActing}
                  style={{
                    flex: 1,
                    background:
                      req.status === "rejected"
                        ? "rgba(239,68,68,0.1)"
                        : "rgba(239,68,68,0.15)",
                    border: `1.5px solid ${req.status === "rejected" ? "rgba(239,68,68,0.2)" : "#f87171"}`,
                    borderRadius: 10,
                    padding: "10px",
                    color:
                      req.status === "rejected"
                        ? "rgba(248,113,113,0.4)"
                        : "#f87171",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    cursor:
                      req.status === "rejected" || isActing
                        ? "not-allowed"
                        : "pointer",
                    opacity: req.status === "rejected" ? 0.6 : 1,
                  }}
                >
                  {isActing ? "..." : "❌ Reject"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
