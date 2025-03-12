import React, { useState, useEffect } from "react";
import Header from '../components/Header';
import axios from 'axios'; // Assurez-vous d'avoir installé axios

export default function LadderPage() {
    const [players, setPlayers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchLadder();
    }, []);

    const fetchLadder = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get('https://walopvgapi-9c205847a91e.herokuapp.com/ladder');
            setPlayers(response.data);
        } catch (err) {
            setError('Erreur lors du chargement du classement');
            console.error(err);
        }
        setIsLoading(false);
    };

    const refreshLadder = () => {
        fetchLadder();
    };

    return (
        <>
            <Header />
            <div className="container">
                <h1>Classement des joueurs</h1>
                <button onClick={refreshLadder}>Actualiser</button>
                {isLoading ? (
                    <p>Chargement en cours...</p>
                ) : error ? (
                    <p>{error}</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Rang</th>
                                <th>Nom du joueur</th>
                                <th>Tier</th>
                                <th>Division</th>
                                <th>LP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {players.map((player, index) => (
                                <tr key={player.puuid}>
                                    <td>{index + 1}</td>
                                    <td>{player.gameName}#{player.tagLine}</td>
                                    <td>{player.tier}</td>
                                    <td>{player.rank}</td>
                                    <td>{player.leaguePoints}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
}
