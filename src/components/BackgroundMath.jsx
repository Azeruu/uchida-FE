import React from 'react';

/**
 * Komponen untuk memberikan nuansa latar belakang matematika yang elegan
 * Digunakan secara konsisten di seluruh halaman aplikasi.
 */
const BackgroundMath = () => {
  const symbols = ['+', '-', '×', '÷', '=', '%', '∑', '∫', 'π', '√', '∞', '∆', 'θ', 'λ'];
  
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 select-none">
       {/* Soft Gradient Blobs */}
       <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-300/50 rounded-full blur-[100px]"></div>
       <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-300/50 rounded-full blur-[100px]"></div>
       <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-purple-300/50 rounded-full blur-[80px]"></div>
       
       {Array.from({ length: 40 }).map((_, i) => (
         <div 
           key={i} 
           className="absolute font-black text-indigo-200/20 md:text-indigo-200/20"
           style={{
             top: `${((i * 17) % 100)}%`,
             left: `${((i * 23) % 100)}%`,
             transform: `rotate(${((i * 45) % 360)}deg)`,
             fontSize: `${2 + ((i * 7) % 4)}rem`,
           }}
         >
           {symbols[i % symbols.length]}
         </div>
       ))}
    </div>
  );
};

export default BackgroundMath;
