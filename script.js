// DOM Elements
const tradeForm = document.getElementById('tradeForm');
const dashboardTradesList = document.getElementById('dashboardTradesList');
const historyTradesList = document.getElementById('historyTradesList');
const screenshotInput = document.getElementById('screenshot');
const dropZone = document.getElementById('drop-zone');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const removeImageBtn = document.getElementById('remove-image');

// Form logic elements
const resultSelect = document.getElementById('result');
const riskInput = document.getElementById('risk');
const riskTypeSelect = document.getElementById('riskType');
const pnlInput = document.getElementById('pnl');

// Stats Elements
const statPnl = document.getElementById('stat-pnl');
const statWinrate = document.getElementById('stat-winrate');
const statTotalTrades = document.getElementById('stat-total-trades');

// Views & Navigation
const navDashboard = document.getElementById('nav-dashboard');
const navHistory = document.getElementById('nav-history');
const navAnalytics = document.getElementById('nav-analytics');
const dashboardView = document.getElementById('dashboard-view');
const historyView = document.getElementById('history-view');
const analyticsView = document.getElementById('analytics-view');

// Modal Elements
const tradeModal = document.getElementById('trade-modal');
const closeModal = document.getElementById('close-modal');
const modalBody = document.getElementById('modal-body');

// Lightbox Elements
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeLightbox = document.getElementById('close-lightbox');

// Calendar Elements
const calendarMonthYear = document.getElementById('calendar-month-year');
const calendarDays = document.getElementById('calendar-days');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const selectedDateTitle = document.getElementById('selected-date-title');

// Filter Element
const statsFilter = document.getElementById('stats-filter');

// State
let trades = JSON.parse(localStorage.getItem('glitch_trades')) || [];
let currentImagesBase64 = []; // Changed to array
let currentCalendarDate = new Date();
let selectedDateStr = null;
let pnlChartInstance = null;

// Initialize
function init() {
    renderTrades();
    updateStats();
    renderCalendar();
    
    // Set initial date string
    selectedDateStr = new Date().toISOString().split('T')[0];
    renderHistoryTrades();
    initChart();
    
    // Attach event listeners
    if (statsFilter) statsFilter.addEventListener('change', updateStats);
    
    // Lightbox listeners
    if (closeLightbox) {
        closeLightbox.addEventListener('click', () => lightbox.classList.add('hidden'));
    }
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if(e.target === lightbox) lightbox.classList.add('hidden');
        });
    }
}

function openLightbox(src) {
    if (lightbox && lightboxImg) {
        lightboxImg.src = src;
        lightbox.classList.remove('hidden');
    }
}

// File Upload Logic
screenshotInput.addEventListener('change', handleFileUpload);
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
        handleFiles(e.dataTransfer.files);
    }
});

function handleFileUpload(e) {
    handleFiles(e.target.files);
}

function handleFiles(files) {
    imagePreviewContainer.innerHTML = ''; // Clear previous
    currentImagesBase64 = []; // Reset array
    
    Array.from(files).forEach((file, index) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const base64Str = event.target.result;
                currentImagesBase64.push(base64Str);
                
                // Render Thumb
                const thumb = document.createElement('div');
                thumb.className = 'preview-item';
                thumb.innerHTML = `
                    <img src="${base64Str}" alt="Preview ${index}" style="cursor:zoom-in;" onclick="openLightbox('${base64Str}')">
                    <button type="button" class="remove-thumb" data-index="${index}">×</button>
                `;
                imagePreviewContainer.appendChild(thumb);
                
                // Add remove listener
                thumb.querySelector('.remove-thumb').addEventListener('click', (e) => {
                    const idx = e.target.getAttribute('data-index');
                    currentImagesBase64.splice(idx, 1);
                    thumb.remove();
                    if(currentImagesBase64.length === 0) {
                        imagePreviewContainer.classList.add('hidden');
                        document.getElementById('upload-prompt').classList.remove('hidden');
                    }
                });
            };
            reader.readAsDataURL(file);
        }
    });
    
    if (files.length > 0) {
        imagePreviewContainer.classList.remove('hidden');
        document.getElementById('upload-prompt').classList.add('hidden');
    }
}

// Auto Calculate PNL
function handleAutoPnl() {
    const result = resultSelect.value;
    const risk = parseFloat(riskInput.value);
    const riskType = riskTypeSelect.value;
    
    if (result === 'loss' && riskType === '$' && !isNaN(risk)) {
        pnlInput.value = risk;
    }
}

resultSelect.addEventListener('change', handleAutoPnl);
riskInput.addEventListener('input', handleAutoPnl);
riskTypeSelect.addEventListener('change', handleAutoPnl);

// Form Submission
tradeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const pair = document.getElementById('pair').value;
    const result = document.getElementById('result').value;
    const risk = parseFloat(document.getElementById('risk').value);
    const riskType = document.getElementById('riskType').value;
    let pnl = parseFloat(document.getElementById('pnl').value);
    const confluences = document.getElementById('confluences').value;
    
    // Auto-adjust PNL sign based on Win/Loss
    if (result === 'loss') {
        pnl = -Math.abs(pnl);
    } else if (result === 'win') {
        pnl = Math.abs(pnl);
    }
    
    const newTrade = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        pair,
        result,
        risk,
        riskType,
        pnl,
        confluences,
        screenshots: currentImagesBase64 // Changed to array
    };
    
    trades.unshift(newTrade); // Add to beginning
    saveTrades();
    renderTrades();
    updateStats();
    renderCalendar();
    renderHistoryTrades();
    updateChart();
    
    // Reset Form
    tradeForm.reset();
    currentImagesBase64 = [];
    imagePreviewContainer.innerHTML = '';
    imagePreviewContainer.classList.add('hidden');
    document.getElementById('upload-prompt').classList.remove('hidden');
});

function deleteTrade(id) {
    if(!confirm('Are you sure you want to delete this trade?')) return;
    trades = trades.filter(t => t.id !== id);
    saveTrades();
    renderTrades();
    updateStats();
    renderCalendar();
    renderHistoryTrades();
    updateChart();
    
    tradeModal.classList.add('hidden'); // Close modal if open
}

function saveTrades() {
    localStorage.setItem('glitch_trades', JSON.stringify(trades));
}

// Rendering Dashboard Feed
function renderTrades() {
    dashboardTradesList.innerHTML = '';
    
    if (trades.length === 0) {
        dashboardTradesList.innerHTML = `
            <div class="empty-state">
                <p>No trades logged yet. Start journaling!</p>
            </div>
        `;
        return;
    }
    
    // Limit to recent 10 trades on dashboard
    const recentTrades = trades.slice(0, 10);
    
    recentTrades.forEach(trade => {
        dashboardTradesList.appendChild(createTradeCard(trade));
    });
}

function createTradeCard(trade) {
    const card = document.createElement('div');
    card.className = 'trade-card';
        
        const dateFormatted = new Date(trade.date).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        
        let pnlDisplay = trade.pnl >= 0 ? `+$${trade.pnl.toFixed(2)}` : `-$${Math.abs(trade.pnl).toFixed(2)}`;
        let pnlColorClass = trade.pnl >= 0 ? 'positive' : 'negative';
        
        let imageHtml = '';
        if (trade.screenshots && trade.screenshots.length > 0) {
            let overlayHtml = trade.screenshots.length > 1 ? `<div class="image-indicator">+${trade.screenshots.length - 1}</div>` : '';
            imageHtml = `
                <div style="position:relative; display:inline-block; width:100%;">
                    <img src="${trade.screenshots[0]}" class="trade-screenshot" alt="Trade Screenshot" onclick="openTradeModal('${trade.id}')">
                    ${overlayHtml}
                </div>
            `;
        } else if (trade.screenshot) {
            // Backwards compatibility for single string legacy trades
            imageHtml = `<img src="${trade.screenshot}" class="trade-screenshot" alt="Trade Screenshot" onclick="openTradeModal('${trade.id}')">`;
        }

        card.innerHTML = `
            <div class="trade-header" style="cursor:pointer;" onclick="openTradeModal('${trade.id}')">
                <div style="display: flex; gap: 10px; align-items: center;">
                    <span class="pair-badge">${trade.pair.toUpperCase()}</span>
                    <span class="result-pill ${trade.result}">${trade.result}</span>
                </div>
                <div class="trade-date">${dateFormatted}</div>
            </div>
            
            <div class="trade-metrics">
                <div class="metric">
                    <span>Risked</span>
                    <strong>${trade.riskType === '$' ? '$' : ''}${trade.risk}${trade.riskType === '%' ? '%' : ''}</strong>
                </div>
                <div class="metric">
                    <span>P&L</span>
                    <strong class="${pnlColorClass}">${pnlDisplay}</strong>
                </div>
            </div>
            
            <div class="trade-notes">
                <strong>Confluences:</strong><br>
                ${trade.confluences.replace(/\n/g, '<br>')}
            </div>
            
            ${imageHtml}
            
            <div class="trade-footer">
            <button class="delete-btn" onclick="deleteTrade('${trade.id}')" style="z-index: 10; position:relative;">Delete Trade</button>
        </div>
    `;
    
    return card;
}

// Modal Logic
function openTradeModal(id) {
    const trade = trades.find(t => t.id === id);
    if(!trade) return;
    
    const dateFormatted = new Date(trade.date).toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    
    let pnlDisplay = trade.pnl >= 0 ? `+$${trade.pnl.toFixed(2)}` : `-$${Math.abs(trade.pnl).toFixed(2)}`;
    let pnlColorClass = trade.pnl >= 0 ? 'positive' : 'negative';
    
    let imagesArr = trade.screenshots || [];
    if(trade.screenshot && imagesArr.length === 0) imagesArr = [trade.screenshot];
    
    let galleryHtml = '';
    if (imagesArr.length > 0) {
        galleryHtml = `<div class="modal-gallery">` + 
            imagesArr.map(src => `<img src="${src}" onclick="openLightbox('${src}')">`).join('') + 
            `</div>`;
    }
    
    modalBody.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <div style="display: flex; gap: 15px; align-items: center; margin-bottom: 1rem;">
                <span class="pair-badge" style="font-size: 1.2rem;">${trade.pair.toUpperCase()}</span>
                <span class="result-pill ${trade.result}" style="font-size: 1rem; padding: 0.5rem 1rem;">${trade.result}</span>
            </div>
            <p style="color: var(--text-secondary);">${dateFormatted}</p>
        </div>
        
        <div class="stats-grid" style="margin-bottom: 2rem;">
            <div class="stat-card" style="padding: 1rem;">
                <div>
                    <p class="stat-label">Risk</p>
                    <h3 class="stat-value" style="font-size: 1.2rem;">${trade.riskType === '$' ? '$' : ''}${trade.risk}${trade.riskType === '%' ? '%' : ''}</h3>
                </div>
            </div>
            <div class="stat-card" style="padding: 1rem;">
                <div>
                    <p class="stat-label">Net P&L</p>
                    <h3 class="stat-value ${pnlColorClass}" style="font-size: 1.2rem;">${pnlDisplay}</h3>
                </div>
            </div>
        </div>
        
        <div style="margin-bottom: 2rem;">
            <h3 style="margin-bottom: 1rem; font-size: 1.1rem;">Confluences & Notes</h3>
            <div style="background: rgba(0,0,0,0.3); padding: 1.5rem; border-radius: var(--radius-md); line-height: 1.6;">
                ${trade.confluences.replace(/\n/g, '<br>')}
            </div>
        </div>
        
        ${galleryHtml ? `
            <div>
                <h3 style="margin-bottom: 0.5rem; font-size: 1.1rem;">Attachments (${imagesArr.length})</h3>
                <p style="color: var(--text-secondary); font-size: 0.85rem;">Click any image to view full screen</p>
                ${galleryHtml}
            </div>
        ` : ''}
        
        <div style="margin-top: 3rem; text-align: right; border-top: 1px solid var(--border-color); padding-top: 1rem;">
            <button class="delete-btn" onclick="deleteTrade('${trade.id}')" style="color: var(--loss-color); font-weight:600;">🗑️ Delete this Trade</button>
        </div>
    `;
    
    tradeModal.classList.remove('hidden');
}

closeModal.addEventListener('click', () => {
    tradeModal.classList.add('hidden');
});
tradeModal.addEventListener('click', (e) => {
    if(e.target === tradeModal) tradeModal.classList.add('hidden');
});

// Stats Calculation
function updateStats() {
    const filter = statsFilter ? statsFilter.value : 'monthly';
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Calculate start of current week (Sunday as start)
    const currentDay = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDay);
    startOfWeek.setHours(0,0,0,0);

    let wins = 0;
    let totalPnl = 0;
    let filteredTradeCount = 0;
    
    trades.forEach(trade => {
        const tradeDate = new Date(trade.date);
        let include = false;
        
        switch (filter) {
            case 'all':
                include = true;
                break;
            case 'yearly':
                include = tradeDate.getFullYear() === currentYear;
                break;
            case 'monthly':
                include = tradeDate.getFullYear() === currentYear && tradeDate.getMonth() === currentMonth;
                break;
            case 'weekly':
                include = tradeDate >= startOfWeek;
                break;
        }
        
        if (include) {
            filteredTradeCount++;
            if (trade.result === 'win') wins++;
            totalPnl += trade.pnl; // Note: pnl can be negative if entered that way
        }
    });
    
    const winRate = filteredTradeCount > 0 ? ((wins / filteredTradeCount) * 100).toFixed(1) : 0;
    
    // Update DOM
    statTotalTrades.textContent = filteredTradeCount;
    statWinrate.textContent = `${winRate}%`;
    statPnl.textContent = totalPnl >= 0 ? `+$${totalPnl.toFixed(2)}` : `-$${Math.abs(totalPnl).toFixed(2)}`;
    
    statPnl.className = 'stat-value ' + (totalPnl >= 0 ? 'positive' : 'negative');
}

// Navigation Logic
function switchView(activeNav, activeView) {
    [navDashboard, navHistory, navAnalytics].forEach(n => n?.classList.remove('active'));
    [dashboardView, historyView, analyticsView].forEach(v => v?.classList.add('hidden'));
    
    if(activeNav) activeNav.classList.add('active');
    if(activeView) activeView.classList.remove('hidden');
}

navDashboard.addEventListener('click', (e) => {
    e.preventDefault();
    switchView(navDashboard, dashboardView);
});

navHistory.addEventListener('click', (e) => {
    e.preventDefault();
    switchView(navHistory, historyView);
    renderCalendar();
});

if(navAnalytics) {
    navAnalytics.addEventListener('click', (e) => {
        e.preventDefault();
        switchView(navAnalytics, analyticsView);
    });
}

// Calendar Logic
prevMonthBtn.addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
});

function renderCalendar() {
    calendarDays.innerHTML = '';
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    calendarMonthYear.textContent = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Group trades by date string (YYYY-MM-DD) for current month
    const dailyData = {};
    trades.forEach(trade => {
        const tradeDate = new Date(trade.date);
        if (tradeDate.getFullYear() === year && tradeDate.getMonth() === month) {
            // Adjust for local timezone padding reliably
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(tradeDate.getDate()).padStart(2, '0')}`;
            
            if (!dailyData[dateStr]) {
                dailyData[dateStr] = { pnl: 0, count: 0 };
            }
            dailyData[dateStr].pnl += trade.pnl;
            dailyData[dateStr].count += 1;
        }
    });

    // Fill empty days before 1st of month
    for (let i = 0; i < firstDay; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'calendar-day empty';
        calendarDays.appendChild(emptyDiv);
    }
    
    // Render days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const dateNum = document.createElement('div');
        dateNum.className = 'date-num';
        dateNum.textContent = day;
        dayDiv.appendChild(dateNum);
        
        if (dailyData[dateStr]) {
            const data = dailyData[dateStr];
            const pnlLabel = document.createElement('div');
            pnlLabel.className = 'day-pnl';
            pnlLabel.textContent = data.pnl >= 0 ? `+$${data.pnl.toFixed(2)}` : `-$${Math.abs(data.pnl).toFixed(2)}`;
            dayDiv.appendChild(pnlLabel);
            
            if (data.pnl > 0) dayDiv.classList.add('win');
            else if (data.pnl < 0) dayDiv.classList.add('loss');
            else dayDiv.classList.add('breakeven');
        }
        
        if (selectedDateStr === dateStr) {
            dayDiv.classList.add('active');
        }
        
        dayDiv.addEventListener('click', () => {
            selectedDateStr = dateStr;
            renderCalendar(); // re-render to update active class
            renderHistoryTrades();
        });
        
        calendarDays.appendChild(dayDiv);
    }
}

function renderHistoryTrades() {
    historyTradesList.innerHTML = '';
    
    if (!selectedDateStr) {
        selectedDateTitle.textContent = "All Trades";
        selectedDateStr = "all";
    }
    
    let filteredTrades = trades;
    
    if (selectedDateStr !== "all") {
        const [year, month, day] = selectedDateStr.split('-');
        
        // Use local formatting
        const displayDate = new Date(year, month - 1, day);
        selectedDateTitle.textContent = `Trades on ${displayDate.toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}`;
        
        filteredTrades = trades.filter(t => {
            const d = new Date(t.date);
            return d.getFullYear() === parseInt(year) && 
                   d.getMonth() === parseInt(month) - 1 && 
                   d.getDate() === parseInt(day);
        });
    }

    if (filteredTrades.length === 0) {
        historyTradesList.innerHTML = `
            <div class="empty-state">
                <p>No trades marked for this date.</p>
            </div>
        `;
        return;
    }
    
    filteredTrades.forEach(trade => {
        historyTradesList.appendChild(createTradeCard(trade));
    });
}

// Analytics Charting
function initChart() {
    const ctx = document.getElementById('pnlChart');
    if (!ctx) return;
    
    Chart.defaults.color = '#9499a5';
    Chart.defaults.font.family = "'Inter', sans-serif";
    
    pnlChartInstance = new Chart(ctx, {
        type: 'line',
        data: getChartData(),
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 11, 15, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: {
                        callback: function(value) { return '$' + value; }
                    }
                },
                x: {
                    grid: { display: false }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index',
            },
            elements: {
                line: { tension: 0.3 }
            }
        }
    });
}

function updateChart() {
    if (pnlChartInstance) {
        pnlChartInstance.data = getChartData();
        pnlChartInstance.update();
    }
}

function getChartData() {
    // Sort trades oldest to newest for chart progression
    const sortedTrades = [...trades].sort((a,b) => new Date(a.date) - new Date(b.date));
    
    let labels = [];
    let dataPoints = [];
    let cumulative = 0;
    
    // Add 0 baseline
    labels.push('Start');
    dataPoints.push(0);
    
    sortedTrades.forEach(trade => {
        const d = new Date(trade.date);
        labels.push(`${d.getMonth()+1}/${d.getDate()} (${trade.pair})`);
        cumulative += trade.pnl;
        dataPoints.push(cumulative);
    });
    
    const isProfitable = cumulative >= 0;
    const color = isProfitable ? '#10b981' : '#ef4444';
    
    return {
        labels: labels,
        datasets: [{
            label: 'Cumulative P&L',
            data: dataPoints,
            borderColor: color,
            backgroundColor: isProfitable ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderWidth: 3,
            fill: true,
            pointBackgroundColor: '#151820',
            pointBorderColor: color,
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
        }]
    };
}

// Run init
init();
