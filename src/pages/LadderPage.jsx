import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/Header';

// Fonction pour déterminer la couleur du winrate
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

// Composant principal pour le système de ladder
const LeagueLadder = () => {
  const [players, setPlayers] = useState([]);
  const [activeTab, setActiveTab] = useState('solo'); // 'solo', 'global'
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [refreshStatus, setRefreshStatus] = useState(null);
  const [error, setError] = useState(null);
  const [playersInGame, setPlayersInGame] = useState({});
  const [isCheckingGameStatus, setIsCheckingGameStatus] = useState(false);
  const [playerMatchResults, setPlayerMatchResults] = useState({});
  const [isLoadingMatchHistory, setIsLoadingMatchHistory] = useState(false);
  
  // URL de base de l'API (à ajuster selon votre environnement)
  const API_BASE_URL = 'https://walopvgapi-9c205847a91e.herokuapp.com';
  
  // Durée de validité du cache en minutes (1 heure par défaut)
  const CACHE_EXPIRY_MINUTES = 60;
  
  // Fonction pour vérifier tous les joueurs par lots
  const checkAllPlayersInGame = async () => {
    if (players.length === 0) return;
    
    setIsCheckingGameStatus(true);
    
    try {
      // Récupérer tous les PUUIDs des joueurs
      const puuids = players.filter(player => player.puuid).map(player => player.puuid);
      
      // Envoyer une seule requête batch pour tous les joueurs
      const response = await axios.post(`${API_BASE_URL}/spectator-batch`, { puuids });
      
      if (response.data.success) {
        const gameStatusResults = response.data.data;
        const newInGameStatus = {};
        
        // Mettre à jour le statut en jeu pour chaque joueur
        Object.keys(gameStatusResults).forEach(puuid => {
          newInGameStatus[puuid] = gameStatusResults[puuid].isInGame;
        });
        
        setPlayersInGame(newInGameStatus);
      }
    } catch (err) {
      console.error("Erreur lors de la vérification du statut en jeu:", err);
    } finally {
      setIsCheckingGameStatus(false);
    }
  };
  
  // Fonction pour récupérer les données directement depuis la base de données
  const fetchLadderData = async (tabOverride = null) => {
    setIsLoading(true);
    setError(null);
    
    // Utiliser tabOverride s'il est fourni, sinon utiliser activeTab
    const currentTab = tabOverride !== null ? tabOverride : activeTab;
    
    try {
      // Si on veut le ladder global, on utilise un endpoint différent
      const endpoint = currentTab === 'global' 
        ? `${API_BASE_URL}/global-ladder-data` 
        : `${API_BASE_URL}/ladder-data`;
      
      const response = await axios.get(endpoint);
      
      if (response.data.success) {
        // Mettre à jour les joueurs selon l'onglet actif
        const ladderData = response.data;
        
        // Récupérer les données appropriées selon l'onglet sélectionné
        let playerData;
        
        if (currentTab === 'global') {
          // Pour l'onglet global, on utilise directement les données
          playerData = ladderData.players || [];
        } else {
          // Pour solo queue, on utilise les données de soloQueue
          playerData = ladderData.soloQueue;
        }
        
        // Les données sont déjà triées par rang côté serveur, on les utilise directement
        setPlayers(playerData);
        setLastRefresh(new Date(ladderData.lastUpdated));
        
        // Vérifier quels joueurs sont en partie après avoir chargé les données
        checkAllPlayersInGame();
      } else {
        setError("Erreur lors du chargement des données");
      }
    } catch (err) {
      setError("Erreur lors du chargement des données: " + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fonction pour rafraîchir les données depuis RIOT API
  const refreshLadderData = async () => {
    setIsRefreshing(true);
    setError(null);
    setRefreshStatus("Loading...");
    
    try {
      // Utiliser l'endpoint approprié selon l'onglet actif
      const endpoint = activeTab === 'global' 
        ? `${API_BASE_URL}/refresh-global-ladder-data` 
        : `${API_BASE_URL}/refresh-ladder-data`;
      
      const response = await axios.post(endpoint);
      
      if (response.data.success) {
        setRefreshStatus(`Succès: ${response.data.message}`);
        // Recharger les données immédiatement après l'actualisation
        await fetchLadderData();
      } else {
        setError("Erreur lors du rafraîchissement: " + response.data.message);
        setRefreshStatus("Échec du rafraîchissement");
      }
    } catch (err) {
      setError("Erreur lors du rafraîchissement: " + (err.response?.data?.message || err.message));
      setRefreshStatus("Échec du rafraîchissement");
    } finally {
      setIsRefreshing(false);
      // Le statut de rafraîchissement disparaîtra après 5 secondes
      setTimeout(() => {
        setRefreshStatus(null);
      }, 5000);
    }
  };
  
  // Fonction pour rafraîchir manuellement le statut des joueurs en partie
  const refreshGameStatus = () => {
    checkAllPlayersInGame();
  };
  
  // Changement d'onglet
  const handleTabChange = (tab) => {
    if (tab === activeTab) return; // Ne rien faire si on clique sur l'onglet déjà actif
    setActiveTab(tab);
    fetchLadderData(tab);
  };
  
  // Calculer le winrate
  const calculateWinrate = (wins, losses) => {
    const total = wins + losses;
    if (total === 0) return 0;
    return ((wins / total) * 100).toFixed(1);
  };

  // Fonction pour récupérer les données du cache
  const getMatchesFromCache = (puuid) => {
    try {
      const cachedData = localStorage.getItem(`match_history_${puuid}`);
      if (!cachedData) return null;
      
      const { data, timestamp } = JSON.parse(cachedData);
      
      // Vérifier si le cache est expiré
      const now = new Date().getTime();
      const cacheAge = (now - timestamp) / (1000 * 60); // Conversion en minutes
      
      if (cacheAge > CACHE_EXPIRY_MINUTES) {
        // Le cache est expiré, on le supprime et retourne null
        localStorage.removeItem(`match_history_${puuid}`);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error("Erreur lors de la récupération du cache:", error);
      return null;
    }
  };

  // Fonction pour sauvegarder les données dans le cache
  const saveMatchesToCache = (puuid, data) => {
    try {
      const cacheEntry = {
        data: data,
        timestamp: new Date().getTime()
      };
      
      localStorage.setItem(`match_history_${puuid}`, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error("Erreur lors de la sauvegarde dans le cache:", error);
    }
  };

  // Fonction modifiée pour utiliser le cache lors de la récupération de l'historique des parties
  const fetchPlayersMatchResults = async () => {
    if (players.length === 0) return;
    
    setIsLoadingMatchHistory(true);
    
    try {
      // Récupérer les résultats pour chaque joueur, par lots de 3
      const batchSize = 3;
      const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
      const results = { ...playerMatchResults };
      let apiCallsMade = 0; // Compteur pour suivre le nombre d'appels API réels
      
      for (let i = 0; i < players.length; i += batchSize) {
        const batch = players.slice(i, i + batchSize);
        const batchPromises = batch.map(async player => {
          if (!player.puuid) return;
          
          // Vérifier d'abord si les données sont dans le cache
          const cachedMatches = getMatchesFromCache(player.puuid);
          
          if (cachedMatches) {
            // Utiliser les données du cache si disponibles
            console.log(`Utilisation du cache pour ${player.gameName}`);
            results[player.puuid] = cachedMatches;
            return;
          }
          
          // Si pas de cache valide, faire la requête API
          try {
            apiCallsMade++; // Incrémenter le compteur d'appels API
            console.log(`Appel API pour ${player.gameName} (appel #${apiCallsMade})`);
            
            const response = await axios.get(`${API_BASE_URL}/recent-matches/${player.puuid}`);
            if (response.data.success) {
              const matchData = response.data.data;
              results[player.puuid] = matchData;
              
              // Sauvegarder dans le cache pour les prochaines fois
              saveMatchesToCache(player.puuid, matchData);
            }
          } catch (error) {
            console.error(`Erreur lors de la récupération de l'historique pour ${player.gameName}:`, error);
          }
        });
        
        await Promise.all(batchPromises);
        
        // Attendre entre chaque lot pour ne pas surcharger l'API
        // mais seulement si on a fait des appels API dans ce lot
        if (i + batchSize < players.length && apiCallsMade > 0) {
          await delay(1000);
        }
      }
      
      console.log(`Total des appels API: ${apiCallsMade}/${players.length} joueurs`);
      setPlayerMatchResults(results);
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique des parties:", error);
    } finally {
      setIsLoadingMatchHistory(false);
    }
  };

  // Fonction pour effacer manuellement le cache (utile pour les tests ou en cas de bug)
  const clearMatchHistoryCache = () => {
    try {
      // Récupérer toutes les clés du localStorage qui commencent par "match_history_"
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('match_history_')) {
          keysToRemove.push(key);
        }
      }
      
      // Supprimer chaque clé
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log(`Cache d'historique de matches effacé (${keysToRemove.length} entrées)`);
      
      // Rafraîchir les données seulement si on est sur l'onglet Solo Queue
      if (activeTab !== 'global') {
        fetchPlayersMatchResults();
      }
    } catch (error) {
      console.error("Erreur lors du nettoyage du cache:", error);
    }
  };

  
  // Charger les données au démarrage
  useEffect(() => {
    fetchLadderData();
  }, []);
  
  // Rafraîchir automatiquement le statut des joueurs en partie toutes les 2 minutes
  // Mais uniquement pour le ladder SoloQueue (pas pour le Global Ladder qui contient trop de joueurs)
  useEffect(() => {
    if (players.length === 0 || activeTab === 'global') return;
    
    // Vérifier immédiatement au chargement
    checkAllPlayersInGame();
    
    // Configurer un intervalle pour vérifier régulièrement
    const intervalId = setInterval(() => {
      checkAllPlayersInGame();
    }, 2 * 60 * 1000); // 2 minutes
    
    // Nettoyer l'intervalle lors du démontage du composant
    return () => clearInterval(intervalId);
  }, [players, activeTab]);
  
  // Rendu du composant
  return (
    <>
    <Header />
    <div className="w-full py-8 bg-gray-900 text-gray-100 min-h-screen">
      {/* En-tête et contrôles (largeur limitée au centre) */}
      <div className="max-w-1/2 mx-auto px-4 mb-8">
        <a className="text-3xl flex font-bold text-center items-center mb-6 text-blue-300">Ladder League of Legends</a>
        
        {/* Onglets pour sélectionner le type de queue */}
        <div className="flex justify-center mb-6">
          <div className="flex rounded-lg border border-gray-700 overflow-hidden">
            <button
              className={`px-6 py-3 font-medium ${activeTab === 'solo' ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-300'}`}
              onClick={() => handleTabChange('solo')}
            >
              Solo Queue
            </button>
            <button
              className={`px-6 py-3 font-medium ${activeTab === 'global' ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-300'}`}
              onClick={() => handleTabChange('global')}
            >
              Global Ladder
            </button>
          </div>
        </div>
        
        {/* Informations sur le rafraîchissement */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-400">
            {lastRefresh && (
              <span>
                Last Update: {lastRefresh.toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              className="px-4 py-2 bg-green-700 text-white rounded font-medium disabled:opacity-50 hover:bg-green-600 transition"
              onClick={refreshLadderData}
              disabled={isLoading || isRefreshing}
            >
              {isRefreshing ? 'Loading...' : 'Refresh'}
            </button>
            {/* Nouveau bouton pour effacer le cache (facultatif, peut être retiré en production) */}
            <button
              className="px-4 py-2 bg-red-700 text-white rounded font-medium hover:bg-red-600 transition text-sm"
              onClick={clearMatchHistoryCache}
              title="Effacer le cache d'historique des matches"
            >
              Vider le cache
            </button>
          </div>
        </div>
        
        {/* Statut du rafraîchissement */}
        {refreshStatus && (
          <div className="bg-blue-900 border border-blue-700 text-blue-300 px-4 py-3 rounded mb-4">
            {refreshStatus}
          </div>
        )}
        
        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
      </div>
      
      {/* Tableau du ladder (largeur pleine) */}
      <div className="w-full px-4">
        <div className="bg-gray-800 rounded-lg shadow overflow-x-auto w-1/2 mx-auto border border-gray-700">
          <table className="min-w-full">
          <thead>
            <tr className="bg-gray-900 text-gray-300 border-b border-gray-700">
              <th className="px-4 py-3 text-left w-16">Rang</th>
              <th className="px-4 py-3 text-left">Joueur</th>
              <th className="px-4 py-3 text-center">
                {activeTab === 'global' ? 'Région' : 'Historique'}
              </th>
              <th className="px-4 py-3 text-center">Rang</th>
              <th className="px-4 py-3 text-center">Winrate</th>
            </tr>
          </thead>
            <tbody className="divide-y divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-gray-400">Chargement des données...</td>
                </tr>
              ) : players.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-gray-400">Aucun joueur trouvé</td>
                </tr>
              ) : (
                players.map((player, index) => {
                  const winrate = calculateWinrate(player.wins, player.losses);
                  const winrateColorClass = getWinrateColor(parseFloat(winrate));
                  
                  return (
                  <tr key={player.puuid || index} className="hover:bg-gray-700">
                    <td className="px-4 py-3 font-semibold text-center text-gray-300">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {/* Icône du profil avec indicateur de partie en cours */}
                        <div className="w-12 h-12 mr-3 relative flex-shrink-0">
                          <img
                            src={`https://ddragon.leagueoflegends.com/cdn/15.6.1/img/profileicon/${player.profileIconId || 1}.png`}
                            alt="Profile Icon"
                            className="w-full h-full rounded-full object-cover border-2 border-gray-800"
                          />
                          {/* Indicateur de partie en cours */}
                          {playersInGame[player.puuid] && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800" 
                                title="En partie">
                            </div>
                          )}
                        </div>
                        <div>
                            <a 
                              href={`/profiles/${encodeURIComponent(player.gameName)}/${encodeURIComponent(player.tagLine)}`}
                              className="hover:underline hover:text-blue-300 transition-colors cursor-pointer"
                            >
                              {player.gameName || "Inconnu"}
                            </a>                          <div className="text-sm text-gray-400">
                            #{player.tagLine || "???"}
                            {/* Indicateur texte en partie (conserve toujours la même hauteur) */}
                            <span className={`ml-2 text-xs font-semibold ${playersInGame[player.puuid] ? "text-green-400" : "text-transparent"}`}>
                              In-Game
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        {activeTab === 'global' ? (
                          <span className="text-gray-400 text-xs">{player.tagLine || "EUW"}</span>
                        ) : (
                          <MatchHistoryBar puuid={player.puuid} />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <div className="w-12 h-12 mr-2 flex-shrink-0 flex items-center justify-center">
                          <img
                            src={`https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${player.tier?.toLowerCase() || 'unranked'}.svg`}
                            alt={player.tier || 'Unranked'}
                            className="max-w-full max-h-full object-contain w-[50px] h-[50px]"
                            onError={(e) => {
                              // Image de secours en cas d'erreur
                              e.target.src = "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/unranked.png";
                            }}
                          />
                        </div>
                        <div className="w-35 text-center">
                          <div className="font-medium text-gray-200">{player.tier} {player.rank}</div>
                          <div className="text-sm text-blue-300">{player.leaguePoints} LP</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-center">
                        <div className={`font-medium ${winrateColorClass}`}>{winrate}%</div>
                        <div className="text-sm text-gray-400">
                          {player.wins}V - {player.losses}D
                          <span className="text-xs ml-1">({player.wins + player.losses} Games)</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </>
  );
};

export default LeagueLadder;