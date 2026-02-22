// Update BASE_URL if backend is hosted elsewhere
const BASE_URL = 'http://localhost:5000/api';

// Auth helpers
function saveAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  setAuthUI(user);
}
function getToken() { return localStorage.getItem('token'); }
function getUser() { return JSON.parse(localStorage.getItem('user') || 'null'); }
function logout() { localStorage.removeItem('token'); localStorage.removeItem('user'); setAuthUI(null); }

// UI wiring
document.getElementById('btn-show-register').onclick = () => {
  document.getElementById('register-form').style.display = 'block';
  document.getElementById('login-form').style.display = 'none';
};
document.getElementById('btn-show-login').onclick = () => {
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('register-form').style.display = 'none';
};
document.getElementById('btn-logout').onclick = () => { logout(); loadProjects(); window.location.reload(); };

document.getElementById('r_submit').onclick = async () => {
  const payload = { name: document.getElementById('r_name').value, email: document.getElementById('r_email').value, password: document.getElementById('r_password').value, college: document.getElementById('r_college').value };
  const res = await fetch(BASE_URL + '/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  const data = await res.json();
  if (res.ok) { saveAuth(data.token, data.user); alert('Registered'); } else alert(data.message || 'Error');
};

document.getElementById('l_submit').onclick = async () => {
  const payload = { email: document.getElementById('l_email').value, password: document.getElementById('l_password').value };
  const res = await fetch(BASE_URL + '/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  const data = await res.json();
  if (res.ok) { saveAuth(data.token, data.user); alert('Logged in'); } else alert(data.message || 'Error');
};

// set UI for auth
function setAuthUI(user) {
  document.getElementById('btn-logout').style.display = user ? 'inline-block' : 'none';
  document.getElementById('btn-admin').style.display = user && user.role === 'admin' ? 'inline-block' : 'none';
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('login-form').style.display = 'none';
}

// Add project (with optional banner)
document.getElementById('addProjectBtn').onclick = async () => {
  const token = getToken();
  if (!token) return alert('Please login first');

  const form = new FormData();
  form.append('title', document.getElementById('title').value);
  form.append('description', document.getElementById('description').value);
  form.append('techStack', document.getElementById('techStack').value);
  form.append('repoLink', document.getElementById('repoLink').value);
  form.append('liveLink', document.getElementById('liveLink').value);
  form.append('year', document.getElementById('year').value);
  form.append('packageGot', document.getElementById('packageGot').value);
  const banner = document.getElementById('banner').files[0];
  if (banner) form.append('banner', banner);

  const res = await fetch(BASE_URL + '/projects', { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: form });
  const data = await res.json();
  if (res.ok) { alert('Project added'); loadProjects(); } else alert(data.message || 'Error');
};

// Filters
document.getElementById('applyFilters').onclick = () => loadProjects();

// Admin panel
document.getElementById('btn-admin').onclick = async () => {
  document.getElementById('admin-panel').style.display = 'block';
  const token = getToken();
  const res = await fetch(BASE_URL + '/admin/users', { headers: { Authorization: 'Bearer ' + token } });
  const users = await res.json();
  const container = document.getElementById('admin-users');
  container.innerHTML = users.map(u => `<div>${u.name} (${u.email}) role: ${u.role} <button data-id="${u._id}" class="prom">Promote</button></div>`).join('');
  document.querySelectorAll('.prom').forEach(b => b.onclick = async () => {
    const id = b.dataset.id;
    await fetch(BASE_URL + '/admin/promote', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ userId: id }) });
    alert('Promoted');
  });
};

// Load projects with filters
async function loadProjects() {
  const q = document.getElementById('searchQ').value;
  const year = document.getElementById('filterYear').value;
  const tech = document.getElementById('filterTech').value;
  const sortBy = document.getElementById('sortBy').value;
  const order = document.getElementById('order').value;

  const params = new URLSearchParams();
  if (q) params.append('q', q);
  if (year) params.append('year', year);
  if (tech) params.append('tech', tech);
  if (sortBy) params.append('sortBy', sortBy);
  if (order) params.append('order', order);

  const res = await fetch(BASE_URL + '/projects?' + params.toString());
  const body = await res.json();
  const data = body.data || body;
  const container = document.getElementById('projects');
  container.innerHTML = '';
  (data || []).forEach(p => {
    const div = document.createElement('div');
    div.className = 'project-card';
    div.innerHTML = `
      ${p.bannerUrl ? `<img src="${p.bannerUrl}" alt="${p.title}" />` : ''}
      <h4>${p.title}</h4>
      <p class="small">${p.creatorName} • Year ${p.year}</p>
      <p>${p.description?.slice(0,200) || ''}</p>
      <p class="small">Stack: ${p.techStack?.join(', ') || '-'}</p>
      <p class="small">Package: ${p.packageGot || '-'}</p>
      <p><a href="${p.repoLink}" target="_blank">Repo</a> ${p.liveLink ? `| <a href="${p.liveLink}" target="_blank">Live</a>` : ''}</p>
    `;
    container.appendChild(div);
  });
}

// initialize
setAuthUI(getUser());
loadProjects();
