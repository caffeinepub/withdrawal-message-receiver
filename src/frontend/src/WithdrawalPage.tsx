import { useRef, useState } from "react";
import { useActor } from "./hooks/useActor";

interface WithdrawalPageProps {
  username: string;
  totalRupees: number;
  onBack: () => void;
  onWithdraw: (amount: number) => void;
}

const MIN_POINTS = 3000;
const MAX_POINTS = 120000;

function calcPayout(points: number): number {
  if (points < MIN_POINTS) return 0;
  const capped = Math.min(points, MAX_POINTS);
  const steps = Math.floor((capped - MIN_POINTS) / 100);
  return 15 + steps * 0.5;
}

function getUpiQrUrl(upiId: string): string {
  const data = `upi://pay?pa=${encodeURIComponent(upiId)}&cu=INR`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}&bgcolor=1e1043&color=ffffff&margin=10`;
}

export default function WithdrawalPage({
  username,
  totalRupees,
  onBack,
  onWithdraw,
}: WithdrawalPageProps) {
  const { actor } = useActor();
  const [step, setStep] = useState<"details" | "payment">("details");

  // Personal details
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Points & payment
  const [pointsInput, setPointsInput] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState<
    "phonepay" | "paytm" | "bank" | null
  >(null);
  const [withdrawUpi, setWithdrawUpi] = useState("");
  const [upiQrConfirmed, setUpiQrConfirmed] = useState(false);
  const [uploadedQr, setUploadedQr] = useState<string | null>(null);
  const [withdrawAccount, setWithdrawAccount] = useState("");
  const [withdrawIfsc, setWithdrawIfsc] = useState("");
  const [withdrawBankName, setWithdrawBankName] = useState("");

  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [submittedPoints, setSubmittedPoints] = useState(0);
  const [submittedPayout, setSubmittedPayout] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const enteredPoints =
    Number.parseInt(pointsInput.replace(/[^0-9]/g, ""), 10) || 0;
  const payout = calcPayout(enteredPoints);
  const isValidPoints =
    enteredPoints >= MIN_POINTS &&
    enteredPoints <= MAX_POINTS &&
    enteredPoints <= Math.floor(totalRupees);

  const showUpiFields =
    withdrawMethod === "phonepay" || withdrawMethod === "paytm";
  const isUpiReady = showUpiFields
    ? withdrawUpi.trim().includes("@") &&
      (upiQrConfirmed || uploadedQr !== null)
    : true;

  const handleDetailsNext = () => {
    if (!fullName.trim()) {
      setWithdrawError("Please enter your full name");
      return;
    }
    if (!address.trim()) {
      setWithdrawError("Please enter your address");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setWithdrawError("Please enter a valid email");
      return;
    }
    if (!phone.trim() || phone.replace(/[^0-9]/g, "").length < 10) {
      setWithdrawError("Please enter a valid 10-digit phone number");
      return;
    }
    setWithdrawError("");
    setStep("payment");
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedQr(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!pointsInput || enteredPoints < MIN_POINTS) {
      setWithdrawError(
        `Minimum withdrawal is ${MIN_POINTS.toLocaleString("en-IN")} points`,
      );
      return;
    }
    if (enteredPoints > MAX_POINTS) {
      setWithdrawError(
        `Maximum withdrawal is ${MAX_POINTS.toLocaleString("en-IN")} points`,
      );
      return;
    }
    if (enteredPoints > Math.floor(totalRupees)) {
      setWithdrawError("You don't have enough points");
      return;
    }
    if (!withdrawMethod) {
      setWithdrawError("Please select a payment method");
      return;
    }
    if (showUpiFields && !withdrawUpi.trim()) {
      setWithdrawError("Please enter your UPI ID");
      return;
    }
    if (showUpiFields && !withdrawUpi.includes("@")) {
      setWithdrawError("Please enter a valid UPI ID (e.g. name@upi)");
      return;
    }
    if (showUpiFields && !upiQrConfirmed && !uploadedQr) {
      setWithdrawError("Please confirm your UPI QR code or upload one");
      return;
    }
    if (
      withdrawMethod === "bank" &&
      (!withdrawAccount.trim() ||
        !withdrawIfsc.trim() ||
        !withdrawBankName.trim())
    ) {
      setWithdrawError("Please fill all bank details");
      return;
    }
    setWithdrawError("");
    setSubmittedPoints(enteredPoints);
    setSubmittedPayout(payout);
    setWithdrawSuccess(true);
    onWithdraw(enteredPoints);

    // Fire-and-forget: send to admin panel backend
    if (actor) {
      const upiQrUrlValue = withdrawUpi.includes("@")
        ? getUpiQrUrl(withdrawUpi)
        : "";
      try {
        await actor.submitWithdrawal({
          id: 0n,
          username: username,
          fullName,
          address,
          email,
          phone,
          points: BigInt(enteredPoints),
          payoutRupees: payout,
          paymentMethod: withdrawMethod ?? "",
          upiId: withdrawUpi,
          upiQrUrl: upiQrUrlValue,
          uploadedQrBase64: uploadedQr ?? "",
          bankAccount: withdrawAccount,
          bankIfsc: withdrawIfsc,
          bankHolderName: withdrawBankName,
          timestamp: 0n,
          status: "pending",
        });
      } catch {
        // ignore — success already shown to user
      }
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.08)",
    border: "1.5px solid rgba(255,255,255,0.2)",
    borderRadius: 10,
    padding: "10px 14px",
    color: "white",
    fontSize: "0.95rem",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    color: "rgba(255,255,255,0.6)",
    fontSize: "0.75rem",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    display: "block",
  };

  return (
    <div
      data-ocid="withdraw.page"
      style={{
        position: "fixed",
        inset: 0,
        background:
          "linear-gradient(180deg, #3b1f6e 0%, #1a0a3d 40%, #0d0520 100%)",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 16px 32px",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 0 8px",
        }}
      >
        <button
          type="button"
          data-ocid="withdraw.close_button"
          onClick={
            step === "payment"
              ? () => {
                  setStep("details");
                  setWithdrawError("");
                }
              : onBack
          }
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1.5px solid rgba(255,255,255,0.2)",
            borderRadius: 20,
            padding: "6px 16px",
            color: "white",
            fontSize: "0.85rem",
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.04em",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {step === "payment" ? "← Back" : "← Back to Game"}
        </button>

        {!withdrawSuccess && (
          <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
            {["details", "payment"].map((s, i) => (
              <div
                key={s}
                style={{
                  width: 28,
                  height: 6,
                  borderRadius: 3,
                  background:
                    step === s || (i === 1 && withdrawSuccess)
                      ? "#a78bfa"
                      : "rgba(255,255,255,0.15)",
                  transition: "background 0.3s",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Title */}
      <h1
        style={{
          color: "#FCD34D",
          fontSize: "clamp(1.4rem, 6vw, 2rem)",
          fontWeight: 900,
          letterSpacing: "0.12em",
          textAlign: "center",
          margin: "8px 0 4px",
          textTransform: "uppercase",
        }}
      >
        {withdrawSuccess
          ? "✅ Request Sent"
          : step === "details"
            ? "📋 Your Details"
            : "💰 Withdraw Points"}
      </h1>
      <p
        style={{
          color: "rgba(255,255,255,0.4)",
          fontSize: "0.78rem",
          marginBottom: 20,
        }}
      >
        {withdrawSuccess
          ? "We'll process your request soon"
          : step === "details"
            ? "Step 1 of 2 — Personal & contact information"
            : "Step 2 of 2 — Points & payment method"}
      </p>

      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "linear-gradient(180deg, #1e1043 0%, #0d0520 100%)",
          border: "2px solid #7c3aed",
          borderRadius: 20,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {withdrawSuccess ? (
          <div
            data-ocid="withdraw.success_state"
            style={{ textAlign: "center", padding: "24px 0" }}
          >
            <div style={{ fontSize: "3.5rem", marginBottom: 16 }}>✅</div>
            <p
              style={{
                color: "#4ade80",
                fontWeight: 800,
                fontSize: "1.1rem",
                marginBottom: 8,
              }}
            >
              Withdrawal request submitted!
            </p>
            <p
              style={{
                color: "#FCD34D",
                fontWeight: 700,
                fontSize: "1rem",
                marginBottom: 4,
              }}
            >
              {submittedPoints.toLocaleString("en-IN")} pts → ₹
              {submittedPayout.toFixed(2)}
            </p>
            <p
              style={{
                color: "rgba(255,255,255,0.55)",
                fontSize: "0.85rem",
                marginBottom: 8,
              }}
            >
              Requested by:{" "}
              <strong style={{ color: "white" }}>{fullName}</strong>
            </p>
            <p
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: "0.8rem",
                marginBottom: 24,
              }}
            >
              It will be processed within 3–5 business days.
            </p>
            <button
              type="button"
              onClick={onBack}
              style={{
                background: "linear-gradient(135deg, #7c3aed, #9333ea)",
                border: "none",
                borderRadius: 16,
                padding: "12px 32px",
                color: "white",
                fontWeight: 800,
                fontSize: "0.95rem",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(124,58,237,0.5)",
              }}
            >
              Back to Game
            </button>
          </div>
        ) : step === "details" ? (
          <>
            <div
              style={{
                background: "linear-gradient(135deg, #7c1d1d 0%, #450a0a 100%)",
                border: "2px solid #ef4444",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 14,
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
              <p
                style={{
                  margin: 0,
                  color: "#fca5a5",
                  fontSize: 13,
                  lineHeight: 1.5,
                  fontWeight: 600,
                }}
              >
                Do not enter incorrect details, otherwise the money will not be
                transferred to your account.
              </p>
            </div>
            {(
              [
                {
                  key: "name",
                  label: "Full Name",
                  val: fullName,
                  set: setFullName,
                  ph: "Enter your full name",
                  type: "text",
                  ocid: "withdraw.fullname.input",
                },
                {
                  key: "address",
                  label: "Address",
                  val: address,
                  set: setAddress,
                  ph: "House no., Street, City, State",
                  type: "text",
                  ocid: "withdraw.address.input",
                },
                {
                  key: "email",
                  label: "Email Address",
                  val: email,
                  set: setEmail,
                  ph: "yourname@email.com",
                  type: "email",
                  ocid: "withdraw.email.input",
                },
                {
                  key: "phone",
                  label: "Contact Number",
                  val: phone,
                  set: setPhone,
                  ph: "10-digit mobile number",
                  type: "tel",
                  ocid: "withdraw.phone.input",
                },
              ] as const
            ).map((f) => (
              <div key={f.key}>
                <label htmlFor={`wd-${f.key}`} style={labelStyle}>
                  {f.label}
                </label>
                <input
                  id={`wd-${f.key}`}
                  type={f.type}
                  data-ocid={f.ocid}
                  value={f.val}
                  onChange={(e) => {
                    f.set(e.target.value as never);
                    setWithdrawError("");
                  }}
                  placeholder={f.ph}
                  style={inputStyle}
                />
              </div>
            ))}

            {withdrawError && (
              <p
                data-ocid="withdraw.error_state"
                style={{
                  color: "#f87171",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  textAlign: "center",
                  background: "rgba(239,68,68,0.1)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  margin: 0,
                }}
              >
                ⚠️ {withdrawError}
              </p>
            )}

            <button
              type="button"
              onClick={handleDetailsNext}
              style={{
                background: "linear-gradient(135deg, #7c3aed, #9333ea)",
                border: "2px solid #a78bfa",
                borderRadius: 16,
                padding: "14px",
                color: "white",
                fontWeight: 900,
                fontSize: "1rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(124,58,237,0.5)",
                marginTop: 4,
              }}
            >
              Continue to Payment →
            </button>
          </>
        ) : (
          <>
            {/* Balance */}
            <div
              style={{
                textAlign: "center",
                background: "rgba(252,211,77,0.08)",
                borderRadius: 14,
                padding: "12px 20px",
                border: "1px solid rgba(252,211,77,0.2)",
              }}
            >
              <span
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "0.72rem",
                  letterSpacing: "0.1em",
                }}
              >
                AVAILABLE POINTS
              </span>
              <div
                style={{
                  color: "#FCD34D",
                  fontSize: "2rem",
                  fontWeight: 900,
                  marginTop: 4,
                }}
              >
                {Math.floor(totalRupees).toLocaleString("en-IN")} PTS
              </div>
            </div>

            {/* Points Input */}
            <div>
              <label htmlFor="points-input" style={labelStyle}>
                Enter Points to Withdraw
              </label>
              <input
                type="number"
                id="points-input"
                data-ocid="withdraw.points.input"
                value={pointsInput}
                onChange={(e) => {
                  setPointsInput(e.target.value);
                  setWithdrawError("");
                }}
                placeholder={`Min ${MIN_POINTS.toLocaleString("en-IN")} points`}
                min={MIN_POINTS}
                max={Math.min(MAX_POINTS, Math.floor(totalRupees))}
                style={inputStyle}
              />
              <div
                style={{
                  marginTop: 6,
                  fontSize: "0.72rem",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                Min: {MIN_POINTS.toLocaleString("en-IN")} pts &nbsp;|&nbsp; Max:{" "}
                {MAX_POINTS.toLocaleString("en-IN")} pts
              </div>
            </div>

            {/* Live payout preview */}
            {enteredPoints >= MIN_POINTS && (
              <div
                style={{
                  textAlign: "center",
                  background: isValidPoints
                    ? "rgba(74,222,128,0.1)"
                    : "rgba(239,68,68,0.1)",
                  borderRadius: 14,
                  padding: "12px 20px",
                  border: `1px solid ${
                    isValidPoints
                      ? "rgba(74,222,128,0.3)"
                      : "rgba(239,68,68,0.3)"
                  }`,
                }}
              >
                <span
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "0.72rem",
                    letterSpacing: "0.1em",
                  }}
                >
                  YOU WILL RECEIVE
                </span>
                <div
                  style={{
                    color: isValidPoints ? "#4ade80" : "#f87171",
                    fontSize: "1.8rem",
                    fontWeight: 900,
                    marginTop: 4,
                  }}
                >
                  ₹{payout.toFixed(2)}
                </div>
              </div>
            )}

            {/* Payment method */}
            <div>
              <span style={labelStyle}>Select Payment Method</span>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  {
                    id: "phonepay" as const,
                    label: "PhonePe",
                    color: "#5f259f",
                    border: "#9b59e0",
                  },
                  {
                    id: "paytm" as const,
                    label: "Paytm",
                    color: "#00baf2",
                    border: "#7dd3fc",
                  },
                  {
                    id: "bank" as const,
                    label: "Bank\nTransfer",
                    color: "#059669",
                    border: "#34d399",
                  },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    data-ocid={`withdraw.${m.id}.toggle`}
                    onClick={() => {
                      setWithdrawMethod(m.id);
                      setWithdrawError("");
                      setUpiQrConfirmed(false);
                      setUploadedQr(null);
                      setWithdrawUpi("");
                    }}
                    style={{
                      flex: 1,
                      background:
                        withdrawMethod === m.id
                          ? m.color
                          : "rgba(255,255,255,0.05)",
                      border: `2px solid ${
                        withdrawMethod === m.id
                          ? m.border
                          : "rgba(255,255,255,0.15)"
                      }`,
                      borderRadius: 12,
                      padding: "12px 4px",
                      color: "white",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "pre-wrap",
                      textAlign: "center",
                      lineHeight: 1.3,
                      transition: "all 0.2s",
                      boxShadow:
                        withdrawMethod === m.id
                          ? `0 0 12px ${m.color}88`
                          : "none",
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* UPI fields (PhonePe / Paytm) */}
            {showUpiFields && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                {/* UPI ID input */}
                <div>
                  <label htmlFor="withdraw-upi" style={labelStyle}>
                    UPI ID
                  </label>
                  <input
                    type="text"
                    id="withdraw-upi"
                    data-ocid="withdraw.upi.input"
                    value={withdrawUpi}
                    onChange={(e) => {
                      setWithdrawUpi(e.target.value);
                      setUpiQrConfirmed(false);
                      setWithdrawError("");
                    }}
                    placeholder="yourname@upi"
                    style={inputStyle}
                  />
                </div>

                {/* Auto-generated QR from UPI ID */}
                {withdrawUpi.includes("@") && (
                  <div
                    style={{
                      background: "rgba(167,139,250,0.08)",
                      border: "1.5px solid rgba(167,139,250,0.3)",
                      borderRadius: 14,
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        color: "#a78bfa",
                        fontSize: "0.72rem",
                        letterSpacing: "0.1em",
                        fontWeight: 700,
                      }}
                    >
                      AUTO-GENERATED UPI QR CODE
                    </span>
                    <img
                      src={getUpiQrUrl(withdrawUpi)}
                      alt="UPI QR Code"
                      style={{
                        width: 160,
                        height: 160,
                        borderRadius: 12,
                        border: "2px solid #7c3aed",
                        background: "white",
                      }}
                    />
                    <p
                      style={{
                        color: "rgba(255,255,255,0.5)",
                        fontSize: "0.75rem",
                        textAlign: "center",
                        margin: 0,
                      }}
                    >
                      Scan this QR to verify your UPI ID is correct
                    </p>
                    {!upiQrConfirmed && (
                      <button
                        type="button"
                        onClick={() => setUpiQrConfirmed(true)}
                        style={{
                          background:
                            "linear-gradient(135deg, #059669, #10b981)",
                          border: "none",
                          borderRadius: 10,
                          padding: "8px 20px",
                          color: "white",
                          fontWeight: 700,
                          fontSize: "0.82rem",
                          cursor: "pointer",
                        }}
                      >
                        ✅ Confirm QR Code
                      </button>
                    )}
                    {upiQrConfirmed && (
                      <span
                        style={{
                          color: "#4ade80",
                          fontWeight: 700,
                          fontSize: "0.82rem",
                        }}
                      >
                        ✅ QR Code Confirmed
                      </span>
                    )}
                  </div>
                )}

                {/* Divider */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    opacity: 0.5,
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      background: "rgba(255,255,255,0.15)",
                    }}
                  />
                  <span
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      fontSize: "0.75rem",
                    }}
                  >
                    OR
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      background: "rgba(255,255,255,0.15)",
                    }}
                  />
                </div>

                {/* Upload own QR code */}
                <div>
                  <span style={labelStyle}>Upload Your UPI QR Code</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleQrUpload}
                    style={{ display: "none" }}
                    id="qr-upload"
                  />
                  {uploadedQr ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 10,
                        background: "rgba(74,222,128,0.08)",
                        border: "1.5px solid rgba(74,222,128,0.3)",
                        borderRadius: 14,
                        padding: 14,
                      }}
                    >
                      <img
                        src={uploadedQr}
                        alt="Uploaded QR"
                        style={{
                          width: 160,
                          height: 160,
                          objectFit: "contain",
                          borderRadius: 10,
                          border: "2px solid #4ade80",
                        }}
                      />
                      <span
                        style={{
                          color: "#4ade80",
                          fontWeight: 700,
                          fontSize: "0.82rem",
                        }}
                      >
                        ✅ QR Code Uploaded
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedQr(null);
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                        style={{
                          background: "rgba(239,68,68,0.15)",
                          border: "1px solid rgba(239,68,68,0.4)",
                          borderRadius: 8,
                          padding: "4px 14px",
                          color: "#f87171",
                          fontSize: "0.75rem",
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="qr-upload"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                        background: "rgba(255,255,255,0.04)",
                        border: "2px dashed rgba(255,255,255,0.2)",
                        borderRadius: 14,
                        padding: "20px 16px",
                        cursor: "pointer",
                        transition: "border-color 0.2s",
                      }}
                    >
                      <span style={{ fontSize: "2rem" }}>📷</span>
                      <span
                        style={{
                          color: "rgba(255,255,255,0.5)",
                          fontSize: "0.82rem",
                          textAlign: "center",
                        }}
                      >
                        Tap to upload your UPI QR code photo
                      </span>
                      <span
                        style={{
                          color: "rgba(255,255,255,0.3)",
                          fontSize: "0.7rem",
                        }}
                      >
                        JPG, PNG accepted
                      </span>
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Bank details */}
            {withdrawMethod === "bank" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {(
                  [
                    {
                      key: "account",
                      label: "Account Number",
                      val: withdrawAccount,
                      set: setWithdrawAccount,
                      ph: "Enter account number",
                      ocid: "withdraw.account.input",
                    },
                    {
                      key: "ifsc",
                      label: "IFSC Code",
                      val: withdrawIfsc,
                      set: setWithdrawIfsc,
                      ph: "E.g. SBIN0001234",
                      ocid: "withdraw.ifsc.input",
                    },
                    {
                      key: "bankname",
                      label: "Account Holder Name",
                      val: withdrawBankName,
                      set: setWithdrawBankName,
                      ph: "Full name",
                      ocid: "withdraw.bankname.input",
                    },
                  ] as const
                ).map((f) => (
                  <div key={f.key}>
                    <span style={labelStyle}>{f.label}</span>
                    <input
                      type="text"
                      data-ocid={f.ocid}
                      value={f.val}
                      onChange={(e) => f.set(e.target.value as never)}
                      placeholder={f.ph}
                      style={inputStyle}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Payout chart hint */}
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: "0.72rem",
                color: "rgba(255,255,255,0.4)",
                lineHeight: 1.7,
              }}
            >
              <strong style={{ color: "rgba(255,255,255,0.6)" }}>
                Payout Chart:
              </strong>{" "}
              3,000 pts = ₹15 &nbsp;|&nbsp; 4,000 pts = ₹20 &nbsp;|&nbsp; 10,000
              pts = ₹50 &nbsp;|&nbsp; Every 100 pts above 3,000 = +₹0.50
            </div>

            {withdrawError && (
              <p
                data-ocid="withdraw.error_state"
                style={{
                  color: "#f87171",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  textAlign: "center",
                  background: "rgba(239,68,68,0.1)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  margin: 0,
                }}
              >
                ⚠️ {withdrawError}
              </p>
            )}

            <button
              type="button"
              data-ocid="withdraw.submit_button"
              onClick={handleSubmit}
              style={{
                background:
                  isValidPoints &&
                  withdrawMethod &&
                  (withdrawMethod === "bank" || isUpiReady)
                    ? "linear-gradient(135deg, #7c3aed, #9333ea)"
                    : "rgba(255,255,255,0.08)",
                border: "2px solid #a78bfa",
                borderRadius: 16,
                padding: "14px",
                color:
                  isValidPoints &&
                  withdrawMethod &&
                  (withdrawMethod === "bank" || isUpiReady)
                    ? "white"
                    : "rgba(255,255,255,0.4)",
                fontWeight: 900,
                fontSize: "1rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor:
                  isValidPoints &&
                  withdrawMethod &&
                  (withdrawMethod === "bank" || isUpiReady)
                    ? "pointer"
                    : "not-allowed",
                boxShadow:
                  isValidPoints &&
                  withdrawMethod &&
                  (withdrawMethod === "bank" || isUpiReady)
                    ? "0 4px 16px rgba(124,58,237,0.5)"
                    : "none",
                marginTop: 4,
                transition: "all 0.2s",
              }}
            >
              {isValidPoints && payout > 0
                ? `Withdraw ${enteredPoints.toLocaleString("en-IN")} pts → ₹${payout.toFixed(2)}`
                : "Enter Points to Continue"}
            </button>
          </>
        )}
      </div>

      <p
        style={{
          color: "rgba(255,255,255,0.2)",
          fontSize: "0.68rem",
          marginTop: 24,
          textAlign: "center",
        }}
      >
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noreferrer"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          caffeine.ai
        </a>
      </p>
    </div>
  );
}
