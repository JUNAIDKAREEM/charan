import React, { useState, useEffect, createContext, useContext, useRef } from "react";
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  useNavigate, 
  Link,
  useLocation
} from "react-router-dom";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from "firebase/auth";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  getDocFromServer
} from "firebase/firestore";
import { auth, db, storage } from "./firebase";
import { Issue, UserProfile, IssueStatus, IssueUrgency, UserRole } from "./types";
import { analyzeIssue, civicCoach } from "./services/geminiService";
import { handleDuplication } from "./services/duplicationEngine";
import { SAMPLE_ISSUES } from "./constants/demoData";

const getPredictiveMaintenanceData = async () => {
  // Mock predictive data for demo
  return [
    { category: "Roads", count: 15, trend: "up" },
    { category: "Water", count: 8, trend: "down" },
    { category: "Waste", count: 12, trend: "stable" }
  ];
};

import { cn } from "./lib/utils";
import { 
  LayoutDashboard, 
  PlusCircle, 
  Map as MapIcon, 
  User as UserIcon, 
  LogOut, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Shield, 
  MapPin, 
  Camera, 
  Mic, 
  Send, 
  Filter, 
  ArrowRight, 
  Trophy, 
  Search,
  Menu,
  X,
  ChevronRight,
  Loader2,
  BarChart3,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Activity,
  Zap,
  Droplets,
  Trash2,
  Lightbulb,
  Car,
  Wind,
  Globe,
  Home,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend
} from "recharts";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "firebase/storage";
import { 
  MapContainer, 
  TileLayer, 
  CircleMarker, 
  Popup, 
  useMap,
  Marker
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet icons
let DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- Contexts ---

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  setDemoRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

// --- Components ---

const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-slate-950 z-50">
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-2xl font-black text-white tracking-tighter">Smart Samadhan</h2>
        <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">Initializing System</p>
      </div>
    </div>
  </div>
);

const BottomNav = () => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const citizenLinks = [
    { name: "Home", path: "/", icon: Home, primary: false },
    { name: "Discover", path: "/discover", icon: Globe, primary: false },
    { name: "Scan", path: "/report", icon: Camera, primary: true },
    { name: "Nearby", path: "/nearby", icon: MapPin, primary: false },
    { name: "Coach", path: "/coach", icon: MessageSquare, primary: false },
  ];

  const departmentLinks = [
    { name: "Dashboard", path: "/department", icon: LayoutDashboard, primary: false },
    { name: "Live Heatmap", path: "/map", icon: MapIcon, primary: false },
  ];

  const links = profile?.role === "department" ? departmentLinks : citizenLinks;

  if (!profile) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur-2xl border-t border-slate-800 px-6 py-4 z-50">
      <div className="max-w-md mx-auto flex justify-between items-center">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;

          if (link.primary) {
            return (
              <Link
                key={link.path}
                to={link.path}
                className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20 -mt-12 border-4 border-slate-950 transition-transform active:scale-95"
              >
                <Icon className="w-8 h-8 text-white" />
              </Link>
            );
          }

          return (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "flex flex-col items-center gap-1 transition-colors",
                isActive ? "text-primary" : "text-slate-500 hover:text-slate-400"
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-black uppercase tracking-widest">{link.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

// --- Pages ---

const LandingPage = () => {
  const { signIn } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1),transparent_50%)]" />
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest mb-8">
            <Shield className="w-4 h-4" />
            <span>AI-Powered Civic Platform</span>
          </div>
          <h1 className="text-6xl sm:text-8xl font-black text-white tracking-tighter mb-6 leading-[0.9]">
            Smart <span className="text-primary">Samadhan</span>
          </h1>
          <p className="text-xl text-slate-400 mb-10 leading-relaxed font-medium">
            Empowering citizens across India to build better cities. Our AI-driven platform bridges the gap between you and the administration for a smarter, cleaner, and safer India.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={signIn}
              className="btn-primary flex items-center justify-center gap-2 text-lg"
            >
              Get Started with Google
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="btn-secondary text-lg">
              Learn How It Works
            </button>
          </div>
        </motion.div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
          {[
            { 
              icon: <Camera className="w-6 h-6" />, 
              title: "AI-Vision Reporting", 
              desc: "Snap a photo, and our Gemini AI automatically detects the category and urgency." 
            },
            { 
              icon: <Zap className="w-6 h-6" />, 
              title: "Automated Routing", 
              desc: "Tickets are instantly routed to the correct department based on AI classification." 
            },
            { 
              icon: <Trophy className="w-6 h-6" />, 
              title: "Citizen Credits", 
              desc: "Earn points for verified reports and contribute to your city's development." 
            }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (i + 1) }}
              className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-black text-white mb-3">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed font-medium">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { profile, logout, isDemoMode } = useAuth();
  const { t } = useLanguage();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode) {
      setIssues(SAMPLE_ISSUES);
      setLoading(false);
      return;
    }
    if (!profile) return;

    const q = query(
      collection(db, "issues"),
      where("reporterId", "==", profile.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Issue));
      setIssues(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile, isDemoMode]);

  const activityData = [
    { name: 'Mon', value: 0 },
    { name: 'Tue', value: 0 },
    { name: 'Wed', value: 0 },
    { name: 'Thu', value: 0 },
    { name: 'Fri', value: 0 },
    { name: 'Sat', value: 0 },
    { name: 'Sun', value: 0 },
  ];

  issues.forEach(issue => {
    const day = new Date(issue.createdAt).getDay();
    const dayIndex = (day + 6) % 7; // Adjust to Mon-Sun
    activityData[dayIndex].value += 1;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
      <div className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
            {t("welcome")}, {profile?.displayName?.split(' ')[0]}!
          </h1>
          <p className="text-slate-500 font-medium">{t("ready")}</p>
        </div>
        <button 
          onClick={logout}
          className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-danger hover:border-danger/50 transition-all flex items-center gap-2 group"
        >
          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="stat-card">
          <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-500">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-3xl font-black text-white">{profile?.points || 0}</p>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{t("impactPoints")}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-3xl font-black text-white">{profile?.streak || 0} Days</p>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{t("streak")}</p>
          </div>
        </div>
      </div>

      <section className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-sm mb-12">
        <h2 className="text-xl font-black text-white mb-8">{t("weeklyActivity")}</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} />
              <YAxis stroke="#64748b" axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '1rem' }}
                itemStyle={{ color: '#6366f1' }}
              />
              <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t("recentActivity")}</h2>
          <Link to="/report" className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">View All</Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : issues.length === 0 ? (
          <div className="bg-slate-900 border-2 border-dashed border-slate-800 rounded-[2.5rem] p-12 text-center">
            <h3 className="text-lg font-black text-white mb-2">{t("noReports")}</h3>
            <p className="text-slate-500 font-medium mb-6">{t("helpImprove")}</p>
            <Link to="/report" className="btn-primary inline-flex items-center gap-2">{t("fileReport")}</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {issues.slice(0, 5).map(issue => (
              <div key={issue.id} className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-all cursor-pointer">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Camera className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-white truncate">{issue.title}</h4>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{issue.category} • {new Date(issue.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className={cn(
                    "badge",
                    issue.status === 'resolved' ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"
                  )}>
                    {issue.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const CATEGORIES = [
  { id: "Pothole", icon: <AlertCircle className="w-6 h-6" />, color: "bg-red-500/10 text-red-500", dept: "PWD" },
  { id: "Street Light", icon: <Lightbulb className="w-6 h-6" />, color: "bg-yellow-500/10 text-yellow-500", dept: "Power Dept" },
  { id: "Water Leakage", icon: <Droplets className="w-6 h-6" />, color: "bg-blue-500/10 text-blue-500", dept: "Water Board" },
  { id: "Garbage", icon: <Trash2 className="w-6 h-6" />, color: "bg-green-500/10 text-green-500", dept: "Municipal Corp" },
  { id: "Sewage", icon: <Wind className="w-6 h-6" />, color: "bg-orange-500/10 text-orange-500", dept: "Municipal Corp" },
  { id: "Traffic", icon: <Car className="w-6 h-6" />, color: "bg-indigo-500/10 text-indigo-500", dept: "Traffic Police" },
];

const ReportIssue = () => {
  const { profile, logout, isDemoMode } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Pothole",
    urgency: "medium" as IssueUrgency,
    contactNumber: "",
    location: { lat: 0, lng: 0, address: "" }
  });
  const [aiResult, setAiResult] = useState<any>(null);

  const handleLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setFormData({
          ...formData,
          location: { 
            ...formData.location, 
            lat: pos.coords.latitude, 
            lng: pos.coords.longitude,
            address: "Current Location (GPS)" 
          }
        });
      });
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMedia(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!media) {
      alert(t("photoVideoRequired"));
      return;
    }
    setLoading(true);

    try {
      const base64 = mediaPreview?.split(',')[1];
      if (!base64) throw new Error("Failed to process media");
      
      const analysis = await analyzeIssue(base64, media.type);
      
      if (analysis.isSpam) {
        alert(`Spam Detected: ${analysis.spamReason || "This report does not appear to be a valid civic issue."}`);
        setLoading(false);
        return;
      }

      setAiResult(analysis);
      setStep(2);
    } catch (error) {
      console.error("AI Analysis failed:", error);
      alert("AI analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const confirmReport = async () => {
    if (!profile || !media) return;
    setLoading(true);

    try {
      if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        navigate("/");
        return;
      }

      const storageRef = ref(storage, `issues/${Date.now()}_${media.name}`);
      await uploadBytes(storageRef, media);
      const mediaUrl = await getDownloadURL(storageRef);
      const mediaType = media.type.startsWith("video") ? "video" : "image";

      const issueData: Omit<Issue, "id"> = {
        title: formData.title || `${aiResult.category} reported`,
        description: formData.description || aiResult.summary,
        category: aiResult.category,
        status: "pending",
        urgency: aiResult.urgency,
        location: formData.location,
        reporterId: profile.uid,
        reporterName: profile.displayName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        rewardPoints: 10,
        mediaUrl,
        mediaType,
        contactNumber: formData.contactNumber,
        assignedDepartment: aiResult.suggestedDepartment,
        aiAnalysis: {
          summary: aiResult.summary,
          suggestedDepartment: aiResult.suggestedDepartment
        }
      };

      // Check for duplication
      const masterTicketId = await handleDuplication(issueData);
      if (masterTicketId) {
        issueData.masterTicketId = masterTicketId;
      }

      await addDoc(collection(db, "issues"), issueData);
      
      const userRef = doc(db, "users", profile.uid);
      await updateDoc(userRef, {
        points: (profile.points || 0) + 10
      });

      navigate("/");
    } catch (error) {
      console.error("Failed to submit report:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 pb-32">
      <div className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">{t("reportIssue")}</h1>
          <div className="flex items-center gap-2">
            <p className="text-slate-500 font-medium">{t("geminiAi")}</p>
            <div className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-[9px] font-black text-primary uppercase tracking-widest">Powered by Gemini AI</span>
            </div>
          </div>
        </div>
        <button 
          onClick={logout}
          className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-danger hover:border-danger/50 transition-all flex items-center gap-2 group"
        >
          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.form 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleSubmit}
            className="space-y-8"
          >
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">{t("uploadMedia")}</label>
                <div className="relative group">
                  <input 
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={cn(
                    "w-full h-64 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all",
                    mediaPreview ? "border-primary/20 bg-primary/5" : "border-slate-800 bg-slate-900 group-hover:border-primary/40 group-hover:bg-primary/5"
                  )}>
                    {mediaPreview ? (
                      media?.type.startsWith("video") ? (
                        <video src={mediaPreview} className="h-full w-full object-cover rounded-[2.5rem]" />
                      ) : (
                        <img src={mediaPreview} className="h-full w-full object-cover rounded-[2.5rem]" referrerPolicy="no-referrer" />
                      )
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-slate-800 rounded-3xl shadow-sm flex items-center justify-center text-primary">
                          <Camera className="w-8 h-8" />
                        </div>
                        <div className="text-center">
                          <p className="font-black text-white">{t("captureOrUpload")}</p>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t("photoVideoRequired")}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{t("contactNumber")}</label>
                  <input 
                    required
                    type="tel"
                    placeholder="+91 00000 00000"
                    className="w-full px-6 py-4 rounded-2xl bg-slate-900 border border-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-white"
                    value={formData.contactNumber}
                    onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Location</label>
                  <button 
                    type="button"
                    onClick={handleLocation}
                    className="w-full px-6 py-4 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 flex items-center justify-center gap-2 transition-all font-bold text-slate-300"
                  >
                    <MapPin className="w-5 h-5 text-primary" />
                    {formData.location.address || t("fetchLocation")}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{t("describeIssue")}</label>
                <textarea 
                  rows={3}
                  placeholder="Any extra details for the department..."
                  className="w-full px-6 py-4 rounded-2xl bg-slate-900 border border-slate-800 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-white"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <button 
              disabled={loading}
              type="submit"
              className="btn-primary w-full py-5 text-lg flex items-center justify-center gap-3 disabled:opacity-50 relative overflow-hidden group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="animate-pulse">Analyzing with AI...</span>
                  <motion.div 
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-0 left-0 h-1 bg-white/30 w-full"
                  />
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  {t("analyzing")}
                </>
              )}
            </button>
          </motion.form>
        ) : (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-white">{t("aiAnalysisResult")}</h2>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-800 rounded-3xl border border-slate-700/50">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Detected Category</span>
                    <span className="text-lg font-black text-white flex items-center gap-2">
                      {aiResult.category}
                      <Sparkles className="w-4 h-4 text-primary" />
                    </span>
                  </div>
                  <div className="p-5 bg-slate-800 rounded-3xl border border-slate-700/50">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Urgency Level</span>
                    <span className={cn(
                      "text-lg font-black uppercase tracking-tight",
                      aiResult.urgency === "critical" ? "text-danger" :
                      aiResult.urgency === "high" ? "text-accent" :
                      aiResult.urgency === "medium" ? "text-amber-500" : "text-primary"
                    )}>
                      {aiResult.urgency}
                    </span>
                  </div>
                </div>

                <div className="p-5 bg-slate-800 rounded-3xl border border-slate-700/50">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">AI Confidence Score</span>
                    <span className="text-xs font-black text-primary">{(aiResult.confidenceScore * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${aiResult.confidenceScore * 100}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={cn(
                        "h-full rounded-full",
                        aiResult.confidenceScore > 0.8 ? "bg-secondary" : 
                        aiResult.confidenceScore > 0.5 ? "bg-primary" : "bg-danger"
                      )}
                    />
                  </div>
                </div>

                <div className="p-5 bg-slate-800 rounded-3xl border border-slate-700/50">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">AI Summary</span>
                  <p className="text-slate-300 leading-relaxed font-medium">{aiResult.summary}</p>
                </div>

                <div className="p-5 bg-primary/10 rounded-3xl border border-primary/20 relative overflow-hidden">
                  <div className="relative z-10">
                    <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest block mb-1">Target Department</span>
                    <span className="text-lg font-black text-primary">{aiResult.suggestedDepartment}</span>
                  </div>
                  <Sparkles className="absolute -right-2 -bottom-2 w-16 h-16 text-primary/5 rotate-12" />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setStep(1)}
                className="btn-secondary flex-1 py-4"
              >
                Edit Details
              </button>
              <button 
                onClick={confirmReport}
                disabled={loading}
                className="btn-primary flex-[2] py-4 text-lg flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                {t("confirmSubmit")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Discover = () => {
  const { logout, isDemoMode } = useAuth();
  const { t } = useLanguage();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (isDemoMode) {
      setIssues(SAMPLE_ISSUES);
      setLoading(false);
      return;
    }

    const q = query(collection(db, "issues"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Issue));
      setIssues(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isDemoMode]);

  const filteredIssues = filter === "all" ? issues : issues.filter(i => i.category === filter);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 pb-32">
      <div className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-2">{t("discover")}</h1>
          <p className="text-slate-500 font-medium text-lg">{t("discoverSubtitle")}</p>
        </div>
        <button 
          onClick={logout}
          className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-danger hover:border-danger/50 transition-all flex items-center gap-2 group"
        >
          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
        </button>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {["all", ...CATEGORIES.map(c => c.id)].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
              filter === cat ? "bg-primary text-white" : "bg-slate-900 text-slate-500 border border-slate-800 hover:border-slate-700"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {filteredIssues.map(issue => (
            <motion.div
              key={issue.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-sm overflow-hidden hover:shadow-xl transition-all"
            >
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 font-black text-xs">
                    {issue.reporterName?.[0] || "C"}
                  </div>
                  <div>
                    <h4 className="font-black text-white">{issue.reporterName || "Citizen"}</h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{new Date(issue.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="ml-auto">
                    <span className={cn(
                      "badge",
                      issue.status === 'resolved' ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"
                    )}>
                      {issue.status}
                    </span>
                  </div>
                </div>

                <h3 className="text-2xl font-black text-white mb-4 tracking-tight">{issue.title}</h3>
                <p className="text-slate-400 font-medium mb-6 leading-relaxed">{issue.description}</p>

                {issue.mediaUrl && (
                  <div className="rounded-3xl overflow-hidden mb-6 bg-slate-800 aspect-video">
                    {issue.mediaType === "video" ? (
                      <video src={issue.mediaUrl} controls className="w-full h-full object-cover" />
                    ) : (
                      <img src={issue.mediaUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-6 border-t border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-500">
                    <MapPin className="w-4 h-4 text-primary" />
                    {issue.location.address}
                  </div>
                  <span className="text-[10px] font-black text-primary bg-primary/10 px-4 py-2 rounded-xl uppercase tracking-widest">
                    {issue.category}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const NearbyIssues = () => {
  const { logout, isDemoMode } = useAuth();
  const { t } = useLanguage();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  useEffect(() => {
    if (isDemoMode) {
      setUserLocation({ lat: 18.5204, lng: 73.8567 });
      setIssues(SAMPLE_ISSUES);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error(err)
    );

    const q = query(collection(db, "issues"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Issue));
      setIssues(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isDemoMode]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const nearbyIssues = userLocation 
    ? issues.filter(issue => calculateDistance(userLocation.lat, userLocation.lng, issue.location.lat, issue.location.lng) <= 5)
    : issues;

  return (
    <div className="h-[calc(100vh-80px)] relative">
      <div className="absolute top-4 right-4 z-50">
        <button 
          onClick={logout}
          className="p-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-2xl text-slate-400 hover:text-danger hover:border-danger/50 transition-all flex items-center gap-2 group shadow-xl"
        >
          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
        </button>
      </div>
      <div className="absolute inset-0 z-0">
        {loading ? (
          <div className="flex items-center justify-center h-full bg-slate-950">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : (
          <MapContainer center={userLocation ? [userLocation.lat, userLocation.lng] : [20.5937, 78.9629]} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {nearbyIssues.map(issue => (
              <Marker 
                key={issue.id} 
                position={[issue.location.lat, issue.location.lng]}
                eventHandlers={{
                  click: () => setSelectedIssue(issue),
                }}
              />
            ))}
          </MapContainer>
        )}
      </div>

      <AnimatePresence>
        {selectedIssue && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute bottom-24 left-4 right-4 z-50"
          >
            <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden">
              <div className="relative h-48">
                {selectedIssue.mediaUrl && (
                  selectedIssue.mediaType === "video" ? (
                    <video src={selectedIssue.mediaUrl} className="w-full h-full object-cover" />
                  ) : (
                    <img src={selectedIssue.mediaUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  )
                )}
                <button 
                  onClick={() => setSelectedIssue(null)}
                  className="absolute top-4 right-4 p-2 bg-slate-950/50 backdrop-blur-md rounded-full text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8">
                <div className="flex justify-between items-center mb-4">
                  <span className="badge bg-primary/10 text-primary">{selectedIssue.category}</span>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{selectedIssue.status}</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-2">{selectedIssue.title}</h3>
                <p className="text-slate-400 font-medium mb-6 line-clamp-2">{selectedIssue.description}</p>
                <div className="flex items-center gap-2 text-xs font-black text-slate-500">
                  <MapPin className="w-4 h-4 text-primary" />
                  {selectedIssue.location.address}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-4 left-4 z-10">
        <div className="bg-slate-950/80 backdrop-blur-md p-4 rounded-2xl border border-slate-800">
          <h2 className="text-sm font-black text-white">Nearby Issues</h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{nearbyIssues.length} reports within 5km</p>
        </div>
      </div>
    </div>
  );
};

const CivicCoach = () => {
  const { logout } = useAuth();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: "Hello! I'm your AI Civic Coach. How can I help you today? Ask me for tips, reporting help, or a status update!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const response = await civicCoach(userMsg, messages);
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">{t("civicCoach")}</h1>
          <p className="text-slate-500 font-medium">{t("geminiAi")}</p>
        </div>
        <button 
          onClick={logout}
          className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-danger hover:border-danger/50 transition-all flex items-center gap-2 group"
        >
          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
        </button>
      </div>

      <div className="flex-1 bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={cn(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}>
              <div className={cn(
                "max-w-[80%] p-6 rounded-3xl font-medium leading-relaxed",
                msg.role === "user" ? "bg-primary text-white rounded-tr-none" : "bg-slate-800 text-slate-200 rounded-tl-none"
              )}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 p-6 rounded-3xl rounded-tl-none">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div className="p-6 bg-slate-950 border-t border-slate-800">
          <div className="flex gap-4">
            <input 
              type="text"
              placeholder="Ask me anything..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              className="btn-primary p-4"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DepartmentDashboard = () => {
  const { profile, logout, isDemoMode } = useAuth();
  const { t } = useLanguage();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [predictiveData, setPredictiveData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode) {
      setIssues(SAMPLE_ISSUES);
      setPredictiveData([
        { category: "Pothole", count: 12 },
        { category: "Garbage", count: 8 },
        { category: "Street Light", count: 15 }
      ]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, "issues"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Issue));
      setIssues(data);
      setLoading(false);
    });

    getPredictiveMaintenanceData().then(setPredictiveData);

    return () => unsubscribe();
  }, [isDemoMode]);

  const stats = [
    { label: "Total", value: issues.length, color: "text-white", bg: "bg-slate-800" },
    { label: "AI-Verified", value: issues.filter(i => i.status !== 'pending').length, color: "text-primary", bg: "bg-primary/10" },
    { label: "Critical", value: issues.filter(i => i.urgency === 'critical').length, color: "text-danger", bg: "bg-danger/10" },
    { label: "High Freq", value: predictiveData.length, color: "text-accent", bg: "bg-accent/10" },
    { label: "Resolved", value: issues.filter(i => i.status === 'resolved').length, color: "text-secondary", bg: "bg-secondary/10" },
    { label: "Pending", value: issues.filter(i => i.status === 'pending').length, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  const updateStatus = async (id: string, status: IssueStatus) => {
    if (isDemoMode) {
      setIssues(prev => prev.map(i => i.id === id ? { ...i, status, updatedAt: Date.now() } : i));
      return;
    }
    const ref = doc(db, "issues", id);
    await updateDoc(ref, { status, updatedAt: Date.now() });
  };

  // Chart Data
  const categoryData = CATEGORIES.map(cat => ({
    name: cat.id,
    value: issues.filter(i => i.category === cat.id).length
  })).filter(d => d.value > 0);

  const statusData = [
    { name: 'Pending', value: issues.filter(i => i.status === 'pending').length },
    { name: 'In Progress', value: issues.filter(i => i.status === 'in-progress').length },
    { name: 'Resolved', value: issues.filter(i => i.status === 'resolved').length },
  ];

  const COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 pb-32">
      <div className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-2">{t("adminDashboard")}</h1>
          <p className="text-slate-500 font-medium text-lg">Managing {profile?.departmentName} Operations</p>
        </div>
        <button 
          onClick={logout}
          className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-danger hover:border-danger/50 transition-all flex items-center gap-2 group"
        >
          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
        {stats.map((stat, i) => (
          <div key={i} className={cn("p-6 rounded-[2rem] border border-slate-800 shadow-sm", stat.bg)}>
            <p className="text-3xl font-black mb-1 text-white">{stat.value}</p>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <section className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl">
          <h2 className="text-xl font-black text-white mb-8">{t("categoryDistribution")}</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '1rem' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl">
          <h2 className="text-xl font-black text-white mb-8">{t("resolutionStatus")}</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#1e293b'}}
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '1rem' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl">
            <h2 className="text-xl font-black text-white mb-8">Predictive Maintenance Hotspots</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={predictiveData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="category" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '1rem' }} />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-xl overflow-hidden">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-black text-white">{t("activeTickets")}</h2>
              <button className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">Export Data</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-950">
                    <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">{t("issue")}</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">{t("urgency")}</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">{t("status")}</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">{t("action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {issues.map(issue => (
                    <tr key={issue.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-8 py-6">
                        <p className="font-black text-white">{issue.title}</p>
                        <p className="text-xs text-slate-500 font-medium">{issue.category}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest",
                          issue.urgency === 'critical' ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary"
                        )}>
                          {issue.urgency}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <select 
                          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300"
                          value={issue.status}
                          onChange={(e) => updateStatus(issue.id, e.target.value as IssueStatus)}
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          {issue.status === 'in-progress' && (
                            <label className="cursor-pointer p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors">
                              <Camera className="w-4 h-4" />
                              <input 
                                type="file" 
                                className="hidden" 
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const storageRef = ref(storage, `fixed/${issue.id}_${file.name}`);
                                    await uploadBytes(storageRef, file);
                                    const url = await getDownloadURL(storageRef);
                                    await updateDoc(doc(db, "issues", issue.id), { 
                                      fixedMediaUrl: url, 
                                      status: 'resolved',
                                      updatedAt: Date.now() 
                                    });
                                  }
                                }}
                              />
                            </label>
                          )}
                          <button className="p-2 text-slate-500 hover:text-primary transition-colors"><ChevronRight className="w-5 h-5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl">
            <h2 className="text-xl font-black text-white mb-6">Hotspot Analysis</h2>
            <div className="space-y-6">
              {predictiveData.map((h, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-danger/10 text-danger rounded-2xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-white">{h.category} Cluster</h4>
                    <p className="text-xs text-slate-500 font-medium">{h.count} reports in 10m radius</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-xs font-black text-danger uppercase tracking-widest animate-pulse">Critical</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const MapLayout = () => {
  const { isDemoMode } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode) {
      setIssues(SAMPLE_ISSUES);
      setLoading(false);
      return;
    }

    const q = query(collection(db, "issues"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Issue));
      setIssues(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isDemoMode]);

  const getMarkerColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return '#f43f5e';
      case 'high': return '#f97316';
      case 'medium': return '#f59e0b';
      default: return '#6366f1';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-5xl font-black text-white tracking-tighter mb-2">Live Heatmap</h1>
        <p className="text-slate-500 font-medium text-lg">Visualizing active reports across the nation with marker clustering.</p>
      </div>

      <div className="bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl shadow-primary/10 overflow-hidden h-[700px] relative z-0">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-10">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
        ) : (
          <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {issues.map(issue => (
              <CircleMarker 
                key={issue.id}
                center={[issue.location.lat, issue.location.lng]}
                radius={issue.urgency === 'critical' ? 15 : 10}
                pathOptions={{ 
                  fillColor: getMarkerColor(issue.urgency), 
                  color: getMarkerColor(issue.urgency),
                  fillOpacity: 0.6,
                  className: issue.urgency === 'critical' ? 'animate-pulse' : ''
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-black text-slate-900">{issue.title}</h3>
                    <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">{issue.category}</p>
                    <p className="text-xs text-slate-500 line-clamp-2">{issue.description}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
};

// --- Auth Provider ---

import { translations } from "./translations";

type Language = "en" | "hi";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};

const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>("en");
  const t = (key: keyof typeof translations.en) => translations[lang][key] || key;
  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

const RoleSelection = ({ onSelect }: { onSelect: (role: UserRole, deptName?: string) => void }) => {
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [deptName, setDeptName] = useState("General Services");

  const deptTypes = [
    { id: "Roads", name: t("roads") },
    { id: "Water", name: t("water") },
    { id: "Electricity", name: t("electricity") },
    { id: "Sanitation", name: t("sanitation") },
    { id: "Traffic", name: t("traffic") },
    { id: "Other", name: t("other") },
  ];

  if (selectedRole === "department") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-black text-white tracking-tighter">{t("selectDept")}</h2>
            <p className="mt-2 text-slate-500 font-medium">{t("selectHowToUse")}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {deptTypes.map((dept) => (
              <button
                key={dept.id}
                onClick={() => onSelect("department", dept.name)}
                className="p-6 bg-slate-900 border border-slate-800 rounded-3xl hover:border-accent/50 transition-all text-center font-black text-white"
              >
                {dept.name}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setSelectedRole(null)}
            className="w-full py-4 text-slate-500 font-black uppercase tracking-widest text-xs hover:text-white transition-colors"
          >
            {t("back")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-black text-white tracking-tighter">{t("chooseRole")}</h2>
          <p className="mt-2 text-slate-500 font-medium">{t("selectHowToUse")}</p>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => onSelect("citizen")}
            className="p-8 bg-slate-900 border border-slate-800 rounded-[2rem] hover:border-primary/50 transition-all group text-left"
          >
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
              <UserIcon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-white">{t("citizen")}</h3>
            <p className="text-sm text-slate-500 mt-1">{t("citizenDesc")}</p>
          </button>
          <button
            onClick={() => setSelectedRole("department")}
            className="p-8 bg-slate-900 border border-slate-800 rounded-[2rem] hover:border-accent/50 transition-all group text-left"
          >
            <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-white">{t("department")}</h3>
            <p className="text-sm text-slate-500 mt-1">{t("departmentDesc")}</p>
          </button>
        </div>
      </div>
    </div>
  );
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const demoProfile: UserProfile = {
    uid: "demo-user",
    email: "demo@smartsamadhan.in",
    displayName: "Demo User",
    role: "citizen",
    points: 1250,
    streak: 5,
    createdAt: Date.now() - 2592000000,
  };

  useEffect(() => {
    if (isDemoMode) {
      setUser({ uid: "demo-user", email: "demo@smartsamadhan.in", displayName: "Demo User" } as User);
      setProfile(demoProfile);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        const docRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
          setNeedsProfile(false);
        } else {
          setNeedsProfile(true);
        }
      } else {
        setProfile(null);
        setNeedsProfile(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isDemoMode]);

  const toggleDemoMode = () => {
    setIsDemoMode(!isDemoMode);
    if (!isDemoMode) {
      setProfile(demoProfile);
    }
  };

  const setDemoRole = (role: UserRole) => {
    if (!isDemoMode) return;
    setProfile({
      ...demoProfile,
      role,
      departmentName: role === "department" ? "Municipal Corp" : undefined
    });
  };

  const handleRoleSelect = async (role: UserRole, deptName?: string) => {
    if (!user) return;
    setLoading(true);
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || (role === "department" ? "Dept Official" : "Citizen"),
      role,
      points: 0,
      streak: 1,
      createdAt: Date.now(),
      departmentName: role === "department" ? (deptName || "General Services") : undefined
    };
    await setDoc(doc(db, "users", user.uid), newProfile);
    setProfile(newProfile);
    setNeedsProfile(false);
    setLoading(false);
  };

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  if (loading) return <LoadingScreen />;
  if (user && needsProfile) return <RoleSelection onSelect={handleRoleSelect} />;

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, logout, isDemoMode, toggleDemoMode, setDemoRole }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Routes ---

const CitizenRoute = ({ children }: { children: React.ReactNode }) => {
  const { profile, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return profile?.role === "citizen" ? <>{children}</> : <Navigate to="/" />;
};

const DepartmentRoute = ({ children }: { children: React.ReactNode }) => {
  const { profile, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return profile?.role === "department" ? <>{children}</> : <Navigate to="/" />;
};

// --- Main App ---

const DemoToggle = () => {
  const { isDemoMode, toggleDemoMode, setDemoRole, profile } = useAuth();
  
  return (
    <div className="fixed top-4 left-4 z-[100] flex flex-col gap-2">
      <button 
        onClick={toggleDemoMode}
        className={cn(
          "px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border",
          isDemoMode 
            ? "bg-secondary text-white border-secondary shadow-lg shadow-secondary/20" 
            : "bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700"
        )}
      >
        <Zap className={cn("w-4 h-4", isDemoMode ? "fill-white" : "")} />
        {isDemoMode ? "Demo Mode Active" : "Try Demo Mode"}
      </button>

      {isDemoMode && (
        <div className="flex gap-2">
          <button 
            onClick={() => setDemoRole("citizen")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border",
              profile?.role === "citizen" ? "bg-primary text-white border-primary" : "bg-slate-900 text-slate-500 border-slate-800"
            )}
          >
            Citizen
          </button>
          <button 
            onClick={() => setDemoRole("department")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border",
              profile?.role === "department" ? "bg-accent text-white border-accent" : "bg-slate-900 text-slate-500 border-slate-800"
            )}
          >
            Dept
          </button>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-slate-950 font-sans text-slate-200">
            <Routes>
              <Route path="/" element={<MainLayout />} />
              <Route path="/discover" element={<CitizenRoute><Discover /></CitizenRoute>} />
              <Route path="/report" element={<CitizenRoute><ReportIssue /></CitizenRoute>} />
              <Route path="/nearby" element={<CitizenRoute><NearbyIssues /></CitizenRoute>} />
              <Route path="/coach" element={<CitizenRoute><CivicCoach /></CitizenRoute>} />
              <Route path="/department" element={<DepartmentRoute><DepartmentDashboard /></DepartmentRoute>} />
              <Route path="/map" element={<DepartmentRoute><MapLayout /></DepartmentRoute>} />
            </Routes>
            <BottomNav />
            <LanguageToggle />
            <DemoToggle />
          </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

const LanguageToggle = () => {
  const { lang, setLang } = useLanguage();
  return (
    <div className="fixed top-4 right-4 z-[100] flex gap-2">
      <button 
        onClick={() => setLang("en")}
        className={cn(
          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
          lang === "en" ? "bg-primary text-white" : "bg-slate-900 text-slate-500 border border-slate-800"
        )}
      >
        EN
      </button>
      <button 
        onClick={() => setLang("hi")}
        className={cn(
          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
          lang === "hi" ? "bg-primary text-white" : "bg-slate-900 text-slate-500 border border-slate-800"
        )}
      >
        HI
      </button>
    </div>
  );
};

const MainLayout = () => {
  const { user, profile } = useAuth();
  if (!user) return <LandingPage />;
  return profile?.role === "department" ? <Navigate to="/department" /> : <Dashboard />;
};
