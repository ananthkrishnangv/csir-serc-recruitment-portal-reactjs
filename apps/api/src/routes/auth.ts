
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
export const authRouter = Router()
authRouter.post('/register', async (req,res)=>{ const { email,password,name }=req.body; const hash=await bcrypt.hash(password,10); const user=await prisma.user.create({ data:{ email,password:hash,name } }); res.json({ id:user.id }) })
authRouter.post('/login', async (req,res)=>{ const { email,password }=req.body; const user=await prisma.user.findUnique({ where:{ email } }); if(!user) return res.status(401).json({ error:'Invalid credentials' }); const ok=await bcrypt.compare(password,user.password); if(!ok) return res.status(401).json({ error:'Invalid credentials' }); const token=jwt.sign({ id:user.id, role:user.role, email:user.email }, process.env.JWT_SECRET||'devsecret', { expiresIn:'8h' }); res.json({ token, role:user.role, name:user.name }) })
