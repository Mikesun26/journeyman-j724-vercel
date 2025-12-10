exports.handler = async function(event, context) {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
    body: `data: ${JSON.stringify({ layer:"composite", fc:{ type:"FeatureCollection", features: [] } })}\n\n`
  };
};
