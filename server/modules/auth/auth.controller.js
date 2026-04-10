import { connectGhlAccount } from "./auth.service.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { env } from "../../config/env.js";

export const connectGhlController = asyncHandler(async (req, res) => {
  const { accessKey } = await connectGhlAccount(req.body);

  const sameSite = env.ACCESS_KEY_COOKIE_SAME_SITE;
  const secure = sameSite === "none" ? true : env.ACCESS_KEY_COOKIE_SECURE;

  res.cookie(env.ACCESS_KEY_COOKIE_NAME, accessKey, {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    maxAge: env.ACCESS_KEY_COOKIE_MAX_AGE_MS,
    domain: env.ACCESS_KEY_COOKIE_DOMAIN || undefined
  });

  res.status(201).json({
    message: "GHL account connected successfully",
    accessKey
  });
});
