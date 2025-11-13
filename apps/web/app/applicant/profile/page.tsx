
'use client'
import { useEffect, useState } from 'react'
export default function Profile(){
  const [name,setName] = useState('')
  const [mobile,setMobile] = useState('')
  const save = async()=>{
    const token = localStorage.getItem('token')||''
    await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/me`,{ method:'PUT', headers:{ 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name, mobile }) })
    alert('Saved')
  }
  return (
    <main className="max-w-md mx-auto p-6 space-y-3">
      <h1 className="text-2xl font-bold">My Profile</h1>
      <input className="w-full p-2 rounded bg-hh-surface" placeholder="Full Name" value={name} onChange={e=>setName(e.target.value)} />
      <input className="w-full p-2 rounded bg-hh-surface" placeholder="Mobile" value={mobile} onChange={e=>setMobile(e.target.value)} />
      <button onClick={save} className="px-4 py-2 rounded bg-hh-primary text-black">Save</button>
    </main>
  )
}
