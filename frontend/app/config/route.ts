export const dynamic = "force-dynamic";

// Public address of the API, read at request time so one image fits any deployment.
export function GET() {
  return Response.json({ apiUrl: process.env.API_URL ?? "" });
}
