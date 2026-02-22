const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    creatorName: String,
    repoLink: String,
    packageGot: String,
    year: Number,
    techStack: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
