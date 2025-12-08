// Performance Dashboard with AI-Powered Metric Extraction
class PerformanceDashboard {
    constructor() {
        this.metrics = [];
        this.charts = {};
        this.currentFilter = 'all';
        this.apiKey = null;
        this.init();
    }

    init() {
        // Configure PDF.js
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }

        this.loadApiKey();
        this.loadMetrics();
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        // Upload modal
        const uploadModal = document.getElementById('uploadModal');
        const addBtn = document.getElementById('addScreenshotBtn');
        const closeBtn = uploadModal.querySelector('.close');

        addBtn.addEventListener('click', () => this.openUploadModal());
        closeBtn.addEventListener('click', () => this.closeUploadModal());
        uploadModal.addEventListener('click', (e) => {
            if (e.target === uploadModal) this.closeUploadModal();
        });

        // Settings modal
        const settingsModal = document.getElementById('settingsModal');
        const settingsBtn = document.getElementById('settingsBtn');
        const closeSettingsBtn = settingsModal.querySelector('.close-settings');

        settingsBtn.addEventListener('click', () => this.openSettingsModal());
        closeSettingsBtn.addEventListener('click', () => this.closeSettingsModal());
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) this.closeSettingsModal();
        });

        // Settings actions
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        document.getElementById('testApiKey').addEventListener('click', () => this.testApiKey());

        // File input
        const fileInput = document.getElementById('fileInput');
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Drop zone
        const dropZone = document.getElementById('dropZone');
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        dropZone.addEventListener('drop', (e) => this.handleDrop(e));

        // Filter
        const filterSelect = document.getElementById('categoryFilter');
        filterSelect.addEventListener('change', (e) => this.filterMetrics(e.target.value));

        // Clear all
        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAll());

        // Prevent default drag behavior
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());
    }

    // Modal Management
    openUploadModal() {
        document.getElementById('uploadModal').classList.add('active');
    }

    closeUploadModal() {
        document.getElementById('uploadModal').classList.remove('active');
    }

    openSettingsModal() {
        const modal = document.getElementById('settingsModal');
        document.getElementById('apiKey').value = this.apiKey || '';
        modal.classList.add('active');
    }

    closeSettingsModal() {
        document.getElementById('settingsModal').classList.remove('active');
    }

    // API Key Management
    loadApiKey() {
        this.apiKey = localStorage.getItem('claude-api-key');
    }

    saveSettings() {
        const apiKey = document.getElementById('apiKey').value.trim();
        if (apiKey) {
            this.apiKey = apiKey;
            localStorage.setItem('claude-api-key', apiKey);
            this.showApiStatus('Settings saved successfully', 'success');
        } else {
            this.showApiStatus('Please enter an API key', 'error');
        }
    }

    async testApiKey() {
        const apiKey = document.getElementById('apiKey').value.trim();
        if (!apiKey) {
            this.showApiStatus('Please enter an API key first', 'error');
            return;
        }

        this.showApiStatus('Testing connection...', 'info');

        try {
            const response = await fetch('/api/claude', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey
                },
                body: JSON.stringify({
                    model: 'claude-3-5-sonnet-20241022',
                    max_tokens: 10,
                    messages: [{ role: 'user', content: 'test' }]
                })
            });

            if (response.ok) {
                this.showApiStatus('✓ Connection successful!', 'success');
            } else {
                const error = await response.json();
                this.showApiStatus(`✗ Error: ${error.error?.message || 'Invalid API key'}`, 'error');
            }
        } catch (error) {
            this.showApiStatus(`✗ Connection failed: ${error.message}. Make sure the proxy server is running (npm start)`, 'error');
        }
    }

    showApiStatus(message, type) {
        const statusDiv = document.getElementById('apiStatus');
        statusDiv.textContent = message;
        statusDiv.className = `api-status ${type}`;
        statusDiv.style.display = 'block';
    }

    // File Handling
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        const dropZone = document.getElementById('dropZone');
        dropZone.classList.remove('drag-over');

        const files = Array.from(e.dataTransfer.files).filter(file =>
            file.type.startsWith('image/') || file.type === 'application/pdf'
        );

        if (files.length > 0) {
            this.processFiles(files);
        } else {
            alert('Please upload image or PDF files');
        }
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files).filter(file =>
            file.type.startsWith('image/') || file.type === 'application/pdf'
        );

        if (files.length > 0) {
            this.processFiles(files);
        }
    }

    async processFiles(files) {
        if (!this.apiKey) {
            alert('Please configure your Claude API key in Settings first');
            this.openSettingsModal();
            return;
        }

        this.closeUploadModal();
        this.showLoading(`Analyzing ${files.length} file(s)...`);

        for (let i = 0; i < files.length; i++) {
            this.updateLoadingText(`Processing file ${i + 1} of ${files.length}...`);
            try {
                await this.processFile(files[i]);
            } catch (error) {
                console.error(`Error processing file ${i + 1}:`, error);
            }
        }

        this.hideLoading();
        this.saveMetrics();
        this.render();
    }

    async processFile(file) {
        // Convert file to base64
        const base64 = await this.fileToBase64(file);

        // Extract image data (remove data:image/...;base64, prefix)
        const imageData = base64.split(',')[1];

        // Determine media type
        let mediaType = 'image/jpeg';
        if (file.type === 'image/png') mediaType = 'image/png';
        else if (file.type === 'image/gif') mediaType = 'image/gif';
        else if (file.type === 'image/webp') mediaType = 'image/webp';

        // Call Claude API for vision analysis
        const metrics = await this.extractMetricsFromImage(imageData, mediaType, file.name);

        if (metrics && metrics.length > 0) {
            metrics.forEach(metric => {
                metric.id = Date.now() + Math.random();
                metric.uploadedAt = new Date().toISOString();
                metric.sourceFile = file.name;
                this.metrics.push(metric);
            });
        }
    }

    async extractMetricsFromImage(imageData, mediaType, filename) {
        try {
            const response = await fetch('/api/claude', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey
                },
                body: JSON.stringify({
                    model: 'claude-3-5-sonnet-20241022',
                    max_tokens: 2000,
                    messages: [{
                        role: 'user',
                        content: [
                            {
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: mediaType,
                                    data: imageData
                                }
                            },
                            {
                                type: 'text',
                                text: `Analyze this performance metrics screenshot and extract all numerical data. Return a JSON array of metrics in this exact format:

[
  {
    "category": "social-media" | "website" | "seo",
    "label": "Metric name",
    "value": "Formatted value with units",
    "numericValue": numeric value only,
    "change": "% change" or null,
    "changeDirection": "up" | "down" | "neutral" or null,
    "period": "time period" or null,
    "platform": "platform name" or null
  }
]

Examples:
- Followers: {"category": "social-media", "label": "Followers", "value": "125.5K", "numericValue": 125500, "change": "+12.5%", "changeDirection": "up", "period": "Last 30 days", "platform": "Instagram"}
- Page Views: {"category": "website", "label": "Page Views", "value": "45,230", "numericValue": 45230, "change": null, "changeDirection": null, "period": "Last month", "platform": null}

Extract ALL visible metrics. Be thorough.`
                            }
                        ]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            const text = data.content[0].text;

            // Extract JSON from response
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            return [];
        } catch (error) {
            console.error('Error extracting metrics:', error);
            return [];
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Loading Overlay
    showLoading(text) {
        const overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text" id="loadingText">${text}</div>
                <div class="loading-subtext">This may take a moment...</div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    updateLoadingText(text) {
        const loadingText = document.getElementById('loadingText');
        if (loadingText) loadingText.textContent = text;
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.remove();
    }

    // Data Management
    saveMetrics() {
        try {
            localStorage.setItem('dashboard-metrics', JSON.stringify(this.metrics));
        } catch (error) {
            console.error('Error saving metrics:', error);
        }
    }

    loadMetrics() {
        try {
            const stored = localStorage.getItem('dashboard-metrics');
            if (stored) {
                this.metrics = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading metrics:', error);
        }
    }

    filterMetrics(category) {
        this.currentFilter = category;
        this.render();
    }

    getFilteredMetrics() {
        if (this.currentFilter === 'all') {
            return this.metrics;
        }
        return this.metrics.filter(m => m.category === this.currentFilter);
    }

    clearAll() {
        if (confirm('Are you sure you want to delete all metrics? This action cannot be undone.')) {
            this.metrics = [];
            this.saveMetrics();
            this.render();
        }
    }

    deleteMetric(id) {
        if (confirm('Are you sure you want to delete this metric?')) {
            this.metrics = this.metrics.filter(m => m.id !== id);
            this.saveMetrics();
            this.render();
        }
    }

    // Rendering
    render() {
        const emptyState = document.getElementById('emptyState');
        const grid = document.getElementById('screenshotsGrid');
        const filtered = this.getFilteredMetrics();

        if (filtered.length === 0) {
            emptyState.style.display = 'flex';
            grid.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            grid.style.display = 'block';
            grid.innerHTML = this.renderMetricsView(filtered);
            this.attachMetricListeners(filtered);
            this.renderCharts(filtered);
        }
    }

    renderMetricsView(metrics) {
        const metricsHtml = metrics.map(metric => this.createMetricCard(metric)).join('');

        return `
            <div class="metrics-grid">
                ${metricsHtml}
            </div>
        `;
    }

    createMetricCard(metric) {
        const changeHtml = metric.change ? `
            <div class="metric-change ${metric.changeDirection === 'up' ? 'positive' : metric.changeDirection === 'down' ? 'negative' : ''}">
                ${metric.changeDirection === 'up' ? '↑' : metric.changeDirection === 'down' ? '↓' : ''} ${metric.change}
            </div>
        ` : '';

        const platformHtml = metric.platform ? `<span class="metric-source">from ${metric.platform}</span>` : '';
        const periodHtml = metric.period ? `<span class="metric-source">${metric.period}</span>` : '';

        return `
            <div class="metric-card">
                <div class="metric-header">
                    <div class="metric-label">${metric.label}</div>
                    <button class="icon-btn" data-delete-id="${metric.id}" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                    </button>
                </div>
                <div class="metric-value">${metric.value}</div>
                ${changeHtml}
                ${platformHtml}
                ${periodHtml}
            </div>
        `;
    }

    attachMetricListeners(metrics) {
        metrics.forEach(metric => {
            const deleteBtn = document.querySelector(`[data-delete-id="${metric.id}"]`);
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteMetric(metric.id);
                });
            }
        });
    }

    renderCharts(metrics) {
        // Group metrics by category for visualization
        const categories = {
            'social-media': metrics.filter(m => m.category === 'social-media'),
            'website': metrics.filter(m => m.category === 'website'),
            'seo': metrics.filter(m => m.category === 'seo')
        };

        // Clear existing charts
        Object.values(this.charts).forEach(chart => chart.destroy());
        this.charts = {};

        // You can add chart rendering logic here if needed
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    new PerformanceDashboard();
});
