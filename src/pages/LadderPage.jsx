import React, { useState, useEffect } from "react";
import Header from '../components/Header';
import axios from 'axios';
import rankIcons from './rank.json';

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
            const response = await axios.get('YOUR_API_ENDPOINT/ladder');
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

    const getRankIcon = (tier) => {
        const rank = rankIcons.find((rank) => rank.tier === tier);
        return rank ? rank.image : '/images/default_rank_icon.png'; // Chemin par défaut si non trouvé
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
                                <th>Joueur</th>
                                <th>Compte</th>
                                <th>Tier</th>
                                <th>Division</th>
                                <th>LP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {players.map((player, index) => (
                                <tr key={player.puuid}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <img src={player.image} alt={player.name} style={{ width: '30px', height: '30px', marginRight: '5px' }} />
                                        {player.name}
                                    </td>
                                    <td>{player.gameName}#{player.tagLine}</td>
                                    <td>
                                        <img src={getRankIcon(player.tier)} alt={player.tier} style={{ width: '30px', height: '30px', marginRight: '5px' }} />
                                        {player.tier}
                                    </td>
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
