import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Hash, Megaphone, FolderOpen, Loader2, UserPlus, CheckCircle, ArrowLeft, Plus, X, ClipboardCheck, Trash } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/useAuth";

export default function ChannelPage() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);
  const [joinedIds, setJoinedIds] = useState(new Set());

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelType, setNewChannelType] = useState("chat");
  const [creating, setCreating] = useState(false);

  const isActualInstructor = user?._id === course?.instructor || user?._id === course?.instructor?._id || user?.role === "admin";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, channelRes] = await Promise.all([
          api.get(`/courses/${courseId}`),
          api.get(`/courses/${courseId}/channels`),
        ]);
        setCourse(courseRes.data);
        const chs = channelRes.data.data.channels;
        setChannels(chs);
        setJoinedIds(new Set(
          chs.filter(c => c.members.some(m => m.toString() === user?._id?.toString())).map(c => c._id.toString())
        ));
      } catch (err) {
        console.error("Failed to load channels", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, user?._id]);

  const handleJoin = async (channelId) => {
    setJoiningId(channelId);
    try {
      await api.post(`/courses/${courseId}/channels/${channelId}/join`);
      setJoinedIds(prev => new Set([...prev, channelId.toString()]));
    } catch (err) {
      console.error("Join failed:", err.response?.data?.message);
    } finally {
      setJoiningId(null);
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (newChannelName.toLowerCase() === "announcements") {
      alert("The Announcements channel is a protected default and cannot be duplicated.");
      return;
    }
    setCreating(true);
    try {
      const { data } = await api.post(`/courses/${courseId}/channels`, {
        name: newChannelName,
        type: newChannelType
      });

      setChannels(prev => [...prev, data.channel]);
      setNewChannelName("");
      setNewChannelType("chat");
      setShowCreateModal(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create channel");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteChannel = async (channelId) => {
    if (!confirm("Are you sure you want to delete this channel?")) return;
    try {
      await api.delete(`/courses/${courseId}/channels/${channelId}`);
      setChannels(prev => prev.filter(c => c._id !== channelId));
      setJoinedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(channelId);
        return newSet;
      });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete channel");
    }
  };

  const channelIcon = (type) => {
    if (type === "announcement") return <Megaphone size={16} className="text-amber-400" />;
    if (type === "resources") return <FolderOpen size={16} className="text-emerald-400" />;
    if (type === "assessment") return <ClipboardCheck size={16} className="text-rose-400" />;
    return <Hash size={16} className="text-indigo-400" />;
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center py-24">
      <Loader2 className="animate-spin text-indigo-500" size={32} />
    </div>
  );

  return (
    <main className="text-white font-sans">
      <div className="px-6 md:px-10 pt-8 pb-6 border-b border-gray-800">
        <div className="max-w-3xl mx-auto flex justify-between items-end">
          <div>
            <Link to="/courses" className="flex items-center gap-1.5 text-gray-500 hover:text-white text-xs font-medium mb-4 transition-colors">
              <ArrowLeft size={13} /> All Courses
            </Link>
            <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest">{course?.category}</span>
            <h1 className="text-2xl font-black tracking-tight mt-1">{course?.title}</h1>
            <p className="text-gray-500 text-sm mt-1 line-clamp-2">{course?.description}</p>
          </div>
          {isActualInstructor && (
            <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 rounded-xl text-xs font-bold transition-all">
              <Plus size={16} /> New Channel
            </button>
          )}
        </div>
      </div>

      <div className="px-6 md:px-10 py-8 max-w-3xl mx-auto">
        <div className="space-y-2">
          {channels.map(channel => {
            const isMember = joinedIds.has(channel._id.toString());
            const isJoining = joiningId === channel._id;
            return (
              <div key={channel._id} className="bg-gray-800/30 border border-gray-700/50 rounded-2xl px-5 py-4 flex items-center justify-between hover:border-indigo-500/30 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center border border-gray-800 shrink-0">
                    {channelIcon(channel.type)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{channel.name}</p>
                    <p className="text-gray-500 text-xs">{channel.description || `Type: ${channel.type}`}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {(isMember || isActualInstructor) ? (
                    <Link 
                      to={`/courses/${courseId}/channels/${channel.slug}`} 
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0"
                    >
                      {channel.type === "assessment" ? (isActualInstructor ? "Manage Test" : "Take Test") : (<><CheckCircle size={13} /> Open</>)}
                    </Link>
                  ) : (
                    <button 
                      onClick={() => handleJoin(channel._id)} 
                      disabled={isJoining} 
                      className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 shrink-0"
                    >
                      {isJoining ? <Loader2 size={13} className="animate-spin" /> : <><UserPlus size={13} /> Join</>}
                    </button>
                  )}
                  {isActualInstructor && (
                    <button onClick={() => handleDeleteChannel(channel._id)} className="bg-red-600 hover:bg-red-500 px-3 py-2 rounded-xl text-xs flex items-center gap-1.5">
                      <Trash size={12}/> Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-lg">Create New Channel</h2>
              <button onClick={() => setShowCreateModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateChannel} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Name</label>
                <input 
                  required 
                  value={newChannelName} 
                  onChange={(e) => setNewChannelName(e.target.value)} 
                  placeholder="e.g. Module-1-Test" 
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 mt-1 outline-none focus:border-indigo-500" 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Type</label>
                <select 
                  value={newChannelType} 
                  onChange={(e) => setNewChannelType(e.target.value)} 
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 mt-1 outline-none focus:border-indigo-500"
                >
                  <option value="chat">Chat (Discussion)</option>
                  <option value="assessment">Assessments (Graded Tests)</option>
                </select>
              </div>
              <button 
                type="submit" 
                disabled={creating || !newChannelName.trim()} 
                className="w-full bg-indigo-600 hover:bg-indigo-500 py-3.5 rounded-xl font-bold transition-all flex justify-center items-center gap-2"
              >
                {creating ? <Loader2 size={18} className="animate-spin" /> : "Create Channel"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
