import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Loader2, ArrowLeft } from "lucide-react";
import api from "../api/axios";

const CATEGORIES = ["Design", "Development", "AI & ML", "Business", "Marketing", "Data Science", "Other"];

export default function CreateCourse() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", description: "", category: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/courses", form);
      navigate(`/courses/${data.course._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="text-white font-sans">
      <div className="px-6 md:px-10 pt-10 pb-8 border-b border-gray-800">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft size={16} /> Back
          </button>
          <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">Instructor</p>
          <h1 className="text-3xl font-black tracking-tight">Create a Course</h1>
        </div>
      </div>

      <div className="px-6 md:px-10 py-10 max-w-2xl mx-auto">
        {error && (
          <div className="mb-6 p-4 rounded-xl text-sm font-bold bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Course Title</label>
            <input
              name="title"
              type="text"
              required
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Full-Stack React"
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-4 text-white placeholder-gray-600 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Description</label>
            <textarea
              name="description"
              required
              value={form.description}
              onChange={handleChange}
              placeholder="What will students learn?"
              rows={4}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-4 text-white placeholder-gray-600 outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Category</label>
            <select
              name="category"
              required
              value={form.category}
              onChange={handleChange}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-3 px-4 text-white outline-none focus:border-indigo-500 transition-colors appearance-none"
            >
              <option value="" disabled>Select a category</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-bold text-white transition-all flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <BookOpen size={20} />}
            {loading ? "Creating..." : "Create Course"}
          </button>
        </form>
      </div>
    </main>
  );
}