import { NextRequest, NextResponse } from 'next/server'
import { getCSRFToken } from '@/lib/security/csrf'

export async function GET(request: NextRequest) {
  const token = await getCSRFToken(request)
  
  const response = NextResponse.json({ token })
  
  // Set as httpOnly cookie for double-submit pattern
  response.cookies.set('csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/'
  })
  
  return response
}