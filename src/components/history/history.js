// src/components/history/history.js
import historyService from '../../services/historyService.js';
import searchService from '../../services/searchService.js';
import { createEmptyState, createSearchEmptyState } from '../../utils/dom.js';
import { createHistoryItemElement } from './historyRenderer.js';

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
        searchService.onSearchChanged(() => this.renderHistory(historyService.historyItems));
    },

    createLoadMoreButton() {
        this.loadMoreBtn = document.createElement('button');
        this.loadMoreBtn.type = 'button';
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

    renderHistory(historyItems = historyService.historyItems) {
        const filteredItems = searchService.filterBySearchTerm(historyItems, 'taskText');

        if (filteredItems.length === 0) {
            const searchTerm = searchService.getSearchTerm();
            this.historyContainer.replaceChildren(
                searchTerm
                    ? createSearchEmptyState('No history', searchTerm)
                    : createEmptyState('No history yet')
            );
            return;
        }

        this.historyContainer.replaceChildren(
            ...filteredItems.map(historyItem => createHistoryItemElement(historyItem))
        );

        if (historyService.hasMoreHistory()) {
            this.historyContainer.appendChild(this.loadMoreBtn);
        } else {
            this.loadMoreBtn.remove();
        }
    },

    // Compatibility alias; history values are returned as nodes, never HTML strings.
    createHistoryItemHtml(historyItem) {
        return createHistoryItemElement(historyItem);
    }
};

export default HistoryView;
