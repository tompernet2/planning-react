import React from 'react'
import Calendar from '../components/Calendar'

function Home() {
  return (
    <div className='p-6 m-6 bg-white rounded shadow'>
      <h1 className="text-2xl font-bold mb-4">Planning</h1>
      <Calendar></Calendar>
    </div>
  )
}

export default Home