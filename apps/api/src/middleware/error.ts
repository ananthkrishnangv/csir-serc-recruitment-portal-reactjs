
import { NextFunction, Request, Response } from 'express'
export function errorHandler(err:any, req:Request, res:Response, _next:NextFunction){ console.error('ERROR', err); res.status(err.status||500).json({ error: err.message||'Internal Server Error' }) }
