import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/useAuth";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/auth/login", { email, password });
      login(data.user); 
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid Credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center p-6 font-sans">
      <section className="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
        <header className="p-8 pb-0 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600/20 rounded-full mb-4">
            <ShieldCheck className="text-indigo-500" size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome Back To HubCircle
          </h1>
          {error && (
            <p className="mt-4 text-red-400 text-xs font-bold bg-red-500/10 py-2 rounded-lg border border-red-500/20">
              {error}
            </p>
          )}
          {!error && (
            <p className="text-gray-400 mt-2 text-sm">
              Enter your credentials to access your dashboard
            </p>
          )}
        </header>

        <div className="p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-500 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Password
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-3 pl-10 pr-12 text-white placeholder-gray-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-indigo-600/20"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <footer className="mt-8 pt-6 border-t border-gray-700/50 text-center">
            <p className="text-gray-500 text-sm">
              New here?{" "}
              <Link to="/signup" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">
                Create an account
              </Link>
            </p>
          </footer>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;