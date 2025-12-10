import type { VercelRequest, VercelResponse } from '@vercel/node';
export default async function handler(req: VercelRequest, res: VercelResponse){
  const checks: Record<string, any> = {};
  const fetchJson = async (u: string) => (await fetch(u)).ok;
  try { checks.opensanctions = await fetchJson("https://api.opensanctions.org/datasets"); } catch { checks.opensanctions = false; }
  try { checks.gdelt = await fetchJson("https://api.gdeltproject.org/api/v2/doc/doc?query=test&maxrecords=1&format=json"); } catch { checks.gdelt = false; }
  checks.runtime = { node: process.version };
  res.setHeader("content-type","application/json");
  res.status(200).send(JSON.stringify({ ok:true, checks }));
}
