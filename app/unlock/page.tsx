"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function UnlockInner() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useSearchParams();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Invalid passcode");
      const next = params.get("next") || "/";
      router.replace(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to unlock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow-xl p-6">
        <h1 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">Enter passcode</h1>
        <div className="space-y-3">
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Passcode"
            className="w-full h-11 rounded-xl border border-slate-300/80 dark:border-slate-700/70 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 px-4"
          />
          {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
          <button
            type="submit"
            disabled={loading || !code}
            className="w-full h-11 rounded-lg bg-indigo-600 text-white font-medium shadow hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Checking…" : "Unlock"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function UnlockPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-6 text-slate-600">Loading…</div>}>
      <UnlockInner />
    </Suspense>
  );
}
