import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { adminApi } from "../utils/adminApi";

export default function AdminLogin() {
  const { token, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Already logged in — go straight to the dashboard.
  if (token) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await adminApi.login(email, password);
      login(res.data.token);
      navigate("/admin");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#E4F3F1] to-[#FAF6EE] px-6">
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-white p-8 shadow-sm sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#129E9E]/15 text-[#129E9E]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622C12.176 19.29 16 14.591 16 9a11.99 11.99 0 00-.382-3.016z" />
              </svg>
            </div>
            <h1 className="mt-4 font-[Baloo_2] text-2xl font-bold text-[#14232B]">
              City Pulse Admin
            </h1>
            <p className="mt-1 text-sm text-[#14232B]/60">
              Sign in to view analytics and manage the waitlist.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label htmlFor="admin-email" className="mb-1.5 block text-sm font-semibold text-[#14232B]">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#14232B]/15 bg-[#F6F1E6] px-4 py-3 text-sm text-[#14232B] placeholder:text-[#14232B]/40 focus:border-[#129E9E] focus:outline-none focus:ring-2 focus:ring-[#129E9E]/20"
                placeholder="admin@citypulse.com"
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="mb-1.5 block text-sm font-semibold text-[#14232B]">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#14232B]/15 bg-[#F6F1E6] px-4 py-3 text-sm text-[#14232B] placeholder:text-[#14232B]/40 focus:border-[#129E9E] focus:outline-none focus:ring-2 focus:ring-[#129E9E]/20"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#129E9E] py-3 text-sm font-semibold text-[#FAF6EE] shadow-md transition-all hover:bg-[#0E7F7F] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[#14232B]/40">
            <Link to="/" className="hover:text-[#129E9E]">← Back to City Pulse</Link>
          </p>
        </div>
      </div>
    </div>
  );
}