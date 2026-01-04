import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  Calculator,
  CheckCircle,
  Play,
  User,
  Mail,
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
import { toast } from "sonner";
import config from "../config";

const TEST_DURATION = 15 * 60; // 15 menit dalam detik

export default function TestPage() {
  const [stage, setStage] = useState("register");
  const [participantName, setParticipantName] = useState("");
  const [participantEmail, setParticipantEmail] = useState("");
  const [participantPendidikan, setParticipantPendidikan] = useState("");
  const [participantNoHp, setParticipantNoHp] = useState("");
  const [stream, setStream] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState({ num1: 0, num2: 0 });
  const [userAnswer, setUserAnswer] = useState("");
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(525);
  const [minBenar, setMinBenar] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION);
  const [pairs, setPairs] = useState([]);
  
  // ✅ STATE BARU UNTUK GRAFIK
  const [timePerQuestion, setTimePerQuestion] = useState([]);
  const [questionsOverTime, setQuestionsOverTime] = useState([]);

  const videoRef = useRef(null);

  // Load config from backend
  const loadConfig = async () => {
    try {
      const res = await fetch(`${config.apiUrl}/config`);
      const data = await res.json();
      if (res.ok && data.data) {
        const cfg = data.data;
        setTimeLeft(cfg.durationSeconds || 15 * 60);
        const sanitizedPairs = Array.isArray(cfg.pairs) ? cfg.pairs : [];
        setPairs(sanitizedPairs);
        setTotalQuestions(cfg.questionCount || 525);
        console.log("Loaded config:", {
          questionCount: cfg.questionCount,
          durationSeconds: cfg.durationSeconds,
          pairsLength: sanitizedPairs.length,
        });
      }
    } catch (e) {
      console.error("Failed to load config", e);
      setTimeLeft(15 * 60);
      setTotalQuestions(525);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // Format time MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };
  
  // Generate next question from configured pairs
  const generateQuestion = useCallback(() => {
    if (
      pairs &&
      pairs.length > 0 &&
      questionNumber >= 0 &&
      questionNumber < totalQuestions &&
      questionNumber < pairs.length
    ) {
      const { a, b } = pairs[questionNumber];
      setCurrentQuestion({ num1: a, num2: b });
    } else {
      const num1 = Math.floor(Math.random() * 7) + 3;
      const num2 = Math.floor(Math.random() * 7) + 3;
      setCurrentQuestion({ num1, num2 });
    }
    setQuestionStartTime(Date.now());
  }, [pairs, questionNumber, totalQuestions]);

  useEffect(() => {
    setMinBenar(Math.floor(totalQuestions*0.8));
  }, [totalQuestions]);

  // Handle registration
  const handleRegister = () => {
    if (!participantName.trim()) {
      toast.error("Nama Harus Di Isi");
      return;
    }
    if (!participantEmail.trim()) {
      toast.error("Email Harus Di Isi");
      return;
    }
    if (!participantPendidikan.trim()) {
      toast.error("Mohun Masukkan Pendidikan Terakhir");
      return;
    }
    if (!participantNoHp.trim()) {
      toast.error("Mohon isi Kolom Nomor Handphone ");
      return;
    }
    if (!participantEmail.includes("@")) {
      toast.error("Format email tidak valid");
      return;
    }
    setStage("ready");
  };

  // Handle camera permission
  const handleStartCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStage("camera");
    } catch (error) {
      alert("Gagal mengakses kamera. Pastikan Anda memberikan izin kamera.");
      console.error("Camera error:", error);
    }
  };

  // Start test
  const handleStartTest = () => {
    setStage("testing");
    setStartTime(Date.now());
    setQuestionNumber(1);
    generateQuestion();
  };

  // Handle number input
  const handleNumberClick = (num) => {
    const next = num.toString().slice(-1);
    setUserAnswer(next);
    setTimeout(() => {
      handleSubmitAnswer(next);
    }, 0);
  };

  // ✅ FUNGSI UNTUK MENGHITUNG PRODUKTIVITAS PER MENIT
  const calculateQuestionsOverTime = (finalAnswers) => {
    const result = [];
    let currentMinute = 0;
    let questionsInMinute = 0;
    
    finalAnswers.forEach((answer, index) => {
      const totalTimeForQuestion = finalAnswers
        .slice(0, index + 1)
        .reduce((sum, a) => sum + a.timeSpent, 0);
      const minute = Math.floor(totalTimeForQuestion / 60000); // convert ms to minutes
      
      if (minute === currentMinute) {
        questionsInMinute++;
      } else {
        if (questionsInMinute > 0) {
          result.push({
            menit: currentMinute + 1,
            jumlahSoal: questionsInMinute
          });
        }
        currentMinute = minute;
        questionsInMinute = 1;
      }
    });
    
    // Add last minute
    if (questionsInMinute > 0) {
      result.push({
        menit: currentMinute + 1,
        jumlahSoal: questionsInMinute
      });
    }
    
    return result;
  };

  // ✅ FINISH TEST - DENGAN GRAFIK DATA
  const finishTest = useCallback(
    async (finalAnswers) => {
      const totalTime = Date.now() - startTime;
      const correctCount = finalAnswers.filter((a) => a.isCorrect).length;
      const score = (correctCount / totalQuestions) * 100;
      const isPassed = correctCount >= 525;

      // ✅ Hitung data untuk grafik produktivitas
      const questionsOverTimeData = calculateQuestionsOverTime(finalAnswers);

      const testData = {
        participantName,
        participantEmail,
        totalQuestions,
        correctAnswers: correctCount,
        score: parseFloat(score.toFixed(2)),
        totalTime: Math.round(totalTime / 1000),
        answers: finalAnswers,
        isPassed,
        // ✅ TAMBAHKAN DATA GRAFIK
        timePerQuestion: timePerQuestion,
        questionsOverTime: questionsOverTimeData,
      };

      setTestResult(testData);
      setQuestionsOverTime(questionsOverTimeData);
      setStage("finished");
      setIsSubmitting(true);

      // Save to backend
      try {
        const response = await fetch(`${config.apiUrl}/test-results`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(testData),
        });

        const data = await response.json();

        if (response.ok) {
          console.log("Test result saved successfully:", data);
          toast.success("Hasil test berhasil disimpan!");
        } else {
          console.error("Failed to save test result:", data.error);
          toast.error("Gagal menyimpan hasil test ke server");
          setError(data.error);
        }
      } catch (error) {
        console.error("Error submitting test result:", error);
        toast.error("Gagal terhubung ke server");
        setError(error.message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [participantName, participantEmail, totalQuestions, startTime, timePerQuestion]
  );

  // ✅ SUBMIT ANSWER - DENGAN TRACKING WAKTU
  const handleSubmitAnswer = useCallback(
    (forcedAnswer) => {
      const answerStr = forcedAnswer !== undefined ? forcedAnswer : userAnswer;
      if (answerStr === "") return;

      const correctAnswer = (currentQuestion.num1 + currentQuestion.num2) % 10;
      const isCorrect = parseInt(answerStr) === correctAnswer;
      const timeSpent = Date.now() - questionStartTime;
      const timeSpentSeconds = Math.round(timeSpent / 1000);

      const answerData = {
        questionNumber,
        question: `${currentQuestion.num1} + ${currentQuestion.num2}`,
        userAnswer: parseInt(answerStr),
        correctAnswer,
        isCorrect,
        timeSpent,
      };

      const newAnswers = [...answers, answerData];
      setAnswers(newAnswers);
      
      // ✅ TRACK WAKTU PER SOAL UNTUK GRAFIK
      setTimePerQuestion(prev => [...prev, {
        soal: questionNumber,
        waktu: timeSpentSeconds
      }]);
      
      setUserAnswer("");

      if (questionNumber < totalQuestions) {
        setQuestionNumber((prev) => prev + 1);
        generateQuestion();
      } else {
        finishTest(newAnswers);
      }
    },
    [
      currentQuestion,
      questionNumber,
      totalQuestions,
      userAnswer,
      questionStartTime,
      answers,
      finishTest,
      generateQuestion,
    ]
  );

  // Global countdown timer
  useEffect(() => {
    if (stage !== "testing") return;
    if (timeLeft <= 0) {
      finishTest(answers);
      return;
    }
    const t = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, timeLeft, answers, finishTest]);

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Handle Enter key
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "Enter" && stage === "testing" && userAnswer !== "") {
        handleSubmitAnswer();
      }
    };
    window.addEventListener("keypress", handleKeyPress);
    return () => window.removeEventListener("keypress", handleKeyPress);
  }, [stage, userAnswer, currentQuestion, handleSubmitAnswer]);

  

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => (window.location.href = "/")}
            className="text-green-200 w-35 border border-green-600 p-2 text-xs bg-gray-100/10 rounded-md hover:bg-indigo-400 font-medium"
          >
            ← Kembali ke Menu
          </button>
          <button
            onClick={() => (window.location.href = "/admin")}
            className="text-indigo-200 w-35 border border-indigo-600 p-2 text-xs bg-gray-100/10 rounded-md hover:bg-green-200 hover:text-gray-700 font-medium"
          >
            Admin →
          </button>
        </div>
        <div className="bg-white/10 rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-center text-green-400 flex items-center justify-center gap-2">
            <Calculator className="w-8 h-8" />
            Test Uchida
          </h1>
        </div>

        {/* Registration Stage */}
        {stage === "register" && (
          <div className="bg-white/10 rounded-lg shadow-lg p-8">
            <div className="mb-6 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-indigo-400 mb-2">
                Registrasi Peserta
              </h2>
              <p className="text-green-200 text-xs">
                Silakan isi data Anda terlebih dahulu
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm md:text-lg font-medium text-indigo-400 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="w-full px-4 py-3 border-2 border-indigo-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm md:text-lg font-medium text-indigo-400 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={participantEmail}
                  onChange={(e) => setParticipantEmail(e.target.value)}
                  placeholder="Masukkan email"
                  className="w-full px-4 py-3 border-2 border-indigo-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm md:text-lg font-medium text-indigo-400 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Pendidikan Terakhir
                </label>
                <input
                  type="text"
                  value={participantPendidikan}
                  onChange={(e) => setParticipantPendidikan(e.target.value)}
                  placeholder="Masukkan Pendidikan Terakhir ( Contoh : SMK Teknik Elektronika)"
                  className="w-full px-4 py-3 border-2 border-indigo-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm md:text-lg font-medium text-indigo-400 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Nomor Handphone Pribadi
                </label>
                <input
                  type="text"
                  value={participantNoHp}
                  onChange={(e) => setParticipantNoHp(e.target.value)}
                  placeholder="Masukkan Nomor Handphone Pribadi"
                  className="w-full px-4 py-3 border-2 border-indigo-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleRegister}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition"
            >
              Lanjutkan
            </button>
          </div>
        )}

        {/* Ready Stage */}
        {stage === "ready" && (
          <div className="bg-white/10 rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-indigo-400 mb-2">
                Halo, {participantName}!
              </h2>
              <p className="text-green-400 mb-4">
                Anda akan mengerjakan <strong>{totalQuestions} soal</strong>{" "}
                penjumlahan dalam{" "}
                <strong>{Math.floor(timeLeft / 60)} menit</strong>.
              </p>
              <div className="bg-yellow-50/10 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-400 mb-2">
                <strong>Persyaratan Kelulusan:</strong> Harus menjawab benar{" "}
                <strong>{minBenar} soal</strong> untuk lulus.
              </div>
              <div className="bg-indigo-50/10 rounded-lg p-4 text-sm text-green-400">
                <p>✓ Pastikan koneksi internet stabil</p>
                <p>✓ Pastikan kamera dapat diakses</p>
                <p>✓ Kerjakan dengan jujur dan teliti</p>
              </div>
            </div>
            <button
              onClick={handleStartCamera}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg flex items-center gap-2 mx-auto transition"
            >
              <Camera className="w-5 h-5" />
              Saya Siap
            </button>
          </div>
        )}

        {/* Camera Stage */}
        {stage === "camera" && (
          <div className="bg-white/10 rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-green-400 mb-4 text-center">
                Kamera Aktif
              </h2>
              <div
                className="relative bg-black rounded-lg overflow-hidden"
                style={{ aspectRatio: "16/9", width: "80%", margin: "0 auto" }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  RECORDING
                </div>
              </div>
            </div>
            <button
              onClick={handleStartTest}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg flex items-center gap-2 mx-auto transition"
            >
              <Play className="w-5 h-5" />
              Mulai Test
            </button>
          </div>
        )}

        {/* Testing Stage */}
        {stage === "testing" && (
          <div className="space-y-6">
            <div className="bg-white/10 rounded-lg shadow-lg p-4 flex item-center justify-center">
              <div
                className="relative bg-black rounded-lg overflow-hidden"
                style={{ aspectRatio: "16/9", maxHeight: "200px" }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                  REC
                </div>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg shadow-lg p-8">
              <div className="text-center mb-6">
                <div className="text-sm text-gray-500 mb-2">
                  Soal {questionNumber} dari {totalQuestions} • Sisa waktu{" "}
                  {Math.floor(timeLeft / 60)}:
                  {String(timeLeft % 60).padStart(2, "0")}
                </div>
                <div className="text-6xl font-bold text-indigo-400 mb-4">
                  {currentQuestion.num1} + {currentQuestion.num2}
                </div>
                <div className="text-2xl font-semibold text-indigo-400">
                  = ?
                </div>
              </div>

              <div className="mb-6">
                <div className="bg-white/10 border-2 border-green-300 rounded-lg p-4 text-3xl font-bold text-center min-h-[60px] flex items-center justify-center">
                  {userAnswer || "0"}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumberClick(num.toString())}
                    className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-bold text-2xl py-4 rounded-lg transition"
                  >
                    {num}
                  </button>
                ))}
              </div>

              {questionNumber >= totalQuestions && (
                <button
                  onClick={() => finishTest(answers)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg transition"
                >
                  Selesai
                </button>
              )}
            </div>
          </div>
        )}

        {/* ✅ FINISHED STAGE - DENGAN GRAFIK */}
        {stage === "finished" && testResult && (
          <div className="space-y-6">
            <div className="bg-white/10 rounded-lg shadow-lg p-8">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Test Selesai!
                </h2>
                {isSubmitting ? (
                  <p className="text-gray-400">Menyimpan hasil test...</p>
                ) : error ? (
                  <p className="text-red-400">⚠ {error}</p>
                ) : (
                  <p className="text-green-400">
                    ✓ Hasil telah disimpan ke database
                  </p>
                )}
              </div>

              <div className="bg-green-100 rounded-lg p-6 mb-6">
                <div className="grid grid-rows-4 gap-4 text-center mb-4">
                  <div>
                    <div className="text-3xl font-bold text-indigo-600">
                      {testResult.correctAnswers}/{testResult.totalQuestions}
                    </div>
                    <div className="text-sm text-gray-600">Benar</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-indigo-600">
                      {testResult.score.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Akurasi</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-indigo-600">
                      {formatTime(testResult.totalTime)}
                    </div>
                    <div className="text-sm text-gray-600">Waktu</div>
                  </div>
                  <div>
                    <div
                      className={`text-3xl font-bold ${
                        testResult.isPassed ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {testResult.isPassed ? "LULUS" : "TIDAK LULUS"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testResult.isPassed
                        ? "Semua benar!"
                        : `Butuh ${totalQuestions} benar`}
                    </div>
                  </div>
                </div>

                <div className="border-t border-indigo-200 pt-4">
                  <p className="text-sm text-gray-600">
                    <strong>Nama:</strong> {participantName}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Email:</strong> {participantEmail}
                  </p>
                </div>
              </div>
            </div>

            {/* ✅ GRAFIK 1: WAKTU PER SOAL */}
            {timePerQuestion && timePerQuestion.length > 0 && (
              <div className="bg-white/10 rounded-lg shadow-lg p-8">
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
                  Rata-rata waktu: {(testResult.totalTime / testResult.totalQuestions).toFixed(2)} detik/soal
                </p>
              </div>
            )}

            {/* ✅ GRAFIK 2: PRODUKTIVITAS PER MENIT */}
            {questionsOverTime && questionsOverTime.length > 0 && (
              <div className="bg-white/10 rounded-lg shadow-lg p-8">
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
                  Total waktu test: {Math.ceil(testResult.totalTime / 60)} menit
                </p>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition"
            >
              Mulai Test Baru
            </button>
          </div>
        )}
      </div>
    </div>
  );
}