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
        let baseClass = 'match-item w-[1200px] flex items-center mb-2.5 p-2.5';

        // Ajoute la classe pour la hauteur en fonction de l'état du bouton
        baseClass += isDetailed ? ' min-h-[800px]' : ' min-h-[100px]';

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
                                        <img
                                            className="icon-player"
                                            src={`https://ddragon.leagueoflegends.com/cdn/15.4.1/img/profileicon/${data.data.summonerInfo.profileIconId}.png?${new Date().getTime()}`}
                                            alt="Icône du joueur"
                                        />
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
                            const gameDurationFormatted = formatGameDuration(match.info.gameDuration); // Formater la durée
                            const championLevel = getChampionLevel(playerInfo);
                            const isExpanded = expandedMatches[match.info.gameId] || false;

                            const roleIcon = getRoleIconUrl(playerInfo?.teamPosition); 
                            return (
                            
                                <div
                                    key={match.metadata.matchId}
                                    className={`${matchItemClass} overflow-visible`}
                                >

                                    
                                    <div className="match-info mt-1 text-[grey] mb-[50px]">
                                        <div className="game-mode flex">{gameModeDisplay}</div>
                                        <div className="game-duration">{gameDurationFormatted}</div>
                                    </div>
                                    <span className="player-role-container"><img src={roleIcon} alt="role-icon" className="player-role" /></span>

                                    {playerInfo && (
                                        <div className="player-info-matchs">
                                            <div className="champ-icon-level-container">
                                                <img className="match-champ-icon" src={getChampionIconUrl(playerInfo.championName)} alt={playerInfo.championName} />
                                                <div className="match-champion-level">
                                                    {championLevel}
                                                </div>
                                            </div>
                                            <div className="KDA">
                                                <span className="kills">{playerInfo.kills}</span>/<span className="deaths">{playerInfo.deaths}</span>/<span className="assists">{playerInfo.assists}</span>
                                                <div className="KDA-calculated" style={{ color: getKDAColor(playerInfo) }}>
                                                    <span className="KDA-title">KDA </span>{((playerInfo.kills + playerInfo.assists) / Math.max(1, playerInfo.deaths)).toFixed(1)}
                                                </div>
                                            </div>

                                            <div className="player-summoner-spells">
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

                                            <div className="player-runes fitems-center rounded ml-2.5 px-1.5 py-[3px] border-[#55575ce8] border-solid border-[2px] w-[160px] pr-1.5">
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
                                            <div className="match-items-container w-[140px] flex border-[2px] rounded-sm border-[#505258] ml-[10px]">
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

                                            <div className="player-stats-container ml-[50px]">
                                                <div className="player-farm">
                                                    <span className="farm-value">{playerInfo.totalMinionsKilled + playerInfo.neutralMinionsKilled} CS</span>
                                                    <div className="farm-per-minute">
                                                        <span className="farm-value-per-minute">{((playerInfo.totalMinionsKilled + playerInfo.neutralMinionsKilled) / (match.info.gameDuration / 60)).toFixed(1)}</span>
                                                        <span className="farm-title"> CS/min</span>
                                                    </div>
                                                </div>
                                                <div className="player-kp" style={{ color: getKPColor(playerInfo, getTeamTotalKills(match, playerInfo.teamId)) }}>
                                                    {(() => {
                                                        const teamTotalKills = getTeamTotalKills(match, playerInfo.teamId);
                                                        const kp = calculateKP(playerInfo, teamTotalKills);
                                                        return `${kp}%`;
                                                    })()} KP
                                                </div>
                                            </div>
                                           
                                        </div>
                                    )}

                                    <div className="opposing-player-info flex items-center ml-[200px]">
                                        <div className="VS">VS</div><img className="match-champ-icon" src={getChampionIconUrl(opposingLaneChampion)} alt={opposingLaneChampion} />
                                    </div>

                                    <div key={match.info.gameId} className="match-item">
                                        {/* Button to toggle expansion */}
                                        <button
                                            className="group flex flex-col self-stretch -my-12 items-center justify-center py-8 lg:py-0"
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

                                        {/* Div that is toggled */}
                                        <div
                                        id={`test-${match.info.gameId}`}
                                        data-state={isExpanded ? 'open' : 'closed'}
                                        hidden={!isExpanded} // Hide or show based on state
                                        className="mt-100"
                                        >
                                        YES HELLO XD
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
