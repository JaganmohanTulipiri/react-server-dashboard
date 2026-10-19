import React, { useState } from "react";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === "admin" && password === "1234") {
      onLogin(username);
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#020d1b] text-white">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover opacity-45"
      >
        <source src="/dashboard-bg.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(8,145,178,0.14),_transparent_35%),linear-gradient(180deg,_rgba(2,13,27,0.55)_0%,_rgba(4,26,45,0.7)_100%)]" />

      <div className="absolute inset-0 opacity-25">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:36px_36px]" />
      </div>

      <div className="absolute left-[-80px] top-1/2 h-[280px] w-[280px] -translate-y-1/2 rounded-full border border-white/10" />
      <div className="absolute right-[-110px] top-[58%] h-[240px] w-[240px] -translate-y-1/2 rounded-full border border-white/10" />

      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="w-[430px] max-w-[90vw] rounded-[30px] border border-white/10 bg-[#2a3640]/80 p-7 shadow-[0_0_35px_rgba(16,185,129,0.12)] backdrop-blur-sm">
          <div className="mb-6 flex flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-300/50 bg-[#1d2d38]/80 text-2xl text-emerald-200 shadow-[0_0_20px_rgba(45,212,191,0.35)]">
              ⚙
            </div>

            <h1 className="text-[2.2rem] font-bold leading-[1.1] text-white">
              DevOps Connection
            </h1>
            <h2 className="text-[2.2rem] font-bold leading-[1.1] text-white">Portal</h2>
            <p className="mt-4 text-sm tracking-[0.38em] text-emerald-300">SECURE ACCESS</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-2 block text-xl font-medium text-white/90">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#1b2a34]/80 p-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xl font-medium text-white/90">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#1b2a34]/80 p-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                required
              />
            </div>

            {error && <p className="text-sm text-red-300">{error}</p>}

            <button
              type="submit"
              className="mt-3 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 py-3 text-2xl font-bold text-white shadow-[0_0_25px_rgba(45,212,191,0.35)] transition hover:brightness-110"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
