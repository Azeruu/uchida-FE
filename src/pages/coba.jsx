import React, { useState, useEffect } from 'react';
import { X, LogOut, Search, Eye } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const API_URL = 'https://uchida-be.onrender.com/api';

// Modal Component untuk Detail Hasil Test
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
      waktu: Math.round((ans.timeSpent || 0) / 1000) // Convert ms to seconds
    }));

    // Grafik 2: Produktivitas per menit
    const questionsOverTime = [];
    const sortedAnswers = [...result.answers].sort((a, b) => 
      (a.timeSpent || 0) - (b.timeSpent || 0)
    );
    
    if (sortedAnswers.length > 0) {
      const questionsByMinute = {};
      let cumulativeTime = 0;
      
      sortedAnswers.forEach((ans) => {
        cumulativeTime += ans.timeSpent || 0;
        const minute = Math.floor(cumulativeTime / 60000) + 1;
        questionsByMinute[minute] = (questionsByMinute[minute] || 0) + 1;
      });
      
      Object.keys(questionsByMinute).forEach(min => {
        questionsOverTime.push({
          menit: parseInt(min),
          jumlahSoal: questionsByMinute[min]
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
        <div className="sticky top-0 bg-gray-800 p-6 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Detail Hasil Test - {result.participant_name}
            </h2>
            <p className="text-gray-400 text-sm mt-1">{result.participant_email}</p>
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
              <p className="text-2xl font-bold text-green-400">{result.score}%</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Benar/Total</p>
              <p className="text-2xl font-bold text-blue-400">
                {result.correct_answers}/{result.total_questions}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Total Waktu</p>
              <p className="text-2xl font-bold text-yellow-400">{result.total_time}s</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-gray-400 text-sm">Rata-rata/Soal</p>
              <p className="text-2xl font-bold text-purple-400">
                {(result.total_time / result.total_questions).toFixed(2)}s
              </p>
            </div>
          </div>

          {/* Grafik 1: Waktu per Soal */}
          {timePerQuestion.length > 0 && (
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
                    label={{ value: 'Nomor Soal', position: 'insideBottom', offset: -5, fill: '#999' }}
                  />
                  <YAxis 
                    stroke="#999"
                    label={{ value: 'Waktu (detik)', angle: -90, position: 'insideLeft', fill: '#999' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="waktu" 
                    stroke="#4f46e5" 
                    strokeWidth={2}
                    dot={{ fill: '#4f46e5', r: 3 }}
                    name="Waktu (detik)"
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-sm text-gray-400 mt-4 text-center">
                Rata-rata waktu: {(result.total_time / result.total_questions).toFixed(2)} detik/soal
              </p>
            </div>
          )}

          {/* Grafik 2: Produktivitas per Menit */}
          {questionsOverTime.length > 0 && (
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
                    label={{ value: 'Menit ke-', position: 'insideBottom', offset: -5, fill: '#999' }}
                  />
                  <YAxis 
                    stroke="#999"
                    label={{ value: 'Jumlah Soal', angle: -90, position: 'insideLeft', fill: '#999' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="jumlahSoal" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 3 }}
                    name="Jumlah Soal Dijawab"
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-sm text-gray-400 mt-4 text-center">
                Total waktu test: {Math.ceil(result.total_time / 60)} menit
              </p>
            </div>
          )}

          {/* Detail Jawaban */}
          <div className="bg-white/10 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">
              📝 Detail Jawaban (Showing first 50)
            </h3>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-gray-300">No</th>
                    <th className="px-4 py-2 text-left text-gray-300">Soal</th>
                    <th className="px-4 py-2 text-center text-gray-300">Jawaban</th>
                    <th className="px-4 py-2 text-center text-gray-300">Benar</th>
                    <th className="px-4 py-2 text-center text-gray-300">Waktu</th>
                    <th className="px-4 py-2 text-center text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.answers && result.answers.slice(0, 50).map((ans, idx) => (
                    <tr key={idx} className="border-b border-gray-700">
                      <td className="px-4 py-2 text-gray-300">{idx + 1}</td>
                      <td className="px-4 py-2 text-gray-300">{ans.question}</td>
                      <td className="px-4 py-2 text-center text-gray-300">{ans.userAnswer}</td>
                      <td className="px-4 py-2 text-center text-gray-300">{ans.correctAnswer}</td>
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
              {result.answers && result.answers.length > 50 && (
                <p className="text-center text-gray-400 text-xs mt-4">
                  ... dan {result.answers.length - 50} jawaban lainnya
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Admin Dashboard Component
export default function AdminDashboard() {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResult, setSelectedResult] = useState(null);

  useEffect(() => {
    fetchTestResults();
  }, []);

  const fetchTestResults = async () => {
    try {
      const response = await fetch(`${API_URL}/test-results`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setTestResults(data.data || []);
      } else {
        toast.error('Gagal mengambil data');
      }
    } catch (error) {
      console.error('Error fetching test results:', error);
      toast.error('Terjadi kesalahan saat mengambil data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      toast.success('Logout berhasil');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Gagal logout');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 75) return 'bg-blue-100 text-blue-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const filteredResults = testResults.filter(result =>
    result.participant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.participant_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-gray-400 text-sm mt-1">Kelola hasil test Uchida</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.href = '/'}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
              >
                Home
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white/10 rounded-lg shadow-lg p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari nama atau email peserta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/20 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white/10 rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-xl font-bold text-indigo-400">
              Hasil Test ({filteredResults.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading...</p>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-300 uppercase">
                      Peserta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-300 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-green-300 uppercase">
                      Skor
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-green-300 uppercase">
                      Benar/Total
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-green-300 uppercase">
                      Waktu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-green-300 uppercase">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-green-300 uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/10 divide-y divide-green-300/20">
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
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => setSelectedResult(result)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition flex items-center gap-2 mx-auto"
                        >
                          <Eye className="w-4 h-4" />
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Detail */}
      {selectedResult && (
        <ResultDetailModal 
          result={selectedResult} 
          onClose={() => setSelectedResult(null)} 
        />
      )}
    </div>
  );
}