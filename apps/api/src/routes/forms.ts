
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
const FieldSchema = z.object({ id: z.string(), type: z.string(), label: z.string(), required: z.boolean().optional(), placeholder: z.string().optional(), options: z.array(z.string()).optional(), accept: z.string().optional(), showWhen: z.array(z.object({ field: z.string(), op: z.string(), value: z.any() })).optional(), requireWhen: z.array(z.object({ field: z.string(), op: z.string(), value: z.any() })).optional() })
const StepSchema = z.object({ key: z.string(), title: z.string(), fields: z.array(FieldSchema) })
const FormSchema = z.object({ name: z.string(), type: z.string(), version: z.number().default(1), steps: z.object({ steps: z.array(StepSchema) }), requiredDocs: z.array(z.string()).default([]) })
export const formsRouter = Router()
formsRouter.get('/', requireAuth(['ADMIN','APPROVER','REVIEWER']), async (_req,res)=>{ const forms=await prisma.formDefinition.findMany({ orderBy: [{ type:'asc' }, { version:'desc' }] }); res.json(forms) })
formsRouter.get('/:id', requireAuth(['ADMIN','APPROVER','REVIEWER','APPLICANT']), async (req,res)=>{ const form=await prisma.formDefinition.findUnique({ where: { id: req.params.id } }); if(!form) return res.status(404).json({ error:'Not found' }); res.json(form) })
formsRouter.post('/', requireAuth(['ADMIN']), async (req,res)=>{ const data = FormSchema.parse(req.body); const form=await prisma.formDefinition.create({ data }); res.json(form) })
formsRouter.put('/:id', requireAuth(['ADMIN']), async (req,res)=>{ const data = FormSchema.partial().parse(req.body); const form=await prisma.formDefinition.update({ where: { id: req.params.id }, data }); res.json(form) })
formsRouter.delete('/:id', requireAuth(['ADMIN']), async (req,res)=>{ await prisma.formDefinition.delete({ where: { id: req.params.id } }); res.json({ ok:true }) })
