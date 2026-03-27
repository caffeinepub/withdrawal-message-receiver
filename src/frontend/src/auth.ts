export interface User {
  username: string;
  email: string;
  passwordHash: string;
  highScore: number;
  currentScore?: number;
  rupees: number;
  failedAttempts: number;
  lockoutUntil: number;
}

const STORAGE_KEY = "blockpuzzle_users";
const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export function getUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as User[];
  } catch {
    return [];
  }
}

export function saveUsers(users: User[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (_) {}
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function checkPasswordStrength(
  password: string,
): "weak" | "medium" | "strong" {
  if (password.length < 6) return "weak";
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  if (hasUpper && hasNumber && hasSpecial) return "strong";
  return "medium";
}

export function isLockedOut(username: string): {
  locked: boolean;
  secondsLeft: number;
} {
  const users = getUsers();
  const user = users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase(),
  );
  if (!user) return { locked: false, secondsLeft: 0 };
  const now = Date.now();
  if (user.lockoutUntil > now) {
    return {
      locked: true,
      secondsLeft: Math.ceil((user.lockoutUntil - now) / 1000),
    };
  }
  return { locked: false, secondsLeft: 0 };
}

export type RegisterResult =
  | { success: true; user: User }
  | { success: false; error: string };

export async function registerUser(
  username: string,
  email: string,
  password: string,
): Promise<RegisterResult> {
  if (username.trim().length < 3) {
    return { success: false, error: "Username must be at least 3 characters" };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return {
      success: false,
      error: "Username can only contain letters, numbers, and underscores",
    };
  }
  const users = getUsers();
  if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return { success: false, error: "Username already taken" };
  }
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: "Email already registered" };
  }
  const strength = checkPasswordStrength(password);
  if (strength === "weak") {
    return { success: false, error: "Password is too weak (min 6 characters)" };
  }
  const passwordHash = await hashPassword(password);
  const newUser: User = {
    username,
    email,
    passwordHash,
    highScore: 0,
    rupees: 0,
    failedAttempts: 0,
    lockoutUntil: 0,
  };
  saveUsers([...users, newUser]);
  return { success: true, user: newUser };
}

export type LoginResult =
  | { success: true; user: User }
  | { success: false; error: string; locked?: boolean; secondsLeft?: number };

export async function loginUser(
  username: string,
  password: string,
): Promise<LoginResult> {
  const users = getUsers();
  const idx = users.findIndex(
    (u) => u.username.toLowerCase() === username.toLowerCase(),
  );
  if (idx === -1) {
    return { success: false, error: "Invalid username or password" };
  }
  const user = users[idx];
  const now = Date.now();
  if (user.lockoutUntil > now) {
    const secondsLeft = Math.ceil((user.lockoutUntil - now) / 1000);
    return {
      success: false,
      error: `Account locked. Try again in ${secondsLeft}s`,
      locked: true,
      secondsLeft,
    };
  }
  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) {
    const newAttempts = user.failedAttempts + 1;
    let lockoutUntil = user.lockoutUntil;
    let errorMsg = `Invalid username or password (${LOCKOUT_ATTEMPTS - newAttempts} attempts left)`;
    if (newAttempts >= LOCKOUT_ATTEMPTS) {
      lockoutUntil = now + LOCKOUT_DURATION_MS;
      errorMsg = "Too many failed attempts. Account locked for 5 minutes.";
    }
    users[idx] = { ...user, failedAttempts: newAttempts, lockoutUntil };
    saveUsers(users);
    return {
      success: false,
      error: errorMsg,
      locked: newAttempts >= LOCKOUT_ATTEMPTS,
      secondsLeft: newAttempts >= LOCKOUT_ATTEMPTS ? 300 : 0,
    };
  }
  // Reset attempts on success
  users[idx] = { ...user, failedAttempts: 0, lockoutUntil: 0 };
  saveUsers(users);
  return { success: true, user: users[idx] };
}

export function updateUserHighScore(
  username: string,
  score: number,
  rupeesEarned: number,
): void {
  const users = getUsers();
  const idx = users.findIndex((u) => u.username === username);
  if (idx === -1) return;
  const user = users[idx];
  const updated: User = {
    ...user,
    highScore: Math.max(user.highScore, score),
    rupees: user.rupees + rupeesEarned,
  };
  users[idx] = updated;
  saveUsers(users);
}

const SESSION_KEY = "blockpuzzle_session";

export function getSavedSession(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}
export function saveSession(username: string): void {
  try {
    localStorage.setItem(SESSION_KEY, username);
  } catch {}
}
export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}
