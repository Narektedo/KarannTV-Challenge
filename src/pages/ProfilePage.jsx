import React from "react"
import { useParams } from "react-router-dom"
import Header from '../components/Header'
import profiles from '../profiles.json'

export default function ProfilePage() {
    const id = useParams();
    
    // fetch the profile from the profiles.json file
    const profile = profiles.find(profile => profile.link === id.user);

    return (
        <>
            <Header />
            <div className="container">
                {profile ? (
                    <div>
                        <h1 className="profile_title">{profile.name} </h1>
                    
                        <div className="logo_centrage">
                            <img src={profile.image} alt={id.user} className="logo_narek"/>
                        </div><br/>

                        <div className="list">
                            {profile.nicknames.map((nickname, i) => (
                                <a className="profile_button" key={i} href={nickname.link} target="_blank">{nickname.username}</a>
                            ))}
                        </div>
                    </div>
                ) : (
                    <h1>Profile not found</h1>
                )}
            </div>
        </>
    )
}