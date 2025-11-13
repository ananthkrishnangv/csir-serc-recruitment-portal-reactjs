
'use client'
import { useEffect, useState } from 'react'
export default function AdminJobs(){
  const [title,setTitle] = useState('')
  const [category,setCategory] = useState('TECHNICIAN')
  const [openDate,setOpen] = useState('')
  const [closeDate,setClose] = useState('')
  const [crucialDate,setCrucial] = useState('')
  const [labId,setLabId] = useState('')
  const [departmentId,setDepartmentId] = useState('')
  const [formId,setFormId] = useState('')
  const [labs,setLabs] = useState<any[]>([])
  const [depts,setDepts] = useState<any[]>([])
  const [forms,setForms] = useState<any[]>([])
  useEffect(()=>{ (async()=>{
    const token = localStorage.getItem('token')||''
    const h:any = { Authorization: `Bearer ${token}` }
    setLabs(await (await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/labs`,{ headers: h })).json())
    setDepts(await (await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/departments`,{ headers: h })).json())
    setForms(await (await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/forms`,{ headers: h })).json())
  })() },[])
  const save = async()=>{
    const token = localStorage.getItem('token')||''
    const data = { title, category, labId, departmentId: departmentId||null, formId: formId||null, openDate, closeDate, crucialDate, code: `SERC/${category}/${new Date().toISOString().split('T')[0]}-${Math.random().toString().slice(2,6)}` }
    const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/admin/jobs`,{ method:'POST', headers:{ 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(data) })
    alert('Saved: '+(await r.text()))
  }
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-3">
      <h1 className="text-2xl font-bold">Create Job</h1>
      <input className="w-full p-2 rounded bg-hh-surface" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
      <select className="w-full p-2 rounded bg-hh-surface" value={category} onChange={e=>setCategory(e.target.value)}>
        {['TECHNICIAN','TECHNICAL_ASSISTANT','TECHNICAL_OFFICER','SCIENTIST'].map(x=> <option key={x}>{x}</option>)}
      </select>
      <label>Lab</label>
      <select className="w-full p-2 rounded bg-hh-surface" value={labId} onChange={e=>setLabId(e.target.value)}>
        {labs.map((l:any)=> <option key={l.id} value={l.id}>{l.name}</option>)}
      </select>
      <label>Department</label>
      <select className="w-full p-2 rounded bg-hh-surface" value={departmentId} onChange={e=>setDepartmentId(e.target.value)}>
        <option value="">(none)</option>
        {depts.map((d:any)=> <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
      <label>Form</label>
      <select className="w-full p-2 rounded bg-hh-surface" value={formId} onChange={e=>setFormId(e.target.value)}>
        <option value="">(default by category)</option>
        {forms.map((f:any)=> <option key={f.id} value={f.id}>{f.name}</option>)}
      </select>
      <label>Open Date</label>
      <input type="date" className="w-full p-2 rounded bg-hh-surface" value={openDate} onChange={e=>setOpen(e.target.value)} />
      <label>Close Date</label>
      <input type="date" className="w-full p-2 rounded bg-hh-surface" value={closeDate} onChange={e=>setClose(e.target.value)} />
      <label>Crucial Date</label>
      <input type="date" className="w-full p-2 rounded bg-hh-surface" value={crucialDate} onChange={e=>setCrucial(e.target.value)} />
      <button onClick={save} className="px-4 py-2 rounded bg-hh-primary text-black">Save</button>
    </main>
  )
}
