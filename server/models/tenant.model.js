import mongoose from "mongoose";

const tenantCredentialSchema = new mongoose.Schema(
  {
    locationId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    ghlApiKey: {
      type: String,
      required: true,
      trim: true
    },
    accessKeyHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    lastSyncedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const TenantCredential =
  mongoose.models.TenantCredential ||
  mongoose.model("TenantCredential", tenantCredentialSchema);
