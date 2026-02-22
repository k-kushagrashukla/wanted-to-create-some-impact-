const projects = [
  {
    title: "Spotify Clone",
    year: "1",
    lpa: null,
    desc: "Simple clone built while learning HTML & CSS.",
    tech: ["HTML", "CSS"],
    name: "Kushagra Shukla",
    location: "PSIT Kanpur • India",
    github: "https://github.com/k-kushagrashukla/Spotify-Clone.git",
    demo: null,
    hackathonWinner: false
  },
  {
    title: "Blockchain Voting System",
    year: "4",
    lpa: "₹52 LPA",
    desc: "Decentralized voting platform using blockchain.",
    tech: ["Solidity", "React", "Web3.js"],
    name: "Aarav Sharma",
    location: "IIT Delhi • India",
    github: "#",
    demo: "#",
    hackathonWinner: true
  }
];

const grid = document.getElementById("projectGrid");
const filters = document.querySelectorAll(".filter");
const modal = document.getElementById("projectModal");
const authModal = document.getElementById("authModal");

/* RENDER PROJECTS */
function renderProjects(list) {
  grid.innerHTML = "";

  list.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="card-header">
        <small>${p.year ? p.year + "th Year Project" : "Student Project"}</small>
        ${p.lpa ? `<div class="lpa">${p.lpa}</div>` : ""}
      </div>

      <h3>${p.title}</h3>
      <p>${p.desc.substring(0, 80)}</p>

      <div class="tags">
        ${p.tech.map(t => `<div class="tag">${t}</div>`).join("")}
      </div>

      <div class="card-footer">
        <div>
          <strong>${p.name}</strong><br>${p.location}
        </div>
      </div>
    `;

    card.addEventListener("click", () => openProjectModal(p));
    grid.appendChild(card);
  });
}

/* FILTER */
filters.forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelector(".filter.active").classList.remove("active");
    btn.classList.add("active");

    const year = btn.dataset.year;
    if (year === "All") renderProjects(projects);
    else renderProjects(projects.filter(p => p.year === year));
  });
});

/* MODAL */
function openProjectModal(p) {
  document.getElementById("modalTitle").innerText = p.title;
  document.getElementById("modalDesc").innerText = p.desc;
  document.getElementById("modalName").innerText = p.name;
  document.getElementById("modalLocation").innerText = p.location;

  const badgeBox = document.getElementById("modalBadges");
  badgeBox.innerHTML = "";

  if (p.lpa)
    badgeBox.innerHTML += `<span class="modal-badge yellow">${p.lpa}</span>`;

  if (p.year)
    badgeBox.innerHTML += `<span class="modal-badge gray">${p.year}th Year Project</span>`;

  if (p.hackathonWinner)
    badgeBox.innerHTML += `<span class="modal-badge purple">Hackathon Winner</span>`;

  const techBox = document.getElementById("modalTech");
  techBox.innerHTML = "";
  p.tech.forEach(t => {
    const tag = document.createElement("div");
    tag.className = "tag";
    tag.innerText = t;
    techBox.appendChild(tag);
  });

  const githubBtn = document.getElementById("modalGithub");
  const demoBtn = document.getElementById("modalDemo");

  githubBtn.style.display = p.github ? "inline-block" : "none";
  demoBtn.style.display = p.demo ? "inline-block" : "none";

  githubBtn.href = p.github || "#";
  demoBtn.href = p.demo || "#";

  modal.classList.remove("hidden");
}

function closeProjectModal() {
  modal.classList.add("hidden");
}

/* AUTH */
document.querySelector(".signin-btn").addEventListener("click", () => {
  authModal.classList.remove("hidden");
  showLogin();
});

function closeAuth() {
  authModal.classList.add("hidden");
}

function showSignup() {
  document.getElementById("loginForm").classList.add("hidden");
  document.getElementById("signupForm").classList.remove("hidden");
}

function showLogin() {
  document.getElementById("signupForm").classList.add("hidden");
  document.getElementById("loginForm").classList.remove("hidden");
}

renderProjects(projects);
