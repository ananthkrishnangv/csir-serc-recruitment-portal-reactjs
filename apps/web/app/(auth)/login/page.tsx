
'use client'
import { useState } from 'react'
export default function Login(){
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const submit = async (e:any)=>{
    e.preventDefault()
    const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/auth/login`,{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) })
    const data = await r.json()
    if (data.token) { localStorage.setItem('token', data.token); location.href = '/applicant' }
  }
  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full p-2 rounded bg-hh-surface" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" className="w-full p-2 rounded bg-hh-surface" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="px-4 py-2 rounded bg-hh-primary text-black">Login</button>
      </form>
    </main>
  )
}
