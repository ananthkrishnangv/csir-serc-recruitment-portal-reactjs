
import Link from 'next/link'
export default function Home(){
  return (
    <main className="max-w-6xl mx-auto p-6">
      <section className="py-10 text-center">
        <h1 className="text-4xl font-bold">CSIR–SERC Recruitment Portal</h1>
        <p className="mt-3 opacity-80">Apply online for Scientist, Technical Officer, Technical Assistant, Technician.</p>
        <div className="mt-6 flex justify-center gap-4">
          <Link href="/jobs" className="px-6 py-3 rounded bg-hh-primary text-black">Browse Jobs</Link>
          <Link href="/(auth)/login" className="px-6 py-3 rounded border border-hh-text">Login</Link>
        </div>
      </section>
    </main>
  )
}
