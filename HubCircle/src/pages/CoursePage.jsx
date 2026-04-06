import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Users, Search, Loader2, CheckCircle, Plus, Trash2, Pencil } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/useAuth";

export default function CoursePage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allRes, myRes] = await Promise.all([
          api.get("/courses"),
          api.get("/courses/my-courses"),
        ]);
        setCourses(allRes.data.data);
        setEnrolledIds(new Set(myRes.data.data.map(c => c._id)));
      } catch (err) {
        console.error("Failed to fetch courses", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleEnroll = async (courseId) => {
    setEnrollingId(courseId);
    try {
      await api.post(`/courses/${courseId}/enroll`);
      setEnrolledIds(prev => new Set([...prev, courseId]));
    } catch (err) {
      console.error("Enroll failed:", err.response?.data?.message);
    } finally {
      setEnrollingId(null);
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    setDeletingId(courseId);
    try {
      await api.delete(`/courses/${courseId}`);
      setCourses(prev => prev.filter(c => c._id !== courseId));
    } catch (err) {
      console.error("Delete failed:", err.response?.data?.message);
    } finally {
      setDeletingId(null);
    }
  };

  const isOwnerOrAdmin = (course) =>
    user?.role === "admin" || course.instructor?._id === user?._id;

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex-1 flex items-center justify-center py-24">
      <Loader2 className="animate-spin text-indigo-500" size={32} />
    </div>
  );

  return (
    <main className="text-white font-sans">
      <div className="px-6 md:px-10 pt-10 pb-8 border-b border-gray-800">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">Library</p>
            <h1 className="text-3xl font-black tracking-tight">All Courses</h1>
          </div>
          {(user?.role === "instructor" || user?.role === "admin") && (
            <Link to="/courses/create" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 rounded-xl text-sm font-bold transition-all">
              <Plus size={16} /> Create Course
            </Link>
          )}
        </div>
      </div>

      <div className="px-6 md:px-10 py-8 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-2.5 mb-8">
          <Search size={15} className="text-gray-500 shrink-0" />
          <input
            type="text"
            placeholder="Search courses or categories…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-500">No courses found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(course => {
              const enrolled = enrolledIds.has(course._id);
              const enrolling = enrollingId === course._id;
              const deleting = deletingId === course._id;
              const canManage = isOwnerOrAdmin(course);

              return (
                <div key={course._id} className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-6 flex flex-col hover:border-indigo-500/40 transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 bg-indigo-600/15 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <BookOpen size={18} className="text-indigo-400" />
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/courses/${course._id}/edit`}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                        >
                          <Pencil size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(course._id)}
                          disabled={deleting}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                        >
                          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1">{course.category}</span>
                  <h3 className="font-bold text-base mb-1">{course.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed mb-4 flex-1 line-clamp-2">{course.description}</p>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1"><Users size={11} />{course.enrollmentCount || 0} enrolled</span>
                    <span className="text-gray-600">by {course.instructor?.name}</span>
                  </div>

                  {enrolled ? (
                    <Link
                      to={`/courses/${course._id}`}
                      className="w-full flex items-center justify-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 py-2.5 rounded-xl text-sm font-bold transition-all hover:bg-green-500/20"
                    >
                      <CheckCircle size={15} /> Enter Hub
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleEnroll(course._id)}
                      disabled={enrolling}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {enrolling ? <Loader2 size={15} className="animate-spin" /> : "Enroll Now"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}