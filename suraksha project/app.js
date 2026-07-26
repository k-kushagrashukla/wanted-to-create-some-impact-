// ── STORAGE ──────────────────────────────────────────────
const STORAGE_KEYS = {
  contacts: 'suraksha_contacts',
  emailjs:  'suraksha_emailjs',
};

function load(key) {
  try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; }
}
function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// ── STATE ─────────────────────────────────────────────────
let contacts   = load(STORAGE_KEYS.contacts) || [];
let ejConfig   = load(STORAGE_KEYS.emailjs)  || null;

let recording  = false;
let mediaRec   = null;
let audioBlob  = null;
let timerInt   = null;
let seconds    = 0;
let location   = null;
let locFetched = false;

// ── INIT ──────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  renderContacts();
  updateEmailSetupNote();
  if (ejConfig) emailjs.init(ejConfig.publicKey);
});

// ── SCREENS ───────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
}

function setStatus(text, cls) {
  const el = document.getElementById('statusBadge');
  el.textContent = text;
  el.className = 'status-badge' + (cls ? ' ' + cls : '');
}

// ── CONTACTS ──────────────────────────────────────────────
function renderContacts() {
  const list  = document.getElementById('contactList');
  const empty = document.getElementById('emptyContacts');

  if (contacts.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  list.innerHTML = contacts.map((c, i) => `
    <div class="contact-row">
      <div class="contact-avatar">${c.name[0].toUpperCase()}</div>
      <div class="contact-info">
        <div class="contact-name">${c.name}</div>
        <div class="contact-email">${c.email}</div>
      </div>
      <button class="contact-del" onclick="removeContact(${i})" aria-label="Remove">×</button>
    </div>
  `).join('');
}

function removeContact(i) {
  contacts.splice(i, 1);
  save(STORAGE_KEYS.contacts, contacts);
  renderContacts();
}

function openModal() {
  document.getElementById('contactModal').classList.add('open');
  document.getElementById('cName').focus();
}
function closeModal() {
  document.getElementById('contactModal').classList.remove('open');
  document.getElementById('cName').value = '';
  document.getElementById('cEmail').value = '';
}
function saveContact() {
  const name  = document.getElementById('cName').value.trim();
  const email = document.getElementById('cEmail').value.trim();
  if (!name || !email) { alert('Enter both name and email.'); return; }
  if (!/\S+@\S+\.\S+/.test(email)) { alert('Enter a valid email address.'); return; }
  contacts.push({ name, email });
  save(STORAGE_KEYS.contacts, contacts);
  renderContacts();
  closeModal();
}

// ── EMAIL SETUP ───────────────────────────────────────────
function openEmailSetup() {
  if (ejConfig) {
    document.getElementById('ejPublicKey').value  = ejConfig.publicKey  || '';
    document.getElementById('ejServiceId').value  = ejConfig.serviceId  || '';
    document.getElementById('ejTemplateId').value = ejConfig.templateId || '';
  }
  document.getElementById('emailModal').classList.add('open');
}
function closeEmailSetup() {
  document.getElementById('emailModal').classList.remove('open');
}
function saveEmailSetup() {
  const publicKey  = document.getElementById('ejPublicKey').value.trim();
  const serviceId  = document.getElementById('ejServiceId').value.trim();
  const templateId = document.getElementById('ejTemplateId').value.trim();
  if (!publicKey || !serviceId || !templateId) { alert('Fill in all three fields.'); return; }
  ejConfig = { publicKey, serviceId, templateId };
  save(STORAGE_KEYS.emailjs, ejConfig);
  emailjs.init(publicKey);
  updateEmailSetupNote();
  closeEmailSetup();
}
function updateEmailSetupNote() {
  const note = document.getElementById('emailSetupNote');
  if (ejConfig) note.classList.add('configured');
  else          note.classList.remove('configured');
}

// ── LOCATION ──────────────────────────────────────────────
function fetchLocation() {
  locFetched = false;
  location   = null;
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    pos => {
      location = {
        lat: pos.coords.latitude.toFixed(6),
        lng: pos.coords.longitude.toFixed(6),
      };
      locFetched = true;
    },
    () => { locFetched = true; },
    { timeout: 8000, maximumAge: 30000, enableHighAccuracy: true }
  );
}

// ── RECORDING ─────────────────────────────────────────────
async function handleSOS() {
  if (!recording) {
    if (contacts.length === 0) {
      alert('Add at least one emergency contact first.');
      return;
    }
    await startRecording();
  } else {
    stopAndPrepare();
  }
}

async function startRecording() {
  // request mic
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    alert('Microphone permission denied. Please allow mic access and try again.');
    return;
  }

  recording  = true;
  audioBlob  = null;
  seconds    = 0;
  locFetched = false;
  location   = null;

  // start location fetch immediately in background
  fetchLocation();

  // UI
  const btn = document.getElementById('sosBtn');
  btn.classList.add('recording');
  document.getElementById('sosLabel').textContent = 'TAP TO SEND';
  document.getElementById('sosSub').textContent   = 'recording your voice...';
  document.getElementById('sosIcon').innerHTML = `
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect x="10" y="10" width="16" height="16" rx="3" fill="white"/>
    </svg>`;
  document.getElementById('timer').style.display = 'block';
  document.getElementById('timer').textContent = '0:00';
  setStatus('Recording', 'recording');

  timerInt = setInterval(() => {
    seconds++;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    document.getElementById('timer').textContent = m + ':' + String(s).padStart(2, '0');
  }, 1000);

  // media recorder
  const chunks = [];
  mediaRec = new MediaRecorder(stream);
  mediaRec.ondataavailable = e => chunks.push(e.data);
  mediaRec.onstop = () => {
    audioBlob = new Blob(chunks, { type: 'audio/webm' });
    stream.getTracks().forEach(t => t.stop());
  };
  mediaRec.start();
}

function stopAndPrepare() {
  recording = false;
  clearInterval(timerInt);

  if (mediaRec && mediaRec.state !== 'inactive') mediaRec.stop();

  // reset button
  const btn = document.getElementById('sosBtn');
  btn.classList.remove('recording');
  document.getElementById('sosLabel').textContent = 'TAP TO RECORD';
  document.getElementById('sosSub').textContent   = 'tap again to send alert';
  document.getElementById('sosIcon').innerHTML = `
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="16" stroke="white" stroke-width="2"/>
      <path d="M18 10V18L23 21" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`;
  document.getElementById('timer').style.display = 'none';
  setStatus('Ready to send', 'ready-send');

  // wait a tick for mediaRec.onstop to fire, then build confirm screen
  setTimeout(buildConfirmScreen, 300);
}

// ── CONFIRM SCREEN ────────────────────────────────────────
function buildConfirmScreen() {
  const quickMsg = document.getElementById('quickMsg').value.trim();
  const locUrl   = location
    ? `https://maps.google.com/?q=${location.lat},${location.lng}`
    : null;

  // preview
  document.getElementById('previewBody').textContent =
    quickMsg || '(No message typed — location will still be sent)';

  const locEl = document.getElementById('previewLoc');
  if (locUrl) {
    locEl.textContent = '📍 ' + locUrl;
    locEl.style.display = 'block';
  } else {
    locEl.textContent = '📍 Location not available (GPS unavailable or permission denied)';
    locEl.style.display = 'block';
    locEl.style.color = '#E05252';
  }

  // contacts list
  document.getElementById('confirmContacts').innerHTML = contacts.map(c => `
    <div class="confirm-contact-row">
      <div class="dot"></div>
      <span>${c.name} — ${c.email}</span>
    </div>
  `).join('');

  showScreen('confirm');
}

// ── SEND ALERT ────────────────────────────────────────────
async function sendAlert() {
  if (!ejConfig) {
    alert('Email not configured yet. Tap "set up now" on the home screen.');
    return;
  }

  const btn = document.getElementById('sendBtn');
  btn.disabled = true;
  document.getElementById('sendBtnText').textContent = 'Sending...';

  const quickMsg = document.getElementById('quickMsg').value.trim();
  const locUrl   = location
    ? `https://maps.google.com/?q=${location.lat},${location.lng}`
    : 'Location unavailable';

  const fullMsg = [
    '🚨 EMERGENCY — I need help right now!',
    '',
    quickMsg ? `My message: ${quickMsg}` : '',
    `My location: ${locUrl}`,
    '',
    'Please call me or come immediately.'
  ].filter(Boolean).join('\n');

  let successCount = 0;
  const errors = [];

  for (const c of contacts) {
    try {
      await emailjs.send(ejConfig.serviceId, ejConfig.templateId, {
        to_name:    c.name,
        to_email:   c.email,
        message:    fullMsg,
        location:   locUrl,
        user_msg:   quickMsg || '(No message)',
        reply_to:   'noreply@suraksha.app',
      });
      successCount++;
    } catch (e) {
      errors.push(c.name);
      console.error('EmailJS error for', c.name, e);
    }
  }

  btn.disabled = false;
  document.getElementById('sendBtnText').textContent = 'Send to everyone';

  if (successCount > 0) {
    showSentScreen(successCount, errors);
  } else {
    alert('Could not send emails. Check your EmailJS configuration and try again.');
  }
}

function showSentScreen(successCount, errors) {
  setStatus('Sent', 'sent');

  const sentList = document.getElementById('sentContacts');
  sentList.innerHTML = contacts.map(c => {
    const failed = errors.includes(c.name);
    return `<div class="confirm-contact-row" style="${failed ? 'opacity:0.4' : ''}">
      <div class="dot" style="${failed ? 'background:#E05252' : ''}"></div>
      <span>${c.name} — ${failed ? 'failed' : 'sent ✓'}</span>
    </div>`;
  }).join('');

  showScreen('sent');
}

function goHome() {
  recording = false;
  clearInterval(timerInt);
  if (mediaRec && mediaRec.state !== 'inactive') mediaRec.stop();
  document.getElementById('sosBtn').classList.remove('recording');
  document.getElementById('sosLabel').textContent = 'TAP TO RECORD';
  document.getElementById('sosSub').textContent   = 'tap again to send alert';
  document.getElementById('timer').style.display  = 'none';
  setStatus('Ready', '');
  showScreen('home');
}
