import { 
  User, 
  Shield, 
  Bell, 
  Palette, 
  Globe, 
  Key, 
  Database,
  Users,
  Mail,
  Smartphone,
  Fingerprint,
  Moon,
  Sun,
  Monitor,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Sparkles,
  LogOut,
  Trash2,
  HelpCircle,
  FileText,
  Settings as SettingsIcon,
  Sliders,
  Zap,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const tabs = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 pb-20">
      {/* Header */}
      <div className="mb-8 md:mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-8 w-1 rounded-full bg-gradient-to-b from-violet-400 to-cyan-400" />
          <p className="text-xs md:text-sm font-semibold uppercase tracking-widest text-violet-300">
            Settings
          </p>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-[#dae2fd] tracking-tight">
          Workspace Settings
        </h1>
        <p className="text-[#cbc3d7] mt-2 text-sm md:text-base">
          Manage your workspace preferences and configurations.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="sticky top-6 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all duration-200 ${
                    isActive
                      ? "bg-violet-500/20 text-violet-300 ring-1 ring-violet-400/30"
                      : "text-[#cbc3d7] hover:bg-white/5 hover:text-[#dae2fd]"
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{tab.label}</span>
                  {isActive && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* General Settings */}
          {activeTab === "general" && (
            <div className="space-y-6">
              {/* Workspace Info */}
              <div className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-6 md:p-8 rounded-3xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[#dae2fd] flex items-center gap-2">
                      <Database size={16} className="text-violet-300" />
                      Workspace Information
                    </h3>
                    <p className="text-xs text-[#cbc3d7] mt-0.5">Basic information about your workspace</p>
                  </div>
                </div>
                <div className="space-y-4 mt-6">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-[#cbc3d7]">Workspace Name</label>
                    <input
                      type="text"
                      defaultValue="Acme Corporation"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[#dae2fd] placeholder-[#958ea0] outline-none transition-all duration-300 focus:border-violet-400/30 focus:bg-white/10 focus:ring-1 focus:ring-violet-400/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-[#cbc3d7]">Workspace Slug</label>
                    <input
                      type="text"
                      defaultValue="acme-corp"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[#dae2fd] placeholder-[#958ea0] outline-none transition-all duration-300 focus:border-violet-400/30 focus:bg-white/10 focus:ring-1 focus:ring-violet-400/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-[#cbc3d7]">Plan</label>
                    <select className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[#dae2fd] outline-none transition-all duration-300 focus:border-violet-400/30 focus:bg-white/10 focus:ring-1 focus:ring-violet-400/30">
                      <option value="free" className="bg-[#171f33]">Free</option>
                      <option value="pro" className="bg-[#171f33]">Pro</option>
                      <option value="business" className="bg-[#171f33]">Business</option>
                      <option value="enterprise" className="bg-[#171f33]">Enterprise</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button className="inline-flex items-center justify-center gap-2 font-semibold text-[#340080] bg-gradient-to-r from-violet-300 via-violet-400 to-cyan-400 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(208,188,255,0.35)] active:scale-[0.98] px-6 py-3 text-sm rounded-xl">
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-rose-500/20 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-6 md:p-8 rounded-3xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[#dae2fd] flex items-center gap-2">
                      <AlertCircle size={16} className="text-rose-400" />
                      Danger Zone
                    </h3>
                    <p className="text-xs text-[#cbc3d7] mt-0.5">Irreversible actions</p>
                  </div>
                </div>
                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-rose-500/5 border border-rose-500/10">
                    <div>
                      <p className="text-sm font-medium text-[#dae2fd]">Delete Workspace</p>
                      <p className="text-xs text-[#cbc3d7]">This action cannot be undone</p>
                    </div>
                    <button className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-400 text-sm font-medium hover:bg-rose-500/30 transition">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Settings */}
          {activeTab === "profile" && (
            <div className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-6 md:p-8 rounded-3xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#dae2fd] flex items-center gap-2">
                    <User size={16} className="text-violet-300" />
                    Profile Settings
                  </h3>
                  <p className="text-xs text-[#cbc3d7] mt-0.5">Manage your personal information</p>
                </div>
              </div>
              <div className="space-y-4 mt-6">
                <div className="flex items-center gap-6 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-500/30 flex items-center justify-center border-2 border-violet-400/30">
                    <span className="text-2xl font-bold text-[#dae2fd]">JD</span>
                  </div>
                  <div>
                    <button className="text-sm text-violet-300 hover:text-violet-200 transition">
                      Change Avatar
                    </button>
                    <p className="text-xs text-[#cbc3d7] mt-1">PNG, JPG up to 5MB</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#cbc3d7]">Full Name</label>
                  <input
                    type="text"
                    defaultValue="John Doe"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[#dae2fd] placeholder-[#958ea0] outline-none transition-all duration-300 focus:border-violet-400/30 focus:bg-white/10 focus:ring-1 focus:ring-violet-400/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#cbc3d7]">Email</label>
                  <input
                    type="email"
                    defaultValue="john@acme.com"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[#dae2fd] placeholder-[#958ea0] outline-none transition-all duration-300 focus:border-violet-400/30 focus:bg-white/10 focus:ring-1 focus:ring-violet-400/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#cbc3d7]">Role</label>
                  <input
                    type="text"
                    defaultValue="Admin"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[#dae2fd] placeholder-[#958ea0] outline-none transition-all duration-300 focus:border-violet-400/30 focus:bg-white/10 focus:ring-1 focus:ring-violet-400/30"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button className="inline-flex items-center justify-center gap-2 font-semibold text-[#340080] bg-gradient-to-r from-violet-300 via-violet-400 to-cyan-400 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(208,188,255,0.35)] active:scale-[0.98] px-6 py-3 text-sm rounded-xl">
                  Update Profile
                </button>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-6 md:p-8 rounded-3xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[#dae2fd] flex items-center gap-2">
                      <Shield size={16} className="text-violet-300" />
                      Security
                    </h3>
                    <p className="text-xs text-[#cbc3d7] mt-0.5">Protect your account</p>
                  </div>
                </div>
                <div className="space-y-4 mt-6">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-[#cbc3d7]">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[#dae2fd] placeholder-[#958ea0] outline-none transition-all duration-300 focus:border-violet-400/30 focus:bg-white/10 focus:ring-1 focus:ring-violet-400/30 pr-12"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#cbc3d7] hover:text-[#dae2fd] transition"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-[#cbc3d7]">New Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[#dae2fd] placeholder-[#958ea0] outline-none transition-all duration-300 focus:border-violet-400/30 focus:bg-white/10 focus:ring-1 focus:ring-violet-400/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-[#cbc3d7]">Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[#dae2fd] placeholder-[#958ea0] outline-none transition-all duration-300 focus:border-violet-400/30 focus:bg-white/10 focus:ring-1 focus:ring-violet-400/30"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button className="inline-flex items-center justify-center gap-2 font-semibold text-[#340080] bg-gradient-to-r from-violet-300 via-violet-400 to-cyan-400 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(208,188,255,0.35)] active:scale-[0.98] px-6 py-3 text-sm rounded-xl">
                    Change Password
                  </button>
                </div>
              </div>

              {/* Two-Factor Authentication */}
              <div className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-6 md:p-8 rounded-3xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[#dae2fd] flex items-center gap-2">
                      <Fingerprint size={16} className="text-violet-300" />
                      Two-Factor Authentication
                    </h3>
                    <p className="text-xs text-[#cbc3d7] mt-0.5">Add an extra layer of security</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 mt-6">
                  <div>
                    <p className="text-sm font-medium text-[#dae2fd]">2FA Authentication</p>
                    <p className="text-xs text-[#cbc3d7]">
                      {isTwoFactorEnabled ? "Enabled • Your account is protected" : "Disabled • Your account is not protected"}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsTwoFactorEnabled(!isTwoFactorEnabled)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-300 ease-in-out ${
                      isTwoFactorEnabled ? "bg-gradient-to-r from-violet-500 to-cyan-500" : "bg-white/10"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
                        isTwoFactorEnabled ? "translate-x-5" : "translate-x-0.5"
                      } mt-0.5`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === "notifications" && (
            <div className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-6 md:p-8 rounded-3xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#dae2fd] flex items-center gap-2">
                    <Bell size={16} className="text-violet-300" />
                    Notifications
                  </h3>
                  <p className="text-xs text-[#cbc3d7] mt-0.5">Manage your notification preferences</p>
                </div>
              </div>
              <div className="space-y-4 mt-6">
                {[
                  { label: "Email Notifications", sub: "Receive updates via email", enabled: true },
                  { label: "Push Notifications", sub: "Receive updates in-browser", enabled: true },
                  { label: "Weekly Digest", sub: "Weekly summary of activity", enabled: false },
                  { label: "Agent Alerts", sub: "AI agent status updates", enabled: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <p className="text-sm font-medium text-[#dae2fd]">{item.label}</p>
                      <p className="text-xs text-[#cbc3d7]">{item.sub}</p>
                    </div>
                    <button
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-300 ease-in-out ${
                        item.enabled ? "bg-gradient-to-r from-violet-500 to-cyan-500" : "bg-white/10"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
                          item.enabled ? "translate-x-5" : "translate-x-0.5"
                        } mt-0.5`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeTab === "appearance" && (
            <div className="bg-[rgba(23,31,51,0.72)] backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-6 md:p-8 rounded-3xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#dae2fd] flex items-center gap-2">
                    <Palette size={16} className="text-violet-300" />
                    Appearance
                  </h3>
                  <p className="text-xs text-[#cbc3d7] mt-0.5">Customize your workspace appearance</p>
                </div>
              </div>
              <div className="space-y-6 mt-6">
                <div>
                  <p className="text-sm font-medium text-[#dae2fd] mb-3">Theme</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "dark", label: "Dark", icon: Moon, selected: isDarkMode },
                      { id: "light", label: "Light", icon: Sun, selected: false },
                      { id: "system", label: "System", icon: Monitor, selected: false },
                    ].map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setIsDarkMode(theme.id === "dark")}
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                          theme.selected
                            ? "border-violet-400/50 bg-violet-500/10"
                            : "border-white/10 hover:border-white/20"
                        }`}
                      >
                        <theme.icon size={18} className={theme.selected ? "text-violet-300" : "text-[#cbc3d7]"} />
                        <span className={theme.selected ? "text-[#dae2fd]" : "text-[#cbc3d7]"}>
                          {theme.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-[#dae2fd] mb-3">Accent Color</p>
                  <div className="flex gap-3">
                    {[
                      { color: "violet", class: "bg-violet-500" },
                      { color: "blue", class: "bg-blue-500" },
                      { color: "cyan", class: "bg-cyan-500" },
                      { color: "emerald", class: "bg-emerald-500" },
                      { color: "rose", class: "bg-rose-500" },
                      { color: "amber", class: "bg-amber-500" },
                    ].map((color) => (
                      <button
                        key={color.color}
                        className={`w-8 h-8 rounded-full ${color.class} ring-2 ring-offset-2 ring-offset-[#0b1326] transition ${
                          color.color === "violet" ? "ring-violet-400" : "ring-transparent hover:ring-white/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}