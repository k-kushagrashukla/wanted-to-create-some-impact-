import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.post("/generate", (req, res) => {
  const { role, company, details, type } = req.body;

  let result = "";

  if (type === "cover") {
    result = `Dear Hiring Manager,

I am excited to apply for the ${role} position at ${company}.
I have experience in ${details} and am eager to contribute and learn.

Thank you for your time and consideration.

Sincerely,
[Your Name]`;
  }

  if (type === "linkedin") {
    result = `Hi, I hope you're doing well.

I am interested in the ${role} opportunity at ${company}.
I have experience in ${details} and would love to connect and learn more.

Thank you!`;
  }

  if (type === "resume") {
    result = `• Developed projects using ${details}
• Built real-world features and improved UI
• Wrote clean and maintainable code`;
  }

  res.json({ result });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
