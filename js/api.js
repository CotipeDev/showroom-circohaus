// ============================================================
// api.js — Conexión con Google Apps Script
// Entorno DEV — Ventas V2
// ============================================================

const API_URL = 'https://script.google.com/macros/s/AKfycbzUs7BN54n-1snXDYlxUimolaZw3FQSMe5FS_lOF7X1B3NBAyKCzui6DuRIVo3NhtrgrA/exec';

async function apiGet(action) {
  const res = await fetch(`${API_URL}?action=${action}`);
  return res.json();
}

async function apiPost(action, body) {
  const res = await fetch(`${API_URL}?action=${encodeURIComponent(action)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; }
  catch (error) { throw new Error(`Respuesta inválida del backend (${res.status}).`); }
  if (!res.ok) throw new Error(data?.error || data?.message || `Error HTTP ${res.status}`);
  if (!data || data.ok !== true) throw new Error(data?.error || data?.message || 'El backend no confirmó la operación.');
  return data;
}
