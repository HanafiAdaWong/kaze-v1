import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

/**
 * Translate Supabase auth error messages to Indonesian
 */
function translateAuthError(message) {
    if (!message) return 'Terjadi kesalahan. Coba lagi.'

    const msg = message.toLowerCase()

    // Network / connection errors
    if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('network')) {
        return 'Gagal terhubung ke server. Periksa koneksi internet kamu dan coba lagi.'
    }
    if (msg.includes('fetch') && msg.includes('error')) {
        return 'Gagal terhubung ke server. Periksa koneksi internet kamu dan coba lagi.'
    }

    // Auth errors
    const map = {
        'invalid login credentials': 'Email atau password salah.',
        'email not confirmed': 'Email belum diverifikasi. Cek kotak masuk email kamu.',
        'user already registered': 'Email sudah terdaftar. Silakan login.',
        'signup requires a valid password': 'Password tidak valid.',
        'password should be at least 6 characters': 'Password minimal 6 karakter.',
        'unable to validate email address: invalid format': 'Format email tidak valid.',
        'email rate limit exceeded': 'Terlalu banyak percobaan. Coba lagi nanti.',
        'for security purposes, you can only request this after': 'Terlalu sering mencoba. Tunggu beberapa saat.',
        'user not found': 'Akun tidak ditemukan. Silakan daftar terlebih dahulu.',
        'invalid email or password': 'Email atau password salah.',
    }

    for (const [key, val] of Object.entries(map)) {
        if (msg.includes(key)) return val
    }

    return message
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            setLoading(false)
        }).catch(() => {
            setLoading(false)
        })

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null)
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    const signUp = async (email, password, username) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { username }
                }
            })
            if (error) return { data: null, error: { message: translateAuthError(error.message) } }
            return { data, error: null }
        } catch (err) {
            return { data: null, error: { message: translateAuthError(err.message) } }
        }
    }

    const signIn = async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            })
            if (error) return { data: null, error: { message: translateAuthError(error.message) } }
            return { data, error: null }
        } catch (err) {
            return { data: null, error: { message: translateAuthError(err.message) } }
        }
    }

    const signOut = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) return { error: { message: translateAuthError(error.message) } }
        setUser(null)
        return { error: null }
    }

    const value = {
        user,
        loading,
        signUp,
        signIn,
        signOut,
        isAuthenticated: !!user
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
