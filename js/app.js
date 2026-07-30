// ============================================================
// CampusOS — Main Application Logic
// ============================================================

import {
  CAMPUS_CENTER, CAMPUS_ZOOM, BUILDINGS, AMENITIES, AMENITY_TYPES,
  TIMETABLE, EMERGENCY_CONTACTS, CHAT_RESPONSES, DEMO_ROUTES, REVIEWS
} from './data.js';

// ---- State ----
let map = null;
let currentTab = 'map-screen';
let buildingMarkers = {};
let amenityMarkers = [];
let routeLayer = null;
let locationMarker = null;
let selectedBuilding = null;
let currentRoute = null;
let amenityVisible = true;
let tileLayer = null;
let userLocation = [...CAMPUS_CENTER]; // Simulated location (near campus center)
// Slightly offset for realism
userLocation = [26.4485, 80.3315];

// ---- Initialization ----
document.addEventListener('DOMContentLoaded', () => {
  initSplash();
});

// ============================================================
// SPLASH SCREEN
// ============================================================
function initSplash() {
  setTimeout(() => {
    document.getElementById('splash-screen').classList.remove('active');
    document.getElementById('login-screen').classList.add('active');
    initLogin();
  }, 2500);
}

// ============================================================
// LOGIN SCREEN
// ============================================================
function initLogin() {
  const phoneInput = document.getElementById('phone-input');
  const btnSendOtp = document.getElementById('btn-send-otp');
  const btnVerifyOtp = document.getElementById('btn-verify-otp');
  const btnEnterCampus = document.getElementById('btn-enter-campus');
  const btnGuest = document.getElementById('btn-guest');
  const otpBoxes = document.querySelectorAll('.otp-box');

  btnSendOtp.addEventListener('click', () => {
    if (phoneInput.value.length >= 10 || phoneInput.value.length === 0) {
      document.getElementById('login-step-phone').classList.add('hidden');
      document.getElementById('login-step-otp').classList.remove('hidden');
      // Auto-fill OTP for demo
      setTimeout(() => {
        otpBoxes.forEach((box, i) => {
          box.value = String(i + 1);
        });
      }, 800);
      startResendTimer();
    }
  });

  // OTP box auto-focus
  otpBoxes.forEach((box, index) => {
    box.addEventListener('input', () => {
      if (box.value && index < otpBoxes.length - 1) {
        otpBoxes[index + 1].focus();
      }
    });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && index > 0) {
        otpBoxes[index - 1].focus();
      }
    });
  });

  btnVerifyOtp.addEventListener('click', () => {
    document.getElementById('login-step-otp').classList.add('hidden');
    document.getElementById('login-step-profile').classList.remove('hidden');
  });

  // Role selector
  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const studentFields = document.getElementById('student-fields');
      if (btn.dataset.role === 'student') {
        studentFields.style.display = 'flex';
      } else {
        studentFields.style.display = 'none';
      }
    });
  });

  btnEnterCampus.addEventListener('click', () => {
    const name = document.getElementById('profile-name').value || 'Student';
    enterApp(name);
  });

  btnGuest.addEventListener('click', () => {
    enterApp('Guest');
  });
}

function startResendTimer() {
  let seconds = 30;
  const timerEl = document.getElementById('resend-timer');
  const interval = setInterval(() => {
    seconds--;
    timerEl.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(interval);
      document.getElementById('btn-resend').innerHTML = 'Resend OTP';
    }
  }, 1000);
}

function enterApp(userName) {
  document.getElementById('profile-display-name').textContent = userName;
  document.getElementById('login-screen').classList.remove('active');
  document.getElementById('app-container').classList.add('active');
  initApp();
}

// ============================================================
// MAIN APP INIT
// ============================================================
function initApp() {
  initMap();
  initTabs();
  initSearch();
  initTimetable();
  initSOS();
  initChat();
  initAmenityPills();
  initEmergencyContacts();
  initModals();
  initSettings();
}

// ============================================================
// MAP
// ============================================================
function initMap() {
  map = L.map('map', {
    center: CAMPUS_CENTER,
    zoom: CAMPUS_ZOOM,
    zoomControl: false,
    attributionControl: false,
  });

  // Map tiles (dark by default)
  tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 20,
    subdomains: 'abcd',
  }).addTo(map);

  // Zoom control (top right)
  L.control.zoom({ position: 'topright' }).addTo(map);

  // Add building markers
  BUILDINGS.forEach(building => {
    const markerType = building.type;
    const markerHTML = `
      <div class="campus-marker marker-${markerType}">
        <div class="marker-icon">${building.icon}</div>
        <div class="marker-label">${building.name}</div>
      </div>
    `;

    const icon = L.divIcon({
      html: markerHTML,
      className: 'campus-marker-wrapper',
      iconSize: [0, 0],
      iconAnchor: [21, 52],
    });

    const marker = L.marker(building.coords, { icon }).addTo(map);
    marker.on('click', () => openBuildingDetail(building));
    buildingMarkers[building.id] = marker;
  });

  // Add amenity markers
  addAmenityMarkers();

  // Add location dot
  addLocationDot();

  // Locate button
  document.getElementById('btn-locate').addEventListener('click', () => {
    map.flyTo(userLocation, 17, { duration: 0.8 });
  });

  // Mode toggle
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function addAmenityMarkers() {
  amenityMarkers.forEach(m => map.removeLayer(m));
  amenityMarkers = [];

  if (!amenityVisible) return;

  AMENITIES.forEach(amenity => {
    const typeInfo = AMENITY_TYPES[amenity.type];
    const markerHTML = `<div class="amenity-marker" title="${amenity.name}">${typeInfo.icon}</div>`;
    const icon = L.divIcon({
      html: markerHTML,
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    const marker = L.marker(amenity.coords, { icon }).addTo(map);
    marker.on('click', () => {
      // Small popup
      const popup = L.popup({ closeButton: true, className: 'amenity-popup' })
        .setLatLng(amenity.coords)
        .setContent(`<strong>${typeInfo.icon} ${amenity.name}</strong><br><small>Near ${getBuildingName(amenity.near)}</small>`)
        .openOn(map);
    });
    amenityMarkers.push(marker);
  });
}

function addLocationDot() {
  const dotHTML = `
    <div class="location-dot">
      <div class="location-dot-pulse"></div>
      <div class="location-dot-inner"></div>
    </div>
  `;

  const icon = L.divIcon({
    html: dotHTML,
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

  locationMarker = L.marker(userLocation, { icon, zIndexOffset: 1000 }).addTo(map);
}

function getBuildingName(id) {
  const b = BUILDINGS.find(b => b.id === id);
  return b ? b.name : id;
}

// ============================================================
// TAB NAVIGATION
// ============================================================
function initTabs() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      switchTab(targetTab);
    });
  });
}

function switchTab(tabId) {
  // Hide all tab screens
  document.querySelectorAll('.tab-screen').forEach(s => s.classList.remove('active'));
  // Show target
  document.getElementById(tabId).classList.add('active');
  // Update nav
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.nav-tab[data-tab="${tabId}"]`).classList.add('active');
  currentTab = tabId;

  // Re-invalidate map if switching back to map
  if (tabId === 'map-screen' && map) {
    setTimeout(() => map.invalidateSize(), 100);
  }
}

// ============================================================
// SEARCH
// ============================================================
function initSearch() {
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');

  input.addEventListener('input', () => {
    const query = input.value.toLowerCase().trim();
    if (query.length < 2) {
      results.classList.add('hidden');
      return;
    }

    const matches = BUILDINGS.filter(b => {
      const searchText = `${b.name} ${b.dept || ''} ${b.description} ${(b.tags || []).join(' ')} ${(b.rooms || []).join(' ')}`.toLowerCase();
      return searchText.includes(query);
    }).slice(0, 6);

    if (matches.length === 0) {
      results.classList.add('hidden');
      return;
    }

    results.innerHTML = matches.map(b => `
      <div class="search-result-item" data-id="${b.id}">
        <div class="search-result-icon">${b.icon}</div>
        <div class="search-result-text">
          <strong>${highlightMatch(b.name, query)}</strong>
          <span>${b.dept || b.type}</span>
        </div>
      </div>
    `).join('');

    results.classList.remove('hidden');

    // Click handlers
    results.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const building = BUILDINGS.find(b => b.id === item.dataset.id);
        if (building) {
          input.value = '';
          results.classList.add('hidden');
          map.flyTo(building.coords, 18, { duration: 0.8 });
          setTimeout(() => openBuildingDetail(building), 500);
        }
      });
    });
  });

  input.addEventListener('blur', () => {
    setTimeout(() => results.classList.add('hidden'), 200);
  });

  input.addEventListener('focus', () => {
    if (input.value.length >= 2) results.classList.remove('hidden');
  });
}

function highlightMatch(text, query) {
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return text.replace(regex, '<mark style="background:rgba(199,91,57,0.3);color:var(--cream);border-radius:2px;padding:0 2px;">$1</mark>');
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================
// BUILDING DETAIL
// ============================================================
function openBuildingDetail(building) {
  selectedBuilding = building;
  const sheet = document.getElementById('building-detail');

  document.getElementById('detail-icon').textContent = building.icon;
  document.getElementById('detail-name').textContent = building.name;
  document.getElementById('detail-dept').textContent = building.dept || building.type.charAt(0).toUpperCase() + building.type.slice(1);
  document.getElementById('detail-hours').textContent = building.hours;
  document.getElementById('detail-description').textContent = building.description;

  const floorsChip = document.getElementById('detail-floors-chip');
  if (building.floors > 0) {
    document.getElementById('detail-floors').textContent = `${building.floors} Floors`;
    floorsChip.style.display = 'flex';
  } else {
    floorsChip.style.display = 'none';
  }

  const accessChip = document.getElementById('detail-accessible');
  accessChip.style.display = (building.hasRamp || building.hasElevator) ? 'flex' : 'none';

  // Reviews
  populateReviews(building.id);

  sheet.classList.add('open');

  // Close button
  document.getElementById('btn-close-detail').onclick = () => sheet.classList.remove('open');

  // Navigate button
  document.getElementById('btn-navigate-to').onclick = () => {
    sheet.classList.remove('open');
    startNavigation(building);
  };
}

function populateReviews(buildingId) {
  const reviewsData = REVIEWS[buildingId];
  const reviewsList = document.getElementById('reviews-list');
  const avgRating = document.getElementById('avg-rating');

  if (!reviewsData || reviewsData.length === 0) {
    document.getElementById('reviews-section').style.display = 'none';
    return;
  }

  document.getElementById('reviews-section').style.display = 'block';

  const avg = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;
  const stars = '★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg));
  avgRating.innerHTML = `<span class="stars">${stars}</span><span class="rating-num">${avg.toFixed(1)}</span>`;

  reviewsList.innerHTML = reviewsData.map(r => `
    <div class="review-card">
      <div class="review-top">
        <span class="review-user">${r.user}</span>
        <span class="review-rating">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
      </div>
      <p class="review-text">${r.text}</p>
      <span class="review-time">${r.time}</span>
    </div>
  `).join('');
}

// ============================================================
// NAVIGATION
// ============================================================
function startNavigation(building) {
  // Find a demo route or generate one
  let route = null;
  for (const key in DEMO_ROUTES) {
    if (DEMO_ROUTES[key].to === building.id) {
      route = DEMO_ROUTES[key];
      break;
    }
  }

  if (!route) {
    // Generate a simple straight-line route
    route = {
      from: 'current',
      to: building.id,
      distance: calculateDistance(userLocation, building.coords),
      walkTime: Math.ceil(calculateDistance(userLocation, building.coords) / 80) + ' min',
      cycleTime: Math.ceil(calculateDistance(userLocation, building.coords) / 200) + ' min',
      steps: [
        { instruction: `Head toward ${building.name}`, distance: calculateDistance(userLocation, building.coords) + 'm' },
        { instruction: `Arrive at ${building.name}`, distance: '0m' },
      ],
      path: [userLocation, building.coords],
    };
  }

  currentRoute = route;

  // Remove existing route
  if (routeLayer) map.removeLayer(routeLayer);

  // Draw route on map
  routeLayer = L.polyline(route.path, {
    color: '#C75B39',
    weight: 5,
    opacity: 0.9,
    dashArray: '10, 8',
    lineCap: 'round',
    lineJoin: 'round',
  }).addTo(map);

  // Fit map to route
  const bounds = L.latLngBounds(route.path);
  map.fitBounds(bounds, { padding: [80, 80], maxZoom: 17 });

  // Animate the route dash
  let offset = 0;
  const animateRoute = setInterval(() => {
    offset -= 1;
    routeLayer.setStyle({ dashOffset: offset });
  }, 50);

  // Store interval for cleanup
  routeLayer._animInterval = animateRoute;

  // Show nav overlay
  const overlay = document.getElementById('nav-overlay');
  overlay.classList.remove('hidden');

  // Get active mode
  const activeMode = document.querySelector('.mode-btn.active');
  const mode = activeMode ? activeMode.dataset.mode : 'walk';
  const modeIcons = { walk: '🚶 Walking', cycle: '🚲 Cycling', vehicle: '🛵 Driving' };
  const timeKey = mode === 'walk' ? 'walkTime' : 'cycleTime';

  document.getElementById('nav-eta').textContent = typeof route[timeKey] === 'string' ? route[timeKey] : route.walkTime;
  document.getElementById('nav-distance').textContent = typeof route.distance === 'string' ? route.distance : route.distance + 'm';
  document.getElementById('nav-mode').textContent = modeIcons[mode] || modeIcons.walk;
  document.getElementById('nav-instruction').textContent = route.steps[0].instruction;
  document.getElementById('nav-step-dist').textContent = route.steps[0].distance;
  document.getElementById('nav-dest-name').textContent = `→ ${building.name}`;

  // Animate speed
  animateSpeed();

  // Close nav
  document.getElementById('btn-close-nav').onclick = () => {
    overlay.classList.add('hidden');
    if (routeLayer) {
      clearInterval(routeLayer._animInterval);
      map.removeLayer(routeLayer);
      routeLayer = null;
    }
    currentRoute = null;
  };

  // Switch back to map tab
  switchTab('map-screen');
}

function animateSpeed() {
  const speedEl = document.getElementById('nav-speed');
  let speed = 4.0;
  setInterval(() => {
    speed = 3.5 + Math.random() * 1.5;
    speedEl.textContent = speed.toFixed(1);
  }, 2000);
}

function calculateDistance(coord1, coord2) {
  const R = 6371000;
  const dLat = (coord2[0] - coord1[0]) * Math.PI / 180;
  const dLon = (coord2[1] - coord1[1]) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// ============================================================
// AMENITY PILLS
// ============================================================
function initAmenityPills() {
  document.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const type = pill.dataset.type;
      const typeInfo = AMENITY_TYPES[type];
      const matching = AMENITIES.filter(a => a.type === type);

      // Toggle active
      const wasActive = pill.classList.contains('active');
      document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));

      if (wasActive) {
        document.getElementById('amenity-overlay').classList.add('hidden');
        return;
      }

      pill.classList.add('active');

      // Sort by distance from user
      const sorted = matching.map(a => ({
        ...a,
        dist: calculateDistance(userLocation, a.coords),
      })).sort((a, b) => a.dist - b.dist);

      // Show overlay
      const overlay = document.getElementById('amenity-overlay');
      document.getElementById('amenity-overlay-title').textContent = `Nearby ${typeInfo.label}s`;
      document.getElementById('amenity-results').innerHTML = sorted.map(a => `
        <div class="amenity-result-item" data-lat="${a.coords[0]}" data-lng="${a.coords[1]}">
          <div class="amenity-result-icon">${typeInfo.icon}</div>
          <div class="amenity-result-info">
            <strong>${a.name}</strong>
            <span>${a.dist}m · Near ${getBuildingName(a.near)} · ${Math.ceil(a.dist / 80)} min walk</span>
          </div>
          <button class="amenity-nav-btn" title="Navigate">→</button>
        </div>
      `).join('');

      overlay.classList.remove('hidden');

      // Click to navigate
      overlay.querySelectorAll('.amenity-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const lat = parseFloat(item.dataset.lat);
          const lng = parseFloat(item.dataset.lng);
          overlay.classList.add('hidden');
          document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
          map.flyTo([lat, lng], 19, { duration: 0.8 });
        });
      });

      // Close
      document.getElementById('btn-close-amenity').onclick = () => {
        overlay.classList.add('hidden');
        document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      };
    });
  });
}

// ============================================================
// TIMETABLE
// ============================================================
function initTimetable() {
  // Set date
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  document.getElementById('today-date').textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

  const list = document.getElementById('timetable-list');
  const currentHour = now.getHours();

  list.innerHTML = TIMETABLE.map((item, i) => {
    const startHour = parseInt(item.time.split(':')[0]);
    const isCurrent = currentHour >= startHour && currentHour < startHour + 1;
    const building = BUILDINGS.find(b => b.id === item.building);
    const dist = building ? calculateDistance(userLocation, building.coords) : 0;
    const walkMin = Math.ceil(dist / 80);

    return `
      <div class="tt-card type-${item.type} ${isCurrent ? 'current' : ''}" data-building="${item.building}">
        <div class="tt-time">
          <span class="tt-time-start">${item.time}</span>
          <span class="tt-time-end">${item.endTime}</span>
        </div>
        <div class="tt-info">
          <div class="tt-subject">${item.subject}</div>
          <div class="tt-location">📍 ${building ? building.name : ''} · ${item.room} · ${dist}m · ${walkMin} min</div>
        </div>
        <button class="tt-nav-btn" title="Navigate to class">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.71 11.29l-9-9a.996.996 0 0 0-1.41 0l-9 9a.996.996 0 0 0 0 1.41l9 9c.39.39 1.02.39 1.41 0l9-9a.996.996 0 0 0 0-1.41zM14 14.5V12h-4v3H8v-4c0-.55.45-1 1-1h5V7.5l3.5 3.5-3.5 3.5z"/></svg>
        </button>
      </div>
    `;
  }).join('');

  // Nav buttons
  list.querySelectorAll('.tt-nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.tt-card');
      const buildingId = card.dataset.building;
      const building = BUILDINGS.find(b => b.id === buildingId);
      if (building) {
        switchTab('map-screen');
        setTimeout(() => startNavigation(building), 300);
      }
    });
  });

  // Exam mode
  document.getElementById('btn-find-hall').addEventListener('click', () => {
    const roll = document.getElementById('exam-roll').value;
    if (roll) {
      const examHall = BUILDINGS.find(b => b.id === 'exam_hall');
      if (examHall) {
        switchTab('map-screen');
        setTimeout(() => {
          map.flyTo(examHall.coords, 18, { duration: 0.8 });
          setTimeout(() => openBuildingDetail(examHall), 500);
        }, 300);
      }
    }
  });
}

// ============================================================
// SOS
// ============================================================
function initSOS() {
  const emergencyTypes = {
    medical: { label: 'Medical Emergency', icon: '🏥', nearBuilding: 'health_center' },
    fire: { label: 'Fire Emergency', icon: '🔥', nearBuilding: 'main_gate' },
    security: { label: 'Security Incident', icon: '🛡️', nearBuilding: 'main_gate' },
    accident: { label: 'Accident Reported', icon: '🚗', nearBuilding: 'health_center' },
    harassment: { label: 'Harassment Alert', icon: '🚨', nearBuilding: 'main_gate' },
    other: { label: 'Emergency Alert', icon: '📝', nearBuilding: 'main_gate' },
  };

  document.querySelectorAll('.sos-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      const info = emergencyTypes[type];
      const nearBuilding = BUILDINGS.find(b => b.id === info.nearBuilding);
      const dist = nearBuilding ? calculateDistance(userLocation, nearBuilding.coords) : 0;
      const walkMin = Math.ceil(dist / 80);

      const overlay = document.getElementById('sos-active-overlay');
      document.getElementById('sos-active-type').textContent = info.label;
      document.getElementById('sos-nearest-name').textContent = nearBuilding ? nearBuilding.name : 'Security';
      document.getElementById('sos-nearest-dist').textContent = `${dist}m · ${walkMin} min walk`;

      overlay.classList.remove('hidden');

      // Navigate to nearest resource
      document.getElementById('btn-sos-navigate').onclick = () => {
        overlay.classList.add('hidden');
        if (nearBuilding) {
          switchTab('map-screen');
          setTimeout(() => startNavigation(nearBuilding), 300);
        }
      };

      // Cancel
      document.getElementById('btn-sos-cancel').onclick = () => {
        overlay.classList.add('hidden');
      };
    });
  });
}

function initEmergencyContacts() {
  const list = document.getElementById('emergency-contacts');
  const icons = {
    medical: '🏥', security: '🛡️', fire: '🚒', police: '🚔', ambulance: '🚑', women: '👩',
  };

  list.innerHTML = EMERGENCY_CONTACTS.map(c => `
    <div class="contact-item">
      <span class="contact-item-icon">${icons[c.type] || '📞'}</span>
      <div class="contact-item-info">
        <strong>${c.label}</strong>
        <span>${c.phone}</span>
      </div>
      <button class="contact-call-btn" title="Call">📞</button>
    </div>
  `).join('');
}

// ============================================================
// CHAT
// ============================================================
function initChat() {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('btn-chat-send');
  const messagesContainer = document.getElementById('chat-messages');

  function sendMessage(text) {
    if (!text.trim()) return;

    // Add user message
    appendChatMessage(text, 'user');
    input.value = '';

    // Find response
    const query = text.toLowerCase().trim();
    let response = CHAT_RESPONSES['default'];

    for (const key in CHAT_RESPONSES) {
      if (query.includes(key) || key.includes(query)) {
        response = CHAT_RESPONSES[key];
        break;
      }
    }

    // Typing indicator
    const typingId = 'typing-' + Date.now();
    const typingHTML = `<div class="chat-message bot" id="${typingId}"><div class="message-bubble"><p>Thinking...</p></div></div>`;
    messagesContainer.insertAdjacentHTML('beforeend', typingHTML);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    setTimeout(() => {
      const typingEl = document.getElementById(typingId);
      if (typingEl) typingEl.remove();

      let responseHTML = `<p>${response.text}</p>`;
      if (response.building) {
        const building = BUILDINGS.find(b => b.id === response.building);
        if (building) {
          responseHTML += `<button class="message-action-btn" data-building="${building.id}">🧭 Navigate to ${building.name}</button>`;
        }
      }

      appendChatMessage(responseHTML, 'bot', true);
    }, 800 + Math.random() * 600);
  }

  sendBtn.addEventListener('click', () => sendMessage(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage(input.value);
  });

  // Suggestion chips
  document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => sendMessage(chip.textContent));
  });
}

function appendChatMessage(content, sender, isHTML = false) {
  const messagesContainer = document.getElementById('chat-messages');
  const now = new Date();
  const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-message ${sender}`;
  msgDiv.innerHTML = `
    <div class="message-bubble">${isHTML ? content : `<p>${content}</p>`}</div>
    <span class="message-time">${timeStr}</span>
  `;

  messagesContainer.appendChild(msgDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // If has action button, add click handler
  const actionBtn = msgDiv.querySelector('.message-action-btn');
  if (actionBtn) {
    actionBtn.addEventListener('click', () => {
      const buildingId = actionBtn.dataset.building;
      const building = BUILDINGS.find(b => b.id === buildingId);
      if (building) {
        switchTab('map-screen');
        setTimeout(() => {
          map.flyTo(building.coords, 18, { duration: 0.8 });
          setTimeout(() => openBuildingDetail(building), 500);
        }, 300);
      }
    });
  }
}

// ============================================================
// QR SCANNER
// ============================================================
function initModals() {
  // QR Simulate button
  document.getElementById('btn-simulate-qr').addEventListener('click', () => {
    const overlay = document.getElementById('qr-overlay');
    overlay.classList.add('hidden');
    // Show building detail for UIET
    const uiet = BUILDINGS.find(b => b.id === 'uiet');
    if (uiet) {
      switchTab('map-screen');
      setTimeout(() => {
        map.flyTo(uiet.coords, 19, { duration: 0.8 });
        setTimeout(() => openBuildingDetail(uiet), 600);
      }, 300);
    }
  });

  document.getElementById('btn-close-qr').addEventListener('click', () => {
    document.getElementById('qr-overlay').classList.add('hidden');
  });

  // Voice button - show QR as a demo
  document.getElementById('btn-voice').addEventListener('click', () => {
    document.getElementById('qr-overlay').classList.remove('hidden');
  });
}

// ============================================================
// SETTINGS (Dark Mode, Accessibility, etc.)
// ============================================================
function initSettings() {
  const darkToggle = document.getElementById('toggle-dark');
  const accessToggle = document.getElementById('toggle-accessibility');
  const amenityToggle = document.getElementById('toggle-amenities');

  // Restore saved theme
  const savedTheme = localStorage.getItem('campusos-theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    darkToggle.checked = false;
    swapMapTiles(false);
  } else {
    darkToggle.checked = true;
  }

  // Dark Mode toggle
  darkToggle.addEventListener('change', () => {
    const isDark = darkToggle.checked;
    if (isDark) {
      document.body.classList.remove('light-mode');
      localStorage.setItem('campusos-theme', 'dark');
    } else {
      document.body.classList.add('light-mode');
      localStorage.setItem('campusos-theme', 'light');
    }
    swapMapTiles(isDark);
  });

  // Amenities toggle
  if (amenityToggle) {
    amenityToggle.addEventListener('change', () => {
      amenityVisible = amenityToggle.checked;
      addAmenityMarkers();
    });
  }

  // Accessibility toggle (increase font size)
  if (accessToggle) {
    accessToggle.addEventListener('change', () => {
      if (accessToggle.checked) {
        document.documentElement.style.fontSize = '18px';
      } else {
        document.documentElement.style.fontSize = '15px';
      }
    });
  }
}

function swapMapTiles(isDark) {
  if (!map || !tileLayer) return;
  map.removeLayer(tileLayer);
  const url = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  tileLayer = L.tileLayer(url, {
    maxZoom: 20,
    subdomains: 'abcd',
  }).addTo(map);
}
