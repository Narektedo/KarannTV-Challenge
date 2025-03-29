import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Header from '../components/Header';
import profiles from '../profiles.json';
import axios from 'axios';

export default function ProfilePage() {
    const { user } = useParams();
    const [summonersData, setSummonersData] = useState({});
    const [loading, setLoading] = useState(true);
    const [playersInGame, setPlayersInGame] = useState({});
    const [isCheckingGameStatus, setIsCheckingGameStatus] = useState(false);
    
    // URL de base de l'API
    const API_BASE_URL = 'https://walopvgapi-9c205847a91e.herokuapp.com';
    
    // Récupérer le profil depuis le fichier profiles.json
    const profile = profiles.find(profile => profile.link === user);
    
    // Fonction pour obtenir les données d'un summoner
    const fetchSummonerData = async (gameName, tagLine) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/summoner/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`);
            return response.data.data;
        } catch (error) {
            console.error(`Erreur lors de la récupération des données pour ${gameName}#${tagLine}:`, error);
            return null;
        }
    };
    
    // Fonction pour vérifier si un joueur est en partie
    const checkPlayerInGame = async (puuid) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/spectator/${puuid}`);
            return response.data.success && response.data.data.isInGame;
        } catch (err) {
            console.error(`Erreur lors de la vérification du statut de partie pour ${puuid}:`, err);
            return false;
        }
    };
    
    // Fonction pour vérifier tous les joueurs
    const checkAllPlayersInGame = async (summoners) => {
        if (Object.keys(summoners).length === 0) return;
        
        setIsCheckingGameStatus(true);
        const inGameStatus = {...playersInGame};
        
        // Vérifier les joueurs par lots de 2 pour éviter de surcharger l'API
        const checkBatch = async (players, startIndex) => {
            const playerKeys = Object.keys(players);
            const endIndex = Math.min(startIndex + 2, playerKeys.length);
            const batchPromises = [];
            
            for (let i = startIndex; i < endIndex; i++) {
                const key = playerKeys[i];
                const summonerData = players[key];
                if (summonerData && summonerData.puuid) {
                    batchPromises.push(
                        checkPlayerInGame(summonerData.puuid).then(isInGame => {
                            inGameStatus[summonerData.puuid] = isInGame;
                        })
                    );
                }
            }
            
            await Promise.all(batchPromises);
            setPlayersInGame({...inGameStatus});
            
            // Passer au lot suivant s'il en reste
            if (endIndex < playerKeys.length) {
                setTimeout(() => checkBatch(players, endIndex), 200); // Délai de 200ms entre les lots
            } else {
                setIsCheckingGameStatus(false);
            }
        };
        
        // Commencer à vérifier par lots de 2 joueurs
        checkBatch(summoners, 0);
    };
    
    // Charger les données des summoners
    useEffect(() => {
        const fetchAllData = async () => {
            if (profile && profile.nicknames) {
                const data = {};
                
                // Récupérer les données pour chaque compte
                for (const nickname of profile.nicknames) {
                    const summonerData = await fetchSummonerData(nickname.gameName, nickname.tagLine);
                    if (summonerData) {
                        // Utiliser comme clé la combinaison de gameName et tagLine
                        data[`${nickname.gameName}#${nickname.tagLine}`] = summonerData;
                    }
                }
                
                setSummonersData(data);
                setLoading(false);
                
                // Vérifier le statut "en partie" après avoir chargé les données
                await checkAllPlayersInGame(data);
            } else {
                setLoading(false);
            }
        };
        
        fetchAllData();
    }, [profile]);
    
    // Rafraîchir le statut "en partie" toutes les 2 minutes
    useEffect(() => {
        if (Object.keys(summonersData).length === 0) return;
        
        // Vérifier immédiatement
        checkAllPlayersInGame(summonersData);
        
        // Configurer un intervalle pour vérifier régulièrement
        const intervalId = setInterval(() => {
            checkAllPlayersInGame(summonersData);
        }, 2 * 60 * 1000); // 2 minutes
        
        // Nettoyer l'intervalle lors du démontage du composant
        return () => clearInterval(intervalId);
    }, [summonersData]);
    
    // Fonction pour déterminer l'URL de l'icône de rang
    const getRankIconUrl = (rankInfo) => {
        if (!rankInfo || !rankInfo.tier) return "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/unranked.png";
        
        return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${rankInfo.tier.toLowerCase()}.svg`;
    };
    
    return (
        <>
            <Header />
            <div className="bg-gray-900 min-h-screen text-gray-100">
                {profile ? (
                    <div className="max-w-4xl mx-auto px-4 py-8">
                        <a className="block text-[50px] font-bold text-blue-300 text-center w-full">
                            {profile.name}
                        </a>
                        <div className="flex flex-col md:flex-row items-center justify-center mb-8">
                            <img 
                                src={profile.image} 
                                alt={profile.name} 
                                className="w-55 h-55 rounded-full object-cover border-4 border-blue-500 mb-4 md:mb-0" 
                            />
                        </div>
                        
                        {loading ? (
                            <div className="text-center py-8 text-gray-400">Loading...</div>
                        ) : (
                            <div className="flex flex-col gap-4 max-w-3xl mx-auto">
                                {profile.nicknames.map((nickname, i) => {
                                    const accountKey = `${nickname.gameName}#${nickname.tagLine}`;
                                    const summonerData = summonersData[accountKey];
                                    const isInGame = summonerData ? playersInGame[summonerData.puuid] : false;
                                    
                                    return (
                                        <a 
                                            key={i} 
                                            href={`/profiles/${encodeURIComponent(nickname.gameName)}/${encodeURIComponent(nickname.tagLine)}`}
                                            className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-900/20 w-full"
                                        >
                                            <div className="flex items-center">
                                                {/* Icône du profil */}
                                                <div className="relative">
                                                    <img 
                                                        src={`https://ddragon.leagueoflegends.com/cdn/15.6.1/img/profileicon/${summonerData?.profileIcon || 1}.png`} 
                                                        alt="Profile Icon" 
                                                        className="w-16 h-16 rounded-full border-2 border-gray-600"
                                                    />
                                                    
                                                     {/* Indicateur en partie */}
                                                     {isInGame && (
                                                        <div className="absolute -top-1 -right-1 flex items-center">
                                                            <div className="bg-green-500 h-3 w-3 rounded-full animate-pulse"></div>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Informations du compte */}
                                                <div className="ml-4 flex-grow">
                                                    <div className="font-semibold text-lg">{nickname.gameName}</div>
                                                    <div className="text-gray-400">#{nickname.tagLine}</div>
                                                </div>
                                                
                                                {/* Informations de rang */}
                                                <div className="flex flex-col items-end space-y-2 min-w-[140px]">
                                                    {summonerData?.rank?.solo && (
                                                        <div className="flex items-center" title="SoloQ">
                                                            <div className="w-16 text-xs text-right text-white mr-2">SoloQ</div>
                                                            <img 
                                                                src={getRankIconUrl(summonerData.rank.solo)} 
                                                                alt={summonerData.rank.solo.tier} 
                                                                className="w-10 h-10"
                                                                onError={(e) => {
                                                                    e.target.src = "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/unranked.png";
                                                                }}
                                                            />
                                                            <span className="ml-2 text-sm whitespace-nowrap w-20">
                                                                {summonerData.rank.solo.tier} {summonerData.rank.solo.rank}
                                                            </span>
                                                        </div>
                                                    )}
                                                    
                                                    {!summonerData?.rank?.solo && (
                                                        <div className="flex items-center" title="SoloQ">
                                                            <div className="w-16 text-xs text-right text-white mr-2">SoloQ</div>
                                                            <img 
                                                                src="https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/unranked.png"
                                                                alt="Unranked" 
                                                                className="w-10 h-10"
                                                            />
                                                            <span className="ml-2 text-sm whitespace-nowrap w-20 text-gray-400">
                                                                Non classé
                                                            </span>
                                                        </div>
                                                    )}
                                                    
                                                    {summonerData?.rank?.flex && (
                                                        <div className="flex items-center" title="FlexQ">
                                                            <div className="w-16 text-xs text-right text-white mr-2">FlexQ</div>
                                                            <img 
                                                                src={getRankIconUrl(summonerData.rank.flex)} 
                                                                alt={summonerData.rank.flex.tier} 
                                                                className="w-10 h-10"
                                                                onError={(e) => {
                                                                    e.target.src = "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/unranked.png";
                                                                }}
                                                            />
                                                            <span className="ml-2 text-sm whitespace-nowrap w-20">
                                                                {summonerData.rank.flex.tier} {summonerData.rank.flex.rank}
                                                            </span>
                                                        </div>
                                                    )}
                                                    
                                                    {!summonerData?.rank?.flex && (
                                                        <div className="flex items-center" title="FlexQ">
                                                            <div className="w-16 text-xs text-right text-white mr-2">FlexQ</div>
                                                            <img 
                                                                src="https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/unranked.png"
                                                                alt="Unranked" 
                                                                className="w-10 h-10"
                                                            />
                                                            <span className="ml-2 text-sm whitespace-nowrap w-20 text-gray-400">
                                                                Non classé
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </a>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-96">
                        <h1 className="text-3xl font-bold text-red-400">Profil non trouvé</h1>
                        <p className="text-gray-400 mt-4">Le profil que vous recherchez n'existe pas.</p>
                    </div>
                )}
            </div>
        </>
    );
}