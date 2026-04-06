import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Send,
  Loader2,
  Trash2,
  Pencil,
  X,
  Check,
  CornerUpLeft,
  Hash,
} from "lucide-react";
import { io } from "socket.io-client";
import api from "../api/axios";
import { useAuth } from "../context/useAuth";

export default function ChannelView() {
  const { courseId, slug } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    setChannel(null);

    const init = async () => {
      try {
        const channelRes = await api.get(`/courses/${courseId}/channels`);
        const found = channelRes.data.data.channels.find(
          (c) => c.slug === slug,
        );
        if (!found) {
          setLoading(false);
          return;
        }
        setChannel(found);

        const msgRes = await api.get(
          `/courses/${courseId}/channels/${found._id}/messages`,
        );
        setMessages(msgRes.data.data);
      } catch (err) {
        console.error("Init error", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [courseId, slug]);

  const channelId = channel?._id;

  useEffect(() => {
    if (!channelId) return;

    if (socketRef.current) {
      socketRef.current.emit("leaveChannel", channelId);
      socketRef.current.disconnect();
    }

    const socket = io("http://localhost:5000", { withCredentials: true });
    socketRef.current = socket;

    const userName = user?.name;

    socket.emit("joinChannel", channelId);

    socket.on("newMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("userTyping", ({ userName: typingName }) => {
      if (typingName === userName) return;
      setTypingUsers((prev) =>
        prev.includes(typingName) ? prev : [...prev, typingName],
      );
    });

    socket.on("userStoppedTyping", ({ userName: typingName }) => {
      setTypingUsers((prev) => prev.filter((u) => u !== typingName));
    });

    return () => {
      socket.emit("leaveChannel", channelId);
      socket.disconnect();
    };
  }, [channelId, user?.name]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTyping = () => {
    if (!channel || !socketRef.current) return;
    socketRef.current.emit("typing", channel._id);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketRef.current?.emit("stoppedTyping", channel._id);
    }, 1500);
  };

  const handleSend = async () => {
    if (!content.trim() || !channel) return;
    setSending(true);
    try {
      await api.post(`/courses/${courseId}/channels/${channel._id}/messages`, {
        content,
        replyTo: replyTo?._id || null,
      });
      setContent("");
      setReplyTo(null);
      socketRef.current?.emit("stoppedTyping", channel._id);
    } catch (err) {
      console.error("Send failed:", err.response?.data || err.message);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (msgId) => {
    try {
      await api.delete(
        `/courses/${courseId}/channels/${channel._id}/messages/${msgId}`,
      );
      setMessages((prev) => prev.filter((m) => m._id !== msgId));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleEdit = async (msgId) => {
    try {
      await api.put(
        `/courses/${courseId}/channels/${channel._id}/messages/${msgId}`,
        { content: editContent },
      );
      setMessages((prev) =>
        prev.map((m) =>
          m._id === msgId ? { ...m, content: editContent, isEdited: true } : m,
        ),
      );
      setEditingId(null);
    } catch (err) {
      console.error("Edit failed:", err);
    }
  };

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );

  if (!channel)
    return (
      <div className="flex-1 flex items-center justify-center py-24 text-gray-500 text-sm">
        Channel not found.
      </div>
    );

  return (
    <div className="flex flex-col h-full text-white font-sans">
      <div className="px-6 py-4 border-b border-gray-800 flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-indigo-600/15 flex items-center justify-center">
          <Hash size={15} className="text-indigo-400" />
        </div>
        <div>
          <h2 className="font-bold text-sm">{channel.name}</h2>
          {channel.description && (
            <p className="text-gray-500 text-xs">{channel.description}</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center text-gray-600 text-sm py-16">
            No messages yet — say something!
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender?._id === user?._id;
          const isEditing = editingId === msg._id;

          return (
            <div
              key={msg._id}
              className={`flex gap-3 group ${isOwn ? "flex-row-reverse" : ""}`}
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-black shrink-0 mt-1 uppercase">
                {msg.sender?.name?.charAt(0)}
              </div>

              <div
                className={`max-w-[70%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}
              >
                <div
                  className={`flex items-center gap-2 mb-1 ${isOwn ? "flex-row-reverse" : ""}`}
                >
                  <span className="text-xs font-bold text-gray-400">
                    {msg.sender?.name}
                  </span>
                  <span className="text-[10px] text-gray-600">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {msg.isEdited && (
                    <span className="text-[10px] text-gray-600 italic">
                      (edited)
                    </span>
                  )}
                </div>

                {msg.replyTo && (
                  <div className="text-xs text-gray-500 bg-gray-800/50 border-l-2 border-indigo-500 px-3 py-1.5 rounded-lg mb-1 max-w-full">
                    <span className="line-clamp-1">{msg.replyTo.content}</span>
                  </div>
                )}

                {isEditing ? (
                  <div className="flex items-center gap-2 w-full">
                    <input
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleEdit(msg._id)
                      }
                      className="flex-1 bg-gray-800 border border-indigo-500/50 rounded-xl px-3 py-2 text-sm outline-none"
                    />
                    <button
                      onClick={() => handleEdit(msg._id)}
                      className="text-green-400 hover:text-green-300"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-gray-500 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isOwn
                        ? "bg-indigo-600 text-white rounded-tr-sm"
                        : "bg-gray-800 text-gray-200 rounded-tl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                )}

                <div
                  className={`flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? "flex-row-reverse" : ""}`}
                >
                  <button
                    onClick={() => setReplyTo(msg)}
                    className="text-gray-600 hover:text-indigo-400 transition-colors"
                  >
                    <CornerUpLeft size={13} />
                  </button>
                  {isOwn && (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(msg._id);
                          setEditContent(msg.content);
                        }}
                        className="text-gray-600 hover:text-indigo-400 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(msg._id)}
                        className="text-gray-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {typingUsers.length > 0 && (
        <div className="px-6 py-1 text-xs text-gray-500 italic shrink-0">
          {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"}{" "}
          typing...
        </div>
      )}

      {replyTo && (
        <div className="px-6 py-2 border-t border-gray-800 bg-gray-800/30 flex items-center justify-between shrink-0">
          <p className="text-xs text-gray-400 truncate">
            <span className="text-indigo-400 font-bold">
              Replying to {replyTo.sender?.name}:{" "}
            </span>
            {replyTo.content}
          </p>
          <button
            onClick={() => setReplyTo(null)}
            className="text-gray-500 hover:text-white ml-3 shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="px-6 py-4 border-t border-gray-800 shrink-0">
        <div className="flex items-center gap-3 bg-gray-800/50 border border-gray-700/50 focus-within:border-indigo-500/50 rounded-2xl px-4 py-3 transition-all">
          <input
            type="text"
            placeholder={`Message #${channel.name}…`}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
          />
          <button
            onClick={handleSend}
            disabled={sending || !content.trim()}
            className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center transition-all disabled:opacity-40 shrink-0"
          >
            {sending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
