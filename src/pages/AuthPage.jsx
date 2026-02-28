import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Mail, Lock, User, Eye, EyeOff, LogIn, UserPlus, AlertCircle, Sparkles } from 'lucide-react'

function AuthPage() {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)

    const { signIn, signUp, signInWithGoogle } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const from = location.state?.from || '/watch'

    const handleGoogleLogin = async () => {
        setError('')
        setLoading(true)
        const { error } = await signInWithGoogle()
        if (error) {
            setError(error.message)
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setLoading(true)

        try {
            if (isLogin) {
                const { error } = await signIn(email, password)
                if (error) throw new Error(error.message)
                navigate(from, { replace: true })
            } else {
                if (password.length < 6) {
                    throw new Error('Password minimal 6 karakter')
                }
                if (!isLogin && !username.trim()) {
                    throw new Error('Username wajib diisi')
                }
                const { data, error } = await signUp(email, password, username)
                if (error) throw new Error(error.message)
                if (data?.user?.identities?.length === 0) {
                    throw new Error('Email sudah terdaftar. Silakan login.')
                }
                setSuccess('Akun berhasil dibuat! Cek email kamu untuk verifikasi, lalu login.')
                setIsLogin(true)
                setPassword('')
            }
        } catch (err) {
            let msg = err.message || 'Terjadi kesalahan'

            // Add extra hint for common login failures
            if (isLogin && (msg.includes('salah') || msg.includes('credentials'))) {
                msg += '\n\nPastikan email dan password benar. Jika baru daftar, cek email untuk verifikasi terlebih dahulu.'
            }

            setError(msg)
        } finally {
            setLoading(false)
        }
    }

    const switchMode = () => {
        setIsLogin(!isLogin)
        setError('')
        setSuccess('')
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                {/* Left decorative panel */}
                <div className="auth-hero">
                    <div className="auth-hero__content">
                        <div className="auth-hero__icon">
                            <Sparkles size={32} />
                        </div>
                        <h2 className="auth-hero__title">
                            {isLogin ? 'Selamat Datang Kembali!' : 'Bergabung Sekarang!'}
                        </h2>
                        <p className="auth-hero__text">
                            {isLogin
                                ? 'Login untuk menonton ribuan episode anime favoritmu dengan kualitas terbaik.'
                                : 'Daftar gratis dan mulai menonton anime tanpa batas di Kazedonime.'}
                        </p>
                        <div className="auth-hero__features">
                            <div className="auth-hero__feature">✓ Streaming gratis</div>
                            <div className="auth-hero__feature">✓ Multi-server & kualitas</div>
                            <div className="auth-hero__feature">✓ Update episode terbaru</div>
                        </div>
                    </div>
                </div>

                {/* Form panel */}
                <div className="auth-form-panel">
                    <Link to="/" className="auth-brand">
                        <img src="https://ik.imagekit.io/lhtvft4ai/Logo%20kaze.png" alt="Kazedonime" className="navbar__logo-img" />
                        <span className="gradient-text">Kazedonime</span>
                    </Link>

                    <h1 className="auth-title">
                        {isLogin ? 'Login' : 'Buat Akun'}
                    </h1>
                    <p className="auth-subtitle">
                        {isLogin
                            ? 'Masuk ke akun kamu untuk melanjutkan'
                            : 'Isi form di bawah untuk membuat akun baru'}
                    </p>

                    {error && (
                        <div className="auth-alert auth-alert--error">
                            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span style={{ whiteSpace: 'pre-line' }}>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="auth-alert auth-alert--success">
                            <AlertCircle size={16} />
                            <span>{success}</span>
                        </div>
                    )}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div className="auth-field">
                                <label className="auth-label" htmlFor="username">Username</label>
                                <div className="auth-input-wrap">
                                    <User size={18} className="auth-input-icon" />
                                    <input
                                        id="username"
                                        type="text"
                                        className="auth-input"
                                        placeholder="Masukkan username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required={!isLogin}
                                        autoComplete="username"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="auth-field">
                            <label className="auth-label" htmlFor="email">Email</label>
                            <div className="auth-input-wrap">
                                <Mail size={18} className="auth-input-icon" />
                                <input
                                    id="email"
                                    type="email"
                                    className="auth-input"
                                    placeholder="nama@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <label className="auth-label" htmlFor="password">Password</label>
                            <div className="auth-input-wrap">
                                <Lock size={18} className="auth-input-icon" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="auth-input"
                                    placeholder={isLogin ? 'Masukkan password' : 'Min. 6 karakter'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                                />
                                <button
                                    type="button"
                                    className="auth-input-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="auth-submit__loader" />
                            ) : isLogin ? (
                                <>
                                    <LogIn size={18} /> Masuk
                                </>
                            ) : (
                                <>
                                    <UserPlus size={18} /> Daftar
                                </>
                            )}
                        </button>

                        <div className="auth-separator">
                            <span>Atau</span>
                        </div>

                        <button
                            type="button"
                            className="auth-google-btn"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                        >
                            <img src="https://www.google.com/favicon.ico" alt="Google" className="google-icon" />
                            <span>Lanjutkan dengan Google</span>
                        </button>
                    </form>

                    <div className="auth-switch">
                        {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}
                        <button className="auth-switch-btn" onClick={switchMode}>
                            {isLogin ? 'Daftar di sini' : 'Login di sini'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AuthPage
