import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function Profile() {
    const { gameName, tagLine } = useParams();
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const apiUrl = `https://walopvgapi-9c205847a91e.herokuapp.com/info/${gameName}/${tagLine}`;

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erreur: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("Données reçues :", data); // 🔍 Vérification dans la console
                setData(data);
                setError(null);
            })
            .catch(err => {
                console.error("Erreur API :", err);
                setError(err);
            })
            .finally(() => setLoading(false));
    }, [gameName, tagLine]);

    if (loading) return <p>Chargement...</p>;
    if (error) return <p style={{ color: "red" }}>Erreur : {error.message}</p>;
    if (!data || !data.summonerInfo) return <p style={{ color: "red" }}>Données non disponibles</p>;

    console.log("profileIconId:", data?.summonerInfo?.profileIconId);
    console.log("Image URL:", `https://ddragon.leagueoflegends.com/cdn/15.4.1/img/profileicon/${data?.summonerInfo?.profileIconId}.png`);


    return (
        <div>
            <h1>Profil du joueur</h1>
            <h2>{data.accountInfo?.gameName}#{data.accountInfo?.tagLine}</h2>

            {/* Affichage de l'icône de profil */}
            <img
                src={`https://ddragon.leagueoflegends.com/cdn/15.4.1/img/profileicon/${data.summonerInfo.profileIconId}.png`}
                alt="Icône du joueur"
                style={{ width: 100, height: 100, borderRadius: "50%" }}
                    onError={(e) => { e.target.src = "/images/default_icon.png"; }} // Fallback si l'image ne charge pas
            />

            <p>Niveau : {data.summonerInfo.summonerLevel}</p>
        </div>
    );
}

export default Profile;
