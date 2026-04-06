import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Send,
  Loader2,
  Trash2,
  Pencil,
  X,
  Check,
  CornerUpLeft,
  Hash,
  FileText,
  Video,
  Plus,
  ClipboardCheck,
  HelpCircle,
  Trophy,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { io } from "socket.io-client";
import api from "../api/axios";
import { useAuth } from "../context/useAuth";

export default function ChannelView() {
  const { courseId, slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [channel, setChannel] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isEditingChannel, setIsEditingChannel] = useState(false);
  const [editChannelName, setEditChannelName] = useState("");
  const [editChannelDesc, setEditChannelDesc] = useState("");
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const socketRef = useRef(null);

  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleTitle, setModuleTitle] = useState("");
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [activeModuleIndex, setActiveModuleIndex] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    options: ["", ""],
    correctAnswer: 0,
    points: 1
  });

  const [activeQuizModule, setActiveQuizModule] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [quizResult, setQuizResult] = useState(null);
  const [submissionHistory, setSubmissionHistory] = useState([]);
  const [expandedModule, setExpandedModule] = useState(null);

  const isActualInstructor = user?._id === course?.instructor || user?._id === course?.instructor?._id || user?.role === "admin";
  const isRestricted = channel?.type === "announcement" || channel?.type === "resources";
  const isResources = channel?.type === "resources";
  const isAssessment = channel?.type === "assessment";

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    setChannel(null);

    const init = async () => {
      try {
        const courseRes = await api.get(`/courses/${courseId}`);
        setCourse(courseRes.data);

        const channelRes = await api.get(`/courses/${courseId}/channels`);
        const found = channelRes.data.data.channels.find(
          (c) => c.slug === slug,
        );
        if (!found) {
          setLoading(false);
          return;
        }
        setChannel(found);
        setEditChannelName(found.name);
        setEditChannelDesc(found.description || "");

        if (found.type !== "assessment") {
          const msgRes = await api.get(
            `/courses/${courseId}/channels/${found._id}/messages`,
          );
          setMessages(msgRes.data.data);
        }
      } catch (err) {
        console.error("Init error", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [courseId, slug]);

  useEffect(() => {
    if (!channel?._id || !isAssessment) return;
    const fetchHistory = async () => {
      try {
        const { data } = await api.get(`/courses/${courseId}/channels/${channel._id}/submissions`);
        setSubmissionHistory(data.data);
      } catch {
        console.error("Failed to load submission history");
      }
    };
    fetchHistory();
  }, [channel?._id, isAssessment, courseId]);

  const channelId = channel?._id;

  useEffect(() => {
    if (!channelId || isAssessment) return;

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
  }, [channelId, user?.name, isAssessment]);

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

  const handleDeleteChannel = async () => {
    if (!window.confirm("Delete this channel and all its messages?")) return;
    try {
      await api.delete(`/courses/${courseId}/channels/${channel._id}`);
      navigate(`/courses/${courseId}/channels/general`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete channel");
    }
  };

  const handleUpdateChannel = async () => {
    try {
      await api.put(`/courses/${courseId}/channels/${channel._id}`, {
        name: editChannelName,
        description: editChannelDesc
      });
      const newSlug = editChannelName.toLowerCase().trim().replace(/\s+/g, "-");
      navigate(`/courses/${courseId}/channels/${newSlug}`);
      setIsEditingChannel(false);
      window.location.reload();
    } catch {
      alert("Failed to update channel");
    }
  };

  const handleAddModule = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/courses/${courseId}/channels/${channel._id}/modules`, { title: moduleTitle });
      setModuleTitle("");
      setShowModuleModal(false);
      window.location.reload();
    } catch { 
      alert("Failed to add module"); 
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/courses/${courseId}/channels/${channel._id}/modules/${activeModuleIndex}/questions`, newQuestion);
      setShowQuestionModal(false);
      window.location.reload();
    } catch { 
      alert("Failed to add question"); 
    }
  };

  const handleQuizSubmit = async () => {
    try {
      const { data } = await api.post(`/courses/${courseId}/channels/${channel._id}/submit`, {
        answers: userAnswers
      });
      setQuizResult(data);
      const historyRes = await api.get(`/courses/${courseId}/channels/${channel._id}/submissions`);
      setSubmissionHistory(historyRes.data.data);
    } catch {
      alert("Failed to submit quiz");
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
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isAssessment ? "bg-rose-500/15" : "bg-indigo-600/15"}`}>
            {isAssessment ? <ClipboardCheck size={15} className="text-rose-400" /> : <Hash size={15} className="text-indigo-400" />}
          </div>
          {isEditingChannel ? (
            <div className="flex items-center gap-2">
              <input 
                className="bg-gray-800 text-sm px-2 py-1 rounded border border-gray-700 outline-none text-white"
                value={editChannelName}
                onChange={(e) => setEditChannelName(e.target.value)}
              />
              <button onClick={handleUpdateChannel} className="text-green-500"><Check size={16}/></button>
              <button onClick={() => setIsEditingChannel(false)} className="text-red-500"><X size={16}/></button>
            </div>
          ) : (
            <div>
              <h2 className="font-bold text-sm">{channel.name}</h2>
              {channel.description && (
                <p className="text-gray-500 text-xs">{channel.description}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isActualInstructor && isAssessment && (
            <button onClick={() => setShowModuleModal(true)} className="bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all">
              <Plus size={14}/> Add Module
            </button>
          )}
          {isActualInstructor && channel.slug !== "general" && (
            <>
              <button
                onClick={() => setIsEditingChannel(true)}
                className="p-2 text-gray-500 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-all"
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={handleDeleteChannel}
                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 custom-scrollbar">
        {isAssessment ? (
          <div className="max-w-3xl mx-auto space-y-4">
            {quizResult ? (
              <div className="bg-gray-800/20 border border-gray-800 rounded-2xl p-10 text-center">
                <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trophy size={32} />
                </div>
                <h3 className="text-2xl font-black mb-2">Quiz Finished</h3>
                <p className="text-gray-400 mb-6">Score: <span className="text-white font-bold">{quizResult.score}%</span></p>
                <div className={`inline-block px-6 py-2 rounded-full font-bold text-sm mb-8 ${quizResult.passed ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                   {quizResult.passed ? "PASSED" : "FAILED"}
                </div>
                <button onClick={() => { setQuizResult(null); setActiveQuizModule(null); }} className="block w-full bg-gray-800 py-3 rounded-xl font-bold text-sm transition-all">Back to Modules</button>
              </div>
            ) : activeQuizModule ? (
              <div className="bg-gray-800/20 border border-gray-800 rounded-2xl p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-black text-xs uppercase tracking-widest text-indigo-400">{activeQuizModule.title}</h3>
                  <span className="text-xs text-gray-500">{currentQuestionIndex + 1} / {activeQuizModule.questions.length}</span>
                </div>
                <div className="space-y-6">
                  <p className="text-lg font-medium leading-relaxed">{activeQuizModule.questions[currentQuestionIndex].question}</p>
                  <div className="grid gap-3">
                    {activeQuizModule.questions[currentQuestionIndex].options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const newAns = [...userAnswers];
                          newAns[currentQuestionIndex] = { questionId: activeQuizModule.questions[currentQuestionIndex]._id, selectedOption: idx };
                          setUserAnswers(newAns);
                        }}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${userAnswers[currentQuestionIndex]?.selectedOption === idx ? "border-indigo-500 bg-indigo-500/10 text-white" : "border-gray-800 bg-gray-900/50 text-gray-400"}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between mt-10">
                  <button disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(prev => prev - 1)} className="text-sm font-bold text-gray-500 disabled:opacity-0">Back</button>
                  {currentQuestionIndex === activeQuizModule.questions.length - 1 ? (
                    <button onClick={handleQuizSubmit} disabled={userAnswers.length < activeQuizModule.questions.length} className="bg-green-600 px-8 py-3 rounded-xl font-bold text-sm">Finish</button>
                  ) : (
                    <button onClick={() => setCurrentQuestionIndex(prev => prev + 1)} disabled={!userAnswers[currentQuestionIndex]} className="bg-indigo-600 px-8 py-3 rounded-xl font-bold text-sm">Next</button>
                  )}
                </div>
              </div>
            ) : (
              channel.assessment?.modules?.map((mod, idx) => {
                const modQuestions = mod.questions.map(q => q._id.toString());
                const modHistory = submissionHistory.filter(sub => sub.answers.some(ans => modQuestions.includes(ans.questionId.toString())));
                const best = modHistory.length > 0 ? [...modHistory].sort((a,b) => b.score - a.score) : null;
                const isExpanded = expandedModule === idx;

                return (
                  <div key={idx} className="bg-gray-800/20 border border-gray-800 rounded-2xl overflow-hidden">
                    <div onClick={() => setExpandedModule(isExpanded ? null : idx)} className="p-6 cursor-pointer flex justify-between items-center hover:bg-gray-800/40 transition-all">
                      <div>
                        <h3 className="font-black text-xs uppercase tracking-widest text-indigo-400 mb-1">{mod.title}</h3>
                        {best && <p className="text-[10px] font-bold text-green-500">Best Score: {best[0].score}%</p>}
                      </div>
                      <div className="flex items-center gap-4">
                        {!isActualInstructor && (
                          <button onClick={(e) => { e.stopPropagation(); setActiveQuizModule(mod); setCurrentQuestionIndex(0); setUserAnswers([]); }} className="bg-rose-600 hover:bg-rose-500 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider">{best ? "Retake" : "Start"}</button>
                        )}
                        {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-6 pb-6 border-t border-gray-800 pt-6 space-y-4">
                        {isActualInstructor ? (
                          <div className="space-y-3">
                            {mod.questions.map((q, qIdx) => (
                              <div key={qIdx} className="bg-gray-900/50 p-4 rounded-xl border border-gray-800/50 text-sm">
                                <p className="font-medium text-gray-200 flex gap-2"><HelpCircle size={15}/> {q.question}</p>
                                <div className="grid grid-cols-2 gap-2 mt-3">
                                  {q.options.map((opt, oIdx) => <div key={oIdx} className={`text-[10px] p-2 rounded border ${oIdx === q.correctAnswer ? "border-green-500/30 text-green-400" : "border-gray-800 text-gray-500"}`}>{opt}</div>)}
                                </div>
                              </div>
                            ))}
                            <button onClick={() => { setActiveModuleIndex(idx); setShowQuestionModal(true); }} className="w-full py-4 border-2 border-dashed border-gray-800 rounded-xl text-gray-600 hover:border-indigo-500 hover:text-indigo-400 text-[10px] font-black uppercase tracking-widest transition-all">+ Add Question</button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                             <h4 className="text-[10px] font-black uppercase text-gray-500 mb-2">History</h4>
                             {modHistory.length > 0 ? modHistory.map((sub, hIdx) => (
                               <div key={hIdx} className="bg-gray-900/40 p-3 rounded-xl flex justify-between items-center border border-gray-800/50">
                                 <span className="text-[10px] text-gray-400">{new Date(sub.submittedAt).toLocaleDateString()}</span>
                                 <span className={`font-bold text-xs ${sub.passed ? "text-green-500" : "text-red-500"}`}>{sub.score}%</span>
                               </div>
                             )) : <p className="text-[10px] text-gray-600 italic">No attempts yet</p>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <div className="text-center text-gray-600 text-sm py-16">
                No content yet.
              </div>
            )}
            {messages.map((msg) => {
              const isOwn = msg.sender?._id === user?._id;
              const isEditing = editingId === msg._id;

              if (isResources) {
                const isVideo = msg.content.includes("youtube.com") || msg.content.includes("vimeo.com") || msg.content.includes("youtu.be");
                return (
                  <div key={msg._id} className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-4 flex gap-4 group">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isVideo ? "bg-red-500/10 text-red-500" : "bg-indigo-500/10 text-indigo-400"}`}>
                      {isVideo ? <Video size={20} /> : <FileText size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Instructor Resource</span>
                        {isActualInstructor && (
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingId(msg._id); setEditContent(msg.content); }} className="text-gray-500 hover:text-white"><Pencil size={12} /></button>
                            <button onClick={() => handleDelete(msg._id)} className="text-gray-500 hover:text-red-400"><Trash2 size={12} /></button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-200 leading-relaxed">{msg.content}</p>
                      <p className="text-[10px] text-gray-600 mt-2">{new Date(msg.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              }

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
                      {(isOwn || isActualInstructor) && (
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
          </>
        )}
      </div>

      {!isAssessment && (!isRestricted || isActualInstructor) && (
        <div className="p-4 border-t border-gray-800">
          {replyTo && (
            <div className="flex items-center justify-between bg-gray-800/50 px-4 py-2 rounded-t-xl border-x border-t border-gray-700">
              <span className="text-xs text-gray-400 truncate">Replying to: {replyTo.content}</span>
              <button onClick={() => setReplyTo(null)}><X size={14}/></button>
            </div>
          )}
          <div className="flex items-center gap-2 bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-2 focus-within:border-indigo-500 transition-all">
            <input
              placeholder={`Message #${channel?.name}`}
              className="flex-1 bg-transparent border-none outline-none text-sm py-2 text-white"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              onInput={handleTyping}
            />
            <button 
              onClick={handleSend} 
              disabled={sending || !content.trim()} 
              className="p-2 text-indigo-400 hover:bg-indigo-400/10 rounded-lg disabled:opacity-50"
            >
              {sending ? <Loader2 size={18} className="animate-spin"/> : <Send size={18}/>}
            </button>
          </div>
          {typingUsers.length > 0 && (
            <p className="text-[10px] text-gray-500 mt-1 ml-2 italic">
              {typingUsers.join(", ")} typing...
            </p>
          )}
        </div>
      )}

      {showModuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h2 className="font-bold text-lg mb-4 text-white">Add Module</h2>
            <form onSubmit={handleAddModule} className="space-y-4">
              <input required value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} placeholder="Module Title" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 text-white" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowModuleModal(false)} className="flex-1 bg-gray-800 py-3 rounded-xl font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 py-3 rounded-xl font-bold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-xl rounded-2xl p-6 my-8 shadow-2xl">
            <h2 className="font-bold text-lg mb-4 text-white">Add Question</h2>
            <form onSubmit={handleAddQuestion} className="space-y-4">
              <textarea required value={newQuestion.question} onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })} placeholder="Question Text" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none h-24 text-white" />
              <div className="space-y-2">
                {newQuestion.options.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={opt} onChange={(e) => { const next = [...newQuestion.options]; next[i] = e.target.value; setNewQuestion({ ...newQuestion, options: next }); }} className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none" />
                    <button type="button" onClick={() => setNewQuestion({ ...newQuestion, correctAnswer: i })} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${newQuestion.correctAnswer === i ? "bg-green-600" : "bg-gray-800"}`}><Check size={16}/></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowQuestionModal(false)} className="flex-1 py-3 text-gray-500 font-bold">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 py-3 rounded-xl font-bold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
