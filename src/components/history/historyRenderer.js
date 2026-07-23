// DOM-only history renderer. Stored history values are written as text nodes.
import { createTextElement } from '../../utils/dom.js';

export function createHistoryItemElement(historyItem) {
    const date = typeof historyItem.timestamp.toDate === 'function'
        ? historyItem.timestamp.toDate()
        : new Date(historyItem.timestamp);
    const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

    const historyElement = document.createElement('div');
    historyElement.className = 'history-item';

    const actionElement = document.createElement('div');
    actionElement.appendChild(createTextElement('strong', historyItem.action));

    historyElement.append(
        actionElement,
        createTextElement('div', historyItem.taskText),
        createTextElement('div', formattedDate, 'history-timestamp')
    );

    return historyElement;
}
