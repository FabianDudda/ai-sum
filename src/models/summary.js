import mongoose, { Schema, models } from "mongoose";

const summarySchema = new Schema(
  {
    title: {
      type: String,
      required: false,
    },
    text: {
      summary: {
        type: String,
        required: true,
      },
      original: {
        type: String,
        required: false,
      },
    },
    source: {
      type: String,
      required: false,
    },
    userId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Summary = models.Summary || mongoose.model("Summary", summarySchema);
export default Summary;
