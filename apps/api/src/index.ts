/**
 * PGS EXP Freight Platform API.
 *
 * Routes (scaffold):
 *   POST /quotes            -> price a shipment via @pgs/pricing-engine
 *   GET  /shipments/:id     -> shipment + normalized tracking events
 *   GET  /rates             -> search current carrier rates
 *
 * Persistence (Prisma/PostgreSQL) and auth are wired in the next milestone.
 */
import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { quote } from "../../../packages/pricing-engine/src/index";

async function readJson(req: IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

const server = createServer(async (req: ServerResponse & IncomingMessage, res) => {
  try {
    if (req.method === "POST" && req.url === "/quotes") {
      const body = await readJson(req as IncomingMessage);
      const result = quote(body);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(result));
      return;
    }
    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
  } catch (err) {
    res.writeHead(400, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: (err as Error).message }));
  }
});

const port = Number(process.env.PORT ?? 3000);
server.listen(port, () => console.log(`api listening on :${port}`));
