import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BookOpen, Loader2, ArrowLeft, Trash2 } from "lucide-react";
import api from "../api/axios";

const CATEGORIES = ["Design", "Development", "AI & ML", "Business", "Marketing", "Data Science", "Other"];

export default function EditCourse() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", description: "", category: "" });

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { data } = await api.get(`/courses/${courseId}`);
        setForm({
          title: data.title,
          description: data.description,
          category: data.category,
        });
      } catch (err) {
        setError("Failed to load course.", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.put(`/courses/${courseId}`, form);
      navigate(`/courses/${courseId}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update course");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this course? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await api.delete(`/courses/${courseId}`);
      navigate("/courses");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete course");
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center py-24">
      <Loader2 className="animate-spin text-indigo-500" size={32} />
    </div>
  );

  return (
    <main className="text-white font-sans">
      <div className="px-6 md:px-10 pt-10 pb-8 border-b border-gray-800">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft size={16} /> Back
          </button>
          <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">Instructor</p>
          <h1 className="text-3xl font-black tracking-tight">Edit Course</h1>
        </div>
      </div>

      <div className="px-6 md:px-10 py-10 max-w-2xl mx-auto">
        {error && (
          <div className="mb-6 p-4 rounded-xl text-sm font-bold bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Course Title</label>
            <input
              name="title"
              type="text"
              required
              value={form.title}
              onChange={handleChange}
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
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-bold text-white transition-all flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <BookOpen size={20} />}
            {saving ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 py-4 rounded-2xl font-bold text-red-400 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {deleting ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
            {deleting ? "Deleting..." : "Delete Course"}
          </button>
        </form>
      </div>
    </main>
  );
}