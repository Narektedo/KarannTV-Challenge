import React, { useState } from "react";
import Header from '../components/Header';
import profiles from '../profiles.json';

export default function ProfilesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filtrer les profils en fonction du terme de recherche
  const filteredProfiles = profiles.filter(profile =>
    profile.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Header />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* En-tête de section */}
        <div className="text-center mb-12">
          <a className="text-3xl font-bold text-blue-300 mb-4">Liste des Profils</a>
          
          {/* Barre de recherche */}
          <div className="mt-6 max-w-md mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full bg-gray-800 border border-gray-700 rounded-md py-2 pl-10 pr-3 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Rechercher un joueur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Affichage du nombre de résultats */}
        <div className="text-gray-400 mb-6 font-medium">
          {filteredProfiles.length === 0 ? (
            "Aucun joueur trouvé"
          ) : (
            `${filteredProfiles.length} joueur${filteredProfiles.length > 1 ? 's' : ''} enregistré${filteredProfiles.length > 1 ? 's' : ''}`
          )}
        </div>
        
        {/* Conteneur flex pour les profils (permet le centrage) */}
        <div className="flex flex-wrap justify-center gap-6">
          {filteredProfiles.map((profile, i) => (
            <a 
              key={i}
              href={`profiles/${profile.link}`}
              className="w-full sm:w-[calc(50%-12px)] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)] xl:w-[calc(20%-19.2px)] bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-lg transition-all hover:shadow-blue-900/30 hover:translate-y-[-4px] flex flex-col cursor-pointer"
            >
              <div className="relative pb-[100%]">
                <img 
                  src={profile.image} 
                  alt={profile.name} 
                  className="absolute inset-0 h-full w-full object-cover transition-transform hover:scale-105"
                />
              </div>
              
              <div className="p-4 flex-grow">
                <h3 className="font-semibold text-lg mb-1 text-gray-100 truncate">{profile.name}</h3>
              </div>
            </a>
          ))}
        </div>
        
        {/* Message si aucun résultat */}
        {filteredProfiles.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">Joueur non enregistré dans le ladder.</div>
          </div>
        )}
      </main>
      
      {/* Footer simple */}
      <footer className="bg-gray-800 border-t border-gray-700 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400 text-sm">
            © 2025 WPVG - Tous droits réservés XD ptdrrrrrrrrrrrr
          </div>
        </div>
      </footer>
    </div>
  );
}