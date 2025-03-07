import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function Profile() {
    const { gameName, tagLine } = useParams();
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const apiUrl = `https://walopvgapi-9c205847a91e.herokuapp.com/info/${gameName}/${tagLine}`;

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    switch (response.status) {
                        case 404:
                            throw new Error("Aucun profil trouvé avec ce gameName et tagLine.");
                        case 429:
                            throw new Error("Trop de requêtes ! Veuillez réessayer plus tard.");
                        case 403:
                            throw new Error("Clé API invalide ou expirée.");
                        case 500:
                            throw new Error("Erreur interne du serveur. Réessayez plus tard.");
                        default:
                            throw new Error(`Erreur inattendue (${response.status})`);
                    }
                }
                return response.json();
            })
            .then(data => {
                setData(data);
                setError(null);
            })
            .catch(err => setError(err))
            .finally(() => setLoading(false)); // Stop le chargement après la requête
    }, [gameName, tagLine]);

    return (
        <div>
            <h1>Données du backend</h1>
            {error && <p style={{ color: "red" }}>{error.message}</p>}
            <pre>{data ? JSON.stringify(data, null, 2) : "Chargement..."}</pre>
        </div>
    );
}

export default Profile;
