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
    const [detailedMatches, setDetailedMatches] = useState(false); // State pour gérer l'état du bouton
    const [isExpanded, setIsExpanded] = useState(false);
    const [version, setVersion] = useState(null);
    const [matchData, setMatchData] = useState(null); // Or the initial state from before

    useEffect(() => {
        const apiUrl = `https://walopvgapi-9c205847a91e.herokuapp.com/info/${gameName}/${tagLine}`;

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Erreur lors de la récupération des données du joueur !");
                }
                return response.json();
            })
            .then(responseData => {
                setData(responseData);
            })
            .catch(setError);
    }, [gameName, tagLine]);

    useEffect(() => {
        const matchHistoryApiUrl = `https://walopvgapi-9c205847a91e.herokuapp.com/matchs/${gameName}/${tagLine}`;

        fetch(matchHistoryApiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Erreur lors de la récupération de l'historique des parties !");
                }
                return response.json();
            })
            .then(matchHistoryData => {
                if (matchHistoryData.success && Array.isArray(matchHistoryData.data.matchInfo)) {
                    setMatchHistory(matchHistoryData.data.matchInfo); // Accéder à data.matchInfo
                } else {
                    console.error("L'API n'a pas renvoyé un tableau :", matchHistoryData);
                    setMatchHistoryError(new Error("L'API n'a pas renvoyé un tableau d'historique de parties."));
                    setMatchHistory(null);
                }
            })
            .catch(setMatchHistoryError);
    }, [gameName, tagLine]);

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
    const getPlayerInfo = (match, puuid) => {
        const player = match.info.participants.find(p => p.puuid === puuid);
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
        let baseClass = 'match-item w-[1500px] flex flex-col items-center mb-2.5 p-2.5';

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

    //fonciton pour obtenir les champs de la team adverse

    // Fonvertir le rôle en icône
    const getRoleIconUrl = (bite) => {
        const roleInfo = roleIcons.find(r => r.position === bite);
        return roleInfo ? roleInfo["position-icon"][0]["position-icon-link"] : "/images/roles/unknown.png";
    };
    
    // Summoner Icon
    const getSummonerSpellIconUrl = (summonerId) => {
        const spell = Object.values(summonerIcon.data).find(spell => spell.summonerId === summonerId.toString());
        return spell ? `https://ddragon.leagueoflegends.com/cdn/15.5.1/img/spell/${spell.id}.png` : null;
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

    // Fonction pour obtenir la couleur
    const interpolateColor = (color1, color2, factor) => {
        const r = Math.round(color1[0] + factor * (color2[0] - color1[0]));
        const g = Math.round(color1[1] + factor * (color2[1] - color1[1]));
        const b = Math.round(color1[2] + factor * (color2[2] - color1[2]));
        return `rgb(${r}, ${g}, ${b})`;
      };
      
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
    
    const getTeamTotalKills = (match, teamId) => {
        return match.info.participants
            .filter(p => p.teamId === teamId)
            .reduce((total, p) => total + p.kills, 0);
    };

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

    

    document.addEventListener('DOMContentLoaded', function() {
        const button = document.querySelector('button[aria-controls="test1"]');
        const content = document.getElementById('test1');
    
        button.addEventListener('click', function() {
            const isExpanded = button.getAttribute('aria-expanded') === 'true';
            
            // Toggle aria-expanded
            button.setAttribute('aria-expanded', !isExpanded);
            
            // Toggle visibility
            content.hidden = isExpanded;
            
            // Update data-state
            const newState = isExpanded ? 'closed' : 'open';
            button.setAttribute('data-state', newState);
            content.setAttribute('data-state', newState);
        });
    });

    // Toggle function to handle expansion for individual divs
    const toggleExpand = (matchId) => {
        setExpandedMatches((prevState) => ({
            ...prevState,
            [matchId]: !prevState[matchId], // Toggle the specific match's expanded state
        }));
    };
    
    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
    };

    const GameCreationComponent = ({ matchInfo }) => {
    if (!matchInfo || !matchInfo.info || !matchInfo.info.gameCreation) {
        return <div className="gameCreation">Date not available</div>;
    }};

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

    return (
        <div>
            <Header />
            <div>
                {error && <p style={{ color: "red" }}>{error.message}</p>}

            <div className="profile-container">
                <div className="player-container">
                    <div className="player-info">
                        <div className="container-icon-level-name-test">
                            <div className="container-icon-level">
                                    {data?.data?.summonerInfo?.profileIconId ? (
                                        <div>
                                            <img
                                                className="icon-player"
                                                src={`https://ddragon.leagueoflegends.com/cdn/15.6.1/img/profileicon/${data.data.summonerInfo.profileIconId}.png?${new Date().getTime()}`}
                                                alt="Icône du joueur"
                                            />
                                        </div>
                                    ) : (
                                        <Loader className="icon-player" />
                                    )}

                                <div className="player-level-container">
                                    {data?.data?.summonerInfo && (
                                        <div className="player-level">
                                            {data.data.summonerInfo.summonerLevel}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="container-name">
                                {data?.data?.accountInfo && (
                            <div>
                                <span className="gameName">{data.data.accountInfo.gameName}</span><span className="tagLine"> #{data.data.accountInfo.tagLine}</span>
                            </div>
                        )}
                </div>
            </div>            

                {data?.data?.rankInfo && (
                    <div className="rank-list">
                        {/* SoloQueue */}
                        {(() => {
                            const soloRank = getRankInfo(data.data.rankInfo, 'RANKED_SOLO_5x5');
                            return (
                                <div className="rank-item-solo">
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
                                <div className="rank-item-flex">
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

                <div className="match-history-container">
                    {matchHistoryError && <p style={{ color: "red" }}>{matchHistoryError.message}</p>}
                    {matchHistory === null ? (
                        <Loader />
                    ) : matchHistory.length > 0 ? (
                        matchHistory.map(match => {
                            const playerInfo = getPlayerInfo(match, data?.data?.accountInfo?.puuid);
                            const didPlayerWin = playerInfo.win;
                            const matchItemClass = getMatchItemClass(didPlayerWin, detailedMatches);
                                const toggleDetailedMatches = () => {
                                setDetailedMatches(!detailedMatches);
                            };
                            const opposingLaneChampion = getOpposingLaneChampion(match, playerInfo?.teamPosition);
                            const gameModeDisplay = match.info.gameMode === "CLASSIC" ? "Solo/Duo" : match.info.gameMode;
                            const gameDurationFormatted = formatGameDuration(match.info.gameDuration);
                            const championLevel = getChampionLevel(playerInfo);
                            const isExpanded = expandedMatches[match.info.gameId] || false;
                            const showTooltip = () => {
                                {gameDurationFormatted}
                              };
                            const roleIcon = getRoleIconUrl(playerInfo?.teamPosition);
                            const timeDifference = getTimeDifference(match.info.gameCreation);
                            return (
                            
                                <div
                                    key={match.metadata.matchId}
                                    className={`${matchItemClass} overflow-visible`}
                                >

                                        
                                    
                                    

                                    {playerInfo && (
                                        <div className="player-info-matchs flex min-w-[1400px] ml-[-60px]">
                                            <div className="match-info mt-1 text-[grey] mb-[10px] min-w-[100px] max-w-[100px]">
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

                                            <div className="player-summoner-spells border-[2px] px-1.5 py-[3px] rounded-sm border-[#2d2e31e8] bg-[#161618e8] ml-15">
                                                <div>
                                                    <img
                                                        className="match-spell-icon"
                                                        src={getSummonerSpellIconUrl(playerInfo.summoner1Id)}
                                                        alt={playerInfo.summoner1Id}
                                                    />
                                                </div>
                                                <div>
                                                    <img
                                                        className="match-spell-icon"
                                                        src={getSummonerSpellIconUrl(playerInfo.summoner2Id)}
                                                        alt={playerInfo.summoner2Id}
                                                    />
                                                </div>
                                            </div>

                                            <div className="player-runes fitems-center border-[2px] px-1.5 py-[3px] rounded-sm border-[#2d2e31e8] ml-2 bg-[#161618e8]">
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

                                            <div className="stat-modifiers fitems-center border-[2px] px-1.5 py-[3px] rounded-sm border-[#2d2e31e8] ml-2 bg-[#161618e8]">
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

                                            <div className="match-items-container w-[140px] flex border-[2px] px-1.5 py-[3px] rounded-sm border-[#2d2e31e8] ml-2 bg-[#161618e8]">
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

                                            <div className="player-stats-container justify-center ml-15 max-h-[70px] min-h-[70px] border-[2px] px-1.5 py-[3px] rounded-sm border-[#2d2e31e8] bg-[#161618e8]">
                                                <div className="player-farm">
                                                    <span className="farm-value text-[#999898] text-[17px]">{playerInfo.totalMinionsKilled + playerInfo.neutralMinionsKilled} CS</span><span class="text-[17px]"> / </span><span className="farm-value-per-minute italic text-[#999898] text-[17px]">{((playerInfo.totalMinionsKilled + playerInfo.neutralMinionsKilled) / (match.info.gameDuration / 60)).toFixed(1)}</span>
                                                    <span className="farm-title italic text-[#999898]"> CS/min</span>
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


                                            <div className="opposing-player-info flex items-center ml-[200px] border-[2px] px-1.5 py-[3px] rounded-sm border-[#2d2e31e8] bg-[#161618e8]">
                                                <div className="VS">VS</div><img className="match-champ-icon" src={getChampionIconUrl(opposingLaneChampion)} alt={opposingLaneChampion} />
                                            </div>
                                        </div>
                                    )}

                                    
                                    
                                    <div key={match.info.gameId} className="match-item">
                                        {/* Button to toggle expansion */}
                                        <button
                                            className="group absolute flex-col self-stretch items-center justify-center ml-[670px] mt-[-78px] cursor-pointer px-1.5 py-[15px] rounded-sm hover:bg-[#ffffff1a]"
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
                                                            <div class="absolute border-solid border-[#2d2e31e8] border-[2px] bg-[#161618e8] mt-[42px] px-[1px] text-gray-400 rounded">
                                                                {player.champLevel}
                                                            </div>
                                                            <div class="flex max-w-[296px] border-[#2d2e31e8] border-solid border-[2px] px-1.5 py-[3px] rounded bg-[#161618e8]">
                                                                <div class="min-w-50 flex my-auto">
                                                                    <img 
                                                                        className="match-champ-icon-detailed h-[50px] w-[50px]" 
                                                                        src={getChampionIconUrl(player.championName)} 
                                                                        alt={player.championName} 
                                                                    />
                                                                    <div class="mt-[15px] text-[16px] ml-2">
                                                                        {player.summonerName || player.riotIdGameName} 
                                                                    </div>
                                                                </div>
                                                                <div className="KDA text-[18px] my-auto min-w-[80px] max-w-[80px]">
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
                                                                            className="match-spell-icon"
                                                                            src={getSummonerSpellIconUrl(player.summoner1Id)}
                                                                            alt={player.summoner1Id}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <img
                                                                            className="match-spell-icon"
                                                                            src={getSummonerSpellIconUrl(player.summoner2Id)}
                                                                            alt={player.summoner2Id}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="player-runes fitems-center rounded ml-1 px-1.5 py-[3px] border-[#2d2e31e8] border-solid border-[2px] w-fit h-fit pr-1.5 bg-[#161618e8]">
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

                                                                <div className="match-items-container min-w-[136px] h-fit flex border-[2px] px-1.5 py-[3px] rounded-sm border-[#2d2e31e8] ml-1 bg-[#161618e8]">
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
                                                            <div class="absolute border-solid border-[#2d2e31e8] border-[2px] bg-[#161618e8] mt-[42px] px-[1px] text-gray-400 rounded">
                                                                {player.champLevel}
                                                            </div>
                                                            <div class="flex border-[#2d2e31e8] border-solid border-[2px] px-1.5 py-[3px] rounded bg-[#161618e8]">
                                                                <div class="min-w-50 flex my-auto">
                                                                    <img 
                                                                        className="match-champ-icon-detailed h-[50px] w-[50px]" 
                                                                        src={getChampionIconUrl(player.championName)} 
                                                                        alt={player.championName} 
                                                                    />
                                                                    <div class="mt-[15px] text-[16px] ml-2">
                                                                        {player.summonerName || player.riotIdGameName} 
                                                                    </div>
                                                                </div>
                                                                <div className="KDA text-[18px] my-auto min-w-[80px] max-w-[80px]">
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
                                                                            className="match-spell-icon"
                                                                            src={getSummonerSpellIconUrl(player.summoner1Id)}
                                                                            alt={player.summoner1Id}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <img
                                                                            className="match-spell-icon"
                                                                            src={getSummonerSpellIconUrl(player.summoner2Id)}
                                                                            alt={player.summoner2Id}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="player-runes fitems-center rounded ml-1 px-1.5 py-[3px] border-[#2d2e31e8] border-solid border-[2px] w-fit h-fit pr-1.5 bg-[#161618e8]">
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

                                                                <div className="match-items-container min-w-[136px] h-fit flex border-[2px] px-1.5 py-[3px] rounded-sm border-[#2d2e31e8] ml-1 bg-[#161618e8]">
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
