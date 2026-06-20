// models/FormSubmission.js
const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
      required: true,
    },
    data: {
      type: Object,
      required: true,
    },
    ipAddress: String,
    userAgent: String,
    status: {
      type: String,
      enum: ['pending', 'processed', 'rejected'],
      default: 'pending'
    },
    metadata: {
      submittedAt: Date,
      source: String,
    }
  },
  { timestamps: true }
);

// Index for faster queries
submissionSchema.index({ formId: 1, createdAt: -1 });
submissionSchema.index({ status: 1 });

module.exports = mongoose.models.FormSubmission || mongoose.model("FormSubmission", submissionSchema);