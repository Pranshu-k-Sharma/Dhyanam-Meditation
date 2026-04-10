import { useEffect, useMemo, useState } from "react";

const USERS_STORAGE_KEY = "innerpeace.users";
const ACTIVE_USER_STORAGE_KEY = "innerpeace.activeUser";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialSignupForm = {
  name: "",
  email: "",
  password: "",
};

const initialLoginForm = {
  email: "",
  password: "",
};

function readUsers() {
  try {
    const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function readActiveUser() {
  try {
    const raw = window.localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function saveActiveUser(user) {
  if (!user) {
    window.localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent("innerpeace-auth-changed", { detail: { isAuthenticated: false } })
    );
    return;
  }

  window.localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(
    new CustomEvent("innerpeace-auth-changed", { detail: { isAuthenticated: true } })
  );
}

function formatJoinDate(value) {
  if (!value) {
    return "Recently joined";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Recently joined";
  }

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AccountAccess() {
  const [activeUser, setActiveUser] = useState(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(true);
  const [authMode, setAuthMode] = useState("login");
  const [signupForm, setSignupForm] = useState(initialSignupForm);
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [formMessage, setFormMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");

  useEffect(() => {
    const savedUser = readActiveUser();
    if (savedUser) {
      setActiveUser(savedUser);
      setAuthDialogOpen(false);
      return;
    }

    setAuthDialogOpen(true);
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        if (activeUser) {
          setAuthDialogOpen(false);
        }
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeUser]);

  const isEmailValid = (value) => EMAIL_REGEX.test(value);

  const initials = useMemo(() => {
    if (!activeUser?.name) {
      return "IP";
    }

    const parts = activeUser.name.split(" ").filter(Boolean);
    if (!parts.length) {
      return "IP";
    }

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [activeUser?.name]);

  const logoSrc = "/images/dhyanam_darkgold_white_bg-removebg-preview.png";

  const openAccountPanel = () => {
    if (activeUser) {
      setMenuOpen((value) => !value);
      return;
    }

    setAuthMode("login");
    setFormMessage("");
    setAuthDialogOpen(true);
  };

  const handleSignup = (event) => {
    event.preventDefault();
    setFormMessage("");

    const name = signupForm.name.trim();
    const email = signupForm.email.trim().toLowerCase();
    const password = signupForm.password;

    if (!name || !email || !password) {
      setFormMessage("Please complete all signup fields.");
      return;
    }

    if (!isEmailValid(email)) {
      setFormMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setFormMessage("Password must be at least 6 characters.");
      return;
    }

    const users = readUsers();
    const emailExists = users.some((user) => user.email === email);
    if (emailExists) {
      setFormMessage("Account already exists for this email. Please login.");
      setAuthMode("login");
      setLoginForm((previous) => ({ ...previous, email }));
      return;
    }

    const createdAt = new Date().toISOString();
    const newUser = {
      name,
      email,
      password,
      createdAt,
      lastLoginAt: createdAt,
    };

    const updatedUsers = [...users, newUser];
    saveUsers(updatedUsers);

    const active = {
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt,
      lastLoginAt: newUser.lastLoginAt,
    };

    setActiveUser(active);
    saveActiveUser(active);
    setSignupForm(initialSignupForm);
    setAuthDialogOpen(false);
    setInfoMessage("Welcome! Your profile has been created.");
  };

  const handleLogin = (event) => {
    event.preventDefault();
    setFormMessage("");

    const email = loginForm.email.trim().toLowerCase();
    const password = loginForm.password;

    if (!email || !password) {
      setFormMessage("Please enter your email and password.");
      return;
    }

    if (!isEmailValid(email)) {
      setFormMessage("Please enter a valid email address.");
      return;
    }

    const users = readUsers();
    const user = users.find((item) => item.email === email && item.password === password);

    if (!user) {
      setFormMessage("Invalid credentials. Please try again.");
      return;
    }

    const loginAt = new Date().toISOString();
    const updatedUsers = users.map((item) =>
      item.email === user.email ? { ...item, lastLoginAt: loginAt } : item
    );
    saveUsers(updatedUsers);

    const active = {
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      lastLoginAt: loginAt,
    };

    setActiveUser(active);
    saveActiveUser(active);
    setLoginForm(initialLoginForm);
    setAuthDialogOpen(false);
    setInfoMessage(`Welcome back, ${user.name}.`);
  };

  const handleMenuAction = (action) => {
    if (action === "logout") {
      setActiveUser(null);
      saveActiveUser(null);
      setMenuOpen(false);
      setAuthMode("login");
      setAuthDialogOpen(true);
      setInfoMessage("You are now logged out.");
      return;
    }

    if (action === "profile") {
      setInfoMessage("Profile details are visible in this account panel.");
      return;
    }

    if (action === "sessions") {
      setInfoMessage("My Sessions dashboard will be added next.");
      return;
    }

    if (action === "saved") {
      setInfoMessage("Saved Mantras collection will be added next.");
      return;
    }

    if (action === "settings") {
      setInfoMessage("Account settings module will be added next.");
    }
  };

  return (
    <>
      <aside className="fixed right-4 top-4 z-[86] md:right-6 md:top-6">
        <div className="relative">
          <button
            type="button"
            onClick={openAccountPanel}
            className="aura-nav-shell flex h-11 w-11 items-center justify-center rounded-full border border-aura-gold/25 bg-aura-card/85 text-xs font-semibold uppercase text-aura-text transition hover:bg-aura-gold/12"
            aria-label={activeUser ? "Open account panel" : "Open sign in panel"}
            title={activeUser ? "My account" : "Sign in"}
          >
            {initials}
          </button>

          {activeUser && menuOpen && (
            <div className="aura-nav-shell absolute right-0 mt-2 w-[min(92vw,320px)] rounded-3xl p-3">
              <div className="rounded-2xl border border-aura-gold/15 bg-aura-bg/60 p-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-aura-gold md:text-xs">
                  My Account
                </p>
                <p className="mt-2 text-sm font-semibold text-aura-text">{activeUser.name}</p>
                <p className="mt-1 text-xs text-aura-textSoft">{activeUser.email}</p>
                <p className="mt-1 text-[11px] text-aura-textSoft/90">
                  Member since {formatJoinDate(activeUser.createdAt)}
                </p>

                <div className="mt-3 grid gap-2">
                  <button
                    type="button"
                    onClick={() => handleMenuAction("profile")}
                    className="rounded-xl border border-aura-gold/12 bg-aura-card/80 px-3 py-2 text-left text-xs text-aura-text transition hover:bg-aura-gold/10"
                  >
                    My Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMenuAction("sessions")}
                    className="rounded-xl border border-aura-gold/12 bg-aura-card/80 px-3 py-2 text-left text-xs text-aura-text transition hover:bg-aura-gold/10"
                  >
                    My Sessions
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMenuAction("saved")}
                    className="rounded-xl border border-aura-gold/12 bg-aura-card/80 px-3 py-2 text-left text-xs text-aura-text transition hover:bg-aura-gold/10"
                  >
                    Saved Mantras
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMenuAction("settings")}
                    className="rounded-xl border border-aura-gold/12 bg-aura-card/80 px-3 py-2 text-left text-xs text-aura-text transition hover:bg-aura-gold/10"
                  >
                    Account Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMenuAction("logout")}
                    className="rounded-xl border border-aura-gold/18 bg-aura-gold/12 px-3 py-2 text-left text-xs font-semibold text-aura-text transition hover:bg-aura-gold/20"
                  >
                    Logout
                  </button>
                </div>

                {infoMessage && (
                  <p className="mt-3 rounded-xl border border-aura-gold/12 bg-aura-bg/60 px-3 py-2 text-xs text-aura-textSoft">
                    {infoMessage}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>

      {authDialogOpen && !activeUser && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(28,18,8,0.42)] p-2 backdrop-blur-sm sm:p-4">
          <div className="w-full max-w-[min(94vw,26rem)] rounded-3xl border border-aura-gold/20 bg-aura-card/95 p-3 shadow-[0_20px_48px_rgba(28,18,8,0.25)] sm:p-4 md:p-5">
            <div className="mb-4 space-y-3 text-center sm:mb-5">
              <div className="mx-auto h-28 w-28 overflow-hidden rounded-full border border-aura-gold/20 bg-aura-card/85 sm:h-32 sm:w-32 md:h-40 md:w-40">
                <img
                  src={logoSrc}
                  alt="Inner Peace logo"
                  className="h-full w-full scale-110 object-cover"
                />
              </div>
              <div>
                <h3 className="text-xl font-semibold leading-tight text-aura-text sm:text-2xl md:text-3xl">
                  Welcome to the inner peace
                </h3>
                <p className="mt-1 text-xs text-aura-textSoft sm:text-sm">
                  Sign in or create your account with a valid email address to continue.
                </p>
              </div>

              <div className="flex rounded-full border border-aura-gold/20 bg-aura-bg/70 p-1 text-left">
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] transition sm:px-3 sm:text-xs ${
                    authMode === "login" ? "bg-aura-gold/25 text-aura-text" : "text-aura-textSoft"
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("signup")}
                  className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] transition sm:px-3 sm:text-xs ${
                    authMode === "signup" ? "bg-aura-gold/25 text-aura-text" : "text-aura-textSoft"
                  }`}
                >
                  Sign up
                </button>
              </div>
            </div>

            {authMode === "signup" ? (
              <form className="space-y-2 sm:space-y-3" onSubmit={handleSignup}>
                <h3 className="text-lg font-semibold leading-tight text-aura-text sm:text-xl">
                  Create your account
                </h3>
                <p className="text-xs text-aura-textSoft sm:text-sm">
                  Save progress, manage sessions, and personalize your experience.
                </p>

                <input
                  type="text"
                  value={signupForm.name}
                  onChange={(event) => setSignupForm((previous) => ({ ...previous, name: event.target.value }))}
                  placeholder="Full name"
                  className="aura-input w-full py-2 text-sm"
                  autoComplete="name"
                />
                <input
                  type="email"
                  value={signupForm.email}
                  onChange={(event) => setSignupForm((previous) => ({ ...previous, email: event.target.value }))}
                  placeholder="Email"
                  className="aura-input w-full py-2 text-sm"
                  autoComplete="email"
                />
                <input
                  type="password"
                  value={signupForm.password}
                  onChange={(event) => setSignupForm((previous) => ({ ...previous, password: event.target.value }))}
                  placeholder="Password (min 6 characters)"
                  className="aura-input w-full py-2 text-sm"
                  autoComplete="new-password"
                />

                <button
                  type="submit"
                  className="w-full rounded-full border border-aura-gold/30 bg-aura-gold/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-aura-text transition hover:bg-aura-gold/25 sm:text-xs"
                >
                  Create Account
                </button>
              </form>
            ) : (
              <form className="space-y-2 sm:space-y-3" onSubmit={handleLogin}>
                <h3 className="text-lg font-semibold leading-tight text-aura-text sm:text-xl">
                  Welcome back
                </h3>
                <p className="text-xs text-aura-textSoft sm:text-sm">
                  Login to view your profile and continue your sessions.
                </p>

                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(event) => setLoginForm((previous) => ({ ...previous, email: event.target.value }))}
                  placeholder="Email"
                  className="aura-input w-full py-2 text-sm"
                  autoComplete="email"
                />
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((previous) => ({ ...previous, password: event.target.value }))}
                  placeholder="Password"
                  className="aura-input w-full py-2 text-sm"
                  autoComplete="current-password"
                />

                <button
                  type="submit"
                  className="w-full rounded-full border border-aura-gold/30 bg-aura-gold/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-aura-text transition hover:bg-aura-gold/25 sm:text-xs"
                >
                  Login
                </button>
              </form>
            )}

            {formMessage && (
              <p className="mt-3 rounded-xl border border-aura-gold/12 bg-aura-bg/70 px-3 py-2 text-[11px] text-aura-textSoft sm:text-xs">
                {formMessage}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
