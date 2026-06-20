// models/Form.js
const mongoose = require("mongoose");

const fieldSchema = new mongoose.Schema(
  {
    label: String,
    name: String,
    type: String,
    required: Boolean,
    options: [String], // For select, radio, checkbox fields
    placeholder: String,
    validation: {
      min: Number,
      max: Number,
      pattern: String,
    },
  },
  { _id: false }
);

const formSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    formName: {
      type: String,
      required: true,
    },
    apiKey: {
      type: String,
      unique: true,
      required: true,
    },
    fields: [fieldSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    settings: {
      allowMultipleSubmissions: {
        type: Boolean,
        default: true,
      },
      confirmationMessage: String,
      redirectUrl: String,
    },
  },
  { timestamps: true }
);

// Index for faster queries
formSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.models.Form || mongoose.model("Form", formSchema);