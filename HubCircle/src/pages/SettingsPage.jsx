import { useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/useAuth";
import { Save, Loader2, User, Mail, Lock, Shield } from "lucide-react";

export default function Settings() {
  const { user, login } = useAuth(); 
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const updatePayload = {
        name: formData.name,
        email: formData.email
      };

      if (formData.newPassword || formData.oldPassword) {
        updatePayload.oldPassword = formData.oldPassword;
        updatePayload.newPassword = formData.newPassword;
        updatePayload.confirmPassword = formData.confirmPassword;
      }

      const { data } = await api.post("/auth/updateProfile", updatePayload);
      
      if (data.user) {
        login(data.user); 
        
        window.dispatchEvent(new Event("storage"));
        
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setFormData(prev => ({ 
          ...prev, 
          oldPassword: "", 
          newPassword: "", 
          confirmPassword: "" 
        }));
      }
    } catch (err) {
      setMessage({ 
        type: "error", 
        text: err.response?.data?.message || "Update failed. Check your current password." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white font-sans p-6 pt-24">
      <form onSubmit={handleUpdate} className="max-w-2xl mx-auto space-y-6 pb-20">
        <header className="mb-4">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full mb-3">
            <Shield size={14} className="text-indigo-400" />
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Account Settings</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">Manage Identity</h1>
        </header>

        {message.text && (
          <div className={`p-4 rounded-xl text-sm font-bold border transition-all ${
            message.type === "success" 
              ? "bg-green-500/10 border-green-500/20 text-green-400" 
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            {message.text}
          </div>
        )}

        <section className="bg-gray-800/30 border border-gray-700/50 rounded-3xl p-8 backdrop-blur-md">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-400">
            <User size={20}/> Public Profile
          </h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="full-name" className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Full Name</label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-500" size={18} />
                <input 
                  id="full-name"
                  name="name"
                  type="text" 
                  autoComplete="name"
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-indigo-500" 
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="email-address" className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-500" size={18} />
                <input 
                  id="email-address"
                  name="email"
                  type="email" 
                  autoComplete="email"
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-indigo-500" 
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gray-800/30 border border-gray-700/50 rounded-3xl p-8 backdrop-blur-md">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-400">
            <Lock size={20}/> Security & Password
          </h2>
          <div className="space-y-4">
            <input 
              id="current-password"
              name="oldPassword"
              type="password" 
              placeholder="Current Password" 
              autoComplete="current-password"
              value={formData.oldPassword} 
              onChange={(e) => setFormData({...formData, oldPassword: e.target.value})} 
              className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-3 px-4 text-white outline-none focus:border-indigo-500" 
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                id="new-password"
                name="newPassword"
                type="password" 
                placeholder="New Password" 
                autoComplete="new-password"
                value={formData.newPassword} 
                onChange={(e) => setFormData({...formData, newPassword: e.target.value})} 
                className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-3 px-4 text-white outline-none focus:border-indigo-500" 
              />
              <input 
                id="confirm-password"
                name="confirmPassword"
                type="password" 
                placeholder="Confirm New Password" 
                autoComplete="new-password"
                value={formData.confirmPassword} 
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} 
                className="w-full bg-gray-900/50 border border-gray-700 rounded-xl py-3 px-4 text-white outline-none focus:border-indigo-500" 
              />
            </div>
          </div>
        </section>

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-bold text-white transition-all flex justify-center items-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          Save Changes
        </button>
      </form>
    </main>
  );
}
