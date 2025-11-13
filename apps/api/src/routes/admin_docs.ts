
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import ExcelJS from 'exceljs'
export const adminDocsRouter = Router()
adminDocsRouter.get('/search', requireAuth(['ADMIN','APPROVER','REVIEWER']), async (req,res)=>{ const q=(req.query.q as string)||''; const docs=await prisma.document.findMany({ where:{ ocrText:{ contains:q } }, take:200, include:{ application:{ include:{ user:true, job:true } } } }); res.json(docs) })
adminDocsRouter.get('/export.xlsx', requireAuth(['ADMIN']), async (_req,res)=>{ const docs=await prisma.document.findMany({ include:{ application:{ include:{ user:true, job:true } } } }); const wb=new ExcelJS.Workbook(); const ws=wb.addWorksheet('Documents'); ws.columns=[ {header:'Doc ID',key:'id',width:20}, {header:'Kind',key:'kind',width:20}, {header:'App No',key:'appno',width:15}, {header:'Applicant',key:'name',width:25}, {header:'Post',key:'post',width:30}, {header:'Verified',key:'verified',width:10} ]; for (const d of docs) ws.addRow({ id:d.id, kind:d.kind, appno:d.application.applicationNo, name:d.application.user.name, post:d.application.job.title, verified:d.verified })
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition','attachment; filename="documents.xlsx")
  await wb.xlsx.write(res); res.end() })
