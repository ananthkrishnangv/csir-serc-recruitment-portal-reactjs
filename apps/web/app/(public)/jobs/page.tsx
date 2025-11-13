
'use client'
import useSWR from 'swr'
export default function JobsPage(){
  const { data } = useSWR(`${process.env.NEXT_PUBLIC_API_BASE}/jobs`, (u)=>fetch(u).then(r=>r.json()))
  const items = data?.items || []
  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Open Positions</h1>
      <ul className="space-y-3">
        {items.map((j:any)=> (
          <li key={j.id} className="p-4 rounded bg-hh-surface border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{j.title}</div>
                <div className="text-sm opacity-70">{j.code} · {j.category}</div>
              </div>
              <a href={`/apply?jobId=${j.id}`} className="px-4 py-2 rounded bg-hh-primary text-black">Apply</a>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
