import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { adminApi } from "../utils/adminApi";
import { Button, Input, Icon, Card } from "../components/admin/ui";

export default function AdminLogin() {
  const { token, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Already logged in — go straight to the dashboard.
  if (token) {
    return <Navigate to="/admin-pulse" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await adminApi.login(email, password);
      login(res.data.token);
      navigate("/admin-pulse");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#E4F3F1] to-[#FAF6EE] px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#129E9E]/15 text-[#129E9E] mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622C12.176 19.29 16 14.591 16 9a11.99 11.99 0 00-.382-3.016z" />
            </svg>
          </div>
          <h1 className="font-[Baloo_2] text-2xl font-bold text-[#14232B]">
            City Pulse Admin
          </h1>
          <p className="mt-1 text-sm text-[#14232B]/60">
            Sign in to view analytics and manage the waitlist.
          </p>
        </div>

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <Input
              label="Email"
              id="admin-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@citypulse.com"
              leftIcon={<Icon name="alternate_email" size={18} />}
              autoComplete="email"
              autoFocus
            />

            <Input
              label="Password"
              id="admin-password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Icon name="lock" size={18} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#14232B]/50 hover:text-[#129E9E] transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <Icon name={showPassword ? "visibility_off" : "visibility"} size={18} />
                </button>
              }
              autoComplete="current-password"
            />

            {error && (
              <div className="bg-red-50 px-4 py-3 text-sm text-red-700 rounded-lg flex items-center gap-2" role="alert">
                <Icon name="error" size={18} className="text-red-500 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              fullWidth
              size="lg"
              className="mt-2"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-[#14232B]/40">
            <Link to="/" className="hover:text-[#129E9E] transition-colors">← Back to City Pulse</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}