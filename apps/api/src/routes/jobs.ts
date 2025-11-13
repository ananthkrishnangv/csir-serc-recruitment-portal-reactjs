
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
export const jobsRouter = Router()
jobsRouter.get('/', async (req,res)=>{ const { page='1', pageSize='10', q='', lab='', category='' } = req.query as any; const where:any={ status:'OPEN' }; if(q) where.OR=[{ title:{ contains:q } },{ description:{ contains:q } }]; if(lab) where.labId=lab; if(category) where.category=category; const take=parseInt(pageSize); const skip=(parseInt(page)-1)*take; const [items,total]=await Promise.all([ prisma.jobPost.findMany({ where, skip, take, orderBy:{ openDate:'desc' }, include:{ lab:true, department:true } }), prisma.jobPost.count({ where }) ]); res.json({ items,total }) })
jobsRouter.get('/:id', async (req,res)=>{ const job=await prisma.jobPost.findUnique({ where:{ id:req.params.id } }); if(!job) return res.status(404).json({ error:'Not found' }); res.json(job) })
