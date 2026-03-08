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
const dashboardView = document.getElementById('dashboard-view');
const historyView = document.getElementById('history-view');

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
let currentImageBase64 = null;
let currentCalendarDate = new Date();
let selectedDateStr = null;

// Initialize
function init() {
    renderTrades();
    updateStats();
    renderCalendar();
    
    // Set initial date string
    selectedDateStr = new Date().toISOString().split('T')[0];
    renderHistoryTrades();
    
    // Attach event listeners
    if (statsFilter) statsFilter.addEventListener('change', updateStats);
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
        screenshotInput.files = e.dataTransfer.files;
        handleFileUpload({ target: screenshotInput });
    }
});

removeImageBtn.addEventListener('click', () => {
    currentImageBase64 = null;
    screenshotInput.value = '';
    imagePreviewContainer.classList.add('hidden');
    dropZone.querySelector('.upload-content').classList.remove('hidden');
});

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(event) {
            currentImageBase64 = event.target.result;
            imagePreview.src = currentImageBase64;
            imagePreviewContainer.classList.remove('hidden');
            dropZone.querySelector('.upload-content').classList.add('hidden');
        };
        reader.readAsDataURL(file);
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
        screenshot: currentImageBase64
    };
    
    trades.unshift(newTrade); // Add to beginning
    saveTrades();
    renderTrades();
    updateStats();
    renderCalendar();
    renderHistoryTrades();
    
    // Reset Form
    tradeForm.reset();
    currentImageBase64 = null;
    imagePreviewContainer.classList.add('hidden');
    dropZone.querySelector('.upload-content').classList.remove('hidden');
});

function deleteTrade(id) {
    if(!confirm('Are you sure you want to delete this trade?')) return;
    trades = trades.filter(t => t.id !== id);
    saveTrades();
    renderTrades();
    updateStats();
    renderCalendar();
    renderHistoryTrades();
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
        if (trade.screenshot) {
            imageHtml = `<img src="${trade.screenshot}" class="trade-screenshot" alt="Trade Screenshot" onclick="window.open('${trade.screenshot}', '_blank')">`;
        }

        card.innerHTML = `
            <div class="trade-header">
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
            <button class="delete-btn" onclick="deleteTrade('${trade.id}')">Delete Trade</button>
        </div>
    `;
    
    return card;
}

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
navDashboard.addEventListener('click', (e) => {
    e.preventDefault();
    navDashboard.classList.add('active');
    navHistory.classList.remove('active');
    dashboardView.classList.remove('hidden');
    historyView.classList.add('hidden');
});

navHistory.addEventListener('click', (e) => {
    e.preventDefault();
    navHistory.classList.add('active');
    navDashboard.classList.remove('active');
    historyView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
    renderCalendar();
});

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

// Run init
init();
