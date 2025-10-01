const API_BASE = '/api';
let currentShortCode = null;

// Setup event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Shorten button
    const shortenBtn = document.getElementById('shortenBtn');
    if (shortenBtn) {
        shortenBtn.addEventListener('click', shortenUrl);
    }

    // Custom alias checkbox
    const customAliasCheckbox = document.getElementById('useCustomAlias');
    if (customAliasCheckbox) {
        customAliasCheckbox.addEventListener('change', toggleCustomAlias);
    }

    // Copy button
    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', copyToClipboard);
    }

    // Analytics button
    const analyticsBtn = document.getElementById('analyticsBtn');
    if (analyticsBtn) {
        analyticsBtn.addEventListener('click', showAnalytics);
    }

    // Close modal button
    const closeModal = document.getElementById('closeModal');
    if (closeModal) {
        closeModal.addEventListener('click', closeAnalytics);
    }

    // Enter key support
    const urlInput = document.getElementById('urlInput');
    if (urlInput) {
        urlInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                shortenUrl();
            }
        });
    }

    // Load recent URLs
    loadRecentUrls();
});

function toggleCustomAlias() {
    const checkbox = document.getElementById('useCustomAlias');
    const input = document.getElementById('customAliasInput');
    
    if (checkbox.checked) {
        input.classList.remove('hidden');
    } else {
        input.classList.add('hidden');
        input.value = '';
    }
}

async function shortenUrl() {
    console.log('Shorten button clicked'); // Debug log
    
    const urlInput = document.getElementById('urlInput');
    const customAliasInput = document.getElementById('customAliasInput');
    const useCustom = document.getElementById('useCustomAlias').checked;
    
    const url = urlInput.value.trim();
    
    console.log('URL to shorten:', url); // Debug log
    
    if (!url) {
        showError('Please enter a URL');
        return;
    }

    const requestBody = { originalUrl: url };
    
    if (useCustom && customAliasInput.value.trim()) {
        requestBody.customAlias = customAliasInput.value.trim();
    }

    console.log('Request body:', requestBody); // Debug log

    try {
        const response = await fetch(`${API_BASE}/shorten`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Response status:', response.status); // Debug log

        const data = await response.json();
        console.log('Response data:', data); // Debug log

        if (response.ok) {
            displayResult(data.shortUrl, data.shortCode);
            loadRecentUrls();
            urlInput.value = '';
            if (customAliasInput) {
                customAliasInput.value = '';
            }
            if (document.getElementById('useCustomAlias')) {
                document.getElementById('useCustomAlias').checked = false;
                toggleCustomAlias();
            }
        } else {
            showError(data.error || 'Failed to shorten URL');
        }
    } catch (error) {
        console.error('Error:', error); // Debug log
        showError('Network error. Please try again.');
    }
}

function displayResult(shortUrl, shortCode) {
    currentShortCode = shortCode;
    document.getElementById('shortUrlDisplay').value = shortUrl;
    document.getElementById('result').classList.remove('hidden');
    document.getElementById('error').classList.add('hidden');
}

function copyToClipboard() {
    const shortUrlDisplay = document.getElementById('shortUrlDisplay');
    shortUrlDisplay.select();
    document.execCommand('copy');
    
    // Visual feedback
    const button = event.target;
    const originalText = button.innerText;
    button.innerText = 'Copied!';
    button.style.background = '#48bb78';
    
    setTimeout(() => {
        button.innerText = originalText;
        button.style.background = '';
    }, 2000);
}

async function loadRecentUrls() {
    try {
        const response = await fetch(`${API_BASE}/urls`);
        const data = await response.json();
        
        const container = document.getElementById('recentUrls');
        
        if (data.urls && data.urls.length > 0) {
            container.innerHTML = data.urls.map(url => {
                // Filter out malformed URLs
                if (url.shortUrl && url.shortUrl.includes('process.env')) {
                    return '';
                }
                
                return `
                    <div class="url-item">
                        <div class="url-info">
                            <div class="original-url">${url.originalUrl}</div>
                            <div class="short-url">${url.shortUrl}</div>
                        </div>
                        <span class="click-count">${url.clicks} clicks</span>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p>No URLs shortened yet</p>';
        }
    } catch (error) {
        console.error('Failed to load recent URLs:', error);
        document.getElementById('recentUrls').innerHTML = '<p>Failed to load URLs</p>';
    }
}

async function showAnalytics() {
    if (!currentShortCode) {
        showError('Please shorten a URL first');
        return;
    }
    
    // Show loading state
    document.getElementById('analyticsContent').innerHTML = '<p>Loading analytics...</p>';
    document.getElementById('analyticsModal').classList.remove('hidden');
    
    try {
        const response = await fetch(`${API_BASE}/analytics/${currentShortCode}`);
        const data = await response.json();
        
        if (response.ok) {
            displayAnalytics(data);
        } else {
            showError('Failed to load analytics');
            closeAnalytics();
        }
    } catch (error) {
        showError('Failed to load analytics');
        closeAnalytics();
    }
}

function displayAnalytics(data) {
    const content = document.getElementById('analyticsContent');
    
    content.innerHTML = `
        <div class="analytics-section">
            <h3>Overview</h3>
            <p><strong>Original URL:</strong> ${data.url.originalUrl}</p>
            <p><strong>Total Clicks:</strong> ${data.url.totalClicks}</p>
            <p><strong>Created:</strong> ${new Date(data.url.createdAt).toLocaleDateString()}</p>
            <p><strong>Last Accessed:</strong> ${data.url.lastAccessed ? new Date(data.url.lastAccessed).toLocaleString() : 'Never'}</p>
        </div>
        
        <div class="analytics-section">
            <h3>Clicks by Day (Last 7 days)</h3>
            ${data.analytics.clicksByDay.length > 0 ? 
                data.analytics.clicksByDay.map(day => 
                    `<p>${day._id}: ${day.count} clicks</p>`
                ).join('') : 
                '<p>No clicks yet</p>'
            }
        </div>
        
        <div class="analytics-section">
            <h3>Top Referrers</h3>
            ${data.analytics.topReferrers.length > 0 ?
                data.analytics.topReferrers.map(ref => 
                    `<p>${ref._id}: ${ref.count} clicks</p>`
                ).join('') :
                '<p>No referrer data</p>'
            }
        </div>
    `;
    
    document.getElementById('analyticsModal').classList.remove('hidden');
}

function closeAnalytics() {
    document.getElementById('analyticsModal').classList.add('hidden');
}

function showError(message) {
    console.error('Error shown:', message); // Debug log
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    
    setTimeout(() => {
        errorDiv.classList.add('hidden');
    }, 5000);
}

// Close modal when clicking outside of it
window.addEventListener('click', function(event) {
    const modal = document.getElementById('analyticsModal');
    if (event.target === modal) {
        closeAnalytics();
    }
});