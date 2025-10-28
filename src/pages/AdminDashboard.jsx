import { useState, useEffect } from "react";
import {
  BarChart,
  Users,
  TrendingUp,
  Clock,
  RefreshCw,
  X, // Ditambahkan untuk Modal
  Eye, // Ditambahkan untuk tombol Aksi
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

/**
 * Modal Component untuk Detail Hasil Test
 */
const ResultDetailModal = ({ result, onClose }) => {
  if (!result) return null;

  // Kalkulasi data grafik dari answers
  const calculateGraphData = () => {
    if (!result.answers || !Array.isArray(result.answers)) {
      return { timePerQuestion: [], questionsOverTime: [] };
    }

    // Grafik 1: Waktu per soal
    const timePerQuestion = result.answers.map((ans, idx) => ({
      soal: idx + 1,
      waktu: Math.round((ans.timeSpent || 0) / 1000), // Convert ms to seconds
    }));

    // Grafik 2: Produktivitas per menit
    const questionsOverTime = [];
    // Membuat salinan array sebelum di-sort
    const sortedAnswers = [...result.answers].sort(
      (a, b) => (a.timeSpent || 0) - (b.timeSpent || 0)
    );

    if (sortedAnswers.length > 0) {
      const questionsByMinute = {};
      let cumulativeTime = 0;

      sortedAnswers.forEach((ans) => {
        cumulativeTime += ans.timeSpent || 0;
        const minute = Math.floor(cumulativeTime / 60000) + 1;
        questionsByMinute[minute] = (questionsByMinute[minute] || 0) + 1;
      });

      Object.keys(questionsByMinute).forEach((min) => {
        questionsOverTime.push({
          menit: parseInt(min),
          jumlahSoal: questionsByMinute[min],
        });
      });
    }

    return { timePerQuestion, questionsOverTime };
  };

  const { timePerQuestion, questionsOverTime } = calculateGraphData();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 p-6 border-b border-gray-700 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Detail Hasil Test - {result.participant_name}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {result.participant_email}
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
                {result.correct_answers}/{result.total_questions}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Total Waktu</p>
              <p className="text-2xl font-bold text-yellow-400">
                {result.total_time}s
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Rata-rata/Soal</p>
              <p className="text-2xl font-bold text-purple-400">
                {(result.total_time / result.total_questions).toFixed(2)}s
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
                {(result.total_time / result.total_questions).toFixed(2)}{" "}
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
                      value: "Jumlah Soal",
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
                Total waktu test: {Math.ceil(result.total_time / 60)} menit
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
  const [pairs, setPairs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [questionsHistory, setQuestionsHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // --- STATE BARU UNTUK MODAL ---
  const [selectedResult, setSelectedResult] = useState(null);

  // Fetch all results
  const fetchResults = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${config.apiUrl}/test-results`, {
  credentials: 'include'
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
  credentials: 'include'
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
        credentials: "include",
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
        const r = await fetch(`${config.apiUrl}/config`);
        const d = await r.json();
        if (r.ok && d.data) {
          setDurationSeconds(d.data.durationSeconds || 15 * 60);
          setQuestionCount(d.data.questionCount || 525);
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
          result.participant_email
            .toLowerCase()
            .includes(searchEmail.toLowerCase()) ||
          result.participant_name
            .toLowerCase()
            .includes(searchEmail.toLowerCase())
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
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regenerate: true,
          durationSeconds,
          questionCount,
        }),
      });
      const d = await r.json();
      if (r.ok && d.data) {
        setPairs(d.data.pairs);
        setDurationSeconds(d.data.durationSeconds);
        setQuestionCount(d.data.questionCount);
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
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ durationSeconds, questionCount, pairs }),
      });
      const data = await r.json();
      if (r.ok && data.data) {
        setPairs(data.data.pairs);
        setQuestionCount(data.data.questionCount);
        setDurationSeconds(data.data.durationSeconds);
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => (window.location.href = "/")}
            className="text-green-200 w-45 border border-green-600 p-2 text-xs bg-gray-100/10 rounded-md hover:bg-indigo-400 font-medium"
          >
            ← Kembali ke Menu Utama
          </button>
          <button
            onClick={() => (window.location.href = "/test")}
            className="text-indigo-200 w-35 border border-indigo-600 p-2 text-xs bg-gray-100/10 rounded-md hover:bg-green-200 hover:text-gray-700 font-medium"
          >
            Coba Test →
          </button>
        </div>
        <div className="bg-white/10 rounded-lg shadow-md p-6 mb-6">
          <div className="md:flex md:items-center md:justify-between grid grid-cols-1 gap-4 ">
            <div>
              <h1 className="md:text-3xl text-2xl font-bold text-indigo-400 flex items-center gap-2">
                <BarChart className="w-8 h-8 text-green-400" />
                Admin Dashboard
              </h1>
              <p className="text-gray-200 mt-1 md:text-base text-xs">
                Monitor dan kelola hasil test penjumlahan
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  fetchResults();
                  fetchStatistics();
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => {
                  // Clear session cookie by calling logout endpoint
                  fetch(`${config.apiUrl}/logout`, {
                    method: "POST",
                    credentials: "include",
                  })
                    .then(() => {
                      window.location.href = "/";
                    })
                    .catch((e) => {
                      console.error("Logout failed", e);
                      window.location.href = "/login";
                    });
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Config Section */}
        <div className="bg-white/10 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-green-300 mb-4">
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
              <label className="block text-sm text-green-300 mb-1">
                Durasi (detik)
              </label>
              <input
                type="number"
                value={durationSeconds}
                onChange={(e) =>
                  setDurationSeconds(parseInt(e.target.value || "0", 10))
                }
                className="w-full px-3 py-2 border border-green-300 rounded-lg"
                min={60}
              />
            </div>
            <div>
              <label className="block text-sm text-green-300 mb-1">
                Jumlah Soal
              </label>
              <input
                type="number"
                value={questionCount}
                onChange={(e) =>
                  setQuestionCount(parseInt(e.target.value || "0", 10))
                }
                className="w-full px-3 py-2 border border-green-300 rounded-lg"
                min={1}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRegenerate}
                className="bg-yellow-200 hover:bg-yellow-300 text-gray-800 px-4 py-2 rounded-lg"
                disabled={saving}
              >
                {saving ? "Menggenerate..." : "Generate Soal"}
              </button>
              <button
                onClick={handleSave}
                className="bg-green-400 hover:bg-green-500 text-gray-800 px-4 py-2 rounded-lg"
                disabled={saving}
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
              <button
                onClick={() => window.open("/test", "_blank")}
                className="bg-indigo-400 hover:bg-indigo-500 text-gray-800 px-4 py-2 rounded-lg"
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
            <h2 className="text-xl font-bold text-green-300">
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
                <p className="text-green-300 text-center py-4">
                  Belum ada riwayat konfigurasi
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-green-100/10 ">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-green-300 uppercase">
                          ID
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-green-300 uppercase">
                          Jumlah Soal
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-green-300 uppercase">
                          Durasi (menit)
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-green-300 uppercase">
                          Tanggal Dibuat
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-green-300">
                      {questionsHistory.map((item, index) => (
                        <tr
                          key={item.id}
                          className={index === 0 ? "bg-indigo-600" : ""}
                        >
                          <td className="px-4 py-2 text-sm text-green-300">
                            {item.id}
                          </td>
                          <td className="px-4 py-2 text-sm text-red-400">
                            {item.total_questions}
                          </td>
                          <td className="px-4 py-2 text-sm text-yellow-400">
                            {Math.floor(item.duration_seconds / 60)}
                          </td>
                          <td className="px-4 py-2 text-sm text-green-300">
                            {new Date(item.created_at).toLocaleString("id-ID")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {questionsHistory.length > 0 && (
                <div className="text-xs text-green-300 mt-2">
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
                <span className="text-sm text-green-300">Total</span>
              </div>
              <div className="text-3xl font-bold text-indigo-300">
                {statistics.totalTests}
              </div>
              <div className="text-sm text-indigo-400">Tests Completed</div>
            </div>

            <div className="bg-white/10 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <span className="text-sm text-green-300">Rata-rata</span>
              </div>
              <div className="text-3xl font-bold text-indigo-300">
                {statistics.averageScore}%
              </div>
              <div className="text-sm text-indigo-400">Average Score</div>
            </div>

            <div className="bg-white/10 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 text-purple-600" />
                <span className="text-sm text-green-300">Rata-rata</span>
              </div>
              <div className="text-3xl font-bold text-indigo-300">
                {statistics.averageTime}s
              </div>
              <div className="text-sm text-indigo-400">Average Time</div>
            </div>

            <div className="bg-white/10 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <BarChart className="w-8 h-8 text-orange-600" />
                <span className="text-sm text-green-300">Tertinggi</span>
              </div>
              <div className="text-3xl font-bold text-indigo-300">
                {statistics.highestScore}%
              </div>
              <div className="text-sm text-indigo-400">Highest Score</div>
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

        {/* Results Table */}
        <div className="bg-white/10 rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-indigo-400">
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
                <thead className="bg-white/10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-300 uppercase tracking-wider">
                      Peserta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-green-300 uppercase tracking-wider">
                      Skor
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-green-300 uppercase tracking-wider">
                      Benar/Total
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-green-300 uppercase tracking-wider">
                      Waktu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-300 uppercase tracking-wider">
                      Tanggal
                    </th>
                    {/* KOLOM AKSI BARU */}
                    <th className="px-6 py-3 text-center text-xs font-medium text-green-300 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/10 divide-y divide-green-300">
                  {filteredResults.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50/10">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-yellow-400">
                          {result.participant_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-blue-400">
                          {result.participant_email}
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
                        <div className="text-sm text-red-300">
                          {result.correct_answers}/{result.total_questions}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-indigo-300">
                          {result.total_time}s
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-green-200">
                          {formatDate(result.created_at)}
                        </div>
                      </td>
                      {/* TOMBOL AKSI BARU */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => setSelectedResult(result)}
                          className="text-indigo-400 hover:text-indigo-200"
                          title="Lihat Detail"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
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
      />
    </div>
  );
}