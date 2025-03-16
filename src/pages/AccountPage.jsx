import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from '../components/Header';
import rankIcons from '../rank.json';
import Loader from '../components/Loading.jsx';
import roleIcons from '../role.json';
import summonerIcon from '../summoner.json';
import runesIcon from '../perk.json';

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
    const getSummonerIconUrl = (spellId) => {
        return `http://ddragon.leagueoflegends.com/cdn/15.4.1/img/spell/${spellId}.png`;
    };

    // Fonction pour obtenir l'icône du champion
    const getChampionIconUrl = (championName) => {
        return `http://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${championName}.png`;
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
          [214, 213, 152],  // (KDA = 3)
          [212, 211, 131],   // (KDA = 5)
          [201, 200, 101]  // KDA > 5)
        ];
        
        if (kda <= 1) return interpolateColor(colors[0], colors[1], kda);
        if (kda <= 3) return interpolateColor(colors[1], colors[2], (kda - 1) / 2);
        if (kda <= 5) return interpolateColor(colors[2], colors[3], (kda - 3) / 2);
        return interpolateColor(colors[3], colors[4], Math.min((kda - 5) / 5, 1));
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
                            const win = didPlayerWin(match, data?.data?.accountInfo?.puuid);
                            const matchItemClass = `match-item ${win ? 'win' : 'loss'}`; // Classe conditionnelle

                            const opposingLaneChampion = getOpposingLaneChampion(match, playerInfo?.teamPosition);
                            const gameModeDisplay = match.info.gameMode === "CLASSIC" ? "Solo/Duo" : match.info.gameMode;
                            const gameDurationFormatted = formatGameDuration(match.info.gameDuration); // Formater la durée

                            const roleIcon = getRoleIconUrl(playerInfo?.teamPosition); 
                            return (
                                <div
                                    key={match.metadata.matchId}
                                    className={matchItemClass}
                                >
                                    <div className="match-info">
                                        <div className="game-mode">{gameModeDisplay}</div>
                                        <div className="game-duration">{gameDurationFormatted}</div>
                                    </div>
                                    <span className="player-role-container"><img src={roleIcon} alt="role-icon" className="player-role" /></span>

                                    {playerInfo && (
                                      <div className="player-info-matchs">
                                            <img className="match-champ-icon" src={getChampionIconUrl(playerInfo.championName)} alt={playerInfo.championName}/>
                                            <div className="KDA"> <span className="kills">{playerInfo.kills}</span>/<span className="deaths">{playerInfo.deaths}</span>/<span className="assists">{playerInfo.assists}</span>
                                            <div className="KDA-calculated" style={{ color: getKDAColor(playerInfo) }}><span className="KDA-title">KDA   </span>{((playerInfo.kills + playerInfo.assists) / Math.max(1, playerInfo.deaths)).toFixed(1)}</div>
                                            </div>
                                            <div className="player-summoner-spells">
                                                {playerInfo.summoner1Id && summonerIcon[playerInfo.summoner1Id] && (
                                                    <img 
                                                        className="match-spell-icon" 
                                                        src={`https://ddragon.leagueoflegends.com/cdn/15.5.1/img/spell/${summonerIcon[playerInfo.summoner1Id].id}.png`} 
                                                        alt={summonerIcon[playerInfo.summoner1Id].id} 
                                                    />
                                                )}
                                                {playerInfo.summoner2Id && summonerIcon[playerInfo.summoner2Id] && (
                                                    <img 
                                                        className="match-spell-icon" 
                                                        src={`https://ddragon.leagueoflegends.com/cdn/15.5.1/img/spell/${summonerIcon[playerInfo.summoner2Id].id}.png`} 
                                                        alt={summonerIcon[playerInfo.summoner2Id].id} 
                                                    />
                                                )}
                                            </div>
                                            <div className="player-runes">
                                                {playerInfo.perks.styles.map((style, styleIndex) => (
                                                    <div key={styleIndex} className="rune-style">
                                                    {style.selections.map((selection, selectionIndex) => {
                                                        const perk = runesIcon.perks.find(p => p.id === selection.perk.toString());
                                                        return perk ? (
                                                        <img 
                                                            key={selectionIndex}
                                                            className="match-rune-icon"
                                                            src={`/${perk.icon}`} // Assurez-vous que ce chemin est correct
                                                            alt={perk.name}
                                                        />
                                                        ) : null;
                                                    })}
                                                    </div>
                                                ))}
                                            </div>                                         
                                            <div className="match-items-container">
                                                {playerInfo.item0 ? <img className="match-item-icon" src={`http://ddragon.leagueoflegends.com/cdn/11.16.1/img/item/${playerInfo.item0}.png`} alt={playerInfo.item0} /> : null}
                                                {playerInfo.item1 ? <img className="match-item-icon" src={`http://ddragon.leagueoflegends.com/cdn/11.16.1/img/item/${playerInfo.item1}.png`} alt={playerInfo.item1} /> : null}
                                                {playerInfo.item2 ? <img className="match-item-icon" src={`http://ddragon.leagueoflegends.com/cdn/11.16.1/img/item/${playerInfo.item2}.png`} alt={playerInfo.item2} /> : null}
                                                {playerInfo.item3 ? <img className="match-item-icon" src={`http://ddragon.leagueoflegends.com/cdn/11.16.1/img/item/${playerInfo.item3}.png`} alt={playerInfo.item3} /> : null}
                                                {playerInfo.item4 ? <img className="match-item-icon" src={`http://ddragon.leagueoflegends.com/cdn/11.16.1/img/item/${playerInfo.item4}.png`} alt={playerInfo.item4} /> : null}
                                                {playerInfo.item5 ? <img className="match-item-icon" src={`http://ddragon.leagueoflegends.com/cdn/11.16.1/img/item/${playerInfo.item5}.png`} alt={playerInfo.item5} /> : null}
                                            </div>
                                        </div>
                                          )}
                                            
                                            <div className="opposing-player-info">
                                                <div className="VS">VS</div><img className="match-champ-icon" src={getChampionIconUrl(opposingLaneChampion)} alt={opposingLaneChampion}/>
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
