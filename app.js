// Dashboard Application
class PerformanceDashboard {
    constructor() {
        this.screenshots = [];
        this.currentFilter = 'all';
        this.currentFile = null;
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        // Modal controls
        const modal = document.getElementById('uploadModal');
        const addBtn = document.getElementById('addScreenshotBtn');
        const closeBtn = document.querySelector('.close');
        const cancelBtn = document.getElementById('cancelUpload');

        addBtn.addEventListener('click', () => this.openModal());
        closeBtn.addEventListener('click', () => this.closeModal());
        cancelBtn.addEventListener('click', () => this.closeModal());

        // Click outside modal to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });

        // File input
        const fileInput = document.getElementById('fileInput');
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Drop zone
        const dropZone = document.getElementById('dropZone');
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        dropZone.addEventListener('drop', (e) => this.handleDrop(e));

        // Save screenshot
        const saveBtn = document.getElementById('saveScreenshot');
        saveBtn.addEventListener('click', () => this.saveScreenshot());

        // Filter
        const filterSelect = document.getElementById('categoryFilter');
        filterSelect.addEventListener('change', (e) => this.filterScreenshots(e.target.value));

        // Clear all
        const clearAllBtn = document.getElementById('clearAllBtn');
        clearAllBtn.addEventListener('click', () => this.clearAll());

        // Prevent default drag behavior on document
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());
    }

    openModal() {
        const modal = document.getElementById('uploadModal');
        modal.classList.add('active');
        this.resetUploadForm();
    }

    closeModal() {
        const modal = document.getElementById('uploadModal');
        modal.classList.remove('active');
        this.resetUploadForm();
    }

    resetUploadForm() {
        document.getElementById('dropZone').style.display = 'block';
        document.getElementById('uploadForm').style.display = 'none';
        document.getElementById('fileInput').value = '';
        document.getElementById('screenshotCategory').value = '';
        document.getElementById('screenshotTitle').value = '';
        document.getElementById('screenshotDescription').value = '';
        this.currentFile = null;
    }

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

        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            this.processFile(files[0]);
        } else {
            alert('Please upload an image file');
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.processFile(file);
        } else {
            alert('Please select an image file');
        }
    }

    processFile(file) {
        this.currentFile = file;
        const reader = new FileReader();

        reader.onload = (e) => {
            document.getElementById('imagePreview').src = e.target.result;
            document.getElementById('dropZone').style.display = 'none';
            document.getElementById('uploadForm').style.display = 'block';
        };

        reader.readAsDataURL(file);
    }

    saveScreenshot() {
        const category = document.getElementById('screenshotCategory').value;
        const title = document.getElementById('screenshotTitle').value;
        const description = document.getElementById('screenshotDescription').value;
        const imageData = document.getElementById('imagePreview').src;

        if (!category) {
            alert('Please select a category');
            return;
        }

        if (!imageData) {
            alert('Please upload an image');
            return;
        }

        const screenshot = {
            id: Date.now(),
            category,
            title: title || this.getDefaultTitle(category),
            description,
            imageData,
            createdAt: new Date().toISOString()
        };

        this.screenshots.unshift(screenshot);
        this.saveToStorage();
        this.render();
        this.closeModal();
    }

    getDefaultTitle(category) {
        const titles = {
            'social-media': 'Social Media Performance',
            'website': 'Website Analytics',
            'seo': 'SEO Performance'
        };
        return titles[category] || 'Performance Screenshot';
    }

    deleteScreenshot(id) {
        if (confirm('Are you sure you want to delete this screenshot?')) {
            this.screenshots = this.screenshots.filter(s => s.id !== id);
            this.saveToStorage();
            this.render();
        }
    }

    filterScreenshots(category) {
        this.currentFilter = category;
        this.render();
    }

    clearAll() {
        if (confirm('Are you sure you want to delete all screenshots? This action cannot be undone.')) {
            this.screenshots = [];
            this.saveToStorage();
            this.render();
        }
    }

    getFilteredScreenshots() {
        if (this.currentFilter === 'all') {
            return this.screenshots;
        }
        return this.screenshots.filter(s => s.category === this.currentFilter);
    }

    render() {
        const emptyState = document.getElementById('emptyState');
        const grid = document.getElementById('screenshotsGrid');
        const filtered = this.getFilteredScreenshots();

        if (filtered.length === 0) {
            emptyState.style.display = 'flex';
            grid.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            grid.style.display = 'grid';
            grid.innerHTML = filtered.map(screenshot => this.createScreenshotCard(screenshot)).join('');

            // Add delete event listeners
            filtered.forEach(screenshot => {
                const deleteBtn = document.getElementById(`delete-${screenshot.id}`);
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.deleteScreenshot(screenshot.id);
                    });
                }
            });

            // Add click to view full image
            filtered.forEach(screenshot => {
                const card = document.getElementById(`card-${screenshot.id}`);
                if (card) {
                    card.addEventListener('click', () => this.viewFullImage(screenshot));
                }
            });
        }
    }

    viewFullImage(screenshot) {
        const img = new Image();
        img.src = screenshot.imageData;

        const viewer = document.createElement('div');
        viewer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            cursor: pointer;
        `;

        img.style.cssText = `
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            border-radius: 8px;
        `;

        viewer.appendChild(img);
        document.body.appendChild(viewer);

        viewer.addEventListener('click', () => {
            document.body.removeChild(viewer);
        });
    }

    createScreenshotCard(screenshot) {
        const date = new Date(screenshot.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        const categoryLabels = {
            'social-media': 'Social Media',
            'website': 'Website',
            'seo': 'SEO'
        };

        return `
            <div class="screenshot-card" id="card-${screenshot.id}">
                <img src="${screenshot.imageData}" alt="${screenshot.title}">
                <div class="card-content">
                    <div class="card-header">
                        <span class="category-badge category-${screenshot.category}">
                            ${categoryLabels[screenshot.category]}
                        </span>
                        <div class="card-actions">
                            <button class="icon-btn" id="delete-${screenshot.id}" title="Delete">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <h3 class="card-title">${screenshot.title}</h3>
                    ${screenshot.description ? `<p class="card-description">${screenshot.description}</p>` : ''}
                    <p class="card-date">Uploaded ${date}</p>
                </div>
            </div>
        `;
    }

    saveToStorage() {
        try {
            localStorage.setItem('performance-dashboard', JSON.stringify(this.screenshots));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
            alert('Warning: Could not save to local storage. Your data may not persist.');
        }
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem('performance-dashboard');
            if (stored) {
                this.screenshots = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Error loading from localStorage:', e);
        }
    }
}

// Initialize the dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PerformanceDashboard();
});
