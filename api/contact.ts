// POST /api/contact on Vercel (a Node.js function; files in api/ become endpoints). Everything is in
// src/server/contact (README.md there); this only supplies Vercel's environment.

import { handleContactRequest } from '../src/server/contact/index.js'

export async function POST(request: Request): Promise<Response> {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return handleContactRequest(request, {
    env: process.env,
    dev: false,
    ip: request.headers.get('x-real-ip') ?? forwarded ?? 'unknown',
    // The built /contact page, from this same deployment.
    loadPage: async () => {
      const res = await fetch(new URL('/contact', request.url))
      if (!res.ok) throw new Error(`/contact answered ${res.status}`)
      return res.text()
    },
  })
}
