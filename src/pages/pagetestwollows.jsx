import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const SummonerSpellsPage = () => {
  const { gameName, tagLine } = useParams();
  const [matchData, setMatchData] = useState(null);
  const [runesData, setRunesData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [expandedRuneDetails, setExpandedRuneDetails] = useState({});

  // Mapping des summoner spells
  const summonerSpellsMap = {
    1: { name: 'Cleanse', icon: 'https://ddragon.leagueoflegends.com/cdn/15.6.1/img/spell/SummonerBoost.png' },
    2: { name: 'Ghost', icon: 'https://ddragon.leagueoflegends.com/cdn/15.6.1/img/spell/SummonerHaste.png' },
    3: { name: 'Exhaust', icon: 'https://ddragon.leagueoflegends.com/cdn/15.6.1/img/spell/SummonerExhaust.png' },
    4: { name: 'Flash', icon: 'https://ddragon.leagueoflegends.com/cdn/15.6.1/img/spell/SummonerFlash.png' },
    6: { name: 'Heal', icon: 'https://ddragon.leagueoflegends.com/cdn/15.6.1/img/spell/SummonerHeal.png' },
    7: { name: 'Teleport', icon: 'https://ddragon.leagueoflegends.com/cdn/15.6.1/img/spell/SummonerTeleport.png' },
    11: { name: 'Smite', icon: 'https://ddragon.leagueoflegends.com/cdn/15.6.1/img/spell/SummonerSmite.png' },
    12: { name: 'Barrier', icon: 'https://ddragon.leagueoflegends.com/cdn/15.6.1/img/spell/SummonerBarrier.png' },
    14: { name: 'Ignite', icon: 'https://ddragon.leagueoflegends.com/cdn/15.6.1/img/spell/SummonerDot.png' },
    21: { name: 'Barrier', icon: 'https://ddragon.leagueoflegends.com/cdn/15.6.1/img/spell/SummonerBarrier.png' }
  };

  // Mapping des arbres de runes
  const runeTreesMap = {
    8000: { name: "Précision", icon: "perk-images/Styles/7201_Precision.png" },
    8100: { name: "Domination", icon: "perk-images/Styles/7200_Domination.png" },
    8200: { name: "Sorcellerie", icon: "perk-images/Styles/7202_Sorcery.png" },
    8300: { name: "Inspiration", icon: "perk-images/Styles/7203_Whimsy.png" },
    8400: { name: "Résolution", icon: "perk-images/Styles/7204_Resolve.png" }
  };

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode) {
      setDarkMode(savedMode === 'true');
    } else {
      // Vérifier si l'utilisateur préfère le thème sombre au niveau du système
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDarkMode);
    }
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch match data
        const matchResponse = await fetch(`https://walopvgapi-9c205847a91e.herokuapp.com/player/${gameName}/${tagLine}`);
        if (!matchResponse.ok) {
          throw new Error('Erreur lors de la récupération des données de match');
        }
        const matchData = await matchResponse.json();

        // Fetch runes data
        const runesResponse = await fetch('https://ddragon.leagueoflegends.com/cdn/15.6.1/data/en_US/runesReforged.json');
        if (!runesResponse.ok) {
          throw new Error('Erreur lors de la récupération des données de runes');
        }
        const runesData = await runesResponse.json();

        setMatchData(matchData);
        setRunesData(runesData);
        setError(null);
      } catch (err) {
        setError(err.message);
        setMatchData(null);
        setRunesData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [gameName, tagLine]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
  };

  const toggleRuneDetails = (matchIndex, participantIndex) => {
    const key = `${matchIndex}-${participantIndex}`;
    setExpandedRuneDetails(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Fonction pour trouver une rune par son ID
  const findRuneById = (runeId) => {
    if (!runesData) return null;

    for (const runeTree of runesData) {
      if (runeTree.id === runeId) {
        return {
          id: runeTree.id,
          name: runeTree.name,
          icon: runeTree.icon
        };
      }
      
      for (const slot of runeTree.slots) {
        const foundRune = slot.runes.find(rune => rune.id === runeId);
        if (foundRune) return foundRune;
      }
    }
    return null;
  };

  // Fonction pour obtenir le nom et l'icône de l'arbre de runes
  const getRuneTreeInfo = (treeId) => {
    return runeTreesMap[treeId] || { name: "Inconnu", icon: "" };
  };

  if (isLoading) {
    return (
      <div className={`flex justify-center items-center h-screen ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'}`}>
        <p className="text-xl">Chargement des données...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex justify-center items-center h-screen ${darkMode ? 'bg-red-900' : 'bg-red-100'}`}>
        <p className={`text-xl ${darkMode ? 'text-red-200' : 'text-red-600'}`}>{error}</p>
      </div>
    );
  }

  // Vérification des données
  if (!matchData?.data?.matchIds || matchData.data.matchIds.length === 0) {
    return (
      <div className={`flex justify-center items-center h-screen ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'}`}>
        <p className="text-xl">Aucune donnée de match disponible</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="container mx-auto p-4">
        {/* Toggle Dark Mode Button */}
        <button 
          onClick={toggleDarkMode} 
          className={`fixed top-4 right-4 p-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-yellow-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
          aria-label={darkMode ? "Activer mode jour" : "Activer mode nuit"}
        >
          {darkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          )}
        </button>

        <h1 className="text-2xl font-bold text-center mb-6">
          Summoner Spells et Runes de {gameName}#{tagLine}
        </h1>
        
        <div className="grid gap-4">
          {matchData.data.matchIds.map((match, matchIndex) => {
            // Vérification des participants
            if (!match.participants || match.participants.length === 0) {
              return (
                <div key={matchIndex} className={`text-center bg-opacity-80 p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  Pas de participants pour ce match
                </div>
              );
            }

            // Calculer la durée de la partie en minutes
            const gameMinutes = Math.floor((match.gameDuration || 0) / 60);
            const gameSeconds = match.gameDuration % 60;
            const formattedDuration = `${gameMinutes}:${gameSeconds.toString().padStart(2, '0')}`;

            return (
              <div 
                key={matchIndex} 
                className={`p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                  <h2 className="text-lg font-semibold">
                    Match {match.matchId.split('_')[1]} - {match.gameMode} 
                    <span className={`ml-2 text-sm ${match.winningTeam === 100 ? 'text-blue-500' : 'text-red-500'}`}>
                      (Team {match.winningTeam === 100 ? 'Blue' : 'Red'} Victory)
                    </span>
                  </h2>
                  <span className="text-sm mt-1 md:mt-0">
                    Durée: {formattedDuration} • {new Date(match.gameCreation).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {match.participants.map((participant, participantIndex) => {
                    // Vérification des summoner spells
                    const spell1 = participant.summonerSpells?.spell1 
                      ? summonerSpellsMap[participant.summonerSpells.spell1] 
                      : null;
                    const spell2 = participant.summonerSpells?.spell2 
                      ? summonerSpellsMap[participant.summonerSpells.spell2] 
                      : null;
                    
                    // Obtenir les infos des arbres de runes
                    const primaryTree = getRuneTreeInfo(participant.primaryRuneTree);
                    const secondaryTree = getRuneTreeInfo(participant.secondaryRuneTree);
                    
                    // Trouver la rune principale (keystone)
                    const keystone = findRuneById(participant.keystone);
                    
                    // Calculer la couleur de fond basée sur l'équipe (bleu/rouge)
                    const teamColorClass = participant.teamId === 100 
                      ? (darkMode ? 'bg-blue-900/20' : 'bg-blue-50') 
                      : (darkMode ? 'bg-red-900/20' : 'bg-red-50');
                    
                    // Calculer si le joueur a gagné
                    const hasWon = participant.win;
                    const resultClass = hasWon 
                      ? (darkMode ? 'border-green-700' : 'border-green-500') 
                      : (darkMode ? 'border-red-800' : 'border-red-500');

                    // Vérifier si les détails des runes sont affichés
                    const detailsKey = `${matchIndex}-${participantIndex}`;
                    const isRuneDetailsExpanded = expandedRuneDetails[detailsKey] || false;
                    
                    return (
                      <div 
                        key={participantIndex} 
                        className={`flex flex-col p-3 rounded-md space-y-2 border-l-4 ${resultClass} ${teamColorClass}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {participant.championName && (
                              <img 
                                src={`https://ddragon.leagueoflegends.com/cdn/15.6.1/img/champion/${participant.championName}.png`} 
                                alt="Champion"
                                className="w-8 h-8 rounded-full mr-2"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  return <div className={`w-8 h-8 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>;
                                }}
                              />
                            )}
                            <span className="font-medium truncate max-w-[150px]">
                              {participant.gameName || `Joueur ${participantIndex + 1}`}
                              <span className="text-xs ml-1 opacity-75">#{participant.tagLine}</span>
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {spell1 ? (
                              <div className="flex items-center">
                                <img 
                                  src={spell1.icon} 
                                  alt={spell1.name} 
                                  title={spell1.name}
                                  className="w-6 h-6 border rounded"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    return <div className={`w-6 h-6 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>;
                                  }}
                                />
                              </div>
                            ) : null}
                            {spell2 ? (
                              <div className="flex items-center">
                                <img 
                                  src={spell2.icon} 
                                  alt={spell2.name}
                                  title={spell2.name}
                                  className="w-6 h-6 border rounded"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    return <div className={`w-6 h-6 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>;
                                  }}
                                />
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {/* KDA Section */}
                        <div className={`flex items-center justify-between border-t py-2 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                          <span className="text-sm font-medium">KDA</span>
                          <div className="flex items-center">
                            <span className={`px-2 py-1 rounded text-sm font-medium ${darkMode ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-800'}`}>
                              {participant.kills || 0}
                            </span>
                            <span className="mx-1">/</span>
                            <span className={`px-2 py-1 rounded text-sm font-medium ${darkMode ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-800'}`}>
                              {participant.deaths || 0}
                            </span>
                            <span className="mx-1">/</span>
                            <span className={`px-2 py-1 rounded text-sm font-medium ${darkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-800'}`}>
                              {participant.assists || 0}
                            </span>
                            
                            {/* KDA Ratio */}
                            {participant.deaths !== undefined && (
                              <span className={`ml-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {participant.deaths > 0 
                                  ? `${(((participant.kills || 0) + (participant.assists || 0)) / participant.deaths).toFixed(2)} KDA` 
                                  : "Perfect KDA"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* CS Section */}
                        <div className={`flex items-center justify-between border-b py-2 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                          <span className="text-sm font-medium">CS</span>
                          <div className="flex items-center">
                            <span className={`px-2 py-1 rounded text-sm font-medium ${darkMode ? 'bg-yellow-900 text-yellow-100' : 'bg-yellow-100 text-yellow-800'}`}>
                              {(() => {
                                // Calculer le nombre total de CS (minionKilled + neutralMinionsKilled)
                                const minionKilled = participant.minionKilled || 0;
                                const neutralMinionsKilled = participant.neutralMinionsKilled || 0;
                                const totalCS = minionKilled + neutralMinionsKilled;
                                return totalCS;
                              })()}
                            </span>
                            
                            {/* Game Duration in Minutes */}
                            {match.gameDuration && (
                              <span className={`ml-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {(() => {
                                  // Calculer les minutes de jeu
                                  const gameMinutes = Math.floor((match.gameDuration || 0) / 60);
                                  
                                  // Calculer le nombre total de CS
                                  const minionKilled = participant.minionKilled || 0;
                                  const neutralMinionsKilled = participant.neutralMinionsKilled || 0;
                                  const totalCS = minionKilled + neutralMinionsKilled;
                                  
                                  // Calculer le CS par minute
                                  const csPerMin = gameMinutes > 0 
                                    ? (totalCS / gameMinutes).toFixed(1) 
                                    : 0;
                                  
                                  return `${csPerMin} CS/min (${minionKilled} lane + ${neutralMinionsKilled} jungle)`;
                                })()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Runes Section */}
                        <div className={`pt-2`}>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold">Runes</h3>
                            <button 
                              onClick={() => toggleRuneDetails(matchIndex, participantIndex)}
                              className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                            >
                              {isRuneDetailsExpanded ? 'Masquer détails' : 'Voir détails'}
                            </button>
                          </div>
                          
                          {/* Affichage simplifié des runes */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            {/* Arbre principal avec keystone */}
                            <div className={`flex items-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                              <div className="flex flex-col items-center mr-2">
                                <img 
                                  src={`https://ddragon.leagueoflegends.com/cdn/img/${primaryTree.icon}`} 
                                  alt={primaryTree.name} 
                                  title={primaryTree.name}
                                  className="w-6 h-6 mb-1"
                                />
                                <span className="text-xs">{primaryTree.name}</span>
                              </div>
                              
                              {keystone && (
                                <div className="flex flex-col items-center">
                                  <img 
                                    src={`https://ddragon.leagueoflegends.com/cdn/img/${keystone.icon}`} 
                                    alt={keystone.name}
                                    title={keystone.name}
                                    className="w-8 h-8 mb-1"
                                  />
                                  <span className="text-xs truncate max-w-[80px]">{keystone.name}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Arbre secondaire */}
                            <div className={`flex flex-col items-center p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                              <img 
                                src={`https://ddragon.leagueoflegends.com/cdn/img/${secondaryTree.icon}`} 
                                alt={secondaryTree.name}
                                title={secondaryTree.name}
                                className="w-6 h-6 mb-1"
                              />
                              <span className="text-xs">{secondaryTree.name}</span>
                            </div>
                          </div>
                          
                          {/* Affichage détaillé des runes */}
                          {isRuneDetailsExpanded && participant.perks && (
                            <div className={`p-2 rounded text-sm ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                              {/* Rune Stats */}
                              <div className="flex justify-between mb-2 border-b pb-1 border-gray-500">
                                <span className="font-medium">Stats</span>
                                <div className="flex gap-2">
                                  <span className={`px-1 rounded-sm ${darkMode ? 'bg-yellow-800' : 'bg-yellow-200'}`}>
                                    ATK: {participant.perks.statPerks?.offense || "N/A"}
                                  </span>
                                  <span className={`px-1 rounded-sm ${darkMode ? 'bg-blue-800' : 'bg-blue-200'}`}>
                                    FLEX: {participant.perks.statPerks?.flex || "N/A"}
                                  </span>
                                  <span className={`px-1 rounded-sm ${darkMode ? 'bg-green-800' : 'bg-green-200'}`}>
                                    DEF: {participant.perks.statPerks?.defense || "N/A"}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Primary Runes */}
                              {participant.perks.styles && participant.perks.styles.map((style, styleIndex) => {
                                const isMainTree = style.description === "primaryStyle";
                                return (
                                  <div key={styleIndex} className="mb-2">
                                    <div className={`flex items-center ${isMainTree ? 'text-yellow-500' : 'text-blue-500'} mb-1`}>
                                      <img 
                                        src={`https://ddragon.leagueoflegends.com/cdn/img/${getRuneTreeInfo(style.style).icon}`}
                                        alt=""
                                        className="w-4 h-4 mr-1"
                                      />
                                      <span className="font-medium text-xs">
                                        {isMainTree ? "Principale" : "Secondaire"}
                                      </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-4 gap-1">
                                      {style.selections && style.selections.map((selection, selectionIndex) => {
                                        const rune = findRuneById(selection.perk);
                                        
                                        if (!rune) return null;
                                        
                                        return (
                                          <div key={selectionIndex} className="flex flex-col items-center">
                                            <img 
                                              src={`https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`}
                                              alt={rune.name}
                                              title={rune.name}
                                              className="w-6 h-6 mb-1"
                                            />
                                            {selection.var1 > 0 && (
                                              <span className="text-xs">
                                                {selection.var1}
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SummonerSpellsPage;