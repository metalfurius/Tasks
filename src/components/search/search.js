// Modified code for src/components/search/search.js
import searchService from '../../services/searchService.js';
import TabManager from '../ui/tabs.js';

const SearchComponent = {
    searchInput: null,
    searchContainer: null,

    init() {
        this.createSearchUI();
        this.setupListeners();
    },

    createSearchUI() {
        // Create search container
        this.searchContainer = document.createElement('div');
        this.searchContainer.className = 'search-container';

        // Create search input
        this.searchInput = document.createElement('input');
        this.searchInput.type = 'text';
        this.searchInput.id = 'search-input';
        this.searchInput.placeholder = 'Search tasks...';
        this.searchInput.autocomplete = 'off';

        // Create search icon
        const searchIcon = document.createElement('span');
        searchIcon.className = 'search-icon';
        searchIcon.innerHTML = '🔍';

        // Assemble components
        this.searchContainer.appendChild(searchIcon);
        this.searchContainer.appendChild(this.searchInput);

        // Add to DOM - insert AFTER tabs container and BEFORE tab content
        const tabsContainer = document.getElementById('tabs');
        const firstTabContent = document.querySelector('.tab-content');
        tabsContainer.parentNode.insertBefore(this.searchContainer, firstTabContent);
    },

    setupListeners() {
        this.searchInput.addEventListener('input', this.handleSearchInput.bind(this));

        // Listen for tab changes to maintain search context
        TabManager.onTabChange(this.handleTabChange.bind(this));
    },

    handleSearchInput(e) {
        const term = e.target.value;

        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Set a delay before triggering search
        this.searchTimeout = setTimeout(() => {
            searchService.setSearchTerm(term);
        }, 500);
    },

    handleTabChange() {
        // Maintain search term across tab changes
        if (searchService.getSearchTerm()) {
            this.searchInput.focus();
        }
    }
};

export default SearchComponent;