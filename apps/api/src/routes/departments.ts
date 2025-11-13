
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
const DeptSchema = z.object({ code: z.string().min(2), name: z.string().min(2) })
export const departmentsRouter = Router()
departmentsRouter.get('/', requireAuth(['ADMIN','APPROVER','REVIEWER']), async (_req,res)=>{ const depts=await prisma.department.findMany({ orderBy: { name:'asc' } }); res.json(depts) })
departmentsRouter.post('/', requireAuth(['ADMIN']), async (req,res)=>{ const data = DeptSchema.parse(req.body); const d=await prisma.department.upsert({ where:{ code:data.code }, update:data, create:data }); res.json(d) })
departmentsRouter.delete('/:code', requireAuth(['ADMIN']), async (req,res)=>{ await prisma.department.delete({ where: { code: req.params.code } }); res.json({ ok:true }) })
