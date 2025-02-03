// tasks.js
import { db } from './firebase.js';
import {
    collection, addDoc, query, where, onSnapshot,
    updateDoc, deleteDoc, doc, orderBy, writeBatch
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { auth } from './firebase.js';

const tasksList = document.getElementById('tasks-list');
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');

let tasks = [];
let sortable = null;

const loadTasks = () => {
    const q = query(collection(db, 'tasks'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('order', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
        tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderTasks();
    });
};

let pendingDeleteId = null;
let deleteTimeout = null;

const handleDeleteClick = async (button, taskId) => {
    if (pendingDeleteId === taskId) {
        // Second click - confirm deletion
        clearTimeout(deleteTimeout);
        pendingDeleteId = null;
        button.classList.remove('confirm-delete');
        await deleteDoc(doc(db, 'tasks', taskId));
    } else {
        // First click - show confirmation
        pendingDeleteId = taskId;
        button.classList.add('confirm-delete');
        deleteTimeout = setTimeout(() => {
            button.classList.remove('confirm-delete');
            pendingDeleteId = null;
        }, 2000);
    }
};

const renderTasks = () => {
    tasksList.innerHTML = tasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
            <input type="checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
            <div class="task-content" contenteditable="true">${task.text}</div>
            <div class="task-actions">
                <button class="delete-btn" data-id="${task.id}">🗑️</button>
            </div>
        </div>
    `).join('');

    initSortable();
};

function initSortable() {
    if (sortable) sortable.destroy();

    sortable = Sortable.create(tasksList, {
        animation: 150,
        handle: '.task-item',
        onEnd: async (evt) => {
            const batch = writeBatch(db);
            Array.from(tasksList.children).forEach((item, index) => {
                const taskId = item.dataset.id;
                const task = tasks.find(t => t.id === taskId);
                if (task.order !== index) {
                    batch.update(doc(db, 'tasks', taskId), { order: index });
                }
            });
            await batch.commit();
        }
    });
}

// Add new task
taskForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (!taskInput.value.trim()) return;

    const newOrder = tasks.length ? tasks[tasks.length - 1].order + 1 : 0;
    try {
        await addDoc(collection(db, 'tasks'), {
            text: taskInput.value.trim(),
            completed: false,
            userId: auth.currentUser.uid,
            timestamp: new Date(),
            order: newOrder
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
    }, 30000); // 30000ms delay after typing stops
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

tasksList.addEventListener('click', async (e) => {
    const taskId = e.target.dataset.id;
    if (!taskId) return;

    if (e.target.classList.contains('delete-btn')) {
        handleDeleteClick(e.target, taskId);
    }
});

auth.onAuthStateChanged(user => {
    if (user) loadTasks();
});