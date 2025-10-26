import{ useState, useEffect } from "react";
import {
  BarChart,
  Users,
  TrendingUp,
  Clock,
  RefreshCw,
} from "lucide-react";
import config from "../config";


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

  // Fetch all results
  const fetchResults = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${config.apiUrl}/test-results`);
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
      const response = await fetch(`${config.apiUrl}/statistics`);
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
    } catch (error) {
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-indigo-400 flex items-center gap-2">
                <BarChart className="w-8 h-8 text-green-400" />
                Admin Dashboard
              </h1>
              <p className="text-gray-200 mt-1">
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
          <div className="flex items-center justify-between mb-4">
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
            <div className="flex gap-2">
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
    </div>
  );
}
