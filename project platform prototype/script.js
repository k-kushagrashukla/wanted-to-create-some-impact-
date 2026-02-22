const API_URL = "http://localhost:5000/api/projects";

console.log("script.js loaded ✅");

async function addProject() {
  console.log("Add Project clicked ✅");

  const project = {
    title: document.getElementById("title").value,
    description: document.getElementById("description").value,
    creatorName: document.getElementById("creatorName").value,
    repoLink: document.getElementById("repoLink").value,
    packageGot: document.getElementById("packageGot").value,
    year: Number(document.getElementById("year").value),
    techStack: document
      .getElementById("techStack")
      .value.split(",")
      .map(t => t.trim())
  };

  // ✅ basic validation
  if (!project.title || !project.repoLink || !project.creatorName) {
    alert("Please fill all required fields");
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project)
    });

    if (!res.ok) {
      throw new Error("Failed to add project");
    }

    const data = await res.json();
    alert("✅ Project added successfully");

    loadProjects(); // refresh list
  } catch (err) {
    console.error("❌ Error:", err);
    alert("Something went wrong. Check console.");
  }
}

async function loadProjects() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    const container = document.getElementById("projects");
    container.innerHTML = "";

    data.forEach(p => {
      container.innerHTML += `
        <div class="card">
          <h3>${p.title}</h3>
          <p>${p.description}</p>
          <p><strong>Creator:</strong> ${p.creatorName}</p>
          <p><strong>Year:</strong> ${p.year}</p>
          <p><strong>Package:</strong> ${p.packageGot}</p>
          <a href="${p.repoLink}" target="_blank">Repo Link</a>
        </div>
      `;
    });
  } catch (err) {
    console.error("Load error:", err);
  }
}

loadProjects();
