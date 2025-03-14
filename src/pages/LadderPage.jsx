import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from '../components/Header';
import axios from 'axios';
import rankIcons from '../rank.json';
import profiles from '../profiles.json';
import '../index.css';
import Loader from '../components/Loading.jsx';

export default function LadderPage() {
    const [players, setPlayers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(null);
    const [refreshCooldown, setRefreshCooldown] = useState(false);
    const [cooldownTime, setCooldownTime] = useState(0);
    const cooldownIntervalRef = useRef(null);

    const navigate = useNavigate();

    useEffect(() => {
        fetchLadder();
    }, []);

    useEffect(() => {
        if (refreshCooldown) {
            setCooldownTime(60);
            cooldownIntervalRef.current = setInterval(() => {
                setCooldownTime(prevTime => {
                    if (prevTime <= 1) {
                        clearInterval(cooldownIntervalRef.current);
                        setRefreshCooldown(false);
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);
        } else {
            clearInterval(cooldownIntervalRef.current);
            setCooldownTime(0);
        }

        return () => clearInterval(cooldownIntervalRef.current);
    }, [refreshCooldown]);

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
            return;
        }

        setRefreshCooldown(true);

        setIsLoading(true);
        setError(null);
        try {
            // Actualisation backend
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

    const goToPlayerProfile = (playerName) => {
        navigate(`/profiles/${playerName}`);
    };

    const goToAccountProfile = (gameName, tagLine) => {
        navigate(`/profiles/${gameName}/${tagLine}`);
    };

    return (
        <>
            <Header />
            <div className="ladder-container">
                <div className="ladder-title">Ladder SoloQueue</div>
                <div className="ladder-header">
                    <button onClick={refreshLadder} disabled={refreshCooldown} className="ladder-refresh-button">
                        {refreshCooldown ? `Refresh up dans ${cooldownTime}s` : 'Refresh'}
                    </button>
                    {lastRefresh && <p className="last-refresh">Dernière actualisation : {lastRefresh.toLocaleTimeString()}</p>}
                </div>
                {isLoading ? (
                    <Loader className="icon-player" />
                ) : error ? (
                    <p>{error}</p>
                ) : (
                    <table className="ladder-table">
                        <thead>
                            <tr>
                                <th>Rang</th>
                                <th>Joueur</th>
                                <th className="player-account-width">
                                    <div className="player-account-header">
                                        Compte
                                    </div>
                                </th>
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
                                        <div className="container-image-name-ladder">
                                            {player.image && (
                                                <img src={player.image} alt={player.name} className="player-image" />
                                            )}
                                            <div 
                                                className="player-name-ladder clickable" 
                                                onClick={() => goToPlayerProfile(player.name)}
                                            >
                                                {player.name}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="">
                                        <div 
                                            className="player-account clickable" 
                                            onClick={() => goToAccountProfile(player.gameName, player.tagLine)}
                                        >
                                            {player.gameName}#{player.tagLine}
                                        </div>
                                    </td>
                                    <div className="rank-ladder">
                                        <img src={getRankIcon(player.tier)} alt={player.tier} className="rank-icon-ladder" />

                                    </div>
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
