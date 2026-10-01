import nodemailer from 'nodemailer'
import { NextRequest, NextResponse } from 'next/server'
import { businessCrm } from '../../../../lib/business-crm'
import { businessRouteError } from '../_shared'

async function sendResetEmail(email: string, token: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) throw new Error('כתובת האתר אינה מוגדרת')
  const url = new URL('/business/reset-password', siteUrl)
  url.searchParams.set('token', token)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
  await transporter.sendMail({
    from: `"HTC ישראל לעסקים" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'איפוס סיסמה לחשבון העסקי שלך ב־HTC',
    text: `לבחירת סיסמה חדשה לחשבון העסקי: ${url.toString()}\nהקישור תקף ל־72 שעות.`,
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body || typeof body.email !== 'string') return NextResponse.json({ error: 'כתובת המייל אינה תקינה' }, { status: 400 })
  try {
    const result = await businessCrm.requestPasswordReset(body.email)
    if (result.resetToken) await sendResetEmail(body.email.trim(), result.resetToken)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return businessRouteError(error)
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body || typeof body.token !== 'string' || typeof body.password !== 'string') {
    return NextResponse.json({ error: 'קישור איפוס הסיסמה אינו תקין' }, { status: 400 })
  }
  try {
    await businessCrm.resetPassword(body.token, body.password)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return businessRouteError(error)
  }
}
