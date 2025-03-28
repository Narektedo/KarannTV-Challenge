import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Collapse } from 'react-bootstrap';
import Header from '../components/Header';
import rankIcons from '../rank.json';
import Loader from '../components/Loading.jsx';
import roleIcons from '../role.json';
import summonerIcon from '../summoner.json';
import runesIcon from '../perk.json';
import Arrow from '../components/Arrow.jsx';
import { ProgressBar } from 'primereact/progressbar';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import axios from 'axios';


// Fonction utilitaire pour récupérer le rang spécifique
const getRankInfo = (rankData, queueType) => {
    return rankData?.find(rank => rank.queueType === queueType) || { tier: 'UNRANKED' };
};

// Fonction pour récupérer l'icône locale
const getLocalRankIcon = (tier) => {
    const formattedTier = tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
    const foundRank = rankIcons.find(icon => 
        icon["rank-tier"].toLowerCase() === formattedTier.toLowerCase()
    );
    return foundRank 
        ? foundRank["rank-icon"][0]["rank-icon-link"] 
        : '/rank/Rank=Unranked.png';
};

function Profile() {
    const { gameName, tagLine } = useParams();
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [matchHistory, setMatchHistory] = useState(null);
    const [matchHistoryError, setMatchHistoryError] = useState(null);
    const [expandedMatches, setExpandedMatches] = useState({});
    const [detailedMatches, setDetailedMatches] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [version, setVersion] = useState(null);
    const [matchData, setMatchData] = useState(null); 
    const [isInGame, setIsInGame] = useState(false);
    const [puuid, setPuuid] = useState(null);
    const [loading, setLoading] = useState(true); 
    const navigate = useNavigate(); 
    const [gameInfo, setGameInfo] = useState(null);
    const [teams, setTeams] = useState({ 100: [], 200: [] });
    const [championMap, setChampionMap] = useState({});
    const [gameDuration, setGameDuration] = useState(gameInfo?.gameLength || 0);
    const [summonerSpells, setSummonerSpells] = useState({});
    const [runesMap, setRunesMap] = useState({});
    const [runeStyles, setRuneStyles] = useState({});
    const [canFetch, setCanFetch] = useState(true);
    const [remainingCooldown, setRemainingCooldown] = useState(0);
    const COOLDOWN_DURATION = 60 * 1000; // première valeur en ms donc x1000 pour avoir en sec
    const STORAGE_KEY = 'apiLastFetchTime';
    const participant = matchInfo.participants[0]; // Accédez au participant souhaité
    const spellIcons = getSummonerSpellIconUrl(participant.summonerSpells);

    console.log(spellIcons.spell1); // URL de l'icône du premier spell
    console.log(spellIcons.spell2); // URL de l'icône du deuxième spell


    //useEffect pour récup les infos sur l'API
    useEffect(() => {
        // Vérification du délai lors du chargement du composant
        const checkApiCooldown = () => {
          const lastFetchTime = localStorage.getItem(STORAGE_KEY);
          
          if (lastFetchTime) {
            const timeSinceLastFetch = Date.now() - parseInt(lastFetchTime);
            
            if (timeSinceLastFetch < COOLDOWN_DURATION) {
              // Temps restant avant la prochaine requête
              const remainingTime = COOLDOWN_DURATION - timeSinceLastFetch;
              setCanFetch(false);
              setRemainingCooldown(Math.ceil(remainingTime / 1000));
    
              // Mise en place du compte à rebours
              const cooldownInterval = setInterval(() => {
                const updatedRemainingTime = Math.ceil(
                  (parseInt(localStorage.getItem(STORAGE_KEY) || '0') + COOLDOWN_DURATION - Date.now()) / 1000
                );
    
                if (updatedRemainingTime <= 0) {
                  clearInterval(cooldownInterval);
                  setCanFetch(true);
                  setRemainingCooldown(0);
                } else {
                  setRemainingCooldown(updatedRemainingTime);
                }
              }, 1000);
    
              return () => clearInterval(cooldownInterval);
            }
          }
    
          setCanFetch(true);
          setRemainingCooldown(0);
        };
    
        checkApiCooldown();
    }, [gameName, tagLine]);
    
    useEffect(() => {
        const fetchPlayerData = async () => {
            // Vérification du délai avant de faire la requête
            if (!canFetch) {
                console.log('Requête API bloquée. Veuillez patienter.');
                return;
            }
    
            setLoading(true);
            setError(null);
    
            try {
                // Nettoyage et validation des paramètres
                const cleanGameName = gameName.trim();
                const cleanTagLine = tagLine.trim();
    
                // Vérification des paramètres
                if (!cleanGameName || !cleanTagLine) {
                    throw new Error("Nom de joueur ou tag line manquant");
                }
    
                // Log des paramètres pour vérification
                console.log('Paramètres de requête:', { 
                    cleanGameName, 
                    cleanTagLine 
                });
    
                // Stockage du timestamp de la dernière requête
                localStorage.setItem(STORAGE_KEY, Date.now().toString());
               
                // Configuration des options Axios
                const axiosConfig = {
                    timeout: 10000, // Délai de 10 secondes
                    headers: {
                        'Accept': 'application/json'
                    }
                };
    
                // Requête pour les informations du joueur
                const infoUrl = `https://walopvgapi-9c205847a91e.herokuapp.com/player/${encodeURIComponent(cleanGameName)}/${encodeURIComponent(cleanTagLine)}`;
                console.log('URL de requête Info:', infoUrl);
    
                const infoResponse = await axios.get(infoUrl, axiosConfig);
               
                if (!infoResponse.data.success) {
                    throw new Error("Échec de la récupération des informations du joueur");
                }
    
                setData(infoResponse.data);
                const fetchedPuuid = infoResponse.data.data.puuid;
                setPuuid(fetchedPuuid);
    
                // Requête pour le spectateur
                const spectatorUrl = `https://walopvgapi-9c205847a91e.herokuapp.com/spectator/${fetchedPuuid}`;
                console.log('URL de requête Spectateur:', spectatorUrl);
    
                const spectatorResponse = await axios.get(spectatorUrl, axiosConfig);
               
                if (spectatorResponse.data.success && spectatorResponse.data.data.isInGame) {
                    setIsInGame(true);
                    setGameInfo(spectatorResponse.data.data.gameInfo);
                 
                    const participants = spectatorResponse.data.data.gameInfo.participants;
                    const team100 = participants.filter(p => p.teamId === 100);
                    const team200 = participants.filter(p => p.teamId === 200);
                    setTeams({ 100: team100, 200: team200 });
                } else {
                    setIsInGame(false);
                    setGameInfo(null);
                    setTeams({ 100: [], 200: [] });
                }
    
                // Requête pour l'historique des matchs
                const matchHistoryApiUrl = `https://walopvgapi-9c205847a91e.herokuapp.com/matchs/${encodeURIComponent(cleanGameName)}/${encodeURIComponent(cleanTagLine)}`;
                console.log('URL de requête Historique des matchs:', matchHistoryApiUrl);
    
                const matchHistoryResponse = await axios.get(matchHistoryApiUrl, axiosConfig);
               
                if (matchHistoryResponse.data.success && 
                    Array.isArray(matchHistoryResponse.data.data.matchInfo)) {
                    setMatchHistory(matchHistoryResponse.data.data.matchInfo);
                } else {
                    console.error("L'API n'a pas renvoyé un tableau :", matchHistoryResponse.data);
                    setMatchHistoryError(new Error("L'API n'a pas renvoyé un tableau d'historique de parties."));
                    setMatchHistory(null);
                }
    
            } catch (err) {
                // Gestion d'erreur détaillée
                console.error("Erreur détaillée :", {
                    message: err.message,
                    response: err.response?.data,
                    status: err.response?.status,
                    url: err.config?.url
                });
    
                if (err.response) {
                    // La requête a été faite et le serveur a répondu avec un code d'état
                    switch(err.response.status) {
                        case 404:
                            setMatchHistoryError(new Error("Joueur ou ressource non trouvé"));
                            break;
                        case 500:
                            setMatchHistoryError(new Error("Erreur interne du serveur"));
                            break;
                        default:
                            setMatchHistoryError(new Error("Une erreur est survenue lors de la récupération des données"));
                    }
                } else if (err.request) {
                    // La requête a été faite mais pas de réponse
                    setMatchHistoryError(new Error("Aucune réponse reçue du serveur"));
                } else {
                    // Quelque chose s'est passé lors de la préparation de la requête
                    setMatchHistoryError(new Error("Erreur de configuration de la requête"));
                }
    
                setError(err);
                console.error("Erreur lors de la vérification du jeu en direct:", err);
                setIsInGame(false);
                setGameInfo(null);
                setTeams({ 100: [], 200: [] });
            } finally {
                setLoading(false);
            }
        };
    
        if (gameName && tagLine) {
            fetchPlayerData();
        }
    }, [gameName, tagLine, canFetch]);

    // Chargement des données des sorts d'invocateur
    useEffect(() => {
        const loadSummonerSpells = async () => {
        try {
            const response = await fetch('https://ddragon.leagueoflegends.com/cdn/15.6.1/data/en_US/summoner.json');
            const data = await response.json();
            
            const spellsMap = {};
            Object.values(data.data).forEach(spell => {
            spellsMap[spell.key] = spell.id;
            });
            
            setSummonerSpells(spellsMap);
        } catch (error) {
            console.error('Erreur lors du chargement des sorts d\'invocateur:', error);
        }
        };
        
        loadSummonerSpells();
    }, []);

    useEffect(() => {
        // Fonction pour charger les données des champions
        const loadChampionData = async () => {
            try {
                const response = await fetch('https://ddragon.leagueoflegends.com/cdn/15.6.1/data/en_US/champion.json');
                const data = await response.json();
                
                // Création du mapping ID -> nom
                const idToName = {};
                Object.values(data.data).forEach(champion => {
                    idToName[champion.key] = champion.id;
                });
                
                setChampionMap(idToName);
            } catch (error) {
                console.error('Erreur lors du chargement des données de champion:', error);
            }
        };
        
        loadChampionData();
    }, []);

    useEffect(() => {
        // Initialiser avec la durée actuelle
        if (gameInfo) {
          setGameDuration(gameInfo.gameLength);
        }
        
        // Mettre à jour la durée toutes les secondes
        const interval = setInterval(() => {
          setGameDuration(prevDuration => prevDuration + 1);
        }, 1000);
        
        // Nettoyer l'intervalle lorsque le composant est démonté
        return () => clearInterval(interval);
    }, [gameInfo]);

    const getChampionNameById = (championId) => {
        return championMap[championId] || "Unknown";
    };

    // Chargement des données des runes
  useEffect(() => {
    const loadRunesData = async () => {
      try {
        const response = await fetch('https://ddragon.leagueoflegends.com/cdn/15.6.1/data/en_US/runesReforged.json');
        const runesData = await response.json();
        
        const runesIdMap = {};
        const styleMap = {};
        
        // Mapper les runes principales et secondaires
        runesData.forEach(runeCategory => {
          // Ajouter la rune principale (style)
          styleMap[runeCategory.id] = {
            id: runeCategory.id,
            key: runeCategory.key,
            name: runeCategory.name,
            icon: runeCategory.icon
          };
          
          // Ajouter les slots de runes
          runeCategory.slots.forEach(slot => {
            slot.runes.forEach(rune => {
              runesIdMap[rune.id] = {
                id: rune.id,
                key: rune.key,
                name: rune.name,
                icon: rune.icon,
                styleId: runeCategory.id
              };
            });
          });
        });
        
        setRunesMap(runesIdMap);
        setRuneStyles(styleMap);
      } catch (error) {
        console.error('Erreur lors du chargement des runes:', error);
      }
    };
    
    loadRunesData();
  }, []);

    //fonction pour obtenir le rank d'un joueur
    const renderRankInfo = (rankInfo) => {
        if (rankInfo.tier === 'UNRANKED') {
            return 'Unranked';
        } else {
            const totalGames = rankInfo.wins + rankInfo.losses;
            const winRate = totalGames > 0 ? ((rankInfo.wins / totalGames) * 100).toFixed(1) : 0;
            const rankString = rankInfo.formattedRank ? `${rankInfo.formattedRank} ${rankInfo.leaguePoints} LP` : `${rankInfo.tier} ${rankInfo.rank} ${rankInfo.leaguePoints} LP`;

            return (
                <div className="rank-details">
                    <div className="rank-tier">{rankString}</div>
                    <div className="rank-wr">{`${rankInfo.wins}W - ${rankInfo.losses}L (${winRate}%)`}</div>
                </div>
            );
        }
    };

    // Fonction pour obtenir les informations du joueur actuel dans un match
    const getPlayerInfo = (matchData, puuid) => {
        // Vérifier que matchData.data et matchData.data.matchInfo existent
        if (!matchData || !matchData.data || !matchData.data.matchInfo) {
            console.error('Structure de données incorrecte');
            return null;
        }
    
        // Rechercher dans le premier élément de matchInfo (supposant un seul match)
        const match = matchData.data.matchInfo[0];
        
        const player = match.participants.find(p => p.puuid === puuid);
        return player || null;
    };
    
    // Fonction pour déterminer si le joueur a gagné la partie
    const didPlayerWin = (match, puuid) => {
        const playerInfo = getPlayerInfo(match, data?.data?.accountInfo?.puuid);

        if (!playerInfo) {
            return false; // Ou une autre valeur par défaut si les infos du joueur ne sont pas trouvées
        }
        return playerInfo.win;
    };

    // Fonction pour déterminer la classe CSS de l'élément match-item
    const getMatchItemClass = (didPlayerWin, isDetailed) => {
        let baseClass = 'match-item w-[1550px] flex flex-col items-center mb-2.5 p-2.5';

        // Ajoute la classe pour la hauteur en fonction de l'état du bouton
        baseClass += isDetailed ? 'min-h-fit' : 'min-h-[120px]';

        // Ajoute la classe pour la victoire ou la défaite
        let winLossClass = didPlayerWin
            ? ' win rounded bg-[rgba(36,36,70,0.562)] border-2 border-[rgb(21,21,128)]'
            : ' loss rounded bg-[rgba(44,16,16,0.705)] border-2 border-[rgb(105,14,14)]';

        return baseClass + winLossClass;
    };

    // Fonction pour obtenir le champion adverse
    const getOpposingLaneChampion = (match, playerTeamPosition) => {
        const opposingPlayer = match.info.participants.find(participant => 
            participant.teamPosition === playerTeamPosition && 
            participant.teamId !== getPlayerInfo(match, data?.data?.accountInfo?.puuid)?.teamId
        );
    
        return opposingPlayer ? opposingPlayer.championName : 'Unknown';
    };

    // Fonvertir le rôle en icône
    const getRoleIconUrl = (bite) => {
        const roleInfo = roleIcons.find(r => r.position === bite);
        return roleInfo ? roleInfo["position-icon"][0]["position-icon-link"] : "/images/roles/unknown.png";
    };
    
    // Summoner Icon
    const getSummonerSpellIconUrl = (spells) => {
        const spellMapping = {
            '1': 'SummonerBoost',      // Cleanse
            '3': 'SummonerExhaust',    // Exhaust
            '4': 'SummonerFlash',      // Flash
            '6': 'SummonerHaste',      // Ghost
            '7': 'SummonerHeal',       // Heal
            '11': 'SummonerSmite',     // Smite
            '12': 'SummonerTeleport',  // Teleport
        };
    
        const getSpellIcon = (spellId) => {
            const spellKey = spellMapping[spellId.toString()];
            return spellKey 
                ? `https://ddragon.leagueoflegends.com/cdn/15.5.1/img/spell/${spellKey}.png` 
                : null;
        };
    
        return {
            spell1: getSpellIcon(spells.spell1),
            spell2: getSpellIcon(spells.spell2)
        };
    };
    

    // Fonction pour obtenir l'icône du champion
    const getChampionIconUrl = (championName) => {
        return `http://ddragon.leagueoflegends.com/cdn/15.5.1/img/champion/${championName}.png`;
    };

    // "min:sec"
    const formatGameDuration = (durationInSeconds) => {
        const minutes = Math.floor(durationInSeconds / 60);
        const seconds = Math.floor(durationInSeconds % 60);
        const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds; // Ajouter un zéro devant si < 10
        return `${minutes}:${formattedSeconds}`;
    };

    // Fonction pour obtenir les couleur pour le KDA et le KP
    const interpolateColor = (color1, color2, factor) => {
        const r = Math.round(color1[0] + factor * (color2[0] - color1[0]));
        const g = Math.round(color1[1] + factor * (color2[1] - color1[1]));
        const b = Math.round(color1[2] + factor * (color2[2] - color1[2]));
        return `rgb(${r}, ${g}, ${b})`;
    };
      
    //fonction pour la couleur du KDA
    const getKDAColor = (playerInfo) => {
        const kda = (playerInfo.kills + playerInfo.assists) / Math.max(1, playerInfo.deaths);
        const colors = [
          [199, 104, 101],   // (KDA < 1)
          [230, 229, 209],   // KDA = 1)
          [201, 201, 181],  // (KDA = 3)
          [212, 211, 131],   // (KDA = 5)
          [204, 203, 84]  // KDA > 5)
        ];
        
        if (kda <= 1) return interpolateColor(colors[0], colors[1], kda);
        if (kda <= 3) return interpolateColor(colors[1], colors[2], (kda - 1) / 2);
        if (kda <= 5) return interpolateColor(colors[2], colors[3], (kda - 3) / 2);
        return interpolateColor(colors[3], colors[4], Math.min((kda - 5) / 5, 1));
    };

    //fonction pour la couleur du KP
    const getKPColor = (playerInfo, teamTotalKills) => {
        const kp = (playerInfo.kills + playerInfo.assists) / teamTotalKills * 100;
        const colors = [
          [219, 88, 88],    // KP faible
          [219, 143, 143],  // KP moyen
          [176, 169, 169], // KP bon
          [212, 211, 131],  // KP très bon
          [201, 200, 101]  // KP excellent
        ];
    
        if (kp <= 30) return interpolateColor(colors[0], colors[1], kp / 20);
        if (kp <= 50) return interpolateColor(colors[1], colors[2], (kp - 20) / 20);
        if (kp <= 60) return interpolateColor(colors[2], colors[3], (kp - 40) / 20);
        return interpolateColor(colors[3], colors[4], Math.min((kp - 60) / 40, 1));
    };


    // test pour obtenir le niveau du champion dans la partie actuelle
    const getChampionLevel = (championLevel) => {
        return championLevel.champLevel;
    };
    
    //calcul du nombre total de kill d'une team
    const getTeamTotalKills = (match, teamId) => {
        return match.info.participants
            .filter(p => p.teamId === teamId)
            .reduce((total, p) => total + p.kills, 0);
    };

    //calcul du KP
    const calculateKP = (playerInfo, teamTotalKills) => {
        if (teamTotalKills === 0) return 0;
        return ((playerInfo.kills + playerInfo.assists) / teamTotalKills * 100).toFixed(0);
    };

    //Fonction pour obtenir les détails du match (menu déroulant)
    function MatchDetails({ match, playerInfo }) {
        return (
            <div>
                <p>Champion: {playerInfo.championName}</p>
                <p>CS: {playerInfo.totalMinionsKilled}</p>
                <p>Gold: {playerInfo.goldEarned}</p>
                {/* Ajoutez d'autres détails selon vos besoins */}
            </div>
        );
    };

    // Toggle function to handle expansion for individual divs
    const toggleExpand = (matchId) => {
        setExpandedMatches((prevState) => ({
            ...prevState,
            [matchId]: !prevState[matchId], // Toggle the specific match's expanded state
        }));
    };

    // toggle le expanded2 pour le button du live search (si ça se trouve c'est completement inutile vu que y'a déja le expanded1)
    const toggleExpand2 = () => {
        setIsExpanded(!isExpanded);
    };
    
    //fonction format pour la data
    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
    };

    //fonction pour get la date de création d'un game (irrelevant je crois car il y a le getTimeDifference mais je la laisse on sait jamais)
    const GameCreationComponent = ({ matchInfo }) => {
    if (!matchInfo || !matchInfo.info || !matchInfo.info.gameCreation) {
        return <div className="gameCreation">Date not available</div>;
    }};

    //fonction pour savoir de quand date une game spécifique
    const getTimeDifference = (timestamp) => {
        const now = new Date();
        const creationDate = new Date(timestamp);
        const diffInMilliseconds = now - creationDate;
        const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));
        
        if (diffInDays === 0) {
          return "Today";
        } else if (diffInDays === 1) {
          return "Yesterday";
        } else {
          return `${diffInDays} days ago`;
        }
    };

    // fonction pour fetch la derniere version de ddragon à utiliser
    const fetchLatestVersion = async () => {
        try {
          const response = await axios.get('https://ddragon.leagueoflegends.com/api/versions.json');
          const latestVersion = response.data[0]; // Extract the latest version
          return latestVersion; // Return the latest version
        } catch (error) {
          console.error('Error fetching latest version:', error);
          return null; // Or throw the error, or return a default value depending on your needs
        }
    };

    //fonction pour adapter le style du button live game search pour qu'il soit jaune/doré lorsque qu'un joueur est ingame
    const buttonStyle = {
        position: 'absolute',
        border: '2px solid #2d2e31e8',
        padding: '3px 10px', // px-2.5 équivaut à environ 10px horizontalement
        borderRadius: '0.125rem', // rounded-sm
        marginTop: '0.625rem', // mt-2.5
        width: 'fit-content',
        height: 'fit-content',
        color: isInGame ? '#cccb54' : 'gray',
        cursor: isInGame ? 'pointer' : '',
        backgroundColor: isInGame ? '#ffffff1a' : '#161618e8',
        animation: isInGame ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none',
    };

    // Fonction pour formater la durée de la partie
    const formatGameDurationLive = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    // Fonction pour obtenir les runes principales (les 4 premières runes)
  const getPrimaryRunes = (perks) => {
    if (!perks || !runeStyles[perks.perkStyle]) return [];
    
    // Les 4 premières runes appartiennent au style principal
    return perks.perkIds.slice(0, 4).map(runeId => runesMap[runeId]);
  };

  // Fonction pour obtenir les runes secondaires (les 2 suivantes)
  const getSecondaryRunes = (perks) => {
    if (!perks || !runeStyles[perks.perkSubStyle]) return [];
    
    // Les runes 5 et 6 appartiennent au style secondaire
    return perks.perkIds.slice(4, 6).map(runeId => runesMap[runeId]);
  };

  // Fonction pour obtenir le style de rune (principal ou secondaire)
  const getRuneStyle = (perks, isSecondary = false) => {
    if (!perks) return null;
    
    return runeStyles[isSecondary ? perks.perkSubStyle : perks.perkStyle];
  };

    return (
        
        <div class="flex-col ml-auto mr-auto">
            <Header />
                <div class="flex-col-reverse">
                    {error && <p style={{ color: "red" }}>{error.message}</p>}

                <div className="profile-container w-full justify-center items-center">
                    <div className="player-container mt-[150px] flex flex-col w-[1550px] mx-auto">
                        <div className="player-info w-fit mt-4">
                            <div className="container-icon-level-name-test">
                                <div className="container-icon-level w-[130px] mx-auto">
                                        {data?.data?.summonerInfo?.profileIconId ? (
                                                <img
                                                    className="icon-player w-[130px] h-[130px] rounded-[7%] border-[#b7bcda] border-solid border-[3px]"
                                                    src={`https://ddragon.leagueoflegends.com/cdn/15.6.1/img/profileicon/${data.data.summonerInfo.profileIconId}.png`}
                                                    alt="Icône du joueur"
                                                />
                                        ) : (
                                            <Loader className="icon-player" />
                                        )}

                                    <div className="playerLevelContainer w-fit items-center justify-center text-center mx-auto">
                                        {data?.data?.summonerInfo && (
                                            <div className="player-level justify-center mx-auto text-center text-xl text-[white] border-[#2d2e31e8] border-solid border-[2px] bg-[#161618e8] rounded px-1.5 py-[3px]">
                                                {data.data.summonerInfo.summonerLevel}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="containerName text-[29px] -mt-42 text-[#b7bcda] ml-37 px-1.5 py-[3px] rounded-[0.60rem] border-[#51535f8f] border-[2px] w-fit">
                                        {data?.data?.accountInfo && (
                                    <div class="">
                                        <span className="gameName">{data.data.accountInfo.gameName}</span><span className="tagLine"> #{data.data.accountInfo.tagLine}</span>
                                    </div>
                                )}
                        </div>
                    </div>
                    <div class="">
                        <div className="flex justify-center w-full">
                            <div className={`container2 border-[2px] px-2.5 py-[3px] rounded-sm border-[#2d2e31e8] bg-[#161618e8] mt-[140px] mb-2.5 w-[1550px] ${isExpanded ? 'min-h-[610px]' : 'min-h-[150px]'}`}>
                                
                                {/*Bouton pour ouvir le menu du live game search*/}
                                <div className="">
                                    <button
                                        className="text-white text-2xl"
                                        type="button"
                                        style={buttonStyle}
                                        aria-controls="liveGameSearch"
                                        aria-expanded={isExpanded}
                                        data-state={isExpanded ? 'open' : 'closed'}
                                        onClick={toggleExpand2}
                                        disabled={!isInGame}
                                    >
                                        Live Game
                                    </button>
                                </div>

                                {/*Ce qui s'affichera si le joueur est ingame*/}
                                {isExpanded && isInGame && gameInfo && (
                                    
                                    <div
                                        className="mt-25 bg-[#171617] text-white p-4 border rounded shadow-md mx-auto mb-4 flex min-w-[1100px]"
                                        id="liveGameSearch"
                                        data-state={isExpanded ? 'open' : 'closed'}
                                    >
                                        
                                        
                                        

                                            <div class="absolute">
                                                {gameInfo.gameMode}
                                                <span class="">
                                                    {   formatGameDurationLive(gameDuration)}
                                                </span>
                                            </div>

                                            <div className="flex mt-8">
                                                <div>
                                                    
                                                        <ul>
                                                            <div className="flex gap-1 border-[2px] p-2 rounded border-[#2d2e31e8] bg-[#161618e8] w-fit mb-3">
                                                                {gameInfo.bannedChampions
                                                                    .filter(ban => ban.teamId === 100)
                                                                    .map((ban, index) => (
                                                                        <div key={`blue-ban-${index}`} className="relative">
                                                                            {ban.championId !== -1 ? (
                                                                                <img
                                                                                    className="h-[40px] w-[40px] rounded opacity-60"
                                                                                    src={`https://ddragon.leagueoflegends.com/cdn/15.6.1/img/champion/${championMap[ban.championId]}.png`}
                                                                                    alt={`Ban ${index + 1}: ${championMap[ban.championId] || 'Aucun'}`}
                                                                                />
                                                                            ) : (
                                                                                <div className="h-[40px] w-[40px] rounded bg-gray-800 flex items-center justify-center">
                                                                                    <span className="text-xs text-gray-400">-</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                            </div>
                                                        {teams[100].map((participant) => (
                                                            <li key={participant.puuid} className="flex items-center gap-3">
                                                                <div class="flex items-center gap-3 border-[2px] px-1.5 py-[3px] rounded border-[#2d2e31e8] bg-[#161618e8] min-h-[70px]">
                                                                    {championMap[participant.championId] && (
                                                                        <img
                                                                            className="h-[50px] w-[50px] rounded"
                                                                            src={`https://ddragon.leagueoflegends.com/cdn/15.6.1/img/champion/${championMap[participant.championId]}.png`}
                                                                            alt={championMap[participant.championId]}
                                                                        />
                                                                    )}
                                                                    <div class="min-w-[200px] text-[16px] ">
                                                                        {participant.riotId}
                                                                    </div>
                                                                </div>

                                                                {/* Summoner spells */}
                                                                <div className="flex flex-col border-[2px] px-1.5 py-[3px] rounded border-[#2d2e31e8] bg-[#161618e8]">
                                                                    {summonerSpells[participant.spell1Id] && (
                                                                        <img
                                                                            className="h-[30px] w-[30px] rounded"
                                                                            src={`https://ddragon.leagueoflegends.com/cdn/15.6.1/img/spell/${summonerSpells[participant.spell1Id]}.png`}
                                                                            alt={summonerSpells[participant.spell1Id]}
                                                                        />
                                                                    )}
                                                                    {summonerSpells[participant.spell2Id] && (
                                                                        <img
                                                                            className="h-[30px] w-[30px] rounded"
                                                                            src={`https://ddragon.leagueoflegends.com/cdn/15.6.1/img/spell/${summonerSpells[participant.spell2Id]}.png`}
                                                                            alt={summonerSpells[participant.spell2Id]}
                                                                        />
                                                                    )}
                                                                </div>

                                                                {/* Runes (displayed below) */}
                                                                <div className="flex flex-col border-[2px] px-1.5 py-[3px] rounded border-[#2d2e31e8] bg-[#161618e8]">
                                                                    {/* Primary Runes Row */}
                                                                    <div className="flex items-center">
                                                                        {/* Primary Runes */}
                                                                        {participant.perks && getPrimaryRunes(participant.perks).map((rune, index) => (
                                                                        <div 
                                                                            key={`primary-${index}`} 
                                                                            className={`h-[30px] w-[30px] rounded-full ${index === 0 ? '' : ''} mr-1 flex items-center justify-center`}
                                                                            title={rune?.name}
                                                                        >
                                                                            {rune && (
                                                                            <img
                                                                                className="h-[30px] w-[30px]"
                                                                                src={`https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`}
                                                                                alt={rune.name}
                                                                            />
                                                                            )}
                                                                        </div>
                                                                        ))}
                                                                    </div>
                                                                    
                                                                    {/* Secondary Runes Row */}
                                                                    <div className="flex items-center">
                                                                        {/* Secondary Runes */}
                                                                        {participant.perks && getSecondaryRunes(participant.perks).map((rune, index) => (
                                                                        <div 
                                                                            key={`secondary-${index}`} 
                                                                            className="h-[30px] w-[30px] mr-1 flex items-center justify-center"
                                                                            title={rune?.name}
                                                                        >
                                                                            {rune && (
                                                                            <img
                                                                                className="h-[30px] w-[30px]"
                                                                                src={`https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`}
                                                                                alt={rune.name}
                                                                            />
                                                                            )}
                                                                        </div>
                                                                        ))}
                                                                        
                                                                        {/* Stat Runes (just showing placeholders) */}
                                                                        {participant.perks && participant.perks.perkIds.slice(6).map((statRune, index) => (
                                                                        <div 
                                                                            key={`stat-${index}`} 
                                                                            className="h-[16px] w-[16px] mr-1"
                                                                            title={`Stat Rune ${index + 1}`}
                                                                        />
                                                                        ))}
                                                                    </div>
                                                                        
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div>
                                                    
                                                    <ul>
                                                        <div className="flex gap-1 border-[2px] p-2 rounded border-[#2d2e31e8] bg-[#161618e8] w-fit mb-3 ml-20">
                                                            {gameInfo.bannedChampions
                                                                .filter(ban => ban.teamId === 200)
                                                                .map((ban, index) => (
                                                                    <div key={`red-ban-${index}`} className="relative">
                                                                        {ban.championId !== -1 ? (
                                                                            <img
                                                                                className="h-[40px] w-[40px] rounded opacity-60"
                                                                                src={`https://ddragon.leagueoflegends.com/cdn/15.6.1/img/champion/${championMap[ban.championId]}.png`}
                                                                                alt={`Ban ${index + 1}: ${championMap[ban.championId] || 'Aucun'}`}
                                                                            />
                                                                        ) : (
                                                                            <div className="h-[40px] w-[40px] rounded bg-gray-800 flex items-center justify-center">
                                                                                <span className="text-xs text-gray-400">-</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                        </div>
                                                        {teams[200].map((participant) => (
                                                            <li key={participant.puuid} className="flex items-center gap-3 ml-20">
                                                                <div class="flex items-center gap-3 border-[2px] px-1.5 py-[3px] rounded border-[#2d2e31e8] bg-[#161618e8] min-h-[70px]">
                                                                    {championMap[participant.championId] && (
                                                                        <img
                                                                            className="h-[50px] w-[50px] rounded"
                                                                            src={`https://ddragon.leagueoflegends.com/cdn/15.6.1/img/champion/${championMap[participant.championId]}.png`}
                                                                            alt={championMap[participant.championId]}
                                                                        />
                                                                    )}
                                                                    <div class="min-w-[200px] text-[16px] ">
                                                                        {participant.riotId}
                                                                    </div>
                                                                </div>

                                                                {/* Summoner spells */}
                                                                <div className="flex flex-col border-[2px] px-1.5 py-[3px] rounded border-[#2d2e31e8] bg-[#161618e8]">
                                                                    {summonerSpells[participant.spell1Id] && (
                                                                        <img
                                                                            className="h-[30px] w-[30px] rounded"
                                                                            src={`https://ddragon.leagueoflegends.com/cdn/15.6.1/img/spell/${summonerSpells[participant.spell1Id]}.png`}
                                                                            alt={summonerSpells[participant.spell1Id]}
                                                                        />
                                                                    )}
                                                                    {summonerSpells[participant.spell2Id] && (
                                                                        <img
                                                                            className="h-[30px] w-[30px] rounded"
                                                                            src={`https://ddragon.leagueoflegends.com/cdn/15.6.1/img/spell/${summonerSpells[participant.spell2Id]}.png`}
                                                                            alt={summonerSpells[participant.spell2Id]}
                                                                        />
                                                                    )}
                                                                </div>

                                                                {/* Runes (displayed below) */}
                                                                <div className="flex flex-col border-[2px] px-1.5 py-[3px] rounded border-[#2d2e31e8] bg-[#161618e8]">
                                                                    {/* Primary Runes Row */}
                                                                    <div className="flex items-center">
                                                                        {/* Primary Runes */}
                                                                        {participant.perks && getPrimaryRunes(participant.perks).map((rune, index) => (
                                                                        <div 
                                                                            key={`primary-${index}`} 
                                                                            className={`h-[30px] w-[30px] rounded-full ${index === 0 ? '' : ''} mr-1 flex items-center justify-center`}
                                                                            title={rune?.name}
                                                                        >
                                                                            {rune && (
                                                                            <img
                                                                                className="h-[30px] w-[30px]"
                                                                                src={`https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`}
                                                                                alt={rune.name}
                                                                            />
                                                                            )}
                                                                        </div>
                                                                        ))}
                                                                    </div>
                                                                    
                                                                    {/* Secondary Runes Row */}
                                                                    <div className="flex items-center">
                                                                        {/* Secondary Runes */}
                                                                        {participant.perks && getSecondaryRunes(participant.perks).map((rune, index) => (
                                                                        <div 
                                                                            key={`secondary-${index}`} 
                                                                            className="h-[30px] w-[30px] mr-1 flex items-center justify-center"
                                                                            title={rune?.name}
                                                                        >
                                                                            {rune && (
                                                                            <img
                                                                                className="h-[30px] w-[30px]"
                                                                                src={`https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`}
                                                                                alt={rune.name}
                                                                            />
                                                                            )}
                                                                        </div>
                                                                        ))}
                                                                        
                                                                        {/* Stat Runes (just showing placeholders) */}
                                                                        {participant.perks && participant.perks.perkIds.slice(6).map((statRune, index) => (
                                                                        <div 
                                                                            key={`stat-${index}`} 
                                                                            className="h-[16px] w-[16px] mr-1"
                                                                            title={`Stat Rune ${index + 1}`}
                                                                        />
                                                                        ))}


                                                                    </div>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {/*Résumé des champs les plus joué sur les 20 dernière games*/}
                                    <div class="text-white">
                                        
                                    </div>
                            </div>
                        </div>
                    </div>
                </div>        
                <div class="flex justify-center w-full">
                    {data?.data?.rankInfo && (
                            <div className="rank-list max-w-fit flex justify-center">
                                {/* SoloQueue */}
                                {(() => {
                                    const soloRank = getRankInfo(data.data.rankInfo, 'RANKED_SOLO_5x5');
                                    return (
                                        <div className="rank-item-solo text-[white] bg-[#1f2228e8] rounded h-80 w-[765px] mb-5 px-1.5 py-[3px] border-[#3c3e42] border-solid border-[2px]">
                                            <div className="rank-text-title">Solo/Duo</div>
                                            <div className="rank-info">
                                                <img
                                                    src={getLocalRankIcon(soloRank.tier)}
                                                    alt={`Solo/Duo ${soloRank.tier}`}
                                                    className="rank-icon"
                                                    onError={(e) => {
                                                        e.target.src = '/rank/Rank=Unranked.png';
                                                    }}
                                                />
                                                <div className="rank-text">
                                                    {renderRankInfo(soloRank)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Flex */}
                                {(() => {
                                    const flexRank = getRankInfo(data.data.rankInfo, 'RANKED_FLEX_SR');
                                    return (
                                        <div className="rank-item-flex bg-[#1f2228e8] rounded h-80 w-[765px] px-1.5 py-[3px] border-[#3c3e42] gap-4 border-solid ml-5 border-[2px]">
                                            <div className="rank-text-title">Flex</div>
                                            <div className="rank-info">
                                                <img
                                                    src={getLocalRankIcon(flexRank.tier)}
                                                    alt={`Flex ${flexRank.tier}`}
                                                    className="rank-icon"
                                                    onError={(e) => {
                                                        e.target.src = '/rank/Rank=Unranked.png';
                                                    }}
                                                />
                                                <div className="rank-details">
                                                    {renderRankInfo(flexRank)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                </div>    
                    
                </div>
                    <div className="match-history-container absolute text-[white] left-1/2 transform -translate-x-1/2">
                    {matchHistoryError && <p style={{ color: "red" }}>{matchHistoryError.message}</p>}
                    {matchHistory === null ? (
                        <Loader />
                    ) : matchHistory.length > 0 ? (
                        matchHistory.map(match => {
                            // Utiliser la nouvelle structure de match
                            const playerInfo = match.participants.find(
                                p => p.puuid === data?.data?.accountInfo?.puuid
                            );
                            
                            // Vérification si playerInfo est null
                            if (!playerInfo) {
                                console.warn('Impossible de trouver les informations du joueur pour ce match');
                                return null; // Ne pas rendre ce match
                            }

                            const didPlayerWin = playerInfo.win;
                            const matchItemClass = getMatchItemClass(didPlayerWin, detailedMatches);
                            const toggleDetailedMatches = () => {
                                setDetailedMatches(!detailedMatches);
                            };
                            const gameModeDisplay = match.gameMode === "CLASSIC" ? "Solo/Duo" : match.gameMode;
                            const gameDurationFormatted = formatGameDuration(match.gameDuration);
                            const championLevel = playerInfo.championLevel;
                            const isExpanded = expandedMatches[match.matchId] || false;
                            const roleIcon = getRoleIconUrl(playerInfo.teamPosition);
                            const timeDifference = getTimeDifference(match.gameCreation);
                            
                            return (
                                
                                    <div
                                        key={match.metadata.matchId}
                                        className={`${matchItemClass} overflow-visible`}
                                    >

                                            
                                        
                                        

                                        {playerInfo && (
                                            <div className="player-info-matchs flex min-w-[1400px] ml-12">
                                                <div className="match-info mt-1 text-[grey] mb-1 min-w-[100px] max-w-[100px]">
                                                    <div className="game-mode flex">{gameModeDisplay}</div>
                                                    <div className="game-duration">{gameDurationFormatted}</div>
                                                    <span class="timeSince max-w-fit">{timeDifference}</span>
                                                </div>

                                                <div>
                                                    <img src={roleIcon} alt="role-icon" className="player-role rounded bg-[black] border-[rgba(128, 128, 128,0.233)] border-[(128, 128, 128,0.233)_groove_1px] w-[40px] h-[40px]p-0.5 ml-5" />
                                                </div>

                                                <div class="border-[2px] pr-0.5 py-[3px] rounded-sm border-[#2d2e31e8] ml-5 bg-[#161618e8] flex min-w-[185px] max-w-[185px]">
                                                    <div className="champ-icon-level-container">
                                                        <div class="w-fit ml-2.5">
                                                            <img className="match-champ-icon" src={getChampionIconUrl(playerInfo.championName)} alt={playerInfo.championName} />
                                                            <div className="match-champion-level absolute h-[28px] w-[28px] text-1xl text-center mx-auto mt-[-23px] ml-[-12px] border-solid border-[#2d2e31e8] border-[2px] bg-[#161618e8] text-gray-400 rounded">
                                                                {championLevel}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="KDA ml-3.5 text-[18px]">
                                                        <span className="kills text-[18px]">{playerInfo.kills}</span>  /  <span className="deaths text-[18px]">{playerInfo.deaths}</span>  /  <span className="assists text-[18px]">{playerInfo.assists}</span>
                                                        <div className="KDA-calculated text-[18px]" style={{ color: getKDAColor(playerInfo) }}>
                                                            <span className="KDA-title text-gray-600 text-[18px]">KDA </span>{((playerInfo.kills + playerInfo.assists) / Math.max(1, playerInfo.deaths)).toFixed(1)}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="player-summoner-spells border-[2px] px-1.5 py-[3px] rounded-sm border-[#2d2e31e8] bg-[#161618e8] ml-0.5">
                                                    <div>
                                                        <img
                                                            className="match-spell-icon w-[30px] h-[30px] rounded"
                                                            src={getSummonerSpellIconUrl(playerInfo.summoner1Id)}
                                                            alt={playerInfo.summoner1Id}
                                                        />
                                                    </div>
                                                    <div>
                                                        <img
                                                            className="match-spell-icon w-[30px] h-[30px] rounded"
                                                            src={getSummonerSpellIconUrl(playerInfo.summoner2Id)}
                                                            alt={playerInfo.summoner2Id}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="player-runes fitems-center border-[2px] px-1.5 py-[3px] rounded-sm border-[#2d2e31e8] ml-0.5 bg-[#161618e8]">
                                                    {playerInfo.perks.styles.map((style, styleIndex) => (
                                                        <div key={styleIndex} className="rune-style flex w-fit">
                                                            {style.selections.map((selection, selectionIndex) => {
                                                                const perk = runesIcon.perks.find(p => p.id === selection.perk.toString());
                                                                return perk ? (
                                                                    <img
                                                                        key={selectionIndex}
                                                                        className="match-rune-icon h-[30px] w-[30px]"
                                                                        src={`/${perk.icon}`} // Assurez-vous que ce chemin est correct
                                                                        alt={perk.name}
                                                                    />
                                                                ) : null;
                                                            })}
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="stat-modifiers fitems-center border-[2px] px-1.5 py-[3px] rounded-sm border-[#2d2e31e8] ml-0.5 bg-[#161618e8]">
                                                    {Object.entries(playerInfo.perks.statPerks).map(([key, value]) => {
                                                        const statPerkInfo = runesIcon.statPerks.find(s => s.id === String(value));
                                                        return statPerkInfo ? (
                                                            <img
                                                                key={key}
                                                                className="match-rune-icon h-[20px] w-[20px]"
                                                                src={`/${statPerkInfo.icon}`}
                                                                alt={statPerkInfo.name}
                                                                title={statPerkInfo.name}
                                                            />
                                                        ) : null;
                                                    })}
                                                </div>

                                                <div className="match-items-container w-[140px] flex border-[2px] px-1.5 py-[3px] rounded-sm border-[#2d2e31e8] ml-0.5 bg-[#161618e8]">
                                                    <div>
                                                        {playerInfo.item0 ? <img className="match-item-icon w-[30px] h-[30px] rounded-lg" src={`http://ddragon.leagueoflegends.com/cdn/15.5.1/img/item/${playerInfo.item0}.png`} alt={playerInfo.item0} /> : null}
                                                        {playerInfo.item1 ? <img className="match-item-icon w-[30px] h-[30px] rounded-lg" src={`http://ddragon.leagueoflegends.com/cdn/15.5.1/img/item/${playerInfo.item1}.png`} alt={playerInfo.item1} /> : null}
                                                    </div>
                                                    <div>
                                                        {playerInfo.item2 ? <img className="match-item-icon w-[30px] h-[30px] rounded-lg" src={`http://ddragon.leagueoflegends.com/cdn/15.5.1/img/item/${playerInfo.item2}.png`} alt={playerInfo.item2} /> : null}
                                                        {playerInfo.item3 ? <img className="match-item-icon w-[30px] h-[30px] rounded-lg" src={`http://ddragon.leagueoflegends.com/cdn/15.5.1/img/item/${playerInfo.item3}.png`} alt={playerInfo.item3} /> : null}
                                                    </div>
                                                    <div>
                                                        {playerInfo.item4 ? <img className="match-item-icon w-[30px] h-[30px] rounded-lg" src={`http://ddragon.leagueoflegends.com/cdn/15.5.1/img/item/${playerInfo.item4}.png`} alt={playerInfo.item4} /> : null}
                                                        {playerInfo.item5 ? <img className="match-item-icon w-[30px] h-[30px] rounded-lg" src={`http://ddragon.leagueoflegends.com/cdn/15.5.1/img/item/${playerInfo.item5}.png`} alt={playerInfo.item5} /> : null}
                                                    </div>
                                                        {playerInfo.item6 ? <img className="match-item-icon w-[30px] h-[30px] rounded-lg" src={`http://ddragon.leagueoflegends.com/cdn/15.5.1/img/item/${playerInfo.item6}.png`} alt={playerInfo.item6} /> : null}
                                                </div>

                                                <div className="player-stats-container justify-center ml-0.5 max-h-[70px] min-h-[70px] border-[2px] px-1.5 py-[3px] min-w-[170px] rounded-sm border-[#2d2e31e8] bg-[#161618e8]">
                                                    <div className="player-farm">
                                                        <span className="farm-value text-[#999898] text-[17px]">{playerInfo.totalMinionsKilled + playerInfo.neutralMinionsKilled} CS</span><span class="text-[17px]"> / </span><span className="farm-value-per-minute italic text-[#999898] text-[17px]">{((playerInfo.totalMinionsKilled + playerInfo.neutralMinionsKilled) / (match.info.gameDuration / 60)).toFixed(1)}</span>
                                                        <span className="farm-title text-[#999898]"> CS/min</span>
                                                    </div>
                                                    <div className="player-kp text-[17px]" style={{ color: getKPColor(playerInfo, getTeamTotalKills(match, playerInfo.teamId)) }}>
                                                        {(() => {
                                                            const teamTotalKills = getTeamTotalKills(match, playerInfo.teamId);
                                                            const kp = calculateKP(playerInfo, teamTotalKills);
                                                            return `${kp}%`;
                                                        })()} KP
                                                    </div>
                                                </div>

                                                <div className="combatStats">
                                                    {data?.data?.matchInfo?.map((match, matchIndex) => {
                                                        console.log(`Match ${matchIndex}: Participants Length:`, match.info.participants.length); // Add this line
                                                        return (
                                                        <div key={`match-${matchIndex}`}>
                                                            {match.info.participants.map((playerInfo, playerIndex) => {
                                                            console.log("Player Info:", playerInfo);
                                                            return (
                                                                <div key={`player-${matchIndex}-${playerIndex}`}>
                                                                <div className="damage-dealt">
                                                                    Damage Dealt: {playerInfo.totalDamageDealtToChampions !== undefined ? playerInfo.totalDamageDealtToChampions : "N/A"}
                                                                </div>
                                                                <div className="gold-earned">
                                                                    Gold Earned: {playerInfo.goldEarned !== undefined ? playerInfo.goldEarned : "N/A"}
                                                                </div>
                                                                </div>
                                                            );
                                                            })}
                                                        </div>
                                                        );
                                                    })}
                                                </div>


                                                <div className="opposing-player-info flex items-center ml-5 border-[2px] px-1.5 py-[3px] rounded-sm border-[#2d2e31e8] bg-[#161618e8]">
                                                    <div className="VS">VS</div><img className="match-champ-icon" src={getChampionIconUrl(opposingLaneChampion)} alt={opposingLaneChampion} />
                                                </div>
                                            </div>
                                        )}

                                        
                                        
                                        <div key={match.info.gameId} className="match-item">
                                            {/* Button to toggle expansion */}
                                            <button
                                                className="group absolute flex-col self-stretch items-center justify-center ml-140 -mt-19 cursor-pointer px-1.5 py-[15px] rounded-sm hover:bg-[#ffffff1a]"
                                                type="button"
                                                aria-controls={`test-${match.info.gameId}`}
                                                aria-expanded={isExpanded}
                                                data-state={isExpanded ? 'open' : 'closed'}
                                                onClick={() => toggleExpand(match.info.gameId)}
                                            >
                                                <svg
                                                    fill="#ffffff"
                                                    height="40px"
                                                    width="40px"
                                                    version="1.1"
                                                    id="Layer_1"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    xmlnsXlink="http://www.w3.org/1999/xlink"
                                                    viewBox="0 0 330 330"
                                                    xmlSpace="preserve"
                                                >
                                                    <g id="SVGRepo_bgCarrier" strokeWidth="0" />
                                                    <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />
                                                    <g id="SVGRepo_iconCarrier">
                                                        <path
                                                            id="XMLID_225_"
                                                            d="M325.607,79.393c-5.857-5.857-15.355-5.858-21.213,0.001l-139.39,139.393L25.607,79.393 c-5.857-5.857-15.355-5.858-21.213,0.001c-5.858,5.858-5.858,15.355,0,21.213l150.004,150c2.813,2.813,6.628,4.393,10.606,4.393 s7.794-1.581,10.606-4.394l149.996-150C331.465,94.749,331.465,85.251,325.607,79.393z"
                                                        />
                                                    </g>
                                                </svg>
                                            </button>
                                        </div>
                                        {/* Div that is toggled */}
                                            <div
                                            id={`test-${match.info.gameId}`}
                                            data-state={isExpanded ? 'open' : 'closed'}
                                            hidden={!isExpanded} // Hide or show based on state
                                            className=""
                                            >
                                            <div class="flex">
                                                <ul class="">
                                                <div className="flex">
                                                {match.info.participants
                                                .filter(p => p.teamId === 100) //Filter the participants to only keep the team
                                                .some(p => p.win) ? (
                                                    <span className="text-2xl text-blue-500 border-solid border-[2px] px-1.5 py-0.5 rounded bg-[#161618e8]">Victory</span>
                                                    ) : (
                                                    <span className="text-2xl text-red-800 border-solid border-[2px] px-1.5 py-0.5 rounded bg-[#161618e8]">Defeat</span>
                                                    )}
                                                </div>
                                                    {match.info.participants
                                                    .filter(p => p.teamId === 100)
                                                    .map((player) => (
                                                        <li key={player.puuid}>
                                                            <div class="flex mt-1 mb-4">
                                                                <div class="absolute border-solid border-[#2d2e31e8] border-[2px] bg-[#161618] mt-[42px] px-[1px] text-gray-400 rounded">
                                                                    {player.champLevel}
                                                                </div>
                                                                <div class="flex w-[320px] border-[#2d2e31e8] border-solid border-[2px] px-1.5 py-[3px] rounded bg-[#161618e8]">
                                                                    <div class="min-w-40 flex my-auto">
                                                                        <img 
                                                                            className="match-champ-icon-detailed h-[50px] w-[50px]" 
                                                                            src={getChampionIconUrl(player.championName)} 
                                                                            alt={player.championName} 
                                                                        />
                                                                        <div class="mt-[15px] text-[18px] ml-2">
                                                                            {player.summonerName || player.riotIdGameName} 
                                                                        </div>
                                                                    </div>
                                                                    <div className="KDA text-[18px] ml-[20%] my-auto min-w-[80px] max-w-[80px]">
                                                                        <span className="kills text-[18px]">{player.kills}</span> / <span className="deaths text-[18px]">{player.deaths}</span> / <span className="assists text-[18px]">{player.assists}</span>
                                                                        <div className="KDA-calculated text-[18px]" style={{ color: getKDAColor(player) }}>
                                                                            <span className="KDA-title text-[18px]">KDA </span>{((player.kills + player.assists) / Math.max(1, player.deaths)).toFixed(1)}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div class="flex">
                                                                    <div className="player-summoner-spells ml-1 bg-[#161618e8]">
                                                                        <div>
                                                                            <img
                                                                                className="match-spell-icon w-[30px] h-[30px] rounded"
                                                                                src={getSummonerSpellIconUrl(player.summoner1Id)}
                                                                                alt={player.summoner1Id}
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <img
                                                                                className="match-spell-icon w-[30px] h-[30px] rounded"
                                                                                src={getSummonerSpellIconUrl(player.summoner2Id)}
                                                                                alt={player.summoner2Id}
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="player-runes fitems-center rounded ml-1 px-1.5 py-[3px] border-[#2d2e31e8] border-solid border-[2px] w-fit h-[70px] pr-1.5 bg-[#161618e8]">
                                                                        {player.perks.styles.map((style, styleIndex) => (
                                                                            <div key={styleIndex} className="rune-style flex w-fit">
                                                                                {style.selections.map((selection, selectionIndex) => {
                                                                                    const perk = runesIcon.perks.find(p => p.id === selection.perk.toString());
                                                                                    return perk ? (
                                                                                        <img
                                                                                            key={selectionIndex}
                                                                                            className="match-rune-icon h-[30px] w-[30px]"
                                                                                            src={`/${perk.icon}`} // Assurez-vous que ce chemin est correct
                                                                                            alt={perk.name}
                                                                                        />
                                                                                    ) : null;
                                                                                })}
                                                                            </div>
                                                                        ))}
                                                                    </div>

                                                                    <div className="match-items-container min-w-[120px] h-[70px] flex border-[2px] px-1.5 py-[3px] rounded-sm border-[#2d2e31e8] ml-1 bg-[#161618e8]">
                                                                        <div>
                                                                            {player.item0 ? <img className="match-item-icon w-[30px] h-[30px] rounded-lg" src={`http://ddragon.leagueoflegends.com/cdn/15.5.1/img/item/${player.item0}.png`} alt={player.item0} /> : <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"/>}
                                                                            {player.item1 ? <img className="match-item-icon w-[30px] h-[30px] rounded-lg" src={`http://ddragon.leagueoflegends.com/cdn/15.5.1/img/item/${player.item1}.png`} alt={player.item1} /> : <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"/>}
                                                                        </div>
                                                                        <div>
                                                                            {player.item2 ? <img className="match-item-icon w-[30px] h-[30px] rounded-lg" src={`http://ddragon.leagueoflegends.com/cdn/15.5.1/img/item/${player.item2}.png`} alt={player.item2} /> : <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"/>}
                                                                            {player.item3 ? <img className="match-item-icon w-[30px] h-[30px] rounded-lg" src={`http://ddragon.leagueoflegends.com/cdn/15.5.1/img/item/${player.item3}.png`} alt={player.item3} /> : <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"/>}
                                                                        </div>
                                                                        <div>
                                                                            {player.item4 ? <img className="match-item-icon w-[30px] h-[30px] rounded-lg" src={`http://ddragon.leagueoflegends.com/cdn/15.5.1/img/item/${player.item4}.png`} alt={player.item4} /> : <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"/>}
                                                                            {player.item5 ? <img className="match-item-icon w-[30px] h-[30px] rounded-lg" src={`http://ddragon.leagueoflegends.com/cdn/15.5.1/img/item/${player.item5}.png`} alt={player.item5} /> : <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"/>}
                                                                        </div>
                                                                            {player.item6 ? <img className="match-item-icon w-[30px] h-[30px] rounded-lg" src={`http://ddragon.leagueoflegends.com/cdn/15.5.1/img/item/${player.item6}.png`} alt={player.item6} /> : <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"/>}
                                                                    </div>
                                                                </div>
                                                                <div className="player-stats-container min-w-[75px] max-w-[75px] rounded-sm ml-1 px-1.5 py-[3px] bg-[#161618e8] border-[#2d2e31e8] border-[2px]">
                                                                    <div className="player-farm">
                                                                        <span className="farm-value">{player.totalMinionsKilled + player.neutralMinionsKilled} CS</span>
                                                                    </div>
                                                                    <div className="player-kp" style={{ color: getKPColor(player, getTeamTotalKills(match, player.teamId)) }}>
                                                                        {(() => {
                                                                            const teamTotalKills = getTeamTotalKills(match, player.teamId);
                                                                            const kp = calculateKP(player, teamTotalKills);
                                                                            return `${kp}%`;
                                                                        })()} KP
                                                                    </div>
                                                                </div>
                                                                <div class="roleIconTab">
                                                                {player.teamPosition ? <img src={`/role/${player.teamPosition}.png`} alt="roleIconTab" class="w-[50px] h-[50px] mt-2.5"/> : null }
                                                                </div>
                                                            </div>
                                                            
                                                        </li>
                                                    ))}
                                                </ul>

                                                <ul class="">
                                                <div className="flex">
                                                {match.info.participants
                                                .filter(p => p.teamId === 200) //Filter the participants to only keep the team
                                                .some(p => p.win) ? (
                                                    <span className="text-2xl text-blue-500 border-solid border-[2px] px-1.5 py-0.5 rounded bg-[#161618e8]">Victory</span>
                                                    ) : (
                                                    <span className="text-2xl text-red-800 border-solid border-[2px] px-1.5 py-0.5 rounded bg-[#161618e8]">Defeat</span>
                                                    )}
                                                </div>
                                                    {match.info.participants
                                                    .filter(p => p.teamId === 200)
                                                    .map((player) => (
                                                        <li key={player.puuid}>
                                                            <div class="flex mt-1 mb-4">
                                                                <div class="absolute border-solid border-[#2d2e31e8] border-[2px] bg-[#161618] mt-[42px] px-[1px] text-gray-400 rounded">
                                                                    {player.champLevel}
                                                                </div>
                                                                <div class="flex w-[320px] border-[#2d2e31e8] border-solid border-[2px] px-1.5 py-[3px] rounded bg-[#161618e8]">
                                                                    <div class="min-w-50 flex my-auto">
                                                                        <img 
                                                                            className="match-champ-icon-detailed h-[50px] w-[50px]" 
                                                                            src={getChampionIconUrl(player.championName)} 
                                                                            alt={player.championName} 
                                                                        />
                                                                        <div class="my-auto text-[18px] ml-2">
                                                                            {player.summonerName || player.riotIdGameName} 
                                                                        </div>
                                                                    </div>
                                                                    <div className="KDA text-[18px] ml-[8%] my-auto min-w-[80px] max-w-[80px]">
                                                                        <span className="kills text-[18px]">{player.kills}</span> / <span className="deaths text-[18px]">{player.deaths}</span> / <span className="assists text-[18px]">{player.assists}</span>
                                                                        <div className="KDA-calculated text-[18px]" style={{ color: getKDAColor(player) }}>
                                                                            <span className="KDA-title text-[18px]">KDA </span>{((player.kills + player.assists) / Math.max(1, player.deaths)).toFixed(1)}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div class="flex">
                                                                    <div className="player-summoner-spells ml-1 bg-[#161618e8]">
                                                                        <div>
                                                                            <img
                                                                                className="match-spell-icon w-[30px] h-[30px] rounded"
                                                                                src={getSummonerSpellIconUrl(player.summoner1Id)}
                                                                                alt={player.summoner1Id}
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <img
                                                                                className="match-spell-icon w-[30px] h-[30px] rounded"
                                                                                src={getSummonerSpellIconUrl(player.summoner2Id)}
                                                                                alt={player.summoner2Id}
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="player-runes fitems-center rounded ml-1 px-1.5 py-[3px] border-[#2d2e31e8] border-solid border-[2px] w-fit h-[70px] pr-1.5 bg-[#161618e8]">
                                                                        {player.perks.styles.map((style, styleIndex) => (
                                                                            <div key={styleIndex} className="rune-style flex w-fit">
                                                                                {style.selections.map((selection, selectionIndex) => {
                                                                                    const perk = runesIcon.perks.find(p => p.id === selection.perk.toString());
                                                                                    return perk ? (
                                                                                        <img
                                                                                            key={selectionIndex}
                                                                                            className="match-rune-icon h-[30px] w-[30px]"
                                                                                            src={`/${perk.icon}`} // Assurez-vous que ce chemin est correct
                                                                                            alt={perk.name}
                                                                                        />
                                                                                    ) : null;
                                                                                })}
                                                                            </div>
                                                                        ))}
                                                                    </div>

                                                                    <div className="match-items-container min-w-[120px] h-[70px] flex border-[2px] px-1.5 py-[3px] rounded-sm border-[#2d2e31e8] ml-1 bg-[#161618e8]">
                                                                        <div>
                                                                            {player.item0 ? <img className="match-item-icon w-[30px] h-[30px] rounded-lg" src={`http://ddragon.leagueoflegends.com/cdn/15.5.1/img/item/${player.item0}.png`} alt={player.item0} /> : <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"/>}
                                                                            {player.item1 ? <img className="match-item-icon w-[30px] h-[30px] rounded-lg" src={`http://ddragon.leagueoflegends.com/cdn/15.5.1/img/item/${player.item1}.png`} alt={player.item1} /> : <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"/>}
                                                                        </div>
                                                                        <div>
                                                                            {player.item2 ? <img className="match-item-icon w-[30px] h-[30px] rounded-lg" src={`http://ddragon.leagueoflegends.com/cdn/15.5.1/img/item/${player.item2}.png`} alt={player.item2} /> : <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"/>}
                                                                            {player.item3 ? <img className="match-item-icon w-[30px] h-[30px] rounded-lg" src={`http://ddragon.leagueoflegends.com/cdn/15.5.1/img/item/${player.item3}.png`} alt={player.item3} /> : <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"/>}
                                                                        </div>
                                                                        <div>
                                                                            {player.item4 ? <img className="match-item-icon w-[30px] h-[30px] rounded-lg" src={`http://ddragon.leagueoflegends.com/cdn/15.5.1/img/item/${player.item4}.png`} alt={player.item4} /> : <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"/>}
                                                                            {player.item5 ? <img className="match-item-icon w-[30px] h-[30px] rounded-lg" src={`http://ddragon.leagueoflegends.com/cdn/15.5.1/img/item/${player.item5}.png`} alt={player.item5} /> : <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"/>}
                                                                        </div>
                                                                        <div>
                                                                            {player.item6 ? <img className="match-item-icon w-[30px] h-[30px] rounded-lg" src={`http://ddragon.leagueoflegends.com/cdn/15.5.1/img/item/${player.item6}.png`} alt={player.item6} /> : <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"/>}
                                                                            
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="player-stats-container min-w-[75px] max-w-[75px] rounded-sm ml-1 px-1.5 py-[3px] bg-[#161618e8] border-[#2d2e31e8] border-[2px]">
                                                                    <div className="player-farm">
                                                                        <span className="farm-value">{player.totalMinionsKilled + player.neutralMinionsKilled} CS</span>
                                                                    </div>
                                                                    <div className="player-kp" style={{ color: getKPColor(player, getTeamTotalKills(match, player.teamId)) }}>
                                                                        {(() => {
                                                                            const teamTotalKills = getTeamTotalKills(match, player.teamId);
                                                                            const kp = calculateKP(player, teamTotalKills);
                                                                            return `${kp}%`;
                                                                        })()} KP
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>

                                            </div>



                                            </div>
                                    </div>
                                    
                                );
                            })
                        ) : (
                            <p>Aucun historique de parties trouvé.</p>
                        )}
                
                    </div>
            </div>
    );
}

export default Profile;
