
'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useParams } from 'next/navigation'
interface Field { id:string; type:string; label:string; required?:boolean; placeholder?:string; options?:string[]; accept?:string; showWhen?:any[]; requireWhen?:any[] }
interface Step { key:string; title:string; fields: Field[] }
export default function FormBuilder(){
  const params = useParams(); const id = params?.id as string
  const [form,setForm] = useState<any>(null)
  const [steps,setSteps] = useState<Step[]>([])
  const [requiredDocs, setRequiredDocs] = useState<string[]>([])
  const [newDoc, setNewDoc] = useState('')
  const load = async()=>{ const f = await api(`/forms/${id}`); setForm(f); setSteps(f.steps?.steps||[]); setRequiredDocs(f.requiredDocs||[]) }
  useEffect(()=>{ load() },[id])
  const addStep = ()=> setSteps([...steps, { key: `s${Date.now()}`, title: 'New Step', fields: [] }])
  const addField = (sidx:number)=>{ const next = [...steps]; next[sidx].fields.push({ id:`f${Date.now()}`, type:'text', label:'New Field', required:false }); setSteps(next) }
  const save = async()=>{ await api(`/forms/${id}`,{ method:'PUT', body: JSON.stringify({ steps: { steps }, requiredDocs }) }); alert('Saved') }
  if (!form) return <main className="p-6">Loading...</main>
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Edit Form: {form.name}</h1>
      <button onClick={addStep} className="px-4 py-2 rounded bg-hh-primary text-black">Add Step</button>
      <div className="space-y-4">
        {steps.map((s, sidx)=> (
          <div key={s.key} className="p-4 rounded bg-hh-surface border border-white/10">
            <div className="grid md:grid-cols-2 gap-2 mb-2">
              <input className="p-2 rounded bg-black/20" value={s.title} onChange={e=>{ const n=[...steps]; n[sidx].title=e.target.value; setSteps(n) }} />
              <input className="p-2 rounded bg-black/20" value={s.key} onChange={e=>{ const n=[...steps]; n[sidx].key=e.target.value; setSteps(n) }} />
            </div>
            <button onClick={()=>addField(sidx)} className="px-3 py-1 rounded bg-hh-primary text-black">Add Field</button>
            <div className="grid md:grid-cols-2 gap-3 mt-3">
              {s.fields.map((f, fidx)=> (
                <div key={f.id} className="p-3 rounded bg-black/20 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input className="p-2 rounded bg-black/30" placeholder="Label" value={f.label} onChange={e=>{ const n=[...steps]; n[sidx].fields[fidx].label=e.target.value; setSteps(n) }} />
                    <select className="p-2 rounded bg-black/30" value={f.type} onChange={e=>{ const n=[...steps]; n[sidx].fields[fidx].type=e.target.value; setSteps(n) }}>
                      {['text','textarea','number','date','select','radio','checkbox','file'].map(t=> <option key={t}>{t}</option>)}
                    </select>
                    <input className="p-2 rounded bg-black/30" placeholder="Placeholder" value={f.placeholder||''} onChange={e=>{ const n=[...steps]; n[sidx].fields[fidx].placeholder=e.target.value; setSteps(n) }} />
                    <label className="flex items-center gap-2"><input type="checkbox" checked={!!f.required} onChange={e=>{ const n=[...steps]; n[sidx].fields[fidx].required=e.target.checked; setSteps(n) }} /> Required</label>
                    {['select','radio'].includes(f.type) && (
                      <input className="p-2 rounded bg-black/30 col-span-2" placeholder="Options comma separated" value={(f.options||[]).join(',')} onChange={e=>{ const n=[...steps]; n[sidx].fields[fidx].options=e.target.value.split(',').map(x=>x.trim()); setSteps(n) }} />
                    )}
                    {f.type==='file' && (
                      <input className="p-2 rounded bg-black/30 col-span-2" placeholder="Accept e.g. image/*,application/pdf" value={f.accept||''} onChange={e=>{ const n=[...steps]; n[sidx].fields[fidx].accept=e.target.value; setSteps(n) }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 p-4 rounded bg-hh-surface">
        <h2 className="font-semibold mb-2">Required Documents</h2>
        <div className="flex gap-2">
          <input className="p-2 rounded bg-black/20" placeholder="e.g., PHOTO, SIGNATURE, ID_PROOF" value={newDoc} onChange={e=>setNewDoc(e.target.value)} />
          <button className="px-3 py-1 rounded bg-hh-primary text-black" onClick={()=>{ if(newDoc){ setRequiredDocs([...requiredDocs, newDoc.toUpperCase()]); setNewDoc('') } }}>Add</button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {requiredDocs.map((d,i)=> (<span key={i} className="px-2 py-1 rounded bg-black/20">{d} <button className="ml-1 text-red-400" onClick={()=> setRequiredDocs(requiredDocs.filter((x,idx)=> idx!==i))}>×</button></span>))}
        </div>
      </div>
      <button onClick={save} className="px-6 py-2 rounded bg-green-600">Save Form</button>
    </main>
  )
}
