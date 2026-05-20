// ==================== CONFIGURATION ====================
const API_URL = 'http://localhost:3000';
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
let allMedia = [];

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
    
    updateDashboardUI();
    loadAllMedia();
}

function switchAuthForm(formId) {
    document.getElementById('signInCard').classList.add('hidden');
    document.getElementById('signUpCard').classList.add('hidden');
    document.getElementById(formId).classList.remove('hidden');
    clearAllErrors();
    clearAllInputs();
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

// ==================== UPDATE PROFILE ====================
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
        
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        updateDashboardUI();
        triggerToast('Profile updated successfully! ✨');
        loadAllMedia();
        
    } catch (error) {
        triggerToast(error.message, 'error');
    } finally {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
}

// ==================== LOAD & RENDER MEDIA ====================
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
        
    } catch (error) {
        console.error('Load media error:', error);
        triggerToast('Error loading content', 'error');
    }
}

function renderAllContent() {
    const grids = {
        trending: document.getElementById('trending-grid'),
        homeUploads: document.getElementById('home-uploads-grid'),
        homeMovies: document.getElementById('home-movies-grid'),
        homeShows: document.getElementById('home-shows-grid'),
        allMovies: document.getElementById('all-movies-grid'),
        allShows: document.getElementById('all-shows-grid'),
        allUploads: document.getElementById('all-uploads-grid')
    };

    Object.values(grids).forEach(g => { if (g) g.innerHTML = ''; });

    if (!allMedia || allMedia.length === 0) return;

    allMedia.forEach(item => {
        const cardHtml = createMediaCard(item);

        if (grids.trending) grids.trending.innerHTML += cardHtml;
        if (item.userId === currentUser?.id && grids.homeUploads) grids.homeUploads.innerHTML += cardHtml;
        if (item.type === 'movie' && grids.homeMovies) grids.homeMovies.innerHTML += cardHtml;
        if (item.type === 'show' && grids.homeShows) grids.homeShows.innerHTML += cardHtml;
        if (item.type === 'movie' && grids.allMovies) grids.allMovies.innerHTML += cardHtml;
        if (item.type === 'show' && grids.allShows) grids.allShows.innerHTML += cardHtml;
        if (item.userId === currentUser?.id && grids.allUploads) grids.allUploads.innerHTML += cardHtml;
    });
     refreshBillboard(); 
}

function createMediaCard(item) {
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
                playVideo(item.url || 'https://www.youtube.com/embed/dQw4w9WgXcQ');
            };
        }
    } else {
        if (watchBtn) watchBtn.style.display = 'none';
        if (seasonsSection) seasonsSection.style.display = 'block';
    }
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

// ==================== UPLOAD MEDIA ====================
async function handleUploadSubmit(event) {
    event.preventDefault();

    const checkboxes = document.querySelectorAll('#genreDropdownList input[type="checkbox"]');
    const selectedGenres = [];
    checkboxes.forEach(cb => { if (cb.checked) selectedGenres.push(cb.value); });
    const genreString = selectedGenres.length > 0 ? selectedGenres.join(' / ') : 'General';

    const newMedia = {
        title: document.getElementById('uploadTitle').value,
        type: document.getElementById('uploadType').value,
        rating: document.getElementById('uploadRating').value || null,
        year: document.getElementById('uploadYear').value || null,
        genre: genreString,
        img: document.getElementById('uploadImg').value,
        url: document.getElementById('uploadUrl').value || null,
        description: document.getElementById('uploadDesc').value
    };

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
    );

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

    if (item.userId !== currentUser?.id) {
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
    
    if (item && item.userId !== currentUser?.id) {
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
                playVideo(media.url || 'https://www.youtube.com/embed/dQw4w9WgXcQ');
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


// ==================== ADMIN REDIRECT & ROLE CHECK ====================
function showDashboard() {
    document.getElementById('homeScreen').classList.add('hidden');
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('dashboardScreen').classList.remove('hidden');
    
    const video = document.querySelector('.video-background');
    const overlay = document.querySelector('.overlay');
    if (video) video.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
    
    // CHECK USER ROLE AND REDIRECT
    if (currentUser && currentUser.role === 'admin') {
        showAdminPanel();
    } else {
        showUserDashboard();
    }
    
    updateDashboardUI();
    loadAllMedia();
}

function showUserDashboard() {
    // Hide admin panel if visible
    const adminPanel = document.getElementById('adminPanelRoot');
    if (adminPanel) adminPanel.style.display = 'none';
    
    // Show normal dashboard content
    document.querySelectorAll('.page').forEach(page => {
        if (page.id !== 'adminPanelRoot') {
            page.style.display = '';
        }
    });
    
    // Make sure normal nav is visible
    const normalNav = document.querySelector('.nav-links');
    if (normalNav) normalNav.style.display = 'flex';
    
    navigateTo('home');
}

function showAdminPanel() {
    // Hide normal dashboard pages
    document.querySelectorAll('.page').forEach(page => {
        if (page.id !== 'adminPanelRoot') {
            page.style.display = 'none';
        }
    });
    
    // Hide normal nav
    const normalNav = document.querySelector('.nav-links');
    if (normalNav) normalNav.style.display = 'none';
    
    // Show admin panel
    let adminPanel = document.getElementById('adminPanelRoot');
    if (!adminPanel) {
        injectAdminPanel();
        adminPanel = document.getElementById('adminPanelRoot');
    }
    adminPanel.style.display = 'block';
    
    // Initialize admin data
    if (typeof window.loadAdminData === 'function') {
        window.loadAdminData();
    }
}

// ==================== INJECT ADMIN PANEL HTML ====================
function injectAdminPanel() {
    const dashboardScreen = document.getElementById('dashboardScreen');
    if (!dashboardScreen) return;
    
    const adminHTML = `
        <div id="adminPanelRoot" style="display: none;">
            <div style="display: flex; min-height: 100vh; background: #0b0b0b;">
                <!-- Sidebar -->
                <div style="width: 260px; background: #111111; border-right: 1px solid rgba(255,255,255,0.05); position: fixed; height: 100vh; padding: 30px 20px;">
                    <div style="font-size: 24px; font-weight: 900; color: #E50914; margin-bottom: 40px; display: flex; align-items: center; gap: 10px;">
                        Dx Control <span style="font-size: 11px; background: #fff; color: #000; padding: 2px 6px; border-radius: 4px;">ADMIN</span>
                    </div>
                    <ul style="list-style: none;">
                        <li class="admin-menu-item active" data-tab="overview" style="padding: 14px 18px; border-radius: 8px; color: #aaa; cursor: pointer; display: flex; align-items: center; gap: 12px;" onclick="switchAdminTab('overview')">
                            📊 <span>Overview</span>
                        </li>
                        <li class="admin-menu-item" data-tab="users" style="padding: 14px 18px; border-radius: 8px; color: #aaa; cursor: pointer; display: flex; align-items: center; gap: 12px;" onclick="switchAdminTab('users')">
                            👥 <span>Manage Users</span>
                        </li>
                        <li class="admin-menu-item" data-tab="media" style="padding: 14px 18px; border-radius: 8px; color: #aaa; cursor: pointer; display: flex; align-items: center; gap: 12px;" onclick="switchAdminTab('media')">
                            🎬 <span>Manage Media</span>
                        </li>
                        <li class="admin-menu-item" data-tab="upload" style="padding: 14px 18px; border-radius: 8px; color: #aaa; cursor: pointer; display: flex; align-items: center; gap: 12px;" onclick="switchAdminTab('upload')">
                            ➕ <span>Upload Content</span>
                        </li>
                    </ul>
                    <button onclick="handleLogout()" style="position: absolute; bottom: 30px; width: calc(100% - 40px); background: rgba(229,9,20,0.2); border: 1px solid #E50914; color: #E50914; padding: 12px; border-radius: 8px; cursor: pointer;">🚪 Exit Admin Mode</button>
                </div>
                
                <!-- Main Content -->
                <div style="margin-left: 260px; flex: 1; padding: 40px 4%;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 35px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 20px;">
                        <div>
                            <h1 id="adminPanelTitle" style="font-size: 28px;">System Dashboard</h1>
                            <p style="color: #666; font-size: 13px;">Administrator Control Panel</p>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="font-size: 14px;" id="adminUsername">${currentUser?.username || 'Admin'}</span>
                            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100" style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid #E50914;">
                        </div>
                    </div>
                    
                    <!-- Stats Cards -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 25px; margin-bottom: 40px;">
                        <div style="background: #111111; border-radius: 12px; padding: 25px; position: relative; overflow: hidden; border-left: 4px solid #00bcd4;">
                            <div style="font-size: 13px; color: #888;">Total Users</div>
                            <div style="font-size: 36px; font-weight: 800;" id="adminStatUsers">0</div>
                        </div>
                        <div style="background: #111111; border-radius: 12px; padding: 25px; position: relative; overflow: hidden; border-left: 4px solid #ff9800;">
                            <div style="font-size: 13px; color: #888;">Total Movies</div>
                            <div style="font-size: 36px; font-weight: 800;" id="adminStatMovies">0</div>
                        </div>
                        <div style="background: #111111; border-radius: 12px; padding: 25px; position: relative; overflow: hidden; border-left: 4px solid #e50914;">
                            <div style="font-size: 13px; color: #888;">Total Shows</div>
                            <div style="font-size: 36px; font-weight: 800;" id="adminStatShows">0</div>
                        </div>
                    </div>
                    
                    <!-- Tab: Overview -->
                    <div id="adminTabOverview" class="admin-tab active" style="display: block;">
                        <div style="background: #111; padding: 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.03);">
                            <h3 style="margin-bottom: 20px;">Welcome to Admin Terminal</h3>
                            <p style="color: #888;">Use the sidebar to manage users, media content, and system settings.</p>
                        </div>
                    </div>
                    
                    <!-- Tab: Users Management -->
                    <div id="adminTabUsers" class="admin-tab" style="display: none;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                            <h3>System Users</h3>
                            <button onclick="openAddUserForm()" style="background: #E50914; border: none; color: white; padding: 10px 20px; border-radius: 6px; cursor: pointer;">+ Add User</button>
                        </div>
                        <div id="addUserForm" style="display: none; background: #111; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                            <h4 id="userFormTitle">Add New User</h4>
                            <input type="hidden" id="editUserId">
                            <div style="margin-bottom: 15px;">
                                <input type="text" id="newUsername" placeholder="Username" style="width: 100%; padding: 12px; background: #1a1a1a; border: 1px solid #333; color: white; border-radius: 6px;">
                            </div>
                            <div style="margin-bottom: 15px;">
                                <input type="password" id="newPassword" placeholder="Password" style="width: 100%; padding: 12px; background: #1a1a1a; border: 1px solid #333; color: white; border-radius: 6px;">
                            </div>
                            <div style="margin-bottom: 15px;">
                                <select id="newRole" style="width: 100%; padding: 12px; background: #1a1a1a; border: 1px solid #333; color: white; border-radius: 6px;">
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <button onclick="submitUserForm()" style="background: #E50914; border: none; color: white; padding: 12px; border-radius: 6px; cursor: pointer; width: 100%;">Save User</button>
                        </div>
                        <div style="background: #111111; border-radius: 12px; overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="background: #161616;">
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
                    
                    <!-- Tab: Media Management -->
                    <div id="adminTabMedia" class="admin-tab" style="display: none;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                            <h3>All Media Content</h3>
                            <button onclick="switchAdminTab('upload')" style="background: #E50914; border: none; color: white; padding: 10px 20px; border-radius: 6px; cursor: pointer;">+ Add Media</button>
                        </div>
                        <div style="background: #111111; border-radius: 12px; overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="background: #161616;">
                                        <th style="padding: 16px; text-align: left;">Title</th>
                                        <th style="padding: 16px; text-align: left;">Type</th>
                                        <th style="padding: 16px; text-align: left;">Genre</th>
                                        <th style="padding: 16px; text-align: left;">Year</th>
                                        <th style="padding: 16px; text-align: left;">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="adminMediaTable"></tbody>
                            </table>
                        </div>
                    </div>
                    
                    <!-- Tab: Upload Media -->
                    <div id="adminTabUpload" class="admin-tab" style="display: none;">
                        <h3 style="margin-bottom: 20px;">Upload New Media</h3>
                        <div style="background: #111111; padding: 30px; border-radius: 12px;">
                            <form id="adminMediaForm" onsubmit="handleAdminUpload(event)">
                                <div style="margin-bottom: 20px;">
                                    <label style="display: block; color: #aaa; margin-bottom: 8px;">Media Type</label>
                                    <select id="adminMediaType" style="width: 100%; padding: 14px; background: #1a1a1a; border: 1px solid #333; color: white; border-radius: 6px;">
                                        <option value="movie">Movie</option>
                                        <option value="show">TV Show</option>
                                    </select>
                                </div>
                                <div style="margin-bottom: 20px;">
                                    <label style="display: block; color: #aaa; margin-bottom: 8px;">Title</label>
                                    <input type="text" id="adminMediaTitle" required style="width: 100%; padding: 14px; background: #1a1a1a; border: 1px solid #333; color: white; border-radius: 6px;">
                                </div>
                                <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                                    <div style="flex:1;">
                                        <label style="display: block; color: #aaa; margin-bottom: 8px;">Rating</label>
                                        <input type="text" id="adminMediaRating" style="width: 100%; padding: 14px; background: #1a1a1a; border: 1px solid #333; color: white; border-radius: 6px;">
                                    </div>
                                    <div style="flex:1;">
                                        <label style="display: block; color: #aaa; margin-bottom: 8px;">Year</label>
                                        <input type="number" id="adminMediaYear" style="width: 100%; padding: 14px; background: #1a1a1a; border: 1px solid #333; color: white; border-radius: 6px;">
                                    </div>
                                </div>
                                <div style="margin-bottom: 20px;">
                                    <label style="display: block; color: #aaa; margin-bottom: 8px;">Genre</label>
                                    <input type="text" id="adminMediaGenre" style="width: 100%; padding: 14px; background: #1a1a1a; border: 1px solid #333; color: white; border-radius: 6px;">
                                </div>
                                <div style="margin-bottom: 20px;">
                                    <label style="display: block; color: #aaa; margin-bottom: 8px;">Image URL</label>
                                    <input type="url" id="adminMediaImg" style="width: 100%; padding: 14px; background: #1a1a1a; border: 1px solid #333; color: white; border-radius: 6px;">
                                </div>
                                <div style="margin-bottom: 20px;">
                                    <label style="display: block; color: #aaa; margin-bottom: 8px;">Video URL</label>
                                    <input type="url" id="adminMediaUrl" style="width: 100%; padding: 14px; background: #1a1a1a; border: 1px solid #333; color: white; border-radius: 6px;">
                                </div>
                                <div style="margin-bottom: 20px;">
                                    <label style="display: block; color: #aaa; margin-bottom: 8px;">Description</label>
                                    <textarea id="adminMediaDesc" rows="4" style="width: 100%; padding: 14px; background: #1a1a1a; border: 1px solid #333; color: white; border-radius: 6px;"></textarea>
                                </div>
                                <button type="submit" style="width: 100%; background: #E50914; color: white; border: none; padding: 14px; border-radius: 6px; cursor: pointer; font-weight: 700;">Publish Media</button>
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
window.switchAdminTab = function(tabId) {
    document.querySelectorAll('.admin-tab').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.admin-menu-item').forEach(item => item.classList.remove('active'));
    
    document.getElementById(`adminTab${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`).style.display = 'block';
    const activeMenuItem = document.querySelector(`.admin-menu-item[data-tab="${tabId}"]`);
    if (activeMenuItem) activeMenuItem.classList.add('active');
    
    const titles = { overview: "System Dashboard", users: "User Management", media: "Media Management", upload: "Upload Content" };
    document.getElementById('adminPanelTitle').innerText = titles[tabId] || "Admin Panel";
    
    if (tabId === 'users') loadAdminUsers();
    if (tabId === 'media') loadAdminMedia();
};

window.loadAdminData = async function() {
    try {
        const response = await fetch(`${API_URL}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            const stats = await response.json();
            document.getElementById('adminStatUsers').innerText = stats.users || 0;
            document.getElementById('adminStatMovies').innerText = stats.movies || 0;
            document.getElementById('adminStatShows').innerText = stats.shows || 0;
        }
    } catch(e) { console.log('Stats error:', e); }
    
    loadAdminUsers();
    loadAdminMedia();
};

window.loadAdminUsers = async function() {
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
                    <td style="padding: 16px;"><span style="background: ${user.role === 'admin' ? '#E50914' : '#333'}; padding: 4px 10px; border-radius: 20px; font-size: 11px;">${user.role}</span></td>
                    <td style="padding: 16px;"><span style="color: ${user.isBanned ? '#E50914' : '#46d369'};">${user.isBanned ? 'BANNED' : 'ACTIVE'}</span></td>
                    <td style="padding: 16px;">
                        <button onclick="toggleBanUser('${user.id}')" style="background: #333; border: none; color: white; padding: 5px 12px; border-radius: 4px; cursor: pointer; margin-right: 5px;">${user.isBanned ? 'Unban' : 'Ban'}</button>
                        <button onclick="deleteUser('${user.id}')" style="background: #E50914; border: none; color: white; padding: 5px 12px; border-radius: 4px; cursor: pointer;">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch(e) { console.log('Load users error:', e); }
};

window.loadAdminMedia = function() {
    const tbody = document.getElementById('adminMediaTable');
    if (!tbody) return;
    tbody.innerHTML = '';
    allMedia.forEach(media => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 16px;">${escapeHtml(media.title)}</td>
            <td style="padding: 16px;"><span style="background: #333; padding: 4px 10px; border-radius: 20px;">${media.type}</span></td>
            <td style="padding: 16px;">${escapeHtml(media.genre || 'N/A')}</td>
            <td style="padding: 16px;">${media.year || 'N/A'}</td>
            <td style="padding: 16px;">
                <button onclick="adminDeleteMedia('${media.id}')" style="background: #E50914; border: none; color: white; padding: 5px 12px; border-radius: 4px; cursor: pointer;">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

window.openAddUserForm = function() {
    const form = document.getElementById('addUserForm');
    if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
        document.getElementById('editUserId').value = '';
        document.getElementById('newUsername').value = '';
        document.getElementById('newPassword').value = '';
    }
};

window.submitUserForm = async function() {
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
        } else {
            const error = await response.json();
            triggerToast(error.message, 'error');
        }
    } catch(e) {
        triggerToast('Error saving user', 'error');
    }
};

window.toggleBanUser = async function(userId) {
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
};

window.deleteUser = async function(userId) {
    if (!confirm('Delete this user permanently?')) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            triggerToast('User deleted');
            loadAdminUsers();
            if (typeof loadAllMedia === 'function') loadAllMedia();
        }
    } catch(e) {
        triggerToast('Error deleting user', 'error');
    }
};

window.adminDeleteMedia = async function(mediaId) {
    if (!confirm('Delete this media permanently?')) return;
    try {
        const response = await fetch(`${API_URL}/movies/${mediaId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            triggerToast('Media deleted');
            loadAllMedia();
            loadAdminMedia();
        }
    } catch(e) {
        triggerToast('Error deleting media', 'error');
    }
};

window.handleAdminUpload = async function(event) {
    event.preventDefault();
    
    const newMedia = {
        title: document.getElementById('adminMediaTitle').value,
        type: document.getElementById('adminMediaType').value,
        rating: document.getElementById('adminMediaRating').value || null,
        year: document.getElementById('adminMediaYear').value || null,
        genre: document.getElementById('adminMediaGenre').value || null,
        img: document.getElementById('adminMediaImg').value,
        url: document.getElementById('adminMediaUrl').value || null,
        description: document.getElementById('adminMediaDesc').value
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
            loadAdminMedia();
            switchAdminTab('media');
        } else {
            const error = await response.json();
            triggerToast(error.message, 'error');
        }
    } catch(e) {
        triggerToast('Error publishing', 'error');
    }
};

// Add CSS styles for admin panel
const adminStyles = document.createElement('style');
adminStyles.textContent = `
    .admin-menu-item.active { background: rgba(229, 9, 20, 0.1); color: white !important; border-left: 4px solid #E50914; padding-left: 14px !important; }
    .admin-menu-item:hover { background: rgba(255,255,255,0.05); color: white; }
`;
document.head.appendChild(adminStyles);
