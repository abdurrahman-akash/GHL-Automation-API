import { asyncHandler } from "../../utils/async-handler.js";
import { syncWebhookContact } from "./webhook.service.js";

export const webhookController = asyncHandler(async (req, res) => {
  const result = await syncWebhookContact({
    payload: req.body,
    signature: req.header("x-webhook-secret"),
    locationIdHeader: req.header("x-location-id") || req.header("x-ghl-location-id")
  });

  res.status(202).json(result);
});
