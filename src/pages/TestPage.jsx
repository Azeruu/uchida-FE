import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  Calculator,
  CheckCircle,
  Play,
  User,
  Mail,
  GraduationCap,
  Clock,
  TrendingUp,
  BarChart,
  X,
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
import { useUser } from "@clerk/clerk-react";
import BackgroundMath from "../components/BackgroundMath";

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
  const [answers, setAnswers] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION);
  const [pairs, setPairs] = useState([]);
  const [maxIncorrectAnswers, setMaxIncorrectAnswers] = useState(7);
  const [minQuestionsPerMinute, setMinQuestionsPerMinute] = useState(35);
  
  // ✅ STATE BARU UNTUK GRAFIK
  const [timePerQuestion, setTimePerQuestion] = useState([]);
  const [questionsOverTime, setQuestionsOverTime] = useState([]);

  const videoRef = useRef(null);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      setParticipantName(prev => prev || user.fullName || "");
      setParticipantEmail(prev => prev || user.primaryEmailAddress?.emailAddress || "");
    }
  }, [user]);

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
        setMaxIncorrectAnswers(cfg.maxIncorrectAnswers ?? 7);
        setMinQuestionsPerMinute(cfg.minQuestionsPerMinute ?? 35);
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
  // Struktur data: { menit: X, jumlahSoal: Y } - Menit di sumbu X, Jumlah Soal di sumbu Y
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
      const incorrectCount = finalAnswers.length - correctCount;
      const score = (correctCount / totalQuestions) * 100;
      
      // ✅ LOGIKA KELULUSAN BARU:
      // 1. Minimal X penjumlahan per menit (configurable, default 35) - hanya hitung menit penuh
      // 2. Maksimal Y jawaban salah (configurable, default 7)
      
      const questionsOverTimeData = calculateQuestionsOverTime(finalAnswers);
      
      const fullMinutes = Math.floor(totalTime / 60000);
      
      // Filter hanya menit yang penuh. Jika waktu 2 menit 45 detik, fullMinutes = 2. Kita abaikan menit ke-3.
      const validMinutesData = questionsOverTimeData.filter(item => item.menit <= fullMinutes);

      // Cek apakah setiap menit penuh minimal minQuestionsPerMinute soal
      // Jika test kurang dari 1 menit (fullMinutes = 0), kita anggap memenuhi syarat speed (true)
      const isSpeedPassed = validMinutesData.length > 0 
        ? validMinutesData.every(item => item.jumlahSoal >= minQuestionsPerMinute)
        : true;

      // Cek apakah jumlah salah tidak melebihi batas
      const isAccuracyPassed = incorrectCount <= maxIncorrectAnswers;

      const isPassed = isSpeedPassed && isAccuracyPassed;


      const testData = {
        participantName,
        participantEmail,
        participantPendidikan,
        participantNoHp,
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
    [participantName, participantEmail, participantPendidikan, participantNoHp, totalQuestions, startTime, timePerQuestion, maxIncorrectAnswers, minQuestionsPerMinute]
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
    <div className="min-h-screen bg-indigo-800 relative p-4 overflow-x-hidden">
      <BackgroundMath />
      <div className="max-w-4xl mx-auto relative z-10">

        {/* Registration Stage */}
        {stage === "register" && (
          <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] border border-indigo-100/20 shadow-2xl p-8 animate-in fade-in zoom-in duration-500">
              <button
                onClick={() => (window.location.href = "/")}
                className="text-indigo-200 w-35 border border-indigo-100/30 p-2 text-xs bg-white/5 rounded-full hover:bg-white/10 font-medium mb-6 transition-colors"
              >
                ← Kembali ke Menu
              </button>
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-2">
                Registrasi Peserta
              </h2>
              <p className="text-indigo-200 text-sm">
                Silakan lengkapi data Anda untuk memulai evaluasi
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-indigo-100 mb-2">
                  <User className="w-4 h-4 inline mr-2 text-indigo-300" />
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="w-full px-4 py-3 bg-white/5 border border-indigo-100/20 rounded-xl text-white placeholder-indigo-300/40 focus:border-indigo-400 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-indigo-100 mb-2">
                  <Mail className="w-4 h-4 inline mr-2 text-indigo-300" />
                  Email
                </label>
                <input
                  type="email"
                  value={participantEmail}
                  onChange={(e) => setParticipantEmail(e.target.value)}
                  readOnly={!!user?.primaryEmailAddress?.emailAddress}
                  placeholder="Masukkan email"
                  className={`w-full px-4 py-3 bg-white/5 border border-indigo-100/20 rounded-xl text-white placeholder-indigo-300/40 focus:border-indigo-400 focus:outline-none transition-all ${user?.primaryEmailAddress?.emailAddress ? 'opacity-60 cursor-not-allowed' : ''}`}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-indigo-100 mb-2">
                  <GraduationCap className="w-4 h-4 inline mr-2 text-indigo-300" />
                  Pendidikan Terakhir
                </label>
                <input
                  type="text"
                  value={participantPendidikan}
                  onChange={(e) => setParticipantPendidikan(e.target.value)}
                  placeholder="Contoh: SMK Teknik Elektronika"
                  className="w-full px-4 py-3 bg-white/5 border border-indigo-100/20 rounded-xl text-white placeholder-indigo-300/40 focus:border-indigo-400 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-indigo-100 mb-2">
                  <CheckCircle className="w-4 h-4 inline mr-2 text-indigo-300" />
                  Nomor Handphone
                </label>
                <input
                  type="text"
                  value={participantNoHp}
                  onChange={(e) => setParticipantNoHp(e.target.value)}
                  placeholder="Masukkan nomor HP aktif"
                  className="w-full px-4 py-3 bg-white/5 border border-indigo-100/20 rounded-xl text-white placeholder-indigo-300/40 focus:border-indigo-400 focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              onClick={handleRegister}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-1 mt-4"
            >
              Lanjutkan
            </button>
          </div>
        )}

        {/* Ready Stage */}
        {stage === "ready" && (
          <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] border border-indigo-100/20 shadow-2xl p-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="mb-6">
              <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-400/30">
                <CheckCircle className="w-12 h-12 text-indigo-300" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Halo, {participantName}!
              </h2>
              <p className="text-indigo-200 mb-6">
                Anda akan mengerjakan <strong className="text-white">{totalQuestions} soal</strong> penjumlahan dalam <strong className="text-white">{Math.floor(timeLeft / 60)} menit</strong>.
              </p>
              <div className="bg-indigo-900/40 border border-indigo-400/30 rounded-2xl p-4 text-sm text-indigo-100 mb-6">
                <strong className="text-yellow-400">Persyaratan Kelulusan:</strong><br/>
                Minimal menjawab <strong className="text-white">35 soal per menit</strong> secara konsisten.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[10px] uppercase tracking-widest font-black text-indigo-300">
                <div className="bg-white/5 py-2 rounded-lg border border-indigo-100/10">Koneksi Stabil</div>
                <div className="bg-white/5 py-2 rounded-lg border border-indigo-100/10">Kamera Aktif</div>
                <div className="bg-white/5 py-2 rounded-lg border border-indigo-100/10">Jujur & Teliti</div>
              </div>
            </div>
            <button
              onClick={handleStartCamera}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-black py-4 px-10 rounded-2xl flex items-center gap-3 mx-auto transition-all shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-1"
            >
              <Camera className="w-6 h-6" />
              Saya Siap
            </button>
          </div>
        )}

        {/* Camera Stage */}
        {stage === "camera" && (
          <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] border border-indigo-100/20 shadow-2xl p-8 animate-in fade-in zoom-in duration-500">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Kamera Aktif</h2>
              <div
                className="relative bg-indigo-950/50 rounded-3xl overflow-hidden border-4 border-indigo-100/10 shadow-inner"
                style={{ aspectRatio: "16/9", maxWidth: "600px", margin: "0 auto" }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest flex items-center gap-2 border border-red-400/50 shadow-lg">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  RECORDING
                </div>
              </div>
            </div>
            <button
              onClick={handleStartTest}
              className="bg-green-500 hover:bg-green-600 text-white font-black py-4 px-10 rounded-2xl flex items-center gap-3 mx-auto transition-all shadow-lg hover:shadow-green-500/30 transform hover:-translate-y-1"
            >
              <Play className="w-6 h-6 fill-current" />
              Mulai Evaluasi
            </button>
          </div>
        )}

        {/* Testing Stage */}
        {stage === "testing" && (
          <div className="space-y-6 animate-in fade-in duration-700">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl border border-indigo-100/10 p-4 flex items-center justify-center">
              <div
                className="relative bg-indigo-950/50 rounded-2xl overflow-hidden border-2 border-indigo-100/10 shadow-lg"
                style={{ aspectRatio: "16/9", maxHeight: "150px" }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest flex items-center gap-1 border border-red-400/30">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                  REC
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] border border-indigo-100/20 shadow-2xl p-8 sm:p-12 relative overflow-hidden">
              <div className="text-center mb-8">
                <div className="text-xs uppercase tracking-widest font-black text-indigo-300 mb-2">
                  Soal {questionNumber} / {totalQuestions} • Sisa {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </div>
                <div className="text-7xl sm:text-8xl font-black text-white mb-6 tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                  {currentQuestion.num1} <span className="text-indigo-400">+</span> {currentQuestion.num2}
                </div>
              </div>

              <div className="mb-10 max-w-xs mx-auto">
                <div className="bg-indigo-900/60 border-2 border-indigo-400/50 rounded-2xl p-6 text-5xl font-black text-green-400 text-center shadow-inner min-h-[100px] flex items-center justify-center">
                  {userAnswer || "?"}
                </div>
              </div>

              <div className="grid grid-cols-5 gap-3 max-w-lg mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumberClick(num.toString())}
                    className="bg-white/10 hover:bg-white/20 border border-indigo-100/10 text-white font-black text-3xl py-6 rounded-2xl transition-all active:scale-90"
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ✅ FINISHED STAGE */}
        {stage === "finished" && testResult && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] border border-indigo-100/20 shadow-2xl p-10">
              <div className="text-center mb-10">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-400/30">
                  <CheckCircle className="w-12 h-12 text-green-400" />
                </div>
                <h2 className="text-4xl font-black text-white mb-2 tracking-tight">Evaluasi Selesai!</h2>
                {isSubmitting ? (
                  <p className="text-indigo-200 animate-pulse">Menghubungkan ke server...</p>
                ) : error ? (
                  <p className="text-red-400">⚠ {error}</p>
                ) : (
                  <p className="text-green-400 font-bold">Data pengerjaan berhasil terverifikasi</p>
                )}
              </div>

              <div className="bg-indigo-900/40 backdrop-blur-xl rounded-[2.5rem] p-8 border border-indigo-400/20 shadow-inner">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center mb-12">
                  <div className="space-y-2">
                    <div className="text-5xl font-black text-white drop-shadow-sm">{testResult.correctAnswers}</div>
                    <div className="text-[10px] uppercase tracking-[0.2em] font-black text-indigo-400">Total Benar</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-5xl font-black text-indigo-300 drop-shadow-sm">{testResult.score.toFixed(0)}<span className="text-xl">%</span></div>
                    <div className="text-[10px] uppercase tracking-[0.2em] font-black text-indigo-400">Akurasi</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-5xl font-black text-indigo-300 drop-shadow-sm">{Math.floor(testResult.totalTime / 60)}<span className="text-xl">m</span></div>
                    <div className="text-[10px] uppercase tracking-[0.2em] font-black text-indigo-400">Waktu</div>
                  </div>
                  <div className="space-y-2">
                    <div className={`text-4xl font-black tracking-tighter drop-shadow-sm ${testResult.isPassed ? "text-green-400" : "text-red-400"}`}>
                      {testResult.isPassed ? "PASSED" : "FAILED"}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.2em] font-black text-indigo-400">Status</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-indigo-100/10 pt-8">
                   <div className="bg-white/5 p-5 rounded-3xl border border-indigo-100/5">
                      <div className="text-[10px] uppercase tracking-widest font-black text-indigo-400 mb-1">Nama Peserta</div>
                      <div className="text-white font-bold">{participantName}</div>
                   </div>
                   <div className="bg-white/5 p-5 rounded-3xl border border-indigo-100/5">
                      <div className="text-[10px] uppercase tracking-widest font-black text-indigo-400 mb-1">Email Terdaftar</div>
                      <div className="text-white font-bold">{participantEmail}</div>
                   </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* ✅ GRAFIK 1: WAKTU PER SOAL */}
              {timePerQuestion && timePerQuestion.length > 0 && (
                <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] border border-indigo-100/20 shadow-2xl p-8">
                  <h3 className="text-lg font-black text-white mb-8 uppercase tracking-widest flex items-center gap-3">
                    <BarChart className="w-5 h-5 text-indigo-400" /> Waktu per Soal
                  </h3>
                  <div className="h-[250px]">
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
              )}

              {/* ✅ GRAFIK 2: PRODUKTIVITAS PER MENIT */}
              {questionsOverTime && questionsOverTime.length > 0 && (
                <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] border border-indigo-100/20 shadow-2xl p-8">
                  <h3 className="text-lg font-black text-white mb-8 uppercase tracking-widest flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-green-400" /> Produktivitas
                  </h3>
                  <div className="h-[250px]">
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
              )}
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-1"
            >
              Mulai Test Baru
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
