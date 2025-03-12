import React, { useState, useEffect } from "react";
import Header from '../components/Header';
import axios from 'axios';
import rankIcons from '../rank.json';
import profiles from '../profiles.json';

export default function LadderPage() {
    const [players, setPlayers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(null);
    const [refreshCooldown, setRefreshCooldown] = useState(false);

    useEffect(() => {
        fetchLadder();
    }, []);

    const fetchLadder = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get('https://walopvgapi-9c205847a91e.herokuapp.com/ladder');
            const ladderData = response.data;

            // Fusionner les données de l'API avec les informations locales
            const enrichedPlayers = ladderData.map(player => {
                const profileInfo = profiles.find(p => p.nicknames.some(n => n.gameName === player.gameName && n.tagLine === player.tagLine));
                return {
                    ...player,
                    name: profileInfo ? profileInfo.name : player.gameName,
                    image: profileInfo ? profileInfo.image : null
                };
            });

            setPlayers(enrichedPlayers);
        } catch (err) {
            setError('Erreur lors du chargement du classement');
            console.error(err);
        }
        setIsLoading(false);
    };

    const refreshLadder = async () => {
        if (refreshCooldown) {
            alert("Veuillez attendre avant d'actualiser à nouveau.");
            return;
        }

        setRefreshCooldown(true);
        setTimeout(() => {
            setRefreshCooldown(false);
        }, 60000); // 60 secondes

        setIsLoading(true);
        setError(null);
        try {
            // Effectuer la requête pour actualiser les données sur le backend
            await axios.get('https://walopvgapi-9c205847a91e.herokuapp.com/refresh-ladder');

            // Récupérer les données actualisées du ladder
            const response = await axios.get('https://walopvgapi-9c205847a91e.herokuapp.com/ladder');
            const ladderData = response.data;

            // Fusionner les données de l'API avec les informations locales
            const enrichedPlayers = ladderData.map(player => {
                const profileInfo = profiles.find(p => p.nicknames.some(n => n.gameName === player.gameName && n.tagLine === player.tagLine));
                return {
                    ...player,
                    name: profileInfo ? profileInfo.name : player.gameName,
                    image: profileInfo ? profileInfo.image : null
                };
            });

            setPlayers(enrichedPlayers);
            setLastRefresh(new Date());
        } catch (err) {
            setError('Erreur lors de l\'actualisation du classement');
            console.error(err);
        }
        setIsLoading(false);
    };

    const getRankIcon = (tier) => {
        const rank = rankIcons.find((rank) => rank['rank-tier'].toUpperCase() === tier);
        return rank ? rank['rank-icon'][0]['rank-icon-link'] : '/rank/Rank=Unranked.png';
    };

    return (
        <>
            <Header />
            <div className="container">
                <h1>Classement des joueurs</h1>
                <button onClick={refreshLadder} disabled={refreshCooldown}>
                    {refreshCooldown ? 'Actualisation en cours...' : 'Actualiser'}
                </button>
                {lastRefresh && <p>Dernière actualisation : {lastRefresh.toLocaleTimeString()}</p>}
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
                                        {player.image && (
                                            <img src={player.image} alt={player.name} style={{ width: '30px', height: '30px', marginRight: '5px' }} />
                                        )}
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
