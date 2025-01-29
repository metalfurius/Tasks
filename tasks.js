import { auth, db } from './firebase.js';

export const initTasks = () => {
    const tasksList = document.getElementById('tasksList');
    const newTaskInput = document.getElementById('newTask');

    // Clear previous event listeners
    document.querySelector('.fixed-action-btn').replaceWith(document.querySelector('.fixed-action-btn').cloneNode(true));
    document.querySelector('.fixed-action-btn').addEventListener('click', async () => {
        const text = newTaskInput.value.trim();
        if (text) {
            try {
                await db.collection('tasks').add({
                    text: text,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    userId: auth.currentUser.uid,
                    completed: false
                });
                newTaskInput.value = '';
            } catch (error) {
                M.toast({html: `Error adding task: ${error.message}`, classes: 'red'});
            }
        }
    });

    const renderTask = (doc) => {
        const data = doc.data();

        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';
        taskItem.id = doc.id;

        const checkbox = document.createElement('p');
        checkbox.innerHTML = `
            <label>
                <input type="checkbox" class="filled-in" ${data.completed ? 'checked' : ''} />
                <span></span>
            </label>
        `;

        const text = document.createElement('div');
        text.className = `task-text ${data.completed ? 'completed' : ''}`;
        text.textContent = data.text;

        const deleteBtn = document.createElement('a');
        deleteBtn.className = 'waves-effect waves-light btn-small red';
        deleteBtn.innerHTML = '<i class="material-icons">delete</i>';

        taskItem.appendChild(checkbox);
        taskItem.appendChild(text);
        taskItem.appendChild(deleteBtn);

        // Event listeners
        checkbox.querySelector('input').addEventListener('change', (e) => {
            db.collection('tasks').doc(doc.id).update({
                completed: e.target.checked
            });
        });

        deleteBtn.addEventListener('click', () => {
            db.collection('tasks').doc(doc.id).delete();
        });

        tasksList.appendChild(taskItem);
        M.AutoInit();
    };

    const loadTasks = () => {
        tasksList.innerHTML = '';

        const unsubscribe = db.collection('tasks')
            .where('userId', '==', auth.currentUser.uid)
            .orderBy('timestamp', 'desc')
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added' && !document.getElementById(change.doc.id)) {
                        renderTask(change.doc);
                    }
                    if (change.type === 'removed') {
                        const task = document.getElementById(change.doc.id);
                        if (task) task.remove();
                    }
                    if (change.type === 'modified') {
                        const task = document.getElementById(change.doc.id);
                        if (task) {
                            const textElement = task.querySelector('.task-text');
                            const checkbox = task.querySelector('input[type="checkbox"]');
                            textElement.textContent = change.doc.data().text;
                            textElement.classList.toggle('completed', change.doc.data().completed);
                            checkbox.checked = change.doc.data().completed;
                        }
                    }
                });
            }, error => {
                M.toast({html: `Error loading tasks: ${error.message}`, classes: 'red'});
            });

        return unsubscribe; // Return the unsubscribe function
    };

    return { loadTasks, unsubscribe: loadTasks() };
};
