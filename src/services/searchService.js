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
    }
};

export default SearchService;