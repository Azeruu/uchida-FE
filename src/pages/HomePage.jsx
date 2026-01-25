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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="rounded-lg shadow-lg p-8 w-full">
        <div className="text-center mb-8">
          <div className="md:w-40 md:h-40 w-20 h-20  rounded-full flex items-center justify-center mx-auto mb-4">
            <img src="/LogoKIM.png" alt="logoUchida" />
          </div>
          <h1 className="md:text-3xl text-2xl font-bold">Test UCHIDA</h1>
          <h2 className='md:text-4xl text-2xl font-bold mb-5'>PT. Kwarsa Indah Murni</h2>
          <p className="text-(--text1) md:text-lg text-sm">Pilih akses yang diinginkan</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Guest Test Access */}
          <div className="bg-green-100/10 border-2 border-(--border1) rounded-lg p-6 hover:bg-gray-500/50 transition">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="md:text-2xl text-xl font-bold text-(--text1) mb-2">Mulai Test</h2>
              <p className="md:text-xl text-sm text-(--border1) mb-4">
                Akses sebagai guest untuk mengerjakan test UCHIDA
              </p>
              <button
                onClick={navigateToTest}
                className="w-full bg-(--button1) hover:bg-(--hover1) text-white font-bold py-3 rounded-lg transition"
              >
                Mulai Test sebagai Guest
              </button>
            </div>
          </div>

          {/* Admin Access */}
          <div className="bg-indigo-100/10 border-2 border-(--border2) rounded-lg p-6 hover:bg-gray-500/50 transition">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="md:text-2xl text-xl font-bold text-(--text2) mb-2">Admin Dashboard</h2>
              <p className="md:text-xl text-sm text-(--border2) mb-4">
                Login sebagai admin untuk mengatur test dan melihat hasil
              </p>
              <button
                onClick={navigateToAdmin}
                className="w-full bg-(--button2) hover:bg-(--hover2) text-white font-bold py-3 rounded-lg transition"
              >
                Login Admin
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p><strong>© 2025 Reza. </strong>Made with ❤️ in Indonesia</p>
        </div>
      </div>
    </div>
  );
}
