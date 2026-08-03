import { ref, computed } from 'vue'
import { setKBToken, clearKBToken, kbLogin, kbGetCurrentUser } from '@/lib/kb-api'

const TOKEN_KEY = 'access_token'
const USER_KEY = 'current_user'

interface User {
  id: number
  username: string
  email: string
  full_name?: string
  role: string
}

const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
const user = ref<User | null>(JSON.parse(localStorage.getItem(USER_KEY) || 'null'))
const loading = ref(false)

export function useAuth() {
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  async function login(username: string, password: string): Promise<boolean> {
    loading.value = true
    try {
      const res = await kbLogin(username, password)
      if (res.access_token) {
        const newToken = res.access_token
        localStorage.setItem(TOKEN_KEY, newToken)
        token.value = newToken
        setKBToken(newToken)
        await fetchCurrentUser()
        return true
      }
      return false
    } catch (err) {
      console.error('Login failed:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  async function fetchCurrentUser(): Promise<void> {
    try {
      const data = await kbGetCurrentUser()
      if (data) {
        user.value = data as User
        localStorage.setItem(USER_KEY, JSON.stringify(data))
      }
    } catch (err) {
      console.error('Failed to fetch current user:', err)
      logout()
    }
  }

  function logout(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    token.value = null
    user.value = null
    clearKBToken()
  }

  function getToken(): string | null {
    return token.value
  }

  function syncTokenFromURL(query: Record<string, any>): boolean {
    const urlToken = query?.token as string | undefined
    if (urlToken && urlToken !== token.value) {
      localStorage.setItem(TOKEN_KEY, urlToken)
      token.value = urlToken
      setKBToken(urlToken)
      return true
    }
    return false
  }

  return {
    token,
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    getToken,
    syncTokenFromURL,
    fetchCurrentUser
  }
}
