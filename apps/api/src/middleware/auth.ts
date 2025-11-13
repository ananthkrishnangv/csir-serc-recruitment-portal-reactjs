
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
export interface AuthUser { id: string; role: string; email: string }
declare global { namespace Express { interface Request { user?: AuthUser } } }
export function requireAuth(roles?: string[]){ return (req:Request,res:Response,next:NextFunction)=>{ const header=req.headers.authorization||''; const token=header.replace('Bearer ',''); if(!token) return res.status(401).json({ error:'Unauthorized' }); try { const decoded=jwt.verify(token, process.env.JWT_SECRET||'devsecret') as AuthUser; if(roles && !roles.includes(decoded.role)) return res.status(403).json({ error:'Forbidden' }); req.user=decoded; next() } catch(e){ return res.status(401).json({ error:'Invalid token' }) } } }
