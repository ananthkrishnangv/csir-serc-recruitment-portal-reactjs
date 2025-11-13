
'use client'
import useSWR from 'swr'
export default function AdminDashboard(){
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''
  const fetcher = (url:string)=> fetch(url,{ headers:{ Authorization: `Bearer ${token}` }}).then(r=>r.json())
  const { data } = useSWR(`${process.env.NEXT_PUBLIC_API_BASE}/admin/analytics/kpis`, fetcher)
  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-4 mt-4">
        <Card title="Users" value={data?.totalUsers||0} />
        <Card title="Applications" value={data?.totalApps||0} />
        <Card title="Submitted" value={data?.submitted||0} />
      </div>
    </main>
  )
}
function Card({ title, value }:{ title:string, value:number }){ return (<div className="p-4 rounded bg-hh-surface border border-white/10"><div className="text-sm opacity-70">{title}</div><div className="text-2xl font-bold">{value}</div></div>) }
