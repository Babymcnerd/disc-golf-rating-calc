"use strict";

/* ---------- Constants & state ---------- */

const STORAGE_KEY = "dgcalc.courses";
const DEFAULT_PPT = 10;

// Seed courses. McNair seeded with an estimated SSA (~49) to replace; others blank.
const SEED_COURSES = [
  { id: "mcnair", name: "McNair Park", ssa: 49, ppt: DEFAULT_PPT },
  { id: "quailridge", name: "Quail Ridge", ssa: null, ppt: DEFAULT_PPT },
  { id: "newmelle", name: "New Melle", ssa: null, ppt: DEFAULT_PPT },
  { id: "stccc", name: "St. Charles Community College", ssa: null, ppt: DEFAULT_PPT },
];

let courses = loadCourses();

/* ---------- Pure helpers (rating math) ---------- */

// Rating = 1000 + (SSA - score) * pointsPerThrow
function calcRating(ssa, ppt, score) {
  return Math.round(1000 + (ssa - score) * ppt);
}

// Inverse: score needed to reach a target rating.
function calcScoreForRating(ssa, ppt, targetRating) {
  return ssa - (targetRating - 1000) / ppt;
}

function isUsable(course) {
  return course && Number.isFinite(course.ssa) && Number.isFinite(course.ppt) && course.ppt > 0;
}

/* ---------- Persistence ---------- */

function loadCourses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(SEED_COURSES);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return structuredClone(SEED_COURSES);
    return parsed.map(normalizeCourse);
  } catch (e) {
    return structuredClone(SEED_COURSES);
  }
}

function normalizeCourse(c) {
  return {
    id: c.id || ("c" + Math.abs(hashString(String(c.name || "course") + String(c.ssa)))),
    name: String(c.name || "Unnamed course"),
    ssa: Number.isFinite(c.ssa) ? c.ssa : null,
    ppt: Number.isFinite(c.ppt) && c.ppt > 0 ? c.ppt : DEFAULT_PPT,
  };
}

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function saveCourses() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  } catch (e) {
    /* storage may be unavailable (private mode) — app still works in-session */
  }
}

function newId() {
  return "c" + Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36);
}

/* ---------- DOM refs ---------- */

const el = {
  courseSelect: document.getElementById("course-select"),
  scoreInput: document.getElementById("score-input"),
  resultRating: document.getElementById("result-rating"),
  resultSub: document.getElementById("result-sub"),
  nearbyTable: document.getElementById("nearby-table"),
  nearbyBody: document.getElementById("nearby-body"),
  targetInput: document.getElementById("target-input"),
  reverseResult: document.getElementById("reverse-result"),
  coursesList: document.getElementById("courses-list"),
  addCourse: document.getElementById("add-course"),
};

/* ---------- Rendering: calculator ---------- */

function selectedCourse() {
  return courses.find((c) => c.id === el.courseSelect.value) || null;
}

function renderCourseSelect() {
  const current = el.courseSelect.value;
  el.courseSelect.innerHTML = "";
  for (const c of courses) {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name + (isUsable(c) ? "" : " (set SSA)");
    el.courseSelect.appendChild(opt);
  }
  if (courses.some((c) => c.id === current)) el.courseSelect.value = current;
}

function renderResult() {
  const course = selectedCourse();
  const score = parseFloat(el.scoreInput.value);

  el.nearbyTable.hidden = true;
  el.nearbyBody.innerHTML = "";

  if (!course) {
    el.resultRating.textContent = "—";
    el.resultSub.textContent = "Pick a course and enter a score";
    return;
  }
  if (!isUsable(course)) {
    el.resultRating.textContent = "—";
    el.resultSub.textContent = "Set an SSA for " + course.name + " below";
    return;
  }
  if (!Number.isFinite(score)) {
    el.resultRating.textContent = "—";
    el.resultSub.textContent = "Enter your score";
    return;
  }

  const rating = calcRating(course.ssa, course.ppt, score);
  el.resultRating.textContent = rating;
  const diff = score - course.ssa;
  const diffText =
    diff === 0 ? "exactly the SSA" : Math.abs(diff) + (diff > 0 ? " over" : " under") + " SSA";
  el.resultSub.textContent = course.name + " · SSA " + course.ssa + " · " + diffText;

  renderNearby(course, score);
}

function renderNearby(course, score) {
  const rows = [];
  for (let d = -3; d <= 3; d++) {
    const s = score + d;
    if (s < 1) continue;
    rows.push({ score: s, rating: calcRating(course.ssa, course.ppt, s), current: d === 0 });
  }
  el.nearbyBody.innerHTML = "";
  for (const r of rows) {
    const tr = document.createElement("tr");
    if (r.current) tr.className = "is-current";
    tr.innerHTML = "<td>" + r.score + "</td><td>" + r.rating + "</td>";
    el.nearbyBody.appendChild(tr);
  }
  el.nearbyTable.hidden = rows.length === 0;
}

function renderReverse() {
  const course = selectedCourse();
  const target = parseFloat(el.targetInput.value);
  if (!course || !isUsable(course) || !Number.isFinite(target)) {
    el.reverseResult.textContent = "—";
    return;
  }
  const exact = calcScoreForRating(course.ssa, course.ppt, target);
  const rounded = Math.round(exact);
  el.reverseResult.textContent =
    "Shoot " + rounded + " for a " + target + " rating";
}

/* ---------- Rendering: courses management ---------- */

function renderCoursesList() {
  el.coursesList.innerHTML = "";
  for (const c of courses) {
    el.coursesList.appendChild(buildCourseRow(c));
  }
}

function buildCourseRow(course) {
  const row = document.createElement("div");
  row.className = "course-row";

  // Name
  const nameField = document.createElement("label");
  nameField.className = "field name-field";
  nameField.innerHTML = '<span class="mini-label">Course name</span>';
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.value = course.name;
  nameInput.addEventListener("input", () => {
    course.name = nameInput.value;
    saveCourses();
    renderCourseSelect();
  });
  nameField.appendChild(nameInput);

  // Numbers (SSA + PPT)
  const nums = document.createElement("div");
  nums.className = "nums";

  const ssaWrap = document.createElement("label");
  ssaWrap.innerHTML = '<span class="mini-label">SSA</span>';
  const ssaInput = document.createElement("input");
  ssaInput.type = "number";
  ssaInput.inputMode = "decimal";
  ssaInput.step = "0.1";
  ssaInput.placeholder = "set me";
  ssaInput.value = course.ssa ?? "";
  ssaInput.addEventListener("input", () => {
    const v = parseFloat(ssaInput.value);
    course.ssa = Number.isFinite(v) ? v : null;
    saveCourses();
    renderCourseSelect();
    renderResult();
    renderReverse();
  });
  ssaWrap.appendChild(ssaInput);

  const pptWrap = document.createElement("label");
  pptWrap.innerHTML = '<span class="mini-label">Points / throw</span>';
  const pptInput = document.createElement("input");
  pptInput.type = "number";
  pptInput.inputMode = "decimal";
  pptInput.step = "0.1";
  pptInput.value = course.ppt;
  pptInput.addEventListener("input", () => {
    const v = parseFloat(pptInput.value);
    course.ppt = Number.isFinite(v) && v > 0 ? v : DEFAULT_PPT;
    saveCourses();
    renderResult();
    renderReverse();
  });
  pptWrap.appendChild(pptInput);

  nums.appendChild(ssaWrap);
  nums.appendChild(pptWrap);

  // Remove
  const remove = document.createElement("button");
  remove.className = "remove";
  remove.type = "button";
  remove.textContent = "×";
  remove.title = "Remove course";
  remove.addEventListener("click", () => {
    courses = courses.filter((c) => c.id !== course.id);
    saveCourses();
    renderAll();
  });

  row.appendChild(nameField);
  row.appendChild(nums);
  row.appendChild(remove);
  return row;
}

/* ---------- Wiring ---------- */

function renderAll() {
  renderCourseSelect();
  renderCoursesList();
  renderResult();
  renderReverse();
}

el.courseSelect.addEventListener("change", () => {
  renderResult();
  renderReverse();
});
el.scoreInput.addEventListener("input", renderResult);
el.targetInput.addEventListener("input", renderReverse);
el.addCourse.addEventListener("click", () => {
  courses.push({ id: newId(), name: "New course", ssa: null, ppt: DEFAULT_PPT });
  saveCourses();
  renderAll();
});

renderAll();

/* ---------- Service worker (offline) ---------- */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      /* offline support unavailable; app still runs online */
    });
  });
}
