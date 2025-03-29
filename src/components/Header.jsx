import React, { useState } from 'react';
import Ladder from '../ladder.json';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-gray-900 border-b border-gray-700 shadow-md py-3 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo et nom du site */}
        <div className="flex items-center space-x-3">
          <a href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center transition-all group-hover:bg-blue-600">
              <img src="/images/home.png" alt="Accueil" className="w-5 h-5" />
            </div>
            <div className="hidden sm:flex items-center space-x-3">
              <span className="text-blue-400 font-bold text-[30px] tracking-wide">WPVG</span>
            </div>
          </a>
        </div>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center space-x-6">

          {/* Bouton avec effet spécial pour le ladder principal */}
          <a 
            href="/ladder" 
            className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            Classement LoL
          </a>
        </nav>

        {/* Bouton de menu mobile */}
        <div className="md:hidden">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-300 hover:text-white focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {isMenuOpen && (
        <div className="md:hidden mt-3 space-y-1 px-2 pb-3 pt-2">
          <a 
            href="/" 
            className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Accueil
          </a>
          {Ladder.map((ladder, i) => (
            <a 
              key={i} 
              href="/ladder" 
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              {ladder.ladder_type}
            </a>
          ))}
          <a 
            href="/ladder" 
            className="block rounded-md px-3 py-2 text-base font-medium bg-blue-700 text-white hover:bg-blue-600"
          >
            Classement LoL
          </a>
        </div>
      )}
    </header>
  );
}