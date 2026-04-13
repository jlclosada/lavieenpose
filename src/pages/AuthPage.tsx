import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/rawgApi'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'register') {
        await api.signUp(email, password, fullName)
        setError('Revisa tu email para confirmar la cuenta.')
      } else {
        await api.signIn(email, password)
        navigate('/')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ha ocurrido un error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="page-section auth-section">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>{mode === 'login' ? 'Iniciar sesion' : 'Crear cuenta'}</h1>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label>
              <span>Nombre completo</span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </label>
          )}
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            <span>Contrasena</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Registrarse'}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'login' ? (
            <>No tienes cuenta? <button onClick={() => setMode('register')}>Crear cuenta</button></>
          ) : (
            <>Ya tienes cuenta? <button onClick={() => setMode('login')}>Iniciar sesion</button></>
          )}
        </p>
      </motion.div>
    </section>
  )
}
