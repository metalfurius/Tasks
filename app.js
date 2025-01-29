
let tasks = [];

loadTasks();

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