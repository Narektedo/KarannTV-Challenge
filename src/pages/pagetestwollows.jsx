import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from '../components/Header';
import rankIcons from '../rank.json';

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

    useEffect(() => {
        const apiUrl = `https://walopvgapi-9c205847a91e.herokuapp.com/info/${gameName}/${tagLine}`;
    
        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Erreur lors de la récupération des données !");
                }
                return response.json();
            })
            .then(responseData => {
                setData(responseData);
            })
            .catch(setError);
    }, [gameName, tagLine]);

    const renderRankInfo = (rankInfo) => {
        if (rankInfo.tier === 'UNRANKED') {
            return 'Unranked';
        } else {
            return `${rankInfo.tier} ${rankInfo.rank} ${rankInfo.leaguePoints} LP`;
        }
    };

    return (
        <div>
            <Header />
            <div className="container">
                {error && <p style={{ color: "red" }}>{error.message}</p>}

                {/*#############################################################*/}
                {/* Affichage Icone et Pseudo */}
                {/*#############################################################*/}

                <div className="player-info">
                    {data?.data?.summonerInfo?.profileIconId ? (
                        <img
                            className="icon-player"
                            src={`https://ddragon.leagueoflegends.com/cdn/15.4.1/img/profileicon/${data.data.summonerInfo.profileIconId}.png?${new Date().getTime()}`}
                            alt="Icône du joueur"
                        />
                    ) : (
                        <p>Chargement de l'icône...</p>
                    )}
                    
                    {data?.data?.accountInfo && (
                        <div className="player-name">
                            {data.data.accountInfo.gameName}#{data.data.accountInfo.tagLine}
                        </div>
                    )}
                </div>

            </div>

            {/*#############################################################*/}
            {/* Affichage Ranks */}
            {/*#############################################################*/}

            {data?.data?.rankInfo && (
                <div className="rank-container">

                    {/*###########*/}
                    {/* SoloQueue */}
                    {/*###########*/}
                    {(() => {
                        const soloRank = getRankInfo(data.data.rankInfo, 'RANKED_SOLO_5x5');
                        return (
                            <div className="rank-icon">
                                <div className="rank-text-title">Solo/Duo</div>
                                <img
                                    src={getLocalRankIcon(soloRank.tier)}
                                    alt={`Solo/Duo ${soloRank.tier}`}
                                    style={{ width: 100, height: 100, borderRadius: "50%" }}
                                    onError={(e) => {
                                        e.target.src = '/rank/Rank=Unranked.png';
                                    }}
                                />
                                <div className="rank-text">
                                    {renderRankInfo(soloRank)}
                                </div>
                            </div>
                        );
                    })()}

                    {/*######*/}
                    {/* Flex */}
                    {/*######*/}
                    {(() => {
                        const flexRank = getRankInfo(data.data.rankInfo, 'RANKED_FLEX_SR');
                        return (
                            <div className="rank-icon">
                                <div className="rank-text-title">Flex</div>
                                <img
                                    src={getLocalRankIcon(flexRank.tier)}
                                    alt={`Flex ${flexRank.tier}`}
                                    style={{ width: 100, height: 100, borderRadius: "50%" }}
                                    onError={(e) => {
                                        e.target.src = '/rank/Rank=Unranked.png';
                                    }}
                                />
                                <div className="rank-text">
                                    {renderRankInfo(flexRank)}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}

            <pre>{data ? JSON.stringify(data, null, 2) : "Chargement..."}</pre>
        </div>
    );
}

export default Profile;
