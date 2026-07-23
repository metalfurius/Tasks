// src/components/search/search.js
import searchService from '../../services/searchService.js';
import TabManager from '../ui/tabs.js';
import { createTextElement } from '../../utils/dom.js';

const SearchComponent = {
    searchInput: null,
    searchContainer: null,

    init() {
        this.createSearchUI();
        this.setupListeners();
    },

    createSearchUI() {
        this.searchContainer = document.createElement('div');
        this.searchContainer.className = 'search-container';

        this.searchInput = document.createElement('input');
        this.searchInput.type = 'text';
        this.searchInput.id = 'search-input';
        this.searchInput.placeholder = 'Search tasks...';
        this.searchInput.autocomplete = 'off';

        const searchIcon = createTextElement('span', '\u{1F50D}', 'search-icon');

        this.searchContainer.append(searchIcon, this.searchInput);

        const tabsContainer = document.getElementById('tabs');
        const firstTabContent = document.querySelector('.tab-content');
        tabsContainer.parentNode.insertBefore(this.searchContainer, firstTabContent);
    },

    setupListeners() {
        this.searchInput.addEventListener('input', this.handleSearchInput.bind(this));
        TabManager.onTabChange(this.handleTabChange.bind(this));
    },

    handleSearchInput(e) {
        const term = e.target.value;

        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        this.searchTimeout = setTimeout(() => {
            searchService.setSearchTerm(term);
        }, 500);
    },

    handleTabChange() {
        if (searchService.getSearchTerm()) {
            this.searchInput.focus();
        }
    }
};

export default SearchComponent;
