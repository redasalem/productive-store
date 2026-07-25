import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { clerkMiddleware } from '@clerk/express'
import { clerkWebhookHandler } from "./webhooks/clerk";
import { getEnv } from "./lib/env";
import meRouter from "./routes/meRouter";
import productRouter from "./routes/productRouter";
import streamRouter from "./routes/streamRouter";

const env = getEnv();
const app = express();

app.post('/webhooks/clerk', express.raw({ type: 'application/json' }), (req, res) => {
  void clerkWebhookHandler(req, res);
});

app.use(express.json());

app.use(cors());

app.use(clerkMiddleware())

// Health check endpoint
app.get(["/health", "/api/health"], (_req, res) => {
  res.json({ ok: true, status: "healthy", timestamp: new Date().toISOString() });
});

app.use("/api/me",meRouter);

app.use("/api/products",productRouter)

app.use("/api/stream",streamRouter);

// Serve frontend static files in production
const publicDir = path.join(process.cwd(), "public");
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));

  app.get("/{*any}", (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      next();
      return;
    }
    if (req.path.startsWith("/api") || req.path.startsWith("/webhooks") || req.path.startsWith("/health")) {
      next();
      return;
    }
    res.sendFile(path.join(publicDir, "index.html"), (err) => next(err));
  });
}

app.listen(env.PORT, () => {
  console.log(`Listening on port: ${env.PORT}`);
  // if (process.env.NODE_ENV === "production") {
  //   keepAliveCron.start();
  // }
});
