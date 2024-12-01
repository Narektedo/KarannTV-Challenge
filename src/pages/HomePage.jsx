import React from "react"
import Header from '../components/Header'
import profiles from '../profiles.json'


export default function Home() {


  return (
    <>
        <Header />
        <div className='container'>

          <div className="list_player_1">

            {profiles.map((profile, i) => (
              <div key={i} className="profile">
                  <img src={profile.image} alt={profile.name} className="profile_img" />
                  <a className='profile_button' href={`profiles/${profile.link}`}>{profile.name}</a>
              </div>
            ))}

        

        </div>

      </div>

    
    </>
  )
}
