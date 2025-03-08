import React from "react"
import { useParams } from "react-router-dom"
import Header from '../components/Header'

export default function ProfilePage() {
    const id = useParams();

    return (
        <>
            <Header />
            <div className="container">
            Test A
            </div>
        </>
    )
}


