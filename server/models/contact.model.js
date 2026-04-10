import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    locationId: {
      type: String,
      required: true,
      index: true
    },
    contactId: {
      type: String,
      required: true
    },
    email: {
      type: String,
      default: null,
      index: true
    },
    phone: {
      type: String,
      default: null,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

contactSchema.index({ locationId: 1, contactId: 1 }, { unique: true });
contactSchema.index({ locationId: 1, email: 1 });
contactSchema.index({ locationId: 1, phone: 1 });

export const Contact = mongoose.models.Contact || mongoose.model("Contact", contactSchema);
