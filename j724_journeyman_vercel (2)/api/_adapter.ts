import type { VercelRequest, VercelResponse } from '@vercel/node';

type NetlifyEvent = {
  httpMethod: string;
  path: string;
  headers: Record<string, string>;
  queryStringParameters: Record<string, string>;
  rawQuery?: string;
  body?: string;
};
type NetlifyResult = { statusCode: number; headers?: Record<string,string>; body?: string; isBase64Encoded?: boolean };

type NetlifyModule = { handler: (event: NetlifyEvent, context?: any) => Promise<NetlifyResult> };

export function toVercel(mod: NetlifyModule){
  return async (req: VercelRequest, res: VercelResponse) => {
    const url = new URL(req.url || "/", `https://${req.headers.host||"x"}`);
    const qs: Record<string,string> = {}; url.searchParams.forEach((v,k)=>{ qs[k]=v; });
    const headers: Record<string,string> = {};
    Object.entries(req.headers).forEach(([k,v])=> headers[k] = Array.isArray(v) ? v.join(",") : String(v));
    const body = typeof req.body === "string" ? req.body : (req.body ? JSON.stringify(req.body) : undefined);
    const out = await mod.handler({ httpMethod: req.method||"GET", path: url.pathname, headers, queryStringParameters: qs, rawQuery: url.search.replace(/^\?/,""), body });
    if (out.headers) for (const [k,v] of Object.entries(out.headers)) res.setHeader(k, v as string);
    const payload = out.body ?? "";
    if (out.isBase64Encoded) res.status(out.statusCode).send(Buffer.from(payload, "base64"));
    else res.status(out.statusCode).send(payload);
  };
}
