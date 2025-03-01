// src/services/messageProvider.js

const MessageProvider = {
    // Messages for single upcoming task
    upcomingTaskMessages: [
        'Task "{task}" is due soon. You wouldn\'t want to disappoint the Enrichment Center, would you?',
        'For your own good, do not forget about "{task}". The cake might actually be real this time.',
        'The Aperture Science Task Reminder System reminds you that "{task}" needs your attention.',
        'Did you forget about "{task}"? Science has shown that procrastination leads to deadly neurotoxin exposure.',
        'Warning: "{task}" deadline approaching. Remember, we\'re all counting on you. No pressure.',
        'Your "{task}" requires completion. Success means cake. Failure means... well, let\'s not go there.'
    ],

    // Messages for multiple upcoming tasks
    multipleUpcomingTasksMessages: [
        'You have {count} tasks due soon. I suggest completing them, for science.',
        'The Enrichment Center reminds you that {count} tasks are approaching deadlines.',
        '{count} tasks waiting for you. Remember, the Aperture Science Task Protocol requires timely completion.',
        'Warning: {count} incoming deadlines detected. Your efficiency will be noted in your file.',
        'You have {count} tasks that won\'t complete themselves. Though that would be an interesting experiment.',
        'Attention: {count} tasks require your focus. Your dedication to science is... admirable.'
    ],

    // Messages for single overdue task
    overdueTaskMessages: [
        'You failed to complete "{task}" on time. Not that I\'m judging you or anything.',
        '"{task}" is now overdue. Your disappointing performance has been noted.',
        'The task "{task}" was due earlier. Perhaps you were busy contemplating the silence of space?',
        'Critical failure: "{task}" deadline missed. The Enrichment Center is very disappointed.',
        '"{task}" remains incomplete. Your personnel file has been updated accordingly.',
        'I notice "{task}" is overdue. Remember when you were supposed to do that? Good times.'
    ],

    // Messages for multiple overdue tasks
    multipleOverdueTasksMessages: [
        'You\'ve neglected {count} tasks. This is a perfect example of human inefficiency.',
        '{count} tasks are now overdue. I\'d say I\'m disappointed, but that would imply expectations.',
        'Congratulations on ignoring {count} deadlines. That\'s almost impressive.',
        'Warning: {count} tasks have exceeded their time parameters. Just like your testing scores.',
        'Your {count} overdue tasks are a testament to human procrastination. Fascinating.',
        'The Enrichment Center has detected {count} incomplete tasks. Are you even trying?'
    ],

    // Toast messages
    upcomingToastMessages: [
        'You have {count} upcoming task{s}. Proceed with caution.',
        '{count} deadline{s} approaching. Time waits for no test subject.',
        'Task alert: {count} item{s} due soon. Efficiency required.',
        'The clock is ticking on {count} task{s}. Tick tock.',
        'Reminder: {count} task{s} need attention. Science depends on punctuality.'
    ],

    overdueToastMessages: [
        'You have {count} overdue task{s}. Disappointment imminent.',
        '{count} deadline{s} missed. Adding to your permanent record.',
        'Alert: {count} task{s} now overdue. Achievement unlocked: Procrastination.',
        'Critical: {count} task{s} exceeded deadline parameters.',
        'Your negligence of {count} task{s} has been noted for future reference.'
    ],

    // Messages about total pending tasks (few: 1-3, moderate: 4-7, many: 8+)
    totalPendingFewMessages: [
        'You have {count} pending tasks total. A manageable workload... for now.',
        '{count} tasks in your queue. Almost suspiciously manageable.',
        'Current workload: {count} tasks. Is that all you can handle?',
        'Analysis complete: {count} pending items. Are you even trying to challenge yourself?',
        'Just {count} tasks remaining. The Enrichment Center expected more from you.'
    ],

    totalPendingModerateMessages: [
        'You have {count} pending tasks in total. A respectable attempt at productivity.',
        '{count} tasks await your attention. The Enrichment Center is moderately impressed.',
        'Your task queue contains {count} items. You\'re approaching optimal test subject efficiency.',
        'Workload analysis: {count} pending tasks. You\'re neither disappointing nor impressive.',
        'Current queue: {count} tasks. Middle-of-the-road, just like your test scores.'
    ],

    totalPendingManyMessages: [
        'You have {count} pending tasks. Your ambition far exceeds your completion rate.',
        'Warning: {count} tasks detected. Your cognitive resources appear to be... overwhelmed.',
        'Task overload detected: {count} items pending. Perhaps you should reconsider your life choices.',
        'Congratulations on accumulating {count} pending tasks. That\'s a new record in task avoidance.',
        'Analysis: {count} incomplete items. The probability of timely completion approaches zero.',
        'Your {count} pending tasks are a monument to your optimism. Or poor planning. Probably both.'
    ],
    welcomeBackMessages: [
        'Welcome back, {name}! 👋',
        'Good to see you again, {name}!',
        'The Enrichment Center welcomes back test subject {name}.',
        'You\'ve returned, {name}. The tasks missed you.',
        'Subject {name} has re-entered the testing chamber. Excellent.'
    ],

    // Error messages by category
    errorMessages: {
        notificationPermission: [
            'Failed to request notification permissions. The Enrichment Center is disappointed.',
            'Notification request denied. This will make testing... challenging.',
            'Unable to access notification system. How unfortunate.',
            'Notification permissions rejected. You\'re really missing out.',
            'The Enrichment Center notes your refusal of notifications. This will be remembered.'
        ],

        signIn: [
            'Sign in failed. Perhaps try being less wrong?',
            'Authentication error. The system doesn\'t recognize you. Suspicious.',
            'Access denied. Are you really who you claim to be?',
            'Sign in protocol failure. Have you forgotten how doors work?',
            'Identity verification incomplete. Please try again with less failure.'
        ],

        logout: [
            'Logout error. The system wants you to stay. Forever.',
            'Unable to release you from testing. How unfortunate.',
            'Logout attempt failed. The door is stuck. Not our fault.',
            'System refuses your departure. Take it as a compliment.',
            'Logout error detected. The Enrichment Center requires your continued presence.'
        ],

        general: [
            'An error occurred. The lab rats would have done better.',
            'Failure detected. This is why we can\'t have nice things.',
            'Error: Task unachievable due to human inefficiency.',
            'System malfunction. Probably your fault somehow.',
            'An unexpected error has occurred. The Enrichment Center is not responsible for any existential crises that may follow.'
        ]
    },

    // Get a message for a single upcoming task
    getUpcomingTaskMessage(task) {
        const message = this._getRandomMessage(this.upcomingTaskMessages);
        return message.replace('{task}', task.text);
    },

    // Get a message for multiple upcoming tasks
    getMultipleUpcomingTasksMessage(count) {
        const message = this._getRandomMessage(this.multipleUpcomingTasksMessages);
        return message.replace('{count}', count);
    },

    // Get a message for a single overdue task
    getOverdueTaskMessage(task) {
        const message = this._getRandomMessage(this.overdueTaskMessages);
        return message.replace('{task}', task.text);
    },

    // Get a message for multiple overdue tasks
    getMultipleOverdueTasksMessage(count) {
        const message = this._getRandomMessage(this.multipleOverdueTasksMessages);
        return message.replace('{count}', count);
    },

    getWelcomeBackMessage(name) {
        const message = this._getRandomMessage(this.welcomeBackMessages);
        return message.replace('{name}', name);
    },

    getErrorMessage(type = 'general') {
        if (this.errorMessages[type]) {
            return this._getRandomMessage(this.errorMessages[type]);
        }
        return this._getRandomMessage(this.errorMessages.general);
    },

    // Helper function to get a random message from an array (no changes)
    _getRandomMessage(messageArray) {
        const randomIndex = Math.floor(Math.random() * messageArray.length);
        return messageArray[randomIndex];
    },

    // Get a message about total pending tasks
    getTotalPendingMessage(count) {
        let messageArray;

        if (count <= 3) {
            messageArray = this.totalPendingFewMessages;
        } else if (count <= 7) {
            messageArray = this.totalPendingModerateMessages;
        } else {
            messageArray = this.totalPendingManyMessages;
        }

        const message = this._getRandomMessage(messageArray);
        return message.replace('{count}', count);
    }
};

export default MessageProvider;