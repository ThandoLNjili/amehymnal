// Initialization & State
let hymnalData = [];
let currentPage = 1;
let maxPage = 0;

const LANGUAGES = [
    { code: "af", label: "Afrikaans" },
    { code: "en", label: "English" },
    { code: "st", label: "Sesotho" },
    { code: "xh", label: "IsiXhosa" }
].sort((a, b) => a.label.localeCompare(b.label));

const LANGUAGE_KEY = "amec-hymnal-language";

// Load saved page preference
const savedPage = localStorage.getItem('amec-hymnal-current-page');
if (savedPage) {
    currentPage = parseInt(savedPage) || 3;
}

document.addEventListener("DOMContentLoaded", () => {
    setupLanguageDropdown();

    const savedLang = localStorage.getItem(LANGUAGE_KEY);

    if (savedLang) {
        loadLanguage(savedLang);
    } else {
        showLanguagePrompt();
    }
});

// Fetch Data
function loadLanguage(langCode) {
    const select = document.getElementById("language-select");
    select.value = langCode;

    const file = `hymnal_${langCode}.json`;

    fetch(file)
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to load hymnal");
            }
            return response.json();
        })
        .then(data => {
            hymnalData = data;
            maxPage = Math.max(...hymnalData.map(p => p.page));

            currentPage = 1; // ALWAYS start at Dedication
            renderPage(currentPage);
        })
        .catch(err => {
            console.error(err);
            showErrorMessage("Unable to load hymnal language.");
        });
}


function setupLanguageDropdown() {
    const select = document.getElementById("language-select");

    LANGUAGES.forEach(lang => {
        const option = document.createElement("option");
        option.value = lang.code;
        option.textContent = lang.label;
        select.appendChild(option);
    });

    select.addEventListener("change", () => {
        if (!select.value) return;

        localStorage.setItem(LANGUAGE_KEY, select.value);
        loadLanguage(select.value);
    });
}

function showLanguagePrompt() {
    const contentArea = document.getElementById("content-area");
    contentArea.innerHTML = `
    <div style="margin-top:60px">
      <h2>Choose Hymnal Language</h2>
      <p>Please select a language from the top menu to begin.</p>
    </div>
  `;
}


// Offline message function
function showOfflineMessage() {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        <div class="offline-message">
            <h2>📴 Offline Mode</h2>
            <p>You are currently offline. The hymnal data has been cached for offline use.</p>
            <p>If this is your first time using the app, please connect to the internet to download the data.</p>
            <button onclick="window.location.reload()" class="btn-primary">
                Retry Connection
            </button>
        </div>`;
}

// Error message function
function showErrorMessage(message) {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        <div style="text-align:center; margin-top:40px; padding:20px;">
            <h2>⚠️ Error</h2>
            <p>${message}</p>
            <button onclick="window.location.reload()" style="padding:10px 20px; margin-top:20px; background:#2b5a88; color:white; border:none; border-radius:5px; cursor:pointer;">
                Try Again
            </button>
        </div>`;
}

// Update banner function
function showUpdateBanner() {
    const updateBanner = document.getElementById('update-banner');
    if (updateBanner) {
        updateBanner.style.display = 'block';
    }
}

function refreshApp() {
    // Send message to service worker to skip waiting
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
    // Reload the page
    window.location.reload();
}


// Helper Functions

// Find which physical page a specific Hymn Number is located on
function getPageFromHymnNumber(hymnNum) {
    const foundPage = hymnalData.find(p => {
        if (p.hymns && Array.isArray(p.hymns)) {
            return p.hymns.includes(parseInt(hymnNum));
        }
        return false;
    });
    return foundPage ? foundPage.page : null;
}

// Create dropdown options for the search bar
function createSearchOption(mainText, subText, clickHandler, matchScore = 0) {
    const div = document.createElement('div');
    div.className = 'search-option';
    div.setAttribute('data-score', matchScore); // Store score for potential sorting
    div.innerHTML = `
        <span class="search-label">${mainText}</span>
        <span class="search-detail">${subText}</span>
    `;
    div.addEventListener('click', clickHandler);
    document.getElementById('search-results').appendChild(div);
}

function closeSearch() {
    document.getElementById('search-results').classList.add('hidden');
    document.getElementById('search-input').value = '';
}

// helper to jump to specific sections
function goToPage(pageNum) {
    currentPage = pageNum;
    localStorage.setItem('amec-hymnal-current-page', pageNum.toString());
    renderPage(currentPage);
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


// =========================================
// 3. PAGE RENDERING LOGIC
// =========================================
function renderPage(pageNum) {
    const contentArea = document.getElementById('content-area');

    // Show loading indicator
    contentArea.innerHTML = `
        <div class="loading-indicator">
            <div class="spinner"></div>
            <p>Loading Page ${pageNum}...</p>
        </div>`;

    // Update Display Controls immediately
    document.getElementById('current-page-display').textContent = `Page ${pageNum}`;

    // Small delay to show loading state (remove in production if too slow)
    setTimeout(() => {
        // Find page data
        const pageData = hymnalData.find(p => p.page === pageNum);

        contentArea.innerHTML = ''; // Clear loading content

        if (!pageData) {
            contentArea.innerHTML = `
                <div class="page-not-found">
                    <p>Page ${pageNum} is not yet digitized.</p>
                    <p>Try searching for Page 3, 4, 5, etc.</p>
                </div>`;
            return;
        }

        // Loop through content blocks and create HTML
        pageData.content.forEach(block => {
            const div = document.createElement('div');

            if (block.type === 'heading-1') {
                div.className = 'heading-1';
                div.innerHTML = block.text;
            } else if (block.type === 'heading-2') {
                div.className = 'heading-2';
                div.innerHTML = block.text;
            } else if (block.type === 'heading-3') {
                div.className = 'heading-3';
                div.innerHTML = block.text;
            } else if (block.type === 'rubric') {
                div.className = 'rubric';
                div.innerHTML = block.text;
            } else if (block.type === 'text-block') {
                div.className = 'text-block';
                div.innerHTML = `<p>${block.text}</p>`;
            } else if (block.type === 'responsive-reading') {
                div.className = 'responsive-reading';
                div.innerHTML = `<span class="verse-num">${block.number}</span><span>${block.text}</span>`;
            } else if (block.type === 'stanza') {
                div.className = 'stanza';
                div.innerHTML = block.lines.map(line => `<p>${line}</p>`).join('');
            }

            // --- TABLE OF CONTENTS ROW ---
            else if (block.type === 'toc-row') {
                div.className = 'toc-row';

                // Check if author exists
                const authorSpan = block.author
                    ? `<span class="toc-author" style="font-size:0.85em; color:var(--rubric-color); margin-right:10px; font-style:italic;">${block.author}</span>`
                    : '';

                const numberSpan = block.number
                    ? `<span class="toc-num">${block.number}</span>`
                    : '';

                div.innerHTML = `
                    ${numberSpan}
                    <span class="toc-text">${block.text}<br>${authorSpan}</span>
                    <span class="toc-page">${block.target}</span>
                `;

                // Click to navigate
                div.addEventListener('click', () => {
                    let targetVal = block.target;

                    if (typeof targetVal === 'string' && targetVal.includes('-')) {
                        targetVal = targetVal.split('-')[0];
                    }

                    const targetNum = parseInt(targetVal);

                    if (block.isHymn) {
                        const actualPage = getPageFromHymnNumber(targetNum);
                        if (actualPage) {
                            goToPage(actualPage);
                        } else {
                            alert(`Hymn ${targetNum} content is not yet available.`);
                        }
                    } else {
                        goToPage(targetNum);
                    }
                });
            }

            contentArea.appendChild(div);
        });

        window.scrollTo(0, 0);
    });
}


// =========================================
// 4. SMART SEARCH LOGIC (UX Solution)
// =========================================
const searchInput = document.getElementById('search-input');
const container = document.querySelector('.search-container');

// Create Results Dropdown if not exists
let resultsContainer = document.getElementById('search-results');
if (!resultsContainer) {
    resultsContainer = document.createElement('div');
    resultsContainer.id = 'search-results';
    resultsContainer.className = 'hidden';
    container.appendChild(resultsContainer);
}

// Debounce search to improve performance
let searchTimeout;
function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(performSearch, 150); // 150ms delay
}

// Live Search Listener with debouncing
searchInput.addEventListener('input', debounceSearch);

// Also search on Enter key
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        clearTimeout(searchTimeout);
        performSearch();
    }
});

// Main search function
function performSearch() {
    const query = searchInput.value.toLowerCase().trim();
    resultsContainer.innerHTML = ''; // Clear previous

    if (!query) {
        resultsContainer.classList.add('hidden');
        return;
    }

    resultsContainer.classList.remove('hidden');
    let resultsCount = 0;
    const maxResults = 15; // Limit to prevent lag

    // --- CASE A: NUMBER SEARCH (Specific Page or Hymn) ---
    if (!isNaN(query)) {
        const num = parseInt(query);

        // 1. Check if it exists as a PAGE
        const pageExists = hymnalData.find(p => p.page === num);
        if (pageExists) {
            createSearchOption(`Go to <strong>Page ${num}</strong>`, pageExists.title, () => {
                goToPage(num);
                closeSearch();
            });
            resultsCount++;
        }

        // 2. Check if it exists as a HYMN
        const hymnPage = getPageFromHymnNumber(num);
        if (hymnPage) {
            createSearchOption(`Go to <strong>Hymn ${num}</strong>`, `On Page ${hymnPage}`, () => {
                goToPage(hymnPage);
                closeSearch();
            });
            resultsCount++;
        }
    }

    // --- CASE B: TEXT SEARCH (Lyrics & Titles) ---
    else {
        // Iterate through all pages
        for (const page of hymnalData) {
            if (resultsCount >= maxResults) break;

            let matchFoundOnPage = false;
            let snippet = '';
            let mainLabel = page.title;
            let matchScore = 0; // For ranking results

            // 1. Check Title Match (highest priority)
            if (page.title.toLowerCase().includes(query)) {
                matchFoundOnPage = true;
                matchScore = 10; // High score for title matches
                // Highlight query in title
                mainLabel = page.title.replace(new RegExp(`(${query})`, 'gi'), '<span class="search-highlight">$1</span>');
                snippet = `Page ${page.page}`;
            }

            // 2. Check Content (Lyrics, Authors, Rubrics) if no title match yet
            if (!matchFoundOnPage && page.content) {
                for (const block of page.content) {
                    if (matchFoundOnPage) break; // Stop looking if we found a match on this page

                    // Check Stanzas (lyrics)
                    if (block.type === 'stanza' && block.lines) {
                        for (const line of block.lines) {
                            if (line.toLowerCase().includes(query)) {
                                matchFoundOnPage = true;
                                matchScore = 5; // Medium score for lyric matches

                                // Create a neat snippet with more context
                                const highlightedLine = line.replace(new RegExp(`(${query})`, 'gi'), '<span class="search-highlight">$1</span>');
                                snippet = `"...${highlightedLine}..."`;

                                // Try to identify which Hymn this is
                                if (page.hymns && page.hymns.length > 0) {
                                    mainLabel = `Hymn ${page.hymns.join('/')}`;
                                } else {
                                    mainLabel = page.title;
                                }
                                break;
                            }
                        }
                    }
                    // Check TOC Rows (for Index search) - includes author names
                    else if (block.type === 'toc-row') {
                        // Check title text
                        if (block.text.toLowerCase().includes(query)) {
                            matchFoundOnPage = true;
                            matchScore = 8; // High score for TOC matches
                            mainLabel = block.text.replace(new RegExp(`(${query})`, 'gi'), '<span class="search-highlight">$1</span>');
                            snippet = `Index Entry (Goes to Page ${block.target})`;
                        }
                        // Check author name
                        else if (block.author && block.author.toLowerCase().includes(query)) {
                            matchFoundOnPage = true;
                            matchScore = 7; // Good score for author matches
                            mainLabel = block.text;
                            const highlightedAuthor = block.author.replace(new RegExp(`(${query})`, 'gi'), '<span class="search-highlight">$1</span>');
                            snippet = `By ${highlightedAuthor} (Page ${block.target})`;
                        }
                    }
                    // Check Rubrics
                    else if (block.type === 'rubric' && block.text.toLowerCase().includes(query)) {
                        matchFoundOnPage = true;
                        matchScore = 6; // Medium score for rubric matches
                        mainLabel = page.title;
                        const highlightedRubric = block.text.replace(new RegExp(`(${query})`, 'gi'), '<span class="search-highlight">$1</span>');
                        snippet = `Rubric: ${highlightedRubric}`;
                    }
                }
            }

            // If we found something on this page, add it to results
            if (matchFoundOnPage) {
                createSearchOption(mainLabel, snippet, () => {
                    goToPage(page.page);
                    closeSearch();
                }, matchScore);
                resultsCount++;
            }
        }
    }

    if (resultsCount === 0) {
        resultsContainer.innerHTML = '<div class="search-option" style="cursor:default; color:#888;">No results found</div>';
    }
}

// Close search when clicking outside
document.addEventListener('click', (e) => {
    // Check if the clicked element is NOT inside the search container
    if (!e.target.closest('.search-container')) {
        closeSearch();
    }
});

// Keyboard navigation for search results
let selectedResultIndex = -1;

searchInput.addEventListener('keydown', (e) => {
    const results = document.querySelectorAll('#search-results .search-option');
    if (results.length === 0) return;

    // Remove previous selection
    results.forEach(result => result.classList.remove('selected'));

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedResultIndex = Math.min(selectedResultIndex + 1, results.length - 1);
        results[selectedResultIndex].classList.add('selected');
        results[selectedResultIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedResultIndex = Math.max(selectedResultIndex - 1, 0);
        results[selectedResultIndex].classList.add('selected');
        results[selectedResultIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && selectedResultIndex >= 0) {
        e.preventDefault();
        results[selectedResultIndex].click();
    } else if (e.key === 'Escape') {
        closeSearch();
        searchInput.blur();
    }
});

// Reset selection when search changes
searchInput.addEventListener('input', () => {
    selectedResultIndex = -1;
});
document.getElementById('prev-page').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        localStorage.setItem('amec-hymnal-current-page', currentPage.toString());
        renderPage(currentPage);
    }
});

// Next Button Logic checks maxPage
document.getElementById('next-page').addEventListener('click', () => {
    if (currentPage < maxPage) {
        currentPage++;
        localStorage.setItem('amec-hymnal-current-page', currentPage.toString());
        renderPage(currentPage);
    } else {
        // Optional: Visual feedback that we are at the end
        // alert("You have reached the last page.");
    }
});


// Settings (Theme & Font)
document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    saveThemePreference(); // Save the preference
});

document.getElementById('font-toggle').addEventListener('click', () => {
    document.body.classList.toggle('large-font');
    saveFontPreference(); // Save the preference
});


// Swipe Gesture Logic (Mobile)
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let touchEndX = 0;
let touchEndY = 0;
let touchEndTime = 0;

// Swipe thresholds
const minSwipeDistance = 80; // Increased from 50 for less sensitivity
const maxVerticalMovement = 100; // Prevent diagonal swipes
const maxSwipeTime = 500; // Maximum time for a valid swipe (ms)
const minSwipeVelocity = 0.3; // Minimum velocity for swipe recognition

// Swipe feedback element
let swipeIndicator = null;

function createSwipeIndicator() {
    if (!swipeIndicator) {
        swipeIndicator = document.createElement('div');
        swipeIndicator.id = 'swipe-indicator';
        swipeIndicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: bold;
            z-index: 10000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        document.body.appendChild(swipeIndicator);
    }
    return swipeIndicator;
}

function showSwipeFeedback(direction) {
    const indicator = createSwipeIndicator();
    const arrow = direction === 'left' ? '→' : '←';
    const text = direction === 'left' ? 'Next Page' : 'Previous Page';

    indicator.innerHTML = `${arrow} ${text}`;
    indicator.style.opacity = '1';
    indicator.style.transform = 'translate(-50%, -50%) scale(1.1)';
    indicator.style.background = 'rgba(43, 90, 136, 0.9)';

    // Add success animation
    setTimeout(() => {
        indicator.style.transform = 'translate(-50%, -50%) scale(1)';
        indicator.style.background = 'rgba(0, 0, 0, 0.8)';
    }, 100);

    // Hide after animation
    setTimeout(() => {
        indicator.style.opacity = '0';
        indicator.style.transform = 'translate(-50%, -50%) scale(0.9)';
    }, 800);
}

document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    touchStartTime = Date.now();

    // Prevent swipe if touching interactive elements
    const target = e.target;
    if (target.tagName === 'BUTTON' || target.tagName === 'A' ||
        target.closest('.search-option') || target.closest('.toc-row')) {
        return;
    }
}, { passive: true });

document.addEventListener('touchmove', e => {
    if (touchStartX === 0) return; // Only track if we have a start position

    const currentX = e.changedTouches[0].screenX;
    const currentY = e.changedTouches[0].screenY;
    const deltaX = currentX - touchStartX;
    const deltaY = currentY - touchStartY;

    // Show real-time swipe feedback if movement is significant and primarily horizontal
    if (Math.abs(deltaX) > 30 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        const indicator = createSwipeIndicator();
        const direction = deltaX < 0 ? 'left' : 'right';
        const arrow = direction === 'left' ? '→' : '←';
        const text = direction === 'left' ? 'Next Page' : 'Previous Page';
        const progress = Math.min(Math.abs(deltaX) / minSwipeDistance, 1);
        const opacity = progress * 0.8;

        indicator.innerHTML = `${arrow} ${text}`;
        indicator.style.opacity = opacity.toString();

        // Add a subtle scale effect based on progress
        const scale = 0.9 + (progress * 0.1);
        indicator.style.transform = `translate(-50%, -50%) scale(${scale})`;
    }
}, { passive: true });

document.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    touchEndTime = Date.now();

    // Hide any showing indicator
    if (swipeIndicator) {
        swipeIndicator.style.opacity = '0';
    }

    handleSwipe();
}, { passive: true });

document.addEventListener('touchcancel', e => {
    // Reset touch variables and hide indicator if touch is cancelled
    touchStartX = 0;
    touchStartY = 0;
    touchStartTime = 0;
    touchEndX = 0;
    touchEndY = 0;
    touchEndTime = 0;

    if (swipeIndicator) {
        swipeIndicator.style.opacity = '0';
    }
}, { passive: true });

function handleSwipe() {
    const distanceX = touchEndX - touchStartX;
    const distanceY = touchEndY - touchStartY;
    const elapsedTime = touchEndTime - touchStartTime;

    // Check if swipe is valid
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);
    const isValidDistance = Math.abs(distanceX) > minSwipeDistance;
    const isValidTime = elapsedTime < maxSwipeTime;
    const isValidVertical = Math.abs(distanceY) < maxVerticalMovement;
    const velocity = Math.abs(distanceX) / elapsedTime;

    if (isHorizontalSwipe && isValidDistance && isValidTime && isValidVertical && velocity > minSwipeVelocity) {
        // Determine swipe direction
        if (distanceX < 0) {
            // Swipe LEFT (finger moved right to left) -> Next Page
            if (currentPage < maxPage) {
                // showSwipeFeedback('left');
                goToPage(currentPage + 1);

                // Haptic feedback if available
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }
        } else {
            // Swipe RIGHT (finger moved left to right) -> Previous Page
            if (currentPage > 1) {
                // showSwipeFeedback('right');
                goToPage(currentPage - 1);

                // Haptic feedback if available
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }
        }
    }

    // Reset touch variables
    touchStartX = 0;
    touchStartY = 0;
    touchStartTime = 0;
    touchEndX = 0;
    touchEndY = 0;
    touchEndTime = 0;
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration.scope);

                // Check for updates immediately
                registration.update();

                // Listen for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // New version available - show update prompt
                                showUpdateBanner();
                            }
                        });
                    }
                });
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// Offline Detection & Indicator
// function updateOnlineStatus() {
//     const offlineIndicator = document.getElementById('offline-indicator');
//     if (navigator.onLine) {
//         offlineIndicator.style.display = 'none';
//         console.log('Back online');
//     } else {
//         offlineIndicator.style.display = 'inline';
//         console.log('Gone offline');
//     }
// }

// Listen for online/offline events
// window.addEventListener('online', updateOnlineStatus);
// window.addEventListener('offline', updateOnlineStatus);

// Check initial status
// updateOnlineStatus();

// Theme Persistence
function loadThemePreference() {
    const savedTheme = localStorage.getItem('amec-hymnal-theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

function saveThemePreference() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('amec-hymnal-theme', isDarkMode ? 'dark' : 'light');
}

function loadFontPreference() {
    const savedFont = localStorage.getItem('amec-hymnal-font');
    if (savedFont === 'large') {
        document.body.classList.add('large-font');
    } else {
        document.body.classList.remove('large-font');
    }
}

function saveFontPreference() {
    const isLargeFont = document.body.classList.contains('large-font');
    localStorage.setItem('amec-hymnal-font', isLargeFont ? 'large' : 'normal');
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // Ignore if user is typing in an input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }

    switch (e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            if (currentPage > 1) {
                goToPage(currentPage - 1);
            }
            break;
        case 'ArrowRight':
            e.preventDefault();
            if (currentPage < maxPage) {
                goToPage(currentPage + 1);
            }
            break;
        case 'Home':
            e.preventDefault();
            goToPage(3); // Go to Table of Contents
            break;
        case 'End':
            e.preventDefault();
            goToPage(maxPage); // Go to last page
            break;
        case 'f':
        case 'F':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                document.getElementById('search-input').focus();
            }
            break;
    }
});

// Load Preferences

// Load preferences on app start
loadThemePreference();
loadFontPreference();