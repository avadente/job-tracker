const state = { apps: [], view: "table", sort: { key: "updated_at", dir: -1 } };

const $ = (sel) => document.querySelector(sel);
const dialog = $("#form-dialog");
const form = $("#app-form");

const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
const CLOSED = new Set(["rejected", "ghosted", "withdrawn"]);

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function showError(msg) {
  const el = $("#error");
  el.textContent = msg;
  el.hidden = !msg;
}

async function api(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

async function load() {
  try {
    state.apps = await api("GET", "/api/applications");
    showError("");
  } catch (e) {
    showError(e.message);
  }
  render();
}

function filtered() {
  const q = $("#search").value.trim().toLowerCase();
  const status = $("#status-filter").value;
  return state.apps.filter((a) => {
    if (status && a.status !== status) return false;
    if (!q) return true;
    return [a.company, a.role, a.location, a.notes, a.contact, a.next_action]
      .some((v) => v && v.toLowerCase().includes(q));
  });
}

function isOverdue(a) {
  return a.next_action_date && a.next_action_date <= today() && !CLOSED.has(a.status);
}

function fmtDate(isoDate) {
  return new Date(isoDate + "T00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const blank = '<span class="muted">—</span>';

function daysUntil(isoDate) {
  return Math.round((new Date(isoDate + "T00:00") - new Date(today() + "T00:00")) / 86400000);
}

// Deadlines only matter until you've applied, so only flag them while on the wishlist.
function deadlineHtml(a) {
  if (!a.deadline) return blank;
  const days = daysUntil(a.deadline);
  let cls = "";
  if (a.status === "wishlist" && days < 0) cls = "deadline-passed";
  else if (a.status === "wishlist" && days <= 7) cls = "overdue";
  return `<span class="${cls}">${fmtDate(a.deadline)}</span>`;
}

function nextActionHtml(a) {
  if (!a.next_action && !a.next_action_date) return blank;
  const cls = isOverdue(a) ? "overdue" : "";
  return `<span class="${cls}">${a.next_action_date ? fmtDate(a.next_action_date) : ""}</span>
    ${a.next_action ? `<div class="sub">${esc(a.next_action)}</div>` : ""}`;
}

function render() {
  renderStats();
  const apps = filtered();
  if (state.view === "table") renderTable(apps);
  else renderBoard(apps);
}

function renderStats() {
  const counts = Object.fromEntries(window.STATUSES.map((s) => [s, 0]));
  state.apps.forEach((a) => counts[a.status]++);
  const active = state.apps.filter((a) => !CLOSED.has(a.status) && a.status !== "wishlist").length;
  const overdue = state.apps.filter(isOverdue).length;
  $("#stats").innerHTML = `
    <div><strong>${state.apps.length}</strong> total</div>
    <div><strong>${active}</strong> active</div>
    <div><strong>${counts.interview}</strong> interviewing</div>
    <div><strong>${counts.offer}</strong> offers</div>
    <div class="${overdue ? "overdue" : ""}"><strong>${overdue}</strong> follow-ups due</div>`;
}

function renderTable(apps) {
  const { key, dir } = state.sort;
  apps = [...apps].sort((a, b) => {
    const av = a[key] ?? "", bv = b[key] ?? "";
    if (key === "status") return (window.STATUSES.indexOf(av) - window.STATUSES.indexOf(bv)) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });
  $("#rows").innerHTML = apps.map((a) => `
    <tr data-id="${a.id}" class="${isOverdue(a) ? "row-overdue" : ""}" title="Click to edit">
      <td class="company-cell">
        <div class="company">${esc(a.company)}${a.materials.length ? ' <span class="tag" title="Cover letter ready">Letter</span>' : ""}</div>
        <div class="sub">${a.url ? `<a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.role)} ↗</a>` : esc(a.role)}</div>
      </td>
      <td><span class="badge s-${a.status}">${a.status}</span></td>
      <td class="nowrap">${deadlineHtml(a)}</td>
      <td class="nowrap">${a.date_applied ? fmtDate(a.date_applied) : blank}</td>
      <td>${nextActionHtml(a)}</td>
      <td class="location-cell">
        <div class="truncate" title="${esc(a.location || "")}">${a.location ? esc(a.location) : blank}</div>
        ${a.work_mode ? `<span class="mode">${a.work_mode}</span>` : ""}
      </td>
    </tr>`).join("");
  $("#empty").hidden = apps.length > 0;
  document.querySelectorAll("th[data-sort]").forEach((th) => {
    th.classList.toggle("sorted", th.dataset.sort === key);
    th.dataset.dir = dir === 1 ? "asc" : "desc";
  });
}

function renderBoard(apps) {
  document.querySelectorAll(".column").forEach((col) => {
    const items = apps.filter((a) => a.status === col.dataset.status);
    col.querySelector(".count").textContent = items.length;
    col.querySelector(".cards").innerHTML = items.map((a) => `
      <div class="card ${isOverdue(a) ? "row-overdue" : ""}" draggable="true" data-id="${a.id}">
        <strong>${esc(a.company)}</strong>
        <div>${esc(a.role)}</div>
        ${a.deadline ? `<small>Deadline: ${deadlineHtml(a)}</small>` : ""}
        ${a.next_action_date ? `<small>${nextActionHtml(a)}</small>` : ""}
      </div>`).join("");
  });
}

function openForm(app) {
  form.reset();
  $("#form-title").textContent = app ? "Edit application" : "Add application";
  $("#delete-btn").hidden = !app;
  const data = app || { status: "applied", date_applied: today() };
  for (const el of form.elements) {
    if (el.name) el.value = data[el.name] ?? "";
  }
  const materials = app?.materials ?? [];
  $("#materials").innerHTML = materials.length ? `<strong>Cover letters</strong><ul>${materials.map((m) => `
    <li>${esc(m.created_at.slice(0, 10))} —
      <a href="/materials/${m.id}/pdf" target="_blank">PDF</a> ·
      <a href="/materials/${m.id}/docx">Word</a></li>`).join("")}</ul>` : "";
  dialog.showModal();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  const id = data.id;
  delete data.id;
  try {
    if (id) await api("PATCH", `/api/applications/${id}`, data);
    else await api("POST", "/api/applications", data);
    dialog.close();
    load();
  } catch (err) {
    alert(err.message);
  }
});

$("#delete-btn").addEventListener("click", async () => {
  const id = form.elements.id.value;
  if (!id || !confirm("Delete this application?")) return;
  try {
    await api("DELETE", `/api/applications/${id}`);
    dialog.close();
    load();
  } catch (err) {
    alert(err.message);
  }
});

$("#cancel-btn").addEventListener("click", () => dialog.close());
$("#add-btn").addEventListener("click", () => openForm(null));
$("#search").addEventListener("input", render);
$("#status-filter").addEventListener("change", render);

document.addEventListener("click", (e) => {
  if (e.target.closest("a")) return; // let links (e.g. the posting) open normally
  const target = e.target.closest("#rows tr, .card");
  if (!target) return;
  const id = Number(target.dataset.id);
  openForm(state.apps.find((a) => a.id === id));
});

document.querySelectorAll("th[data-sort]").forEach((th) => th.addEventListener("click", () => {
  const key = th.dataset.sort;
  state.sort = { key, dir: state.sort.key === key ? -state.sort.dir : 1 };
  render();
}));

function setView(view) {
  state.view = view;
  document.querySelectorAll(".view-toggle button").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  $("#table-view").hidden = view !== "table";
  $("#board-view").hidden = view !== "board";
  history.replaceState(null, "", view === "board" ? "#board" : location.pathname);
  render();
}

document.querySelectorAll(".view-toggle button").forEach((btn) => btn.addEventListener("click", () => setView(btn.dataset.view)));
if (location.hash === "#board") setView("board");

// Drag cards between board columns to change status
document.addEventListener("dragstart", (e) => {
  const card = e.target.closest?.(".card");
  if (card) e.dataTransfer.setData("text/plain", card.dataset.id);
});
document.querySelectorAll(".column").forEach((col) => {
  col.addEventListener("dragover", (e) => { e.preventDefault(); col.classList.add("drop"); });
  col.addEventListener("dragleave", () => col.classList.remove("drop"));
  col.addEventListener("drop", async (e) => {
    e.preventDefault();
    col.classList.remove("drop");
    const id = e.dataTransfer.getData("text/plain");
    try {
      await api("PATCH", `/api/applications/${id}`, { status: col.dataset.status });
      load();
    } catch (err) {
      showError(err.message);
    }
  });
});

load();
