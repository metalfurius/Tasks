// DOM helpers for rendering application-controlled values as text.

export function createTextElement(tagName, value = '', className = '') {
    const element = document.createElement(tagName);
    if (className) {
        element.className = className;
    }
    element.textContent = value == null ? '' : String(value);
    return element;
}

export function appendTextWithLineBreaks(parent, value = '') {
    const text = value == null ? '' : String(value);
    const lines = text.replace(/\r\n?/g, '\n').split('\n');

    lines.forEach((line, index) => {
        if (index > 0) {
            parent.appendChild(document.createElement('br'));
        }
        parent.appendChild(document.createTextNode(line));
    });

    return parent;
}

export function setTextWithLineBreaks(element, value = '') {
    element.replaceChildren();
    return appendTextWithLineBreaks(element, value);
}

export function getTextWithLineBreaks(element) {
    const clone = element.cloneNode(true);
    clone.querySelectorAll('br').forEach(lineBreak => {
        lineBreak.replaceWith('\n');
    });
    return clone.textContent || '';
}

export function createEmptyState(message) {
    return createTextElement('div', message, 'empty-state');
}

export function createSearchEmptyState(label, searchTerm, icon = '\u{1F50D}') {
    return createEmptyState(`${label} matching "${searchTerm}" ${icon}`);
}
