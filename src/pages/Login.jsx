import React, { useState } from 'react'
import supabase from '../helper/supabaseClient'
import { Link, useNavigate } from 'react-router-dom'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage("")

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) {
      setMessage(error.message)
      setEmail("")
      setPassword("")
      return
    }

    if (data) {
      navigate("/dashboard")
      return null
    }
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Connexion</h2>

        {message && (
          <div className="mb-4 text-red-600 text-center text-sm bg-red-50 p-2 rounded">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            type="email"
            placeholder="Adresse email"
            required
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-700"
          />

          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            type="password"
            placeholder="Mot de passe"
            required
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-700"
          />

          <button
            type="submit"
            className="bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Se connecter
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <span>Pas encore de compte ? </span>
          <Link
            to="/register"
            className="text-gray-800 font-semibold hover:underline"
          >
            S’inscrire
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login
