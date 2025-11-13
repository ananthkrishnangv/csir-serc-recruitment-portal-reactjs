
'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'
export default function FormsPage(){
  const [items,setItems] = useState<any[]>([])
  const [name,setName] = useState('')
  const [type,setType] = useState('TECHNICIAN')
  const load = ()=> api('/forms').then(setItems)
  useEffect(()=>{ load() },[])
  const create = async()=>{ await api('/forms',{ method:'POST', body: JSON.stringify({ name, type, version: 1, steps: { steps: [] }, requiredDocs: [] }) }); setName(''); setType('TECHNICIAN'); load() }
  const del = async(id:string)=>{ if(confirm('Delete form?')) { await api(`/forms/${id}`,{ method:'DELETE' }); load() } }
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Forms</h1>
      <div className="grid md:grid-cols-3 gap-2">
        <input className="p-2 rounded bg-hh-surface" placeholder="Form Name" value={name} onChange={e=>setName(e.target.value)} />
        <select className="p-2 rounded bg-hh-surface" value={type} onChange={e=>setType(e.target.value)}>{['TECHNICIAN','TECHNICAL_ASSISTANT','TECHNICAL_OFFICER','SCIENTIST'].map(x=> <option key={x}>{x}</option>)}</select>
        <button onClick={create} className="px-4 py-2 rounded bg-hh-primary text-black">Create</button>
      </div>
      <table className="w-full text-sm">
        <thead className="opacity-70"><tr><th className="text-left">Form</th><th>Type</th><th>Version</th><th></th></tr></thead>
        <tbody>
          {items.map(x=> (
            <tr key={x.id} className="border-t border-white/10">
              <td>{x.name}</td><td className="text-center">{x.type}</td><td className="text-center">{x.version}</td>
              <td className="text-right space-x-2">
                <Link href={`/admin/forms/${x.id}`} className="px-3 py-1 rounded bg-hh-primary text-black">Edit</Link>
                <button onClick={()=>del(x.id)} className="px-3 py-1 rounded bg-red-600">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
