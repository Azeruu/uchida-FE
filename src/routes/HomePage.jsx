import React from 'react';
import { Calculator, BarChart, Play } from 'lucide-react';

export default function HomePage() {
  const navigateToTest = () => {
    window.location.href = '/test';
  };

  const navigateToAdmin = () => {
    window.location.href = '/admin';
  };

  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center p-4">
      <div className="bg-slate-50/5 backdrop-blur-lg rounded-lg shadow-lg p-8 max-w-20xl w-full">
        <div className="text-center mb-8">
          <div className="md:w-40 md:h-40 w-20 h-20  rounded-full flex items-center justify-center mx-auto mb-6">
            <img src="/LogoKIM.png" alt="logoUchida" />
          </div>
          <h1 className="md:text-4xl text-2xl font-bold text-white-800 mb-4">Test Uchida PT. Kwarsa Indah Murni</h1>
          <p className="text-white-600 md:text-lg text-sm">Pilih akses yang diinginkan</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Guest Test Access */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 hover:bg-green-100 transition">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">Mulai Test</h2>
              <p className="text-green-700 mb-4">
                Akses sebagai guest untuk mengerjakan test penjumlahan
              </p>
              <button
                onClick={navigateToTest}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition"
              >
                Mulai Test sebagai Guest
              </button>
            </div>
          </div>

          {/* Admin Access */}
          <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-6 hover:bg-indigo-100 transition">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-indigo-800 mb-2">Admin Dashboard</h2>
              <p className="text-indigo-700 mb-4">
                Login sebagai admin untuk mengatur test dan melihat hasil
              </p>
              <button
                onClick={navigateToAdmin}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition"
              >
                Login Admin
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p><strong>Kredensial Admin:</strong> admin.kim@gmail.com / kimkantor1</p>
        </div>
      </div>
    </div>
  );
}
