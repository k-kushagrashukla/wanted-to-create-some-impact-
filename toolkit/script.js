function openModal(type) {
  document.getElementById("modal").style.display = "block";

  // Clear previous values
  document.getElementById("role").value = "";
  document.getElementById("company").value = "";
  document.getElementById("details").value = "";
  document.getElementById("output").value = "";

  // Set title
  if (type === "cover") {
    document.getElementById("modalTitle").innerText = "Cover Letter Generator";
  }

  if (type === "linkedin") {
    document.getElementById("modalTitle").innerText = "LinkedIn Message Generator";
  }

  if (type === "resume") {
    document.getElementById("modalTitle").innerText = "Resume Bullet Generator";
  }
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
  document.getElementById("output").value = "";
}

function copyText() {
  const output = document.getElementById("output");
  output.select();
  document.execCommand("copy");
  alert("Copied!");
}

async function generate() {
  const role = document.getElementById("role").value;
  const company = document.getElementById("company").value;
  const details = document.getElementById("details").value;

  const titleText = document.getElementById("modalTitle").innerText.toLowerCase();

  const type =
    titleText.includes("cover") ? "cover" :
    titleText.includes("linkedin") ? "linkedin" :
    "resume";

  try {
    const response = await fetch("https://students-toolkit.onrender.com/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ role, company, details, type })
    });

    const data = await response.json();

    document.getElementById("output").value =
      data.result || "No response received.";
      
  } catch (err) {
    document.getElementById("output").value = "Server error. Try again.";
    console.error(err);
  }
}
