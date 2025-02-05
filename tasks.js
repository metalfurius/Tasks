// tasks.js
import { db } from './firebase.js';
import {
    collection, addDoc, query, where, onSnapshot,
    updateDoc, deleteDoc, doc, orderBy, writeBatch
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { auth } from './firebase.js';

// DOM Elements
const dom = {
    taskForm: document.getElementById('task-form'),
    dueDateInput: document.getElementById('due-date-input'),
    taskInput: document.getElementById('task-input'),
    pendingTasks: document.getElementById('pending-tasks'),
    completedTasks: document.getElementById('completed-tasks'),
    historyList: document.getElementById('history-tasks'),
    tasksContainer: document.getElementById('tasks-container'),
    tabs: document.getElementById('tabs')
};

// State
const state = {
    tasks: [],
    sortable: null,
    pendingDeleteId: null,
    deleteTimeout: null,
    activeTab: 'pending',
    editTimeout: null
};

// Firebase Operations
const firebaseOps = {
    loadTasks: () => {
        try {
            const q = query(collection(db, 'tasks'),
                where('userId', '==', auth.currentUser.uid),
                orderBy('order', 'asc')
            );
            return onSnapshot(q, (snapshot) => {
                state.tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                console.log('Tasks loaded:', state.tasks); // Debug log
                render.renderTasks();
            }, (error) => {
                console.error('Tasks query error:', error); // Add error handler
                dom.pendingTasks.innerHTML = '<div class="error">Error loading tasks</div>';
            });
        } catch (error) {
            console.error('Error initializing tasks:', error);
        }
    },

    logHistory: async (action, taskText) => {
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
    },

    loadHistory: () => {
        const q = query(collection(db, 'history'),
            where('userId', '==', auth.currentUser.uid),
            orderBy('timestamp', 'desc')
        );
        return onSnapshot(q, (snapshot) => {
            dom.historyList.innerHTML = snapshot.docs.map(doc => {
                const data = doc.data();
                return `
                    <div class="history-item">
                        [${data.timestamp.toDate().toLocaleString()}] 
                        ${data.action}: "${data.taskText}"
                    </div>
                `;
            }).join('');
        });
    }

};

// Task Rendering
const render = {
    taskTemplate: (task) => `
        <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
            <input type="checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
            <div class="task-content" contenteditable="true" data-id="${task.id}">${task.text}</div>
            ${task.dueDate ? `<div class="due-date">Due: ${task.dueDate.toDate().toLocaleDateString()}</div>` : ''}
            <div class="task-actions">
                <button class="delete-btn" data-id="${task.id}">🗑️</button>
            </div>
        </div>
    `,

    renderTasks: () => {
        try {
            const pending = state.tasks.filter(task => !task.completed);
            const completed = state.tasks.filter(task => task.completed);
            console.log('Rendering pending:', pending); // Debug log
            console.log('Rendering completed:', completed); // Debug log

            dom.pendingTasks.innerHTML = pending.length
                ? pending.map(render.taskTemplate).join('')
                : '<div class="empty-state">No pending tasks 🎉</div>';

            dom.completedTasks.innerHTML = completed.length
                ? completed.map(render.taskTemplate).join('')
                : '<div class="empty-state">No completed tasks yet</div>';

            sortable.init();
        } catch (error) {
            console.error('Error rendering tasks:', error);
        }
    }
};

// Sortable Functionality
const sortable = {
    init: () => {
        if (state.sortable) state.sortable.destroy();
        state.sortable = null;

        if (state.activeTab === 'pending' && dom.pendingTasks) {
            state.sortable = Sortable.create(dom.pendingTasks, {
                animation: 150,
                handle: '.task-item',
                onEnd: async (evt) => {
                    const batch = writeBatch(db);
                    Array.from(dom.pendingTasks.children).forEach((item, index) => {
                        const taskId = item.dataset.id;
                        const task = state.tasks.find(t => t.id === taskId);
                        if (task && task.order !== index) {
                            batch.update(doc(db, 'tasks', taskId), { order: index });
                        }
                    });
                    await batch.commit();
                }
            });
        }
    }
};

// Event Handlers
const handlers = {
    handleDelete: async (button, taskId) => {
        if (state.pendingDeleteId === taskId) {
            clearTimeout(state.deleteTimeout);
            state.pendingDeleteId = null;
            button.classList.remove('confirm-delete');
            const task = state.tasks.find(t => t.id === taskId);
            await firebaseOps.logHistory('Task deleted', task.text);
            await deleteDoc(doc(db, 'tasks', taskId));
        } else {
            state.pendingDeleteId = taskId;
            button.classList.add('confirm-delete');
            state.deleteTimeout = setTimeout(() => {
                button.classList.remove('confirm-delete');
                state.pendingDeleteId = null;
            }, 2000);
        }
    },

    handleTabClick: (e) => {
        if (e.target.classList.contains('tab-button')) {
            document.querySelectorAll('.tab-button, .tab-content').forEach(el => {
                el.classList.remove('active');
            });

            state.activeTab = e.target.dataset.tab;
            e.target.classList.add('active');
            document.getElementById(`${state.activeTab}-tasks`).classList.add('active');
            sortable.init();
        }
    },

    handleTaskInput: async (e) => {
        // Limpiar timeout existente
        clearTimeout(state.editTimeout);

        // Función común para guardar cambios
        const saveChanges = async () => {
            const taskId = e.target.dataset.id;
            if (e.target.matches('.task-content')) {
                const newText = e.target.textContent.trim();
                const task = state.tasks.find(t => t.id === taskId);

                if (task && task.text !== newText) {
                    await updateDoc(doc(db, 'tasks', taskId), { text: newText });
                    await firebaseOps.logHistory('Task edited', newText);
                }
            }
        };

        if (e.type === 'blur') {
            await saveChanges();
        }
        else {
            state.editTimeout = setTimeout(saveChanges, 30000);
        }
    }
};

// Event Listeners
const setupListeners = () => {
    // Form Submission
    dom.taskForm.addEventListener('submit', async e => {
        e.preventDefault();
        if (!dom.taskInput.value.trim()) return;

        const taskText = dom.taskInput.value.trim();
        const dueDate = dom.dueDateInput.value;
        const newOrder = state.tasks.length ? state.tasks[state.tasks.length - 1].order + 1 : 0;

        try {
            await addDoc(collection(db, 'tasks'), {
                text: taskText,
                completed: false,
                userId: auth.currentUser.uid,
                timestamp: new Date(),
                order: newOrder,
                dueDate: dueDate ? new Date(dueDate) : null
            });
            dom.taskInput.value = '';
            dom.dueDateInput.value = '';
            await firebaseOps.logHistory('Task created', taskText);
        } catch (error) {
            alert(error.message);
        }
    });

    // Tab Navigation
    dom.tabs.addEventListener('click', handlers.handleTabClick);

    // Task Container Events
    dom.tasksContainer.addEventListener('input', handlers.handleTaskInput);
    dom.tasksContainer.addEventListener('change', async e => {
        if (e.target.matches('input[type="checkbox"]')) {
            const taskId = e.target.dataset.id;
            const task = state.tasks.find(t => t.id === taskId);
            if (task) {
                const action = e.target.checked ? 'Task completed' : 'Task marked incomplete';
                await firebaseOps.logHistory(action, task.text);
                await updateDoc(doc(db, 'tasks', taskId), { completed: e.target.checked });
            }
        }
    });
    dom.tasksContainer.addEventListener('keydown', e => {
        if (e.key === 'Enter' && e.target.matches('.task-content')) {
            e.preventDefault();
            e.target.blur();
        }
    });
    dom.tasksContainer.addEventListener('blur', async (e) => {
        await handlers.handleTaskInput(e);
    }, true);
    dom.tasksContainer.addEventListener('click', async (e) => {
        const taskId = e.target.dataset.id;
        if (taskId && e.target.classList.contains('delete-btn')) {
            handlers.handleDelete(e.target, taskId);
        }
    });
};
const theme = {
    init() {
        this.toggleButtons = document.querySelectorAll('.theme-toggle');
        this.loadTheme();
        this.toggleButtons.forEach(btn =>
            btn.addEventListener('click', () => this.toggleTheme())
        );
    },

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        this.updateButtons(savedTheme);
    },

    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateButtons(newTheme);
    },

    updateButtons(theme) {
        this.toggleButtons.forEach(btn => {
            btn.textContent = theme === 'dark' ? '☀️' : '🌙';
        });
    }
};

// Auth State Listener
auth.onAuthStateChanged(user => {
    if (user) {
        firebaseOps.loadTasks();
        firebaseOps.loadHistory();
        document.querySelector(`[data-tab="${state.activeTab}"]`).click();
    } else {
        dom.pendingTasks.innerHTML = '';
        dom.completedTasks.innerHTML = '';
        dom.historyList.innerHTML = '';
    }
});

// Initialize
theme.init();
setupListeners();