import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Loader from './Loader'

function ProtectedRoute({ children }) {
    return children
}

export default ProtectedRoute
