exports.handler = async (e)=>{
  const tz = e.queryStringParameters?.tz || "Etc/UTC";
  const r = await fetch(`https://worldtimeapi.org/api/timezone/${encodeURIComponent(tz)}`);
  const j = await r.json();
  return { statusCode:200, headers:{ "content-type":"application/json" }, body: JSON.stringify(j) };
};
