const STORAGE_KEY = 'school-management-app';

const defaultData = {
  schoolYears: [
    { id: crypto.randomUUID(), name: '2026 - Primaria' },
    { id: crypto.randomUUID(), name: '2026 - Secundaria' },
  ],
  subjects: [
    { id: crypto.randomUUID(), name: 'Matemáticas' },
    { id: crypto.randomUUID(), name: 'Historia' },
    { id: crypto.randomUUID(), name: 'Lengua' },
  ],
  classes: [],
  students: [],
};

const state = loadState();

seedInitialClassesAndStudents();
cacheDom();
bindEvents();
render();

function cacheDom() {
  window.dom = {
    schoolYearForm: document.querySelector('#schoolYearForm'),
    subjectForm: document.querySelector('#subjectForm'),
    classForm: document.querySelector('#classForm'),
    studentForm: document.querySelector('#studentForm'),
    schoolYearName: document.querySelector('#schoolYearName'),
    subjectName: document.querySelector('#subjectName'),
    className: document.querySelector('#className'),
    classSchoolYear: document.querySelector('#classSchoolYear'),
    classSubjects: document.querySelector('#classSubjects'),
    studentName: document.querySelector('#studentName'),
    studentSchoolYear: document.querySelector('#studentSchoolYear'),
    studentClass: document.querySelector('#studentClass'),
    studentsTableBody: document.querySelector('#studentsTableBody'),
    schoolYearsList: document.querySelector('#schoolYearsList'),
    subjectsList: document.querySelector('#subjectsList'),
    classesList: document.querySelector('#classesList'),
    notification: document.querySelector('#notification'),
    schoolYearCount: document.querySelector('#schoolYearCount'),
    subjectCount: document.querySelector('#subjectCount'),
    classCount: document.querySelector('#classCount'),
    studentCount: document.querySelector('#studentCount'),
    resetDataButton: document.querySelector('#resetDataButton'),
  };
}

function bindEvents() {
  dom.schoolYearForm.addEventListener('submit', handleSchoolYearSubmit);
  dom.subjectForm.addEventListener('submit', handleSubjectSubmit);
  dom.classForm.addEventListener('submit', handleClassSubmit);
  dom.studentForm.addEventListener('submit', handleStudentSubmit);
  dom.studentSchoolYear.addEventListener('change', syncStudentClassOptions);
  dom.resetDataButton.addEventListener('click', resetDemoData);
}

function handleSchoolYearSubmit(event) {
  event.preventDefault();
  const name = dom.schoolYearName.value.trim();

  if (!name) {
    showNotification('Debes escribir un nombre para el año escolar.', true);
    return;
  }

  if (state.schoolYears.some((year) => normalizeText(year.name) === normalizeText(name))) {
    showNotification('Ese año escolar ya existe.', true);
    return;
  }

  state.schoolYears.push({ id: crypto.randomUUID(), name });
  persistState();
  dom.schoolYearForm.reset();
  render();
  showNotification('Año escolar guardado correctamente.');
}

function handleSubjectSubmit(event) {
  event.preventDefault();
  const name = dom.subjectName.value.trim();

  if (!name) {
    showNotification('Debes escribir una materia.', true);
    return;
  }

  if (state.subjects.some((subject) => normalizeText(subject.name) === normalizeText(name))) {
    showNotification('La materia ya existe.', true);
    return;
  }

  state.subjects.push({ id: crypto.randomUUID(), name });
  persistState();
  dom.subjectForm.reset();
  render();
  showNotification('Materia guardada correctamente.');
}

function handleClassSubmit(event) {
  event.preventDefault();

  const name = dom.className.value.trim();
  const schoolYearId = dom.classSchoolYear.value;
  const subjectIds = getSelectedValues(dom.classSubjects);

  if (!name || !schoolYearId || subjectIds.length === 0) {
    showNotification('Completa el nombre, año escolar y al menos una materia para la clase.', true);
    return;
  }

  if (state.classes.some((schoolClass) => normalizeText(schoolClass.name) === normalizeText(name))) {
    showNotification('La clase ya existe.', true);
    return;
  }

  state.classes.push({
    id: crypto.randomUUID(),
    name,
    schoolYearId,
    subjectIds,
  });

  persistState();
  dom.classForm.reset();
  render();
  showNotification('Clase guardada correctamente.');
}

function handleStudentSubmit(event) {
  event.preventDefault();

  const name = dom.studentName.value.trim();
  const schoolYearId = dom.studentSchoolYear.value;
  const classId = dom.studentClass.value;

  if (!name || !schoolYearId || !classId) {
    showNotification('Completa los datos del alumno.', true);
    return;
  }

  const selectedClass = state.classes.find((schoolClass) => schoolClass.id === classId);

  if (!selectedClass) {
    showNotification('La clase seleccionada no existe.', true);
    return;
  }

  if (selectedClass.schoolYearId !== schoolYearId) {
    showNotification('La clase seleccionada no pertenece al año escolar elegido.', true);
    return;
  }

  state.students.push({
    id: crypto.randomUUID(),
    name,
    schoolYearId,
    classId,
  });

  persistState();
  dom.studentForm.reset();
  render();
  showNotification('Alumno guardado correctamente.');
}

function render() {
  renderSelects();
  renderSummary();
  renderStudentsTable();
  renderCatalogs();
}

function renderSelects() {
  fillSelect(dom.classSchoolYear, state.schoolYears, 'Selecciona un año escolar');
  fillSelect(dom.studentSchoolYear, state.schoolYears, 'Selecciona un año escolar');
  fillSelect(dom.classSubjects, state.subjects, '', true);
  syncStudentClassOptions();
}

function syncStudentClassOptions() {
  const selectedSchoolYearId = dom.studentSchoolYear.value || state.schoolYears[0]?.id || '';

  if (selectedSchoolYearId && dom.studentSchoolYear.value !== selectedSchoolYearId) {
    dom.studentSchoolYear.value = selectedSchoolYearId;
  }

  const availableClasses = state.classes.filter(
    (schoolClass) => schoolClass.schoolYearId === selectedSchoolYearId,
  );

  fillSelect(dom.studentClass, availableClasses, 'Selecciona una clase');
}

function renderSummary() {
  dom.schoolYearCount.textContent = state.schoolYears.length;
  dom.subjectCount.textContent = state.subjects.length;
  dom.classCount.textContent = state.classes.length;
  dom.studentCount.textContent = state.students.length;
}

function renderStudentsTable() {
  if (state.students.length === 0) {
    dom.studentsTableBody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">
          Todavía no hay alumnos registrados.
        </td>
      </tr>`;
    return;
  }

  dom.studentsTableBody.innerHTML = state.students
    .map((student) => {
      const schoolYear = state.schoolYears.find((year) => year.id === student.schoolYearId);
      const schoolClass = state.classes.find((currentClass) => currentClass.id === student.classId);
      const subjectNames = (schoolClass?.subjectIds || [])
        .map((subjectId) => state.subjects.find((subject) => subject.id === subjectId)?.name)
        .filter(Boolean)
        .join(', ');

      return `
        <tr>
          <td>${escapeHtml(student.name)}</td>
          <td>${escapeHtml(schoolYear?.name || 'Sin año escolar')}</td>
          <td>${escapeHtml(schoolClass?.name || 'Sin clase')}</td>
          <td>${escapeHtml(subjectNames || 'Sin materias')}</td>
        </tr>`;
    })
    .join('');
}

function renderCatalogs() {
  renderList(dom.schoolYearsList, state.schoolYears, (year) => `
    <strong>${escapeHtml(year.name)}</strong>
  `);

  renderList(dom.subjectsList, state.subjects, (subject) => `
    <strong>${escapeHtml(subject.name)}</strong>
  `);

  renderList(dom.classesList, state.classes, (schoolClass) => {
    const schoolYear = state.schoolYears.find((year) => year.id === schoolClass.schoolYearId);
    const subjects = schoolClass.subjectIds
      .map((subjectId) => state.subjects.find((subject) => subject.id === subjectId)?.name)
      .filter(Boolean)
      .join(', ');

    return `
      <strong>${escapeHtml(schoolClass.name)}</strong>
      <small>Año escolar: ${escapeHtml(schoolYear?.name || 'No asignado')}</small>
      <small>Materias: ${escapeHtml(subjects || 'Sin materias')}</small>
    `;
  });
}

function renderList(container, items, renderer) {
  if (items.length === 0) {
    container.innerHTML = '<li class="empty-state">No hay registros todavía.</li>';
    return;
  }

  container.innerHTML = items
    .map((item) => `<li>${renderer(item)}</li>`)
    .join('');
}

function fillSelect(select, items, placeholder = 'Selecciona una opción', multiple = false) {
  if (!multiple) {
    const options = placeholder
      ? [`<option value="">${escapeHtml(placeholder)}</option>`]
      : [];

    select.innerHTML = options
      .concat(items.map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`))
      .join('');

    if (items.length === 1) {
      select.value = items[0].id;
    }

    return;
  }

  select.innerHTML = items
    .map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`)
    .join('');
}

function showNotification(message, isError = false) {
  dom.notification.textContent = message;
  dom.notification.className = `notification ${isError ? 'error' : 'success'}`;
}

function getSelectedValues(select) {
  return Array.from(select.selectedOptions).map((option) => option.value);
}

function normalizeText(value) {
  return value.trim().toLowerCase();
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const clone = structuredClone(defaultData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clone));
      return clone;
    }

    const parsed = JSON.parse(raw);
    return {
      schoolYears: Array.isArray(parsed.schoolYears) ? parsed.schoolYears : structuredClone(defaultData.schoolYears),
      subjects: Array.isArray(parsed.subjects) ? parsed.subjects : structuredClone(defaultData.subjects),
      classes: Array.isArray(parsed.classes) ? parsed.classes : [],
      students: Array.isArray(parsed.students) ? parsed.students : [],
    };
  } catch (error) {
    console.error('No se pudo cargar la información guardada.', error);
    const clone = structuredClone(defaultData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clone));
    return clone;
  }
}

function resetDemoData() {
  localStorage.removeItem(STORAGE_KEY);
  const resetState = loadState();
  state.schoolYears = resetState.schoolYears;
  state.subjects = resetState.subjects;
  state.classes = resetState.classes;
  state.students = resetState.students;
  seedInitialClassesAndStudents();
  persistState();
  render();
  showNotification('Se restauraron los datos demo.');
}

function seedInitialClassesAndStudents() {
  if (state.classes.length > 0 || state.schoolYears.length === 0 || state.subjects.length === 0) {
    return;
  }

  const primaryYear = state.schoolYears[0];
  const secondaryYear = state.schoolYears[1] || state.schoolYears[0];
  const math = state.subjects.find((subject) => subject.name === 'Matemáticas') || state.subjects[0];
  const history = state.subjects.find((subject) => subject.name === 'Historia') || state.subjects[0];
  const language = state.subjects.find((subject) => subject.name === 'Lengua') || state.subjects[0];

  const seededClasses = [
    {
      id: crypto.randomUUID(),
      name: '5°A - Mañana',
      schoolYearId: primaryYear.id,
      subjectIds: [math.id, language.id],
    },
    {
      id: crypto.randomUUID(),
      name: '2°B - Tarde',
      schoolYearId: secondaryYear.id,
      subjectIds: [history.id, language.id],
    },
  ];

  state.classes.push(...seededClasses);
  state.students.push(
    {
      id: crypto.randomUUID(),
      name: 'Ana Martínez',
      schoolYearId: primaryYear.id,
      classId: seededClasses[0].id,
    },
    {
      id: crypto.randomUUID(),
      name: 'Luis Gómez',
      schoolYearId: secondaryYear.id,
      classId: seededClasses[1].id,
    },
  );

  persistState();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
