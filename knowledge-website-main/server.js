const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// ✅ MongoDB connection
mongoose
  .connect("mongodb://127.0.0.1:27017/experiencesDB")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Mongoose Schema + Model
const experienceSchema = new mongoose.Schema({
  name: String,
  batch: String,
  company: String,
  role: String,
  description: String,
  category: String,
  rollno: { type: String, required: true }, // changed to String to avoid input issues
  linkedin: String,
  reactions: {
    like: { type: Number, default: 0 },
    love: { type: Number, default: 0 },
    laugh: { type: Number, default: 0 },
    wow: { type: Number, default: 0 },
  },
});

const Experience = mongoose.model("Experience", experienceSchema);

// 🟢 Fetch all experiences
app.get("/api/experiences", async (req, res) => {
  try {
    const experiences = await Experience.find();
    res.json(experiences);
  } catch (err) {
    console.error("Error fetching experiences:", err);
    res.status(500).json({ message: "Failed to fetch experiences" });
  }
});

// 🟢 Add new experience
app.post("/api/add-experience", async (req, res) => { // ✅ route now matches frontend
  try {
    const exp = new Experience(req.body);
    await exp.save();
    res.status(201).json({ message: "Experience added successfully!" });
  } catch (err) {
    console.error("Error adding experience:", err);
    res.status(500).json({ message: "Failed to add experience" });
  }
});

// ❤️ React to an Experience
app.post("/api/experiences/:id/react", async (req, res) => {
  try {
    const { type } = req.body;
    const exp = await Experience.findById(req.params.id);

    if (!exp) return res.status(404).json({ message: "Experience not found" });

    if (!exp.reactions) {
      exp.reactions = { like: 0, love: 0, laugh: 0, wow: 0 };
    }

    if (Object.keys(exp.reactions).includes(type)) {
      exp.reactions[type] += 1;
      await exp.save();
      res.json({ message: "Reaction added!", reactions: exp.reactions });
    } else {
      return res.status(400).json({ message: "Invalid reaction type" });
    }
  } catch (error) {
    console.error("❌ Error adding reaction:", error.message);
    res.status(500).json({ message: "Failed to add reaction" });
  }
});

// ✅ Fallback for frontend
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🚀 Start Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
