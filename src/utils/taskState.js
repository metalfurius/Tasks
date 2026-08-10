// State helpers shared by the realtime service and its deterministic tests.

export function cloneTaskList(tasks) {
    return tasks.map(task => ({ ...task }));
}

export function sortTaskList(tasks) {
    return [...tasks].sort((a, b) => {
        const aOrder = Number.isFinite(a.order) ? a.order : Number.MAX_SAFE_INTEGER;
        const bOrder = Number.isFinite(b.order) ? b.order : Number.MAX_SAFE_INTEGER;
        return aOrder - bOrder || String(a.id).localeCompare(String(b.id));
    });
}

export function mergeTaskList(tasks, incomingTasks) {
    const tasksById = new Map(tasks.map(task => [task.id, task]));

    incomingTasks.forEach(task => {
        const previous = tasksById.get(task.id);
        tasksById.set(task.id, {
            ...(previous || {}),
            ...task,
            timestamp: task.timestamp || previous?.timestamp
        });
    });

    return sortTaskList(Array.from(tasksById.values()));
}

export function removeTaskList(tasks, taskIds) {
    const ids = new Set(taskIds);
    return sortTaskList(tasks.filter(task => !ids.has(task.id)));
}

export function applySnapshotChanges(tasks, changes, userId) {
    let nextTasks = tasks;
    let changed = false;

    changes.forEach(change => {
        const existingTask = nextTasks.find(task => task.id === change.id);

        // Keep the Firestore query's ownership boundary explicit in local state too.
        if (change.type !== 'removed' && change.data.userId !== userId) return;
        if (change.type === 'removed' && change.data.userId && change.data.userId !== userId) return;

        if (change.type === 'removed') {
            if (existingTask?.userId === userId) {
                nextTasks = nextTasks.filter(task => task.id !== change.id);
                changed = true;
            }
            return;
        }

        nextTasks = mergeTaskList(nextTasks, [{
            ...(existingTask || {}),
            id: change.id,
            ...change.data,
            timestamp: change.data.timestamp || existingTask?.timestamp
        }]);
        changed = true;
    });

    return { tasks: sortTaskList(nextTasks), changed };
}
