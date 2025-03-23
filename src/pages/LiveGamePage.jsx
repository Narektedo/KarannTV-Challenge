import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Collapse } from 'react-bootstrap';
import Header from '../components/Header';
import rankIcons from '../rank.json';
import Loader from '../components/Loading.jsx';
import roleIcons from '../role.json';
import summonerIcon from '../summoner.json';
import runesIcon from '../perk.json';
import Arrow from '../components/Arrow.jsx';
import { ProgressBar } from 'primereact/progressbar';
import axios from 'axios';


function Profile () {
    const { gameName, tagLine } = useParams();
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [matchHistory, setMatchHistory] = useState(null);
    const [matchHistoryError, setMatchHistoryError] = useState(null);
    const [expandedMatches, setExpandedMatches] = useState({});
    const [detailedMatches, setDetailedMatches] = useState(false); // State pour gérer l'état du bouton
    const [isExpanded, setIsExpanded] = useState(false);
    const [version, setVersion] = useState(null);
    const [matchData, setMatchData] = useState(null); // Or the initial state from before
    const [isInGame, setIsInGame] = useState(false);
    const [puuid, setPuuid] = useState(null);
    const [loading, setLoading] = useState(true); // Added loading state
    const [gameInfo, setGameInfo] = useState(null);


    useEffect(() => {
        const checkLiveGame = async () => {
            setLoading(true);
            try {
                // 1. Fetch Player Info
                const infoUrl = `https://walopvgapi-9c205847a91e.herokuapp.com/info/${gameName}/${tagLine}`;
                const infoResponse = await axios.get(infoUrl);

                if (!infoResponse.data.success) {
                    throw new Error("Failed to fetch player info");
                }
                const fetchedPuuid = infoResponse.data.data.accountInfo.puuid;
                setPuuid(fetchedPuuid);

                // 2. Check Live Game Status
                const spectatorUrl = `https://walopvgapi-9c205847a91e.herokuapp.com/spectator/${fetchedPuuid}`;
                const spectatorResponse = await axios.get(spectatorUrl);

                if (spectatorResponse.data.success && spectatorResponse.data.data.isInGame) {
                    setIsInGame(true);
                    setGameInfo(spectatorResponse.data.data.gameInfo);
                } else {
                    setIsInGame(false);
                    setGameInfo(null);
                }
            } catch (err) {
                setError(err);
                console.error("Error checking live game:", err);
                setIsInGame(false);
                setGameInfo(null);
            } finally {
                setLoading(false);
            }
        };

        checkLiveGame();
    }, [gameName, tagLine]); // Run when gameName or tagLine changes

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    if (loading) {
        return <div>Loading...</div>; // Or any other loading indicator
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    const buttonStyle = {
        color: isInGame ? 'yellow' : 'gray',
    };

    return (
        <div>
            <div className="ml-[675px] mt-[140px] absolute border-[2px] px-2.5 py-[3px] rounded-sm border-[#2d2e31e8] bg-[#161618e8] hover:bg-[#ffffff1a]">
                <button
                    className="text-white text-2xl cursor-pointer"
                    type="button"
                    aria-controls="liveGameSearch"
                    aria-expanded={isExpanded}
                    data-state={isExpanded ? 'open' : 'closed'}
                    onClick={toggleExpand}
                    style={buttonStyle}
                >
                    Live Game
                </button>
            </div>

            {isExpanded && isInGame && gameInfo && (
                <div
                    className="mt-4 ml-[675px] bg-white text-black p-4 border rounded shadow-md absolute"
                    id="liveGameSearch"
                    data-state={isExpanded ? 'open' : 'closed'}
                >
                    <h3 className="text-lg font-semibold">Game Details</h3>
                    <p>Game ID: {gameInfo.gameId}</p>
                    <p>Game Mode: {gameInfo.gameMode}</p>
                    <p>Game Type: {gameInfo.gameType}</p>
                    <h4 className="text-md font-semibold mt-2">Participants:</h4>
                    <ul>
                        {gameInfo.participants.map((participant) => (
                            <li key={participant.puuid}>
                                {participant.riotId} - Champion ID: {participant.championId}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {isExpanded && !isInGame && (
                <div className="mt-4 ml-[675px] bg-white text-black p-4 border rounded shadow-md absolute">
                    <p>Player is not in game</p>
                </div>
            )}
        </div>
    );
}

export default Profile;
