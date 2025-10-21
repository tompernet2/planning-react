// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react'
import supabase from '../helper/supabaseClient'
import { Link } from 'react-router-dom'

function Dashboard() {
  const [user, setUser] = useState(null)

  // ✅ Déclare la fonction AVANT le useEffect
  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user || null)
  }

  useEffect(() => {
    checkUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUser()
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null) // ✅ Vide localement après déconnexion
  }

  // ✅ Si l'utilisateur n'est pas connecté
  if (!user) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Mon Compte</h1>
        <p className="mb-4">Vous n'êtes pas connecté.</p>
        <div className="flex justify-center gap-4">
          <Link to="/login" className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700">Se connecter</Link>
          <Link to="/register" className="bg-green-600 px-4 py-2 rounded hover:bg-green-700">S'inscrire</Link>
        </div>
      </div>
    )
  }

  // ✅ Si l'utilisateur est connecté
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Mon Compte</h1>
      <div className="bg-white p-6 rounded shadow text-gray-800">
        <p className="mb-2"><strong>Email :</strong> {user.email}</p>
        <p className="text-sm text-gray-500">ID : {user.id}</p>

        <button 
          onClick={handleSignOut} 
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Déconnexion
        </button>
      </div>
    </div>
  )
}

export default Dashboard
