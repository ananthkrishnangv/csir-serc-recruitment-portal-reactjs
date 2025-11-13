
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import bodyParser from 'body-parser'
import dotenv from 'dotenv'
import { authRouter } from './routes/auth.js'
import { jobsRouter } from './routes/jobs.js'
import { applicationsRouter } from './routes/applications.js'
import { adminRouter } from './routes/admin.js'
import { labsRouter } from './routes/labs.js'
import { departmentsRouter } from './routes/departments.js'
import { formsRouter } from './routes/forms.js'
import { profileRouter } from './routes/profile.js'
import { errorHandler } from './middleware/error.js'

dotenv.config()
const app = express()
app.use(helmet({ contentSecurityPolicy: false }))
app.use(morgan('combined'))
app.use(rateLimit({ windowMs: 60_000, max: 300 }))
app.use(cors({ origin: process.env.WEB_ORIGIN?.split(',') || ['http://localhost:3000'], credentials: true }))
app.use(bodyParser.json({ limit: '10mb' }))
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/health', (_req,res)=> res.json({ ok: true }))
app.use('/auth', authRouter)
app.use('/jobs', jobsRouter)
app.use('/applications', applicationsRouter)
app.use('/admin', adminRouter)
app.use('/labs', labsRouter)
app.use('/departments', departmentsRouter)
app.use('/forms', formsRouter)
app.use('/me', profileRouter)
app.use(errorHandler)

const port = process.env.PORT || 4000
app.listen(port, ()=> console.log('API running on :'+port))
