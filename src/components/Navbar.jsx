// src/components/Navbar.tsx
import React from 'react'
import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col p-4 space-y-2">
      <Link to="/dashboard" className="hover:bg-gray-700 rounded p-2">Compte</Link>
      <Link to="/" className="hover:bg-gray-700 rounded p-2">Planning</Link>
    </div>
  )
}

export default Navbar
