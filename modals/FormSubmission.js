const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
    },
    data: {
      type: Object,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FormSubmission", submissionSchema);