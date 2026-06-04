// ==================== CONFIGURATION ====================
const API_URL = 'http://localhost:3000';
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
let allMedia = [];
let selectedBatchIds = new Set();

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    if (authToken && currentUser) {
        showDashboard();
    } else {
        showHomeScreen();
    }
    
    const remembered = localStorage.getItem('rememberMe') === 'true';
    if (remembered && currentUser) {
        document.getElementById('rememberMe').checked = true;
    }
});

// Scroll effect for dashboard header
window.addEventListener('scroll', () => {
    const header = document.getElementById('mainHeader');
    if (header && window.scrollY > 30) {
        header.classList.add('scrolled');
    } else if (header) {
        header.classList.remove('scrolled');
    }
});

// Close dropdowns on outside click
document.addEventListener('click', function(e) {
    if (!e.target.closest('.search-container')) {
        const dropdown = document.getElementById('searchDropdown');
        if (dropdown) dropdown.style.display = 'none';
    }
    if (!e.target.closest('.form-field')) {
        const genreList = document.getElementById('genreDropdownList');
        if (genreList) genreList.classList.remove('open');
    }
});

// ==================== NAVIGATION FUNCTIONS ====================
function showHomeScreen() {
    document.getElementById('homeScreen').classList.remove('hidden');
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('dashboardScreen').classList.add('hidden');
    
    const video = document.querySelector('.video-background');
    const overlay = document.querySelector('.overlay');
    if (video) video.style.display = 'block';
    if (overlay) overlay.style.display = 'block';
}

function showAuthScreen(formToShow = 'signInCard') {
    document.getElementById('homeScreen').classList.add('hidden');
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('dashboardScreen').classList.add('hidden');
    
    const video = document.querySelector('.video-background');
    const overlay = document.querySelector('.overlay');
    if (video) video.style.display = 'block';
    if (overlay) overlay.style.display = 'block';
    
    switchAuthForm(formToShow);
}

function showDashboard() {
    document.getElementById('homeScreen').classList.add('hidden');
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('dashboardScreen').classList.remove('hidden');
    
    const video = document.querySelector('.video-background');
    const overlay = document.querySelector('.overlay');
    if (video) video.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
    
    if (currentUser && currentUser.role === 'admin') {
        showAdminPanel();
    } else {
        showUserDashboard();
    }
    
    updateDashboardUI();
    loadAllMedia();
}

function showUserDashboard() {
    const adminPanel = document.getElementById('adminPanelRoot');
    if (adminPanel) adminPanel.style.display = 'none';
    
    document.querySelectorAll('.page').forEach(page => {
        if (page.id !== 'adminPanelRoot') {
            page.style.display = '';
        }
    });
    
    const normalNav = document.querySelector('.nav-links');
    if (normalNav) normalNav.style.display = 'flex';
    
    navigateTo('home');
}

function navigateTo(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
    
    const page = document.getElementById(`page-${pageId}`);
    if (page) page.classList.add('active');
    
    const link = document.getElementById(`link-${pageId}`);
    if (link) link.classList.add('active');
    
    const playerContainer = document.getElementById('playerContainer');
    const videoPlayer = document.getElementById('videoPlayer');
    if (playerContainer) playerContainer.style.display = 'none';
    if (videoPlayer) videoPlayer.src = '';
    
    const searchInput = document.getElementById('globalSearch');
    const searchDropdown = document.getElementById('searchDropdown');
    if (searchInput) searchInput.value = '';
    if (searchDropdown) searchDropdown.style.display = 'none';
    
    const genreList = document.getElementById('genreDropdownList');
    if (genreList) genreList.classList.remove('open');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchAuthForm(formId) {
    document.getElementById('signInCard').classList.add('hidden');
    document.getElementById('signUpCard').classList.add('hidden');
    document.getElementById(formId).classList.remove('hidden');
    clearAllErrors();
    clearAllInputs();
}

// ==================== AUTH FUNCTIONS ====================
function validateLoginForm(username, password) {
    let isValid = true;
    document.getElementById('loginUsernameError').textContent = '';
    document.getElementById('loginPasswordError').textContent = '';
    document.getElementById('loginGeneralError').textContent = '';
    document.getElementById('loginGeneralError').classList.remove('show');
    
    if (!username || username.trim().length < 3) {
        document.getElementById('loginUsernameError').textContent = 'Username must be at least 3 characters';
        isValid = false;
    }
    if (!password || password.length < 6) {
        document.getElementById('loginPasswordError').textContent = 'Password must be at least 6 characters';
        isValid = false;
    }
    return isValid;
}

function validateRegisterForm(username, password, confirmPassword) {
    let isValid = true;
    document.getElementById('regUsernameError').textContent = '';
    document.getElementById('regPasswordError').textContent = '';
    document.getElementById('regConfirmPasswordError').textContent = '';
    document.getElementById('registerGeneralError').textContent = '';
    document.getElementById('registerGeneralError').classList.remove('show');
    
    if (!username || username.trim().length < 3) {
        document.getElementById('regUsernameError').textContent = 'Username must be at least 3 characters';
        isValid = false;
    }
    if (!password || password.length < 6) {
        document.getElementById('regPasswordError').textContent = 'Password must be at least 6 characters';
        isValid = false;
    }
    if (password !== confirmPassword) {
        document.getElementById('regConfirmPasswordError').textContent = 'Passwords do not match';
        isValid = false;
    }
    return isValid;
}

async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    if (!validateLoginForm(username, password)) return;
    
    const loginBtn = document.getElementById('loginBtnText');
    loginBtn.textContent = '⏳ Signing in...';
    
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
        } else {
            localStorage.removeItem('rememberMe');
        }
        
        showDashboard();
        triggerToast(`Welcome back, ${currentUser.username}! 🎉`);
        
    } catch (error) {
        document.getElementById('loginGeneralError').textContent = error.message;
        document.getElementById('loginGeneralError').classList.add('show');
    } finally {
        loginBtn.textContent = 'Sign In';
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    
    if (!validateRegisterForm(username, password, confirmPassword)) return;
    
    const registerBtn = document.getElementById('registerBtnText');
    registerBtn.textContent = '⏳ Creating Account...';
    
    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }
        
        triggerToast('Account created successfully! Please sign in. 🎊');
        switchAuthForm('signInCard');
        document.getElementById('loginUsername').value = username;
        
    } catch (error) {
        document.getElementById('registerGeneralError').textContent = error.message;
        document.getElementById('registerGeneralError').classList.add('show');
    } finally {
        registerBtn.textContent = 'Register';
    }
}

function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('rememberMe');
    allMedia = [];
    selectedBatchIds.clear();
    showHomeScreen();
    triggerToast('Logged out successfully 👋');
}

// ==================== DASHBOARD UI ====================
function updateDashboardUI() {
    if (currentUser) {
        const welcomeText = document.getElementById('welcomeText');
        if (welcomeText) welcomeText.textContent = `Welcome, ${currentUser.username}`;
        
        const profileUserId = document.getElementById('profileUserId');
        const profileUsername = document.getElementById('profileUsername');
        const profileRole = document.getElementById('profileRole');
        const profileStatus = document.getElementById('profileStatus');
        
        if (profileUserId) profileUserId.value = currentUser.id || 'N/A';
        if (profileUsername) profileUsername.value = currentUser.username || 'N/A';
        if (profileRole) profileRole.value = currentUser.role || 'User';
        if (profileStatus) profileStatus.value = currentUser.banned ? 'Banned' : 'Active';
    }
}

// ==================== UPDATE PROFILE (FIXED) ====================
async function handleUpdateProfile(event) {
    event.preventDefault();
    
    const newUsername = document.getElementById('profileUsername').value;
    
    if (!newUsername || newUsername.trim().length < 3) {
        triggerToast('Username must be at least 3 characters', 'error');
        return;
    }
    
    const saveBtn = document.querySelector('#page-profile .btn-update');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '⏳ Saving...';
    saveBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ username: newUsername.trim() })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to update profile');
        }
        
        // IMPORTANT: Update both token and user data
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        updateDashboardUI();
        triggerToast('Profile updated successfully! ✨');
        
        // Reload media to update creator names
        loadAllMedia();
        
    } catch (error) {
        triggerToast(error.message, 'error');
    } finally {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
}

// ==================== IMPROVED IMDB FETCH WITH TRAILER ====================
async function fetchFromIMDB(title, type = 'movie') {
    try {
        const OMDB_API_KEY = 'd87e94f0'; 
        
        // First fetch movie/show data
        const response = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(title)}&type=${type}&apikey=${OMDB_API_KEY}`);
        if (!response.ok) throw new Error('IMDB API error');
        const data = await response.json();
        if (data.Response === 'False') throw new Error(data.Error);
        
        // Generate YouTube trailer URL based on title
        const trailerQuery = encodeURIComponent(`${data.Title} ${data.Year} trailer official`);
        const trailerUrl = `https://www.youtube.com/embed/results?search_query=${trailerQuery}`;
        // For actual trailer embed, use a search or pre-defined pattern
        const actualTrailerUrl = `https://www.youtube.com/embed/watch?v=${generateYouTubeSearchQuery(data.Title, data.Year)}`;
        
        return {
            title: data.Title,
            year: data.Year,
            rating: `IMDb ${data.imdbRating}`,
            genre: data.Genre,
            img: data.Poster !== 'N/A' ? data.Poster : 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=400',
            description: data.Plot,
            url: generateTrailerUrl(data.Title, data.Year) // Generate trailer URL
        };
    } catch (error) {
        console.error('IMDB fetch error:', error);
        triggerToast(`IMDB Error: ${error.message}`, 'error');
        return null;
    }
}

// Helper function to generate YouTube trailer URL
function generateTrailerUrl(title, year) {
    // This is a simplified version - in production, use YouTube API
    const searchQuery = encodeURIComponent(`${title} ${year} official trailer`);
    return `https://occ-0-7329-784.1.nflxso.net/so/soa2/678/1798200209445819649.mp4?v=1&e=1780592708&t=--NQWm4B79aPqfDaVQeQlLeGzIg`;
}

function generateYouTubeSearchQuery(title, year) {
    // Just a placeholder - real implementation would use YouTube API
    return `dQw4w9WgXcQ`; // Placeholder
}

async function handleIMDBFetch(fieldPrefix) {
    const titleInput = document.getElementById(`${fieldPrefix}Title`);
    const title = titleInput?.value;
    if (!title || title.length < 2) {
        triggerToast('Please enter a title first', 'error');
        return;
    }
    
    const typeSelect = document.getElementById(`${fieldPrefix}Type`);
    const type = typeSelect ? typeSelect.value : 'movie';
    
    const imdbBtn = event.target;
    const originalText = imdbBtn.textContent;
    imdbBtn.textContent = '⏳ Fetching...';
    imdbBtn.disabled = true;
    
    const data = await fetchFromIMDB(title, type);
    
    if (data) {
        if (fieldPrefix === 'upload') {
            if (document.getElementById('uploadYear')) document.getElementById('uploadYear').value = data.year;
            if (document.getElementById('uploadRating')) document.getElementById('uploadRating').value = data.rating;
            if (document.getElementById('uploadImg')) document.getElementById('uploadImg').value = data.img;
            if (document.getElementById('uploadDesc')) document.getElementById('uploadDesc').value = data.description;
            if (document.getElementById('uploadUrl')) document.getElementById('uploadUrl').value = data.url;
            
            // Update genre dropdown
            const genreCheckboxes = document.querySelectorAll('#genreDropdownList input[type="checkbox"]');
            genreCheckboxes.forEach(cb => cb.checked = false);
            if (data.genre) {
                const genres = data.genre.split(', ');
                genreCheckboxes.forEach(cb => {
                    if (genres.some(g => g.toLowerCase().includes(cb.value.toLowerCase()))) {
                        cb.checked = true;
                    }
                });
                updateGenreText();
            }
        } else if (fieldPrefix === 'adminMedia') {
            if (document.getElementById('adminMediaYear')) document.getElementById('adminMediaYear').value = data.year;
            if (document.getElementById('adminMediaRating')) document.getElementById('adminMediaRating').value = data.rating;
            if (document.getElementById('adminMediaGenre')) document.getElementById('adminMediaGenre').value = data.genre;
            if (document.getElementById('adminMediaImg')) document.getElementById('adminMediaImg').value = data.img;
            if (document.getElementById('adminMediaDesc')) document.getElementById('adminMediaDesc').value = data.description;
            if (document.getElementById('adminMediaUrl')) document.getElementById('adminMediaUrl').value = data.url;
        }
        triggerToast('IMDB data loaded successfully! 🎬');
    }
    
    imdbBtn.textContent = originalText;
    imdbBtn.disabled = false;
}

// ==================== LOAD & RENDER MEDIA (LIMITED TO 20 IN HOME) ====================
async function loadAllMedia() {
    try {
        const response = await fetch(`${API_URL}/movies`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                handleLogout();
                return;
            }
            throw new Error('Failed to load media');
        }
        
        allMedia = await response.json();
        console.log('Loaded media:', allMedia);
        renderAllContent();
        if (currentUser?.role === 'admin') {
            loadAdminMedia();
        }
        
    } catch (error) {
        console.error('Load media error:', error);
        triggerToast('Error loading content', 'error');
    }
}

function renderAllContent() {
    // For Home sections - limit to 10 items each with horizontal scroll
    const trendingItems = [...allMedia].slice(0, 10);
    const homeUploads = allMedia.filter(m => m.userId === currentUser?.id).slice(0, 10);
    const homeMovies = allMedia.filter(m => m.type === 'movie').slice(0, 10);
    const homeShows = allMedia.filter(m => m.type === 'show').slice(0, 10);
    
    // For All pages - show everything
    const allMovies = allMedia.filter(m => m.type === 'movie');
    const allShows = allMedia.filter(m => m.type === 'show');
    const allUploads = allMedia.filter(m => m.userId === currentUser?.id);
    
    // Render Home sections with horizontal scroll
    renderHorizontalGrid('trending-grid', trendingItems);
    renderHorizontalGrid('home-uploads-grid', homeUploads);
    renderHorizontalGrid('home-movies-grid', homeMovies);
    renderHorizontalGrid('home-shows-grid', homeShows);
    
    // Render full pages
    renderFullGrid('all-movies-grid', allMovies);
    renderFullGrid('all-shows-grid', allShows);
    renderFullGrid('all-uploads-grid', allUploads);
    
    refreshBillboard();
}

function renderHorizontalGrid(gridId, items) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    
    grid.innerHTML = '';
    grid.style.display = 'flex';
    grid.style.overflowX = 'auto';
    grid.style.gap = '15px';
    grid.style.padding = '10px 0';
    grid.style.scrollbarWidth = 'thin';
    
    items.forEach(item => {
        const card = createHorizontalCard(item);
        grid.innerHTML += card;
    });
}

function createHorizontalCard(item) {
    const isOwner = currentUser && item.userId === currentUser.id;
    const canEdit = isOwner;
    
    return `
        <div class="movie-card" style="min-width: 180px; max-width: 180px;" onclick="openMediaDetails('${item.id}')">
            <img src="${escapeHtml(item.img || 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=400')}" alt="${escapeHtml(item.title)}" style="width: 100%; height: 100%; object-fit: cover;">
            <div class="card-info">
                <div class="card-title">${escapeHtml(item.title)}</div>
                <div class="card-meta">${escapeHtml(item.rating || 'IMDb N/A')} • ${escapeHtml(item.year || 'N/A')}</div>
                ${canEdit ? `
                    <div style="display: flex; gap: 5px; margin-top: 8px;">
                        <button onclick="event.stopPropagation(); openEditModal('${item.id}')" style="background: #E50914; border: none; color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 10px;">
                            ✏️ Edit
                        </button>
                        <button onclick="event.stopPropagation(); handleDeleteMedia('${item.id}')" style="background: #333; border: none; color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 10px;">
                            🗑️ Delete
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function renderFullGrid(gridId, items) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    
    grid.innerHTML = '';
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
    grid.style.gap = '20px';
    
    items.forEach(item => {
        const card = createFullCard(item);
        grid.innerHTML += card;
    });
}

function createFullCard(item) {
    const isOwner = currentUser && item.userId === currentUser.id;
    const canEdit = isOwner;
    
    return `
        <div class="movie-card" onclick="openMediaDetails('${item.id}')">
            <img src="${escapeHtml(item.img || 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=400')}" alt="${escapeHtml(item.title)}">
            <div class="card-info">
                <div class="card-title">${escapeHtml(item.title)}</div>
                <div class="card-meta">${escapeHtml(item.rating || 'IMDb N/A')} • ${escapeHtml(item.year || 'N/A')}</div>
                <div class="card-meta" style="font-size: 10px; color: #888;">By: ${escapeHtml(item.createdBy || 'Unknown')}</div>
                ${canEdit ? `
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button onclick="event.stopPropagation(); openEditModal('${item.id}')" style="background: #E50914; border: none; color: white; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                            ✏️ Edit
                        </button>
                        <button onclick="event.stopPropagation(); handleDeleteMedia('${item.id}')" style="background: #333; border: none; color: white; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                            🗑️ Delete
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// ==================== MEDIA DETAILS ====================
function openMediaDetails(id) {
    const item = allMedia.find(m => m.id === id);
    if (!item) {
        console.error('Media not found:', id);
        return;
    }

    console.log('Opening media:', item);
    navigateTo('details');

    document.getElementById('detail-title').innerText = item.title || 'No Title';
    document.getElementById('detail-desc').innerText = item.description || item.desc || 'No description available.';
    document.getElementById('detail-img').src = item.img || 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=400';
    document.getElementById('detail-match').innerText = item.match || '98% Match';
    document.getElementById('detail-year').innerText = item.year || 'N/A';
    document.getElementById('detail-rating').innerText = item.rating || 'IMDb N/A';
    document.getElementById('detail-genre').innerText = item.genre || 'General';

    const watchBtn = document.getElementById('main-watch-btn');
    const seasonsSection = document.getElementById('seasonsSection');
    const playerContainer = document.getElementById('playerContainer');
    const videoPlayer = document.getElementById('videoPlayer');

    if (playerContainer) playerContainer.style.display = 'none';
    if (videoPlayer) videoPlayer.src = '';

    if (item.type === 'movie') {
        if (seasonsSection) seasonsSection.style.display = 'none';
        if (watchBtn) {
            watchBtn.style.display = 'inline-block';
            watchBtn.onclick = function() {
                playVideo(item.url || 'https://occ-0-7329-784.1.nflxso.net/so/soa2/678/1798200209445819649.mp4?v=1&e=1780592708&t=--NQWm4B79aPqfDaVQeQlLeGzIg');
            };
        }
    } else {
        if (watchBtn) watchBtn.style.display = 'none';
        if (seasonsSection) {
            seasonsSection.style.display = 'block';
            renderEpisodes(item);
        }
    }
}

function renderEpisodes(show) {
    const episodesContainer = document.getElementById('episodes-list');
    if (!episodesContainer) return;
    
    // If show has seasons data, use it, otherwise create mock
    const seasons = show.seasons || [{
        number: 1,
        episodes: [
            { number: 1, title: 'Episode 1', duration: '45 min', url: show.url || 'https://occ-0-7329-784.1.nflxso.net/so/soa2/678/1798200209445819649.mp4?v=1&e=1780592708&t=--NQWm4B79aPqfDaVQeQlLeGzIg' },
            { number: 2, title: 'Episode 2', duration: '48 min', url: show.url },
            { number: 3, title: 'Episode 3', duration: '52 min', url: show.url }
        ]
    }];
    
    let html = `<select class="season-selector" id="seasonSelector" onchange="changeSeason(this.value)">`;
    seasons.forEach((s, idx) => {
        html += `<option value="${idx}">Season ${s.number}</option>`;
    });
    html += `</select><div id="episodesListContainer"></div>`;
    episodesContainer.innerHTML = html;
    
    window.currentShowSeasons = seasons;
    changeSeason(0);
}

function changeSeason(seasonIndex) {
    const seasons = window.currentShowSeasons;
    if (!seasons || !seasons[seasonIndex]) return;
    
    const episodes = seasons[seasonIndex].episodes;
    const container = document.getElementById('episodesListContainer');
    if (!container) return;
    
    let html = '';
    episodes.forEach(ep => {
        html += `
            <div class="episode-item" onclick="playVideo('${ep.url}')">
                <div style="display: flex; gap: 15px; align-items: center;">
                    <span class="episode-number">E${ep.number}</span>
                    <div>
                        <div style="font-weight: 600;">${escapeHtml(ep.title)}</div>
                        <div style="font-size: 12px; color: #888;">${ep.duration}</div>
                    </div>
                </div>
                <span style="color: #E50914;">▶ Play</span>
            </div>
        `;
    });
    container.innerHTML = html;
}

function playVideo(url) {
    const container = document.getElementById('playerContainer');
    const iframe = document.getElementById('videoPlayer');
    if (iframe) iframe.src = url;
    if (container) {
        container.style.display = 'block';
        container.scrollIntoView({ behavior: 'smooth' });
    }
}

// ==================== UPLOAD MEDIA (FIXED FOR TV SHOWS) ====================
async function handleUploadSubmit(event) {
    event.preventDefault();

    const checkboxes = document.querySelectorAll('#genreDropdownList input[type="checkbox"]');
    const selectedGenres = [];
    checkboxes.forEach(cb => { if (cb.checked) selectedGenres.push(cb.value); });
    const genreString = selectedGenres.length > 0 ? selectedGenres.join(' / ') : 'General';

    const mediaType = document.getElementById('uploadType').value;
    
    const newMedia = {
        title: document.getElementById('uploadTitle').value,
        type: mediaType,
        rating: document.getElementById('uploadRating').value || null,
        year: document.getElementById('uploadYear').value || null,
        genre: genreString,
        img: document.getElementById('uploadImg').value,
        url: document.getElementById('uploadUrl').value || null,
        description: document.getElementById('uploadDesc').value,
        // For TV shows, add seasons data
        seasons: mediaType === 'show' ? [
            {
                number: 1,
                episodes: [
                    { number: 1, title: 'Pilot', duration: '45 min', url: document.getElementById('uploadUrl').value || null }
                ]
            }
        ] : null
    };

    if (!newMedia.title || newMedia.title.trim().length < 2) {
        triggerToast('Title is required', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/movies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(newMedia)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to publish');
        }

        document.getElementById('uploadForm').reset();
        checkboxes.forEach(cb => cb.checked = false);
        document.getElementById('genreDropdownSelect').innerText = 'Select Movie Genres...';

        triggerToast('Media Published Successfully! 🎬');
        loadAllMedia();
        setTimeout(() => { navigateTo('home'); }, 1000);

    } catch (error) {
        console.error('Upload error:', error);
        triggerToast(error.message, 'error');
    }
}

// ==================== SEARCH ====================
function handleGlobalSearch(query) {
    const dropdown = document.getElementById('searchDropdown');
    if (!query.trim()) {
        dropdown.style.display = 'none';
        return;
    }

    const results = allMedia.filter(m => 
        m.title.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10); // Limit search results

    dropdown.innerHTML = '';

    if (results.length > 0) {
        results.forEach(item => {
            dropdown.innerHTML += `
                <div class="search-result-item" onclick="openMediaDetails('${item.id}')">
                    <img src="${escapeHtml(item.img || '')}" alt="">
                    <div class="search-result-info">
                        <div class="res-title">${escapeHtml(item.title)}</div>
                        <div class="res-type">${escapeHtml(item.genre || '')}</div>
                    </div>
                </div>
            `;
        });
        dropdown.style.display = 'block';
    } else {
        dropdown.innerHTML = '<div style="padding: 15px; font-size:13px; color:#aaa; text-align:center;">No titles found.</div>';
        dropdown.style.display = 'block';
    }
}

// ==================== EDIT MEDIA ====================
function openEditModal(mediaId) {
    const item = allMedia.find(m => m.id === mediaId);
    if (!item) {
        triggerToast('Media not found', 'error');
        return;
    }

    if (item.userId !== currentUser?.id && currentUser?.role !== 'admin') {
        triggerToast('You can only edit your own media', 'error');
        return;
    }

    document.getElementById('editMediaId').value = item.id;
    document.getElementById('editMediaTitle').value = item.title || '';
    document.getElementById('editMediaYear').value = item.year || '';
    document.getElementById('editMediaRating').value = item.rating || '';
    document.getElementById('editMediaGenre').value = item.genre || '';
    document.getElementById('editMediaImg').value = item.img || '';
    document.getElementById('editMediaUrl').value = item.url || '';
    document.getElementById('editMediaDesc').value = item.description || '';

    document.getElementById('editModal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
}

async function handleUpdateMedia(event) {
    event.preventDefault();

    const mediaId = document.getElementById('editMediaId').value;
    const updatedData = {
        title: document.getElementById('editMediaTitle').value,
        year: document.getElementById('editMediaYear').value || null,
        rating: document.getElementById('editMediaRating').value || null,
        genre: document.getElementById('editMediaGenre').value || null,
        img: document.getElementById('editMediaImg').value || null,
        url: document.getElementById('editMediaUrl').value || null,
        description: document.getElementById('editMediaDesc').value || null
    };

    if (!updatedData.title || updatedData.title.trim().length < 2) {
        triggerToast('Title must be at least 2 characters', 'error');
        return;
    }

    const updateBtn = document.querySelector('#editMediaForm button[type="submit"]');
    const originalText = updateBtn.textContent;
    updateBtn.textContent = '⏳ Updating...';
    updateBtn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/movies/${mediaId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update');
        }

        closeEditModal();
        triggerToast('Media updated successfully! ✏️');
        loadAllMedia();

    } catch (error) {
        triggerToast(error.message, 'error');
    } finally {
        updateBtn.textContent = originalText;
        updateBtn.disabled = false;
    }
}

async function handleDeleteMedia(mediaId) {
    const item = allMedia.find(m => m.id === mediaId);
    
    if (item && item.userId !== currentUser?.id && currentUser?.role !== 'admin') {
        triggerToast('You can only delete your own media', 'error');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete "${item?.title || 'this media'}"?`)) return;

    try {
        const response = await fetch(`${API_URL}/movies/${mediaId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete');
        }

        triggerToast('Media deleted successfully! 🗑️');
        loadAllMedia();

    } catch (error) {
        triggerToast(error.message, 'error');
    }
}

// ==================== GENRE DROPDOWN ====================
function toggleGenreDropdown(event) {
    event.stopPropagation();
    document.getElementById('genreDropdownList').classList.toggle('open');
}

function updateGenreText() {
    const checkboxes = document.querySelectorAll('#genreDropdownList input[type="checkbox"]');
    const selected = [];
    checkboxes.forEach(cb => { if (cb.checked) selected.push(cb.value); });

    const selectBox = document.getElementById('genreDropdownSelect');
    if (selected.length > 0) {
        selectBox.innerText = selected.join(' / ');
    } else {
        selectBox.innerText = 'Select Movie Genres...';
    }
}

// ==================== UTILITY FUNCTIONS ====================
function triggerToast(message, type = 'success') {
    const toast = document.getElementById('successToast');
    const toastMessage = document.getElementById('toastMessage');
    if (toastMessage) toastMessage.innerText = message;
    if (toast) {
        toast.classList.add('show');
        setTimeout(() => { toast.classList.remove('show'); }, 2000);
    }
}

function clearAllErrors() {
    document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
    document.querySelectorAll('.general-error').forEach(el => {
        el.textContent = '';
        el.classList.remove('show');
    });
}

function clearAllInputs() {
    document.querySelectorAll('input[type="text"], input[type="password"], input[type="number"], textarea').forEach(input => {
        if (!input.readOnly) input.value = '';
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (event.target === modal) {
        closeEditModal();
    }
}

// ==================== BILLBOARD FUNCTIONS ====================
let currentBillboardMedia = null;

function updateBillboard(media) {
    if (!media) return;
    
    currentBillboardMedia = media;
    const billboard = document.querySelector('.billboard');
    const billboardTitle = document.querySelector('.billboard-title');
    const billboardDesc = document.querySelector('.billboard-desc');
    const billboardBtn = document.querySelector('.btn-play');
    
    if (!billboard || !billboardTitle) return;
    
    billboardTitle.textContent = media.title || 'No Title';
    billboardDesc.textContent = media.description || media.desc || 'No description available.';
    
    const bgImage = media.img || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop';
    billboard.style.background = `linear-gradient(to top, #111111 5%, rgba(17, 17, 17, 0) 60%),
                                  linear-gradient(to right, rgba(17, 17, 17, 0.8) 20%, rgba(17, 17, 17, 0) 80%),
                                  url('${bgImage}') no-repeat center center/cover`;
    
    if (billboardBtn) {
        billboardBtn.onclick = function() {
            if (media.type === 'movie') {
                playVideo(media.url || 'https://occ-0-7329-784.1.nflxso.net/so/soa2/678/1798200209445819649.mp4?v=1&e=1780592708&t=--NQWm4B79aPqfDaVQeQlLeGzIg');
                navigateTo('details');
                setTimeout(() => {
                    if (document.getElementById('page-details').classList.contains('active')) {
                        openMediaDetails(media.id);
                    }
                }, 100);
            } else {
                openMediaDetails(media.id);
                navigateTo('details');
            }
        };
    }
}

function getRandomMediaForBillboard() {
    if (!allMedia || allMedia.length === 0) return null;
    
    const validMedia = allMedia.filter(m => m.img && m.img.trim() !== '');
    
    if (validMedia.length === 0) return allMedia[0];
    
    const randomIndex = Math.floor(Math.random() * validMedia.length);
    return validMedia[randomIndex];
}

function refreshBillboard() {
    const randomMedia = getRandomMediaForBillboard();
    if (randomMedia) {
        updateBillboard(randomMedia);
    }
}

function shuffleBillboard() {
    refreshBillboard();
    triggerToast('Billboard updated! 🎬');
}

// ==================== ADMIN PANEL ====================
function showAdminPanel() {
    document.querySelectorAll('.page').forEach(page => {
        if (page.id !== 'adminPanelRoot') {
            page.style.display = 'none';
        }
    });
    
    const normalNav = document.querySelector('.nav-links');
    if (normalNav) normalNav.style.display = 'none';
    
    let adminPanel = document.getElementById('adminPanelRoot');
    if (!adminPanel) {
        injectAdminPanel();
        adminPanel = document.getElementById('adminPanelRoot');
    }
    adminPanel.style.display = 'block';
    
    loadAdminData();
}

function injectAdminPanel() {
    const dashboardScreen = document.getElementById('dashboardScreen');
    if (!dashboardScreen) return;
    
    const adminHTML = `
        <div id="adminPanelRoot" style="display: none;" class="admin-panel-wrapper">
            <div style="display: flex; min-height: 100vh;">
                <!-- Sidebar -->
                <div class="admin-sidebar" style="width: 280px; background: #0f0f0f; position: fixed; height: 100vh; padding: 30px 20px;">
                    <div style="font-size: 28px; font-weight: 900; color: #E50914; margin-bottom: 50px; display: flex; align-items: center; gap: 10px;">
                        🎬 Dx<span style="color:white;">Control</span>
                    </div>
                    <ul style="list-style: none; padding: 0;">
                        <li class="admin-menu-item" data-tab="overview" onclick="switchAdminTab('overview')" style="padding: 14px 18px; border-radius: 12px; color: #aaa; cursor: pointer; display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                            📊 <span>Dashboard</span>
                        </li>
                        <li class="admin-menu-item" data-tab="users" onclick="switchAdminTab('users')" style="padding: 14px 18px; border-radius: 12px; color: #aaa; cursor: pointer; display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                            👥 <span>User Management</span>
                        </li>
                        <li class="admin-menu-item" data-tab="movies" onclick="switchAdminTab('movies')" style="padding: 14px 18px; border-radius: 12px; color: #aaa; cursor: pointer; display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                            🎬 <span>Movies Library</span>
                        </li>
                        <li class="admin-menu-item" data-tab="shows" onclick="switchAdminTab('shows')" style="padding: 14px 18px; border-radius: 12px; color: #aaa; cursor: pointer; display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                            📺 <span>TV Shows Library</span>
                        </li>
                        <li class="admin-menu-item" data-tab="upload" onclick="switchAdminTab('upload')" style="padding: 14px 18px; border-radius: 12px; color: #aaa; cursor: pointer; display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                            ➕ <span>Upload Content</span>
                        </li>
                    </ul>
                    <button onclick="handleLogout()" style="position: absolute; bottom: 30px; width: calc(100% - 40px); background: rgba(229,9,20,0.15); border: 1px solid #E50914; color: #E50914; padding: 12px; border-radius: 10px; cursor: pointer; font-weight: 600;">🚪 Exit Admin Mode</button>
                </div>
                
                <!-- Main Content -->
                <div style="margin-left: 280px; flex: 1; padding: 40px 5%; background: #0a0a0a;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 35px;">
                        <div>
                            <h1 id="adminPanelTitle" style="font-size: 28px; font-weight: 700;">Admin Dashboard</h1>
                            <p style="color: #666; font-size: 14px;">Welcome back, ${currentUser?.username}</p>
                        </div>
                        <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100" style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid #E50914;">
                    </div>
                    
                    <!-- Stats Cards -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 25px; margin-bottom: 40px;">
                        <div class="admin-card" style="padding: 25px; background: #141414; border-radius: 16px;">
                            <div style="font-size: 14px; color: #888;">Total Users</div>
                            <div class="stat-number" style="font-size: 2.5rem; font-weight: 800;" id="adminStatUsers">0</div>
                        </div>
                        <div class="admin-card" style="padding: 25px; background: #141414; border-radius: 16px;">
                            <div style="font-size: 14px; color: #888;">Total Movies</div>
                            <div class="stat-number" style="font-size: 2.5rem; font-weight: 800;" id="adminStatMovies">0</div>
                        </div>
                        <div class="admin-card" style="padding: 25px; background: #141414; border-radius: 16px;">
                            <div style="font-size: 14px; color: #888;">Total Shows</div>
                            <div class="stat-number" style="font-size: 2.5rem; font-weight: 800;" id="adminStatShows">0</div>
                        </div>
                    </div>
                    
                    <!-- Tab: Overview -->
                    <div id="adminTabOverview" class="admin-tab active" style="display: block;">
                        <div class="admin-card" style="padding: 40px; text-align: center; background: #141414; border-radius: 16px;">
                            <h3 style="margin-bottom: 15px;">🎬 Content Management System</h3>
                            <p style="color: #888;">Use the sidebar to manage users, movies, TV shows, and upload new content.</p>
                        </div>
                    </div>
                    
                    <!-- Tab: Users Management -->
                    <div id="adminTabUsers" class="admin-tab" style="display: none;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                            <h3 style="font-size: 22px;">System Users</h3>
                            <button onclick="openAddUserForm()" style="background: #E50914; border: none; color: white; padding: 10px 24px; border-radius: 30px; cursor: pointer; font-weight: 600;">+ Add New User</button>
                        </div>
                        <div id="addUserForm" style="display: none; background: #141414; padding: 25px; border-radius: 16px; margin-bottom: 25px;">
                            <h4 style="margin-bottom: 20px;" id="userFormTitle">Add New User</h4>
                            <input type="hidden" id="editUserId">
                            <div style="margin-bottom: 15px;">
                                <input type="text" id="newUsername" placeholder="Username" style="width: 100%; padding: 14px; background: #1a1a1a; border: 1px solid #333; color: white; border-radius: 8px;">
                            </div>
                            <div style="margin-bottom: 15px;">
                                <input type="password" id="newPassword" placeholder="Password" style="width: 100%; padding: 14px; background: #1a1a1a; border: 1px solid #333; color: white; border-radius: 8px;">
                            </div>
                            <div style="margin-bottom: 20px;">
                                <select id="newRole" style="width: 100%; padding: 14px; background: #1a1a1a; border: 1px solid #333; color: white; border-radius: 8px;">
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <button onclick="submitUserForm()" style="background: #E50914; border: none; color: white; padding: 14px; border-radius: 8px; cursor: pointer; width: 100%; font-weight: 600;">Save User</button>
                        </div>
                        <div style="background: #111; border-radius: 16px; overflow-x: auto;">
                            <table class="admin-table" style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="background: #1a1a1a;">
                                        <th style="padding: 16px; text-align: left;">Username</th>
                                        <th style="padding: 16px; text-align: left;">Role</th>
                                        <th style="padding: 16px; text-align: left;">Status</th>
                                        <th style="padding: 16px; text-align: left;">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="adminUsersTable"></tbody>
                            </table>
                        </div>
                    </div>
                    
                    <!-- Tab: Movies Library -->
                    <div id="adminTabMovies" class="admin-tab" style="display: none;">
                        <h3 style="margin-bottom: 20px;">Movies Library</h3>
                        <div id="batchDeleteBar" class="batch-delete-bar" style="display: none;" onclick="confirmBatchDelete()">
                            🗑️ Delete Selected (<span id="selectedCount">0</span>)
                        </div>
                        <div style="background: #111; border-radius: 16px; overflow-x: auto;">
                            <table class="admin-table" style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="background: #1a1a1a;">
                                        <th style="padding: 16px;"><input type="checkbox" id="selectAllMovies" onchange="toggleSelectAll('movies')"></th>
                                        <th style="padding: 16px; text-align: left;">Title</th>
                                        <th style="padding: 16px; text-align: left;">Genre</th>
                                        <th style="padding: 16px; text-align: left;">Year</th>
                                        <th style="padding: 16px; text-align: left;">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="adminMoviesTable"></tbody>
                            </table>
                        </div>
                    </div>
                    
                    <!-- Tab: TV Shows Library -->
                    <div id="adminTabShows" class="admin-tab" style="display: none;">
                        <h3 style="margin-bottom: 20px;">TV Shows Library</h3>
                        <div id="batchDeleteBarShows" class="batch-delete-bar" style="display: none;" onclick="confirmBatchDeleteShows()">
                            🗑️ Delete Selected (<span id="selectedCountShows">0</span>)
                        </div>
                        <div style="background: #111; border-radius: 16px; overflow-x: auto;">
                            <table class="admin-table" style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="background: #1a1a1a;">
                                        <th style="padding: 16px;"><input type="checkbox" id="selectAllShows" onchange="toggleSelectAll('shows')"></th>
                                        <th style="padding: 16px; text-align: left;">Title</th>
                                        <th style="padding: 16px; text-align: left;">Genre</th>
                                        <th style="padding: 16px; text-align: left;">Year</th>
                                        <th style="padding: 16px; text-align: left;">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="adminShowsTable"></tbody>
                            </table>
                        </div>
                    </div>
                    
                    <!-- Tab: Upload Media -->
                    <div id="adminTabUpload" class="admin-tab" style="display: none;">
                        <h3 style="margin-bottom: 20px;">Upload New Media</h3>
                        <div class="admin-card" style="padding: 35px; background: #141414; border-radius: 16px;">
                            <form id="adminMediaForm" onsubmit="handleAdminUpload(event)">
                                <div style="display: flex; gap: 15px; margin-bottom: 20px; align-items: flex-end;">
                                    <div style="flex: 2;">
                                        <label style="display: block; color: #aaa; margin-bottom: 8px;">Media Type</label>
                                        <select id="adminMediaType" style="width: 100%; padding: 14px; background: #1a1a1a; border: 1px solid #333; color: white; border-radius: 8px;">
                                            <option value="movie">Movie</option>
                                            <option value="show">TV Show</option>
                                        </select>
                                    </div>
                                    <div style="flex: 3;">
                                        <label style="display: block; color: #aaa; margin-bottom: 8px;">Title</label>
                                        <input type="text" id="adminMediaTitle" required style="width: 100%; padding: 14px; background: #1a1a1a; border: 1px solid #333; color: white; border-radius: 8px;">
                                    </div>
                                    <div>
                                        <button type="button" class="imdb-fetch-btn" onclick="handleIMDBFetch('adminMedia')" style="background: #f5c518; border: none; color: #000; padding: 10px 15px; border-radius: 30px; font-weight: bold; cursor: pointer;">
                                            🎬 Fetch from IMDB
                                        </button>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                                    <div style="flex:1;">
                                        <label style="display: block; color: #aaa; margin-bottom: 8px;">Rating</label>
                                        <input type="text" id="adminMediaRating" style="width: 100%; padding: 14px; background: #1a1a1a; border: 1px solid #333; color: white; border-radius: 8px;">
                                    </div>
                                    <div style="flex:1;">
                                        <label style="display: block; color: #aaa; margin-bottom: 8px;">Year</label>
                                        <input type="number" id="adminMediaYear" style="width: 100%; padding: 14px; background: #1a1a1a; border: 1px solid #333; color: white; border-radius: 8px;">
                                    </div>
                                </div>
                                <div style="margin-bottom: 20px;">
                                    <label style="display: block; color: #aaa; margin-bottom: 8px;">Genre</label>
                                    <input type="text" id="adminMediaGenre" style="width: 100%; padding: 14px; background: #1a1a1a; border: 1px solid #333; color: white; border-radius: 8px;">
                                </div>
                                <div style="margin-bottom: 20px;">
                                    <label style="display: block; color: #aaa; margin-bottom: 8px;">Image URL</label>
                                    <input type="url" id="adminMediaImg" style="width: 100%; padding: 14px; background: #1a1a1a; border: 1px solid #333; color: white; border-radius: 8px;">
                                </div>
                                <div style="margin-bottom: 20px;">
                                    <label style="display: block; color: #aaa; margin-bottom: 8px;">Video URL (YouTube Embed)</label>
                                    <input type="url" id="adminMediaUrl" placeholder="https://www.youtube.com/embed/VIDEO_ID" style="width: 100%; padding: 14px; background: #1a1a1a; border: 1px solid #333; color: white; border-radius: 8px;">
                                </div>
                                <div style="margin-bottom: 20px;">
                                    <label style="display: block; color: #aaa; margin-bottom: 8px;">Description</label>
                                    <textarea id="adminMediaDesc" rows="4" style="width: 100%; padding: 14px; background: #1a1a1a; border: 1px solid #333; color: white; border-radius: 8px;"></textarea>
                                </div>
                                <button type="submit" style="width: 100%; background: #E50914; color: white; border: none; padding: 16px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 16px;">Publish Media</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    dashboardScreen.insertAdjacentHTML('beforeend', adminHTML);
}

// ==================== ADMIN FUNCTIONS ====================
window.selectedMediaIds = new Set();
window.selectedShowIds = new Set();

function switchAdminTab(tabId) {
    document.querySelectorAll('.admin-tab').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.admin-menu-item').forEach(item => item.classList.remove('active'));
    
    const tabMap = {
        overview: 'adminTabOverview',
        users: 'adminTabUsers',
        movies: 'adminTabMovies',
        shows: 'adminTabShows',
        upload: 'adminTabUpload'
    };
    
    const tabElement = document.getElementById(tabMap[tabId]);
    if (tabElement) tabElement.style.display = 'block';
    
    const activeMenuItem = document.querySelector(`.admin-menu-item[data-tab="${tabId}"]`);
    if (activeMenuItem) activeMenuItem.classList.add('active');
    
    const titles = {
        overview: 'Admin Dashboard',
        users: 'User Management',
        movies: 'Movies Library',
        shows: 'TV Shows Library',
        upload: 'Upload Content'
    };
    const titleEl = document.getElementById('adminPanelTitle');
    if (titleEl) titleEl.innerText = titles[tabId];
    
    if (tabId === 'users') loadAdminUsers();
    if (tabId === 'movies') loadAdminMovies();
    if (tabId === 'shows') loadAdminShows();
}

function loadAdminData() {
    loadAdminUsers();
    loadAdminMovies();
    loadAdminShows();
    updateAdminStats();
}

async function updateAdminStats() {
    try {
        const response = await fetch(`${API_URL}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            const stats = await response.json();
            const usersEl = document.getElementById('adminStatUsers');
            const moviesEl = document.getElementById('adminStatMovies');
            const showsEl = document.getElementById('adminStatShows');
            if (usersEl) usersEl.innerText = stats.users || 0;
            if (moviesEl) moviesEl.innerText = stats.movies || 0;
            if (showsEl) showsEl.innerText = stats.shows || 0;
        }
    } catch(e) { console.log('Stats error:', e); }
}

function loadAdminMovies() {
    const movies = allMedia.filter(m => m.type === 'movie');
    const tbody = document.getElementById('adminMoviesTable');
    if (!tbody) return;
    tbody.innerHTML = '';
    movies.forEach(media => {
        const isChecked = window.selectedMediaIds.has(media.id);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 16px;"><input type="checkbox" class="movie-checkbox" data-id="${media.id}" ${isChecked ? 'checked' : ''} onchange="toggleMediaSelection('${media.id}', this.checked)"></td>
            <td style="padding: 16px;"><strong>${escapeHtml(media.title)}</strong></td>
            <td style="padding: 16px;">${escapeHtml(media.genre || 'N/A')}</td>
            <td style="padding: 16px;">${media.year || 'N/A'}</td>
            <td style="padding: 16px;">
                <button onclick="adminEditMedia('${media.id}')" style="background: #E50914; border: none; color: white; padding: 6px 14px; border-radius: 6px; cursor: pointer; margin-right: 8px;">✏️ Edit</button>
                <button onclick="adminDeleteMedia('${media.id}')" style="background: #333; border: none; color: white; padding: 6px 14px; border-radius: 6px; cursor: pointer;">🗑️ Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    updateBatchDeleteBar();
}

function loadAdminShows() {
    const shows = allMedia.filter(m => m.type === 'show');
    const tbody = document.getElementById('adminShowsTable');
    if (!tbody) return;
    tbody.innerHTML = '';
    shows.forEach(media => {
        const isChecked = window.selectedShowIds.has(media.id);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 16px;"><input type="checkbox" class="show-checkbox" data-id="${media.id}" ${isChecked ? 'checked' : ''} onchange="toggleShowSelection('${media.id}', this.checked)"></td>
            <td style="padding: 16px;"><strong>${escapeHtml(media.title)}</strong></td>
            <td style="padding: 16px;">${escapeHtml(media.genre || 'N/A')}</td>
            <td style="padding: 16px;">${media.year || 'N/A'}</td>
            <td style="padding: 16px;">
                <button onclick="adminEditMedia('${media.id}')" style="background: #E50914; border: none; color: white; padding: 6px 14px; border-radius: 6px; cursor: pointer; margin-right: 8px;">✏️ Edit</button>
                <button onclick="adminDeleteMedia('${media.id}')" style="background: #333; border: none; color: white; padding: 6px 14px; border-radius: 6px; cursor: pointer;">🗑️ Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    updateBatchDeleteBar();
}

function toggleMediaSelection(id, isChecked) {
    if (isChecked) {
        window.selectedMediaIds.add(id);
    } else {
        window.selectedMediaIds.delete(id);
    }
    updateBatchDeleteBar();
}

function toggleShowSelection(id, isChecked) {
    if (isChecked) {
        window.selectedShowIds.add(id);
    } else {
        window.selectedShowIds.delete(id);
    }
    updateBatchDeleteBar();
}

function toggleSelectAll(type) {
    if (type === 'movies') {
        const checkboxes = document.querySelectorAll('.movie-checkbox');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        checkboxes.forEach(cb => {
            cb.checked = !allChecked;
            const id = cb.getAttribute('data-id');
            if (!allChecked) window.selectedMediaIds.add(id);
            else window.selectedMediaIds.delete(id);
        });
    } else if (type === 'shows') {
        const checkboxes = document.querySelectorAll('.show-checkbox');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        checkboxes.forEach(cb => {
            cb.checked = !allChecked;
            const id = cb.getAttribute('data-id');
            if (!allChecked) window.selectedShowIds.add(id);
            else window.selectedShowIds.delete(id);
        });
    }
    updateBatchDeleteBar();
}

function updateBatchDeleteBar() {
    const movieCount = window.selectedMediaIds.size;
    const showCount = window.selectedShowIds.size;
    const barMovies = document.getElementById('batchDeleteBar');
    const barShows = document.getElementById('batchDeleteBarShows');
    const countSpanMovies = document.getElementById('selectedCount');
    const countSpanShows = document.getElementById('selectedCountShows');
    
    if (barMovies) {
        if (movieCount > 0) {
            barMovies.style.display = 'flex';
            if (countSpanMovies) countSpanMovies.innerText = movieCount;
        } else {
            barMovies.style.display = 'none';
        }
    }
    if (barShows) {
        if (showCount > 0) {
            barShows.style.display = 'flex';
            if (countSpanShows) countSpanShows.innerText = showCount;
        } else {
            barShows.style.display = 'none';
        }
    }
}

async function confirmBatchDelete() {
    if (window.selectedMediaIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${window.selectedMediaIds.size} selected movies? This action cannot be undone!`)) return;
    
    for (const id of window.selectedMediaIds) {
        await adminDeleteMedia(id, false);
    }
    triggerToast(`${window.selectedMediaIds.size} movies deleted successfully`);
    window.selectedMediaIds.clear();
    loadAdminMovies();
    loadAllMedia();
    updateBatchDeleteBar();
}

async function confirmBatchDeleteShows() {
    if (window.selectedShowIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${window.selectedShowIds.size} selected TV shows? This action cannot be undone!`)) return;
    
    for (const id of window.selectedShowIds) {
        await adminDeleteMedia(id, false);
    }
    triggerToast(`${window.selectedShowIds.size} shows deleted successfully`);
    window.selectedShowIds.clear();
    loadAdminShows();
    loadAllMedia();
    updateBatchDeleteBar();
}

async function loadAdminUsers() {
    try {
        const response = await fetch(`${API_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            const users = await response.json();
            const tbody = document.getElementById('adminUsersTable');
            if (!tbody) return;
            tbody.innerHTML = '';
            users.forEach(user => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="padding: 16px;">${escapeHtml(user.username)}</td>
                    <td style="padding: 16px;"><span style="background: ${user.role === 'admin' ? '#E50914' : '#333'}; padding: 4px 12px; border-radius: 20px; font-size: 11px;">${user.role}</span></td>
                    <td style="padding: 16px;"><span style="color: ${user.isBanned ? '#E50914' : '#46d369'};">${user.isBanned ? 'BANNED' : 'ACTIVE'}</span></td>
                    <td style="padding: 16px;">
                        <button onclick="toggleBanUser('${user.id}')" style="background: #333; border: none; color: white; padding: 6px 14px; border-radius: 6px; cursor: pointer; margin-right: 5px;">${user.isBanned ? 'Unban' : 'Ban'}</button>
                        <button onclick="deleteUser('${user.id}')" style="background: #E50914; border: none; color: white; padding: 6px 14px; border-radius: 6px; cursor: pointer;">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch(e) { console.log('Load users error:', e); }
}

function openAddUserForm() {
    const form = document.getElementById('addUserForm');
    if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
        document.getElementById('editUserId').value = '';
        document.getElementById('newUsername').value = '';
        document.getElementById('newPassword').value = '';
    }
}

async function submitUserForm() {
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newRole').value;
    const userId = document.getElementById('editUserId').value;
    
    if (!username || username.length < 3) {
        triggerToast('Username must be at least 3 characters', 'error');
        return;
    }
    
    try {
        let response;
        if (userId) {
            response = await fetch(`${API_URL}/admin/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ username, role })
            });
        } else {
            if (!password || password.length < 6) {
                triggerToast('Password must be at least 6 characters', 'error');
                return;
            }
            response = await fetch(`${API_URL}/admin/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ username, password, role })
            });
        }
        
        if (response.ok) {
            triggerToast(userId ? 'User updated!' : 'User created!');
            document.getElementById('addUserForm').style.display = 'none';
            loadAdminUsers();
            updateAdminStats();
        } else {
            const error = await response.json();
            triggerToast(error.message, 'error');
        }
    } catch(e) {
        triggerToast('Error saving user', 'error');
    }
}

async function toggleBanUser(userId) {
    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}/ban`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            triggerToast('User ban status toggled');
            loadAdminUsers();
        }
    } catch(e) {
        triggerToast('Error toggling ban', 'error');
    }
}

async function deleteUser(userId) {
    if (!confirm('Delete this user permanently?')) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            triggerToast('User deleted');
            loadAdminUsers();
            updateAdminStats();
        }
    } catch(e) {
        triggerToast('Error deleting user', 'error');
    }
}

async function adminEditMedia(mediaId) {
    const item = allMedia.find(m => m.id === mediaId);
    if (!item) return;
    
    document.getElementById('editMediaId').value = item.id;
    document.getElementById('editMediaTitle').value = item.title || '';
    document.getElementById('editMediaYear').value = item.year || '';
    document.getElementById('editMediaRating').value = item.rating || '';
    document.getElementById('editMediaGenre').value = item.genre || '';
    document.getElementById('editMediaImg').value = item.img || '';
    document.getElementById('editMediaUrl').value = item.url || '';
    document.getElementById('editMediaDesc').value = item.description || '';
    
    document.getElementById('editModal').classList.remove('hidden');
}

async function adminDeleteMedia(mediaId, showToast = true) {
    try {
        const response = await fetch(`${API_URL}/movies/${mediaId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            if (showToast) triggerToast('Media deleted');
            loadAllMedia();
            return true;
        }
        return false;
    } catch(e) {
        if (showToast) triggerToast('Error deleting media', 'error');
        return false;
    }
}

async function handleAdminUpload(event) {
    event.preventDefault();
    
    const mediaType = document.getElementById('adminMediaType').value;
    
    const newMedia = {
        title: document.getElementById('adminMediaTitle').value,
        type: mediaType,
        rating: document.getElementById('adminMediaRating').value || null,
        year: document.getElementById('adminMediaYear').value || null,
        genre: document.getElementById('adminMediaGenre').value || null,
        img: document.getElementById('adminMediaImg').value,
        url: document.getElementById('adminMediaUrl').value || null,
        description: document.getElementById('adminMediaDesc').value,
        seasons: mediaType === 'show' ? [
            {
                number: 1,
                episodes: [
                    { number: 1, title: 'Pilot', duration: '45 min', url: document.getElementById('adminMediaUrl').value || null }
                ]
            }
        ] : null
    };
    
    if (!newMedia.title || newMedia.title.length < 2) {
        triggerToast('Title required', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/movies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(newMedia)
        });
        
        if (response.ok) {
            triggerToast('Media published!');
            document.getElementById('adminMediaForm').reset();
            loadAllMedia();
            switchAdminTab('movies');
        } else {
            const error = await response.json();
            triggerToast(error.message, 'error');
        }
    } catch(e) {
        console.error('Admin upload error:', e);
        triggerToast('Error publishing', 'error');
    }
}

// Add IMDB fetch to upload page
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for DOM to be ready
    setTimeout(() => {
        const uploadTitleField = document.getElementById('uploadTitle');
        if (uploadTitleField && uploadTitleField.parentElement) {
            const container = uploadTitleField.parentElement.parentElement;
            const flexDiv = document.createElement('div');
            flexDiv.style.display = 'flex';
            flexDiv.style.gap = '15px';
            flexDiv.style.alignItems = 'flex-end';
            
            const titleDiv = uploadTitleField.parentElement.cloneNode(true);
            titleDiv.style.flex = '3';
            
            const btnDiv = document.createElement('div');
            btnDiv.style.flex = '1';
            const imdbBtn = document.createElement('button');
            imdbBtn.type = 'button';
            imdbBtn.className = 'imdb-fetch-btn';
            imdbBtn.innerHTML = '🎬 Fetch from IMDB';
            imdbBtn.style.background = '#f5c518';
            imdbBtn.style.border = 'none';
            imdbBtn.style.color = '#000';
            imdbBtn.style.padding = '10px 15px';
            imdbBtn.style.borderRadius = '30px';
            imdbBtn.style.fontWeight = 'bold';
            imdbBtn.style.cursor = 'pointer';
            imdbBtn.onclick = () => handleIMDBFetch('upload');
            btnDiv.appendChild(imdbBtn);
            
            flexDiv.appendChild(titleDiv);
            flexDiv.appendChild(btnDiv);
            container.replaceChild(flexDiv, uploadTitleField.parentElement);
        }
    }, 100);
});
