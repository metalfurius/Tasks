// src/components/ui/tabs.js

const TabManager = {
    // DOM elements
    tabsContainer: null,
    tabButtons: [],
    tabContents: [],

    // Current active tab
    activeTab: 'pending',

    // Tab change callbacks
    onTabChangeCallbacks: [],

    // Initialize tabs
    init(tabsContainerId = 'tabs') {
        this.tabsContainer = document.getElementById(tabsContainerId);
        if (!this.tabsContainer) return;

        this.tabButtons = Array.from(this.tabsContainer.querySelectorAll('.tab-button'));
        this.tabContents = Array.from(document.querySelectorAll('.tab-content'));

        this.setupListeners();

        // Set initial active tab
        const initialTab = this.tabButtons.find(btn => btn.classList.contains('active'));
        if (initialTab) {
            this.activeTab = initialTab.dataset.tab;
        } else if (this.tabButtons.length > 0) {
            this.setActiveTab(this.tabButtons[0].dataset.tab);
        }
    },

    // Setup event listeners
    setupListeners() {
        if (!this.tabsContainer) return;

        this.tabsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-button')) {
                const tabName = e.target.dataset.tab;
                this.setActiveTab(tabName);
            }
        });
    },

    // Set active tab
    setActiveTab(tabName) {
        // Skip if already active
        if (this.activeTab === tabName) return;

        // Deactivate all tabs
        this.tabButtons.forEach(btn => btn.classList.remove('active'));
        this.tabContents.forEach(content => content.classList.remove('active'));

        // Activate selected tab
        const selectedButton = this.tabButtons.find(btn => btn.dataset.tab === tabName);
        const selectedContent = document.getElementById(`${tabName}-tasks`);

        if (selectedButton) selectedButton.classList.add('active');
        if (selectedContent) selectedContent.classList.add('active');

        this.activeTab = tabName;

        // Notify observers
        this.onTabChangeCallbacks.forEach(callback => callback(tabName));
    },

    // Register tab change callback
    onTabChange(callback) {
        this.onTabChangeCallbacks.push(callback);
        // Return unsubscribe function
        return () => {
            this.onTabChangeCallbacks = this.onTabChangeCallbacks.filter(cb => cb !== callback);
        };
    },

    // Get active tab
    getActiveTab() {
        return this.activeTab;
    }
};

export default TabManager;