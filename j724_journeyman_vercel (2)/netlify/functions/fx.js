exports.handler = async (e)=>{
  const base = e.queryStringParameters?.base || "USD";
  const symbols = (e.queryStringParameters?.symbols || "EUR,GBP").split(",");
  const amount = Number(e.queryStringParameters?.amount||"1");
  const r = await fetch(`https://api.exchangerate.host/latest?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(symbols.join(","))}`);
  const j = await r.json();
  const converted = {}; for(const k of Object.keys(j.rates||{})) converted[k] = (j.rates[k]||0)*amount;
  return { statusCode:200, headers:{ "content-type":"application/json" }, body: JSON.stringify({ base, rates:j.rates, converted }) };
};
