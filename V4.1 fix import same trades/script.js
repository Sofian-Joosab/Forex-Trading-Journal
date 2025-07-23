document.addEventListener('DOMContentLoaded', () => {
    // ===== THEME SWITCHER LOGIC =====
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            themeToggle.checked = true;
        } else {
            body.classList.remove('dark-mode');
            themeToggle.checked = false;
        }
    };

    const toggleTheme = () => {
        const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
        localStorage.setItem('journal_theme', newTheme);
        applyTheme(newTheme);
    };

    themeToggle.addEventListener('click', toggleTheme);

    // On page load, check for saved theme
    const savedTheme = localStorage.getItem('journal_theme') || 'light';
    applyTheme(savedTheme);
    // ===== END THEME SWITCHER LOGIC =====


    // --- DOM ELEMENTS ---
    const addTradeBtn = document.getElementById('addTradeBtn');
    const tradeModal = document.getElementById('tradeModal');
    const closeModal = document.querySelector('.modal-close');
    const tradeForm = document.getElementById('tradeForm');
    const calendar = document.getElementById('calendar');
    const currentMonthEl = document.getElementById('currentMonth');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const monthlyOverview = document.getElementById('monthlyOverview');
    const dailyTrades = document.getElementById('dailyTrades');
    const selectedDayEl = document.getElementById('selectedDay');
    const tradesList = document.getElementById('tradesList');
    const backToCalendarBtn = document.getElementById('backToCalendarBtn');
    const entryImageInput = document.getElementById('entryImage');
    const exitImageInput = document.getElementById('exitImage');
    const entryPreview = document.getElementById('entryPreview');
    const exitPreview = document.getElementById('exitPreview');
    const modalTitle = document.getElementById('modalTitle');
    const tradeIdInput = document.getElementById('tradeId');
    const strategyFiltersContainer = document.getElementById('strategyFilters');

    // NEW DOM ELEMENTS FOR NEW COLUMNS
    const pipsInput = document.getElementById('pips');
    const openingDirectionInput = document.getElementById('openingDirection');
    const entryPriceInput = document.getElementById('entryPrice');
    const closingPriceInput = document.getElementById('closingPrice');
    const closingQuantityInput = document.getElementById('closingQuantity');
    const swapInput = document.getElementById('swap');
    const commissionInput = document.getElementById('commission');
    const grossProfitInput = document.getElementById('grossProfit');
    const openingTimeDisplay = document.getElementById('openingTimeDisplay');
    const closingTimeDisplay = document.getElementById('closingTimeDisplay');


    // Analytics Elements
    const netPnlEl = document.getElementById('netPnl');
    const winLossRatioEl = document.getElementById('winLossRatio');
    const avgWinLossEl = document.getElementById('avgWinLoss');
    const profitFactorEl = document.getElementById('profitFactor');

    // Import/Export Elements
    const exportBtn = document.getElementById('exportBtn');
    const importFile = document.getElementById('importFile');

    // Lightbox Elements
    const imageLightbox = document.getElementById('imageLightbox');
    const lightboxClose = document.querySelector('.lightbox-close');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxPnl = document.getElementById('lightboxPnl');
    const lightboxStrategy = document.getElementById('lightboxStrategy');
    const lightboxNotes = document.getElementById('lightboxNotes');
    // Extend lightbox with new fields
    // const lightboxCtradeDetails = document.getElementById('lightboxCtradeDetails'); // Assuming you'll add this div in index.html for details

    // Clipboard Paste Elements
    const entryPasteArea = document.getElementById('entryPasteArea');
    const exitPasteArea = document.getElementById('exitPasteArea');
    const clearPasteBtns = document.querySelectorAll('.clear-paste-btn');


    // --- APP STATE ---
    let trades = JSON.parse(localStorage.getItem('forex_trades_advanced')) || [];
    let currentDate = new Date();
    let currentFilter = 'all';

    // --- CORE FUNCTIONS ---
    const saveTrades = () => {
        localStorage.setItem('forex_trades_advanced', JSON.stringify(trades));
        updateApp();
    };

    const updateApp = () => {
        renderCalendar();
        updateAnalytics();
        updateStrategyFilters();
    };

    const compressImage = async (file, quality = 0.9, maxWidth = 1920) => {
        if (!file) return null;
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const scaleRatio = maxWidth / img.width;
                    const newWidth = img.width > maxWidth ? maxWidth : img.width;
                    const newHeight = img.width > maxWidth ? img.height * scaleRatio : img.height;
                    canvas.width = newWidth;
                    canvas.height = newHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, newWidth, newHeight);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleImagePreview = (inputOrFile, preview) => {
        let file;
        if (inputOrFile instanceof HTMLInputElement) { // It's the file input element
            file = inputOrFile.files[0];
        } else if (inputOrFile instanceof File) { // It's a File object from paste
            file = inputOrFile;
        } else {
            // No file or invalid input, clear preview
            preview.src = '#';
            preview.style.display = 'none';
            return;
        }

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            preview.src = '#';
            preview.style.display = 'none';
        }
    };

    const openTradeModal = (trade = null) => {
        tradeForm.reset();
        entryPreview.style.display = 'none';
        exitPreview.style.display = 'none';

        // Clear paste areas and hide clear buttons on modal open
        entryPasteArea.innerHTML = '';
        entryPasteArea.textContent = ''; // Ensure placeholder shows
        entryPasteArea.dataset.hasImage = 'false';
        document.querySelector('.clear-paste-btn[data-target="entry"]').classList.add('hidden');

        exitPasteArea.innerHTML = '';
        exitPasteArea.textContent = ''; // Ensure placeholder shows
        exitPasteArea.dataset.hasImage = 'false';
        document.querySelector('.clear-paste-btn[data-target="exit"]').classList.add('hidden');

        // Clear display-only fields for imported times
        openingTimeDisplay.value = '';
        closingTimeDisplay.value = '';

        if (trade) {
            // Editing existing trade
            modalTitle.textContent = 'Edit Trade';
            tradeIdInput.value = trade.id;
            document.getElementById('tradeDate').value = trade.date;
            document.getElementById('pnl').value = trade.pnl;
            document.getElementById('strategy').value = trade.strategy;
            document.getElementById('notes').value = trade.notes;

            // Populate NEW fields
            pipsInput.value = trade.pips || '';
            openingDirectionInput.value = trade.openingDirection || '';
            entryPriceInput.value = trade.entryPrice || '';
            closingPriceInput.value = trade.closingPrice || '';
            closingQuantityInput.value = trade.closingQuantity || '';
            swapInput.value = trade.swap || '';
            commissionInput.value = trade.commission || '';
            grossProfitInput.value = trade.grossProfit || '';
            openingTimeDisplay.value = trade.openingTime || '';
            closingTimeDisplay.value = trade.closingTime || '';


            // Load existing images into previews. Don't touch file inputs.
            if(trade.entryImage) {
                entryPreview.src = trade.entryImage;
                entryPreview.style.display = 'block';
                entryPasteArea.innerHTML = `<img src="${trade.entryImage}" />`; // Show in paste area too for consistency
                entryPasteArea.dataset.hasImage = 'true';
                document.querySelector('.clear-paste-btn[data-target="entry"]').classList.remove('hidden');
            }
            if(trade.exitImage) {
                exitPreview.src = trade.exitImage;
                exitPreview.style.display = 'block';
                exitPasteArea.innerHTML = `<img src="${trade.exitImage}" />`; // Show in paste area too for consistency
                exitPasteArea.dataset.hasImage = 'true';
                document.querySelector('.clear-paste-btn[data-target="exit"]').classList.remove('hidden');
            }
        } else {
            // Adding new trade
            modalTitle.textContent = 'Record a New Trade';
            document.getElementById('tradeDate').valueAsDate = new Date();
            tradeIdInput.value = ''; // Ensure ID is clear for new trades

            // Clear NEW fields for new trades
            pipsInput.value = '';
            openingDirectionInput.value = '';
            entryPriceInput.value = '';
            closingPriceInput.value = '';
            closingQuantityInput.value = '';
            swapInput.value = '';
            commissionInput.value = '';
            grossProfitInput.value = '';
        }
        tradeModal.style.display = 'block';
    };

    const getFilteredTrades = () => {
        if (currentFilter === 'all') {
            return trades;
        }
        return trades.filter(trade => trade.strategy.toLowerCase() === currentFilter.toLowerCase());
    };

    const updateAnalytics = () => {
        const filteredTrades = getFilteredTrades();

        //const totalPnl = filteredTrades.reduce((acc, trade) => acc + trade.pnl, 0);
        const totalPnl = filteredTrades.reduce((sum, trade) => sum + parseFloat(trade.pnl) + (parseFloat(trade.commission) || 0), 0);
        const wins = filteredTrades.filter(t => t.pnl > 0);
        const losses = filteredTrades.filter(t => t.pnl < 0);

        const winCount = wins.length;
        const lossCount = losses.length;
        const totalWins = wins.reduce((acc, t) => acc + t.pnl, 0);
        const totalLosses = Math.abs(losses.reduce((acc, t) => acc + t.pnl, 0));

        netPnlEl.textContent = `$${totalPnl.toFixed(2)}`;
        netPnlEl.className = totalPnl >= 0 ? 'positive' : 'negative';

        winLossRatioEl.textContent = lossCount > 0 ? `${(winCount / (winCount + lossCount) * 100).toFixed(1)}%` : (winCount > 0 ? '100%' : 'N/A');

        const avgWin = winCount > 0 ? (totalWins / winCount) : 0;
        const avgLoss = lossCount > 0 ? (totalLosses / lossCount) : 0;
        avgWinLossEl.textContent = `$${avgWin.toFixed(2)} / $${avgLoss.toFixed(2)}`;

        profitFactorEl.textContent = totalLosses > 0 ? (totalWins / totalLosses).toFixed(2) : '∞';
    };

    const renderCalendar = () => {
        calendar.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const filteredTrades = getFilteredTrades();

        currentMonthEl.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;
        // Adjust getDay() for week starting on Monday (0=Sunday, 1=Monday... 6=Saturday)
        // If you want Monday to be the first day (index 0)
        let firstDayOfMonth = new Date(year, month, 1).getDay();
        firstDayOfMonth = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1; // Convert Sunday (0) to 6, Mon (1) to 0 etc.

        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDayOfMonth; i++) {
            calendar.appendChild(document.createElement('div')).classList.add('day', 'other-month');
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('day');

            const dayNumber = document.createElement('div');
            dayNumber.classList.add('day-number');
            dayNumber.textContent = i;
            dayCell.appendChild(dayNumber);

            const dayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const tradesForDay = filteredTrades.filter(trade => trade.date === dayString);

            if (tradesForDay.length > 0) {
                const dailyPnl = tradesForDay.reduce((sum, trade) => sum + parseFloat(trade.pnl) + (parseFloat(trade.commission) || 0), 0);
                const pnlEl = document.createElement('div');
                pnlEl.classList.add('daily-pnl');
                pnlEl.textContent = `$${dailyPnl.toFixed(2)}`;
                pnlEl.classList.add(dailyPnl >= 0 ? 'positive' : 'negative');
                dayCell.appendChild(pnlEl);
                dayCell.addEventListener('click', () => showDailyTrades(dayString));
            }
            calendar.appendChild(dayCell);
        }
         // Fill remaining days of the last week (optional, for visual consistency)
         const totalCells = firstDayOfMonth + daysInMonth;
         const remainingCells = (Math.ceil(totalCells / 7) * 7) - totalCells;
         for (let i = 1; i <= remainingCells; i++) {
             const dayCell = document.createElement('div');
             dayCell.classList.add('day', 'other-month');
             dayCell.innerHTML = `<span class="day-number">${i}</span>`;
             calendar.appendChild(dayCell);
         }
    };

    const showDailyTrades = (date) => {
        monthlyOverview.classList.add('hidden');
        dailyTrades.classList.remove('hidden');
        const filteredTrades = getFilteredTrades();
        const tradesForDay = filteredTrades.filter(trade => trade.date === date);
        const displayDate = new Date(date + 'T00:00:00');
        selectedDayEl.textContent = `Trades for ${displayDate.toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
        tradesList.innerHTML = '';

        tradesForDay.forEach(trade => {
            const tradeCard = document.createElement('div');
            tradeCard.classList.add('trade-card');

            tradeCard.innerHTML = `
                <div class="trade-card-header">
                    <h4>${trade.strategy} ${trade.openingDirection ? `(${trade.openingDirection})` : ''}</h4>
                    <div class="pnl-value ${trade.pnl >= 0 ? 'positive' : 'negative'}">$${trade.pnl !== null ? trade.pnl.toFixed(2) : 'N/A'}</div>
                </div>
                <div class="trade-details-grid">
                    <div><strong>ID:</strong> ${trade.cTraderId || 'N/A'}</div>
                    <div><strong>Pips:</strong> ${trade.pips !== null ? trade.pips.toFixed(1) : 'N/A'}</div>
                    <div><strong>Entry:</strong> ${trade.entryPrice !== null ? trade.entryPrice.toFixed(5) : 'N/A'}</div>
                    <div><strong>Exit:</strong> ${trade.closingPrice !== null ? trade.closingPrice.toFixed(5) : 'N/A'}</div>
                    <div><strong>Quantity:</strong> ${trade.closingQuantity !== null ? trade.closingQuantity.toFixed(2) : 'N/A'}</div>
                    <div><strong>Swap:</strong> ${trade.swap !== null ? trade.swap.toFixed(2) : 'N/A'}</div>
                    <div><strong>Commission:</strong> ${trade.commission !== null ? trade.commission.toFixed(2) : 'N/A'}</div>
                    <div><strong>Gross P&L:</strong> ${trade.grossProfit !== null ? trade.grossProfit.toFixed(2) : 'N/A'}</div>
                    <div><strong>Open Time:</strong> ${trade.openingTime || 'N/A'}</div>
                    <div><strong>Close Time:</strong> ${trade.closingTime || 'N/A'}</div>
                </div>
                ${trade.notes ? `<div class="notes-section">${trade.notes.replace(/\n/g, '<br>')}</div>` : ''}
                <div class="image-container">
                    ${trade.entryImage ? `
                        <div>
                            <h5>Entry</h5>
                            <img src="${trade.entryImage}" alt="Entry Screenshot" data-id="${trade.id}" data-type="entry">
                        </div>` : ''}
                    ${trade.exitImage ? `
                        <div>
                            <h5>Exit</h5>
                            <img src="${trade.exitImage}" alt="Exit Screenshot" data-id="${trade.id}" data-type="exit">
                        </div>` : ''}
                </div>
                <div class="trade-card-actions">
                    <button class="action-btn edit-btn" data-id="${trade.id}">Edit</button>
                    <button class="action-btn delete-btn" data-id="${trade.id}">Delete</button>
                </div>
            `;
            tradesList.appendChild(tradeCard);
        });
    };

    const updateStrategyFilters = () => {
        const strategies = [...new Set(trades.map(t => t.strategy.toLowerCase()))];
        strategyFiltersContainer.innerHTML = ''; // Clear previous buttons

        // Add 'All Strategies' button
        const allBtn = document.createElement('button');
        allBtn.classList.add('filter-btn');
        allBtn.textContent = 'All Strategies';
        allBtn.dataset.strategy = 'all';
        if (currentFilter === 'all') {
            allBtn.classList.add('active');
        }
        strategyFiltersContainer.appendChild(allBtn);

        // Add buttons for other strategies
        strategies.forEach(strategy => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.dataset.strategy = strategy;
            btn.textContent = strategy; // Display original casing if needed, but filter on lowercase
            if (strategy === currentFilter) {
                btn.classList.add('active');
            }
            strategyFiltersContainer.appendChild(btn);
        });
    };

    const openLightbox = (imgSrc, trade) => {
        lightboxImage.src = imgSrc;
        lightboxPnl.textContent = `$${trade.pnl !== null ? trade.pnl.toFixed(2) : 'N/A'}`;
        lightboxPnl.className = trade.pnl >= 0 ? 'positive' : 'negative';
        lightboxStrategy.textContent = trade.strategy;
        lightboxNotes.innerHTML = trade.notes ? trade.notes.replace(/\n/g, '<br>') : '<em>No notes for this trade.</em>';
        // Populate additional details in lightbox
        if (trade.cTraderId) {
            lightboxNotes.innerHTML += `<br><strong>cTrader ID:</strong> ${trade.cTraderId}`;
        }
        if (trade.pips !== null) {
            lightboxNotes.innerHTML += `<br><strong>Pips:</strong> ${trade.pips.toFixed(1)}`;
        }
        if (trade.openingDirection) {
            lightboxNotes.innerHTML += `<br><strong>Direction:</strong> ${trade.openingDirection}`;
        }
        if (trade.entryPrice !== null) {
            lightboxNotes.innerHTML += `<br><strong>Entry:</strong> ${trade.entryPrice.toFixed(5)}`;
        }
        if (trade.closingPrice !== null) {
            lightboxNotes.innerHTML += `<br><strong>Exit:</strong> ${trade.closingPrice.toFixed(5)}`;
        }
        if (trade.grossProfit !== null) {
            lightboxNotes.innerHTML += `<br><strong>Gross P&L:</strong> ${trade.grossProfit.toFixed(2)}`;
        }
        if (trade.openingTime) {
            lightboxNotes.innerHTML += `<br><strong>Open Time:</strong> ${trade.openingTime}`;
        }
        if (trade.closingTime) {
            lightboxNotes.innerHTML += `<br><strong>Close Time:</strong> ${trade.closingTime}`;
        }

        imageLightbox.style.display = 'block';
    };

    const closeLightbox = () => {
        imageLightbox.style.display = 'none';
        // Clear dynamically added content to notes to prevent duplication on next open
        // A better approach would be a dedicated lightbox details area.
        lightboxNotes.innerHTML = '';
    };

    // Function to parse DD/MM/YYYY HH:MM:SS.ms format to a Date object
    const parseDdMmYyyyTime = (dateTimeString) => {
        if (!dateTimeString) return null;
        // Adjusted regex to robustly handle optional milliseconds and ensure all parts
        const parts = String(dateTimeString).match(/(\d{2})\/(\d{2})\/(\d{4})\s(\d{2}):(\d{2}):(\d{2})(?:\.(\d{0,3}))?/);
        if (parts) {
            const day = parseInt(parts[1], 10);
            const month = parseInt(parts[2], 10) - 1; // Month is 0-indexed
            const year = parseInt(parts[3], 10);
            const hour = parseInt(parts[4], 10);
            const minute = parseInt(parts[5], 10);
            const second = parseInt(parts[6], 10);
            const millisecond = parseInt(parts[7] || '0', 10); // Milliseconds are optional

            // Basic validation for date components before creating Date object
            if (year < 1000 || month < 0 || month > 11 || day < 1 || day > 31 || hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
                 return null; // Invalid date component
            }

            return new Date(year, month, day, hour, minute, second, millisecond);
        }
        return null;
    };


    // Function to map cTrader XLSX row data to your journal's trade object
    const mapExcelRowToJournalTrade = (row) => {
        // IMPORTANT: Adjust these column names to match your cTrader XLSX export exactly.
        // They are case-sensitive and must match perfectly.

        // Fallback for ID Symbol to ensure uniqueness if not present
        const cTraderId = String(row['ID'] || `UNKNOWN_ID_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);

        // Use parseFloat with || null to handle cases where data might be non-numeric or empty
        const pnl = parseFloat(row['Gross $']) || null;
        const pips = parseFloat(row['Pips']) || null;
        const entryPrice = parseFloat(row['Entry price']) || null;
        const closingPrice = parseFloat(row['Closing price']) || null;
        const closingQuantity = parseFloat(row['Closing Quantity']) || null;
        const swap = parseFloat(row['Swap']) || null;
        const commission = parseFloat(row['Commission']) || null;

        // Ensure these are strings, default to empty string if undefined/null
        const openingDirection = String(row['Opening direction'] || '');
        const openingTimeStr = String(row['Opening time'] || '');
        const closingTimeStr = String(row['Closing time'] || '');


        let openTimeDateObj = parseDdMmYyyyTime(openingTimeStr);
        let closingTimeDateObj = parseDdMmYyyyTime(closingTimeStr);

        // Fallback for tradeDate and openingTime if parsing fails
        let tradeDate = new Date().toISOString().split('T')[0]; // Default to current date
        let openingTime = null;
        let timeForId = Date.now(); // Fallback timestamp for ID generation

        if (openTimeDateObj && !isNaN(openTimeDateObj.getTime())) {
            tradeDate = openTimeDateObj.toISOString().split('T')[0];
            openingTime = openingTimeStr; // Use original string if successfully parsed
            timeForId = openTimeDateObj.getTime();
        } else {
            console.warn(`Could not parse Opening time: "${openingTimeStr}" for cTrader ID "${cTraderId}". Defaulting to current date.`);
        }

        let closingTime = null;
        if (closingTimeDateObj && !isNaN(closingTimeDateObj.getTime())) {
            closingTime = closingTimeStr; // Use original string if successfully parsed
        } else if (closingTimeStr) { // If it had a value but couldn't be parsed
             console.warn(`Could not parse Closing time: "${closingTimeStr}" for cTrader ID "${cTraderId}". Setting to null.`);
        }


        // For strategy, cTrader export might not have it explicitly named "Strategy".
        // Use symbol, or default, or infer.
        // Assuming "ID Symbol" contains the trading pair (e.g., EURUSD)
        const strategy = String(row['ID Symbol'] || 'Unknown').toUpperCase(); // Default to 'Unknown'
        // Construct notes, ensuring values are not 'null' strings
        const notes = `Imported from cTrader.` +
                      `\nDirection: ${openingDirection || 'N/A'}` +
                      `\nEntry: ${entryPrice !== null ? entryPrice : 'N/A'}` +
                      `\nExit: ${closingPrice !== null ? closingPrice : 'N/A'}` +
                      `\nPips: ${pips !== null ? pips : 'N/A'}`;


        return {
            // Use cTraderId and robust timestamp for ID generation
            id: `ctrader-${cTraderId}-${timeForId}`,
            cTraderId: cTraderId, // Store the original cTrader ID (or its fallback)
            date: tradeDate, // YYYY-MM-DD for calendar
            pnl: pnl, // Net P&L from cTrader
            strategy: strategy,
            notes: notes,
            entryImage: null, // User will add these later
            exitImage: null,

            // New fields extracted from cTrader
            pips: pips,
            openingDirection: openingDirection,
            openingTime: openingTime, // Stored as string, or null
            closingTime: closingTime, // Stored as string, or null
            entryPrice: entryPrice,
            closingPrice: closingPrice,
            closingQuantity: closingQuantity,
            swap: swap,
            commission: commission,
            grossProfit: pnl // Since user provided 'Gross $', mapping it to grossProfit and pnl for consistency
        };
    };

    // Function to deduplicate and merge trades (remains largely the same)
    const deduplicateAndMergeTrades = (existingTrades, newTrades) => {
        const existingTradeMap = new Map();

        existingTrades.forEach(trade => {
            existingTradeMap.set(trade.id, trade);
        });

        let addedCount = 0;
        let updatedCount = 0; // Track updates as well
        newTrades.forEach(newTrade => {
            if (existingTradeMap.has(newTrade.id)) {

                //existingTradeMap.has(trade.id);
                // Optionally, update existing trade if it's considered an "update"
                // For now, we are just skipping if ID exists. If you want to update,
                // add logic here: existingTradeMap.set(newTrade.id, newTrade); updatedCount++;
                return; 
            } else {
                existingTrades.push(newTrade);
                existingTradeMap.set(newTrade.id, newTrade);
                addedCount++;
            }
        });
        return { mergedTrades: existingTrades, addedCount: addedCount, updatedCount: updatedCount };
    };


    // --- EVENT LISTENERS ---
    addTradeBtn.onclick = () => openTradeModal();
    closeModal.onclick = () => tradeModal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target == tradeModal) tradeModal.style.display = 'none';
        if (event.target == imageLightbox) closeLightbox();
    };
    backToCalendarBtn.onclick = () => { monthlyOverview.classList.add('hidden'); dailyTrades.classList.add('hidden'); location.reload(); };
    prevMonthBtn.onclick = () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); };
    nextMonthBtn.onclick = () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); };

    // Initial file input preview handling
    entryImageInput.addEventListener('change', () => handleImagePreview(entryImageInput, entryPreview));
    exitImageInput.addEventListener('change', () => handleImagePreview(exitImageInput, exitPreview));

    // Paste Event Listeners for Entry/Exit Image Areas
    const handlePaste = async (e, previewEl, fileInputEl, pasteAreaEl, clearBtn) => {
        e.preventDefault();

        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        let imageFile = null;

        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                imageFile = item.getAsFile();
                break;
            }
        }

        if (imageFile) {
            const reader = new FileReader();
            reader.onload = (event) => {
                pasteAreaEl.innerHTML = `<img src="${event.target.result}" style="max-width:100%; max-height:150px; display:block; margin:auto;" />`;
                pasteAreaEl.dataset.hasImage = 'true';
                clearBtn.classList.remove('hidden');
                handleImagePreview(imageFile, previewEl);
            };
            reader.readAsDataURL(imageFile);
            previewEl.file = imageFile;
            fileInputEl.value = '';

        } else {
             console.warn('Pasted content is not an image:', pastedText);
             alert('Please paste an image. Text content was not imported.');
             pasteAreaEl.textContent = '';
        }
    };

    entryPasteArea.addEventListener('paste', (e) => handlePaste(e, entryPreview, entryImageInput, entryPasteArea, document.querySelector('.clear-paste-btn[data-target="entry"]')));
    exitPasteArea.addEventListener('paste', (e) => handlePaste(e, exitPreview, exitImageInput, exitPasteArea, document.querySelector('.clear-paste-btn[data-target="exit"]')));

    // Clear Pasted Image Buttons
    clearPasteBtns.forEach(button => {
        button.addEventListener('click', (e) => {
            const targetType = e.target.dataset.target;
            const pasteArea = targetType === 'entry' ? entryPasteArea : exitPasteArea;
            const previewImg = targetType === 'entry' ? entryPreview : exitPreview;
            const fileInput = targetType === 'entry' ? entryImageInput : exitImageInput;

            pasteArea.innerHTML = '';
            pasteArea.textContent = '';
            pasteArea.dataset.hasImage = 'false';
            previewImg.src = '#';
            previewImg.style.display = 'none';
            previewImg.file = null;
            fileInput.value = '';
            e.target.classList.add('hidden');
        });
    });


    tradeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const tradeId = tradeIdInput.value;
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.textContent = 'Saving...';
        submitButton.disabled = true;

        try {
            const existingTrade = tradeId ? trades.find(t => t.id == tradeId) : null;

            let finalEntryImage = existingTrade ? existingTrade.entryImage : null;
            let finalExitImage = existingTrade ? existingTrade.exitImage : null;

            if (entryImageInput.files && entryImageInput.files[0]) {
                finalEntryImage = await compressImage(entryImageInput.files[0]);
            } else if (entryPreview.file) {
                 finalEntryImage = await compressImage(entryPreview.file);
            } else if (entryPreview.src && entryPreview.style.display !== 'none' && entryPreview.src !== window.location.href + '#') {
                finalEntryImage = entryPreview.src;
            } else {
                finalEntryImage = null;
            }


            if (exitImageInput.files && exitImageInput.files[0]) {
                finalExitImage = await compressImage(exitImageInput.files[0]);
            } else if (exitPreview.file) {
                finalExitImage = await compressImage(exitPreview.file);
            } else if (exitPreview.src && exitPreview.style.display !== 'none' && exitPreview.src !== window.location.href + '#') {
                finalExitImage = exitPreview.src;
            } else {
                finalExitImage = null;
            }

            // NEW: Capture values from the new input fields
            const capturedPips = parseFloat(pipsInput.value) || null;
            const capturedOpeningDirection = openingDirectionInput.value.trim() || null;
            const capturedEntryPrice = parseFloat(entryPriceInput.value) || null;
            const capturedClosingPrice = parseFloat(closingPriceInput.value) || null;
            const capturedClosingQuantity = parseFloat(closingQuantityInput.value) || null;
            const capturedSwap = parseFloat(swapInput.value) || null;
            const capturedCommission = parseFloat(commissionInput.value) || null;
            const capturedGrossProfit = parseFloat(grossProfitInput.value) || null;

            const tradeData = {
                id: existingTrade ? existingTrade.id : Date.now(), // Keep existing ID or generate new
                cTraderId: existingTrade ? existingTrade.cTraderId : null, // Preserve cTrader ID if exists
                date: document.getElementById('tradeDate').value,
                pnl: parseFloat(document.getElementById('pnl').value),
                strategy: document.getElementById('strategy').value.trim() || 'General',
                notes: document.getElementById('notes').value.trim(),
                entryImage: finalEntryImage,
                exitImage: finalExitImage,

                // NEW FIELDS from form
                pips: capturedPips,
                openingDirection: capturedOpeningDirection,
                openingTime: existingTrade ? existingTrade.openingTime : null, // These are read-only in form, retain original
                closingTime: existingTrade ? existingTrade.closingTime : null, // These are read-only in form, retain original
                entryPrice: capturedEntryPrice,
                closingPrice: capturedClosingPrice,
                closingQuantity: capturedClosingQuantity,
                swap: capturedSwap,
                commission: capturedCommission,
                grossProfit: capturedGrossProfit
            };

            if (existingTrade) {
                const index = trades.findIndex(t => t.id == tradeId);
                trades[index] = tradeData;
            } else {
                trades.push(tradeData);
            }

            saveTrades();
            tradeModal.style.display = 'none';
        } catch (error) {
            console.error("Failed to save trade:", error);
            alert("Error saving trade. Please check the console for details.");
        } finally {
            submitButton.textContent = 'Save Trade';
            submitButton.disabled = false;
        }
    });

    // Combined Event Listener for Daily Trades view (handles Edit, Delete, and Lightbox)
    tradesList.addEventListener('click', (e) => {
        const target = e.target;
        const id = target.dataset.id;

        if (!id) return;

        const trade = trades.find(t => t.id == id);
        if (!trade) return;

        // Handle Image Click for Lightbox
        if (target.tagName === 'IMG') {
            openLightbox(target.src, trade);
        }
        // Handle Delete Click
        else if (target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to delete this trade?')) {
                trades = trades.filter(t => t.id != id);
                saveTrades();
                backToCalendarBtn.click();
            }
        }
        // Handle Edit Click
        else if (target.classList.contains('edit-btn')) {
            openTradeModal(trade);
        }
    });

    strategyFiltersContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            currentFilter = e.target.dataset.strategy;
            document.querySelectorAll('#strategyFilters .filter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            updateApp();
        }
    });

    exportBtn.addEventListener('click', () => {
        if (trades.length === 0) {
            alert("No data to export.");
            return;
        }
        const dataStr = JSON.stringify(trades, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = 'forex_journal_backup.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
    });


    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileName = file.name.toLowerCase();

        const isJsonImport = fileName.endsWith('.json');
        const isXlsxImport = fileName.endsWith('.xlsx');

        if (!isJsonImport && !isXlsxImport) {
            alert('Unsupported file type. Please select a .json or .xlsx file.');
            e.target.value = '';
            return;
        }

        // Updated confirmation message for clarity
        if (confirm("Importing new data. Existing trades will be kept, and new trades from this file will be added, avoiding duplicates. Continue?")) {
            const reader = new FileReader();

            reader.onload = async (event) => {
                try {
                    let importedData;
                    if (isJsonImport) {
                        importedData = JSON.parse(event.target.result);
                        if (!Array.isArray(importedData)) {
                            throw new Error('Invalid JSON file format. Expected an array of trades.');
                        }
                        const { mergedTrades, addedCount, updatedCount } = deduplicateAndMergeTrades(trades, importedData);
                        trades = mergedTrades;
                        alert(`JSON data imported successfully! Added ${addedCount} new trades.`);
                        saveTrades();

                    } else if (isXlsxImport) {
                        const data = new Uint8Array(event.target.result);
                        const workbook = XLSX.read(data, { type: 'array', cellDates: true, dateNF: 'dd/mm/yyyy hh:mm:ss.sss' });

                        const firstSheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[firstSheetName];

                        // Get data as array of objects, using headers from the first row
                        const excelRows = XLSX.utils.sheet_to_json(worksheet);

                        if (excelRows.length === 0) {
                            alert('No data found in the Excel file.');
                            return;
                        }

                        // No longer filtering out nulls directly here, as mapExcelRowToJournalTrade handles nulls internally
                        const parsedJournalTrades = excelRows
                            .map(row => mapExcelRowToJournalTrade(row));

                        // Still check if any trades were successfully parsed at all
                        if (parsedJournalTrades.length === 0) {
                            alert('No trades were parsed from the Excel file (even with null values). This might indicate a header mismatch or completely empty rows.');
                            return;
                        }

                        const { mergedTrades, addedCount, updatedCount } = deduplicateAndMergeTrades(trades, parsedJournalTrades);
                        trades = mergedTrades;
                        alert(`Excel data imported successfully! Added ${addedCount} new trades.`);
                        saveTrades();
                    }

                } catch (err) {
                    alert('Failed to import data. Please ensure it is a valid file and format. Error: ' + err.message);
                    console.error("Import Error:", err);
                }
            };

            if (isJsonImport) {
                reader.readAsText(file);
            } else if (isXlsxImport) {
                reader.readAsArrayBuffer(file);
            }
        }
        e.target.value = '';
    });

    lightboxClose.addEventListener('click', closeLightbox);
    // Already handled in window.onclick for outside clicks


    // --- INITIAL LOAD ---\
    updateApp();
});