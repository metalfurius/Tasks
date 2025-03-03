// src/components/search/search.js
import searchService from '../../services/searchService.js';
import taskService from '../../services/taskService.js';
import TabManager from '../ui/tabs.js';

const SearchComponent = {
    searchInput: null,
    clearButton: null,
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

        // Create clear button
        this.clearButton = document.createElement('button');
        this.clearButton.className = 'search-clear-btn';
        this.clearButton.innerHTML = '&times;';
        this.clearButton.style.display = 'none';

        // Create search icon
        const searchIcon = document.createElement('span');
        searchIcon.className = 'search-icon';
        searchIcon.innerHTML = '🔍';

        // Assemble components
        this.searchContainer.appendChild(searchIcon);
        this.searchContainer.appendChild(this.searchInput);
        this.searchContainer.appendChild(this.clearButton);

        // Add to DOM - insert before tabs container
        const tabsContainer = document.getElementById('tabs');
        tabsContainer.parentNode.insertBefore(this.searchContainer, tabsContainer);
    },

    setupListeners() {
        this.searchInput.addEventListener('input', this.handleSearchInput.bind(this));
        this.clearButton.addEventListener('click', this.clearSearch.bind(this));

        // Listen for tab changes to maintain search context
        TabManager.onTabChange(this.handleTabChange.bind(this));
    },

    handleSearchInput(e) {
        const term = e.target.value;

        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        // Update UI immediately
        this.clearButton.style.display = term ? 'block' : 'none';

        // Set a delay before triggering search (only when user stops typing)
        this.searchTimeout = setTimeout(() => {
            searchService.setSearchTerm(term);
        }, 500); // Increased to 500ms for better user experience
    },

    clearSearch() {
        this.searchInput.value = '';
        searchService.clearSearch();
        this.clearButton.style.display = 'none';
        this.searchInput.focus();
    },

    handleTabChange() {
        // Maintain search term across tab changes
        if (searchService.getSearchTerm()) {
            this.searchInput.focus();
        }
    }
};

export default SearchComponent;