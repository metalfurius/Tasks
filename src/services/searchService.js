// src/services/searchService.js
const SearchService = {
    searchTerm: '',
    observers: [],

    setSearchTerm(term) {
        this.searchTerm = term.toLowerCase().trim();
        this.notifyObservers();
    },

    getSearchTerm() {
        return this.searchTerm;
    },

    clearSearch() {
        this.searchTerm = '';
        this.notifyObservers();
    },

    onSearchChanged(callback) {
        this.observers.push(callback);
        return () => {
            this.observers = this.observers.filter(observer => observer !== callback);
        };
    },

    notifyObservers() {
        this.observers.forEach(callback => callback(this.searchTerm));
    },

    filterBySearchTerm(items, textPropertyName = 'text') {
        if (!this.searchTerm) return items;

        return items.filter(item =>
            item[textPropertyName].toLowerCase().includes(this.searchTerm)
        );
    },

    isSearchActive() {
        return this.searchTerm.length > 0;
    },

    async performGlobalSearch() {
        if (!this.isSearchActive()) return null;

        try {
            // Import taskService here to avoid circular dependency
            const taskService = (await import('./taskService.js')).default;
            return await taskService.searchAllTasks(this.searchTerm);
        } catch (error) {
            console.error('Global search failed:', error);
            return null;
        }
    }
};

export default SearchService;