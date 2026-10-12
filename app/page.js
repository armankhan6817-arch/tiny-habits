"use client";

import { useState } from "react";

export default function Home() {
  const [goal, setGoal] = useState("");
  const [habits, setHabits] = useState([]);
  const [forGoal, setForGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

      <div className="relative mx-auto max-w-lg">
        {/* header */}
        <header className="mb-10 text-center">
          <span className="mb-4 inline-block rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-indigo-300">
            Tiny Habits
          </span>
          <h1 className="bg-gradient-to-r from-white via-indigo-200 to-fuchsia-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            Build better days
          </h1>
          <p className="mt-3 text-slate-400">
            Tell me a goal. I'll turn it into 3 tiny habits you can start today.
          </p>
        </header>

        {/* card */}
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

          {error && (
            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

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
                    <span className="text-slate-200">{habit}</span>
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
