function Footer() {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer__content">
                    <div>
                        <div className="footer__brand gradient-text">Kazedonime</div>
                        <p className="footer__text">Teman setia pencari anime favoritmu</p>
                    </div>
                    <div className="footer__links">
                        <a
                            href="https://jikan.moe"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="footer__link"
                        >
                            Jikan API
                        </a>
                        <a
                            href="https://myanimelist.net"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="footer__link"
                        >
                            MyAnimeList
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
