
export async function api(path: string, options: RequestInit = {}) {
  const base = process.env.NEXT_PUBLIC_API_BASE
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const headers = new Headers(options.headers)
  if (!(options.body instanceof FormData)) headers.set('Content-Type','application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(`${base}${path}`, { ...options, headers })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
