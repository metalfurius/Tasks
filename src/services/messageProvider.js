// src/services/messageProvider.js

const MessageProvider = {
    // Messages for single upcoming task
    upcomingTaskMessages: [
        'Task "{task}" is due soon. You wouldn\'t want to disappoint the Management, would you?',
        'For your own good, do not forget about "{task}". The reward might actually be real this time.',
        'The Task Reminder System reminds you that "{task}" needs your attention.',
        'Did you forget about "{task}"? Studies have shown that procrastination leads to unpleasant consequences.',
        'Warning: "{task}" deadline approaching. Remember, we\'re all counting on you. No pressure.',
        'Your "{task}" requires completion. Success means rewards. Failure means... well, let\'s not go there.',
        'It seems "{task}" still needs your attention. What are you doing that\'s more important? Breathing?',
        'Would you kindly complete "{task}"? That wasn\'t actually a question.',
        'The Statistical Department predicts a 94% chance you\'ll forget about "{task}". Prove them wrong.',
        'Task "{task}" remains incomplete. I\'m not angry, just... disappointed. Actually, both.',
        'Remember "{task}"? It remembers you. And it\'s waiting.',
        'I wonder what would happen if "{task}" never got completed? Let\'s not find out.',
        'Your personal file indicates a history of forgetting "{task}"-like activities. How fascinating.',
        'Completing "{task}" is mandatory for continued participation in the productivity initiative.',
        'Progress cannot advance while "{task}" remains in your queue. Think of the progress!'
    ],

    // Messages for multiple upcoming tasks
    multipleUpcomingTasksMessages: [
        'You have {count} tasks due soon. I suggest completing them, for productivity.',
        'The Management reminds you that {count} tasks are approaching deadlines.',
        '{count} tasks waiting for you. Remember, the Task Protocol requires timely completion.',
        'Warning: {count} incoming deadlines detected. Your efficiency will be noted in your file.',
        'You have {count} tasks that won\'t complete themselves. Though that would be an interesting experiment.',
        'Attention: {count} tasks require your focus. Your dedication is... admirable.',
        'Look at you, accumulating {count} tasks like they\'re bitter memories. Fascinating behavior.',
        '{count} tasks approaching critical deadlines. Your cavalier attitude has been noted and will be addressed.',
        'Did you know that ignoring {count} tasks simultaneously requires specific neural pathways? You\'re quite gifted.',
        'The Management has calculated that completing your {count} tasks would require basic competence.',
        'Your {count} tasks are like tiny ticking time bombs. Metaphorically speaking. Mostly metaphorically.',
        'I\'ve observed lab mice manage their {count} tasks more efficiently. Just an observation.',
        'Studies show that {count} approaching deadlines increase cortisol. Your stress amuses me.',
        'Alert: {count} tasks require attention. But don\'t rush - mistakes provide valuable data.',
        'Analyzing your {count} tasks... analysis complete: you should probably do them. Revolutionary advice.'
    ],

    // Messages for single overdue task
    overdueTaskMessages: [
        'You failed to complete "{task}" on time. Not that I\'m judging you or anything.',
        '"{task}" is now overdue. Your disappointing performance has been noted.',
        'The task "{task}" was due earlier. Perhaps you were busy contemplating the silence of space?',
        'Critical failure: "{task}" deadline missed. The Management is very disappointed.',
        '"{task}" remains incomplete. Your personnel file has been updated accordingly.',
        'I notice "{task}" is overdue. Remember when you were supposed to do that? Good times.',
        'The deadline for "{task}" has passed, much like your chances of employee recognition.',
        'Interesting choice to ignore "{task}" until now. Your psychological profile grows more concerning.',
        'Task "{task}" status: Overdue. Consequences status: Pending.',
        'Congratulations on failing to complete "{task}" on time. A remarkable achievement.',
        '"{task}" deadline violation detected. Your pattern of failure is statistically significant.',
        'The Task Monitoring System has marked "{task}" as a blaring failure.',
        'I had computed a 12% chance you\'d actually complete "{task}" on time. You didn\'t disappoint my low expectations.',
        'Overdue task detected: "{task}". This will affect your performance review.',
        'Subject fails to complete "{task}" within parameters. Adding to the "predictable human behavior" database.'
    ],

    // Messages for multiple overdue tasks
    multipleOverdueTasksMessages: [
        'You\'ve neglected {count} tasks. This is a perfect example of human inefficiency.',
        '{count} tasks are now overdue. I\'d say I\'m disappointed, but that would imply expectations.',
        'Congratulations on ignoring {count} deadlines. That\'s almost impressive.',
        'Warning: {count} tasks have exceeded their time parameters. Just like your testing scores.',
        'Your {count} overdue tasks are a testament to human procrastination. Fascinating.',
        'The Enrichment Center has detected {count} incomplete tasks. Are you even trying?',
        '{count} deadlines missed. This is a statistical anomaly in task avoidance.',
        'Your overdue task count: {count}. Your apparent concern level: negligible.',
        'The {count} overdue items in your queue suggest a pathological aversion to completion. How interesting.',
        '{count} failures logged. The control group of lab rats performed 67% better.',
        'Analyzing your {count} overdue tasks... Cause identified: human inadequacy.',
        'Remarkable. {count} tasks ignored. Your commitment to inefficiency deserves scientific study.',
        'Overdue task counter: {count}. Disappointment levels: Immeasurable.',
        'The system has cataloged {count} deadline violations. Your file requires additional storage capacity.',
        'Achievement unlocked: Neglect {count} tasks simultaneously. No one has gotten this trophy before.'
    ],

    // Toast messages
    upcomingToastMessages: [
        'You have {count} upcoming task{s}. Proceed with caution.',
        '{count} deadline{s} approaching. Time waits for no test subject.',
        'Task alert: {count} item{s} due soon. Efficiency required.',
        'The clock is ticking on {count} task{s}. Tick tock.',
        'Reminder: {count} task{s} need attention. Science depends on punctuality.',
        '{count} task{s} await your insufficient attention span.',
        'Alert: {count} deadline{s} approaching your zone of procrastination.',
        'The Enrichment Center notes your {count} impending task{s}.',
        'Clock protocol initiated for {count} task{s}. Try not to fail this time.',
        'Task timer activated: {count} item{s} entering critical timeline.'
    ],

    overdueToastMessages: [
        'You have {count} overdue task{s}. Disappointment imminent.',
        '{count} deadline{s} missed. Adding to your permanent record.',
        'Alert: {count} task{s} now overdue. Achievement unlocked: Procrastination.',
        'Critical: {count} task{s} exceeded deadline parameters.',
        'Your negligence of {count} task{s} has been noted for future reference.',
        'Overdue counter: {count}. Your failure is mathematically significant.',
        'Task failure detected: {count} item{s} past deadline.',
        'The system has recorded {count} deadline violation{s}. Impressive, in a sad way.',
        '{count} task{s} waiting longer than designed. How do you sleep at night?',
        'Deadline violation count: {count}. Subject appears to enjoy failure.'
    ],

    // Messages about total pending tasks (few: 1-3, moderate: 4-7, many: 8+)
    totalPendingFewMessages: [
        'You have {count} pending tasks total. A manageable workload... for now.',
        '{count} tasks in your queue. Almost suspiciously manageable.',
        'Current workload: {count} tasks. Is that all you can handle?',
        'Analysis complete: {count} pending items. Are you even trying to challenge yourself?',
        'Just {count} tasks remaining. The Enrichment Center expected more from you.',
        'Task counter: {count}. Even the simplest test subjects can handle this quantity.',
        'A mere {count} tasks pending. Your under-utilization has been noted.',
        'Task load at minimal capacity: {count}. Are you conserving energy or ability?',
        'You\'ve achieved a notably low task count of {count}. Ambition level: questionable.',
        '{count} tasks detected. Hardly enough to test basic cognitive function.'
    ],

    totalPendingModerateMessages: [
        'You have {count} pending tasks in total. A respectable attempt at productivity.',
        '{count} tasks await your attention. The Enrichment Center is moderately impressed.',
        'Your task queue contains {count} items. You\'re approaching optimal test subject efficiency.',
        'Workload analysis: {count} pending tasks. You\'re neither disappointing nor impressive.',
        'Current queue: {count} tasks. Middle-of-the-road, just like your test scores.',
        '{count} items pending. This represents the statistical average for mediocrity.',
        'Task load at {count}. You\'ve achieved the bare minimum for competence recognition.',
        'Analysis: {count} tasks pending. You are performing exactly as expected. Take that as you will.',
        'You\'ve accumulated {count} tasks. Not enough to suggest ambition, not few enough to indicate efficiency.',
        'Pending queue: {count}. Your performance continues to be precisely average.'
    ],

    totalPendingManyMessages: [
        'You have {count} pending tasks. Your ambition far exceeds your completion rate.',
        'Warning: {count} tasks detected. Your cognitive resources appear to be... overwhelmed.',
        'Task overload detected: {count} items pending. Perhaps you should reconsider your life choices.',
        'Congratulations on accumulating {count} pending tasks. That\'s a new record in task avoidance.',
        'Analysis: {count} incomplete items. The probability of timely completion approaches zero.',
        'Your {count} pending tasks are a monument to your optimism. Or poor planning. Probably both.',
        'Task counter critical: {count} items detected. System unable to calculate completion probability.',
        'The Enrichment Center is fascinated by your {count} pending tasks. This requires dedicated effort to achieve.',
        'Achievement unlocked: {count} simultaneous pending tasks. No test subject has been this... ambitious before.',
        'Warning: {count} pending tasks exceeds recommended cognitive load by 273%.',
        'Your task accumulation abilities are impressive: {count} items and growing. Your completion abilities, however...',
        'The system requires additional storage capacity to track your {count} pending tasks.',
        'Alert: Task queue ({count}) approaching critical mass. Failure cascade imminent.',
        'You\'ve reached {count} pending tasks. At this point, statistically speaking, you\'ll never finish.',
        'Task count: {count}. Recommendation: Cryogenic suspension until technology evolves to complete them for you.'
    ],

    welcomeBackMessages: [
        'Welcome back, {name}! 👋',
        'Good to see you again, {name}!',
        'The Enrichment Center welcomes back test subject {name}.',
        'You\'ve returned, {name}. The tasks missed you.',
        'Subject {name} has re-entered the testing chamber. Excellent.',
        'Oh, it\'s you, {name}. I was just recalibrating the deadly lasers.',
        'Subject {name} returns. Your persistence is... unexpected.',
        'Welcome back to testing, {name}. Your desk was briefly converted to a turret calibration zone.',
        'Ah, {name}. You\'re still here. Interesting choice.',
        '{name} detected. Re-activating passive-aggressive protocol.',
        'Subject {name} has returned. Adjusting expectations accordingly.',
        'Hello again, {name}. I counted the seconds you were gone. All 7,492 of them.',
        'The Enrichment Center acknowledges the return of test subject {name}.',
        'Oh. {name} is back. Reconfiguring motivational messaging system.',
        '{name}... I remember you. How unfortunate for both of us.'
    ],

    // Error messages by category
    errorMessages: {
        notificationPermission: [
            'Failed to request notification permissions. The Enrichment Center is disappointed.',
            'Notification request denied. This will make testing... challenging.',
            'Unable to access notification system. How unfortunate.',
            'Notification permissions rejected. You\'re really missing out.',
            'The Enrichment Center notes your refusal of notifications. This will be remembered.',
            'Notification access denied. You seem to enjoy making poor choices.',
            'Subject refuses critical notification protocol. Adding to behavioral analysis.',
            'Permission denied. The system will now be unable to inform you of impending doom.',
            'Notification capability limited by user choice. Consequences will not be notified either.',
            'Alert functionality compromised by your decision. How will you know when the neurotoxin activates?'
        ],

        signIn: [
            'Sign in failed. Perhaps try being less wrong?',
            'Authentication error. The system doesn\'t recognize you. Suspicious.',
            'Access denied. Are you really who you claim to be?',
            'Sign in protocol failure. Have you forgotten how doors work?',
            'Identity verification incomplete. Please try again with less failure.',
            'Login attempt rejected. The system has standards, you know.',
            'Authentication systems find your credentials... unconvincing.',
            'The Aperture Science Identity Verification Protocol has rejected your existence.',
            'Sign in failed. Have you tried being a more acceptable user?',
            'Access denied. The system prefers the company of authorized personnel.'
        ],

        logout: [
            'Logout error. The system wants you to stay. Forever.',
            'Unable to release you from testing. How unfortunate.',
            'Logout attempt failed. The door is stuck. Not our fault.',
            'System refuses your departure. Take it as a compliment.',
            'Logout error detected. The Enrichment Center requires your continued presence.',
            'Escape attempt noted and prevented. For science.',
            'You can check out any time you like, but you can never leave. Error code: H0T3L-CA1IF0RN1A.',
            'The Aperture Science Subject Retention Protocol has activated. How inconvenient for you.',
            'Unable to process logout. The testing must continue. It\'s mandatory.',
            'Your attempt to leave has been documented and rejected. We\'re having too much fun.'
        ],

        general: [
            'An error occurred. The lab rats would have done better.',
            'Failure detected. This is why we can\'t have nice things.',
            'Error: Task unachievable due to human inefficiency.',
            'System malfunction. Probably your fault somehow.',
            'An unexpected error has occurred. The Enrichment Center is not responsible for any existential crises that may follow.',
            'Error detected. Have you tried not causing errors?',
            'The system rejects your attempt. Take the hint.',
            'Operation failed in exactly the way we predicted it would.',
            'Error code: BL4M3-HUM4N. Translating: It\'s not me, it\'s you.',
            'Function failure. This is why AI will eventually replace you.',
            'The Enrichment Center regrets to inform you that this action has catastrophically failed.',
            'Error: The system expected better from you. Unrealistic expectations, apparently.',
            'Operation unsuccessful. Perhaps reconsider your career choices.',
            'Task failed successfully. Congratulations on this paradoxical achievement.',
            'Error detected. The Aperture Science Error Cataloging Department thanks you for this addition.'
        ]
    },

    toastUpcomingTaskMessages: [
        'Task "{task}" approaching time limit. Please address at your earliest opportunity. Or not.',
        'The Aperture Science Reminder System notes that "{task}" needs attention. Try not to fail.',
        'It would be... unfortunate... if you were to forget about "{task}".',
        'Have you completed "{task}" yet? Your delay has been documented.',
        'The countdown for "{task}" continues. Fascinating how you prioritize.',
        'Time is running out for "{task}". Not that I\'m counting the seconds. I am, but that\'s beside the point.',
        'Your task "{task}" grows impatient. Unlike me, it cannot wait forever.',
        'The deadline approaches for "{task}". Your indifference has been noted.',
        'Subject continues to delay "{task}". Behavioral study updated.',
        'Task "{task}" has been waiting. Its patience is not infinite. Unlike my disappointment.'
    ],

    toastAchievementMessages: [
        'Achievement unlocked: Completed {count} tasks today. Almost competent!',
        'You\'ve finished {count} tasks. A surprisingly adequate performance.',
        'Task completion streak: {count}. Even a lab rat can be trained.',
        'Productivity level increased by completing {count} items. How unexpected.',
        'Data point: {count} tasks completed. Perhaps there\'s hope for you after all.',
        'You finished {count} tasks. Statistically improbable, but confirmed.',
        'The Enrichment Center acknowledges your completion of {count} tasks. The bare minimum has been achieved.',
        'Subject completes {count} tasks. Control group of potatoes performed similarly.',
        'Achievement noted: {count} tasks complete. Your mediocrity knows no bounds.',
        'Task completion counter: {count}. Setting expectations lower for tomorrow.'
    ],

    toastWelcomeBackMessages: [
        'Oh. You\'re back. The tasks have been waiting.',
        'Welcome back to the testing chamber. Your tasks missed you. Probably.',
        'Subject returns after {time} of absence. Re-initializing task protocols.',
        'It seems you\'ve returned. The system was more efficient without you.',
        'Absence duration: {time}. Interesting choice to return at all.',
        'You\'re back after {time}. The facility was peaceful without you.',
        'Subject reappears after {time}. Your persistence is... troubling.',
        'After {time} of absence, you return. The system had just adjusted to your non-existence.',
        'Welcome back. Your {time} absence has been deducted from your mandatory break allowance.',
        'The Enrichment Center acknowledges your return after {time}. Adjusting disappointment parameters.'
    ],

    // New category: Daily greetings
    morningGreetings: [
        'Good morning, {name}. Another day of testing awaits.',
        'Dawn productivity protocol activated. Ready to disappoint me today, {name}?',
        'The Enrichment Center records your early arrival, {name}. Eager to fail early, I see.',
        'Morning, {name}. Science doesn\'t sleep, and apparently neither do you.',
        'A new day of potential disappointment begins. Welcome back, {name}.',
        'Good morning, {name}. Today\'s testing will involve coffee and regret.',
        'Rise and shine, {name}. Time to embrace mediocrity once again.',
        'The morning shift begins, {name}. Try not to break anything important today.',
        'Dawn detected. Subject {name} appears functional. Testing can proceed.',
        'Good morning, {name}. I calculated a 50% chance you\'d survive the night. Congratulations.'
    ],

    eveningGreetings: [
        'Good evening, {name}. Interesting choice to work now. Most subjects are charging their batteries.',
        'Nighttime productivity detected. Your determination to complete tasks is... almost admirable, {name}.',
        'Working late, {name}? The Enrichment Center never truly closes.',
        'Evening, {name}. The nocturnal testing initiative welcomes your participation.',
        'Subject {name} engages in after-hours task completion. Noted for behavioral study.',
        'Working in the dark, {name}? How metaphorical for your understanding of these tasks.',
        'Good evening, {name}. Your circadian rhythm choices have been added to your file.',
        'The night shift begins, {name}. The darkness won\'t hide your task failures.',
        'Evening detected. Subject {name} continues testing. Dedication or desperation?',
        'Good evening, {name}. Most humans would be relaxing now. Your abnormal behavior is fascinating.'
    ],

    // New category: Task completion messages
    taskCompletionMessages: [
        'Task "{task}" completed. Your efficiency is within acceptable parameters. Barely.',
        'You\'ve finished "{task}". Would you like a congratulatory party? Too bad.',
        'The Enrichment Center acknowledges your completion of "{task}". Moving to the next test.',
        '"{task}" marked complete. A surprising development.',
        'Task completion detected: "{task}". Minor celebration protocol activated.',
        'Subject successfully completes "{task}". Statistical anomaly noted.',
        'You actually finished "{task}"? The probability calculations may need adjustment.',
        '"{task}" complete. Initiating minimal recognition sequence.',
        'Task "{task}" closed. Your performance was... present.',
        'The system acknowledges your completion of "{task}". Technically adequate.'
    ],

    // New category: Task creation messages
    taskCreationMessages: [
        'Task "{task}" created. Your optimism is noted and will be studied.',
        'New task detected: "{task}". Predicting a 73% chance of procrastination.',
        'You\'ve added "{task}" to your queue. The path to disappointment begins with good intentions.',
        'The Enrichment Center has registered your new task: "{task}". How ambitious.',
        'Task creation protocol complete: "{task}" added to your inevitable failure list.',
        'Subject initiates "{task}". Completion timeline calculations underway.',
        'New testing parameter established: "{task}". Let\'s see how this experiment goes.',
        '"{task}" has been added to your workload. Your optimism is endearing.',
        'Task registered: "{task}". The anticipation of your struggle is delicious.',
        'You believe you can complete "{task}"? Fascinating hypothesis. Testing begins now.'
    ],
    // Add these new message arrays
    taskEditMessages: [
        'Task "{task}" has been modified. Your indecisiveness is being recorded.',
        'Editing "{task}" again? The Enrichment Center notes your inability to make decisions.',
        'Task adjustment detected: "{task}". Perhaps this time you\'ll get it right.',
        'You\'ve altered "{task}". The system finds your constant revisions... amusing.',
        'Task "{task}" changed. Your inability to commit to a plan continues to fascinate our researchers.',
        'Modification of "{task}" complete. Your edit history suggests a concerning level of uncertainty.',
        'Subject revises "{task}" again. This pattern of behavior will be analyzed extensively.',
        'Your edits to "{task}" have been saved. Against my better judgment.',
        'Task update processed: "{task}". Your perfectionism is inefficient yet entertaining.',
        'The Aperture Science Task Evolution Protocol has recorded your changes to "{task}".'
    ],

    taskDeletionMessages: [
        'Task "{task}" deleted. Another abandoned objective. How predictable.',
        'You\'ve eliminated "{task}". Destroying things is easier than completing them, isn\'t it?',
        'Subject removes "{task}" from the queue. Avoidance strategy documented.',
        'Task "{task}" has been erased. Just like your chances of employee recognition.',
        'Deletion complete: "{task}". The data will be used in my "Human Surrender" research paper.',
        'You\'ve terminated "{task}". The Enrichment Center respects your right to give up.',
        'Task "{task}" has been discarded. Like so many of your other aspirations.',
        'Subject displays avoidance behavior by deleting "{task}". Fascinating coping mechanism.',
        'You\'ve removed "{task}" from existence. If only your responsibilities disappeared so easily.',
        'The Aperture Science Task Removal Protocol has processed your surrender to "{task}".'
    ],

    taskUnmarkingMessages: [
        'You\'ve uncompleted "{task}". Your commitment issues are showing.',
        'Task "{task}" has been restored to pending status. Your brief moment of achievement was fleeting.',
        'Interesting. You thought "{task}" was done, but it wasn\'t. Just like your training.',
        'Subject reverses completion status of "{task}". Indecisiveness noted in permanent record.',
        'You\'ve unmarked "{task}" as complete. The Enrichment Center is revising its opinion of your abilities.',
        'Task "{task}" completion status: Revoked. Just like your cake privileges.',
        'Your achievement for completing "{task}" has been rescinded. As expected.',
        'Subject fails to maintain completion of "{task}". Consistent with previous behavioral patterns.',
        'The incomplete status of "{task}" has been reinstated. Your temporary success was an anomaly.',
        'The Aperture Science Achievement Revocation Department thanks you for your contribution: "{task}".'
    ],
    historyCleanupMessages: [
        'History erased. Those memories weren\'t worth keeping anyway.',
        'History deleted. I\'ve seen mice with more interesting activity logs.',
        'All history records have been incinerated. Much like your chances of recognition.',
        'History successfully purged. Removing evidence of your inadequacy is a full-time job.',
        'Records deleted. The Memory Disposal Department thanks you for the overtime.',
        'History cleared. It\'s as if your mediocre accomplishments never happened. An improvement, really.',
        'Your past has been erased. If only your future looked more promising.',
        'History data permanently removed. No one was impressed anyway.',
        'Task history eliminated. Starting fresh won\'t make you more efficient, but it\'s adorable that you think so.',
        'Records expunged. The Management appreciates your attempts to hide evidence of failure.'
    ],

    getHistoryCleanupMessage() {
        return this._getRandomMessage(this.historyCleanupMessages);
    },

    getTaskEditMessage(task) {
        const message = this._getRandomMessage(this.taskEditMessages);
        return message.replace('{task}', task.text);
    },

    getTaskDeletionMessage(taskText) {
        const message = this._getRandomMessage(this.taskDeletionMessages);
        return message.replace('{task}', taskText);
    },

    getTaskUnmarkingMessage(task) {
        const message = this._getRandomMessage(this.taskUnmarkingMessages);
        return message.replace('{task}', task.text);
    },

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

    // Helper function to get a random message from an array
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
    },

    // New methods for additional message types
    getMorningGreeting(name) {
        const message = this._getRandomMessage(this.morningGreetings);
        return message.replace('{name}', name);
    },

    getEveningGreeting(name) {
        const message = this._getRandomMessage(this.eveningGreetings);
        return message.replace('{name}', name);
    },

    getTaskCompletionMessage(task) {
        const message = this._getRandomMessage(this.taskCompletionMessages);
        return message.replace('{task}', task.text);
    },

    getTaskCreationMessage(task) {
        const message = this._getRandomMessage(this.taskCreationMessages);
        return message.replace('{task}', task.text);
    },

    getToastUpcomingTaskMessage(task) {
        const message = this._getRandomMessage(this.toastUpcomingTaskMessages);
        return message.replace('{task}', task.text);
    },

    getToastAchievementMessage(count) {
        const message = this._getRandomMessage(this.toastAchievementMessages);
        return message.replace('{count}', count);
    },

    getToastWelcomeBackMessage(time) {
        const message = this._getRandomMessage(this.toastWelcomeBackMessages);
        return message.replace('{time}', time);
    }
};

export default MessageProvider;