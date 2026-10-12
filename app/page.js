"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase.js";

// Deterministic "random" values so server and client render the same bubbles
// (Math.random() here would cause a hydration mismatch).
const rand = (i, seed) => {
  const x = Math.sin((i + 1) * seed) * 10000;
  return x - Math.floor(x);
};

const BUBBLES = Array.from({ length: 22 }, (_, i) => ({
  left: (rand(i, 12.9898) * 100).toFixed(2), // % across the screen
  size: (8 + rand(i, 78.233) * 52).toFixed(0), // 8px – 60px
  duration: (9 + rand(i, 37.719) * 14).toFixed(2), // rise time 9s – 23s
  delay: (-rand(i, 93.989) * 23).toFixed(2), // negative = already mid-flight on load
  sway: (2.5 + rand(i, 45.164) * 3).toFixed(2), // side-to-side wobble speed
  hue: rand(i, 61.337) > 0.5 ? "indigo" : "fuchsia",
}));

export default function Home() {
  const [goal, setGoal] = useState("");
  const [habits, setHabits] = useState([]);
  const [forGoal, setForGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // auth
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error restoring session:", error);
    } else {
      setSession(data.session);
    }
  }

  async function handleSave(habit) {
    supabase
      .from("habits")
      .insert({ habit: habit, goal: forGoal })
      .then(({ data, error }) => {
        if (error) {
          console.error("Error saving habit:", error);
          setError("Failed to save habit. Please try again.");
        } else {
          console.log("Habit saved:", data);
        }
      });
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoggingIn(true);
    setError("");

    // `error` here is Supabase's error object (it shadows the state variable inside this function)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoggingIn(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSession(data.session);
    setPassword("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = goal.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");
    setHabits([]);

    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: trimmed }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);

      const data = await res.json();
      if (!Array.isArray(data.habits)) {
        throw new Error("Unexpected response from server.");
      }

      setHabits(data.habits.slice(0, 3));
      setForGoal(trimmed);
    } catch (err) {
      console.error(err);
      setError("Couldn't generate habits. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-16 text-slate-100">
      {/* background glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-indigo-600/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-fuchsia-600/20 blur-3xl" />

      {/* rising bubbles */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {BUBBLES.map((b, i) => (
          <span
            key={i}
            className="bubble-rise absolute bottom-0"
            style={{
              left: `${b.left}%`,
              animationDuration: `${b.duration}s`,
              animationDelay: `${b.delay}s`,
            }}
          >
            <span
              className={`bubble-warp block rounded-full bubble-${b.hue}`}
              style={{
                width: `${b.size}px`,
                height: `${b.size}px`,
                animationDuration: `${b.sway}s`,
              }}
            />
          </span>
        ))}
      </div>

      <style>{`
        .bubble-rise {
          animation-name: bubble-rise;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform, opacity;
        }
        .bubble-warp {
          animation-name: bubble-warp;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-direction: alternate;
          backdrop-filter: blur(2px);
        }
        .bubble-indigo {
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.55), rgba(129,140,248,0.18) 40%, rgba(99,102,241,0.05) 70%);
          border: 1px solid rgba(165,180,252,0.35);
          box-shadow: inset 0 0 12px rgba(165,180,252,0.25), 0 0 18px rgba(99,102,241,0.25);
        }
        .bubble-fuchsia {
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.55), rgba(232,121,249,0.18) 40%, rgba(217,70,239,0.05) 70%);
          border: 1px solid rgba(240,171,252,0.35);
          box-shadow: inset 0 0 12px rgba(240,171,252,0.25), 0 0 18px rgba(217,70,239,0.25);
        }

        /* straight up the screen, fading in at the bottom and out at the top */
        @keyframes bubble-rise {
          0%   { transform: translateY(80px);   opacity: 0; }
          10%  { opacity: 1; }
          85%  { opacity: 0.9; }
          100% { transform: translateY(-110vh); opacity: 0; }
        }

        /* the "warp": drift side to side while squishing like a real bubble */
        @keyframes bubble-warp {
          0%   { transform: translateX(-14px) scale(1, 1); }
          33%  { transform: translateX(6px)   scale(1.08, 0.93); }
          66%  { transform: translateX(-4px)  scale(0.94, 1.07); }
          100% { transform: translateX(14px)  scale(1.04, 0.97); }
        }

        @media (prefers-reduced-motion: reduce) {
          .bubble-rise, .bubble-warp { animation: none; opacity: 0; }
        }
      `}</style>

      <div className="relative mx-auto max-w-lg">
        {/* header */}
        <header className="mb-8 text-center">
          <span className="mb-4 inline-block rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-indigo-300">
            Tiny Habits
          </span>
          <h1 className="bg-gradient-to-r from-white via-indigo-200 to-fuchsia-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            Build better days
          </h1>
          <p className="mt-3 text-slate-400">
            Tell me a goal. I'll turn it into 3 tiny habits you can start today.
          </p>

          {/* auth status line */}
          <div className="mt-6 flex justify-center">
            <div
              className={`inline-flex items-center gap-2.5 rounded-full border px-4 py-1.5 text-sm font-medium backdrop-blur-md transition-colors ${
                session
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                  : "border-white/10 bg-white/5 text-slate-400"
              }`}
            >
              <span className="relative flex h-2.5 w-2.5">
                {session && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                )}
                <span
                  className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                    session ? "bg-emerald-400" : "bg-slate-500"
                  }`}
                />
              </span>
              <span className="capitalize">
                {session ? "logged in" : "logged out"}
              </span>
              {session?.user?.email && (
                <span className="max-w-[160px] truncate text-emerald-300/70">
                  · {session.user.email}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* shared error message (login + habits) */}
        {error && (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        {/* login card — only when logged out */}
        {!session && (
          <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-indigo-950/50 backdrop-blur-xl">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Log in
            </h2>
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                disabled={loggingIn}
                className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                required
                disabled={loggingIn}
                className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={loggingIn || !email || !password}
                className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-5 py-3 font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loggingIn ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Logging in…
                  </>
                ) : (
                  "Log in"
                )}
              </button>
            </form>
          </section>
        )}

        {/* habits card */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-indigo-950/50 backdrop-blur-xl">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Read more"
              disabled={loading}
              className="flex-1 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !goal.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-5 py-3 font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Thinking…
                </>
              ) : (
                "Get habits"
              )}
            </button>
          </form>

          {/* list */}
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Tiny habits
              </h2>
              {forGoal && (
                <span className="max-w-[60%] truncate rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-slate-300">
                  for “{forGoal}”
                </span>
              )}
            </div>

            {loading ? (
              <ul className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <li
                    key={i}
                    className="h-12 animate-pulse rounded-xl border border-white/5 bg-slate-900/50"
                  />
                ))}
              </ul>
            ) : habits.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-slate-500">
                No habits yet — type a goal and hit Get habits.
              </div>
            ) : (
              <ul className="space-y-2">
                {habits.map((habit, i) => (
                  <li
                    key={i}
                    className="group flex items-center gap-3 rounded-xl border border-white/5 bg-slate-900/50 px-4 py-3 transition hover:border-indigo-400/30 hover:bg-slate-900/80"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="text-slate-200">
                      {habit}
                      <button
                        className="ml-2 rounded-md bg-indigo-500 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        onClick={() => handleSave(habit)}
                      >
                        Save
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
