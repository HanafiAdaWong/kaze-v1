import { useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Camera, User, Mail, Save, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

function Profile() {
    const { user, updateProfile } = useAuth()
    const [username, setUsername] = useState(user?.user_metadata?.username || '')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '')
    const fileInputRef = useRef(null)

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            setError('Ukuran file maksimal 2MB')
            return
        }

        setLoading(true)
        setError('')
        setSuccess('')

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}-${Math.random()}.${fileExt}`
            const filePath = `avatars/${fileName}`

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            // Update user metadata
            const { error: updateError } = await updateProfile({
                avatar_url: publicUrl
            })

            if (updateError) throw updateError

            setAvatarUrl(publicUrl)
            setSuccess('Foto profil berhasil diperbarui!')
        } catch (err) {
            setError('Gagal mengunggah foto: ' + (err.message || 'Terjadi kesalahan'))
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        try {
            const { error: updateError } = await updateProfile({
                username
            })

            if (updateError) throw updateError
            setSuccess('Profil berhasil diperbarui!')
        } catch (err) {
            setError(err.message || 'Gagal memperbarui profil')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="profile-page">
            <div className="profile-container">
                <div className="profile-card">
                    <h1 className="profile-title">Pengaturan Profil</h1>
                    <p className="profile-subtitle">Kelola informasi akun dan foto profil kamu</p>

                    {error && (
                        <div className="profile-alert profile-alert--error">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="profile-alert profile-alert--success">
                            <CheckCircle2 size={18} />
                            <span>{success}</span>
                        </div>
                    )}

                    <div className="profile-avatar-section">
                        <div className="profile-avatar-wrap" onClick={handleAvatarClick}>
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="profile-avatar-img" />
                            ) : (
                                <div className="profile-avatar-placeholder">
                                    <User size={48} />
                                </div>
                            )}
                            <div className="profile-avatar-overlay">
                                <Camera size={24} />
                            </div>
                            {loading && (
                                <div className="profile-avatar-loader">
                                    <Loader2 className="animate-spin" />
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            hidden
                        />
                        <p className="profile-avatar-hint">Klik untuk mengganti foto profil (Maks. 2MB)</p>
                    </div>

                    <form className="profile-form" onSubmit={handleSubmit}>
                        <div className="profile-field">
                            <label className="profile-label">Email</label>
                            <div className="profile-input-wrap profile-input-wrap--disabled">
                                <Mail size={18} className="profile-input-icon" />
                                <input
                                    type="email"
                                    className="profile-input"
                                    value={user?.email || ''}
                                    disabled
                                />
                            </div>
                            <p className="profile-field-hint">Email tidak dapat diubah</p>
                        </div>

                        <div className="profile-field">
                            <label className="profile-label" htmlFor="username">Username</label>
                            <div className="profile-input-wrap">
                                <User size={18} className="profile-input-icon" />
                                <input
                                    id="username"
                                    type="text"
                                    className="profile-input"
                                    placeholder="Masukkan username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="profile-submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>
                                    <Save size={18} /> Simpan Perubahan
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Profile
