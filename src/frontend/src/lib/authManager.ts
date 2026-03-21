const ADMIN_USERNAME = "malverin";
const ADMIN_PASSWORD = "hexermac";
const USERS_KEY = "t77_users";
const SESSION_KEY = "t77_session";
const CREDITS_KEY = "t77_guest_credits";
const INITIAL_CREDITS = 10;

export interface ManagedUser {
  username: string;
  password: string;
  expiresAt: number; // 0 = never
  createdAt: number;
}

interface Session {
  username: string;
  isAdmin: boolean;
  loginTime: number;
}

export function getAllUsers(): ManagedUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ManagedUser[];
  } catch {
    return [];
  }
}

function saveUsers(users: ManagedUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function login(
  username: string,
  password: string,
): { success: boolean; isAdmin: boolean; error?: string } {
  if (
    username.toLowerCase() === ADMIN_USERNAME &&
    password === ADMIN_PASSWORD
  ) {
    const session: Session = {
      username: ADMIN_USERNAME,
      isAdmin: true,
      loginTime: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { success: true, isAdmin: true };
  }

  const users = getAllUsers();
  const user = users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase(),
  );

  if (!user)
    return {
      success: false,
      isAdmin: false,
      error: "Invalid username or password",
    };
  if (user.password !== password)
    return {
      success: false,
      isAdmin: false,
      error: "Invalid username or password",
    };

  if (user.expiresAt > 0 && Date.now() > user.expiresAt) {
    return {
      success: false,
      isAdmin: false,
      error: "Your account has expired. Please contact admin to renew.",
    };
  }

  const session: Session = {
    username: user.username,
    isAdmin: false,
    loginTime: Date.now(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { success: true, isAdmin: false };
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): {
  username: string;
  isAdmin: boolean;
  isExpired: boolean;
} | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;

    if (session.isAdmin) {
      return { username: session.username, isAdmin: true, isExpired: false };
    }

    const users = getAllUsers();
    const user = users.find(
      (u) => u.username.toLowerCase() === session.username.toLowerCase(),
    );
    if (!user) {
      logout();
      return null;
    }

    const isExpired = user.expiresAt > 0 && Date.now() > user.expiresAt;
    return { username: session.username, isAdmin: false, isExpired };
  } catch {
    return null;
  }
}

export function isAdminUser(): boolean {
  const u = getCurrentUser();
  return u?.isAdmin === true;
}

export function getCredits(): number {
  const user = getCurrentUser();
  if (!user) {
    const raw = localStorage.getItem(CREDITS_KEY);
    if (raw === null) return INITIAL_CREDITS;
    return Number.parseInt(raw, 10) || 0;
  }
  if (user.isAdmin) return Number.POSITIVE_INFINITY;
  if (user.isExpired) {
    const raw = localStorage.getItem(CREDITS_KEY);
    if (raw === null) return 0;
    return Number.parseInt(raw, 10) || 0;
  }
  return Number.POSITIVE_INFINITY;
}

/** Deduct one credit. Returns true if credit was available and deducted. */
export function consumeCredit(): boolean {
  const user = getCurrentUser();
  if (user?.isAdmin) return true;
  if (user && !user.isExpired) return true;

  const current = getCredits();
  if (current <= 0) return false;
  localStorage.setItem(CREDITS_KEY, String(current - 1));
  return true;
}

export function createUser(
  username: string,
  password: string,
  durationDays: number | null,
): { success: boolean; error?: string } {
  if (!username.trim() || !password.trim()) {
    return { success: false, error: "Username and password are required" };
  }
  if (username.toLowerCase() === ADMIN_USERNAME) {
    return { success: false, error: "Username is reserved" };
  }

  const users = getAllUsers();
  if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return { success: false, error: "Username already exists" };
  }

  const expiresAt =
    durationDays === null ? 0 : Date.now() + durationDays * 24 * 60 * 60 * 1000;

  users.push({
    username: username.trim(),
    password,
    expiresAt,
    createdAt: Date.now(),
  });
  saveUsers(users);
  return { success: true };
}

export function updateUser(
  username: string,
  updates: { password?: string; durationDays?: number | null },
): { success: boolean; error?: string } {
  const users = getAllUsers();
  const idx = users.findIndex(
    (u) => u.username.toLowerCase() === username.toLowerCase(),
  );
  if (idx === -1) return { success: false, error: "User not found" };

  if (updates.password) users[idx].password = updates.password;
  if (updates.durationDays !== undefined) {
    users[idx].expiresAt =
      updates.durationDays === null
        ? 0
        : Date.now() + updates.durationDays * 24 * 60 * 60 * 1000;
  }

  saveUsers(users);
  return { success: true };
}

export function deleteUser(username: string): void {
  const users = getAllUsers().filter(
    (u) => u.username.toLowerCase() !== username.toLowerCase(),
  );
  saveUsers(users);
}
