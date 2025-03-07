import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from '../components/Header'

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
            .then(setData)
            .catch(setError);
    }, [gameName, tagLine]);

    return (
        <div>
            <Header />
            <h1 className="container">Données du backend</h1>
            {error && <p style={{ color: "red" }}>{error.message}</p>}

            {data && data.summonerInfo && data.summonerInfo.iconId && (
                <img
                    src={`https://ddragon.leagueoflegends.com/cdn/15.4.1/img/profileicon/${data.summonerInfo.iconId}.png`}
                    alt="Icône du joueur"
                    style={{ width: 100, height: 100, borderRadius: "50%" }}
                />
            )}

            <pre>{data ? JSON.stringify(data, null, 2) : "Chargement..."}</pre>
        </div>
    );
}

export default Profile;
