import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (isRegister) {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        })
        if (error) {
          // If the trigger failed to create the profile, try creating it manually
          if (error.message.includes('Database error') && signUpData?.user) {
            // Set the session so RLS auth.uid() works for the INSERT policy
            if (signUpData.session) {
              await supabase.auth.setSession(signUpData.session)
            }
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert({
                id: signUpData.user.id,
                email,
                full_name: fullName,
              }, { onConflict: 'id' })
            if (profileError) throw new Error('Error creando perfil. Verifica que el schema SQL se haya ejecutado en Supabase.')
          } else {
            throw error
          }
        }
        // Even if signup succeeded, ensure profile exists (trigger may have silently failed)
        if (signUpData?.user && !error) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', signUpData.user.id)
            .single()
          if (!profile && signUpData.session) {
            await supabase.from('profiles').upsert({
              id: signUpData.user.id,
              email,
              full_name: fullName,
            }, { onConflict: 'id' })
          }
        }
        setMessage('Cuenta creada. Revisa tu correo para confirmar o inicia sesión.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        navigate('/', { replace: true })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">&#9749;</div>
          <h1 className="text-3xl font-bold text-coffee">Kiko Coffee</h1>
          <p className="text-coffee-medium mt-1">Programa de Lealtad</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-coffee mb-4 text-center">
            {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-coffee-medium mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={isRegister}
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-dark bg-cream/50 text-coffee focus:outline-none focus:ring-2 focus:ring-caramel/50 focus:border-caramel transition-colors"
                  placeholder="Tu nombre"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-coffee-medium mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-cream-dark bg-cream/50 text-coffee focus:outline-none focus:ring-2 focus:ring-caramel/50 focus:border-caramel transition-colors"
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-coffee-medium mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 rounded-xl border border-cream-dark bg-cream/50 text-coffee focus:outline-none focus:ring-2 focus:ring-caramel/50 focus:border-caramel transition-colors"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {error && (
              <div className="bg-danger/10 text-danger text-sm rounded-lg p-3">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-success/10 text-success text-sm rounded-lg p-3">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-coffee text-cream rounded-xl font-semibold hover:bg-coffee-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="pulse-slow">&#9749;</span> Cargando...
                </span>
              ) : isRegister ? (
                'Crear Cuenta'
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister)
                setError('')
                setMessage('')
              }}
              className="text-sm text-caramel hover:text-coffee-light transition-colors bg-transparent border-none cursor-pointer"
            >
              {isRegister
                ? '¿Ya tienes cuenta? Inicia sesión'
                : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
