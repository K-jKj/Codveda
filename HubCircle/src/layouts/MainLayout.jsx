import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const MainLayout = () => {
  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 relative bg-gray-900">
        <header className="h-16 border-b border-gray-800 flex items-center px-8 shrink-0">
          <div className="text-sm font-medium text-gray-400">
            Dashboard
          </div>
        </header>

        <section className="flex-1 overflow-y-auto custom-scrollbar">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default MainLayout;
