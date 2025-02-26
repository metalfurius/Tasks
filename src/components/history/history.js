// src/components/history/history.js
import historyService from '../../services/historyService.js';

const HistoryView = {
    // DOM elements
    historyContainer: null,

    // Initialize history view
    init() {
        // Get DOM elements
        this.historyContainer = document.getElementById('history-tasks');

        if (!this.historyContainer) {
            console.error('History container not found');
            return;
        }

        // Listen for history changes
        historyService.onHistoryChanged(this.renderHistory.bind(this));
    },

    // Render history items
    renderHistory(historyItems) {
        if (historyItems.length === 0) {
            this.historyContainer.innerHTML = '<div class="empty-state">No history yet</div>';
            return;
        }

        this.historyContainer.innerHTML = historyItems
            .map(this.createHistoryItemHtml)
            .join('');
    },

    // Create history item HTML
    createHistoryItemHtml(historyItem) {
        const date = historyItem.timestamp.toDate();
        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

        return `
            <div class="history-item">
                <div><strong>${historyItem.action}</strong></div>
                <div>${historyItem.taskText}</div>
                <div class="history-timestamp">${formattedDate}</div>
            </div>
        `;
    }
};

export default HistoryView;