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
                setData(data);
                setError(null);
            })
            .catch(setError)
            .finally(() => setLoading(false));
    }, [gameName, tagLine]);

    return (
        <div>
            <Header />
            <h1 className="container">Données du backend</h1>
            {loading && <p>Chargement...</p>}
            {error && <p style={{ color: "red" }}>{error.message}</p>}

            {!loading && !error && data && (
                <div>
                    <h2>{data.accountInfo.gameName}#{data.accountInfo.tagLine}</h2>

                    {/* Affichage de l'icône de profil */}
                    <img
                        src={`https://ddragon.leagueoflegends.com/cdn/15.4.1/img/profileicon/${data.summonerInfo.profileIconId}.png`}
                        alt="Icône du joueur"
                        style={{ width: 100, height: 100, borderRadius: "50%" }}
                    />

                    <p>Niveau : {data.summonerInfo.summonerLevel}</p>
                </div>
            )}
        </div>
    );
}

export default Profile;
