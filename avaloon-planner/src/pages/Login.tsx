import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function Login() {
  const { session, carregando } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (!carregando && session) return <Navigate to="/" replace />

  const entrar = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })
    if (error) {
      setErro(
        error.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos.'
          : error.message,
      )
    }
    setEnviando(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-carvao p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="font-display text-3xl font-extrabold tracking-widest text-white">
            AVALOON
          </div>
          <div className="mt-1 text-sm font-semibold text-laranja">
            Planner · Planejamento de Campanhas
          </div>
        </div>
        <form onSubmit={entrar} className="card space-y-4 p-6">
          <div>
            <label className="label" htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label" htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              required
              className="input"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {erro && <p className="text-sm font-medium text-red-600">{erro}</p>}
          <button type="submit" disabled={enviando} className="btn-primary w-full">
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-neutral-500">
          Uso interno Avaloon Marketing. Acesso criado pelo administrador.
        </p>
      </div>
    </div>
  )
}
