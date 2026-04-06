import { Mail, Shield, LogOut, ArrowLeft, GraduationCap, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useState } from "react";
import api from "../api/axios";

export default function Profile() {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.log("error: ", error.message);
    }
    logout();
    navigate("/");
  };

  const handleBecomeInstructor = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const { data } = await api.post("/auth/become-instructor");
      login(data.user);
      setMessage({ type: "success", text: "You are now an instructor! You can now create courses." });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white font-sans selection:bg-indigo-500/30 flex flex-col items-center justify-center p-6">
      <section className="w-full max-w-xl bg-gray-800/30 border border-gray-700/50 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">

        {/* Banner */}
        <header className="h-32 bg-linear-to-r from-indigo-600 to-indigo-900 flex items-end justify-center px-8 relative">
          <Link to="/dashboard" className="absolute top-6 left-6 text-white/50 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="translate-y-12 w-24 h-24 bg-gray-900 rounded-2xl border-4 border-gray-900 flex items-center justify-center shadow-xl">
            <span className="text-4xl font-black text-indigo-500">{user?.name?.charAt(0)}</span>
          </div>
        </header>

        <div className="pt-16 pb-10 px-10 text-center">
          <h2 className="text-3xl font-black tracking-tight">{user?.name}</h2>

          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full mt-2 mb-2">
            <User size={11} className="text-indigo-400" />
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
              {user?.role || "student"}
            </span>
          </div>

          {message.text && (
            <p className={`mt-3 text-xs font-bold px-4 py-2 rounded-xl border ${
              message.type === "success"
                ? "text-green-400 bg-green-500/10 border-green-500/20"
                : "text-red-400 bg-red-500/10 border-red-500/20"
            }`}>
              {message.text}
            </p>
          )}

          <div className="mt-8 grid grid-cols-1 gap-4 text-left">
            <ProfileItem
              icon={<Mail size={18} className="text-indigo-400" />}
              label="Email Address"
              value={user?.email}
            />
            <ProfileItem
              icon={<Shield size={18} className="text-indigo-400" />}
              label="Access Tier"
              value={`${user?.role || "student"} Access`}
            />
          </div>

          {(!user?.role || user?.role === "student") && (
            <div className="mt-6 bg-gray-900/60 border border-indigo-500/20 rounded-2xl p-5 text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-indigo-600/15 rounded-xl flex items-center justify-center">
                  <GraduationCap size={18} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Become an Instructor</p>
                  <p className="text-xs text-gray-500">Create and manage your own courses</p>
                </div>
              </div>
              <button
                onClick={handleBecomeInstructor}
                disabled={loading}
                className="mt-3 w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <GraduationCap size={16} />
                {loading ? "Processing..." : "Upgrade to Instructor"}
              </button>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="mt-4 w-full bg-gray-900 hover:bg-red-500/10 border border-gray-700 hover:border-red-500/50 py-4 rounded-2xl text-gray-400 hover:text-red-400 font-bold transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            <span>Sign Out of Session</span>
          </button>
        </div>
      </section>

      <footer className="mt-8 text-gray-600 text-xs font-bold uppercase tracking-widest">
        HubCircle Privacy Protocol v1.0
      </footer>
    </main>
  );
}

const ProfileItem = ({ icon, label, value }) => (
  <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-2xl flex items-center gap-4 group hover:border-indigo-500/30 transition-colors">
    <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center border border-gray-800 group-hover:bg-indigo-500/10 transition-colors">
      {icon}
    </div>
    <div>
      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{label}</p>
      <p className="text-sm font-medium text-gray-200">{value}</p>
    </div>
  </div>
);