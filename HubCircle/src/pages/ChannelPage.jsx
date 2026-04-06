import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Hash, Megaphone, FolderOpen, Loader2, UserPlus, CheckCircle, ArrowLeft } from "lucide-react";
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
          chs
            .filter(c => c.members.some(m => m.toString() === user?._id?.toString()))
            .map(c => c._id.toString())
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

  const channelIcon = (type) => {
    if (type === "announcement") return <Megaphone size={16} className="text-amber-400" />;
    if (type === "resources") return <FolderOpen size={16} className="text-emerald-400" />;
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
        <div className="max-w-3xl mx-auto">
          <Link to="/courses" className="flex items-center gap-1.5 text-gray-500 hover:text-white text-xs font-medium mb-4 transition-colors">
            <ArrowLeft size={13} /> All Courses
          </Link>
          <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest">{course?.category}</span>
          <h1 className="text-2xl font-black tracking-tight mt-1">{course?.title}</h1>
          <p className="text-gray-500 text-sm mt-1 line-clamp-2">{course?.description}</p>
        </div>
      </div>

      <div className="px-6 md:px-10 py-8 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500">Community</h2>
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-[10px] text-gray-600">{channels.length} channels</span>
        </div>

        <div className="space-y-2">
          {channels.map(channel => {
            const isMember = joinedIds.has(channel._id.toString());
            const isJoining = joiningId === channel._id;

            return (
              <div
                key={channel._id}
                className="bg-gray-800/30 border border-gray-700/50 rounded-2xl px-5 py-4 flex items-center justify-between hover:border-indigo-500/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center border border-gray-800 group-hover:bg-indigo-500/10 transition-colors shrink-0">
                    {channelIcon(channel.type)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{channel.name}</p>
                    {channel.description && (
                      <p className="text-gray-500 text-xs">{channel.description}</p>
                    )}
                  </div>
                </div>

                {isMember ? (
                  <Link
                    to={`/courses/${courseId}/channels/${channel.slug}`}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0"
                  >
                    <CheckCircle size={13} /> Open
                  </Link>
                ) : (
                  <button
                    onClick={() => handleJoin(channel._id)}
                    disabled={isJoining}
                    className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 shrink-0"
                  >
                    {isJoining
                      ? <Loader2 size={13} className="animate-spin" />
                      : <><UserPlus size={13} /> Join</>
                    }
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}