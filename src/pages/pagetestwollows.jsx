import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from '../components/Header'

// Fonction utilitaire pour récupérer le rang spécifique
const getRankInfo = (rankData, queueType) => {
    return rankData?.find(rank => rank.queueType === queueType) || { tier: 'UNRANKED' };
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
                console.log(responseData); // Vérifie si profileIconId existe bien
                setData(responseData);
            })
            .catch(setError);
    }, [gameName, tagLine]);

    return (
        <div>
            <Header />
            <h1 className="container">Profil du joueur</h1>
            {error && <p style={{ color: "red" }}>{error.message}</p>}

            {/*#############################################################*/}
            {/* Affichage Icone */}
            {/*#############################################################*/}

            {data && data.data && data.data.summonerInfo && data.data.summonerInfo.profileIconId ? (
                <img
                    src={`https://ddragon.leagueoflegends.com/cdn/15.4.1/img/profileicon/${data.data.summonerInfo.profileIconId}.png?${new Date().getTime()}`}
                    alt="Icône du joueur"
                    style={{ width: 100, height: 100, borderRadius: "50%" }}
                />
            ) : (
                <p>Chargement de l'icône...</p>
            )}

            {/*#############################################################*/}
            {/* Affichage des Rangs */}
            {/*#############################################################*/}

            {data?.data?.rankInfo && (
                <div className="rank-container">
                    {/* Solo/Duo Rank */}
                    {(() => {
                        const soloRank = getRankInfo(data.data.rankInfo, 'RANKED_SOLO_5x5');
                        return (
                            <div className="rank-icon">
                                <img
                                    src={`https://opgg-static.akamaized.net/images/medals/${soloRank.tier.toLowerCase()}.png`}
                                    alt={`Solo/Duo ${soloRank.tier}`}
                                    onError={(e) => {
                                        e.target.src = 'https://opgg-static.akamaized.net/images/medals/unranked.png';
                                    }}
                                />
                                {soloRank.tier !== 'UNRANKED' && (
                                    <span>{soloRank.tier} {soloRank.rank}</span>
                                )}
                            </div>
                        );
                    })()}

                    {/* Flex Rank */}
                    {(() => {
                        const flexRank = getRankInfo(data.data.rankInfo, 'RANKED_FLEX_SR');
                        return (
                            <div className="rank-icon">
                                <img
                                    src={`https://opgg-static.akamaized.net/images/medals/${flexRank.tier.toLowerCase()}.png`}
                                    alt={`Flex ${flexRank.tier}`}
                                    onError={(e) => {
                                        e.target.src = 'https://opgg-static.akamaized.net/images/medals/unranked.png';
                                    }}
                                />
                                {flexRank.tier !== 'UNRANKED' && (
                                    <span>{flexRank.tier} {flexRank.rank}</span>
                                )}
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
