// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react'
import supabase from '../helper/supabaseClient'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState("")
  const navigate = useNavigate()

  const checkUser = async () => {

    const { data: { session } } = await supabase.auth.getSession()
    if (!session || !session.user) {
      navigate('/login')
    } else {
      setUser(session.user)

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()


      if (error) {
        console.error("Erreur récupération role :", error)
      } else {
        setRole(data.role)
      }
    }
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
    setUser(null)
    navigate('/login') 
  }

  if (!user) return null 

  return (
    <div className="p-6 m-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Mon Compte</h1>
      <div className=" text-gray-800">
        <p className="mb-2"><strong>Email :</strong> {user.email}</p>
        <p className="mb-2"><strong>ID :</strong> {user.id}</p>
        <p className="mb-4"><strong>Rôle :</strong> {role}</p>

        <button
          onClick={handleSignOut}
          className="mt-4 bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          Déconnexion
        </button>
      </div>
    </div>
  )
}

export default Dashboard
