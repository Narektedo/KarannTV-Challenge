import { useEffect, useState } from "react";


function App() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch("https://walopvgapi-9c205847a91e.herokuapp.com/info/NAREKTED/EUW") // Appel au backend
            .then(response => {
                if (!response.ok) {
                    throw new Error("Erreur lors de la récupération des données !");
                }
                return response.json();
            })
            .then(setData)
            .catch(setError);
    }, []);

    return (
        <div>
            <h1> Données du backend</h1>
            {error && <p style={{ color: "red" }}> {error.message}</p>}
            <pre>{data ? JSON.stringify(data, null, 2) : "Chargement..."}</pre>
        </div>
    );
}

export default App;