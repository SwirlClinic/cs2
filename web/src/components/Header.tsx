"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface User {
  authenticated: boolean;
  steamId?: string;
  username?: string;
  avatar?: string;
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then(setUser)
      .catch(() => setUser({ authenticated: false }));
  }, []);

  return (
    <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-text-bright">CS2 Loadout</h1>
      </div>

      <div className="flex items-center gap-3">
        {user?.authenticated ? (
          <>
            <div className="flex items-center gap-2">
              {user.avatar && (
                <Image
                  src={user.avatar}
                  alt=""
                  width={28}
                  height={28}
                  className="rounded"
                  unoptimized
                />
              )}
              <span className="text-sm text-text">{user.username}</span>
            </div>
            <a
              href="/api/auth/logout"
              className="text-sm text-text-dim hover:text-text transition-colors"
            >
              Logout
            </a>
          </>
        ) : user === null ? (
          <span className="text-sm text-text-dim">Loading...</span>
        ) : (
          <a
            href="/api/auth/steam"
            className="text-sm bg-accent hover:bg-accent-hover text-white px-3 py-1.5 rounded transition-colors"
          >
            Sign in
          </a>
        )}
      </div>
    </header>
  );
}
