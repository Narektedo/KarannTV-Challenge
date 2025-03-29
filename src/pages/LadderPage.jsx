import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Composant principal pour le système de ladder
const LeagueLadder = () => {
  const [players, setPlayers] = useState([]);
  const [activeTab, setActiveTab] = useState('solo'); // 'solo' ou 'flex'
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [refreshStatus, setRefreshStatus] = useState(null);
  const [error, setError] = useState(null);
  
  // URL de base de l'API (à ajuster selon votre environnement)
  const API_BASE_URL = 'https://walopvgapi-9c205847a91e.herokuapp.com';
  
  // Fonction pour récupérer les données directement depuis la base de données
  const fetchLadderData = async (tabOverride = null) => {
    setIsLoading(true);
    setError(null);
    
    // Utiliser tabOverride s'il est fourni, sinon utiliser activeTab
    const currentTab = tabOverride !== null ? tabOverride : activeTab;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/ladder-data`);
      
      if (response.data.success) {
        // Mettre à jour les joueurs selon l'onglet actif
        const ladderData = response.data;
        const playerData = currentTab === 'solo' ? ladderData.soloQueue : ladderData.flexQueue;
        
        // Les données sont déjà triées par rang côté serveur, on les utilise directement
        setPlayers(playerData);
        setLastRefresh(new Date(ladderData.lastUpdated));
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
    setRefreshStatus("Rafraîchissement des données en cours...");
    
    try {
      const response = await axios.post(`${API_BASE_URL}/refresh-ladder-data`);
      
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
  
  // Charger les données au démarrage
  useEffect(() => {
    fetchLadderData();
  }, []);
  
  // Rendu du composant
  return (
    <div className="w-full py-8">
      {/* En-tête et contrôles (largeur limitée au centre) */}
      <div className="max-w-3xl mx-auto px-4 mb-8">
        <h1 className="text-3xl font-bold text-center mb-6">League of Legends Ladder</h1>
        
        {/* Onglets pour sélectionner le type de queue */}
        <div className="flex justify-center mb-6">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              className={`px-6 py-3 font-medium ${activeTab === 'solo' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => handleTabChange('solo')}
            >
              Solo Queue
            </button>
            <button
              className={`px-6 py-3 font-medium ${activeTab === 'flex' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => handleTabChange('flex')}
            >
              Flex Queue
            </button>
          </div>
        </div>
        
        {/* Informations sur le rafraîchissement */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600">
            {lastRefresh && (
              <span>Dernière mise à jour: {lastRefresh.toLocaleString()}</span>
            )}
          </div>
          <div className="flex items-center">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded font-medium disabled:opacity-50 hover:bg-green-700 transition"
              onClick={refreshLadderData}
              disabled={isLoading || isRefreshing}
            >
              {isRefreshing ? 'Rafraîchissement...' : 'Actualiser les données'}
            </button>
          </div>
        </div>
        
        {/* Statut du rafraîchissement */}
        {refreshStatus && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
            {refreshStatus}
          </div>
        )}
        
        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* Description du fonctionnement */}
        <div className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-3 rounded mb-4 text-sm">
          <p><strong>Comment ça fonctionne :</strong></p>
          <p>• Les données affichées proviennent directement de la base de données</p>
          <p>• Le bouton d'actualisation lance une mise à jour des données via l'API RIOT (max 20 joueurs par demande)</p>
          <p>• Pour des raisons de limitation d'API, les joueurs sont mis à jour progressivement</p>
        </div>
      </div>
      
      {/* Tableau du ladder (largeur pleine) */}
      <div className="w-full px-4">
        <div className="bg-white rounded-lg shadow overflow-x-auto w-1/2 mx-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="px-4 py-3 text-left w-16">Rang</th>
                <th className="px-4 py-3 text-left">Joueur</th>
                <th className="px-4 py-3 text-center">Niveau</th>
                <th className="px-4 py-3 text-center">Rang</th>
                <th className="px-4 py-3 text-center">Winrate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">Chargement des données...</td>
                </tr>
              ) : players.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">Aucun joueur trouvé</td>
                </tr>
              ) : (
                players.map((player, index) => (
                  <tr key={player.puuid || index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-center">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {/* Icône du profil */}
                        <div className="w-12 h-12 mr-3 relative flex-shrink-0">
                          <img
                            src={`https://ddragon.leagueoflegends.com/cdn/15.6.1/img/profileicon/${player.profileIconId || 1}.png`}
                            alt="Profile Icon"
                            className="w-full h-full rounded-full object-cover border-2 border-gray-300"
                          />
                        </div>
                        <div>
                          <div className="font-medium">{player.gameName || "Inconnu"}</div>
                          <div className="text-sm text-gray-500">#{player.tagLine || "???"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold">{player.summonerLevel || "?"}</span>
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
                          <div className="font-medium">{player.tier} {player.rank}</div>
                          <div className="text-sm">{player.leaguePoints} LP</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-center">
                        <div className="font-medium">{calculateWinrate(player.wins, player.losses)}%</div>
                        <div className="text-sm text-gray-600">
                          {player.wins}V {player.losses}D
                          <span className="text-xs ml-1">({player.wins + player.losses} parties)</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeagueLadder;