import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

const Breadcrumb = ({ currentPage }) => {
  return (
    <div className=" py-4 md:py-8 min-h-[80px] md:min-h-[100px] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        <div className="flex items-start justify-between mb-2 md:mb-4">
          <div className="flex items-center text-xs md:text-sm">
            <Link to="/" className="text-gray-600 hover:text-[#d80a4e]">Home</Link>
            <span className="mx-1 md:mx-2 text-gray-400">/</span>
            <span className="text-gray-800">{currentPage}</span>
          </div>
        </div>
        <h1 className="font-display text-2xl font-bold text-gray-900 md:text-4xl">{currentPage}</h1>
      </div>
      {/* Faint brand watermark — sits behind the title so long names stay readable */}
      <img
        src={logo}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-2 top-1/2 z-0 h-16 -translate-y-1/2 select-none opacity-[0.07] md:right-6 md:h-32"
      />
    </div>
  );
};

export default Breadcrumb;