import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Compass, Layout, LogOut, Settings, ChevronDown, BookOpen, UserCircle } from "lucide-react";
import { useAuth } from "../context/useAuth";
import api from "../api/axios";

export default function Navbar() {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const { user, isLoggedIn, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error.message);
    }
    logout();
    setShowDropdown(false);
    navigate("/");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        <div className="flex items-center gap-5">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-indigo-600 p-1.5 rounded-lg group-hover:scale-110 transition-transform shadow-lg shadow-indigo-600/20">
              <Compass size={20} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter italic text-white">
              HUB<span className="text-indigo-500">CIRCLE</span>
            </span>
          </Link>

          <NavLink
            to="/courses"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200 ${
                isActive
                  ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-300"
                  : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5 hover:border-white/8"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                  isActive ? "bg-indigo-500/30" : "bg-indigo-500/15"
                }`}>
                  <BookOpen size={13} className="text-indigo-400" />
                </span>
                <span className="hidden sm:inline text-sm font-medium tracking-wide">Courses</span>
              </>
            )}
          </NavLink>
        </div>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 p-1 pr-3 rounded-full bg-gray-800 border border-gray-700 hover:border-indigo-500 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-xs uppercase">
                  {user?.name?.charAt(0)}
                </div>
                <span className="text-sm font-bold text-gray-300 hidden sm:block">{user?.name}</span>
                <ChevronDown size={14} className={`text-gray-500 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-3 w-64 bg-gray-900 border border-gray-800 rounded-2xl p-2 shadow-2xl z-50">
                  <div className="px-4 py-4 border-b border-gray-800 mb-1">
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Active Session</p>
                    <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <Link to="/dashboard" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-gray-400 hover:bg-gray-800 hover:text-white rounded-xl transition-colors">
                    <Layout size={16} className="text-indigo-400" /> Dashboard
                  </Link>
                  <Link to="/profile" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-gray-400 hover:bg-gray-800 hover:text-white rounded-xl transition-colors">
                    <UserCircle size={16} className="text-indigo-400" /> Profile
                  </Link>
                  <Link to="/settings" onClick={() => setShowDropdown(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-gray-400 hover:bg-gray-800 hover:text-white rounded-xl transition-colors">
                    <Settings size={16} className="text-indigo-400" /> Settings
                  </Link>
                  <div className="mt-1 pt-1 border-t border-gray-800">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">Sign In</Link>
              <Link to="/signup" className="bg-indigo-600 hover:bg-indigo-500 px-6 py-2 rounded-full text-sm font-black text-white shadow-lg shadow-indigo-600/20 active:scale-95 transition-all uppercase tracking-wider">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}