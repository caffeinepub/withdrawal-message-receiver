import { useEffect, useRef, useState } from "react";
import { checkPasswordStrength, loginUser, registerUser } from "./auth";

interface Props {
  onLogin: (username: string) => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");

  // Login fields
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Signup fields
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);

  const lockoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
    };
  }, []);

  const startLockoutTimer = (seconds: number) => {
    setLockoutSeconds(seconds);
    if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
    lockoutTimerRef.current = setInterval(() => {
      setLockoutSeconds((s) => {
        if (s <= 1) {
          if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const handleLogin = async () => {
    if (!loginUsername.trim() || !loginPassword) {
      setLoginError("Please fill in all fields");
      return;
    }
    setLoginLoading(true);
    setLoginError("");
    const result = await loginUser(loginUsername.trim(), loginPassword);
    setLoginLoading(false);
    if (result.success) {
      onLogin(result.user.username);
    } else {
      setLoginError(result.error);
      if (result.locked && result.secondsLeft) {
        startLockoutTimer(result.secondsLeft);
      }
    }
  };

  const handleSignup = async () => {
    if (
      !signupUsername.trim() ||
      !signupEmail.trim() ||
      !signupPassword ||
      !signupConfirm
    ) {
      setSignupError("Please fill in all fields");
      return;
    }
    if (signupPassword !== signupConfirm) {
      setSignupError("Passwords do not match");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(signupEmail)) {
      setSignupError("Please enter a valid email address");
      return;
    }
    setSignupLoading(true);
    setSignupError("");
    const result = await registerUser(
      signupUsername.trim(),
      signupEmail.trim(),
      signupPassword,
    );
    setSignupLoading(false);
    if (result.success) {
      onLogin(result.user.username);
    } else {
      setSignupError(result.error);
    }
  };

  const pwStrength =
    mode === "signup" ? checkPasswordStrength(signupPassword) : null;
  const strengthColor =
    pwStrength === "strong"
      ? "#4ade80"
      : pwStrength === "medium"
        ? "#fbbf24"
        : "#ef4444";
  const strengthWidth =
    pwStrength === "strong"
      ? "100%"
      : pwStrength === "medium"
        ? "60%"
        : signupPassword
          ? "30%"
          : "0%";
  const strengthLabel =
    pwStrength === "strong"
      ? "Strong 💪"
      : pwStrength === "medium"
        ? "Medium"
        : signupPassword
          ? "Weak"
          : "";

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.07)",
    border: "1.5px solid rgba(167,139,250,0.4)",
    borderRadius: 12,
    padding: "10px 14px",
    color: "white",
    fontSize: "0.9rem",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    color: "rgba(255,255,255,0.6)",
    fontSize: "0.72rem",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    display: "block",
    marginBottom: 4,
  };

  return (
    <div
      data-ocid="auth.page"
      style={{
        position: "fixed",
        inset: 0,
        background:
          "linear-gradient(160deg, #3b1f6e 0%, #1a0a3d 60%, #0d0520 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        overflowY: "auto",
      }}
    >
      {/* Decorative stars */}
      <div
        className="star-bg"
        style={{
          position: "absolute",
          fontSize: "8rem",
          color: "#BF5AF2",
          left: "5%",
          top: "8%",
          pointerEvents: "none",
          opacity: 0.5,
        }}
      >
        ✦
      </div>
      <div
        className="star-bg"
        style={{
          position: "absolute",
          fontSize: "4rem",
          color: "#FF9500",
          left: "80%",
          top: "12%",
          pointerEvents: "none",
          opacity: 0.5,
        }}
      >
        ★
      </div>
      <div
        className="star-bg"
        style={{
          position: "absolute",
          fontSize: "3rem",
          color: "#FFD60A",
          left: "70%",
          top: "75%",
          pointerEvents: "none",
          opacity: 0.5,
        }}
      >
        ✦
      </div>
      <div
        className="star-bg"
        style={{
          position: "absolute",
          fontSize: "5rem",
          color: "#FF2D55",
          left: "10%",
          top: "80%",
          pointerEvents: "none",
          opacity: 0.5,
        }}
      >
        ★
      </div>

      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
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
            margin: "0 0 4px",
          }}
        >
          BLOCKCRAFT PUZZLE
        </h1>
        <p
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "0.75rem",
            letterSpacing: "0.1em",
          }}
        >
          Developed by ADARSH CHAUDHARY
        </p>
      </div>

      {/* Card */}
      <div
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1.5px solid rgba(167,139,250,0.35)",
          borderRadius: 24,
          padding: "28px 24px",
          width: "100%",
          maxWidth: 380,
          backdropFilter: "blur(12px)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
        }}
      >
        {/* Mode toggle */}
        <div
          style={{
            display: "flex",
            background: "rgba(0,0,0,0.3)",
            borderRadius: 12,
            padding: 3,
            marginBottom: 20,
          }}
        >
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              data-ocid={`auth.${m}_tab` as string}
              onClick={() => {
                setMode(m);
                setLoginError("");
                setSignupError("");
              }}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: 10,
                border: "none",
                background:
                  mode === m
                    ? "linear-gradient(135deg, #7c3aed, #9333ea)"
                    : "transparent",
                color: mode === m ? "white" : "rgba(255,255,255,0.5)",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                transition: "all 0.2s",
                letterSpacing: "0.05em",
              }}
            >
              {m === "login" ? "LOG IN" : "SIGN UP"}
            </button>
          ))}
        </div>

        {mode === "login" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label htmlFor="login-username" style={labelStyle}>
                Username
              </label>
              <input
                id="login-username"
                data-ocid="auth.input"
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Enter username"
                style={inputStyle}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                autoComplete="username"
              />
            </div>
            <div>
              <label htmlFor="login-password" style={labelStyle}>
                Password
              </label>
              <input
                id="login-password"
                data-ocid="auth.input"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter password"
                style={inputStyle}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                autoComplete="current-password"
              />
            </div>

            {lockoutSeconds > 0 && (
              <div
                data-ocid="auth.error_state"
                style={{
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.4)",
                  borderRadius: 10,
                  padding: "8px 12px",
                  color: "#fca5a5",
                  fontSize: "0.8rem",
                  textAlign: "center",
                }}
              >
                🔒 Account locked. Try again in {lockoutSeconds}s
              </div>
            )}

            {loginError && lockoutSeconds === 0 && (
              <div
                data-ocid="auth.error_state"
                style={{
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.4)",
                  borderRadius: 10,
                  padding: "8px 12px",
                  color: "#fca5a5",
                  fontSize: "0.8rem",
                }}
              >
                {loginError}
              </div>
            )}

            <button
              type="button"
              data-ocid="auth.submit_button"
              onClick={handleLogin}
              disabled={loginLoading || lockoutSeconds > 0}
              style={{
                background:
                  lockoutSeconds > 0
                    ? "#374151"
                    : "linear-gradient(180deg, #4ade80 0%, #16a34a 50%, #15803d 100%)",
                border:
                  lockoutSeconds > 0
                    ? "2px solid #4b5563"
                    : "2px solid #86efac",
                borderRadius: 20,
                padding: "12px",
                color: "white",
                fontWeight: 900,
                fontSize: "1rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: lockoutSeconds > 0 ? "not-allowed" : "pointer",
                boxShadow: lockoutSeconds > 0 ? "none" : "0 6px 0 #14532d",
                transition: "all 0.2s",
                width: "100%",
              }}
            >
              {loginLoading ? "Logging in..." : "PLAY NOW"}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label htmlFor="signup-username" style={labelStyle}>
                Username
              </label>
              <input
                id="signup-username"
                data-ocid="auth.input"
                type="text"
                value={signupUsername}
                onChange={(e) => setSignupUsername(e.target.value)}
                placeholder="Choose a username"
                style={inputStyle}
                autoComplete="username"
              />
            </div>
            <div>
              <label htmlFor="signup-email" style={labelStyle}>
                Email
              </label>
              <input
                id="signup-email"
                data-ocid="auth.input"
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="your@email.com"
                style={inputStyle}
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="signup-password" style={labelStyle}>
                Password
              </label>
              <input
                id="signup-password"
                data-ocid="auth.input"
                type="password"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder="Create a strong password"
                style={inputStyle}
                autoComplete="new-password"
              />
              {signupPassword && (
                <div style={{ marginTop: 6 }}>
                  <div
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: 4,
                      height: 5,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: strengthWidth,
                        background: strengthColor,
                        borderRadius: 4,
                        transition: "width 0.3s, background 0.3s",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      color: strengthColor,
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      marginTop: 2,
                      display: "block",
                    }}
                  >
                    {strengthLabel}
                  </span>
                </div>
              )}
            </div>
            <div>
              <label htmlFor="signup-confirm" style={labelStyle}>
                Confirm Password
              </label>
              <input
                id="signup-confirm"
                data-ocid="auth.input"
                type="password"
                value={signupConfirm}
                onChange={(e) => setSignupConfirm(e.target.value)}
                placeholder="Repeat password"
                style={inputStyle}
                autoComplete="new-password"
              />
            </div>

            {signupError && (
              <div
                data-ocid="auth.error_state"
                style={{
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.4)",
                  borderRadius: 10,
                  padding: "8px 12px",
                  color: "#fca5a5",
                  fontSize: "0.8rem",
                }}
              >
                {signupError}
              </div>
            )}

            <button
              type="button"
              data-ocid="auth.submit_button"
              onClick={handleSignup}
              disabled={signupLoading}
              style={{
                background:
                  "linear-gradient(180deg, #4ade80 0%, #16a34a 50%, #15803d 100%)",
                border: "2px solid #86efac",
                borderRadius: 20,
                padding: "12px",
                color: "white",
                fontWeight: 900,
                fontSize: "1rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: signupLoading ? "not-allowed" : "pointer",
                boxShadow: "0 6px 0 #14532d",
                width: "100%",
              }}
            >
              {signupLoading ? "Creating account..." : "CREATE ACCOUNT"}
            </button>
          </div>
        )}
      </div>

      <p
        style={{
          color: "rgba(255,255,255,0.2)",
          fontSize: "0.65rem",
          marginTop: 20,
        }}
      >
        © {new Date().getFullYear()} BLOCKCRAFT PUZZLE · Developed by ADARSH
        CHAUDHARY
      </p>
    </div>
  );
}
