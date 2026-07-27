"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import GoldDivider from "@/components/GoldDivider";
import { formatNaira, NAIRA_PER_VOTE } from "@/lib/config";
import type { ContestantDTO, VotingSettingsDTO } from "@/types";

interface AdminDashboardProps {
  initialContestants: ContestantDTO[];
  initialSettings: VotingSettingsDTO;
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminDashboard({ initialContestants, initialSettings }: AdminDashboardProps) {
  const router = useRouter();
  const [contestants, setContestants] = useState(initialContestants);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [startsAt, setStartsAt] = useState(toDatetimeLocal(initialSettings.votingStartsAt));
  const [endsAt, setEndsAt] = useState(toDatetimeLocal(initialSettings.votingEndsAt));

  const [newName, setNewName] = useState("");
  const [newPhoto, setNewPhoto] = useState("");
  const [newBio, setNewBio] = useState("");

  function flash(message: string) {
    setNotice(message);
    setTimeout(() => setNotice(null), 4000);
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  async function handleSaveSettings(e: FormEvent) {
    e.preventDefault();
    setBusy("settings");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          votingStartsAt: new Date(startsAt).toISOString(),
          votingEndsAt: new Date(endsAt).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      flash("Voting window updated.");
    } catch (err) {
      flash(err instanceof Error ? err.message : "Failed to update voting window.");
    } finally {
      setBusy(null);
    }
  }

  async function handleAddContestant(e: FormEvent) {
    e.preventDefault();
    setBusy("add");
    try {
      const res = await fetch("/api/admin/contestants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, photoUrl: newPhoto, bio: newBio }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setContestants((prev) => [...prev, data.contestant].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      setNewPhoto("");
      setNewBio("");
      flash(`${data.contestant.name} added.`);
    } catch (err) {
      flash(err instanceof Error ? err.message : "Failed to add contestant.");
    } finally {
      setBusy(null);
    }
  }

  async function handleResetVotes(id: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/contestants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetVotes: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setContestants((prev) => prev.map((c) => (c.id === id ? data.contestant : c)));
      flash("Vote count reset.");
    } catch (err) {
      flash(err instanceof Error ? err.message : "Failed to reset votes.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this contestant permanently? This cannot be undone.")) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/contestants/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setContestants((prev) => prev.filter((c) => c.id !== id));
      flash("Contestant deleted.");
    } catch (err) {
      flash(err instanceof Error ? err.message : "Failed to delete contestant.");
    } finally {
      setBusy(null);
    }
  }

  const totalVotes = contestants.reduce((sum, c) => sum + c.voteCount, 0);

  return (
    <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Organizer Dashboard</p>
          <h1 className="mt-2 font-display text-3xl text-ink-50">Admin</h1>
        </div>
        <button onClick={handleLogout} className="btn-outline-gold">
          Sign Out
        </button>
      </div>

      {notice && (
        <div className="mb-6 rounded-xl border border-gold-400/30 bg-gold-400/10 px-4 py-3 font-body text-sm text-gold-100">
          {notice}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="frame-card px-5 py-4">
          <p className="font-body text-xs uppercase tracking-[0.2em] text-ink-400">Contestants</p>
          <p className="mt-1 font-display text-2xl text-gold-200">{contestants.length}</p>
        </div>
        <div className="frame-card px-5 py-4">
          <p className="font-body text-xs uppercase tracking-[0.2em] text-ink-400">Total Votes</p>
          <p className="mt-1 font-display text-2xl text-gold-200">{totalVotes.toLocaleString("en-NG")}</p>
        </div>
        <div className="frame-card px-5 py-4">
          <p className="font-body text-xs uppercase tracking-[0.2em] text-ink-400">Gross Revenue (est.)</p>
          <p className="mt-1 font-display text-2xl text-gold-200">{formatNaira(totalVotes * NAIRA_PER_VOTE)}</p>
        </div>
      </div>

      {/* Voting window */}
      <div className="frame-card mb-10 p-6 sm:p-8">
        <h2 className="font-display text-xl text-ink-50">Voting Window</h2>
        <GoldDivider className="my-4 !justify-start" />
        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block font-body text-xs uppercase tracking-[0.2em] text-ink-300">Opens At</label>
            <input
              type="datetime-local"
              required
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="field-input"
            />
          </div>
          <div>
            <label className="mb-2 block font-body text-xs uppercase tracking-[0.2em] text-ink-300">Closes At</label>
            <input
              type="datetime-local"
              required
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="field-input"
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={busy === "settings"} className="btn-gold">
              {busy === "settings" ? "Saving…" : "Save Voting Window"}
            </button>
          </div>
        </form>
      </div>

      {/* Add contestant */}
      <div className="frame-card mb-10 p-6 sm:p-8">
        <h2 className="font-display text-xl text-ink-50">Add Contestant</h2>
        <GoldDivider className="my-4 !justify-start" />
        <form onSubmit={handleAddContestant} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block font-body text-xs uppercase tracking-[0.2em] text-ink-300">Name</label>
            <input required value={newName} onChange={(e) => setNewName(e.target.value)} className="field-input" />
          </div>
          <div>
            <label className="mb-2 block font-body text-xs uppercase tracking-[0.2em] text-ink-300">Photo URL</label>
            <input
              required
              value={newPhoto}
              onChange={(e) => setNewPhoto(e.target.value)}
              placeholder="https://…"
              className="field-input"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-2 block font-body text-xs uppercase tracking-[0.2em] text-ink-300">Short Bio</label>
            <textarea
              required
              rows={2}
              value={newBio}
              onChange={(e) => setNewBio(e.target.value)}
              className="field-input"
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={busy === "add"} className="btn-gold">
              {busy === "add" ? "Adding…" : "Add Contestant"}
            </button>
          </div>
        </form>
      </div>

      {/* Contestants table */}
      <div className="frame-card mb-10 overflow-x-auto p-6 sm:p-8">
        <h2 className="font-display text-xl text-ink-50">Contestants</h2>
        <GoldDivider className="my-4 !justify-start" />
        <table className="w-full min-w-[560px] border-collapse font-body text-sm">
          <thead>
            <tr className="border-b border-gold-400/15 text-left text-ink-400">
              <th className="pb-2 pr-4 font-normal uppercase tracking-wider">Name</th>
              <th className="pb-2 pr-4 font-normal uppercase tracking-wider">Votes</th>
              <th className="pb-2 pr-4 font-normal uppercase tracking-wider">Revenue</th>
              <th className="pb-2 font-normal uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contestants.map((c) => (
              <tr key={c.id} className="border-b border-ink-700/60 text-ink-100">
                <td className="py-3 pr-4">{c.name}</td>
                <td className="py-3 pr-4 text-gold-200">{c.voteCount.toLocaleString("en-NG")}</td>
                <td className="py-3 pr-4">{formatNaira(c.voteCount * NAIRA_PER_VOTE)}</td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleResetVotes(c.id)}
                      disabled={busy === c.id}
                      className="rounded-full border border-ink-500/40 px-3 py-1 text-xs uppercase tracking-wide text-ink-300 hover:border-gold-400/40 hover:text-gold-200 disabled:opacity-40"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={busy === c.id}
                      className="rounded-full border border-burgundy-300/40 px-3 py-1 text-xs uppercase tracking-wide text-burgundy-200 hover:bg-burgundy-400/10 disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {contestants.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-ink-400">
                  No contestants yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Exports */}
      <div className="frame-card p-6 sm:p-8">
        <h2 className="font-display text-xl text-ink-50">Export</h2>
        <GoldDivider className="my-4 !justify-start" />
        <div className="flex flex-wrap gap-3">
          <a href="/api/admin/export?type=results" className="btn-outline-gold">
            Download Results CSV
          </a>
          <a href="/api/admin/export?type=transactions" className="btn-outline-gold">
            Download Transactions CSV
          </a>
        </div>
      </div>
    </section>
  );
}
