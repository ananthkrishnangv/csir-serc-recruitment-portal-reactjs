
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
const LabSchema = z.object({ code: z.string().min(2), name: z.string().min(2), address: z.string().optional() })
export const labsRouter = Router()
labsRouter.get('/', requireAuth(['ADMIN','APPROVER','REVIEWER']), async (_req,res)=>{ const labs=await prisma.lab.findMany({ orderBy: { name:'asc' } }); res.json(labs) })
labsRouter.post('/', requireAuth(['ADMIN']), async (req,res)=>{ const data = LabSchema.parse(req.body); const lab=await prisma.lab.upsert({ where:{ code:data.code }, update:data, create:data }); res.json(lab) })
labsRouter.delete('/:code', requireAuth(['ADMIN']), async (req,res)=>{ await prisma.lab.delete({ where: { code: req.params.code } }); res.json({ ok:true }) })
