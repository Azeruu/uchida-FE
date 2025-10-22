import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Calculator, CheckCircle, Play, AlertCircle, User, Mail } from 'lucide-react';

const API_URL = 'http://localhost:8080/api';

export default function MathTestApp() {
  const [stage, setStage] = useState('register'); // register, ready, camera, testing, finished
  const [participantName, setParticipantName] = useState('');
  const [participantEmail, setParticipantEmail] = useState('');
  const [stream, setStream] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState({ num1: 0, num2: 0 });
  const [userAnswer, setUserAnswer] = useState('');
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(525);
  const [answers, setAnswers] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(15 * 60); // seconds
  const [pairs, setPairs] = useState([]); // loaded from admin config
  
  const videoRef = useRef(null);

  // Load config from backend
  const loadConfig = async () => {
    try {
      const res = await fetch(`${API_URL}/config`);
      const data = await res.json();
      if (res.ok && data.data) {
        const cfg = data.data;
        setTimeLeft(cfg.durationSeconds || 15 * 60);
        const sanitizedPairs = Array.isArray(cfg.pairs) ? cfg.pairs : [];
        setPairs(sanitizedPairs);
        setTotalQuestions(cfg.questionCount || sanitizedPairs.length || 525);
      }
    } catch (e) {
      console.error('Failed to load config', e);
      // Fallback
      setTimeLeft(15 * 60);
      setTotalQuestions(525);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // Generate next question from configured pairs
  const generateQuestion = useCallback(() => {
    if (pairs && pairs.length > 0 && questionNumber >= 0 && questionNumber < pairs.length) {
      const { a, b } = pairs[questionNumber];
      setCurrentQuestion({ num1: a, num2: b });
    } else {
      const num1 = Math.floor(Math.random() * 10);
      const num2 = Math.floor(Math.random() * 10);
      setCurrentQuestion({ num1, num2 });
    }
    setQuestionStartTime(Date.now());
  }, [pairs, questionNumber]);

  // Handle registration
  const handleRegister = () => {
    if (!participantName.trim() || !participantEmail.trim()) {
      setError('Nama dan email harus diisi');
      return;
    }
    if (!participantEmail.includes('@')) {
      setError('Email tidak valid');
      return;
    }
    setError('');
    setStage('ready');
  };

  // Handle camera permission
  const handleStartCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStage('camera');
    } catch (error) {
      alert('Gagal mengakses kamera. Pastikan Anda memberikan izin kamera.');
      console.error('Camera error:', error);
    }
  };

  // Start test
  const handleStartTest = () => {
    setStage('testing');
    setStartTime(Date.now());
    setQuestionNumber(1);
    generateQuestion();
  };

  // Handle number input
  const handleNumberClick = (num) => {
    // Ones-digit rule: keep only last digit
    const next = (num.toString()).slice(-1);
    setUserAnswer(next);
    // Auto-submit immediately
    setTimeout(() => {
      handleSubmitAnswer(next);
    }, 0);
  };


  // Submit answer
  const handleSubmitAnswer = useCallback((forcedAnswer) => {
    const answerStr = forcedAnswer !== undefined ? forcedAnswer : userAnswer;
    if (answerStr === '') return;

    const correctAnswer = (currentQuestion.num1 + currentQuestion.num2) % 10; // ones-digit
    const isCorrect = parseInt(answerStr) === correctAnswer;
    const timeSpent = Date.now() - questionStartTime;

    const answerData = {
      questionNumber,
      question: `${currentQuestion.num1} + ${currentQuestion.num2}`,
      userAnswer: parseInt(answerStr),
      correctAnswer,
      isCorrect,
      timeSpent
    };

    setAnswers(prev => [...prev, answerData]);
    setUserAnswer('');

    if (questionNumber < totalQuestions) {
      setQuestionNumber(prev => prev + 1);
      generateQuestion();
    } else {
      finishTest([...answers, answerData]);
    }
  }, [currentQuestion, questionNumber, totalQuestions, userAnswer, questionStartTime, answers, finishTest, generateQuestion]);

  // Finish test and save results to backend
  const finishTest = useCallback(async (finalAnswers) => {
    const totalTime = Date.now() - startTime;
    const correctCount = finalAnswers.filter(a => a.isCorrect).length;
    const score = (correctCount / totalQuestions) * 100;
    const isPassed = correctCount >= 525; // Minimal 525 benar untuk lulus

    const testData = {
      participantName,
      participantEmail,
      totalQuestions,
      correctAnswers: correctCount,
      score: parseFloat(score.toFixed(2)),
      totalTime: Math.round(totalTime / 1000),
      answers: finalAnswers,
      isPassed
    };

    setTestResult(testData);
    setStage('finished');
    setIsSubmitting(true);

    // Save to backend
    try {
      const response = await fetch(`${API_URL}/test-results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Test result saved successfully:', data);
      } else {
        console.error('Failed to save test result:', data.error);
        setError('Gagal menyimpan hasil test ke server');
      }
    } catch (error) {
      console.error('Error submitting test result:', error);
      setError('Gagal terhubung ke server');
    } finally {
      setIsSubmitting(false);
    }
  }, [participantName, participantEmail, totalQuestions, startTime]);

  // Global countdown timer -> auto-finish
  useEffect(() => {
    if (stage !== 'testing') return;
    if (timeLeft <= 0) {
      finishTest(answers);
      return;
    }
    const t = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, timeLeft, answers, finishTest]);

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Handle Enter key for submit
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && stage === 'testing' && userAnswer !== '') {
        handleSubmitAnswer();
      }
    };
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [stage, userAnswer, currentQuestion, handleSubmitAnswer]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => window.location.href = '/'}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              ← Kembali ke Menu
            </button>
            <button
              onClick={() => window.location.href = '/admin'}
              className="text-gray-600 hover:text-gray-800 font-medium"
            >
              Admin →
            </button>
          </div>
          <h1 className="text-3xl font-bold text-center text-indigo-600 flex items-center justify-center gap-2">
            <Calculator className="w-8 h-8" />
            Test Penjumlahan Angka
          </h1>
        </div>

        {/* Registration Stage */}
        {stage === 'register' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Registrasi Peserta</h2>
              <p className="text-gray-600">Silakan isi data Anda terlebih dahulu</p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={participantEmail}
                  onChange={(e) => setParticipantEmail(e.target.value)}
                  placeholder="Masukkan email"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            <button
              onClick={handleRegister}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition"
            >
              Lanjutkan
            </button>
          </div>
        )}

        {/* Ready Stage */}
        {stage === 'ready' && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Halo, {participantName}!</h2>
              <p className="text-gray-600 mb-4">
                Anda akan mengerjakan {totalQuestions} soal penjumlahan dalam {Math.floor(timeLeft/60)} menit. 
              </p>
              <div className="bg-indigo-50 rounded-lg p-4 text-sm text-gray-700">
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
        {stage === 'camera' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Kamera Aktif</h2>
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
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
        {stage === 'testing' && (
          <div className="space-y-6">
            {/* Video Preview (smaller) */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9', maxHeight: '200px' }}>
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

            {/* Question Card */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-6">
                <div className="text-sm text-gray-500 mb-2">
                  Soal {questionNumber} dari {totalQuestions} • Sisa waktu {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}
                </div>
                <div className="text-6xl font-bold text-indigo-600 mb-4">
                  {currentQuestion.num1} + {currentQuestion.num2}
                </div>
                <div className="text-2xl font-semibold text-gray-700">= ?</div>
              </div>

              {/* Answer Display */}
              <div className="mb-6">
                <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4 text-3xl font-bold text-center min-h-[60px] flex items-center justify-center">
                  {userAnswer || '0'}
                </div>
              </div>

              {/* Calculator Buttons (tap-to-advance) - hanya angka 3-9 */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button
                    key={num}
                    onClick={() => handleNumberClick(num.toString())}
                    className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-bold text-2xl py-4 rounded-lg transition"
                  >
                    {num}
                  </button>
                ))}
              </div>

              {/* Submit Button only shown at the end */}
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

        {/* Finished Stage */}
        {stage === 'finished' && testResult && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Test Selesai!</h2>
              {isSubmitting ? (
                <p className="text-gray-600">Menyimpan hasil test...</p>
              ) : error ? (
                <div className="text-red-600 flex items-center justify-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              ) : (
                <p className="text-green-600">✓ Hasil telah disimpan ke database</p>
              )}
            </div>

            <div className="bg-indigo-50 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-4 gap-4 text-center mb-4">
                <div>
                  <div className="text-3xl font-bold text-indigo-600">
                    {testResult.correctAnswers}/{testResult.totalQuestions}
                  </div>
                  <div className="text-sm text-gray-600">Benar</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-indigo-600">
                    {testResult.score}%
                  </div>
                  <div className="text-sm text-gray-600">Skor</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-indigo-600">
                    {testResult.totalTime}s
                  </div>
                  <div className="text-sm text-gray-600">Waktu</div>
                </div>
                <div>
                  <div className={`text-3xl font-bold ${testResult.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                    {testResult.isPassed ? 'LULUS' : 'TIDAK LULUS'}
                  </div>
                  <div className="text-sm text-gray-600">Status</div>
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