import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Role } from '../types'

export interface CurrentUser {
  name: string
  role: Role
  email: string
}

interface AuthContextValue {
  currentUser: CurrentUser | null
  login: (user: CurrentUser) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  login: () => {},
  logout: () => {},
})

const STORAGE_KEY = 'ahms_current_user'

/**
 * Menyimpan sesi login ke localStorage supaya PM/Reviewer tidak perlu
 * login ulang setiap kali halaman di-refresh — sebelumnya currentUser
 * hanya hidup di state App.tsx dan hilang saat reload.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    try {
      if (currentUser) localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser))
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      // localStorage tidak tersedia (mis. private browsing) — sesi cukup bertahan di memori
    }
  }, [currentUser])

  const login = (user: CurrentUser) => setCurrentUser(user)
  const logout = () => setCurrentUser(null)

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}