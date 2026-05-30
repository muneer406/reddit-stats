"use client";
import { useState, useRef, KeyboardEvent } from "react";

interface Props {
  usernames: string[];
  onChange: (u: string[]) => void;
  loading: boolean;
}

export default function UserInput({ usernames, onChange, loading }: Props) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function add(raw: string) {
    const name = raw.trim().replace(/^u\/?/i, "").toLowerCase();
    if (!name || usernames.includes(name)) return;
    onChange([...usernames, name]);
    setInput("");
  }

  function remove(name: string) {
    onChange(usernames.filter((u) => u !== name));
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); add(input); }
    if ((e.key === "," || e.key === " ") && input.trim()) { e.preventDefault(); add(input); }
    if (e.key === "Backspace" && !input && usernames.length > 0) {
      remove(usernames[usernames.length - 1]);
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text");
    if (text.includes(",") || text.includes("\n") || text.includes(" ")) {
      e.preventDefault();
      const parts = text.split(/[,\n\s]+/).filter(Boolean);
      const next = [...usernames];
      for (const p of parts) {
        const n = p.trim().replace(/^u\/?/i, "").toLowerCase();
        if (n && !next.includes(n)) next.push(n);
      }
      onChange(next);
      setInput("");
    }
  }

  return (
    <div>
      <div style={{ marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span className="panel-title" style={{ marginBottom: 0, fontSize: "0.6rem" }}>
          TARGET USERS
        </span>
        <span className="mono" style={{ fontSize: "0.6rem", color: "var(--text-dim)" }}>
          [ENTER / COMMA / SPACE TO ADD]
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.6rem", minHeight: usernames.length ? "auto" : 0 }}>
        {usernames.map((name) => (
          <span key={name} className="tag fade-up">
            <span style={{ color: "var(--text-secondary)" }}>u/</span>
            {name}
            <button className="tag-x" onClick={() => remove(name)} disabled={loading}>×</button>
          </span>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          ref={inputRef}
          className="inp"
          placeholder={usernames.length ? "add another user..." : "e.g. Murderous_monk, spez"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          onPaste={handlePaste}
          disabled={loading}
        />
        <button
          className="btn btn-ghost"
          onClick={() => add(input)}
          disabled={!input.trim() || loading}
          style={{ whiteSpace: "nowrap", padding: "0.5rem 1rem", fontFamily: "'Share Tech Mono', monospace", fontSize: "0.72rem" }}
        >
          + ADD
        </button>
      </div>
    </div>
  );
}
