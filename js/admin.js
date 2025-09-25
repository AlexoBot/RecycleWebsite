// js/admin.js - Funcionalidad de administración para RecycleWebsite

// --- Utilidades de almacenamiento ---
function getWasteTypes() {
  return JSON.parse(localStorage.getItem('rw_waste_types') || '[]');
}
function setWasteTypes(arr) {
  localStorage.setItem('rw_waste_types', JSON.stringify(arr));
}
function getComments() {
  return JSON.parse(localStorage.getItem('rw_comments') || '[]');
}
function setComments(arr) {
  localStorage.setItem('rw_comments', JSON.stringify(arr));
}

// --- CRUD Tipos de Residuos ---
function loadWasteTypes() {
  const list = document.getElementById('wasteTypesList');
  const types = getWasteTypes();
  list.innerHTML = types.length === 0 ? '<p>No hay tipos registrados.</p>' : types.map(t => `
    <div class="waste-type-card">
      <strong>${t.nombre}</strong> <span class="waste-status ${t.activo ? 'active' : 'inactive'}">${t.activo ? 'Activo' : 'Inactivo'}</span><br>
      <small>${t.descripcion}</small><br>
      <img src="${t.imagen || ''}" alt="img" style="max-width:80px;max-height:50px;vertical-align:middle;">
      <div class="waste-actions">
        <button onclick="rwAdmin.toggleWasteTypeStatus(${t.id})">${t.activo ? 'Desactivar' : 'Activar'}</button>
        <button onclick="rwAdmin.editWasteTypePrompt(${t.id})">Editar</button>
        <button onclick="rwAdmin.deleteWasteType(${t.id})">Eliminar</button>
      </div>
      <div class="waste-instr"><em>${t.instrucciones || ''}</em></div>
    </div>
  `).join('');
}

function addWasteType(data) {
  const arr = getWasteTypes();
  const id = arr.length ? Math.max(...arr.map(t => t.id)) + 1 : 1;
  arr.push({
    id,
    nombre: data.nombre,
    descripcion: data.descripcion,
    imagen: data.imagen,
    instrucciones: data.instrucciones,
    activo: true,
    fechaCreacion: new Date().toISOString().slice(0,10)
  });
  setWasteTypes(arr);
  loadWasteTypes();
}

function editWasteType(id, data) {
  const arr = getWasteTypes();
  const idx = arr.findIndex(t => t.id === id);
  if (idx !== -1) {
    arr[idx] = { ...arr[idx], ...data };
    setWasteTypes(arr);
    loadWasteTypes();
  }
}

function deleteWasteType(id) {
  if (!confirm('¿Eliminar este tipo de residuo?')) return;
  setWasteTypes(getWasteTypes().filter(t => t.id !== id));
  loadWasteTypes();
}

function toggleWasteTypeStatus(id) {
  const arr = getWasteTypes();
  const idx = arr.findIndex(t => t.id === id);
  if (idx !== -1) {
    arr[idx].activo = !arr[idx].activo;
    setWasteTypes(arr);
    loadWasteTypes();
  }
}

function editWasteTypePrompt(id) {
  const arr = getWasteTypes();
  const t = arr.find(t => t.id === id);
  if (!t) return;
  const nombre = prompt('Nombre:', t.nombre);
  if (nombre === null) return;
  const descripcion = prompt('Descripción:', t.descripcion);
  if (descripcion === null) return;
  const imagen = prompt('URL Imagen:', t.imagen);
  if (imagen === null) return;
  const instrucciones = prompt('Instrucciones:', t.instrucciones);
  if (instrucciones === null) return;
  editWasteType(id, { nombre, descripcion, imagen, instrucciones });
}

// --- CRUD Comentarios ---
function loadComments() {
  const list = document.getElementById('commentsList');
  const arr = getComments();
  list.innerHTML = arr.length === 0 ? '<p>No hay comentarios.</p>' : arr.map(c => `
    <div class="comment-card ${c.estado}">
      <strong>${c.nombre}</strong> <span class="comment-status">[${c.estado}]</span><br>
      <small>${c.fecha}</small><br>
      <div>${c.mensaje}</div>
      <div class="comment-actions">
        <button onclick="rwAdmin.markAsRead(${c.id})">Marcar leído</button>
        <button onclick="rwAdmin.markAsResponded(${c.id})">Marcar respondido</button>
        <button onclick="rwAdmin.deleteComment(${c.id})">Eliminar</button>
      </div>
    </div>
  `).join('');
}

function markAsRead(id) {
  const arr = getComments();
  const idx = arr.findIndex(c => c.id === id);
  if (idx !== -1) {
    arr[idx].estado = 'leído';
    setComments(arr);
    loadComments();
  }
}

function markAsResponded(id) {
  const arr = getComments();
  const idx = arr.findIndex(c => c.id === id);
  if (idx !== -1) {
    arr[idx].estado = 'respondido';
    setComments(arr);
    loadComments();
  }
}

function deleteComment(id) {
  if (!confirm('¿Eliminar este comentario?')) return;
  setComments(getComments().filter(c => c.id !== id));
  loadComments();
}

// --- Inicialización ---
window.rwAdmin = {
  loadWasteTypes,
  addWasteType,
  editWasteType,
  deleteWasteType,
  toggleWasteTypeStatus,
  editWasteTypePrompt,
  loadComments,
  markAsRead,
  markAsResponded,
  deleteComment
};

document.addEventListener('DOMContentLoaded', function() {
  // Tipos de residuos
  rwAdmin.loadWasteTypes();
  document.getElementById('addWasteTypeForm').onsubmit = function(e) {
    e.preventDefault();
    const nombre = document.getElementById('wasteName').value.trim();
    const descripcion = document.getElementById('wasteDesc').value.trim();
    const imagen = document.getElementById('wasteImg').value.trim();
    const instrucciones = document.getElementById('wasteInstr').value.trim();
    if (!nombre || !descripcion) return alert('Nombre y descripción son obligatorios.');
    rwAdmin.addWasteType({ nombre, descripcion, imagen, instrucciones });
    this.reset();
  };
  // Comentarios
  rwAdmin.loadComments();
});
