import { useState, useEffect } from "react";
import {
  BarChart,
  Users,
  TrendingUp,
  Clock,
  RefreshCw,
  X,
  Eye,
  Trash2,
  Play,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import config from "../config";
import { useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import BackgroundMath from "../components/BackgroundMath";

// Format waktu dalam menit dan detik (helper function)
const formatTimeMinutesSeconds = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes === 0) return `${secs} detik`;
  if (secs === 0) return `${minutes} menit`;
  return `${minutes} menit ${secs} detik`;
};

// Helper untuk menghitung statistik & kelulusan
const calculateTestStats = (answers, totalTimeSeconds, maxIncorrect = 7, minQuestions = 35) => {
  if (!answers || !Array.isArray(answers)) return { questionsOverTime: [], isPassed: false };
  
  const questionsOverTime = [];
  let currentMinute = 0;
  let questionsInMinute = 0;
  
  answers.forEach((answer, index) => {
    const totalTimeForQuestion = answers
      .slice(0, index + 1)
      .reduce((sum, a) => sum + (a.timeSpent || 0), 0);
      
    const minute = Math.floor(totalTimeForQuestion / 60000);
    
    if (minute === currentMinute) {
      questionsInMinute++;
    } else {
      if (questionsInMinute > 0) {
        questionsOverTime.push({
          menit: currentMinute + 1,
          jumlahSoal: questionsInMinute
        });
      }
      currentMinute = minute;
      questionsInMinute = 1;
    }
  });
  
  if (questionsInMinute > 0) {
    questionsOverTime.push({
      menit: currentMinute + 1,
      jumlahSoal: questionsInMinute
    });
  }

  const fullMinutes = Math.floor((totalTimeSeconds || 0) / 60);
  const validMinutesData = questionsOverTime.filter(item => item.menit <= fullMinutes);
  const isSpeedPassed = validMinutesData.length > 0 
    ? validMinutesData.every(item => item.jumlahSoal >= minQuestions)
    : true; 

  const correctCount = answers.filter(a => a.isCorrect).length;
  const incorrectCount = answers.length - correctCount;
  const isAccuracyPassed = incorrectCount <= maxIncorrect;
    
  return { questionsOverTime, isPassed: isSpeedPassed && isAccuracyPassed };
};

/**
 * Modal Component untuk Detail Hasil Test
 */
const ResultDetailModal = ({ result, onClose, maxIncorrectAnswers, minQuestionsPerMinute }) => {
  if (!result) return null;

  const { questionsOverTime } = calculateTestStats(result.answers, result.totalTime || result.total_time, maxIncorrectAnswers, minQuestionsPerMinute);

  const timePerQuestion = (result.answers || []).map((ans, idx) => ({
    soal: idx + 1,
    waktu: Math.round((ans.timeSpent || 0) / 1000),
  }));

  return (
    <div className="fixed inset-0 bg-indigo-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-300">
      <div className="bg-indigo-900/90 backdrop-blur-xl border border-indigo-100/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-[3rem] max-w-6xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-indigo-900/80 backdrop-blur-md p-8 border-b border-indigo-100/10 flex justify-between items-center z-20">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight">Detail Hasil Evaluasi</h2>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-indigo-200 font-bold">{result.participantName}</span>
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
              <span className="text-indigo-400 text-sm">{result.participantEmail}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-white transition-all hover:rotate-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-12">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white/5 rounded-[2rem] p-6 border border-indigo-100/10 text-center group hover:bg-white/10 transition-all">
              <p className="text-sm font-black text-amber-400 uppercase tracking-widest mb-1">Skor Akhir</p>
              <p className="text-4xl font-black text-white">{result.score}%</p>
            </div>
            <div className="bg-white/5 rounded-[2rem] p-6 border border-indigo-100/10 text-center group hover:bg-white/10 transition-all">
              <p className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-1">Benar / Total</p>
              <p className="text-4xl font-black text-white">{result.correctAnswers || result.correct_answers} / {result.totalQuestions || result.total_questions}</p>
            </div>
            <div className="bg-white/5 rounded-[2rem] p-6 border border-indigo-100/10 text-center group hover:bg-white/10 transition-all">
              <p className="text-sm font-black text-sky-400 uppercase tracking-widest mb-1">Durasi Total</p>
              <p className="text-4xl font-black text-white">{formatTimeMinutesSeconds(result.totalTime || result.total_time)}</p>
            </div>
            <div className="bg-white/5 rounded-[2rem] p-6 border border-indigo-100/10 text-center group hover:bg-white/10 transition-all">
              <p className="text-sm font-black text-purple-400 uppercase tracking-widest mb-1">Laju / Soal</p>
              <p className="text-4xl font-black text-white">{result.totalQuestions ? ((result.totalTime || result.total_time) / result.totalQuestions).toFixed(2) : 0}s</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/5 rounded-[2.5rem] p-8 border border-indigo-100/10">
              <h3 className="text-lg font-black text-white mb-8 uppercase tracking-widest flex items-center gap-3">
                <BarChart className="w-5 h-5 text-indigo-400" /> Waktu per Soal
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timePerQuestion}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="soal" hide />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e1b4b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px" }} />
                    <Line type="monotone" dataKey="waktu" stroke="#818cf8" strokeWidth={4} dot={false} animationDuration={2000} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white/5 rounded-[2.5rem] p-8 border border-indigo-100/10">
              <h3 className="text-lg font-black text-white mb-8 uppercase tracking-widest flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-green-400" /> Produktivitas
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={questionsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="menit" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e1b4b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px" }} />
                    <Line type="monotone" dataKey="jumlahSoal" stroke="#10b981" strokeWidth={4} dot={false} animationDuration={2500} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-[2.5rem] p-8 border border-indigo-100/10 overflow-hidden">
            <h3 className="text-lg font-black text-white mb-8 uppercase tracking-widest">Urutan Pengerjaan (50 Soal Pertama)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-indigo-950/40 border-b border-indigo-100/10">
                  <tr>
                    <th className="px-6 py-4 text-xs font-black text-indigo-300 uppercase tracking-widest">No</th>
                    <th className="px-6 py-4 text-xs font-black text-indigo-300 uppercase tracking-widest">Soal</th>
                    <th className="px-6 py-4 text-xs font-black text-indigo-300 uppercase tracking-widest text-center">User</th>
                    <th className="px-6 py-4 text-xs font-black text-indigo-300 uppercase tracking-widest text-center">Kunci</th>
                    <th className="px-6 py-4 text-xs font-black text-indigo-300 uppercase tracking-widest text-center">Waktu</th>
                    <th className="px-6 py-4 text-xs font-black text-indigo-300 uppercase tracking-widest text-right">Hasil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-100/5">
                  {(result.answers || []).slice(0, 50).map((ans, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-indigo-400">#{idx + 1}</td>
                      <td className="px-6 py-4 text-sm font-bold text-white">{ans.question}</td>
                      <td className="px-6 py-4 text-sm font-bold text-indigo-200 text-center">{ans.userAnswer}</td>
                      <td className="px-6 py-4 text-sm font-bold text-indigo-400 text-center">{ans.correctAnswer}</td>
                      <td className="px-6 py-4 text-xs font-medium text-indigo-300/60 text-center">{Math.round((ans.timeSpent || 0) / 1000)}s</td>
                      <td className="px-6 py-4 text-right">
                        {ans.isCorrect ? (
                          <span className="text-green-400 font-black">BENAR</span>
                        ) : (
                          <span className="text-red-400 font-black">SALAH</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const [results, setResults] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchEmail, setSearchEmail] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(15 * 60);
  const [questionCount, setQuestionCount] = useState(525);
  const [maxIncorrectAnswers, setMaxIncorrectAnswers] = useState(7);
  const [minQuestionsPerMinute, setMinQuestionsPerMinute] = useState(35);
  const [pairs, setPairs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [questionsHistory, setQuestionsHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const { signOut: logout, getToken } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (!confirm("Apakah Anda yakin ingin logout?")) return;
    await logout();
    navigate("/", { replace: true });
  };

  const fetchResults = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(`${config.apiUrl}/test-results`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (response.ok) setResults(data.data || []);
      else if (response.status === 401) logout();
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${config.apiUrl}/statistics`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (response.ok) setStatistics(data.data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const fetchQuestionsHistory = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${config.apiUrl}/questions`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (response.ok) setQuestionsHistory(data.data);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  useEffect(() => {
    fetchResults();
    fetchStatistics();
    fetchQuestionsHistory();

    (async () => {
      try {
        const token = await getToken();
        const r = await fetch(`${config.apiUrl}/config`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        const d = await r.json();
        if (r.ok && d.data) {
          setDurationSeconds(d.data.durationSeconds || 15 * 60);
          setQuestionCount(d.data.questionCount || 525);
          setMaxIncorrectAnswers(d.data.maxIncorrectAnswers ?? 7);
          setMinQuestionsPerMinute(d.data.minQuestionsPerMinute ?? 35);
          setPairs(Array.isArray(d.data.pairs) ? d.data.pairs : []);
        }
      } catch (e) {
        console.error("Failed to load config", e);
      }
    })();
  }, []);

  const handleRegenerate = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      const r = await fetch(`${config.apiUrl}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ regenerate: true, durationSeconds, questionCount, maxIncorrectAnswers, minQuestionsPerMinute }),
      });
      const d = await r.json();
      if (r.ok && d.data) {
        setPairs(d.data.pairs);
        setDurationSeconds(d.data.durationSeconds);
        setQuestionCount(d.data.questionCount);
        setMaxIncorrectAnswers(d.data.maxIncorrectAnswers);
        setMinQuestionsPerMinute(d.data.minQuestionsPerMinute);
      }
    } catch (e) {
      console.error("Failed to regenerate", e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus data?")) return;
    setDeletingId(id);
    try {
      const token = await getToken();
      await fetch(`${config.apiUrl}/test-results/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchResults();
      fetchStatistics();
    } catch (error) {
      console.error("Error deleting:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredResults = (results || []).filter(result => {
    const matchesSearch = !searchEmail || 
      (result.participantEmail && result.participantEmail.toLowerCase().includes(searchEmail.toLowerCase())) ||
      (result.participantName && result.participantName.toLowerCase().includes(searchEmail.toLowerCase()));
    
    if (filter === "all") return matchesSearch;
    const resultDate = new Date(result.created_at);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now - resultDate) / (1000 * 60 * 60 * 24));
    
    if (filter === "today") return matchesSearch && diffDays <= 1;
    if (filter === "week") return matchesSearch && diffDays <= 7;
    if (filter === "month") return matchesSearch && diffDays <= 30;
    return matchesSearch;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <div className="min-h-screen bg-indigo-800 relative p-6 overflow-x-hidden">
      <BackgroundMath />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] border border-indigo-100/20 shadow-2xl p-8 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="md:flex md:items-center md:justify-between grid grid-cols-1 gap-4">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-20 h-20 bg-indigo-500/20 rounded-3xl flex items-center justify-center border border-indigo-100/20 shadow-[0_0_20px_rgba(224,231,255,0.2)]">
                <BarChart className="w-10 h-10 text-indigo-300" />
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-4xl font-black text-emerald-400 tracking-tight">Admin Dashboard</h1>
                <p className="text-lg text-amber-400 font-medium">Monitor dan kelola evaluasi matematika real-time</p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap justify-center">
              <button onClick={() => window.open("/test", "_blank")} className="bg-emerald-400/50 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl font-bold transition-all border border-indigo-100/20">Coba Test</button>
              <button onClick={() => { fetchResults(); fetchStatistics(); }} className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20"><RefreshCw className="w-5 h-5" /> Refresh</button>
              <button onClick={handleLogout} className="bg-red-500/20 hover:bg-red-600 text-red-200 hover:text-white px-6 py-3 rounded-2xl font-bold border border-red-500/30">Logout</button>
            </div>
          </div>
        </div>

        {/* Config Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] border border-indigo-100/20 shadow-2xl p-8 mb-8">
          <h2 className="text-xl font-black text-indigo-100 mb-6 uppercase tracking-widest flex items-center gap-3">
            <Clock className="w-6 h-6 text-indigo-400" /> Pengaturan Evaluasi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-8">
            <div className="space-y-2">
              <label className="block text-sm font-black uppercase tracking-widest text-amber-400">Durasi (menit)</label>
              <input type="number" value={Math.floor(durationSeconds / 60)} onChange={(e) => setDurationSeconds(parseInt(e.target.value || "0") * 60)} className="w-full px-4 py-3 bg-white/5 border border-indigo-100/20 rounded-xl text-white focus:border-indigo-400 focus:outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-black uppercase tracking-widest text-sky-400">Jumlah Soal</label>
              <input type="number" value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value || "0"))} className="w-full px-4 py-3 bg-white/5 border border-indigo-100/20 rounded-xl text-white focus:border-indigo-400 focus:outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-black uppercase tracking-widest text-rose-400">Max. Salah</label>
              <input type="number" value={maxIncorrectAnswers} onChange={(e) => setMaxIncorrectAnswers(Number(e.target.value))} className="w-full px-4 py-3 bg-white/5 border border-indigo-100/20 rounded-xl text-white focus:border-indigo-400 focus:outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-black uppercase tracking-widest text-emerald-400">Benar/Menit</label>
              <input type="number" value={minQuestionsPerMinute} onChange={(e) => setMinQuestionsPerMinute(Number(e.target.value))} className="w-full px-4 py-3 bg-white/5 border border-indigo-100/20 rounded-xl text-white focus:border-indigo-400 focus:outline-none transition-all" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button onClick={handleRegenerate} disabled={saving} className="bg-indigo-400/20 hover:bg-indigo-400/30 text-indigo-200 hover:text-white px-6 py-3 rounded-2xl font-bold transition-all border border-indigo-400/30 active:scale-95">{saving ? "Proses..." : "Simpan & Generate"}</button>
            <div className="text-sm text-indigo-300/60 uppercase tracking-widest flex gap-6">
              <span>Soal: <strong className="text-amber-400 text-base">{pairs.length}</strong></span>
              <span>Aktif: <strong className="text-emerald-400 text-base">{questionCount}</strong></span>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] border border-indigo-100/20 shadow-2xl p-8 mb-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-indigo-100 uppercase tracking-widest flex items-center gap-3">
              <Clock className="w-6 h-6 text-indigo-400" /> Riwayat Konfigurasi
            </h2>
            <button onClick={() => setShowHistory(!showHistory)} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl text-xs font-bold transition-all border border-indigo-100/10">
              {showHistory ? "Sembunyikan" : "Tampilkan"}
            </button>
          </div>
          {showHistory && (
            <div className="overflow-hidden rounded-3xl border border-indigo-100/10 active:scale-[0.99] transition-all">
              <table className="w-full text-left bg-indigo-950/20">
                <thead className="bg-indigo-950/40 border-b border-indigo-100/10">
                  <tr>
                    <th className="px-6 py-4 text-xs font-black text-indigo-300 uppercase tracking-widest">ID</th>
                    <th className="px-6 py-4 text-xs font-black text-indigo-300 uppercase tracking-widest">Soal</th>
                    <th className="px-6 py-4 text-xs font-black text-indigo-300 uppercase tracking-widest">Durasi</th>
                    <th className="px-6 py-4 text-xs font-black text-indigo-300 uppercase tracking-widest">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-100/5">
                  {questionsHistory.map((item, index) => (
                    <tr key={item.id} className={`transition-all hover:bg-white/5 ${index === 0 ? "bg-indigo-500/10" : ""}`}>
                      <td className="px-6 py-4 text-xs font-bold text-indigo-400">#{item.id}</td>
                      <td className="px-6 py-4 text-xs font-bold text-white">{item.totalQuestions}</td>
                      <td className="px-6 py-4 text-xs font-bold text-white">{Math.floor(item.durationSeconds / 60)}m</td>
                      <td className="px-6 py-4 text-xs font-medium text-indigo-300/60">{formatDate(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-indigo-100/20 p-6 flex items-center gap-5 hover:bg-white/15 transition-all">
              <div className="w-14 h-14 bg-sky-500/20 rounded-2xl flex items-center justify-center border border-sky-400/20"><Users className="w-7 h-7 text-sky-300" /></div>
              <div><div className="text-3xl font-black text-white">{statistics.totalTests}</div><div className="text-xs uppercase tracking-widest font-black text-sky-400/80">Total Peserta</div></div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-indigo-100/20 p-6 flex items-center gap-5 hover:bg-white/15 transition-all">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-400/20"><TrendingUp className="w-7 h-7 text-emerald-300" /></div>
              <div><div className="text-3xl font-black text-white">{statistics.averageScore}%</div><div className="text-xs uppercase tracking-widest font-black text-emerald-400/80">Rerata Skor</div></div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-indigo-100/20 p-6 flex items-center gap-5 hover:bg-white/15 transition-all">
              <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center border border-purple-400/20"><Clock className="w-7 h-7 text-purple-300" /></div>
              <div><div className="text-3xl font-black text-white">{formatTimeMinutesSeconds(statistics.averageTime)}</div><div className="text-xs uppercase tracking-widest font-black text-purple-400/80">Rerata Waktu</div></div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-indigo-100/20 p-6 flex items-center gap-5 hover:bg-white/15 transition-all">
              <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center border border-amber-400/20"><BarChart className="w-7 h-7 text-amber-300" /></div>
              <div><div className="text-3xl font-black text-white">{statistics.highestScore}%</div><div className="text-xs uppercase tracking-widest font-black text-amber-400/80">Skor Teratas</div></div>
            </div>
          </div>
        )}

        {/* Results Table */}
        <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] border border-indigo-100/20 shadow-2xl p-8">
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="flex-1 relative">
              <input type="text" placeholder="Cari nama atau email..." value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white/5 border border-indigo-100/20 rounded-2xl text-white placeholder-indigo-300/40 focus:border-indigo-400 focus:outline-none transition-all" />
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex gap-2 p-1.5 bg-indigo-950/30 rounded-2xl border border-indigo-100/10">
              {["all", "today", "week", "month"].map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`px-6 py-2.5 rounded-xl font-black transition-all text-xs uppercase tracking-widest ${filter === f ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/50" : "text-indigo-300 hover:text-white"}`}>
                  {f === "all" ? "Semua" : f === "today" ? "Hari Ini" : f === "week" ? "Minggu" : "Bulan"}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-[2rem] border border-indigo-100/10">
            <table className="w-full text-left">
              <thead className="bg-indigo-950/40 border-b border-indigo-100/10">
                <tr>
                  <th className="px-8 py-6 text-xs font-black text-indigo-300 uppercase tracking-widest">Peserta</th>
                  <th className="px-8 py-6 text-xs font-black text-indigo-300 uppercase tracking-widest text-center">Skor</th>
                  <th className="px-8 py-6 text-xs font-black text-indigo-300 uppercase tracking-widest text-center">Benar/Total</th>
                  <th className="px-8 py-6 text-xs font-black text-indigo-300 uppercase tracking-widest text-center">Waktu</th>
                  <th className="px-8 py-6 text-xs font-black text-indigo-300 uppercase tracking-widest text-center">Evaluasi</th>
                  <th className="px-8 py-6 text-xs font-black text-indigo-300 uppercase tracking-widest">Tanggal</th>
                  <th className="px-8 py-6 text-xs font-black text-indigo-300 uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-100/5">
                {filteredResults.map((result) => {
                  const { isPassed } = calculateTestStats(result.answers, result.totalTime || result.total_time, maxIncorrectAnswers, minQuestionsPerMinute);
                  return (
                    <tr key={result.id} className="group transition-colors hover:bg-white/5">
                      <td className="px-8 py-6">
                        <div className="text-sm font-black text-sky-400">{result.participantName}</div>
                        <div className="text-[10px] text-emerald-400 font-medium">{result.participantEmail}</div>
                      </td>
                      <td className="px-8 py-6 text-center font-black text-amber-400">{result.score}%</td>
                      <td className="px-8 py-6 text-center text-sm font-bold text-sky-400">{result.correctAnswers} / {result.totalQuestions}</td>
                      <td className="px-8 py-6 text-center text-sm font-bold text-indigo-200">{formatTimeMinutesSeconds(result.totalTime || result.total_time)}</td>
                      <td className="px-8 py-6 text-center">
                        <span className={`px-5 py-2 rounded-full text-xs font-black border-2 ${isPassed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'}`}>{isPassed ? 'LULUS' : 'GAGAL'}</span>
                      </td>
                      <td className="px-8 py-6 text-sm font-bold text-indigo-300">{formatDate(result.createdAt)}</td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3 translate-x-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                          <button onClick={() => setSelectedResult(result)} className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-300 hover:bg-indigo-500 hover:text-white transition-all"><Eye className="w-5 h-5" /></button>
                          <button onClick={() => handleDelete(result.id)} disabled={deletingId === result.id} className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-xs font-black text-indigo-300/40 uppercase tracking-[0.4em]">Powered by uchida core • Evaluasi Akademik Mandiri</p>
        </div>
      </div>

      <ResultDetailModal
        result={selectedResult}
        onClose={() => setSelectedResult(null)}
        maxIncorrectAnswers={maxIncorrectAnswers}
        minQuestionsPerMinute={minQuestionsPerMinute}
      />
    </div>
  );
}
