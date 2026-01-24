import { useState, useEffect } from "react";
import {
  BarChart,
  Users,
  TrendingUp,
  Clock,
  RefreshCw,
  X, // Ditambahkan untuk Modal
  Eye, // Ditambahkan untuk tombol Aksi
  Trash2, // Ditambahkan untuk tombol Hapus
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import config from "../config";
import { useAuth } from "../hooks/useAuth";
// import LogoutButton from "../components/LogoutButton";
import { useNavigate } from "react-router-dom";

// Format waktu dalam menit dan detik (helper function)
const formatTimeMinutesSeconds = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes === 0) {
    return `${secs} detik`;
  }
  if (secs === 0) {
    return `${minutes} menit`;
  }
  return `${minutes} menit ${secs} detik`;
};

// Helper untuk menghitung statistik & kelulusan (Konsisten dengan TestPage)
const calculateTestStats = (answers, totalTimeSeconds, maxIncorrect = 7, minQuestions = 35) => {
  if (!answers || !Array.isArray(answers)) return { questionsOverTime: [], isPassed: false };
  
  const questionsOverTime = [];
  let currentMinute = 0;
  let questionsInMinute = 0;
  
  // Hitung produktivitas per menit berdasarkan urutan pengerjaan
  answers.forEach((answer, index) => {
    // Hitung waktu kumulatif sampai soal ini
    // Kita gunakan reduce dari awal karena kita butuh waktu kumulatif absolut
    const totalTimeForQuestion = answers
      .slice(0, index + 1)
      .reduce((sum, a) => sum + (a.timeSpent || 0), 0);
      
    const minute = Math.floor(totalTimeForQuestion / 60000); // convert ms to minutes
    
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
      questionsInMinute = 1; // Mulai hitung untuk menit baru
    }
  });
  
  // Add last minute
  if (questionsInMinute > 0) {
    questionsOverTime.push({
      menit: currentMinute + 1,
      jumlahSoal: questionsInMinute
    });
  }

  // Hitung Kelulusan (Logika Baru: Ignore Partial Minutes)
  // Total time di DB dalam detik, konversi ke menit penuh
  const fullMinutes = Math.floor((totalTimeSeconds || 0) / 60);
  
  const validMinutesData = questionsOverTime.filter(item => item.menit <= fullMinutes);
  
  // Cek Speed
  const isSpeedPassed = validMinutesData.length > 0 
    ? validMinutesData.every(item => item.jumlahSoal >= minQuestions)
    : true; 

  // Cek Accuracy
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

  // Gunakan helper calculateTestStats
  const { questionsOverTime } = calculateTestStats(result.answers, result.totalTime || result.total_time, maxIncorrectAnswers, minQuestionsPerMinute);

  // Grafik 1: Waktu per soal (sederhana mapping)
  const timePerQuestion = (result.answers || []).map((ans, idx) => ({
    soal: idx + 1,
    waktu: Math.round((ans.timeSpent || 0) / 1000),
  }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 p-6 border-b border-gray-700 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Detail Hasil Test - {result.participantName}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {result.participantEmail}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Skor</p>
              <p className="text-2xl font-bold text-green-400">
                {result.score}%
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Benar/Total</p>
              <p className="text-2xl font-bold text-blue-400">
                {result.correctAnswers || result.correct_answers}/{result.totalQuestions || result.total_questions}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Total Waktu</p>
              <p className="text-2xl font-bold text-yellow-400">
                {formatTimeMinutesSeconds(result.totalTime || result.total_time)}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Rata-rata/Soal</p>
              <p className="text-2xl font-bold text-purple-400">
                {((result.totalTime || result.total_time) / (result.totalQuestions || result.total_questions)).toFixed(2)}s
              </p>
            </div>
          </div>

          {/* Grafik 1: Waktu per Soal */}
          {timePerQuestion.length > 0 ? (
            <div className="bg-white/10 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                📊 Waktu Pengerjaan per Soal
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timePerQuestion}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis
                    dataKey="soal"
                    stroke="#999"
                    label={{
                      value: "Nomor Soal",
                      position: "insideBottom",
                      offset: -5,
                      fill: "#999",
                    }}
                  />
                  <YAxis
                    stroke="#999"
                    label={{
                      value: "Waktu (detik)",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#999",
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #4b5563",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="waktu"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    dot={{ fill: "#4f46e5", r: 3 }}
                    name="Waktu (detik)"
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-sm text-gray-400 mt-4 text-center">
                Rata-rata waktu:{" "}
                {((result.totalTime || result.total_time) / (result.totalQuestions || result.total_questions)).toFixed(2)}{" "}
                detik/soal
              </p>
            </div>
          ) : (
             <div className="bg-white/10 rounded-lg p-6 text-center text-gray-400">
                Data grafik waktu pengerjaan tidak tersedia.
             </div>
          )}

          {/* Grafik 2: Produktivitas per Menit */}
          {questionsOverTime.length > 0 ? (
            <div className="bg-white/10 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                📈 Produktivitas per Menit
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={questionsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis
                    dataKey="menit"
                    stroke="#999"
                    label={{
                      value: "Menit ke-",
                      position: "insideBottom",
                      offset: -5,
                      fill: "#999",
                    }}
                  />
                  <YAxis
                    stroke="#999"
                    label={{
                      value: "Jumlah Soal yang Dijawab",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#999",
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #4b5563",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="jumlahSoal"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", r: 3 }}
                    name="Jumlah Soal Dijawab"
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-sm text-gray-400 mt-4 text-center">
                Total waktu test: {Math.ceil((result.totalTime || result.total_time) / 60)} menit
              </p>
            </div>
          ) : (
            <div className="bg-white/10 rounded-lg p-6 text-center text-gray-400">
                Data grafik produktivitas tidak tersedia.
            </div>
          )}

          {/* Detail Jawaban */}
          <div className="bg-white/10 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">
              📝 Detail Jawaban (Menampilkan 50 pertama)
            </h3>
            <div className="max-h-96 overflow-y-auto">
              {result.answers && result.answers.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-gray-800 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-300">No</th>
                      <th className="px-4 py-2 text-left text-gray-300">
                        Soal
                      </th>
                      <th className="px-4 py-2 text-center text-gray-300">
                        Jawaban
                      </th>
                      <th className="px-4 py-2 text-center text-gray-300">
                        Benar
                      </th>
                      <th className="px-4 py-2 text-center text-gray-300">
                        Waktu
                      </th>
                      <th className="px-4 py-2 text-center text-gray-300">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.answers.slice(0, 50).map((ans, idx) => (
                      <tr key={idx} className="border-b border-gray-700">
                        <td className="px-4 py-2 text-gray-300">{idx + 1}</td>
                        <td className="px-4 py-2 text-gray-300">
                          {ans.question}
                        </td>
                        <td className="px-4 py-2 text-center text-gray-300">
                          {ans.userAnswer}
                        </td>
                        <td className="px-4 py-2 text-center text-gray-300">
                          {ans.correctAnswer}
                        </td>
                        <td className="px-4 py-2 text-center text-gray-400">
                          {Math.round((ans.timeSpent || 0) / 1000)}s
                        </td>
                        <td className="px-4 py-2 text-center">
                          {ans.isCorrect ? (
                            <span className="text-green-400 font-bold">✓</span>
                          ) : (
                            <span className="text-red-400 font-bold">✗</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
               ) : (
                <p className="text-center text-gray-400 py-4">
                    Tidak ada data detail jawaban yang tersimpan.
                </p>
               )}
              {result.answers && result.answers.length > 50 && (
                <p className="text-center text-gray-400 text-xs mt-4">
                  ... dan {result.answers.length - 50} jawaban lainnya tidak
                  ditampilkan.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- KOMPONEN ADMIN DASHBOARD ANDA ---

export default function AdminDashboard() {
  const [results, setResults] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, today, week, month
  const [searchEmail, setSearchEmail] = useState("");
  const [durationSeconds, setDurationSeconds] = useState(15 * 60);
  const [questionCount, setQuestionCount] = useState(525);
  const [maxIncorrectAnswers, setMaxIncorrectAnswers] = useState(7);
  const [minQuestionsPerMinute, setMinQuestionsPerMinute] = useState(35);
  const [pairs, setPairs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [questionsHistory, setQuestionsHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    if (!confirm("Apakah Anda yakin ingin logout?")) return;

    await logout();
    navigate("/login", { replace: true });
  };
  
  // --- STATE BARU UNTUK MODAL ---
  const [selectedResult, setSelectedResult] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch all results
  const fetchResults = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${config.apiUrl}/test-results`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (response.ok) {
        setResults(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/statistics`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (response.ok) {
        setStatistics(data.data);
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  // Fetch questions history
  const fetchQuestionsHistory = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/questions`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (response.ok) {
        setQuestionsHistory(data.data);
      }
    } catch (error){
      console.error("Error fetching questions history:", error);
    }
  };

  useEffect(() => {
    fetchResults();
    fetchStatistics();
    fetchQuestionsHistory();
    // load current config
    (async () => {
      try {
        const r = await fetch(`${config.apiUrl}/config`, {
           credentials: 'include',
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

  // Filter results by date
  const getFilteredResults = () => {
    if (!results || results.length === 0) return [];

    let filtered = results;

    // Filter by time period
    if (filter !== "all") {
      const now = new Date();
      filtered = results.filter((result) => {
        const resultDate = new Date(result.created_at);
        const diffTime = Math.abs(now - resultDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (filter === "today") return diffDays <= 1;
        if (filter === "week") return diffDays <= 7;
        if (filter === "month") return diffDays <= 30;
        return true;
      });
    }

    // Filter by email search
    if (searchEmail) {
      filtered = filtered.filter(
        (result) =>
          (result.participantEmail && result.participantEmail.toLowerCase().includes(searchEmail.toLowerCase())) ||
          (result.participantName && result.participantName.toLowerCase().includes(searchEmail.toLowerCase()))
      );
    }

    return filtered;
  };

  const filteredResults = getFilteredResults();

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };


  // Get score color
  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const handleRegenerate = async () => {
    setSaving(true);
    try {
      const r = await fetch(`${config.apiUrl}/config`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          regenerate: true,
          durationSeconds,
          questionCount,
          maxIncorrectAnswers,
          minQuestionsPerMinute,
        }),
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await fetch(`${config.apiUrl}/config`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ durationSeconds, questionCount, maxIncorrectAnswers, minQuestionsPerMinute, pairs }),
      });
      const data = await r.json();
      if (r.ok && data.data) {
        setPairs(data.data.pairs);
        setQuestionCount(data.data.questionCount);
        setDurationSeconds(data.data.durationSeconds);
        setMaxIncorrectAnswers(data.data.maxIncorrectAnswers);
        setMinQuestionsPerMinute(data.data.minQuestionsPerMinute);
        // Refresh questions history
        fetchQuestionsHistory();
        alert("Konfigurasi berhasil disimpan ke database!");
      } else {
        const errorMsg = data.error || data.message || "Unknown error";
        alert("Gagal menyimpan konfigurasi: " + errorMsg);
        console.error("Save config error:", data);
      }
    } catch (e) {
      console.error("Failed to save config", e);
      alert("Gagal menyimpan konfigurasi");
    } finally {
      setSaving(false);
    }
  };

  // Handle delete test result
  const handleDelete = async (id) => {
    if (!confirm("Apakah Anda yakin ingin menghapus hasil test ini?")) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`${config.apiUrl}/test-results/${id}`, {
        method: "DELETE",
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Refresh results
        fetchResults();
        fetchStatistics();
        alert("Hasil test berhasil dihapus!");
      } else {
        alert("Gagal menghapus hasil test: " + (data.error || data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error deleting test result:", error);
      alert("Gagal menghapus hasil test");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => (window.location.href = "/")}
            className="text-(--text1) w-45 border border-(--border1) p-2 text-xs bg-gray-100/10 rounded-md hover:bg-(--hover1)/30 font-medium"
          >
            ← Kembali ke Menu Utama
          </button>
          <button
            onClick={() => (window.location.href = "/test")}
            className="text-(--text2) w-35 border border-(--border2) p-2 text-xs bg-gray-100/10 rounded-md hover:bg-(--hover2)/30 font-medium"
          >
            Coba Test →
          </button>
        </div>
        <div className="bg-white/10 rounded-lg shadow-md p-6 mb-6">
          <div className="md:flex md:items-center md:justify-between grid grid-cols-1 gap-4">
            <div className="flex flex-col justify-center items-center">
              <h1 className="md:text-3xl text-2xl font-bold text-(--text1) flex items-center gap-2">
                <BarChart className="w-8 h-8 text-(--aksen1)" />
                Admin Dashboard
              </h1>
              <p className="text-gray-200 md:pl-6 mt-1 md:text-(--text2) text-xs">
                Monitor dan kelola hasil test penjumlahan
              </p>
            </div>
            <div className="flex gap-2 flex-row justify-center items-center">
              <button
                onClick={() => {
                  fetchResults();
                  fetchStatistics();
                }}
                className="bg-(--button1) hover:bg-(--hover1)/50 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              {/* <button
                onClick={() => {
                  fetch(`${config.apiUrl}/logout`, {
                    method: "POST",
                    credentials: "include",
                  })
                    .then(() => {
                      window.location.href = "/login";
                    })
                    .catch(() => {
                      window.location.href = "/login";
                    });
                }}
                className="bg-(--button2) hover:bg-(--hover2)/50 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
              >
                Logout
              </button> */}
            {/* ✅ LOGOUT BUTTON INLINE */}
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
            >
              Logout
            </button>
            </div>
          </div>
        </div>

        {/* Config Section */}
        <div className="bg-white/10 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-(--text1) mb-4">
            Pengaturan Tes
          </h2>
          <div className="bg-green-100 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Konfigurasi Aktif:</strong> {questionCount} soal dalam{" "}
              {Math.floor(durationSeconds / 60)} menit
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm text-(--text1) mb-1">
                Durasi (menit)
              </label>
              <input
                type="number"
                value={Math.floor(durationSeconds / 60)}
                onChange={(e) => {
                  const minutes = parseInt(e.target.value || "0", 10);
                  setDurationSeconds(minutes * 60);
                }}
                className="w-full px-3 py-2 border border-(--border1) rounded-lg bg-white/10"
                min={1}
              />
              <p className="text-xs text-gray-400 mt-1">Durasi Pengerjaan</p>
            </div>
            <div>
              <label className="block text-sm text-(--text1) mb-1">
                Jumlah Soal
              </label>
              <input
                type="number"
                value={questionCount}
                onChange={(e) =>
                  setQuestionCount(parseInt(e.target.value || "0", 10))
                }
                className="w-full px-3 py-2 border border-(--border1) rounded-lg bg-white/10"
                min={1}
              />
              <p className="text-xs text-gray-400 mt-1">
                Jumlah soal keseluruhan
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-(--text1) mb-1">
                Maksimal Jawaban Salah
              </label>
              <input
                type="number"
                value={maxIncorrectAnswers}
                onChange={(e) => setMaxIncorrectAnswers(Number(e.target.value))}
                className="w-full px-4 py-2 border border-(--border1) rounded-lg focus:outline-none focus:border-(--aksen1) bg-white/10 text-white"
                min="0"
              />
              <p className="text-xs text-gray-400 mt-1">
                Batas toleransi kesalahan
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-(--text1) mb-1">
                Min. Soal Benar/Menit
              </label>
              <input
                type="number"
                value={minQuestionsPerMinute}
                onChange={(e) =>
                  setMinQuestionsPerMinute(Number(e.target.value))
                }
                className="w-full px-4 py-2 border border-(--border1) rounded-lg focus:outline-none focus:border-(--aksen1) bg-white/10 text-white"
                min="1"
              />
              <p className="text-xs text-gray-400 mt-1">
                Target kecepatan pengerjaan
              </p>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleRegenerate}
                className="bg-yellow-200 hover:bg-yellow-300 text-gray-800 px-4 py-2 rounded-lg w-25 h-15"
                disabled={saving}
              >
                {saving ? "Menggenerate..." : "Generate Soal"}
              </button>
              <button
                onClick={handleSave}
                className="bg-green-400 hover:bg-green-500 text-gray-800 px-4 py-2 rounded-lg w-25 h-15"
                disabled={saving}
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
              <button
                onClick={() => window.open("/test", "_blank")}
                className="bg-indigo-400 hover:bg-indigo-500 text-gray-800 px-4 py-2 rounded-lg w-25 h-15"
              >
                Preview Test
              </button>
            </div>
            <div className="text-sm text-green-600">
              Soal tersedia: {pairs.length}
              <br />
              <span className="text-xs text-yellow-500">Angka 3-9 saja</span>
              <br />
              <span className="text-xs text-indigo-400">
                Jumlah soal aktif: {questionCount}
              </span>
            </div>
          </div>
        </div>

        {/* Questions History Section */}
        <div className="bg-white/10 rounded-lg shadow-md p-6 mb-6">
          <div className="md:flex md:items-center md:justify-between grid grid-cols-1 gap-4 mb-4">
            <h2 className="text-xl font-bold text-(--text1)">
              Riwayat Konfigurasi Soal
            </h2>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="bg-indigo-300 hover:bg-indigo-400 text-gray-800 px-4 py-2 rounded-lg"
            >
              {showHistory ? "Sembunyikan" : "Tampilkan"} Riwayat
            </button>
          </div>

          {showHistory && (
            <div className="space-y-4">
              {questionsHistory.length === 0 ? (
                <p className="text-(--text2) text-center py-4">
                  Belum ada riwayat konfigurasi
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-green-100/10 ">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-(--text1) uppercase">
                          ID
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-(--text1) uppercase">
                          Jumlah Soal
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-(--text1) uppercase">
                          Durasi (menit)
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-(--text1) uppercase">
                          Tanggal Dibuat
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-green-300">
                      {questionsHistory.map((item, index) => (
                        <tr
                          key={item.id}
                          className={index === 0 ? "bg-indigo-400" : ""}
                        >
                          <td className="px-4 py-2 text-sm text-(--text1)">
                            {item.id}
                          </td>
                          <td className="px-4 py-2 text-sm text-red-400">
                            {item.totalQuestions}
                          </td>
                          <td className="px-4 py-2 text-sm text-yellow-400">
                            {Math.floor(item.durationSeconds / 60)}
                          </td>
                          <td className="px-4 py-2 text-sm text-green-400">
                            {new Date(item.createdAt).toLocaleString("id-ID")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {questionsHistory.length > 0 && (
                <div className="text-xs text-green-700 mt-2">
                  * Baris ungu = konfigurasi aktif saat ini
                </div>
              )}
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white/10 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-blue-600" />
                <span className="text-sm text-(--text1)">Total</span>
              </div>
              <div className="text-3xl font-bold text-(--aksen1)">
                {statistics.totalTests}
              </div>
              <div className="text-sm text-(--text1)">Tests Completed</div>
            </div>

            <div className="bg-white/10 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <span className="text-sm text-(--text1)">Rata-rata</span>
              </div>
              <div className="text-3xl font-bold text-(--aksen1)">
                {statistics.averageScore}%
              </div>
              <div className="text-sm text-(--text1)">Average Score</div>
            </div>

            <div className="bg-white/10 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 text-purple-600" />
                <span className="text-sm text-(--text1)">Rata-rata</span>
              </div>
              <div className="text-2xl font-bold text-(--aksen1)">
                {formatTimeMinutesSeconds(statistics.averageTime)}
              </div>
              <div className="text-sm text-(--text1)">Average Time</div>
            </div>

            <div className="bg-white/10 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <BarChart className="w-8 h-8 text-orange-600" />
                <span className="text-sm text-(--text1)">Tertinggi</span>
              </div>
              <div className="text-3xl font-bold text-(--aksen1)">
                {statistics.highestScore}%
              </div>
              <div className="text-sm text-(--text1)">Highest Score</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white/10 rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Cari berdasarkan nama atau email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-2 md:text-base text-xs">
              {["all", "today", "week", "month"].map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === filterOption
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {filterOption === "all"
                    ? "Semua"
                    : filterOption === "today"
                    ? "Hari Ini"
                    : filterOption === "week"
                    ? "Minggu Ini"
                    : "Bulan Ini"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hasil Test / Results Table */}
        <div className="bg-white/10 rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-(--text1)">
              Hasil Test ({filteredResults.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="p-8 text-center text-white">
              Tidak ada data test yang ditemukan
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-(--aksen1) uppercase tracking-wider">
                      Peserta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-(--aksen1) uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-(--aksen1) uppercase tracking-wider">
                      Pendidikan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-(--aksen1) uppercase tracking-wider">
                      NO HP
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-(--aksen1) uppercase tracking-wider">
                      Skor
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-(--aksen1) uppercase tracking-wider">
                      Benar/Total
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-(--aksen1) uppercase tracking-wider">
                      Waktu
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-(--aksen1) uppercase tracking-wider">
                      Kelulusan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-(--aksen1) uppercase tracking-wider">
                      Tanggal
                    </th>
                    {/* KOLOM AKSI BARU */}
                    <th className="px-6 py-3 text-center text-xs font-medium text-(--aksen1) uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/10 divide-y divide-green-300">
                  {filteredResults.map((result) => {
                    // Hitung status kelulusan jika di DB null/false (untuk support data lama)
                    // Prioritaskan result.isPassed dari DB jika ada (dan true), jika false kita double check
                    // Sebenarnya jika DB bilang false, harusnya false. Tapi karena data lama defaultnya false (padahal mungkin lulus), kita cek ulang.
                    // Logika aman: Jika DB true -> true. Jika DB false/null -> hitung manual.
                    const stats = calculateTestStats(
                      result.answers,
                      result.totalTime || result.total_time,
                      maxIncorrectAnswers,
                      minQuestionsPerMinute
                    );
                    const isPassed = result.isPassed || stats.isPassed;

                    return (
                      <tr key={result.id} className="hover:bg-gray-50/10">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-yellow-500">
                            {result.participantName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-blue-400">
                            {result.participantEmail}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-blue-400">
                            {result.participantPendidikan}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-blue-400">
                            {result.participantNoHp}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getScoreColor(
                              result.score
                            )}`}
                          >
                            {result.score}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm text-red-500">
                            {result.correctAnswers}/{result.totalQuestions}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm text-indigo-400">
                            {formatTimeMinutesSeconds(
                              result.totalTime || result.total_time
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                              isPassed
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {isPassed ? "LULUS" : "TIDAK LULUS"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-green-600">
                            {formatDate(result.createdAt)}
                          </div>
                        </td>
                        {/* TOMBOL AKSI BARU */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => setSelectedResult(result)}
                              className="text-indigo-400 hover:text-indigo-200 transition"
                              title="Lihat Detail"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(result.id)}
                              disabled={deletingId === result.id}
                              className="text-red-400 hover:text-red-200 transition disabled:opacity-50"
                              title="Hapus"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Data diambil dari Supabase Database • Auto-refresh setiap klik tombol
          Refresh
        </div>
      </div>

      {/* --- MEMANGGIL KOMPONEN MODAL --- */}
      {/* Ini akan me-render modal jika selectedResult tidak null */}
      <ResultDetailModal
        result={selectedResult}
        onClose={() => setSelectedResult(null)}
        maxIncorrectAnswers={maxIncorrectAnswers}
        minQuestionsPerMinute={minQuestionsPerMinute}
      />
    </div>
  );
}
