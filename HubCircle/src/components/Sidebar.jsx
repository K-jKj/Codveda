import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Settings,
  LogOut,
  GraduationCap,
  UserCircle,
  Plus,
  Home,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import api from "../api/axios";

function Sidebar() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout failed:", error.message);
    }
    logout();
    navigate("/");
  };

  const isInstructor = user?.role === "instructor" || user?.role === "admin";

  return (
    <aside className="w-20 lg:w-60 bg-gray-900 border-r border-gray-800 flex flex-col h-full">

      <header className="h-16 border-b border-gray-800 shrink-0">
        <Link to="/dashboard" className="flex items-center gap-3 px-5 h-full hover:opacity-80 transition-opacity">
          <div className="bg-indigo-600 p-2 rounded-lg shrink-0">
            <GraduationCap className="text-white" size={20} />
          </div>
          <span className="text-base font-bold tracking-tight hidden lg:block text-white">
            Hub<span className="text-indigo-500">Circle</span>
          </span>
        </Link>
      </header>

      <nav className="flex-1 px-3 py-5 flex flex-col gap-6 overflow-y-auto custom-scrollbar">

        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 px-3 mb-2 hidden lg:block">Main</p>
          <SidebarLink to="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" />
          <SidebarLink to="/courses" icon={<BookOpen size={18} />} label="Courses" />
        </div>

        {isInstructor && (
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 px-3 mb-2 hidden lg:block">Instructor</p>
            <SidebarLink to="/courses/create" icon={<Plus size={18} />} label="Create Course" />
          </div>
        )}
      </nav>

      <footer className="px-3 py-4 border-t border-gray-800 shrink-0 space-y-1">

        <Link
          to="/profile"
          className="hidden lg:flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-800 transition-all group mb-2"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-black shrink-0 uppercase">
            {user?.name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-200 truncate">{user?.name}</p>
            <p className="text-[10px] text-gray-500 truncate">{user?.role || "student"}</p>
          </div>
          <UserCircle size={15} className="text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" />
        </Link>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `lg:hidden flex items-center justify-center p-3 rounded-xl transition-all
            ${isActive ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-800 hover:text-gray-200"}`
          }
        >
          <UserCircle size={18} />
        </NavLink>

        <SidebarLink to="/" icon={<Home size={18} />} label="Home" />
        <SidebarLink to="/settings" icon={<Settings size={18} />} label="Settings" />

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut size={18} className="shrink-0" />
          <span className="text-sm font-medium hidden lg:block">Logout</span>
        </button>
      </footer>
    </aside>
  );
}

const SidebarLink = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium
      ${isActive
        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
        : "text-gray-500 hover:bg-gray-800 hover:text-gray-200"
      }`
    }
  >
    <div className="shrink-0">{icon}</div>
    <span className="hidden lg:block">{label}</span>
  </NavLink>
);

export default Sidebar;