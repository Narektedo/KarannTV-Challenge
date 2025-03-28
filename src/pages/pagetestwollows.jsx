import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const SummonerSpellsPage = () => {
  const { gameName, tagLine } = useParams();
  const [matchData, setMatchData] = useState(null);
  const [runesData, setRunesData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [expandedMatches, setExpandedMatches] = useState({});
  const [playerData, setPlayerData] = useState(null);

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
        // Fetch player data
        const playerResponse = await fetch(`https://walopvgapi-9c205847a91e.herokuapp.com/player/${gameName}/${tagLine}`);
        if (!playerResponse.ok) {
          throw new Error('Erreur lors de la récupération des données du joueur');
        }
        const responseData = await playerResponse.json();
        
        // Log the response to see its structure
        console.log('API Response:', responseData);
        
        // Process the response properly
        setMatchData(responseData);
        
        // Check if the response structure matches what we expect
        const processedPlayerData = processPlayerData(responseData);
        setPlayerData(processedPlayerData);
        
        // Fetch runes data
        const runesResponse = await fetch('https://ddragon.leagueoflegends.com/cdn/15.6.1/data/en_US/runesReforged.json');
        if (!runesResponse.ok) {
          throw new Error('Erreur lors de la récupération des données de runes');
        }
        const runesData = await runesResponse.json();
        
        setRunesData(runesData);
        setError(null);
      } catch (err) {
        setError(err.message);
        setPlayerData(null);
        setMatchData(null);
        setRunesData(null);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchData();
  }, [gameName, tagLine]);

  // Fonction pour vérifier et traiter les données du joueur
  const processPlayerData = (data) => {
    console.log('Processing data:', data);
    
    // Si les données sont directement dans le JSON
    if (data.summonerInfo || data.rankInfo) {
      return {
        summonerInfo: data.summonerInfo || {},
        rankInfo: data.rankInfo || []
      };
    }
    
    // Si les données sont dans un sous-objet 'data'
    if (data.data) {
      if (data.data.summonerInfo || data.data.rankInfo) {
        return {
          summonerInfo: data.data.summonerInfo || {},
          rankInfo: data.data.rankInfo || []
        };
      }
      
      // Assume summonerInfo might be in another place
      return data.data;
    }
    
    // Dernier recours : retourner l'objet entier
    return { 
      summonerInfo: { 
        summonerLevel: 0,
        profileIconId: 1
      },
      rankInfo: []
    };
  };

  // Fonction pour rendre le rang du joueur
  const renderRankInfo = (queueType, rankData) => {
    if (!rankData) return (
      <div className={`flex flex-col items-center p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div className="text-sm font-medium mb-1">{queueType}</div>
        <div className="text-xs">Non classé</div>
      </div>
    );
    
    // Déterminer l'icône de rang
    const tierLower = rankData.tier.toLowerCase();
    const rankIcon = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${tierLower}.png`;
    
    // Calculer le winrate
    const totalGames = rankData.wins + rankData.losses;
    const winRate = totalGames > 0 ? Math.round((rankData.wins / totalGames) * 100) : 0;
    
    // Déterminer la couleur de winrate
    const winRateColorClass = winRate >= 55 ? 'text-green-500' : 
                             winRate >= 50 ? 'text-blue-500' : 
                             winRate >= 45 ? 'text-yellow-500' : 'text-red-500';
    
    return (
      <div className={`flex flex-col p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <div className="flex items-center mb-2">
          <img 
            src={rankIcon} 
            alt={rankData.tier} 
            className="w-10 h-10 mr-2"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div>
            <div className="font-medium">{queueType}</div>
            <div className="text-sm">
              {rankData.tier} {rankData.rank} {rankData.leaguePoints} LP
            </div>
          </div>
        </div>
        
        {/* Graphique de winrate */}
        <div className="w-full mt-1">
          <div className="flex justify-between text-xs mb-1">
            <span>{rankData.wins}W {rankData.losses}L</span>
            <span className={winRateColorClass}>{winRate}%</span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2 dark:bg-gray-700">
            <div 
              className={`h-2 rounded-full ${winRate >= 50 ? 'bg-blue-500' : 'bg-red-500'}`} 
              style={{ width: `${winRate}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
  };

  const toggleMatchDetails = (matchIndex) => {
    setExpandedMatches(prev => ({
      ...prev,
      [matchIndex]: !prev[matchIndex]
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

  // Fonction pour déterminer le joueur adverse basé sur le rôle
  const findOpponentChampion = (match, currentPlayerID) => {
    // Trouver le joueur actuel
    const currentPlayer = match.participants.find(p => 
      p.gameName?.toLowerCase() === gameName.toLowerCase() && 
      p.tagLine?.toLowerCase() === tagLine.toLowerCase()
    );
    
    if (!currentPlayer || !currentPlayer.teamPosition) return null;
    
    // Trouver le joueur adverse avec la même position mais dans l'équipe opposée
    const opponentTeamId = currentPlayer.teamId === 100 ? 200 : 100;
    const opponent = match.participants.find(p => 
      p.teamId === opponentTeamId && 
      p.teamPosition === currentPlayer.teamPosition
    );
    
    return opponent;
  };

  // Fonction pour rendre la ligne de résumé d'un match pour le joueur consulté
  const renderMatchSummary = (match, matchIndex) => {
    // Trouver le joueur consulté
    const player = match.participants.find(p => 
      p.gameName?.toLowerCase() === gameName.toLowerCase() && 
      p.tagLine?.toLowerCase() === tagLine.toLowerCase()
    );
    
    if (!player) return null;
    
    // Trouver l'adversaire
    const opponent = findOpponentChampion(match, player);
    
    // Calculer si le joueur a gagné
    const hasWon = player.win;
    
    // Couleur basée sur la victoire/défaite
    const resultColorClass = hasWon 
      ? (darkMode ? 'bg-blue-900/30' : 'bg-blue-100') 
      : (darkMode ? 'bg-red-900/30' : 'bg-red-100');
    
    const resultBorderClass = hasWon 
      ? (darkMode ? 'border-blue-700' : 'border-blue-500') 
      : (darkMode ? 'border-red-800' : 'border-red-500');

    // Calculer le nombre total de CS
    const minionKilled = player.minionKilled || 0;
    const neutralMinionsKilled = player.neutralMinionsKilled || 0;
    const totalCS = minionKilled + neutralMinionsKilled;
    
    // Calculer les minutes de jeu et CS/min
    const gameMinutes = Math.floor((match.gameDuration || 0) / 60);
    const csPerMin = gameMinutes > 0 ? (totalCS / gameMinutes).toFixed(1) : 0;
    
    // Calculer le KDA
    const kda = player.deaths > 0 
      ? (((player.kills || 0) + (player.assists || 0)) / player.deaths).toFixed(2)
      : "Perfect";

    // Vérification des summoner spells
    const spell1 = player.summonerSpells?.spell1 
      ? summonerSpellsMap[player.summonerSpells.spell1] 
      : null;
    const spell2 = player.summonerSpells?.spell2 
      ? summonerSpellsMap[player.summonerSpells.spell2] 
      : null;
      
    // Obtenir la keystone
    const keystone = findRuneById(player.keystone);
    
    // Obtenir toutes les runes du joueur
    const runesSelections = [];
    if (player.perks && player.perks.styles) {
      player.perks.styles.forEach(style => {
        if (style.selections) {
          style.selections.forEach(selection => {
            const rune = findRuneById(selection.perk);
            if (rune) runesSelections.push(rune);
          });
        }
      });
    }

    return (
      <div className={`${resultColorClass} border-l-4 ${resultBorderClass} rounded-md mb-2`}>
        <div className="flex flex-row items-center p-3 justify-between">
          {/* Date et durée du match */}
          <div className="w-1/12 text-xs">
            <div>{new Date(match.gameCreation).toLocaleDateString()}</div>
            <div>{`${gameMinutes}:${String(match.gameDuration % 60).padStart(2, '0')}`}</div>
            <div className={hasWon ? (darkMode ? 'text-blue-300' : 'text-blue-600') : (darkMode ? 'text-red-300' : 'text-red-600')}>
              {hasWon ? 'Victoire' : 'Défaite'}
            </div>
          </div>
          
          {/* Champion du joueur */}
          <div className="w-1/5 flex items-center">
            <div className="relative mr-2">
              {player.championName && (
                <img 
                  src={`https://ddragon.leagueoflegends.com/cdn/15.6.1/img/champion/${player.championName}.png`} 
                  alt="Champion"
                  className="w-12 h-12 rounded"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
              {player.championLevel && (
                <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-800'}`}>
                  {player.championLevel}
                </div>
              )}
            </div>
            <div>
              <div className="font-medium">{player.championName || "Unknown"}</div>
              <div className="text-xs">{player.teamPosition || "Unknown Role"}</div>
            </div>
          </div>
          
          {/* KDA + CS */}
          <div className="w-1/5 flex flex-col">
            <div className="flex items-center">
              <span className={`px-1 py-0 rounded text-xs font-medium ${darkMode ? 'bg-green-900' : 'bg-green-200'}`}>
                {player.kills || 0}
              </span>
              <span className="mx-0.5">/</span>
              <span className={`px-1 py-0 rounded text-xs font-medium ${darkMode ? 'bg-red-900' : 'bg-red-200'}`}>
                {player.deaths || 0}
              </span>
              <span className="mx-0.5">/</span>
              <span className={`px-1 py-0 rounded text-xs font-medium ${darkMode ? 'bg-blue-900' : 'bg-blue-200'}`}>
                {player.assists || 0}
              </span>
              <span className="text-xs ml-1">
                {kda} KDA
              </span>
            </div>
            <div className="flex items-center mt-1">
              <span className={`px-1 py-0 rounded text-xs font-medium ${darkMode ? 'bg-yellow-900' : 'bg-yellow-200'}`}>
                {totalCS}
              </span>
              <span className="text-xs ml-1">
                {csPerMin} cs/m
              </span>
            </div>
          </div>
          
          {/* Spells + Runes */}
          <div className="w-1/5 flex items-center">
            <div className="space-x-1 mr-2">
              {spell1 && (
                <img 
                  src={spell1.icon} 
                  alt={spell1.name} 
                  title={spell1.name}
                  className="w-[30px] h-[30px] rounded"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
              {spell2 && (
                <img 
                  src={spell2.icon} 
                  alt={spell2.name}
                  title={spell2.name}
                  className="w-[30px] h-[30px] rounded"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
            </div>
            <div className="flex space-x-1">
              {runesSelections.slice(0, 4).map((rune, idx) => (
                <img 
                  key={idx}
                  src={`https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`}
                  alt={rune.name}
                  title={rune.name}
                  className={idx === 0 ? "w-7 h-7" : "w-5 h-5"}
                />
              ))}
            </div>
          </div>
          
          {/* Champion adverse */}
          <div className="w-1/5 flex items-center">
            {opponent ? (
              <>
                <div className="mr-2">
                  <div className="font-medium">VS</div>
                  <div className="text-xs">{opponent.teamPosition || "Unknown Role"}</div>
                </div>
                <div className="relative">
                  {opponent.championName && (
                    <img 
                      src={`https://ddragon.leagueoflegends.com/cdn/15.6.1/img/champion/${opponent.championName}.png`} 
                      alt="Opponent Champion"
                      className="w-12 h-12 rounded"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  {opponent.championLevel && (
                    <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-800'}`}>
                      {opponent.championLevel}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-sm italic">Pas d'adversaire direct</div>
            )}
          </div>
          
          {/* Bouton pour voir les détails */}
          <div className="w-1/12 flex justify-center">
            <button 
              onClick={() => toggleMatchDetails(matchIndex)}
              className={`px-3 py-1 rounded-full text-sm ${
                darkMode 
                  ? (expandedMatches[matchIndex] ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-700 hover:bg-gray-600') 
                  : (expandedMatches[matchIndex] ? 'bg-gray-300 hover:bg-gray-200' : 'bg-gray-200 hover:bg-gray-300')
              }`}
            >
              {expandedMatches[matchIndex] ? 'Masquer' : 'Détails'}
            </button>
          </div>
        </div>
        
        {/* Section détaillée (dépliable) */}
        {expandedMatches[matchIndex] && (
          <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            {/* Titre avec le mode de jeu et ID du match */}
            <div className="text-center mb-3">
              <h2 className="text-lg font-bold">
                Match {match.matchId.split('_')[1]} - {match.gameMode}
              </h2>
              <div className="text-sm mt-1">
                Durée: {`${gameMinutes}:${String(match.gameDuration % 60).padStart(2, '0')}`} • {new Date(match.gameCreation).toLocaleDateString()}
              </div>
            </div>
            
            {/* Affichage des équipes */}
            <div className="space-y-4">
              {/* Équipe A (100) */}
              <div>
                <h3 className={`font-semibold mb-2 flex items-center`}>
                  <span className={match.winningTeam === 100 ? (darkMode ? 'text-blue-300' : 'text-blue-600') : (darkMode ? 'text-red-300' : 'text-red-600')}>
                    {match.winningTeam === 100 ? "Victoire" : "Défaite"}
                  </span>
                  {match.winningTeam === 100 && (
                    <span className="ml-2">👑</span>
                  )}
                </h3>
                <div className="space-y-1">
                  {match.participants
                    .filter(p => p.teamId === 100)
                    .map((participant, participantIndex) => renderPlayerCard(participant, match, matchIndex, participantIndex))}
                </div>
              </div>
              
              {/* Équipe B (200) */}
              <div>
                <h3 className={`font-semibold mb-2 flex items-center`}>
                  <span className={match.winningTeam === 200 ? (darkMode ? 'text-blue-300' : 'text-blue-600') : (darkMode ? 'text-red-300' : 'text-red-600')}>
                    {match.winningTeam === 200 ? "Victoire" : "Défaite"}
                  </span>
                  {match.winningTeam === 200 && (
                    <span className="ml-2">👑</span>
                  )}
                </h3>
                <div className="space-y-1">
                  {match.participants
                    .filter(p => p.teamId === 200)
                    .map((participant, participantIndex) => renderPlayerCard(participant, match, matchIndex, match.participants.filter(p => p.teamId === 100).length + participantIndex))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Fonction pour rendre la carte d'un joueur (dans la vue détaillée)
  const renderPlayerCard = (participant, match, matchIndex, participantIndex) => {
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
    
    // Calculer si le joueur a gagné
    const hasWon = participant.win;
    
    // Couleur basée sur la victoire/défaite et non sur l'équipe
    const resultColorClass = hasWon 
      ? (darkMode ? 'bg-blue-900/30' : 'bg-blue-100') 
      : (darkMode ? 'bg-red-900/30' : 'bg-red-100');
    
    const resultBorderClass = hasWon 
      ? (darkMode ? 'border-blue-700' : 'border-blue-500') 
      : (darkMode ? 'border-red-800' : 'border-red-500');

    // Calculer le nombre total de CS
    const minionKilled = participant.minionKilled || 0;
    const neutralMinionsKilled = participant.neutralMinionsKilled || 0;
    const totalCS = minionKilled + neutralMinionsKilled;
    
    // Calculer les minutes de jeu et CS/min
    const gameMinutes = Math.floor((match.gameDuration || 0) / 60);
    const csPerMin = gameMinutes > 0 ? (totalCS / gameMinutes).toFixed(1) : 0;
    
    // Calculer le KDA
    const kda = participant.deaths > 0 
      ? (((participant.kills || 0) + (participant.assists || 0)) / participant.deaths).toFixed(2)
      : "Perfect";
      
    // Obtenir toutes les runes du joueur
    const runesSelections = [];
    if (participant.perks && participant.perks.styles) {
      participant.perks.styles.forEach(style => {
        if (style.selections) {
          style.selections.forEach(selection => {
            const rune = findRuneById(selection.perk);
            if (rune) runesSelections.push(rune);
          });
        }
      });
    }

    // Mettre en évidence le joueur consulté
    const isCurrentPlayer = participant.gameName?.toLowerCase() === gameName.toLowerCase() && 
                            participant.tagLine?.toLowerCase() === tagLine.toLowerCase();
    const highlightClass = isCurrentPlayer ? (darkMode ? 'bg-yellow-900/20' : 'bg-yellow-100/50') : '';

    return (
      <div 
        key={participantIndex} 
        className={`flex flex-row items-center p-2 mb-1 rounded-md ${resultColorClass} border-l-4 ${resultBorderClass} ${highlightClass}`}
      >
        {/* Champion + Pseudo */}
        <div className="w-1/4 flex items-center">
          {participant.championName && (
            <img 
              src={`https://ddragon.leagueoflegends.com/cdn/15.6.1/img/champion/${participant.championName}.png`} 
              alt="Champion"
              className="w-10 h-10 rounded mr-2 flex-shrink-0"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          <div className="flex flex-col overflow-hidden">
            <span className={`font-medium truncate w-full ${isCurrentPlayer ? 'font-bold' : ''}`}>
              {participant.gameName || `Joueur ${participantIndex + 1}`}
              {isCurrentPlayer && <span className="ml-1 text-xs">(Vous)</span>}
            </span>
            <span className="text-xs opacity-75">#{participant.tagLine}</span>
          </div>
        </div>

        {/* KDA + CS + Spells */}
        <div className="w-1/3 flex items-center space-x-4 flex-shrink-0">
          {/* KDA */}
          <div className="flex items-center w-50">
            <span className={`px-1 py-0 rounded text-[15px] font-medium`}>
              {participant.kills || 0}
            </span>
            <span className="mx-0.5">/</span>
            <span className={`px-1 py-0 rounded text-[15px] font-medium ${darkMode ? 'text-red-900' : 'text-red-900'}`}>
              {participant.deaths || 0}
            </span>
            <span className="mx-0.5">/</span>
            <span className={`px-1 py-0 rounded text-[15px] font-medium`}>
              {participant.assists || 0}
            </span>
            <span className="text-[15px] ml-1">
              {kda} KDA
            </span>
          </div>

          {/* CS */}
          <div className="flex items-center w-30">
            <div className='w-10'>
              <span className={`px-1 py-0 rounded text-[15px] items-center font-medium ${darkMode ? 'bg-yellow-900' : 'bg-yellow-200'}`}>
                {totalCS}
              </span>
            </div>
            <span className="text-[15px] ml-1">
              {csPerMin}/min
            </span>
          </div>

          {/* Spells */}
          <div className="flex space-x-1">
            {spell1 && (
              <img 
                src={spell1.icon} 
                alt={spell1.name} 
                title={spell1.name}
                className="w-[30px] h-[30px] rounded"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            {spell2 && (
              <img 
                src={spell2.icon} 
                alt={spell2.name}
                title={spell2.name}
                className="w-[30px] h-[30px] rounded"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
          </div>
        </div>

        {/* Runes complètes */}
        <div className="w-5/12 flex items-center justify-end gap-1 flex-shrink-0">
          {/* Toutes les runes */}
          {runesSelections.map((rune, idx) => (
            <img 
              key={idx}
              src={`https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`}
              alt={rune.name}
              title={rune.name}
              className={idx === 0 ? "w-7 h-7" : "w-5 h-5"}
            />
          ))}
        </div>
      </div>
    );
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
      <div className="container mx-auto px-2 py-4 max-w-full">
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

        {/* Conteneur principal avec flex-col pour garantir que tout s'affiche en colonne */}
        <div className="flex flex-col w-full">
          {/* Section 1: Informations du joueur */}
          <div className={`w-full mb-8 p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <p>Chargement des informations du joueur...</p>
              </div>
            ) : playerData ? (
              <div>
                {/* Debug info */}
                {process.env.NODE_ENV === 'development' && (
                  <details className="mb-4 p-2 bg-gray-100 dark:bg-gray-700 rounded">
                    <summary className="cursor-pointer">Debug Data</summary>
                    <pre className="text-xs overflow-auto mt-2">
                      {JSON.stringify({playerData, matchData: matchData?.data ? 'Data exists' : 'No data'}, null, 2)}
                    </pre>
                  </details>
                )}
      
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  {/* Icône et niveau du joueur */}
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <img 
                        src={`https://ddragon.leagueoflegends.com/cdn/15.6.1/img/profileicon/${playerData.summonerInfo.profileIconId || 1}.png`} 
                        alt="Profile Icon"
                        className="w-24 h-24 rounded-lg border-2 border-gray-400"
                        onError={(e) => {
                          e.target.src = `https://ddragon.leagueoflegends.com/cdn/15.6.1/img/profileicon/1.png`;
                        }}
                      />
                      <div className={`absolute bottom-0 right-0 px-2 py-1 text-xs font-bold rounded-tl-lg ${darkMode ? 'bg-blue-800 text-white' : 'bg-blue-500 text-white'}`}>
                        {playerData.summonerInfo.summonerLevel || "??"}
                      </div>
                    </div>
                    <h1 className="text-xl font-bold mt-2">{gameName}</h1>
                    <p className="text-sm opacity-75">#{tagLine}</p>
                  </div>
                  
                  {/* Ranks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full md:flex-1">
                    {/* SoloQ Rank */}
                    {renderRankInfo("Solo/Duo", (playerData.rankInfo || []).find(r => r.queueType === "RANKED_SOLO_5x5"))}
                    
                    {/* Flex Rank */}
                    {renderRankInfo("Flex 5v5", (playerData.rankInfo || []).find(r => r.queueType === "RANKED_FLEX_SR"))}
                  </div>
                  
                  {/* Stats Générales */}
                  <div className="flex flex-col w-full md:w-1/3 gap-2">
                    <h2 className="text-lg font-semibold">Statistiques</h2>
                    
                    {/* Calculer les stats globales à partir des matchs disponibles */}
                    {(() => {
                      if (!matchData?.data?.matchIds || matchData.data.matchIds.length === 0) {
                        return <p className="text-sm italic">Aucun match récent</p>;
                      }
                      
                      let wins = 0;
                      let kills = 0;
                      let deaths = 0;
                      let assists = 0;
                      let totalMatches = 0;
                      
                      matchData.data.matchIds.forEach(match => {
                        const player = match.participants?.find(p => 
                          p.gameName?.toLowerCase() === gameName.toLowerCase() && 
                          p.tagLine?.toLowerCase() === tagLine.toLowerCase()
                        );
                        
                        if (player) {
                          totalMatches++;
                          if (player.win) wins++;
                          kills += player.kills || 0;
                          deaths += player.deaths || 0;
                          assists += player.assists || 0;
                        }
                      });
                      
                      const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
                      const kda = deaths > 0 ? ((kills + assists) / deaths).toFixed(2) : "Perfect";
                      
                      return (
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Matchs récents: {wins}W {totalMatches - wins}L</span>
                              <span className={
                                winRate >= 55 ? 'text-green-500' : 
                                winRate >= 50 ? 'text-blue-500' : 
                                winRate >= 45 ? 'text-yellow-500' : 'text-red-500'
                              }>{winRate}%</span>
                            </div>
                            <div className="w-full bg-gray-300 rounded-full h-2 dark:bg-gray-700">
                              <div 
                                className={`h-2 rounded-full ${winRate >= 50 ? 'bg-blue-500' : 'bg-red-500'}`} 
                                style={{ width: `${winRate}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sm">KDA moyen:</span>
                            <span className="text-sm font-medium">
                              {(kills / totalMatches).toFixed(1)} / {(deaths / totalMatches).toFixed(1)} / {(assists / totalMatches).toFixed(1)}
                              <span className="ml-2">({kda})</span>
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-6">
                <p>Aucune information disponible pour ce joueur.</p>
              </div>
            )}
          </div>
          
          {/* Section 2: Titre de l'historique */}
          <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-300'} pb-2`}>
            Historique des matchs
          </h2>

          {/* Section 3: Liste des matchs */}
          <div className="grid gap-2 w-full">
            {matchData.data.matchIds.map((match, matchIndex) => {
              // Vérification des participants
              if (!match.participants || match.participants.length === 0) {
                return (
                  <div key={matchIndex} className={`text-center bg-opacity-80 p-4 rounded-lg shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    Pas de participants pour ce match
                  </div>
                );
              }

              return renderMatchSummary(match, matchIndex);
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummonerSpellsPage;