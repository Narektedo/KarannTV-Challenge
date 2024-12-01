

export default function Header() {
    return(
        <header className="site_header">
            <a href="/" className="home_button">
                <img src="/images/home.png" alt="Retour à l'accueil" className="icon"/>
            </a>
            <div className="site_info">
                <img src="/images/logo_lol.png" alt="Logo du site" className="logo"/>
                <span className="site_name">Tracker KTV</span>
            </div>
        </header>
    )

}