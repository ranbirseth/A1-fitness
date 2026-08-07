const mongoose = require("mongoose");

const genericSchema = new mongoose.Schema(
  {
    gymId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: String,
    metadata: { type: Object, default: {} }
  },
  { timestamps: true }
);

const ClassSlot = mongoose.model("ClassSlot", genericSchema.clone());
const InventoryItem = mongoose.model("InventoryItem", genericSchema.clone());
const Branch = mongoose.model("Branch", genericSchema.clone());
const Referral = mongoose.model("Referral", genericSchema.clone());

module.exports = { ClassSlot, InventoryItem, Branch, Referral };
