
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import multer from 'multer'
import crypto from 'crypto'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import Tesseract from 'tesseract.js'
import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'
import sharp from 'sharp'
import { checkEligibility } from '../lib/eligibility.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10*1024*1024 } })
const s3 = new S3Client({ region: process.env.S3_REGION, endpoint: process.env.S3_ENDPOINT, forcePathStyle: true, credentials: { accessKeyId: process.env.S3_KEY || 'minioadmin', secretAccessKey: process.env.S3_SECRET || 'minioadmin' } })
export const applicationsRouter = Router()

applicationsRouter.post('/', requireAuth(['APPLICANT','ADMIN']), async (req, res) => {
  const { jobId } = req.body
  const userId = req.user!.id
  const existing = await prisma.application.findFirst({ where: { userId, jobId } })
  if (existing) return res.json(existing)
  const count = await prisma.application.count({ where: { userId } })
  const applicationNo = `${new Date().getFullYear()}-${(count+1).toString().padStart(5,'0')}`
  const app = await prisma.application.create({ data: { userId, jobId, applicationNo } })
  res.json(app)
})

applicationsRouter.put('/:id', requireAuth(['APPLICANT','ADMIN']), async (req, res) => {
  const { data } = req.body
  const app = await prisma.application.update({ where: { id: req.params.id }, data: { data } })
  res.json(app)
})

applicationsRouter.post('/:id/upload', requireAuth(['APPLICANT','ADMIN']), upload.single('file'), async (req, res) => {
  const kind = req.body.kind
  const file = req.file!
  const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex')
  let body = file.buffer
  if (file.mimetype.startsWith('image/')) { body = await sharp(file.buffer).resize({ width: 1024, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer() }
  const Key = `applications/${req.params.id}/${Date.now()}-${file.originalname}`
  await s3.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET || 'uploads', Key, Body: body, ContentType: file.mimetype }))
  let ocrText: string|undefined = undefined
  if (req.body.ocr === 'true') { try { const r = await Tesseract.recognize(file.buffer, req.body.lang || 'eng'); ocrText = r.data.text } catch (e) { ocrText = undefined } }
  const doc = await prisma.document.create({ data: { applicationId: req.params.id, kind, filename: file.originalname, url: `${process.env.S3_PUBLIC_URL}/${Key}`, checksum, ocrText } })
  res.json(doc)
})

applicationsRouter.post('/:id/submit', requireAuth(['APPLICANT','ADMIN']), async (req, res) => {
  const app = await prisma.application.findUnique({ where: { id: req.params.id }, include: { job: true, user: true } })
  if (!app) return res.status(404).json({ error: 'Not found' })
  const receiptKey = `receipts/${app.id}.pdf`
  const doc = new PDFDocument({ size: 'A4' })
  const chunks: Buffer[] = []
  doc.fontSize(18).text('CSIR-SERC Recruitment - Application Receipt', { align: 'center' })
  doc.moveDown().fontSize(12).text(`Application No: ${app.applicationNo}`)
  doc.text(`Applicant: ${app.user.name} (${app.user.email})`)
  doc.text(`Post: ${app.job.title} [${app.job.code}]`)
  doc.text(`Submitted: ${new Date().toISOString()}`)
  const qrData = `serc-app:${app.applicationNo}`
  const qr = await QRCode.toDataURL(qrData)
  const base64 = qr.split(',')[1]
  const qrBuf = Buffer.from(base64, 'base64')
  doc.image(qrBuf, { fit: [100,100], align: 'right' })
  doc.end()
  doc.on('data', b=>chunks.push(b))
  doc.on('end', async ()=>{
    const buf = Buffer.concat(chunks)
    await s3.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET || 'uploads', Key: receiptKey, Body: buf, ContentType: 'application/pdf' }))
    const url = `${process.env.S3_PUBLIC_URL}/${receiptKey}`
    await prisma.application.update({ where: { id: app.id }, data: { status: 'SUBMITTED', submittedAt: new Date(), receiptUrl: url } })
    res.json({ ok: true, url })
  })
})

applicationsRouter.post('/:id/eligibility', requireAuth(['APPLICANT','ADMIN']), async (req, res) => {
  const app = await prisma.application.findUnique({ where: { id: req.params.id }, include: { job: true, user: true } })
  if (!app) return res.status(404).json({ error: 'Not found' })
  const { dob, category, ageMin, ageMax } = req.body
  const crucialDate = app.job.crucialDate.toISOString()
  const result = checkEligibility({ dob, category, crucialDate, ageMin: ageMin ?? app.job.ageMin ?? undefined, ageMax: ageMax ?? app.job.ageMax ?? undefined })
  res.json(result)
})
