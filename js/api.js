// ============================================================
// api.js — Conexión con Google Apps Script
// ============================================================

const API_URL = 'https://script.google.com/macros/s/AKfycbyy3IwcOoKFq_8LjAo5Me3MvOQe1pMRyVIU15E77DdnMYvndAHTK6W7Jm26rSmtU7bu/exec';

async function apiGet(action) {
  const res = await fetch(`${API_URL}?action=${action}`);
  return res.json();
}

async function apiPost(action, body) {
  await fetch(`${API_URL}?action=${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(body)
  });
  return { ok: true };
}
