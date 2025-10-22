import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'


import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <Navbar />
        <main className="flex-1 bg-gray-50">
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/register' element={<Register />} />
            <Route path='/login' element={<Login />} />
            <Route path='/dashboard' element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App