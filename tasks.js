// tasks.js
import { db } from './firebase.js';
import {
    collection, addDoc, query, where, onSnapshot,
    updateDoc, deleteDoc, doc, orderBy, writeBatch
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { auth } from './firebase.js';

const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');

let tasks = [];
let sortable = null;
let pendingDeleteId = null;
let deleteTimeout = null;
const pendingTasks = document.getElementById('pending-tasks');
const completedTasks = document.getElementById('completed-tasks');
const historyList = document.getElementById('history-tasks');
let activeTab = 'pending';
const tasksContainer = document.getElementById('tasks-container');

if (!pendingTasks || !completedTasks || !historyList) {
    console.error('No se encontraron algunos elementos del DOM');
}


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

const handleDeleteClick = async (button, taskId) => {
    if (pendingDeleteId === taskId) {
        // Second click - confirm deletion
        clearTimeout(deleteTimeout);
        pendingDeleteId = null;
        button.classList.remove('confirm-delete');
        const task = tasks.find(t => t.id === taskId);
        await logHistory('Task deleted', task.text);
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
    const pending = tasks.filter(task => !task.completed);
    const completed = tasks.filter(task => task.completed);

    pendingTasks.innerHTML = pending.length
        ? pending.map(task => taskTemplate(task)).join('')
        : '<div class="empty-state">No pending tasks 🎉</div>';

    completedTasks.innerHTML = completed.length
        ? completed.map(task => taskTemplate(task)).join('')
        : '<div class="empty-state">No completed tasks yet</div>';

    initSortable();
};

const taskTemplate = (task) => `
    <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
        <input type="checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
        <div class="task-content" contenteditable="true" data-id="${task.id}">${task.text}</div>
        <div class="task-actions">
            <button class="delete-btn" data-id="${task.id}">🗑️</button>
        </div>
    </div>
`;

document.getElementById('tabs').addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-button')) {
        document.querySelectorAll('.tab-button, .tab-content').forEach(el => {
            el.classList.remove('active');
        });

        activeTab = e.target.dataset.tab;
        e.target.classList.add('active');

        const contentId = `${activeTab}-tasks`;
        const contentElement = document.getElementById(contentId);
        if (contentElement) {
            contentElement.classList.add('active');
        }

        initSortable();
    }
});

const logHistory = async (action, taskText) => {
    try {
        await addDoc(collection(db, 'history'), {
            action,
            taskText,
            userId: auth.currentUser.uid,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Error logging history:', error);
    }
};
const loadHistory = () => {
    try {
        const q = query(collection(db, 'history'),
            where('userId', '==', auth.currentUser.uid),
            orderBy('timestamp', 'desc')
        );
        return onSnapshot(q, (snapshot) => {
            historyList.innerHTML = snapshot.docs.map(doc => {
                const data = doc.data();
                return `
                    <div class="history-item">
                        [${data.timestamp.toDate().toLocaleString()}] 
                        ${data.action}: "${data.taskText}"
                    </div>
                `;
            }).join('');
        });
    } catch (error) {
        console.error('Error loading history:', error);
        historyList.innerHTML = '<div class="error">Error loading history</div>';
    }
};

function initSortable() {
    if (sortable) sortable.destroy();
    sortable = null;

    if (activeTab === 'pending' && pendingTasks) {
        sortable = Sortable.create(pendingTasks, {
            animation: 150,
            handle: '.task-item',
            onEnd: async (evt) => {
                const batch = writeBatch(db);
                Array.from(pendingTasks.children).forEach((item, index) => {
                    const taskId = item.dataset.id;
                    const task = tasks.find(t => t.id === taskId);
                    if (task && task.order !== index) {
                        batch.update(doc(db, 'tasks', taskId), { order: index });
                    }
                });
                await batch.commit();
            }
        });
    }
}

// Add new task
taskForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (!taskInput.value.trim()) return;

    const taskText = taskInput.value.trim(); // Store before clearing
    const newOrder = tasks.length ? tasks[tasks.length - 1].order + 1 : 0;

    try {
        await addDoc(collection(db, 'tasks'), {
            text: taskText,
            completed: false,
            userId: auth.currentUser.uid,
            timestamp: new Date(),
            order: newOrder
        });
        taskInput.value = '';
        await logHistory('Task created', taskText);
    } catch (error) {
        alert(error.message);
    }
});

let editTimeout;
tasksContainer.addEventListener('input', (e) => {
    clearTimeout(editTimeout);
    editTimeout = setTimeout(async () => {
        const taskId = e.target.dataset.id;
        if (e.target.matches('.task-content')) {
            const newText = e.target.textContent;
            const task = tasks.find(t => t.id === taskId);

            if (task && task.text !== newText) { // Añadir chequeo de task existente
                await updateDoc(doc(db, 'tasks', taskId), {
                    text: newText
                });
                await logHistory('Task edited', newText);
            }
        }
    }, 30000);
});

tasksContainer.addEventListener('change', async e => {
    if (e.target.matches('input[type="checkbox"]')) {
        const taskId = e.target.dataset.id;
        const task = tasks.find(t => t.id === taskId);

        if (task) { // Añadir chequeo de existencia
            const action = e.target.checked ? 'Task completed' : 'Task marked incomplete';
            await logHistory(action, task.text);
            await updateDoc(doc(db, 'tasks', taskId), {
                completed: e.target.checked
            });
        }
    }
});

tasksContainer.addEventListener('keydown', async e => {
    if (e.key === 'Enter' && e.target.matches('.task-content')) {
        e.preventDefault();
        e.target.blur();
    }
});

tasksContainer.addEventListener('blur', async e => {
    if (e.target.matches('.task-content')) {
        clearTimeout(editTimeout);
        const taskId = e.target.dataset.id;
        const newText = e.target.textContent;
        const task = tasks.find(t => t.id === taskId);

        if (task && task.text !== newText) { // Añadir chequeo de task existente
            await updateDoc(doc(db, 'tasks', taskId), {
                text: newText
            });
            await logHistory('Task edited', newText);
        }
    }
}, true);

tasksContainer.addEventListener('click', async (e) => {
    const taskId = e.target.dataset.id;
    if (!taskId) return;

    if (e.target.classList.contains('delete-btn')) {
        handleDeleteClick(e.target, taskId);
    }
});

auth.onAuthStateChanged(user => {
    if (user) {
        loadTasks();
        loadHistory();
        document.querySelector(`[data-tab="${activeTab}"]`).click();
    } else {
        pendingTasks.innerHTML = '';
        completedTasks.innerHTML = '';
        historyList.innerHTML = '';
    }
});