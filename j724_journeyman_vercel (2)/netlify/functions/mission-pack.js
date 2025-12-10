const PDFDocument = require("pdfkit");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return resp(405, "Only POST");
  try{
    const body = JSON.parse(event.body||"{}");
    const report = body.report || null;
    const edd = body.edd || null;
    const meta = body.meta || {};

    if (!report) return resp(400, "Missing report");

    const doc = new PDFDocument({ size: "A4", margin: 36 });
    const chunks = [];
    doc.on("data", c => chunks.push(c));
    const done = new Promise(resolve => doc.on("end", resolve));

    // Header
    doc.fontSize(20).fillColor("#0a84ff").text("Mission Pack — J724 Journeyman", { align: "left" });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#444").text(`Generated: ${new Date(meta.generatedAt||Date.now()).toUTCString()}`);
    doc.moveDown(0.6);
    doc.moveTo(36, doc.y).lineTo(559, doc.y).strokeColor("#ddd").stroke();

    // Itinerary Summary
    doc.moveDown(0.8);
    doc.fontSize(14).fillColor("#111").text("Itinerary Summary");
    doc.moveDown(0.2);
    doc.fontSize(11).fillColor("#222").text(`Overall Risk: ${report.overallRisk}/100`, { continued: true }).fillColor("#666").text("  (higher = more attention)");
    doc.moveDown(0.5);

    (report.legs||[]).forEach((leg, idx) => {
      doc.fontSize(12).fillColor("#111").text(`Leg ${idx+1}: ${leg.depart.name} → ${leg.arrive.name}`);
      doc.fontSize(10).fillColor("#333").text(`${new Date(leg.depart.time).toLocaleString()} → ${new Date(leg.arrive.time).toLocaleString()} • ${Math.round(leg.distance_km)} km`);
      doc.fontSize(10).fillColor("#333").text(`Risk ${leg.risk}/100 • Arrival Weather: ${leg.weather.summary} (${Math.round(leg.weather.tempC)}°C, wind ${Math.round(leg.weather.windKph)} km/h, precip ${Math.round(leg.weather.precipProb)}%)`);
      const hazards = (leg.nearbyHazards||[]).slice(0,3).map(h => `${h.label} (${h.source}, ${Math.round(h.distance_km)}km)`).join(" • ");
      if (hazards) doc.fontSize(9).fillColor("#555").text(`Nearby Hazards: ${hazards}`);
      doc.moveDown(0.5);
    });

    // EDD Section
    if (edd) {
      doc.addPage();
      doc.fontSize(14).fillColor("#111").text("Enhanced Due Diligence Snapshot");
      if (edd.query) { doc.moveDown(0.2); doc.fontSize(10).fillColor("#333").text(`Subject: ${edd.query}`); }
      const hits = (edd.hits||[]).slice(0,6);
      if (hits.length) {
        doc.moveDown(0.4);
        doc.fontSize(12).fillColor("#111").text("PEP & Sanctions (top matches)");
        doc.fontSize(9).fillColor("#333");
        hits.forEach((h,i)=>{
          doc.text(`${i+1}. ${h.name} — ${h.schema} — score ${Math.round((h.score||0)*100)}`);
        });
      }
      const media = (edd.media||[]).slice(0,6);
      if (media.length) {
        doc.moveDown(0.6);
        doc.fontSize(12).fillColor("#111").text("Adverse Media (recent)");
        doc.fontSize(9).fillColor("#333");
        media.forEach((m,i)=> doc.text(`${i+1}. ${m.title} — ${m.source} — ${new Date(m.date).toLocaleDateString()}`));
      }
      if (edd.graphPng) {
        try{
          const b64 = edd.graphPng.split(",")[1];
          const buf = Buffer.from(b64, "base64");
          doc.moveDown(0.8);
          doc.fontSize(12).fillColor("#111").text("Relationship Graph", { align: "left" });
          const y = doc.y + 6;
          doc.image(buf, { fit: [540, 360], align: "center", valign: "top", y });
        }catch{}
      }
    }

    // Footer
    doc.addPage();
    doc.fontSize(12).fillColor("#111").text("Safe Havens & POIs (Arrival Vicinity)");
    try{
      const all = report.poisGeoJSON?.features || [];
      const grouped = {};
      for (const f of all) {
        const k = f.properties?.kind || "poi";
        if (!grouped[k]) grouped[k] = 0;
        grouped[k]++;
      }
      doc.moveDown(0.4);
      doc.fontSize(10).fillColor("#333").text(Object.keys(grouped).map(k=>`${k}: ${grouped[k]}`).join(" • ") || "No POIs listed.");
    }catch{}
    doc.moveDown(1);
    doc.fontSize(9).fillColor("#666").text("Sources: Open-Meteo, Overpass/OSM, USGS, GDACS, ReliefWeb, EONET, OpenSanctions, GDELT.", { align: "left" });
    doc.end();
    await done;
    const pdf = Buffer.concat(chunks);
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": "attachment; filename=Mission_Pack.pdf",
        "cache-control": "no-store"
      },
      body: pdf.toString("base64"),
      isBase64Encoded: true
    };
  }catch(e){
    return resp(500, String(e && e.message || "error"));
  }
};

function resp(code, msg){ return { statusCode: code, headers: { "content-type":"text/plain" }, body: msg }; }
