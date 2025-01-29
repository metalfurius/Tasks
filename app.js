// Verificar si el usuario está autenticado
if (!auth.currentUser) {
    window.location.reload(); // Recargar si no está autenticado
}

let tasks = [];

// Cargar tareas al iniciar
document.addEventListener('DOMContentLoaded', () => {
    // Crear la estructura de la aplicación
    const appHTML = `
        <div class="container">
            <h1>Mis Tareas ✅</h1>
            <div class="new-task">
                <input type="text" id="taskInput" placeholder="Nueva tarea">
                <select id="category">
                    <option value="Personal">Personal</option>
                    <option value="Trabajo">Trabajo</option>
                    <option value="Estudio">Estudio</option>
                </select>
                <button onclick="addTask()">Agregar</button>
            </div>
            <div id="tasks"></div>
        </div>
    `;
    document.body.innerHTML = appHTML;

    // Cargar las tareas
    loadTasks();
});

// Cargar tareas desde Firestore
async function loadTasks() {
    const querySnapshot = await getDocs(collection(db, 'tasks'));
    tasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderTasks();
}

// Renderizar tareas
function renderTasks() {
    const container = document.getElementById('tasks');
    container.innerHTML = tasks.map(task => `
        <div class="task ${task.completed ? 'completed' : ''}">
            <input type="checkbox" 
                   ${task.completed ? 'checked' : ''} 
                   onchange="toggleTask('${task.id}')">
            <span>${task.text}</span>
            <small>${task.category}</small>
            <button onclick="deleteTask('${task.id}')">🗑️</button>
        </div>
    `).join('');
}

// Añadir nueva tarea
async function addTask() {
    const input = document.getElementById('taskInput');
    const category = document.getElementById('category').value;
    
    if(input.value.trim()) {
        await addDoc(collection(db, 'tasks'), {
            text: input.value,
            category: category,
            completed: false,
            createdAt: serverTimestamp()
        });
        input.value = '';
        loadTasks();
    }
}

// Marcar como completada
async function toggleTask(id) {
    const taskRef = doc(db, 'tasks', id);
    const task = tasks.find(t => t.id === id);
    await updateDoc(taskRef, {
        completed: !task.completed
    });
    loadTasks();
}

// Eliminar tarea
async function deleteTask(id) {
    await deleteDoc(doc(db, 'tasks', id));
    loadTasks();
}