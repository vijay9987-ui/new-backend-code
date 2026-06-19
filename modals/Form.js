const mongoose = require("mongoose");

const fieldSchema = new mongoose.Schema(
  {
    label: String,
    name: String,
    type: String,
    required: Boolean,
  },
  { _id: false }
);

const formSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    formName: String,
    apiKey: {
      type: String,
      unique: true,
    },
    fields: [fieldSchema],
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Form || mongoose.model("Form", formSchema);