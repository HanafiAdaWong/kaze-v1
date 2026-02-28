function Loader({ text = 'Loading...' }) {
    return (
        <div className="loader-container">
            <div className="loader" />
            <span className="loader-text">{text}</span>
        </div>
    )
}

export default Loader
