
'use client'
import { Stepper, Step, StepLabel, Button, TextField, MenuItem, Checkbox, FormControlLabel } from '@mui/material'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'

function evalConds(conds: any[]|undefined, values: any) {
  if (!conds || !conds.length) return true
  return conds.every(c=>{
    const v = values[c.field]
    switch (c.op) {
      case 'eq': return v === c.value
      case 'ne': return v !== c.value
      case 'gt': return Number(v) > Number(c.value)
      case 'lt': return Number(v) < Number(c.value)
      case 'in': return Array.isArray(c.value) && c.value.includes(v)
      default: return true
    }
  })
}

export default function ApplyWizard(){
  const sp = useSearchParams()
  const jobId = sp.get('jobId')
  const [job,setJob] = useState<any>(null)
  const [formDef,setFormDef] = useState<any>(null)
  const [active,setActive] = useState(0)
  const [app,setApp] = useState<any>(null)
  const [values,setValues] = useState<any>({})
  const steps = formDef?.steps?.steps || []
  const requiredDocs: string[] = (formDef?.requiredDocs || [])

  useEffect(()=>{ (async()=>{
    if (!jobId) return
    const j = await (await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/jobs/${jobId}`)).json()
    setJob(j)
    let formId = j.formId
    if (!formId) {
      const all = await api('/forms')
      const fallback = (all||[]).find((f:any)=> f.type===j.category)
      formId = fallback?.id
    }
    if (formId) setFormDef(await api(`/forms/${formId}`))
    const draft = await api('/applications',{ method:'POST', body: JSON.stringify({ jobId }) })
    setApp(draft)
  })() },[jobId])

  const next   = async()=>{ await api(`/applications/${app.id}`,{ method:'PUT', body: JSON.stringify({ data: values }) }); setActive(x=>Math.min(x+1, steps.length)) }
  const back   = ()=> setActive(x=>Math.max(x-1,0))

  const submit = async()=>{
    // Required docs presence check
    if (requiredDocs.length) {
      const present = Object.keys(values).filter(k=> typeof values[k]==='string' && values[k].startsWith('http'))
      const missing = requiredDocs.filter(rd=> !present.some(p=> p.toUpperCase()===rd))
      if (missing.length) { alert('Missing documents: '+missing.join(', ')); return }
    }
    await api(`/applications/${app.id}/submit`,{ method:'POST' })
    alert('Application submitted. Download receipt from dashboard.')
  }

  const [elig,setElig] = useState<any>(null)
  const checkElig = async()=>{
    const dob = values['dob'] || values['dateOfBirth']
    const category = values['category'] || 'UR'
    const r = await api(`/applications/${app?.id}/eligibility`,{ method:'POST', body: JSON.stringify({ dob, category }) })
    setElig(r)
  }

  const handleFile = async (f: File, fieldId: string)=>{
    const fd = new FormData()
    fd.append('file', f)
    fd.append('kind', fieldId.toUpperCase())
    fd.append('ocr', 'true')
    const res = await api(`/applications/${app.id}/upload`,{ method:'POST', body: fd })
    setValues((v:any)=> ({ ...v, [fieldId]: res.url }))
  }

  const renderField = (f:any)=>{
    const visible  = evalConds(f.showWhen, values); if (!visible) return null
    const required = f.required || evalConds(f.requireWhen, values)
    const common   = { fullWidth:true, label:f.label, required }
    switch(f.type){
      case 'text':     return <TextField {...common} value={values[f.id]||''} onChange={e=>setValues({ ...values, [f.id]: e.target.value })} />
      case 'textarea': return <TextField {...common} multiline rows={4} value={values[f.id]||''} onChange={e=>setValues({ ...values, [f.id]: e.target.value })} />
      case 'number':   return <TextField type='number' {...common} value={values[f.id]||''} onChange={e=>setValues({ ...values, [f.id]: e.target.value })} />
      case 'date':     return <TextField type='date' {...common} InputLabelProps={{ shrink:true }} value={values[f.id]||''} onChange={e=>setValues({ ...values, [f.id]: e.target.value })} />
      case 'select':   return (
        <TextField select {...common} value={values[f.id]||''} onChange={e=>setValues({ ...values, [f.id]: e.target.value })}>
          {(f.options||[]).map((o:string)=> <MenuItem key={o} value={o}>{o}</MenuItem>)}
        </TextField>
      )
      case 'radio':    return (
        <div className='flex gap-4'>
          {(f.options||[]).map((o:string)=> (
            <FormControlLabel key={o} label={o} control={<Checkbox checked={values[f.id]===o} onChange={()=> setValues({ ...values, [f.id]: o })} />} />
          ))}
        </div>
      )
      case 'checkbox': return <FormControlLabel label={f.label} control={<Checkbox checked={!!values[f.id]} onChange={e=> setValues({ ...values, [f.id]: e.target.checked })} />} />
      case 'file':     return <input type='file' accept={f.accept||'*/*'} onChange={e=>{ const file = e.target.files?.[0]; if (file) handleFile(file, f.id) }} />
      default:         return null
    }
  }

  if (!job || !formDef) return <main className='p-6'>Loading...</main>

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Apply: {job.title}</h1>
      <Stepper activeStep={active} alternativeLabel>
        {steps.map((s:any)=> <Step key={s.key}><StepLabel>{s.title}</StepLabel></Step>)}
        <Step><StepLabel>Review</StepLabel></Step>
      </Stepper>

      {active < steps.length ? (
        <div className="mt-6 p-4 rounded bg-hh-surface space-y-3">
          {(steps[active].fields||[]).map((f:any)=> (<div key={f.id}>{renderField(f)}</div>))}
          <div className="flex justify-between mt-4">
            <Button onClick={back} disabled={active===0}>Back</Button>
            <Button onClick={next}>Save & Next</Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 p-4 rounded bg-hh-surface space-y-2">
          <pre className="bg-black/20 p-3 rounded overflow-auto text-xs">{JSON.stringify(values,null,2)}</pre>
          <div className="mt-3 p-3 rounded bg-black/20">
            <div className="flex items-center justify-between">
              <div>Eligibility (DoPT age on crucial date)</div>
              <Button onClick={checkElig}>Run Check</Button>
            </div>
            {elig && (
              <div className="mt-2 text-sm">Age: {elig.age} — {elig.ageOk ? 'Eligible' : 'Not eligible'}
                {elig.notes?.length ? (<ul className="list-disc ml-6">{elig.notes.map((n:any,i:number)=> <li key={i}>{n}</li>)}</ul>) : null}
              </div>
            )}
          </div>
          <div className="flex justify-between mt-4">
            <Button onClick={()=>setActive(steps.length-1)}>Back</Button>
            <Button onClick={submit} color='success' variant='contained'>Submit Application</Button>
          </div>
        </div>
      )}
    </main>
  )
}
