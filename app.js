'use strict';

// ============================================================
//  TRACKER APP
// ============================================================
class TrackerApp {
    constructor() {
        this.data = this.load();
        this.charts = {};
        this.activeTab = 'overview';
        this.init();
    }

    // =========================================================
    //  DATA PERSISTENCE
    // =========================================================
    load() {
        try {
            const raw = localStorage.getItem('tracker-v1');
            if (raw) return JSON.parse(raw);
        } catch (_) {}
        return {
            settings: { weightUnit: 'kg', measureUnit: 'cm', yourName: 'You', husbandName: 'Him' },
            weights: [],       // { id, date, value, note }
            measurements: [],  // { id, date, chest, waist, hips, thigh, arm, neck }
            bets: []           // { id, type, targetDate, youGuess, himGuess, actual, winner, resolved, resolvedDate }
        };
    }

    save() {
        localStorage.setItem('tracker-v1', JSON.stringify(this.data));
    }

    // =========================================================
    //  INIT
    // =========================================================
    init() {
        this.setupTabs();
        this.setupModals();
        this.setupForms();
        this.setupSettings();
        this.applySettings();
        this.render();
    }

    // =========================================================
    //  TABS
    // =========================================================
    setupTabs() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
    }

    switchTab(tab) {
        this.activeTab = tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
        document.querySelectorAll('.tab-content').forEach(s => s.classList.toggle('active', s.id === `tab-${tab}`));
        this.render();
    }

    // =========================================================
    //  MODALS
    // =========================================================
    setupModals() {
        // Generic close handlers
        document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
            btn.addEventListener('click', () => this.closeAllModals());
        });
        document.querySelectorAll('.modal-backdrop').forEach(bd => {
            bd.addEventListener('click', () => this.closeAllModals());
        });

        // Log Weight triggers
        document.getElementById('logWeightBtn').addEventListener('click', () => this.openWeightModal());

        // Log Measurements triggers
        document.getElementById('logMeasurementsBtn').addEventListener('click', () => this.openMeasurementsModal());

        // Bet triggers
        document.getElementById('placeBetWeightBtn').addEventListener('click', () => this.openWeightBetModal());
        document.getElementById('placeBetMeasurementsBtn').addEventListener('click', () => this.openMeasurementsBetModal());
        document.getElementById('overviewPlaceBetBtn').addEventListener('click', () => this.openWeightBetModal());
        document.getElementById('newWeightBetBtn').addEventListener('click', () => this.openWeightBetModal());
        document.getElementById('newMeasurementsBetBtn').addEventListener('click', () => this.openMeasurementsBetModal());

        // Chart range
        document.getElementById('weightChartRange').addEventListener('change', e => {
            this.renderWeightChart(parseInt(e.target.value));
        });
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('open'));
    }

    openModal(id) {
        this.closeAllModals();
        document.getElementById(id).classList.add('open');
    }

    openWeightModal(prefill = null) {
        const form = document.getElementById('weightForm');
        form.reset();
        document.getElementById('weightDate').value = prefill || this.today();
        this.openModal('weightModal');
    }

    openMeasurementsModal(prefill = null) {
        const form = document.getElementById('measurementsForm');
        form.reset();
        document.getElementById('measureDate').value = prefill || this.today();
        this.openModal('measurementsModal');
    }

    openWeightBetModal() {
        const form = document.getElementById('weightBetForm');
        form.reset();
        document.getElementById('betWeightDate').value = this.tomorrow();
        this.openModal('weightBetModal');
    }

    openMeasurementsBetModal() {
        const form = document.getElementById('measurementsBetForm');
        form.reset();
        // Default to 2 weeks from today
        document.getElementById('betMeasureDate').value = this.daysFromNow(14);
        this.openModal('measurementsBetModal');
    }

    openResolveModal(betId) {
        const bet = this.data.bets.find(b => b.id === betId);
        if (!bet) return;

        const { yourName, husbandName } = this.data.settings;
        const modal = document.getElementById('resolveModal');
        document.getElementById('resolveModalTitle').textContent = `Resolve Bet — ${this.formatDate(bet.targetDate)}`;

        let html = '';
        if (bet.type === 'weight') {
            const u = this.wu();
            html = `
                <p class="modal-desc">Enter the actual morning weight to determine the winner.</p>
                <div class="bet-guesses-row" style="margin-bottom:1.25rem">
                    <div class="bet-guess">
                        <span class="bet-guess-label">${yourName}'s Guess</span>
                        <span class="bet-guess-val you-val">${bet.youGuess} ${u}</span>
                    </div>
                    <span class="bet-vs">VS</span>
                    <div class="bet-guess">
                        <span class="bet-guess-label">${husbandName}'s Guess</span>
                        <span class="bet-guess-val him-val">${bet.himGuess} ${u}</span>
                    </div>
                </div>
                <div class="form-group">
                    <label for="resolveWeight">Actual Weight (${u})</label>
                    <input type="number" id="resolveWeight" class="input" step="0.1" min="0" placeholder="e.g. 145.2" required>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-ghost modal-cancel">Cancel</button>
                    <button class="btn btn-primary" id="resolveConfirmBtn">Confirm Result</button>
                </div>
            `;
        } else {
            const mu = this.mu();
            const fields = ['bicep','bust','waist','hips','butt','thigh','calf'];
            const labels = { bicep:'Bicep', bust:'Bust', waist:'Waist', hips:'Hips', butt:'Butt', thigh:'Thigh', calf:'Calf' };
            const guessRows = fields.map(f => `
                <tr>
                    <td>${labels[f]}</td>
                    <td class="you-val" style="color:var(--you);font-weight:600">${bet.youGuess[f] != null ? bet.youGuess[f]+' '+mu : '—'}</td>
                    <td class="him-val" style="color:var(--him);font-weight:600">${bet.himGuess[f] != null ? bet.himGuess[f]+' '+mu : '—'}</td>
                    <td><input type="number" class="input" data-field="${f}" id="resolveM_${f}" step="0.1" min="0" placeholder="actual" style="width:90px;padding:0.4rem 0.6rem;font-size:0.85rem"></td>
                </tr>
            `).join('');
            html = `
                <p class="modal-desc">Enter actual measurements to determine the winner. Closest total error wins!</p>
                <div style="overflow-x:auto;margin-bottom:1.25rem">
                    <table class="data-table">
                        <thead><tr><th>Measurement</th><th style="color:var(--you)">${yourName}</th><th style="color:var(--him)">${husbandName}</th><th>Actual</th></tr></thead>
                        <tbody>${guessRows}</tbody>
                    </table>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-ghost modal-cancel">Cancel</button>
                    <button class="btn btn-primary" id="resolveConfirmBtn">Confirm Result</button>
                </div>
            `;
        }

        document.getElementById('resolveModalContent').innerHTML = html;

        // Re-attach cancel listener
        document.querySelectorAll('.modal-cancel').forEach(b => b.addEventListener('click', () => this.closeAllModals()));

        document.getElementById('resolveConfirmBtn').addEventListener('click', () => {
            this.resolvebet(bet.id, bet.type);
        });

        this.openModal('resolveModal');
    }

    // =========================================================
    //  FORMS
    // =========================================================
    setupForms() {
        document.getElementById('weightForm').addEventListener('submit', e => {
            e.preventDefault();
            this.saveWeight();
        });

        document.getElementById('measurementsForm').addEventListener('submit', e => {
            e.preventDefault();
            this.saveMeasurements();
        });

        document.getElementById('weightBetForm').addEventListener('submit', e => {
            e.preventDefault();
            this.saveWeightBet();
        });

        document.getElementById('measurementsBetForm').addEventListener('submit', e => {
            e.preventDefault();
            this.saveMeasurementsBet();
        });
    }

    saveWeight() {
        const date  = document.getElementById('weightDate').value;
        const value = parseFloat(document.getElementById('weightValue').value);
        const note  = document.getElementById('weightNote').value.trim();
        if (!date || isNaN(value) || value <= 0) return;

        // Prevent duplicate for same date
        const existing = this.data.weights.findIndex(w => w.date === date);
        if (existing >= 0) {
            this.data.weights[existing] = { ...this.data.weights[existing], value, note };
            this.toast('Weight updated!');
        } else {
            this.data.weights.push({ id: this.uid(), date, value, note });
            this.toast('Weight logged!');
        }

        this.data.weights.sort((a, b) => a.date.localeCompare(b.date));
        this.save();
        this.closeAllModals();
        this.render();
    }

    saveMeasurements() {
        const date = document.getElementById('measureDate').value;
        if (!date) return;
        const entry = {
            id:    this.uid(),
            date,
            bicep: this.numInput('measureBicep'),
            bust:  this.numInput('measureBust'),
            waist: this.numInput('measureWaist'),
            hips:  this.numInput('measureHips'),
            butt:  this.numInput('measureButt'),
            thigh: this.numInput('measureThigh'),
            calf:  this.numInput('measureCalf'),
        };

        // Update or insert
        const existing = this.data.measurements.findIndex(m => m.date === date);
        if (existing >= 0) {
            this.data.measurements[existing] = { ...this.data.measurements[existing], ...entry, id: this.data.measurements[existing].id };
            this.toast('Measurements updated!');
        } else {
            this.data.measurements.push(entry);
            this.toast('Measurements logged!');
        }

        this.data.measurements.sort((a, b) => a.date.localeCompare(b.date));
        this.save();
        this.closeAllModals();
        this.render();
    }

    saveWeightBet() {
        const targetDate = document.getElementById('betWeightDate').value;
        const youGuess   = parseFloat(document.getElementById('betWeightYou').value);
        const himGuess   = parseFloat(document.getElementById('betWeightHim').value);
        if (!targetDate || isNaN(youGuess) || isNaN(himGuess)) return;

        this.data.bets.push({
            id: this.uid(), type: 'weight', targetDate,
            youGuess, himGuess,
            actual: null, winner: null, resolved: false, resolvedDate: null
        });
        this.save();
        this.closeAllModals();
        this.toast('Bet placed! Good luck!');
        this.render();
    }

    saveMeasurementsBet() {
        const form = document.getElementById('measurementsBetForm');
        const targetDate = document.getElementById('betMeasureDate').value;
        if (!targetDate) return;

        const fields = ['bicep','bust','waist','hips','butt','thigh','calf'];
        const youGuess = {}, himGuess = {};
        fields.forEach(f => {
            const youEl = form.querySelector(`[name="you${f.charAt(0).toUpperCase()+f.slice(1)}"]`);
            const himEl = form.querySelector(`[name="him${f.charAt(0).toUpperCase()+f.slice(1)}"]`);
            youGuess[f] = youEl && youEl.value !== '' ? parseFloat(youEl.value) : null;
            himGuess[f] = himEl && himEl.value !== '' ? parseFloat(himEl.value) : null;
        });

        this.data.bets.push({
            id: this.uid(), type: 'measurements', targetDate,
            youGuess, himGuess,
            actual: null, winner: null, resolved: false, resolvedDate: null
        });
        this.save();
        this.closeAllModals();
        this.toast('Bet placed! Good luck!');
        this.render();
    }

    resolvebet(betId, type) {
        const bet = this.data.bets.find(b => b.id === betId);
        if (!bet) return;

        if (type === 'weight') {
            const actualEl = document.getElementById('resolveWeight');
            const actual = parseFloat(actualEl.value);
            if (isNaN(actual) || actual <= 0) { this.toast('Please enter a valid weight'); return; }

            const youDiff = Math.abs(actual - bet.youGuess);
            const himDiff = Math.abs(actual - bet.himGuess);
            let winner;
            if (youDiff < himDiff)      winner = 'you';
            else if (himDiff < youDiff) winner = 'him';
            else                        winner = 'tie';

            bet.actual = actual;
            bet.winner = winner;
            bet.resolved = true;
            bet.resolvedDate = this.today();
        } else {
            const fields = ['bicep','bust','waist','hips','butt','thigh','calf'];
            const actual = {};
            fields.forEach(f => {
                const el = document.getElementById(`resolveM_${f}`);
                actual[f] = el && el.value !== '' ? parseFloat(el.value) : null;
            });

            // Compute total absolute error for guessed fields
            let youTotal = 0, himTotal = 0, count = 0;
            fields.forEach(f => {
                if (actual[f] == null) return;
                if (bet.youGuess[f] != null) { youTotal += Math.abs(actual[f] - bet.youGuess[f]); count++; }
                if (bet.himGuess[f] != null) { himTotal += Math.abs(actual[f] - bet.himGuess[f]); count++; }
            });

            let winner;
            if (count === 0) { this.toast('Please enter at least one actual measurement'); return; }
            if (youTotal < himTotal)      winner = 'you';
            else if (himTotal < youTotal) winner = 'him';
            else                          winner = 'tie';

            bet.actual = actual;
            bet.winner = winner;
            bet.resolved = true;
            bet.resolvedDate = this.today();
        }

        this.save();
        this.closeAllModals();

        const name = bet.winner === 'you' ? this.data.settings.yourName
                   : bet.winner === 'him' ? this.data.settings.husbandName
                   : null;
        if (name) this.toast(`${name} wins this bet!`);
        else      this.toast("It's a tie!");
        this.render();
    }

    deleteBet(id) {
        this.data.bets = this.data.bets.filter(b => b.id !== id);
        this.save();
        this.render();
    }

    deleteWeight(id) {
        this.data.weights = this.data.weights.filter(w => w.id !== id);
        this.save();
        this.render();
    }

    deleteMeasurement(id) {
        this.data.measurements = this.data.measurements.filter(m => m.id !== id);
        this.save();
        this.render();
    }

    // =========================================================
    //  SETTINGS
    // =========================================================
    setupSettings() {
        document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveSettings());
        document.getElementById('clearDataBtn').addEventListener('click', () => {
            if (confirm('Delete ALL data? This cannot be undone.')) {
                this.data.weights = [];
                this.data.measurements = [];
                this.data.bets = [];
                this.save();
                this.toast('All data cleared.');
                this.render();
            }
        });
    }

    saveSettings() {
        const wu = document.querySelector('input[name="weightUnit"]:checked')?.value || 'lbs';
        const mu = document.querySelector('input[name="measureUnit"]:checked')?.value || 'in';
        const yourName     = document.getElementById('yourName').value.trim() || 'You';
        const husbandName  = document.getElementById('husbandName').value.trim() || 'Him';
        this.data.settings = { weightUnit: wu, measureUnit: mu, yourName, husbandName };
        this.save();
        this.applySettings();
        this.toast('Settings saved!');
        this.render();
    }

    applySettings() {
        const { weightUnit, measureUnit, yourName, husbandName } = this.data.settings;

        // Sync radio buttons
        const wuRadio = document.querySelector(`input[name="weightUnit"][value="${weightUnit}"]`);
        if (wuRadio) wuRadio.checked = true;
        const muRadio = document.querySelector(`input[name="measureUnit"][value="${measureUnit}"]`);
        if (muRadio) muRadio.checked = true;

        // Sync text inputs
        document.getElementById('yourName').value = yourName;
        document.getElementById('husbandName').value = husbandName;

        // Update unit labels
        document.querySelectorAll('.unit-label').forEach(el => el.textContent = weightUnit);
        document.querySelectorAll('.measure-unit-label').forEach(el => el.textContent = measureUnit);

        // Update display names
        document.querySelectorAll('#husbandNameDisplay').forEach(el => el.textContent = husbandName);
    }

    // =========================================================
    //  RENDER
    // =========================================================
    render() {
        this.applySettings();
        this.renderScoreboard();
        switch (this.activeTab) {
            case 'overview':     this.renderOverview(); break;
            case 'weight':       this.renderWeightTab(); break;
            case 'measurements': this.renderMeasurementsTab(); break;
            case 'bets':         this.renderBetsTab(); break;
        }
    }

    renderScoreboard() {
        const { yourName, husbandName } = this.data.settings;
        const resolved = this.data.bets.filter(b => b.resolved);
        const youWins = resolved.filter(b => b.winner === 'you').length;
        const himWins = resolved.filter(b => b.winner === 'him').length;

        document.getElementById('statYouWins').textContent = youWins;
        document.getElementById('statHimWins').textContent = himWins;
        document.getElementById('youWinsDisplay').textContent = youWins;
        document.getElementById('himWinsDisplay').textContent = himWins;
        document.getElementById('headerScore').textContent = `${yourName} ${youWins} – ${himWins} ${husbandName}`;
    }

    // -- OVERVIEW -------------------------------------------------------
    renderOverview() {
        this.renderStatCards();
        this.renderOverviewWeightChart();
        this.renderOverviewMeasurementsChart();
        this.renderOverviewActiveBets();
        this.renderOverviewBetHistory();
    }

    renderStatCards() {
        const wu = this.wu();
        const mu = this.mu();

        // Current weight
        const latestW = this.data.weights[this.data.weights.length - 1];
        const prevW   = this.data.weights[this.data.weights.length - 2];
        document.getElementById('statCurrentWeight').textContent = latestW ? `${latestW.value} ${wu}` : '—';
        if (latestW && prevW) {
            const diff = (latestW.value - prevW.value).toFixed(1);
            const el = document.getElementById('statWeightDelta');
            el.textContent = (diff > 0 ? '+' : '') + diff + ' ' + wu;
            el.className = 'stat-delta ' + (diff > 0 ? 'up' : diff < 0 ? 'down' : '');
        } else {
            document.getElementById('statWeightDelta').textContent = '';
        }

        // Latest waist
        const latestM = this.data.measurements[this.data.measurements.length - 1];
        const prevM   = this.data.measurements[this.data.measurements.length - 2];
        document.getElementById('statCurrentWaist').textContent = latestM?.waist != null ? `${latestM.waist} ${mu}` : '—';
        if (latestM?.waist != null && prevM?.waist != null) {
            const diff = (latestM.waist - prevM.waist).toFixed(1);
            const el = document.getElementById('statWaistDelta');
            el.textContent = (diff > 0 ? '+' : '') + diff + ' ' + mu;
            el.className = 'stat-delta ' + (diff > 0 ? 'up' : diff < 0 ? 'down' : '');
        } else {
            document.getElementById('statWaistDelta').textContent = '';
        }
    }

    renderOverviewWeightChart() {
        const last30 = this.getWeightEntries(30);
        const empty  = document.getElementById('overviewWeightEmpty');
        if (last30.length === 0) {
            empty.style.display = 'block';
            this.destroyChart('overviewWeight');
            return;
        }
        empty.style.display = 'none';
        this.buildWeightChart('overviewWeightChart', 'overviewWeight', last30);
    }

    renderOverviewMeasurementsChart() {
        const entries = this.data.measurements;
        const empty = document.getElementById('overviewMeasurementsEmpty');
        if (entries.length === 0) {
            empty.style.display = 'block';
            this.destroyChart('overviewMeasurements');
            return;
        }
        empty.style.display = 'none';
        this.buildMeasurementsChart('overviewMeasurementsChart', 'overviewMeasurements', entries, ['waist','hips','butt']);
    }

    renderOverviewActiveBets() {
        const active = this.data.bets.filter(b => !b.resolved);
        const container = document.getElementById('overviewActiveBets');
        if (active.length === 0) {
            container.innerHTML = '<p class="empty-msg">No active bets. Place one!</p>';
            return;
        }
        container.innerHTML = active.slice(-4).reverse().map(b => this.betCardHTML(b)).join('');
        this.attachBetCardListeners(container);
    }

    renderOverviewBetHistory() {
        const resolved = this.data.bets.filter(b => b.resolved).slice(-4).reverse();
        const container = document.getElementById('overviewBetHistory');
        if (resolved.length === 0) {
            container.innerHTML = '<p class="empty-msg">No resolved bets yet.</p>';
            return;
        }
        container.innerHTML = resolved.map(b => this.betCardHTML(b)).join('');
        this.attachBetCardListeners(container);
    }

    // -- WEIGHT TAB -------------------------------------------------------
    renderWeightTab() {
        this.renderWeightChart(parseInt(document.getElementById('weightChartRange').value) || 30);
        this.renderWeightTable();
    }

    renderWeightChart(days) {
        const entries = this.getWeightEntries(days);
        const empty   = document.getElementById('weightChartEmpty');
        if (entries.length === 0) {
            empty.style.display = 'block';
            document.getElementById('weightChart').style.display = 'none';
            this.destroyChart('weightMain');
            return;
        }
        empty.style.display = 'none';
        document.getElementById('weightChart').style.display = 'block';
        this.buildWeightChart('weightChart', 'weightMain', entries);
    }

    renderWeightTable() {
        const tbody = document.getElementById('weightTableBody');
        const entries = [...this.data.weights].reverse();
        const wu = this.wu();

        if (entries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-row">No entries yet</td></tr>';
            return;
        }

        tbody.innerHTML = entries.map((w, i) => {
            const prev = entries[i + 1];
            let changeHTML = '<span class="change-none">—</span>';
            if (prev) {
                const diff = (w.value - prev.value).toFixed(1);
                const cls  = diff > 0 ? 'change-up' : diff < 0 ? 'change-down' : 'change-none';
                const sign = diff > 0 ? '+' : '';
                changeHTML = `<span class="${cls}">${sign}${diff} ${wu}</span>`;
            }
            return `
                <tr>
                    <td>${this.formatDate(w.date)}</td>
                    <td><strong>${w.value} ${wu}</strong>${w.note ? `<br><small style="color:var(--text-light)">${this.escape(w.note)}</small>` : ''}</td>
                    <td>${changeHTML}</td>
                    <td><button class="btn-delete" data-delete-weight="${w.id}" title="Delete">✕</button></td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('[data-delete-weight]').forEach(btn => {
            btn.addEventListener('click', () => this.deleteWeight(btn.dataset.deleteWeight));
        });
    }

    // -- MEASUREMENTS TAB -------------------------------------------------------
    renderMeasurementsTab() {
        const entries = this.data.measurements;
        const empty = document.getElementById('measurementsChartEmpty');

        if (entries.length === 0) {
            empty.style.display = 'block';
            document.getElementById('measurementsChart').style.display = 'none';
            document.getElementById('measurementsLegend').innerHTML = '';
            this.destroyChart('measurementsMain');
        } else {
            empty.style.display = 'none';
            document.getElementById('measurementsChart').style.display = 'block';
            this.buildMeasurementsChart('measurementsChart', 'measurementsMain', entries, ['bicep','bust','waist','hips','butt','thigh','calf']);
        }

        this.renderMeasurementsTable();
    }

    renderMeasurementsTable() {
        const tbody = document.getElementById('measurementsTableBody');
        const entries = [...this.data.measurements].reverse();
        const mu = this.mu();

        if (entries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="empty-row">No entries yet</td></tr>';
            return;
        }

        const fmtM = (cur, prev, field) => {
            if (cur[field] == null) return '—';
            let str = `${cur[field]}`;
            if (prev && prev[field] != null) {
                const diff = (cur[field] - prev[field]).toFixed(1);
                const cls  = diff > 0 ? 'change-up' : diff < 0 ? 'change-down' : 'change-none';
                const sign = diff > 0 ? '+' : '';
                str += ` <span class="${cls}">(${sign}${diff})</span>`;
            }
            return str;
        };

        tbody.innerHTML = entries.map((m, i) => {
            const prev = entries[i + 1];
            return `
                <tr>
                    <td>${this.formatDate(m.date)}</td>
                    <td>${fmtM(m, prev, 'bicep')}</td>
                    <td>${fmtM(m, prev, 'bust')}</td>
                    <td>${fmtM(m, prev, 'waist')}</td>
                    <td>${fmtM(m, prev, 'hips')}</td>
                    <td>${fmtM(m, prev, 'butt')}</td>
                    <td>${fmtM(m, prev, 'thigh')}</td>
                    <td>${fmtM(m, prev, 'calf')}</td>
                    <td><button class="btn-delete" data-delete-measure="${m.id}" title="Delete">✕</button></td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('[data-delete-measure]').forEach(btn => {
            btn.addEventListener('click', () => this.deleteMeasurement(btn.dataset.deleteMeasure));
        });
    }

    // -- BETS TAB -------------------------------------------------------
    renderBetsTab() {
        const active   = this.data.bets.filter(b => !b.resolved).reverse();
        const resolved = this.data.bets.filter(b => b.resolved).reverse();

        const activeEl = document.getElementById('activeBetsList');
        if (active.length === 0) {
            activeEl.innerHTML = '<p class="empty-msg">No active bets. Place a new one!</p>';
        } else {
            activeEl.innerHTML = active.map(b => this.betCardHTML(b)).join('');
            this.attachBetCardListeners(activeEl);
        }

        const historyEl = document.getElementById('betHistoryList');
        if (resolved.length === 0) {
            historyEl.innerHTML = '<p class="empty-msg">No resolved bets yet.</p>';
        } else {
            historyEl.innerHTML = resolved.map(b => this.betCardHTML(b)).join('');
            this.attachBetCardListeners(historyEl);
        }
    }

    // =========================================================
    //  BET CARD HTML
    // =========================================================
    betCardHTML(bet) {
        const { yourName, husbandName } = this.data.settings;
        const u = bet.type === 'weight' ? this.wu() : this.mu();
        const typeLabel = bet.type === 'weight' ? '⚖️ Weight' : '📏 Measurements';

        let cardClass = 'bet-card';
        if (!bet.resolved) cardClass += ' bet-card-active';
        else if (bet.winner === 'you') cardClass += ' bet-card-won-you';
        else if (bet.winner === 'him') cardClass += ' bet-card-won-him';
        else cardClass += ' bet-card-tie';

        let guessesHTML = '';
        if (bet.type === 'weight') {
            guessesHTML = `
                <div class="bet-guesses-row">
                    <div class="bet-guess">
                        <span class="bet-guess-label">${yourName}</span>
                        <span class="bet-guess-val you-val">${bet.youGuess} ${u}</span>
                    </div>
                    <span class="bet-vs">VS</span>
                    <div class="bet-guess">
                        <span class="bet-guess-label">${husbandName}</span>
                        <span class="bet-guess-val him-val">${bet.himGuess} ${u}</span>
                    </div>
                    ${bet.resolved ? `
                    <span class="bet-vs">→</span>
                    <div class="bet-guess">
                        <span class="bet-guess-label">Actual</span>
                        <span class="bet-guess-val actual-val">${bet.actual} ${u}</span>
                    </div>` : ''}
                </div>
            `;
        } else {
            const fields = ['bicep','bust','waist','hips','butt','thigh','calf'];
            const labels = { bicep:'Bicep', bust:'Bust', waist:'Waist', hips:'Hips', butt:'Butt', thigh:'Thigh', calf:'Calf' };
            const guessedFields = fields.filter(f => bet.youGuess[f] != null || bet.himGuess[f] != null);
            const summary = guessedFields.map(f => `
                <span class="bet-guess" style="font-size:0.8rem">
                    <span class="bet-guess-label">${labels[f]}</span>
                    <span style="display:flex;gap:0.4rem;align-items:center">
                        <span style="color:var(--you);font-weight:700">${bet.youGuess[f] ?? '—'}</span>
                        <span style="color:var(--text-light);font-size:0.7rem">vs</span>
                        <span style="color:var(--him);font-weight:700">${bet.himGuess[f] ?? '—'}</span>
                        ${bet.resolved && bet.actual?.[f] != null ? `<span style="color:var(--text-muted);font-size:0.7rem">→${bet.actual[f]}</span>` : ''}
                    </span>
                </span>
            `).join('');
            guessesHTML = `<div style="display:flex;flex-wrap:wrap;gap:0.75rem;margin-top:0.25rem">${summary}</div>`;
        }

        let winnerHTML = '';
        if (bet.resolved) {
            if (bet.winner === 'you')  winnerHTML = `<span class="bet-winner-badge winner-you">🏆 ${yourName} wins!</span>`;
            else if (bet.winner === 'him') winnerHTML = `<span class="bet-winner-badge winner-him">🏆 ${husbandName} wins!</span>`;
            else                       winnerHTML = `<span class="bet-winner-badge winner-tie">🤝 Tie!</span>`;
        }

        let actionsHTML = '';
        if (!bet.resolved) {
            actionsHTML = `
                <div class="bet-actions">
                    <button class="btn-resolve" data-resolve="${bet.id}">✓ Enter Result</button>
                    <button class="btn-delete" data-delete-bet="${bet.id}" title="Delete bet">✕ Delete</button>
                </div>
            `;
        }

        return `
            <div class="${cardClass}">
                <div class="bet-top">
                    <span class="bet-type-badge">${typeLabel}</span>
                    <span class="bet-date">Target: ${this.formatDate(bet.targetDate)}</span>
                </div>
                ${guessesHTML}
                ${winnerHTML}
                ${actionsHTML}
            </div>
        `;
    }

    attachBetCardListeners(container) {
        container.querySelectorAll('[data-resolve]').forEach(btn => {
            btn.addEventListener('click', () => this.openResolveModal(btn.dataset.resolve));
        });
        container.querySelectorAll('[data-delete-bet]').forEach(btn => {
            btn.addEventListener('click', () => this.deleteBet(btn.dataset.deleteBet));
        });
    }

    // =========================================================
    //  CHARTS
    // =========================================================
    destroyChart(key) {
        if (this.charts[key]) {
            this.charts[key].destroy();
            delete this.charts[key];
        }
    }

    buildWeightChart(canvasId, key, entries) {
        try {
        this.destroyChart(key);
        const ctx = document.getElementById(canvasId)?.getContext('2d');
        if (!ctx) return;

        const labels = entries.map(e => this.shortDate(e.date));
        const values = entries.map(e => e.value);
        const wu     = this.wu();

        // Trend line (simple linear regression)
        const n = values.length;
        const xMean = (n - 1) / 2;
        const yMean = values.reduce((a, b) => a + b, 0) / n;
        const slope = values.reduce((s, y, i) => s + (i - xMean) * (y - yMean), 0)
                    / values.reduce((s, _, i) => s + (i - xMean) ** 2, 1e-9);
        const intercept = yMean - slope * xMean;
        const trendData = values.map((_, i) => +(intercept + slope * i).toFixed(2));

        this.charts[key] = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: `Weight (${wu})`,
                        data: values,
                        borderColor: '#e11d48',
                        backgroundColor: 'rgba(225,29,72,0.08)',
                        fill: true,
                        tension: 0.35,
                        pointBackgroundColor: '#e11d48',
                        pointRadius: n <= 20 ? 4 : 2,
                        pointHoverRadius: 6,
                        borderWidth: 2.5,
                    },
                    {
                        label: 'Trend',
                        data: trendData,
                        borderColor: 'rgba(225,29,72,0.3)',
                        borderDash: [6,4],
                        borderWidth: 1.5,
                        pointRadius: 0,
                        fill: false,
                        tension: 0,
                    }
                ]
            },
            options: this.chartOptions(wu)
        });
        } catch(e) { console.warn('Chart error:', e); }
    }

    buildMeasurementsChart(canvasId, key, entries, fields) {
        try {
        this.destroyChart(key);
        const ctx = document.getElementById(canvasId)?.getContext('2d');
        if (!ctx) return;

        const labels = entries.map(e => this.shortDate(e.date));
        const colors = {
            bicep: '#f97316',
            bust:  '#e11d48',
            waist: '#7c3aed',
            hips:  '#0ea5e9',
            butt:  '#ec4899',
            thigh: '#d97706',
            calf:  '#059669'
        };
        const fieldLabels = {
            bicep: 'Bicep', bust: 'Bust', waist: 'Waist', hips: 'Hips',
            butt: 'Butt', thigh: 'Thigh', calf: 'Calf'
        };
        const mu = this.mu();

        const datasets = fields
            .filter(f => entries.some(e => e[f] != null))
            .map(f => ({
                label: fieldLabels[f],
                data: entries.map(e => e[f] ?? null),
                borderColor: colors[f],
                backgroundColor: colors[f] + '18',
                fill: false,
                tension: 0.35,
                pointRadius: entries.length <= 12 ? 4 : 2,
                pointHoverRadius: 6,
                borderWidth: 2.5,
                spanGaps: true,
            }));

        if (datasets.length === 0) return;

        this.charts[key] = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: this.chartOptions(mu)
        });

        // Build legend for measurements tab
        const legendEl = document.getElementById('measurementsLegend');
        if (legendEl) {
            legendEl.innerHTML = datasets.map(d => `
                <span class="legend-item">
                    <span class="legend-dot" style="background:${d.borderColor}"></span>
                    ${d.label}
                </span>
            `).join('');
        }
        } catch(e) { console.warn('Chart error:', e); }
    }

    chartOptions(unit) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1c1917',
                    titleColor: '#fafaf9',
                    bodyColor: '#d4d4d4',
                    padding: 10,
                    cornerRadius: 8,
                    callbacks: {
                        label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} ${unit}`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#a8a29e', font: { size: 11 }, maxTicksLimit: 10 }
                },
                y: {
                    grid: { color: '#f0e0e4' },
                    ticks: { color: '#a8a29e', font: { size: 11 } }
                }
            }
        };
    }

    // =========================================================
    //  HELPERS
    // =========================================================
    uid() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    today() {
        return new Date().toISOString().slice(0, 10);
    }

    tomorrow() {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().slice(0, 10);
    }

    daysFromNow(n) {
        const d = new Date();
        d.setDate(d.getDate() + n);
        return d.toISOString().slice(0, 10);
    }

    formatDate(dateStr) {
        if (!dateStr) return '—';
        const [y, m, d] = dateStr.split('-');
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return `${months[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
    }

    shortDate(dateStr) {
        if (!dateStr) return '';
        const [, m, d] = dateStr.split('-');
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return `${months[parseInt(m) - 1]} ${parseInt(d)}`;
    }

    getWeightEntries(days) {
        if (!days) return this.data.weights;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const cutStr = cutoff.toISOString().slice(0, 10);
        return this.data.weights.filter(w => w.date >= cutStr);
    }

    wu() { return this.data.settings.weightUnit || 'lbs'; }
    mu() { return this.data.settings.measureUnit || 'in'; }

    numInput(id) {
        const el = document.getElementById(id);
        return el && el.value !== '' ? parseFloat(el.value) : null;
    }

    escape(str) {
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    toast(msg) {
        const el = document.getElementById('toast');
        el.textContent = msg;
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 2800);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new TrackerApp();
});
