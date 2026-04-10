import crypto from "node:crypto";
import { env } from "../config/env.js";

export const generateAccessKey = ({ locationId, ghlApiKey }) => {
  const entropy = crypto.randomBytes(32).toString("hex");
  const tokenBase = `${locationId}:${ghlApiKey}:${Date.now()}:${entropy}`;
  const digest = crypto
    .createHash("sha256")
    .update(`${tokenBase}:${env.ACCESS_KEY_SECRET}`)
    .digest("hex");

  return `ak_${digest}`;
};

export const hashAccessKey = (accessKey) =>
  crypto.createHash("sha256").update(`${accessKey}:${env.ACCESS_KEY_SECRET}`).digest("hex");
