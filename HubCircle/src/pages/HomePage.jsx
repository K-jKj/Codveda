import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Users, Layout } from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/useAuth";

function HomePage() {
  const { isLoggedIn } = useAuth();

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-indigo-500/30">
      <Navbar />

      <main className = "pt-10" >
        <section className="max-w-7xl mx-auto px-6 py-10 md:py-12 lg:py-16 flex flex-col items-center text-center">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-indigo-400 uppercase tracking-widest">
              New Courses Added Weekly
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 max-w-4xl leading-tight">
            Master the skills that{" "}
            <span className="text-indigo-500">shape the future.</span>
          </h1>

          <p className="text-gray-400 text-base md:text-lg lg:text-xl max-w-2xl mb-8 leading-relaxed">
            Join many students learning from industry experts and peers. Get lifetime
            access to interactive channels, high-quality resources, and a global
            community.
          </p>

          <div className="w-full sm:w-auto flex justify-center">
            <Link
              to={isLoggedIn ? "/dashboard" : "/signup"}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 px-10 py-3.5 rounded-xl text-lg font-bold flex items-center justify-center space-x-2 transition-all shadow-xl shadow-indigo-600/20"
            >
              <span>{isLoggedIn ? "Go to Dashboard" : "Start Learning"}</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Users className="text-indigo-500" />}
              title="Interactive Channels"
              desc="Chat in real-time with peers and instructors in dedicated course channels."
            />
            <FeatureCard
              icon={<Layout className="text-indigo-500" />}
              title="Structured Learning"
              desc="Follow organized paths designed by experts to master complex topics."
            />
            <FeatureCard
              icon={<BookOpen className="text-indigo-500" />}
              title="Curative Resources"
              desc="Access high-quality materials and hand-picked tools for your journey."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-800 py-8 px-6 text-center text-gray-500 text-sm">
        <p>© 2026 HubCircle. All rights reserved.</p>
      </footer>
    </div>
  );
}

const FeatureCard = ({ icon, title, desc }) => (
  <div className="bg-gray-800/30 border border-gray-700/50 p-8 rounded-2xl hover:border-indigo-500/50 transition-all group">
    <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
  </div>
);

export default HomePage;