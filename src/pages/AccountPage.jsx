import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import LoadingIndicator from './LoadingIndicator.jsx'; // Ajustez le chemin selon votre structure de projet
import Header from '../components/Header';


const SummonerSpellsPage = () => {
  const { gameName, tagLine } = useParams();
  const [matchData, setMatchData] = useState(null);
  const [runesData, setRunesData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [expandedMatches, setExpandedMatches] = useState({});
  const [playerData, setPlayerData] = useState(null);
  const [isPreloading, setIsPreloading] = useState(false);
  const [spectatorData, setSpectatorData] = useState(null);
  const [isLoadingSpectator, setIsLoadingSpectator] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  

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
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDarkMode);
  }
  
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // 1. Essayer d'abord de récupérer les données du joueur
      const playerResponse = await fetch(`https://walopvgapi-9c205847a91e.herokuapp.com/player/${gameName}/${tagLine}`);
      const responseData = await playerResponse.json();
      
      // Vérifier si la réponse contient des données valides ou est vide
      const isPlayerDataEmpty = !responseData || 
                               responseData.length === 0 || 
                               (typeof responseData === 'object' && Object.keys(responseData).length === 0) ||
                               responseData.error;
      
      if (isPlayerDataEmpty) {
        // Si le joueur n'existe pas, utiliser la même fonction que le bouton refresh
        console.log("Le joueur n'existe pas dans la base de données. Lancement du pré-chargement...");
        await refreshPlayerData(true); // Passer true pour indiquer que c'est un chargement initial
      } else {
        // Si le joueur existe déjà, utiliser les données directement
        console.log('API Response (joueur existant):', responseData);
        setMatchData(responseData);
        
        const processedPlayerData = processPlayerData(responseData);
        setPlayerData(processedPlayerData);
        
        // Récupérer les données de spectateur avec le PUUID extrait
        const puuid = extractPuuid(responseData);
        if (puuid) {
          fetchSpectatorData(puuid);
        }
        
        // Dans tous les cas, récupérer les données de runes
        const runesResponse = await fetch('https://ddragon.leagueoflegends.com/cdn/15.6.1/data/en_US/runesReforged.json');
        if (!runesResponse.ok) {
          throw new Error('Erreur lors de la récupération des données de runes');
        }
        const runesData = await runesResponse.json();
        setRunesData(runesData);
        
        setError(null);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err);
      setError(err.message);
      setPlayerData(null);
      setMatchData(null);
      setRunesData(null);
      setSpectatorData(null);
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();
}, [gameName, tagLine]);

  const extractPuuid = (data) => {
    // Vérifie d'abord si le PUUID est directement au niveau racine
    if (data && data.puuid) {
      console.log("PUUID trouvé au niveau racine:", data.puuid);
      return data.puuid;
    }
    
    // Vérifie ensuite dans summonerInfo
    if (data && data.summonerInfo && data.summonerInfo.puuid) {
      console.log("PUUID trouvé dans summonerInfo:", data.summonerInfo.puuid);
      return data.summonerInfo.puuid;
    }
    
    // Vérifie dans data.data.summonerInfo
    if (data && data.data && data.data.summonerInfo && data.data.summonerInfo.puuid) {
      console.log("PUUID trouvé dans data.data.summonerInfo:", data.data.summonerInfo.puuid);
      return data.data.summonerInfo.puuid;
    }
    
    // Si on ne trouve pas de PUUID, on renvoie null
    console.warn("Aucun PUUID trouvé dans les données:", data);
    return null;
  };

  const refreshPlayerData = async () => {
    try {
      setIsRefreshing(true);
      
      // 1. Appel à l'endpoint info pour mettre à jour les infos du joueur
      const infoResponse = await fetch(`https://walopvgapi-9c205847a91e.herokuapp.com/info/${gameName}/${tagLine}`);
      if (!infoResponse.ok) {
        throw new Error("Erreur lors de l'actualisation des infos du joueur");
      }
      
      console.log("Infos du joueur actualisées avec succès");
      
      // 2. Appel à l'endpoint matchs pour mettre à jour l'historique des matchs
      const matchsResponse = await fetch(`https://walopvgapi-9c205847a91e.herokuapp.com/matchs/${gameName}/${tagLine}`);
      if (!matchsResponse.ok) {
        throw new Error("Erreur lors de l'actualisation des matchs du joueur");
      }
      
      console.log("Matchs du joueur actualisés avec succès");
      
      // 3. Attente pour s'assurer que les données sont bien enregistrées dans la DB
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 4. Récupération des données actualisées du joueur
      const refreshedPlayerResponse = await fetch(`https://walopvgapi-9c205847a91e.herokuapp.com/player/${gameName}/${tagLine}`);
      if (!refreshedPlayerResponse.ok) {
        throw new Error("Erreur lors de la récupération des données actualisées du joueur");
      }
      
      const refreshedData = await refreshedPlayerResponse.json();
      console.log('Données joueur après actualisation:', refreshedData);
      
      // 5. Mise à jour des états avec les nouvelles données
      setMatchData(refreshedData);
      
      // Traiter les données récupérées
      const processedPlayerData = processPlayerData(refreshedData);
      setPlayerData(processedPlayerData);
      
      // 6. Récupérer les données de spectateur avec le PUUID extrait
      const puuid = extractPuuid(refreshedData);
      if (puuid) {
        fetchSpectatorData(puuid);
      }
      
      // Réinitialiser les états de matchs développés
      setExpandedMatches({});
      
      setError(null);
    } catch (err) {
      console.error("Erreur lors de l'actualisation des données:", err);
      setError(err.message);
      alert(`Erreur lors de l'actualisation : ${err.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

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

  const getWinrateColor = (winRate, darkMode = true) => {
    // Palette simplifiée :
    // En dessous de 50% : rouge (de plus en plus intense)
    // Aux alentours de 50% : blanc neutre
    // Au-dessus de 50% : jaune/doré (de plus en plus intense)
    
    if (winRate >= 65) return darkMode ? 'text-yellow-300' : 'text-yellow-600'; // Doré très élevé
    if (winRate >= 60) return darkMode ? 'text-yellow-400' : 'text-yellow-500'; // Doré élevé
    if (winRate >= 55) return darkMode ? 'text-yellow-200' : 'text-yellow-400'; // Jaune doré
    if (winRate > 51) return darkMode ? 'text-yellow-100' : 'text-yellow-300'; // Jaune clair
    
    if (winRate >= 49 && winRate <= 51) return darkMode ? 'text-gray-100' : 'text-gray-800'; // Neutre (blanc)
    
    if (winRate >= 45) return darkMode ? 'text-red-300' : 'text-red-500'; // Rouge clair
    if (winRate >= 40) return darkMode ? 'text-red-400' : 'text-red-600'; // Rouge
    if (winRate >= 35) return darkMode ? 'text-red-500' : 'text-red-700'; // Rouge foncé
    return darkMode ? 'text-red-600' : 'text-red-800'; // Rouge très foncé pour les winrates très faibles
  };
  

// Fonction pour créer un graphique circulaire avec des arcs SVG
const CircularWinrateChart = ({ wins, losses, size = 80, strokeWidth = 8, darkMode = false }) => {
  const totalGames = wins + losses;
  if (totalGames === 0) return null;
  
  const winRate = Math.round((wins / totalGames) * 100);
  
  // Utiliser la nouvelle fonction pour déterminer la couleur
  const winRateColorClass = getWinrateColor(winRate, darkMode);
  
  // Calculer les dimensions
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculer les arcs pour les victoires et défaites
  const winsPercentage = wins / totalGames;
  
  return (
    <div className="flex flex-col items-center justify-center mt-3 mr-5">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Cercle pour les défaites (rouge) - cercle complet */}
        <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
          <circle 
            cx={size / 2} 
            cy={size / 2} 
            r={radius}
            fill="none"
            stroke={darkMode ? "#EF4444" : "#F87171"} 
            strokeWidth={strokeWidth}
          />
          
          {/* Cercle pour les victoires (bleu) - uniquement la portion des victoires */}
          <circle 
            cx={size / 2} 
            cy={size / 2} 
            r={radius}
            fill="none"
            stroke={darkMode ? "#3B82F6" : "#60A5FA"} 
            strokeWidth={strokeWidth}
            strokeDasharray={`${winsPercentage * circumference} ${circumference}`}
            transform={`rotate(-90 ${size/2} ${size/2})`}
            strokeLinecap="butt"
          />
        </svg>
        
        {/* Texte central (pourcentage) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold ${winRateColorClass}`}>{winRate}%</span>
        </div>
      </div>
      
      {/* Légende */}
      <div className="flex justify-between w-full mt-2 text-[15px]">
        <span className={darkMode ? "text-blue-400" : "text-blue-600"}>{wins}W</span>
        <span className={darkMode ? "text-red-400" : "text-red-600"}>{losses}L</span>
      </div>
    </div>
  );
};

// Fonction modifiée pour rendre le rang du joueur avec le graphique circulaire
const renderRankInfo = (queueType, rankData) => {
  if (!rankData) return (
    <div className={`flex flex-col items-center p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
      <div className="text-[24px] font-medium mb-1">{queueType}</div>
      <div className="text-[24px] ">Non classé</div>
    </div>
  );
  
  // Déterminer l'icône de rang
  const tierLower = rankData.tier.toLowerCase();
  const rankIcon = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${tierLower}.png`;
  
  return (
    <div className={`flex flex-col p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
      <div className="flex items-center mb-3">
        <img 
          src={rankIcon} 
          alt={rankData.tier} 
          className="w-[60px] h-[60px] mr-3"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <div className="flex-grow">
          <div className="font-medium text-[17px] ">{queueType}</div>
          <div className="text-[19px] ">
            {rankData.tier} {rankData.rank} {rankData.leaguePoints} LP
          </div>
        </div>
        
        {/* Graphique de winrate circulaire */}
        <CircularWinrateChart 
          wins={rankData.wins} 
          losses={rankData.losses} 
          darkMode={darkMode}
        />
      </div>
    </div>
  );
};

const fetchSpectatorData = async (puuid) => {
  if (!puuid) {
    console.error("Impossible de récupérer les données spectateur : PUUID non défini");
    setSpectatorData(null);
    setIsLoadingSpectator(false);
    return;
  }
  
  try {
    setIsLoadingSpectator(true);
    console.log("Récupération des données spectateur pour le PUUID:", puuid);
    
    const url = `https://walopvgapi-9c205847a91e.herokuapp.com/spectator/${puuid}`;
    console.log("URL de l'API spectateur:", url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log("Réponse de l'API spectateur:", data);
    setSpectatorData(data);
  } catch (err) {
    console.error("Erreur lors de la récupération des données de spectateur:", err);
    setSpectatorData(null);
  } finally {
    setIsLoadingSpectator(false);
  }
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
        {/* Indicateur de chargement */}
        <LoadingIndicator isLoading={isLoading} isPreloading={isPreloading} />

        <div className="flex flex-row items-center p-3 justify-between">
          <div className="w-1/12 text-xs text-left pl-1">
          {/* Date relative du match */}
          <div>
            {(() => {
              const matchDate = new Date(match.gameCreation);
              const now = new Date();
              const diffMs = now - matchDate;
              const diffMins = Math.floor(diffMs / 60000);
              const diffHours = Math.floor(diffMins / 60);
              const diffDays = Math.floor(diffHours / 24);
              const diffWeeks = Math.floor(diffDays / 7);
              const diffMonths = Math.floor(diffDays / 30);
              
              if (diffMins < 60) {
                return `Il y a ${diffMins} min`;
              } else if (diffHours < 24) {
                return `Il y a ${diffHours}h`;
              } else if (diffDays < 7) {
                return `Il y a ${diffDays}j`;
              } else if (diffWeeks < 4) {
                return `Il y a ${diffWeeks} sem`;
              } else {
                return `Il y a ${diffMonths} mois`;
              }
            })()}
          </div>
          {/* Durée du match */}
          <div>{`${gameMinutes}:${String(match.gameDuration % 60).padStart(2, '0')}`}</div>
          {/* Type de partie */}
          <div className="text-gray-400">
            {(() => {
              // Convertir le mode de jeu en format plus lisible
              const queueType = match.queueId || match.gameMode;
              switch(queueType) {
                case 400:
                case 430:
                case 'NORMAL':
                  return 'Normal';
                case 420:
                case 'CLASSIC':
                  return 'Solo/Duo';
                case 440:
                case 'RANKED_FLEX_SR':
                  return 'Flex 5v5';
                case 450:
                case 'ARAM':
                  return 'ARAM';
                case 700:
                case 'CLASH':
                  return 'Clash';
                case 1400:
                case 'URF':
                case 'ARURF':
                  return 'URF';
                default:
                  return match.gameMode || 'Autre';
              }
            })()}
          </div>
          {/* Résultat */}
          <div className={`mt-1 font-medium ${hasWon ? (darkMode ? 'text-blue-300' : 'text-blue-600') : (darkMode ? 'text-red-300' : 'text-red-600')}`}>
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
                  className="w-[60px] h-[60px] rounded"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
              {player.championLevel && (
                <div className={`absolute bottom-0 right-0 w-5 h-5 rounded flex items-center justify-center text-xs ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-800'}`}>
                  {player.championLevel}
                </div>
              )}
            </div>
            <div>
              <img src={`../../role/${player.teamPosition}.png`} alt="RoleIcon" className='w-[40px] h-[40px]'/>
            </div>
          </div>
          
          {/* KDA + CS */}
          <div className="w-50 flex flex-col">
            <div className={`p-2 h-fit rounded-md ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
              <div className="flex justify-between">
                {/* Premier conteneur: K/D/A et CS */}
                <div className="flex flex-col">
                  {/* K/D/A */}
                  <div className="flex items-center">
                    <span className={`px-1 py-0 rounded text-lg font-medium`}>
                      {player.kills || 0}
                    </span>
                    <span className="mx-0.5 text-gray-500">/</span>
                    <span className={`px-1 py-0 rounded text-lg font-medium ${darkMode ? 'text-red-600' : 'text-red-700'}`}>
                      {player.deaths || 0}
                    </span>
                    <span className="mx-0.5 text-gray-500">/</span>
                    <span className={`px-1 py-0 rounded text-lg font-medium`}>
                      {player.assists || 0}
                    </span>
                  </div>
                  {/* CS */}
                  <div className="flex items-center mt-1">
                    <span className={`px-1 py-0 rounded text-lg font-medium ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                      {totalCS} CS
                    </span>
                  </div>
                </div>
                
                {/* Deuxième conteneur: KDA calculé et CS/min */}
                <div className="flex flex-col">
                  {/* KDA calculé */}
                  <div className="flex items-center">
                    <span className="text-lg font-medium">
                      {kda} KDA
                    </span>
                  </div>
                  {/* CS/min */}
                  <div className="flex items-center mt-1">
                    <span className="text-lg">
                      {csPerMin}/min
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
         {/* Spells + Runes + Items */}
          <div className="w-1/4 flex flex-col ml-15">
            <div className={`p-2 rounded-md ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
              {/* Container principal en flexbox row */}
              <div className="flex justify-between">
                {/* Colonne gauche: Spells + Runes */}
                <div className="flex items-start">
                  {/* Summoner Spells */}
                  <div className="flex flex-col space-y-1 mr-2">
                    {spell1 && (
                      <img 
                        src={spell1.icon} 
                        alt={spell1.name} 
                        title={spell1.name}
                        className="w-[30px] h-[30px] rounded border border-gray-600"
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
                        className="w-[30px] h-[30px] rounded border border-gray-600"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                  
                  {/* Runes */}
                  <div className='flex flex-col space-y-1'>
                    <div className="flex space-x-1">
                      {runesSelections.slice(0, 4).map((rune, idx) => (
                        <img 
                          key={idx}
                          src={`https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`}
                          alt={rune.name}
                          title={rune.name}
                          className={idx === 0 ? "w-[30px] h-[30px] mt-1" : "w-[30px] h-[30px] mt-1"}
                        />
                      ))}
                    </div>
                    <div className="flex space-x-1">
                      {runesSelections.slice(4, 6).map((rune, idx) => (
                        <img 
                          key={idx + 4}
                          src={`https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`}
                          alt={rune.name}
                          title={rune.name}
                          className="w-[30px] h-[30px]" 
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Colonne droite: Items */}
                <div className="flex flex-wrap items-center gap-1 ml-2 max-w-[140px]">
                  {player.items && player.items.map((itemId, index) => {
                    if (itemId === 0) return (
                      <div 
                        key={index} 
                        className={`w-[30px] h-[30px] rounded ${index === 6 ? 'bg-yellow-800/30' : 'bg-gray-700/50'} border border-gray-600`}
                      />
                    );
                    
                    return (
                      <img 
                        key={index}
                        src={`https://ddragon.leagueoflegends.com/cdn/15.6.1/img/item/${itemId}.png`}
                        alt=""
                        title={`Item ID: ${itemId}`}
                        className="w-[30px] h-[30px] rounded border border-gray-600"
                        onError={(e) => {
                          e.target.src = '';
                          e.target.className = `w-[30px] h-[30px] rounded ${index === 6 ? 'bg-yellow-800/30' : 'bg-gray-700/50'} border border-gray-600`;
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {/* Champion adverse */}
          <div className="w-1/5 flex items-center justify-end ml-auto">
            {opponent ? (
              <div className="flex items-center">
                <div className="mr-2 text-right">
                  <div className="font-medium text-[20px]">VS</div>
                </div>
                <div className="relative">
                  {opponent.championName && (
                    <img
                      src={`https://ddragon.leagueoflegends.com/cdn/15.6.1/img/champion/${opponent.championName}.png`}
                      alt="Opponent Champion"
                      className="w-[60px] h-[60px] rounded"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm italic">No Info</div>
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
                  <span className={match.winningTeam === 100 ? (darkMode ? 'text-gray-300' : 'text-gray-600') : (darkMode ? 'text-gray-300' : 'text-gray-600')}>
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
                  <span className={match.winningTeam === 200 ? (darkMode ? 'text-gray-300' : 'text-gray-600') : (darkMode ? 'text-gray-300' : 'text-gray-600')}>
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

// Composant LiveGameSection complet avec toutes les modifications
const LiveGameSection = ({ spectatorData, isLoading, darkMode }) => {
  console.log("Données spectateur reçues dans LiveGameSection:", spectatorData);
  
  // État pour stocker la durée actuelle de la partie en secondes
  const [currentGameDuration, setCurrentGameDuration] = useState(0);
  
  // État pour stocker le mapping des IDs de champions
  const [championMap, setChampionMap] = useState({});
  // État pour indiquer si les données de champions sont chargées
  const [championsLoaded, setChampionsLoaded] = useState(false);
  
  // Charger les données de champions depuis l'API Riot au montage du composant
  useEffect(() => {
    const fetchChampionData = async () => {
      try {
        const response = await fetch('https://ddragon.leagueoflegends.com/cdn/15.6.1/data/en_US/champion.json');
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des données de champions');
        }
        
        const data = await response.json();
        
        // Créer un mapping des ID numériques vers les noms de champion
        const mapping = {};
        Object.values(data.data).forEach(champion => {
          mapping[champion.key] = champion.id;
        });
        
        console.log("Mapping de champions chargé:", mapping);
        setChampionMap(mapping);
        setChampionsLoaded(true);
      } catch (error) {
        console.error("Erreur lors du chargement des données de champions:", error);
        // Utiliser un mapping de secours en cas d'erreur (inclure quelques champions courants)
        setChampionMap({
          58: "Renekton",
          103: "Ahri",
          67: "Vayne",
          91: "Talon",
          157: "Yasuo",
          412: "Thresh"
          // Ajoutez d'autres champions couramment utilisés comme fallback
        });
        setChampionsLoaded(true);
      }
    };
    
    fetchChampionData();
  }, []);
  
  // Mettre à jour la durée de la partie en temps réel
  useEffect(() => {
    // Si aucune partie en cours ou chargement, pas besoin de timer
    if (isLoading || !spectatorData || !spectatorData.success || !spectatorData.data || !spectatorData.data.isInGame) {
      return;
    }
    
    const { gameInfo } = spectatorData.data;
    
    // Calculer la durée initiale en secondes
    let initialDuration = gameInfo.gameLength; // Durée en secondes retournée par l'API
    
    // Si gameLength semble incorrect ou n'est pas fourni, calculer depuis gameStartTime
    if (!initialDuration || initialDuration <= 0) {
      const gameStartTime = new Date(gameInfo.gameStartTime);
      const now = new Date();
      initialDuration = Math.floor((now - gameStartTime) / 1000); // Convertir en secondes
    }
    
    console.log("Durée initiale de la partie:", initialDuration, "secondes");
    setCurrentGameDuration(initialDuration);
    
    // Créer un interval pour mettre à jour la durée chaque seconde
    const intervalId = setInterval(() => {
      setCurrentGameDuration(prevDuration => prevDuration + 1);
    }, 1000);
    
    // Nettoyer l'interval lorsque le composant est démonté ou que les données changent
    return () => clearInterval(intervalId);
  }, [spectatorData, isLoading]);
  
  // Fonction pour formater la durée en minutes:secondes
  const formatGameDuration = (durationInSeconds) => {
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = durationInSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Fonction pour obtenir l'URL d'image du champion
  const getChampionImageUrl = (championId) => {
    // Si nous avons un mapping pour cet ID
    if (championMap[championId]) {
      return `https://ddragon.leagueoflegends.com/cdn/15.6.1/img/champion/${championMap[championId]}.png`;
    }
    
    // Si aucun mapping n'est trouvé
    console.warn(`Champion ID ${championId} non trouvé dans le mapping`);
    return `https://ddragon.leagueoflegends.com/cdn/15.6.1/img/champion/MonkeyKing.png`; // Une image par défaut
  };
  
  // Fonction pour extraire les informations de runes à partir des données de perks
  const extractRuneInfo = (perks) => {
    if (!perks || !perks.perkIds || !perks.perkStyle || !perks.perkSubStyle) {
      return {
        keystone: null,
        primaryRuneTree: null,
        secondaryRuneTree: null,
        runeIds: []
      };
    }
    
    return {
      keystone: perks.perkIds[0], // Premier perk = keystone
      primaryRuneTree: perks.perkStyle,
      secondaryRuneTree: perks.perkSubStyle,
      runeIds: perks.perkIds
    };
  };
  
  // Fonction pour obtenir le nom d'un style de rune à partir de son ID
  const getRuneStyleName = (styleId) => {
    const styleNames = {
      8000: "Precision",
      8100: "Domination",
      8200: "Sorcery",
      8300: "Inspiration",
      8400: "Resolve"
    };
    
    return styleNames[styleId] || String(styleId);
  };
  
  // Fonction pour obtenir l'URL de l'image d'un style de rune
  const getRuneStyleImageUrl = (styleId) => {
    const styleName = getRuneStyleName(styleId);
    return `https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/${styleName}.png`;
  };
  
  // Fonction pour obtenir le chemin d'image pour une rune spécifique en utilisant Community Dragon
  const getRuneImagePath = (runeId) => {
    // Mapping des IDs de runes vers leurs chemins dans Community Dragon
    const runePathsMap = {
      // Precision Keystones
      8005: "assets/ux/traiticons/precision/press-the-attack/presstheattack.png",
      8008: "assets/ux/traiticons/precision/lethal-tempo/lethaltempo.png",
      8021: "assets/ux/traiticons/precision/fleet-footwork/fleetfootwork.png",
      8010: "assets/ux/traiticons/precision/conqueror/conqueror.png",
      
      // Domination Keystones
      8112: "assets/ux/traiticons/domination/electrocute/electrocute.png",
      8124: "assets/ux/traiticons/domination/predator/predator.png",
      8128: "assets/ux/traiticons/domination/dark-harvest/darkharvest.png",
      9923: "assets/ux/traiticons/domination/hail-of-blades/hailofblades.png",
      
      // Sorcery Keystones
      8214: "assets/ux/traiticons/sorcery/summon-aery/summonaery.png",
      8229: "assets/ux/traiticons/sorcery/arcane-comet/arcanecomet.png",
      8230: "assets/ux/traiticons/sorcery/phase-rush/phaserush.png",
      
      // Resolve Keystones
      8437: "assets/ux/traiticons/resolve/grasp-of-the-undying/graspoftheundying.png",
      8439: "assets/ux/traiticons/resolve/veteran-aftershock/veteranaftershock.png",
      8465: "assets/ux/traiticons/resolve/guardian/guardian.png",
      
      // Inspiration Keystones
      8351: "assets/ux/traiticons/inspiration/glacial-augment/glacialaugment.png",
      8360: "assets/ux/traiticons/inspiration/unsealed-spellbook/unsealedspellbook.png",
      8369: "assets/ux/traiticons/inspiration/first-strike/firststrike.png",
    };
    
    return runePathsMap[runeId] || "";
  };
  
  // Mapping des IDs de keystones vers les URLs d'images Data Dragon
  const getKeystoneImageUrl = (keystoneId) => {
    const keystoneMap = {
      // Precision
      8005: "https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Precision/PressTheAttack/PressTheAttack.png",
      8008: "https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Precision/LethalTempo/LethalTempoTemp.png",
      8010: "https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Precision/Conqueror/Conqueror.png",
      8021: "https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Precision/FleetFootwork/FleetFootwork.png",
      
      // Domination
      8112: "https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Domination/Electrocute/Electrocute.png",
      8124: "https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Domination/Predator/Predator.png",
      8128: "https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Domination/DarkHarvest/DarkHarvest.png",
      9923: "https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Domination/HailOfBlades/HailOfBlades.png",
      
      // Sorcery
      8214: "https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Sorcery/SummonAery/SummonAery.png",
      8229: "https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Sorcery/ArcaneComet/ArcaneComet.png",
      8230: "https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Sorcery/PhaseRush/PhaseRush.png",
      
      // Resolve
      8437: "https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Resolve/GraspOfTheUndying/GraspOfTheUndying.png",
      8439: "https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Resolve/VeteranAftershock/VeteranAftershock.png",
      8465: "https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Resolve/Guardian/Guardian.png",
      
      // Inspiration
      8351: "https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Inspiration/GlacialAugment/GlacialAugment.png",
      8360: "https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Inspiration/UnsealedSpellbook/UnsealedSpellbook.png",
      8369: "https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Inspiration/FirstStrike/FirstStrike.png",
    };
    
    return keystoneMap[keystoneId] || null;
  };
  
  if (isLoading || !championsLoaded) {
    return (
      <div className={`w-full mb-8 p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'} flex justify-center`}>
        <p>Chargement des données de jeu...</p>
      </div>
    );
  }

  // Logs pour le débogage
  if (!spectatorData) {
    console.log("Pas de données spectateur disponibles");
  } else if (!spectatorData.success) {
    console.log("Données spectateur sans succès:", spectatorData);
  } else if (!spectatorData.data) {
    console.log("Données spectateur sans data:", spectatorData);
  } else if (!spectatorData.data.isInGame) {
    console.log("Joueur pas en partie:", spectatorData.data);
  }

  if (!spectatorData || !spectatorData.success || !spectatorData.data || !spectatorData.data.isInGame) {
    return (
      <div className={`w-full mb-8 p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center">
          <div className={`w-4 h-4 rounded-full ${darkMode ? 'bg-gray-500' : 'bg-gray-400'} mr-2`}></div>
          <h2 className="text-xl font-bold">Statut de jeu</h2>
        </div>
        <p className="mt-2">Ce joueur n'est pas en partie actuellement.</p>
      </div>
    );
  }

  const { gameInfo } = spectatorData.data;
  
  // Trouver notre joueur dans la liste des participants
  const currentPlayer = gameInfo.participants.find(p => 
    p.puuid === spectatorData.data.puuid || 
    (p.riotId && p.riotId.includes(gameName))
  );
  
  // Mapper les modes de jeu
  const getGameModeName = (queueId) => {
    switch(queueId) {
      case 400: return 'Normal Draft';
      case 420: return 'Ranked Solo/Duo';
      case 430: return 'Normal Blind';
      case 440: return 'Ranked Flex';
      case 450: return 'ARAM';
      case 700: return 'Clash';
      case 1400: return 'URF';
      default: return `Mode ${queueId}`;
    }
  };
  
  // Date de début de partie
  const gameStartTime = new Date(gameInfo.gameStartTime);
  const timeSinceStart = Math.floor((new Date() - gameStartTime) / 60000); // En minutes
  
  // Trouver les équipes
  const blueTeam = gameInfo.participants.filter(p => p.teamId === 100);
  const redTeam = gameInfo.participants.filter(p => p.teamId === 200);
  
  return (
    <div className={`w-full mb-8 rounded-lg shadow-md overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      {/* En-tête de partie en cours */}
      <div className={`p-4 ${darkMode ? 'bg-green-900' : 'bg-green-600'} text-white`}>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse mr-2"></div>
          <h2 className="text-xl font-bold">Partie en cours</h2>
        </div>
        <div className="flex justify-between items-center mt-1">
          <div>
            <span className="font-medium">{getGameModeName(gameInfo.gameQueueConfigId)}</span>
            <span className="mx-2">•</span>
            {/* Afficher la durée en temps réel */}
            <span className="font-mono">{formatGameDuration(currentGameDuration)}</span>
            <span className="mx-2">•</span>
            <span>Started Since {timeSinceStart} min</span>
          </div>
          {gameInfo.observers && gameInfo.observers.encryptionKey && (
            <div>
              <button 
                className={`px-3 py-1 rounded-full text-sm ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-green-700 hover:bg-green-800'
                }`}
                onClick={() => {
                  navigator.clipboard.writeText(gameInfo.observers.encryptionKey);
                  alert('Clé de spectateur copiée dans le presse-papier');
                }}
              >
                Spectate
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Contenu de la partie */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Équipe bleue */}
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-900/30' : 'bg-gray-100'}`}>
            <h3 className="font-bold text-lg mb-2 text-center">Blue Side</h3>
            <div className="space-y-2">
              {blueTeam.map((player, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center p-2 rounded ${
                    player.puuid === spectatorData.data.puuid || (player.riotId && player.riotId.includes(gameName))
                      ? (darkMode ? 'bg-yellow-900/20' : 'bg-yellow-100')
                      : ''
                  }`}
                >
                  {/* Icône champion */}
                  <div className="relative mr-2">
                    <img 
                      src={getChampionImageUrl(player.championId)} 
                      alt={`Champion ${championMap[player.championId] || player.championId}`}
                      className="w-12 h-12 rounded"
                      onError={(e) => {
                        console.error(`Erreur de chargement de l'image pour le champion ID ${player.championId}`);
                        // Mettre une couleur de fond pour montrer qu'une image manque
                        e.target.style.display = 'flex';
                        e.target.style.backgroundColor = '#333';
                        e.target.style.justifyContent = 'center';
                        e.target.style.alignItems = 'center';
                        e.target.textContent = '?';
                      }}
                    />
                  </div>
                  
                  {/* Infos joueur */}
                  <div className="flex-grow">
                    <div className="font-medium">{player.riotId ? player.riotId.split('#')[0] : `Joueur ${idx + 1}`}</div>
                    <div className="flex items-center space-x-2">
                      {/* Spells d'invocateur */}
                      <div className="flex space-x-1">
                        <img 
                          src={summonerSpellsMap[player.spell1Id]?.icon || ''} 
                          alt="Spell 1"
                          className="w-5 h-5 rounded"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <img 
                          src={summonerSpellsMap[player.spell2Id]?.icon || ''} 
                          alt="Spell 2"
                          className="w-5 h-5 rounded"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                      
                      {/* Runes */}
                      <div className="flex items-center space-x-1">
                        {player.perks && (
                          <>
                            {/* Afficher l'arbre principal */}
                            <img
                              src={getRuneStyleImageUrl(player.perks.perkStyle)}
                              alt={`Style ${getRuneStyleName(player.perks.perkStyle)}`}
                              className="w-6 h-6 rounded-full"
                              title={`Style principal: ${getRuneStyleName(player.perks.perkStyle)}`}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            
                            {/* Afficher la keystone (utilisant différentes approches) */}
                            {player.perks.perkIds && player.perks.perkIds.length > 0 && (
                              <img
                                src={getKeystoneImageUrl(player.perks.perkIds[0])}
                                alt={`Keystone ${player.perks.perkIds[0]}`}
                                className="w-6 h-6 rounded-full"
                                title={`Keystone ${player.perks.perkIds[0]}`}
                                onError={(e) => {
                                  // Essayer l'approche Community Dragon en cas d'échec
                                  const communityDragonUrl = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/${getRuneImagePath(player.perks.perkIds[0])}`;
                                  console.log(`Essayer avec Community Dragon: ${communityDragonUrl}`);
                                  e.target.src = communityDragonUrl;
                                  e.target.onerror = (e2) => {
                                    console.log(`Échec avec Community Dragon aussi, utiliser l'icône de l'arbre`);
                                    e2.target.src = getRuneStyleImageUrl(player.perks.perkStyle);
                                    e2.target.onerror = null;
                                  };
                                }}
                              />
                            )}
                            
                            {/* Afficher l'arbre secondaire */}
                            <img
                              src={getRuneStyleImageUrl(player.perks.perkSubStyle)}
                              alt={`SubStyle ${getRuneStyleName(player.perks.perkSubStyle)}`}
                              className="w-5 h-5 rounded-full opacity-70"
                              title={`Style secondaire: ${getRuneStyleName(player.perks.perkSubStyle)}`}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Équipe rouge */}
          <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-900/30' : 'bg-gray-100'}`}>
            <h3 className="font-bold text-lg mb-2 text-center">Red Side</h3>
            <div className="space-y-2">
              {redTeam.map((player, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center p-2 rounded ${
                    player.puuid === spectatorData.data.puuid || (player.riotId && player.riotId.includes(gameName))
                      ? (darkMode ? 'bg-yellow-900/20' : 'bg-yellow-100')
                      : ''
                  }`}
                >
                  {/* Icône champion */}
                  <div className="relative mr-2">
                    <img 
                      src={getChampionImageUrl(player.championId)} 
                      alt={`Champion ${championMap[player.championId] || player.championId}`}
                      className="w-12 h-12 rounded"
                      onError={(e) => {
                        console.error(`Erreur de chargement de l'image pour le champion ID ${player.championId}`);
                        e.target.style.display = 'flex';
                        e.target.style.backgroundColor = '#333';
                        e.target.style.justifyContent = 'center';
                        e.target.style.alignItems = 'center';
                        e.target.textContent = '?';
                      }}
                    />
                  </div>
                  
                  {/* Infos joueur */}
                  <div className="flex-grow">
                    <div className="font-medium">{player.riotId ? player.riotId.split('#')[0] : `Joueur ${idx + 1}`}</div>
                    <div className="flex items-center space-x-2">
                      {/* Spells d'invocateur */}
                      <div className="flex space-x-1">
                        <img 
                          src={summonerSpellsMap[player.spell1Id]?.icon || ''} 
                          alt="Spell 1"
                          className="w-5 h-5 rounded"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <img 
                          src={summonerSpellsMap[player.spell2Id]?.icon || ''} 
                          alt="Spell 2"
                          className="w-5 h-5 rounded"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                      
                      {/* Runes - Identique à l'équipe bleue */}
                      <div className="flex items-center space-x-1">
                        {player.perks && (
                          <>
                            {/* Afficher l'arbre principal */}
                            <img
                              src={getRuneStyleImageUrl(player.perks.perkStyle)}
                              alt={`Style ${getRuneStyleName(player.perks.perkStyle)}`}
                              className="w-6 h-6 rounded-full"
                              title={`Style principal: ${getRuneStyleName(player.perks.perkStyle)}`}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                            
                            {/* Afficher la keystone (utilisant différentes approches) */}
                            {player.perks.perkIds && player.perks.perkIds.length > 0 && (
                              <img
                                src={getKeystoneImageUrl(player.perks.perkIds[0])}
                                alt={`Keystone ${player.perks.perkIds[0]}`}
                                className="w-6 h-6 rounded-full"
                                title={`Keystone ${player.perks.perkIds[0]}`}
                                onError={(e) => {
                                  // Essayer l'approche Community Dragon en cas d'échec
                                  const communityDragonUrl = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/${getRuneImagePath(player.perks.perkIds[0])}`;
                                  console.log(`Essayer avec Community Dragon: ${communityDragonUrl}`);
                                  e.target.src = communityDragonUrl;
                                  e.target.onerror = (e2) => {
                                    console.log(`Échec avec Community Dragon aussi, utiliser l'icône de l'arbre`);
                                    e2.target.src = getRuneStyleImageUrl(player.perks.perkStyle);
                                    e2.target.onerror = null;
                                  };
                                }}
                              />
                            )}
                            
                            {/* Afficher l'arbre secondaire */}
                            <img
                              src={getRuneStyleImageUrl(player.perks.perkSubStyle)}
                              alt={`SubStyle ${getRuneStyleName(player.perks.perkSubStyle)}`}
                              className="w-5 h-5 rounded-full opacity-70"
                              title={`Style secondaire: ${getRuneStyleName(player.perks.perkSubStyle)}`}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Bannissements */}
        <div className="mt-4">
          <h3 className="font-bold mb-2">Bans</h3>
          <div className="flex flex-wrap gap-2">
            {gameInfo.bannedChampions && gameInfo.bannedChampions.map((ban, idx) => (
              <div key={idx} className="text-center">
                <div className={`relative w-10 h-10 rounded overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  {ban.championId !== -1 && (
                    <>
                      <img 
                        src={getChampionImageUrl(ban.championId)} 
                        alt={`Banned Champion ${championMap[ban.championId] || ban.championId}`}
                        className="w-full h-full object-cover opacity-60"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
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
            <div className='w-30'>
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
            </div>
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
              className={idx === 0 ? "w-[30px] h-[30px]" : "w-[25px] h-[25px]"}
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
       <Header />
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

        <div className="fixed top-4 right-4 flex space-x-2">
  <button 
    onClick={refreshPlayerData} 
    disabled={isLoading || isRefreshing}
    className={`p-2 rounded-full ${
      darkMode 
        ? 'bg-blue-700 hover:bg-blue-600 text-white' 
        : 'bg-blue-500 hover:bg-blue-400 text-white'
    } ${(isLoading || isRefreshing) ? 'opacity-50 cursor-not-allowed' : ''}`}
    aria-label="Actualiser les données"
  >
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={`${isRefreshing ? 'animate-spin' : ''}`}
    >
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
    </svg>
  </button>
    
    <button 
      onClick={toggleDarkMode} 
      className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-yellow-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
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
  </div>

        {/* Conteneur principal avec flex-col pour garantir que tout s'affiche en colonne */}
        <div className="flex flex-col w-full">
          {/* Section 1: Informations du joueur */}
          <div className={`w-full mb-8 p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {isRefreshing && (
          <div className={`fixed inset-0 bg-[#00000075] bg-opacity-10 flex items-center justify-center rounded-lg z-10`}>
            <div className="flex flex-col items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <svg 
                className="animate-spin h-8 w-8 mb-2 text-blue-500" 
                xmlns="http://www.w3.org/2000/svg"
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                ></circle>
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                Actualisation des données...
              </p>
            </div>
          </div>
        )}
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
                    <p className="text-[25px] font-bold mt-2">{gameName}</p>
                    <p className="text-sm opacity-75">#{tagLine}</p>
                  </div>
                  
                  {/* Ranks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full md:flex-1">
                    {/* SoloQ Rank */}
                    {renderRankInfo("Solo/Duo", (playerData.rankInfo || []).find(r => r.queueType === "RANKED_SOLO_5x5"))}
                    
                    {/* Flex Rank */}
                    {renderRankInfo("Flex 5v5", (playerData.rankInfo || []).find(r => r.queueType === "RANKED_FLEX_SR"))}
                  </div>
                  
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
                        
                        // Réutilisation de la fonction getWinrateColor
                        const getWinrateColor = (winRate, darkMode) => {
                          if (winRate >= 70) return darkMode ? 'text-amber-300' : 'text-amber-500';
                          if (winRate >= 65) return darkMode ? 'text-amber-300' : 'text-amber-500';
                          if (winRate >= 60) return darkMode ? 'text-yellow-300' : 'text-yellow-500';
                          if (winRate >= 55) return darkMode ? 'text-yellow-200' : 'text-yellow-400';
                          if (winRate >= 52) return darkMode ? 'text-gray-100' : 'text-gray-600';
                          if (winRate >= 48) return darkMode ? 'text-gray-300' : 'text-gray-500';
                          if (winRate >= 45) return darkMode ? 'text-orange-300' : 'text-orange-500';
                          if (winRate >= 40) return darkMode ? 'text-orange-400' : 'text-orange-600';
                          if (winRate >= 35) return darkMode ? 'text-red-400' : 'text-red-500';
                          return darkMode ? 'text-red-500' : 'text-red-600';
                        };
                        
                        // Fonction pour générer le graphique circulaire
                        const GlobalStatsCircle = ({ wins, losses, size = 70, strokeWidth = 6 }) => {
                          const totalGames = wins + losses;
                          if (totalGames === 0) return null;
                          
                          const winRate = Math.round((wins / totalGames) * 100);
                          const winRateColorClass = getWinrateColor(winRate, darkMode);
                          
                          const radius = (size - strokeWidth) / 2;
                          const circumference = 2 * Math.PI * radius;
                          const winsPercentage = wins / totalGames;
                          
                          return (
                            <div className="flex flex-col items-center justify-center">
                              <div className="relative" style={{ width: size, height: size }}>
                                <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
                                  <circle 
                                    cx={size / 2} 
                                    cy={size / 2} 
                                    r={radius}
                                    fill="none"
                                    stroke={darkMode ? "#EF4444" : "#F87171"} 
                                    strokeWidth={strokeWidth}
                                  />
                                  
                                  <circle 
                                    cx={size / 2} 
                                    cy={size / 2} 
                                    r={radius}
                                    fill="none"
                                    stroke={darkMode ? "#3B82F6" : "#60A5FA"} 
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={`${winsPercentage * circumference} ${circumference}`}
                                    transform={`rotate(-90 ${size/2} ${size/2})`}
                                    strokeLinecap="butt"
                                  />
                                </svg>
                                
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className={`text-base font-bold ${winRateColorClass}`}>{winRate}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        };
                        
                        return (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <a className="text-sm font-semibold mb-1">Matchs récents</a>
                                <div className="flex items-center text-[15px] ">
                                  <span className={`px-2 py-0.5 rounded text-sm font-medium text-[15px] ${darkMode ? ' text-blue-300' : ' text-blue-600'}`}>
                                    {wins}W
                                  </span>
                                  <span className="mx-1">/</span>
                                  <span className={`px-2 py-0.5 rounded text-sm font-medium text-[15px] ${darkMode ? ' text-red-300' : ' text-red-600'}`}>
                                    {totalMatches - wins}L
                                  </span>
                                  <span className="ml-2 text-sm">
                                    (Last {totalMatches} games)
                                  </span>
                                </div>
                              </div>
                              <GlobalStatsCircle wins={wins} losses={totalMatches - wins} />
                            </div>
                            
                            <div className={`rounded-lg ${darkMode ? 'bg-gray-800/80' : 'bg-gray-100'}`}>
                              <a className="text-sm font-semibold mb-2">KDA moyen</a>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-2xl">
                                  <span className={`px-2 py-1 rounded font-medium`}>
                                    {(kills / totalMatches).toFixed(1)}
                                  </span>
                                  <span className="text-gray-500">/</span>
                                  <span className={`px-2 py-1 rounded font-medium ${darkMode ? ' text-red-900' : ' text-red-600'}`}>
                                    {(deaths / totalMatches).toFixed(1)}
                                  </span>
                                  <span className="text-gray-500">/</span>
                                  <span className={`px-2 py-1 rounded font-medium`}>
                                    {(assists / totalMatches).toFixed(1)}
                                  </span>
                                </div>
                                <div className="text-right font-medium text-1xl">
                                  {kda} KDA
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                  </div>
                </div>
            ) : (
              <div className="flex items-center justify-center py-6">
                <p>Aucune information disponible pour ce joueur.</p>
              </div>
            )}
          </div>
          <LiveGameSection 
            spectatorData={spectatorData} 
            isLoading={isLoadingSpectator} 
            darkMode={darkMode} 
          />

          {/* Section 2: Titre de l'historique */}
          <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-300'} pb-2`}>
            Last 30 games
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