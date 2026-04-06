import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout, MessageSquare, ArrowRight, Loader2, Compass } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/useAuth";

export default function Dashboard() {
  const { user } = useAuth();
  const [myHubs, setMyHubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyHubs = async () => {
      try {
        const { data } = await api.get("/courses/my-courses");
        setMyHubs(data.data);
      } catch (err) {
        console.error("Dashboard error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyHubs();
  }, []);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center py-24">
      <Loader2 className="animate-spin text-indigo-500" size={32} />
    </div>
  );

  return (
    <main className="text-white font-sans selection:bg-indigo-500/30">

      <section className="pt-10 pb-12 px-6 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full mb-3">
              <Layout size={14} className="text-indigo-400" />
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Student Portal</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight">
              Welcome back, {user?.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-gray-400 mt-2">
              You have access to {myHubs.length} hub{myHubs.length !== 1 ? "s" : ""}.
            </p>
          </div>
          <Link to="/courses" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold text-sm transition-colors mb-1">
            <Compass size={18} /> Browse All Courses
          </Link>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {myHubs.length > 0 ? (
            myHubs.map(hub => (
              <article key={hub._id} className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-8 hover:border-indigo-500/50 transition-all group flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform border border-gray-800">
                    <MessageSquare className="text-indigo-500" size={20} />
                  </div>
                  <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg uppercase tracking-widest border border-indigo-500/20">
                    {hub.category}
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-3 group-hover:text-indigo-400 transition-colors">{hub.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-8 flex-1 line-clamp-2">{hub.description}</p>

                <footer className="flex gap-3">
                  <Link
                    to={`/courses/${hub._id}`}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold text-sm text-center transition-all active:scale-95 shadow-lg shadow-indigo-600/10"
                  >
                    Enter Hub
                  </Link>
                  <Link
                    to={`/courses/${hub._id}`}
                    className="bg-gray-800 hover:bg-gray-700 p-3 rounded-xl transition-all border border-gray-700"
                  >
                    <ArrowRight size={18} className="text-gray-400" />
                  </Link>
                </footer>
              </article>
            ))
          ) : (
            <div className="col-span-full py-24 text-center bg-gray-800/20 border border-dashed border-gray-700 rounded-3xl">
              <p className="text-gray-500 mb-6">No active hubs yet.</p>
              <Link
                to="/courses"
                className="bg-indigo-600 hover:bg-indigo-500 px-8 py-3 rounded-xl font-bold transition-all shadow-xl shadow-indigo-600/20"
              >
                Explore Courses
              </Link>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-gray-800 py-8 px-6 text-center text-gray-600 text-xs uppercase tracking-widest font-bold">
        © 2026 HubCircle Command Center
      </footer>
    </main>
  );
}