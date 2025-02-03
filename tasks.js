// tasks.js
import { db } from './firebase.js';
import { collection, addDoc, query, where, onSnapshot, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { auth } from './firebase.js';

const tasksList = document.getElementById('tasks-list');
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');

let tasks = [];

const loadTasks = () => {
    const q = query(collection(db, 'tasks'), where('userId', '==', auth.currentUser.uid));
    return onSnapshot(q, (snapshot) => {
        tasks = [];
        snapshot.forEach(doc => {
            tasks.push({ id: doc.id, ...doc.data() });
        });
        renderTasks();
    });
};

const renderTasks = () => {
    tasksList.innerHTML = tasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}">
            <input type="checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
            <div class="task-content" contenteditable="true" data-id="${task.id}">${task.text}</div>
            <div class="task-actions">
                <button class="delete-btn" data-id="${task.id}">🗑️</button>
            </div>
        </div>
    `).join('');
};

// Add new task with correct field names
taskForm.addEventListener('submit', async e => {
    e.preventDefault();
    try {
        await addDoc(collection(db, 'tasks'), {
            text: taskInput.value,
            completed: false,
            userId: auth.currentUser.uid,
            timestamp: new Date()
        });
        taskInput.value = '';
    } catch (error) {
        alert(error.message);
    }
});

// Improved edit handling with debouncing
let editTimeout;
tasksList.addEventListener('input', (e) => {
    clearTimeout(editTimeout);
    editTimeout = setTimeout(async () => {
        const taskId = e.target.dataset.id;
        if (e.target.matches('.task-content')) {
            await updateDoc(doc(db, 'tasks', taskId), {
                text: e.target.textContent
            });
        }
    }, 30000); // 500ms delay after typing stops
});

// Immediate checkbox update
tasksList.addEventListener('change', async e => {
    if (e.target.matches('input[type="checkbox"]')) {
        await updateDoc(doc(db, 'tasks', e.target.dataset.id), {
            completed: e.target.checked
        });
    }
});

// Save on Enter key or blur
tasksList.addEventListener('keydown', async e => {
    if (e.key === 'Enter' && e.target.matches('.task-content')) {
        e.preventDefault();
        e.target.blur();
    }
});

tasksList.addEventListener('blur', async e => {
    if (e.target.matches('.task-content')) {
        await updateDoc(doc(db, 'tasks', e.target.dataset.id), {
            text: e.target.textContent
        });
    }
}, true); // Use capture phase

// Delete task (no changes needed here)
tasksList.addEventListener('click', async e => {
    if (e.target.classList.contains('delete-btn')) {
        await deleteDoc(doc(db, 'tasks', e.target.dataset.id));
    }
});

auth.onAuthStateChanged(user => {
    if (user) loadTasks();
});