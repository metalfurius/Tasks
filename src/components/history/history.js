// src/components/history/history.js
import historyService from '../../services/historyService.js';
import searchService from '../../services/searchService.js';

const HistoryView = {
    historyContainer: null,
    loadMoreBtn: null,
    loading: false,

    init() {
        this.historyContainer = document.getElementById('history-tasks');
        this.createLoadMoreButton();

        if (!this.historyContainer) {
            console.error('History container not found');
            return;
        }

        historyService.onHistoryChanged(this.renderHistory.bind(this));

        searchService.onSearchChanged(() => {
            historyService.onHistoryChanged(this.renderHistory.bind(this));
        });
    },

    createLoadMoreButton() {
        this.loadMoreBtn = document.createElement('button');
        this.loadMoreBtn.textContent = 'Load More';
        this.loadMoreBtn.className = 'load-more-btn';
        this.loadMoreBtn.addEventListener('click', this.handleLoadMore.bind(this));
    },

    async handleLoadMore() {
        if (this.loading) return;

        this.loading = true;
        this.loadMoreBtn.textContent = 'Loading...';
        this.loadMoreBtn.disabled = true;

        try {
            const hasMore = await historyService.loadMoreHistory();
            if (!hasMore) {
                this.loadMoreBtn.remove();
            }
        } catch (error) {
            console.error('Error loading more history:', error);
        } finally {
            this.loading = false;
            this.loadMoreBtn.textContent = 'Load More';
            this.loadMoreBtn.disabled = false;
        }
    },

    renderHistory(historyItems) {
        // Filter by search term if present
        const filteredItems = searchService.filterBySearchTerm(historyItems, 'taskText');

        if (filteredItems.length === 0) {
            const searchTerm = searchService.getSearchTerm();
            if (searchTerm) {
                this.historyContainer.innerHTML = `<div class="empty-state">No history matching "${searchTerm}" 🔍</div>`;
            } else {
                this.historyContainer.innerHTML = '<div class="empty-state">No history yet</div>';
            }
            return;
        }

        this.historyContainer.innerHTML = filteredItems
            .map(this.createHistoryItemHtml)
            .join('');

        // Only append the load more button if there are more items to load
        if (historyService.hasMoreHistory()) {
            this.historyContainer.appendChild(this.loadMoreBtn);
        }
    },

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