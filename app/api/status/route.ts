export const dynamic = 'force-dynamic';
export function GET() { return Response.json({ configured: Boolean(process.env.GEMINI_API_KEY) }, { headers: { 'Cache-Control': 'no-store' } }); }
