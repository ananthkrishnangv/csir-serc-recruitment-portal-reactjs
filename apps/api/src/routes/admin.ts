
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { stringify } from 'csv-stringify'
export const adminRouter = Router()
adminRouter.post('/jobs', requireAuth(['ADMIN']), async (req,res)=>{ const { id, ...data }=req.body; let job; if(id) job=await prisma.jobPost.update({ where:{ id }, data }); else job=await prisma.jobPost.create({ data }); res.json(job) })
adminRouter.get('/jobs/:id/export.csv', requireAuth(['ADMIN','APPROVER','REVIEWER']), async (req,res)=>{ const apps=await prisma.application.findMany({ where:{ jobId:req.params.id }, include:{ user:true } }); res.setHeader('Content-Type','text/csv'); res.setHeader('Content-Disposition','attachment; filename="applications.csv"'); const s=stringify({ header:true, columns:['applicationNo','name','email','status','submittedAt'] }); s.pipe(res); for(const a of apps) s.write({ applicationNo:a.applicationNo, name:a.user.name, email:a.user.email, status:a.status, submittedAt:a.submittedAt }); s.end() })
adminRouter.get('/analytics/kpis', requireAuth(['ADMIN']), async (_req,res)=>{ const totalUsers=await prisma.user.count(); const totalApps=await prisma.application.count(); const submitted=await prisma.application.count({ where:{ status:'SUBMITTED' } }); res.json({ totalUsers,totalApps,submitted }) })
