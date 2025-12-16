import React from 'react';
import { Link } from 'react-router-dom';

const Breadcrumb = ({ currentPage }) => {
  return (
    <div className="bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-start justify-between mb-4 relative">
          <div className="flex items-center text-sm">
            <Link to="/" className="text-gray-600 hover:text-[#d80a4e]">Home</Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-800">{currentPage}</span>
          </div>
          <img src="/src/assets/logo.png" alt="Chowdhry Sweet House" className="h-40 absolute right-0 top-1/2 transform -translate-y-1/3" />
        </div>
        <h1 className="text-4xl font-bold">{currentPage}</h1>
      </div>
    </div>
  );
};

export default Breadcrumb;