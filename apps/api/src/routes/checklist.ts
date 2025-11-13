
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
export const checklistRouter = Router()
checklistRouter.get('/:appId', requireAuth(['ADMIN','APPROVER','REVIEWER']), async (req,res)=>{ const app=await prisma.application.findUnique({ where: { id: req.params.appId }, include: { documents: true, job: true, user: true } }); if(!app) return res.status(404).json({ error:'Not found' }); const required = (await prisma.formDefinition.findUnique({ where: { id: app.job.formId||'' } }))?.requiredDocs as any || ['PHOTO','SIGNATURE','ID_PROOF']; const present=new Set(app.documents.map(d=>d.kind)); const missing = required.filter((r:string)=>!present.has(r)); res.json({ applicationNo: app.applicationNo, required, missing, present: Array.from(present) }) })
