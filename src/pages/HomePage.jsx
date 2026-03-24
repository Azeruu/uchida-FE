import React, { useEffect, useState } from 'react';
import { Calculator, BarChart, Play, GraduationCap, LogOut, History, ChevronRight, User } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, useUser, useClerk } from "@clerk/clerk-react";
import config from '../config';
import BackgroundMath from '../components/BackgroundMath';


export default function HomePage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [testHistory, setTestHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const navigateToTest = () => {
    window.location.href = '/test';
  };

  const navigateToAdmin = () => {
    window.location.href = '/admin';
  };

  // Logic to check if admin and redirect or show admin link
  useEffect(() => {
    if (isLoaded && user) {
      const email = user.primaryEmailAddress?.emailAddress;
      const adminEmails = import.meta.env.VITE_ADMIN_EMAILS?.split(',') || [];
      
      if (email && adminEmails.includes(email)) {
        // Automatically redirect admins to /admin
        window.location.href = '/admin';
      } else if (email) {
        // Fetch test history for regular users
        fetchHistory(email);
      }
    }
  }, [isLoaded, user]);

  const fetchHistory = async (email) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`${config.apiUrl}/test-results/email/${email}`);
      const data = await res.json();
      if (data.success) {
        setTestHistory(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching test history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-indigo-800 relative flex items-center justify-center p-4">
      <BackgroundMath />
      
      <div className="w-full max-w-5xl z-10 animate-in fade-in duration-500 py-3">
        
        {/* Header Section */}
        <div className="text-center mb-4 relative">
          <div className="w-24 h-24 md:w-28 md:h-28 bg-transparent rounded-3xl flex items-center justify-center mx-auto mb-6 border border-indigo-50 transform hover:rotate-45 transition-transform duration-300 group shadow-[0_0_20px_rgba(224,231,255,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,2)]">
            <GraduationCap className="absolute w-12 h-12 md:w-16 md:h-16 transform group-hover:-rotate-45 transition-transform duration-300 text-indigo-100" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-200 tracking-tight mb-4">
            Test <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-blue-500">UCHIDA</span>
          </h1>
          <p className="text-indigo-200 md:text-lg text-sm font-medium">Platform Evaluasi Kecepatan & Akurasi Matematika</p>
        </div>

        {/* Content Section based on Auth State */}
        <div className="max-w-4xl mx-auto relative">
          
          <SignedOut>
            <div className="flex justify-center flex-col items-center">
              <SignInButton mode="modal">
                 <button className="flex flex-col items-center justify-center p-10 bg-transparent max-w-md w-full border border-indigo-100 rounded-3xl transform transition-all duration-300 hover:scale-105 shadow-md shadow-[0_0_20px_rgba(224,231,255,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,2)]">
                     <h2 className="text-3xl font-bold text-indigo-200 mb-3">Mulai Sekarang?</h2>
                     <p className="text-indigo-200 text-center text-base leading-relaxed mb-8">Masuk dengan akun Google untuk memulai test atau mengakses dashboard Anda.</p>
                     <div className="px-8 py-4 bg-indigo-500 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-indigo-600 transition-colors w-full cursor-pointer">
                        Login
                     </div>
                 </button>
              </SignInButton>
            </div>
          </SignedOut>

          <SignedIn>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
               
               {/* Left Side: Test Card */}
               <div className="lg:col-span-5 flex flex-col items-center">
                 <div className="bg-white/20 border border-green-100 rounded-[2.5rem] p-8 shadow-2xl shadow-green-100/50 w-full relative overflow-hidden h-110">
                    <div className="flex items-center justify-center mx-auto mb-3">
                      <User className="w-10 h-10 text-green-300 ml-1.5" />
                    </div>
                    <h2 className="text-2xl font-bold text-indigo-200 mb-2 text-center">Halo, {user?.firstName || 'Peserta'}!</h2>
                    <p className="text-indigo-200 mb-8 text-center text-sm leading-relaxed">Anda telah berhasil login. Siap untuk menguji kemampuan matematika Anda hari ini?</p>
                    
                    <button
                      onClick={navigateToTest}
                      className="cursor-pointer w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:shadow-green-500/30 hover:-translate-y-1 text-lg flex items-center justify-center gap-3"
                    >
                      <Play className="w-6 h-6 fill-current" />
                      Mulai Test Sekarang
                    </button>

                    <button 
                      onClick={() => signOut()}
                      className="mt-20 border border-indigo-100 rounded-full w-full flex items-center justify-center gap-2 text-indigo-200 hover:bg-red-600 hover:text-white cursor-pointer transition-colors text-sm font-semibold py-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout Sesi
                    </button>
                 </div>
               </div>

               {/* Right Side: History Section */}
               <div className="lg:col-span-7 h-full">
                 <div className="bg-white/20 backdrop-blur-sm border border-slate-200 rounded-[2.5rem] p-8 h-110 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-white/20 rounded-xl shadow-sm border border-slate-100">
                        <History className="w-6 h-6 text-indigo-600" />
                      </div>
                      <h3 className="text-xl font-bold text-indigo-200">Riwayat Test</h3>
                    </div>

                    {loadingHistory ? (
                      <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-indigo-200 text-sm font-medium">Memuat data...</p>
                      </div>
                    ) : testHistory.length > 0 ? (
                      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                        <div className="max-h-[350px] overflow-y-auto">
                          <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/50 sticky top-0 backdrop-blur-md">
                              <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tanggal</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Skor</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {testHistory.map((test, index) => (
                                <tr key={index} className="hover:bg-slate-50/50 transition-colors group cursor-default">
                                  <td className="px-6 py-5">
                                    <div className="text-sm font-bold text-slate-700">{formatDate(test.createdAt)}</div>
                                    <div className="text-[10px] text-slate-400 font-medium">Selesai dalam {Math.floor(test.totalTime / 60)}m {test.totalTime % 60}s</div>
                                  </td>
                                  <td className="px-6 py-5 text-center">
                                    <span className="text-lg font-black text-indigo-600">{test.score.toFixed(0)}</span>
                                    <span className="text-[10px] font-bold text-slate-300 ml-0.5">%</span>
                                  </td>
                                  <td className="px-6 py-5 text-right">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                                      test.isPassed 
                                        ? 'bg-green-50 text-green-600 border border-green-100' 
                                        : 'bg-red-50 text-red-600 border border-red-100'
                                    }`}>
                                      {test.isPassed ? 'LULUS' : 'GAGAL'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-center bg-white/20 rounded-3xl border border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center mb-4">
                           <History className="w-8 h-8 text-indigo-600" />
                        </div>
                        <p className="text-indigo-100 font-medium px-10">Belum ada riwayat pengerjaan test untuk akun ini.</p>
                      </div>
                    )}
                 </div>
               </div>

            </div>
          </SignedIn>

        </div>

        <div className="mt-16 text-center text-sm text-indigo-200 font-medium relative">
          <p>© 2026 Reza. Crafted with precision for evaluation Excellence.</p>
        </div>
      </div>
    </div>
  );
}
