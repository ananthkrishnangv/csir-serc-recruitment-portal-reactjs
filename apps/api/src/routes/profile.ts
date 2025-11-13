
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
export const profileRouter = Router()
profileRouter.get('/', requireAuth(['APPLICANT','ADMIN','APPROVER','REVIEWER']), async (req,res)=>{ const user=await prisma.user.findUnique({ where: { id: req.user!.id } }); res.json(user) })
profileRouter.put('/', requireAuth(['APPLICANT','ADMIN','APPROVER','REVIEWER']), async (req,res)=>{ const { name, mobile } = req.body; const user=await prisma.user.update({ where: { id: req.user!.id }, data: { name, mobile } }); res.json(user) })
