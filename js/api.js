// ============================================================
// api.js — Conexión con Google Apps Script
// ============================================================

const API_URL = 'https://script.google.com/macros/s/AKfycbzUs7BN54n-1snXDYlxUimolaZw3FQSMe5FS_lOF7X1B3NBAyKCzui6DuRIVo3NhtrgrA/exec';

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
