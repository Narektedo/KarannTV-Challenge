import React from "react";
import Header from '../components/Header';
import ladder from '../ladder.json';

export default function Ladder() {

    return(
    <>  
        <Header />
        <div className="container">
            <div className="list_player_1">

                {ladder.map((ladder, i) => (
                    <div key={i} className="ladder">
                    <a className='ladder_button' href={`ladder/${ladder.link}`}>{ladder.ladder_type}</a>
                </div>
            ))}
            </div>

        </div>
        </>
    )
}