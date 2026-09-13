/* ==========================================================================
   CAMPUSNOVA - INTERACTIVE CAMPUS MAP COMPONENT (LEAFLET.JS)
   Campus Demo Map with Legitimate OpenStreetMap Basemap Tiles,
   Dijkstra Shortest-Path Graph Navigation, Real-time Browser Geolocation,
   Turn-by-Turn Live Navigation HUD, 16 Verified Venues, and Deep Linking.
   ========================================================================== */

const CampusMapView = {
  mapInstance: null,
  markers: [],
  activePolyline: null,
  startMarker: null,
  endMarker: null,
  userLocationMarker: null,
  watchId: null,
  isNavigating: false,
  selectedCategory: 'all',
  locationsCache: [],
  currentRoute: null,

  render: function(portal = 'student') {
    return `
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        <!-- Campus Demo Map Header & Badges -->
        <div class="card glass-panel" style="background: linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(124, 58, 237, 0.1) 100%); border-color: rgba(99, 102, 241, 0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem; flex-wrap: wrap;">
                <span class="badge badge-primary" style="background: rgba(99, 102, 241, 0.2); border: 1px solid rgba(99, 102, 241, 0.4); color: #818cf8; font-weight: 700;">
                  CAMPUS DEMO MAP
                </span>
                <span class="badge badge-success" style="font-size: 0.7rem; font-weight: 700;">
                  Dijkstra Shortest-Path Engine
                </span>
                <span class="badge badge-secondary" style="font-size: 0.7rem;">
                  16 Verified Venues
                </span>
                <span class="badge badge-info" style="font-size: 0.7rem; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);">
                  Browser Geolocation Ready
                </span>
              </div>
              <h1 style="font-size: 1.65rem; font-weight: 800; margin: 0; color: var(--text-main);">
                Campus Infrastructure & Real-Time Navigation Map
              </h1>
              <p style="color: var(--text-muted); font-size: 0.88rem; margin: 0.25rem 0 0 0; line-height: 1.5;">
                Live interactive pathfinding across academic blocks, laboratories, hostels, dining, and administration.
              </p>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <div class="input-group" style="max-width: 240px;">
                <input type="text" id="map-search-input" class="input-field" placeholder="Search venue, lab, library..." onkeyup="CampusMapView.handleSearch(this.value)">
              </div>
            </div>
          </div>

          <!-- Navigation Routing Control Bar -->
          <div style="margin-top: 1.15rem; padding: 1rem 1.15rem; background: var(--surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
              <span style="font-size: 0.82rem; font-weight: 700; color: #818cf8; display: flex; align-items: center; gap: 0.35rem;">
                <i data-lucide="navigation" style="width: 14px; height: 14px;"></i> Wayfinding & Route Planner
              </span>
              <label style="font-size: 0.78rem; color: var(--text-muted); display: inline-flex; align-items: center; gap: 0.4rem; cursor: pointer;">
                <input type="checkbox" id="route-accessible-chk" onchange="CampusMapView.calculateRoute()">
                <span>Wheelchair Accessible Path (Step-Free)</span>
              </label>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr auto auto auto; gap: 0.6rem; align-items: center;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                  <label style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">Start / Origin</label>
                  <button type="button" class="btn btn-ghost btn-sm" id="btn-use-my-location" onclick="CampusMapView.useMyLocation()" style="font-size: 0.68rem; padding: 1px 6px; color: #818cf8; display: inline-flex; align-items: center; gap: 3px;" title="Acquire GPS coordinates and select closest campus venue">
                    <i data-lucide="crosshair" style="width: 11px; height: 11px;"></i> Use My Current Location
                  </button>
                </div>
                <select id="route-source-select" class="input-field" style="font-size: 0.82rem; padding: 0.45rem 0.65rem;" onchange="CampusMapView.calculateRoute()">
                  <option value="">Loading locations...</option>
                </select>
              </div>

              <div>
                <label style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 2px;">Destination</label>
                <select id="route-dest-select" class="input-field" style="font-size: 0.82rem; padding: 0.45rem 0.65rem;" onchange="CampusMapView.calculateRoute()">
                  <option value="">Loading locations...</option>
                </select>
              </div>

              <div style="display: flex; gap: 0.4rem; align-items: flex-end; padding-top: 1rem;">
                <button class="btn btn-secondary btn-sm" title="Swap Origin & Destination" onclick="CampusMapView.swapEndpoints()" style="padding: 0.45rem 0.75rem;">
                  <i data-lucide="arrow-left-right" style="width: 14px; height: 14px;"></i>
                </button>
                <button class="btn btn-primary btn-sm" onclick="CampusMapView.calculateRoute()" style="font-size: 0.82rem; padding: 0.45rem 1rem; font-weight: 700; white-space: nowrap;">
                  <i data-lucide="compass" style="width: 14px; height: 14px;"></i> Get Directions
                </button>
                <button class="btn btn-success btn-sm" id="btn-start-navigation" onclick="CampusMapView.startLiveNavigation()" style="font-size: 0.82rem; padding: 0.45rem 1rem; font-weight: 700; background: #10b981; border: none; white-space: nowrap; color: white;">
                  <i data-lucide="play" style="width: 14px; height: 14px;"></i> Start Navigation
                </button>
                <button class="btn btn-outline btn-sm" onclick="CampusMapView.clearRoute()" style="font-size: 0.82rem; padding: 0.45rem 0.85rem;" title="Clear current path">
                  Clear
                </button>
              </div>
            </div>
          </div>

          <!-- Category Filter Pills -->
          <div style="display: flex; gap: 0.5rem; margin-top: 1rem; overflow-x: auto; padding-bottom: 0.25rem;">
            <button class="btn btn-primary btn-sm map-cat-btn active" data-cat="all" onclick="CampusMapView.filterCategory('all', this)">All (16)</button>
            <button class="btn btn-secondary btn-sm map-cat-btn" data-cat="Academic" onclick="CampusMapView.filterCategory('Academic', this)">Academic & Depts</button>
            <button class="btn btn-secondary btn-sm map-cat-btn" data-cat="Labs" onclick="CampusMapView.filterCategory('Labs', this)">Labs & Tech</button>
            <button class="btn btn-secondary btn-sm map-cat-btn" data-cat="Library" onclick="CampusMapView.filterCategory('Library', this)">Library</button>
            <button class="btn btn-secondary btn-sm map-cat-btn" data-cat="Hostel" onclick="CampusMapView.filterCategory('Hostel', this)">Hostels</button>
            <button class="btn btn-secondary btn-sm map-cat-btn" data-cat="Administration" onclick="CampusMapView.filterCategory('Administration', this)">Admin & SAC</button>
            <button class="btn btn-secondary btn-sm map-cat-btn" data-cat="Food" onclick="CampusMapView.filterCategory('Food', this)">Food & Dining</button>
            <button class="btn btn-secondary btn-sm map-cat-btn" data-cat="Health" onclick="CampusMapView.filterCategory('Health', this)">Health & Sports</button>
            <button class="btn btn-secondary btn-sm map-cat-btn" data-cat="Transport" onclick="CampusMapView.filterCategory('Transport', this)">Gates & Parking</button>
          </div>
        </div>

        <!-- Map & Directions / Directory Grid -->
        <div style="display: grid; grid-template-columns: 1fr 370px; gap: 1.25rem; min-height: 560px; position: relative;">
          <!-- Leaflet Canvas Box -->
          <div class="card" style="padding: 0; overflow: hidden; position: relative; border-radius: var(--radius-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-md);">
            <div id="leaflet-campus-map" style="width: 100%; height: 560px; background: #0b0f19;"></div>

            <!-- Floating Live Navigation HUD (Rendered when Navigation is Active) -->
            <div id="live-navigation-hud" style="display: none; position: absolute; top: 14px; left: 14px; right: 14px; z-index: 1000; background: rgba(15, 23, 42, 0.94); backdrop-filter: blur(12px); border: 1px solid rgba(99, 102, 241, 0.4); border-radius: 12px; padding: 12px 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); color: white;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
                <div>
                  <div style="font-size: 0.72rem; color: #818cf8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;">
                    <span style="width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981;"></span>
                    🧭 Live Walking Navigation Active
                  </div>
                  <div style="font-size: 1.05rem; font-weight: 800; margin-top: 2px;" id="hud-destination">
                    Navigating to Destination...
                  </div>
                  <div style="font-size: 0.82rem; color: #cbd5e1; margin-top: 2px;" id="hud-next-turn">
                    Next: Head straight along path
                  </div>
                </div>

                <div style="display: flex; gap: 1.25rem; align-items: center;">
                  <div style="text-align: right;">
                    <div style="font-size: 1.15rem; font-weight: 800; color: #38bdf8;" id="hud-remaining-distance">-- m</div>
                    <div style="font-size: 0.72rem; color: #94a3b8;" id="hud-remaining-time">-- min walk</div>
                  </div>
                  <button class="btn btn-sm" onclick="CampusMapView.stopLiveNavigation()" style="background: #ef4444; border: none; color: white; padding: 6px 14px; font-weight: 700; border-radius: 6px;">
                    Stop Navigation
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Map Overlay Legend -->
            <div style="position: absolute; bottom: 12px; left: 12px; z-index: 900; background: rgba(17, 24, 39, 0.85); backdrop-filter: blur(8px); padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); font-size: 0.72rem; color: #e5e7eb; display: flex; gap: 0.75rem; align-items: center;">
              <span style="display: inline-flex; align-items: center; gap: 4px;">
                <span style="width: 10px; height: 10px; background: #6366f1; border-radius: 50%;"></span> Path Node
              </span>
              <span style="display: inline-flex; align-items: center; gap: 4px;">
                <span style="width: 16px; height: 3px; background: #818cf8; border-radius: 2px;"></span> Dijkstra Walkway
              </span>
              <span style="display: inline-flex; align-items: center; gap: 4px;">
                <span style="width: 10px; height: 10px; background: #3b82f6; border-radius: 50%; box-shadow: 0 0 6px #3b82f6;"></span> Current GPS
              </span>
              <span style="color: #10b981; font-weight: 600;">OpenStreetMap Live Tiles</span>
            </div>
          </div>

          <!-- Right Column: Directions Panel OR Venue Directory -->
          <div class="card" style="padding: 1.15rem; display: flex; flex-direction: column; max-height: 560px; overflow: hidden;">
            <!-- Turn-by-turn Route Panel (Hidden when no active route) -->
            <div id="route-directions-panel" style="display: none; flex-direction: column; height: 100%;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
                <div>
                  <h3 style="font-size: 0.95rem; font-weight: 800; margin: 0; color: var(--text-main);">
                    Turn-by-Turn Directions
                  </h3>
                  <span id="route-type-badge" class="badge badge-success" style="font-size: 0.65rem; margin-top: 3px;">
                    Dijkstra Optimal
                  </span>
                </div>
                <div style="display: flex; gap: 0.4rem; align-items: center;">
                  <button class="btn btn-success btn-sm" onclick="CampusMapView.startLiveNavigation()" style="font-size: 0.72rem; padding: 2px 8px; background: #10b981; border: none; color: white;">
                    <i data-lucide="play" style="width: 11px; height: 11px;"></i> Navigate
                  </button>
                  <button class="btn btn-ghost btn-sm" onclick="CampusMapView.clearRoute()" style="font-size: 0.72rem; padding: 2px 6px;">
                    <i data-lucide="x" style="width: 12px; height: 12px;"></i> Close
                  </button>
                </div>
              </div>

              <!-- Route Metric Highlights -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.85rem;">
                <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: var(--radius-sm); padding: 0.5rem 0.75rem; text-align: center;">
                  <span style="font-size: 0.7rem; color: var(--text-muted); display: block;">Total Distance</span>
                  <strong id="route-metric-distance" style="font-size: 1.1rem; color: #818cf8;">-- m</strong>
                </div>
                <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: var(--radius-sm); padding: 0.5rem 0.75rem; text-align: center;">
                  <span style="font-size: 0.7rem; color: var(--text-muted); display: block;">Est. Walk Time</span>
                  <strong id="route-metric-time" style="font-size: 1.1rem; color: #10b981;">-- mins</strong>
                </div>
              </div>

              <!-- Steps List -->
              <div id="route-steps-scroll" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem; padding-right: 4px;">
                <!-- Populated on calculation -->
              </div>
            </div>

            <!-- Locations Quick Directory (Default View) -->
            <div id="locations-directory-panel" style="display: flex; flex-direction: column; height: 100%;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
                <h3 style="font-size: 0.95rem; font-weight: 700; margin: 0; color: var(--text-main);">Campus Venues</h3>
                <span id="loc-count-badge" class="badge badge-primary" style="font-size: 0.7rem;">16 Venues</span>
              </div>

              <div id="locations-list-scroll" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 0.6rem; padding-right: 4px;">
                <!-- Populated dynamically -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  initMap: async function() {
    const mapEl = document.getElementById('leaflet-campus-map');
    if (!mapEl || typeof L === 'undefined') return;

    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }

    // Campus center coordinates
    const campusCenter = [12.9725, 79.1592];
    this.mapInstance = L.map('leaflet-campus-map').setView(campusCenter, 16);

    // Legitimate OpenStreetMap basemap tiles with correct attribution (no API KEY REQUIRED watermark!)
    let tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    let attribution = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

    try {
      const cfgRes = await fetch('/api/campus/config').catch(() => null);
      if (cfgRes && cfgRes.ok) {
        const cfg = await cfgRes.json();
        if (cfg.data?.tileUrl) tileUrl = cfg.data.tileUrl;
        if (cfg.data?.attribution) attribution = cfg.data.attribution;
      }
    } catch (e) {
      // Graceful fallback to default OpenStreetMap tiles
    }

    L.tileLayer(tileUrl, {
      attribution: attribution,
      maxZoom: 19
    }).addTo(this.mapInstance);

    const locations = await Store.getCampusLocations();
    this.locationsCache = locations || [];

    this.populateDropdowns(this.locationsCache);
    this.renderMarkersAndList(this.locationsCache);

    // Check URL parameters / deep links (e.g. ?dest=loc-lib-01 or ?from=...&to=...&nav=start)
    this.checkDeepLinks();

    if (window.lucide) lucide.createIcons();
  },

  populateDropdowns: function(locations) {
    const srcSelect = document.getElementById('route-source-select');
    const destSelect = document.getElementById('route-dest-select');

    if (!srcSelect || !destSelect) return;

    srcSelect.innerHTML = '';
    destSelect.innerHTML = '';

    locations.forEach(loc => {
      const opt1 = document.createElement('option');
      opt1.value = loc.id;
      opt1.textContent = `${loc.name} (${loc.building})`;
      if (loc.id === 'loc-gate-01') opt1.selected = true;
      srcSelect.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = loc.id;
      opt2.textContent = `${loc.name} (${loc.building})`;
      if (loc.id === 'loc-lab3-01') opt2.selected = true;
      destSelect.appendChild(opt2);
    });
  },

  renderMarkersAndList: function(locations) {
    if (!this.mapInstance) return;

    // Clear existing venue markers
    this.markers.forEach(m => this.mapInstance.removeLayer(m));
    this.markers = [];

    const listContainer = document.getElementById('locations-list-scroll');
    if (listContainer) listContainer.innerHTML = '';

    const countBadge = document.getElementById('loc-count-badge');
    if (countBadge) countBadge.innerText = `${locations.length} Venues`;

    locations.forEach(loc => {
      const lat = loc.coordinates?.lat || 12.9722;
      const lng = loc.coordinates?.lng || 79.1592;

      const marker = L.marker([lat, lng]).addTo(this.mapInstance);
      const popupContent = `
        <div style="font-family: 'Inter', sans-serif; padding: 4px; max-width: 250px; color: #111827;">
          <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #4338ca;">${loc.name}</h4>
          <div style="font-size: 11px; margin-bottom: 3px;"><strong>Building:</strong> ${loc.building} (${loc.floor})</div>
          <div style="font-size: 11px; margin-bottom: 3px; color: #4b5563;"><strong>Hours:</strong> ${loc.operatingHours}</div>
          <p style="font-size: 11px; margin: 4px 0; line-height: 1.35; color: #374151;">${loc.description}</p>
          <div style="margin-top: 8px; display: flex; gap: 4px;">
            <button class="btn btn-primary btn-sm" style="font-size: 10px; padding: 2px 8px;" onclick="CampusMapView.navigateHere('${loc.id}')">
              Navigate Here
            </button>
          </div>
        </div>
      `;
      marker.bindPopup(popupContent);
      this.markers.push(marker);

      // Directory List Item
      if (listContainer) {
        const item = document.createElement('div');
        item.style.padding = '0.65rem 0.75rem';
        item.style.background = 'var(--surface)';
        item.style.border = '1px solid var(--border-color)';
        item.style.borderRadius = 'var(--radius-sm)';
        item.style.cursor = 'pointer';
        item.style.transition = 'all 0.2s';
        item.onmouseenter = () => { item.style.borderColor = 'var(--primary-400)'; };
        item.onmouseleave = () => { item.style.borderColor = 'var(--border-color)'; };

        item.onclick = () => {
          this.mapInstance.setView([lat, lng], 18, { animate: true });
          marker.openPopup();
        };

        item.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.15rem;">
            <strong style="font-size: 0.82rem; color: var(--text-main); line-height: 1.25;">${loc.name}</strong>
            <span class="badge badge-primary" style="font-size: 0.65rem; padding: 1px 6px;">${loc.category}</span>
          </div>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 0.25rem;">
            ${loc.building}, ${loc.floor}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.68rem; color: var(--status-success);">${(loc.operatingHours || '').split('|')[0]}</span>
            <button class="btn btn-ghost btn-sm" style="font-size: 0.7rem; padding: 1px 6px; color: #818cf8;" onclick="event.stopPropagation(); CampusMapView.navigateHere('${loc.id}')">
              Route →
            </button>
          </div>
        `;
        listContainer.appendChild(item);
      }
    });
  },

  calculateRoute: async function() {
    const srcSelect = document.getElementById('route-source-select');
    const destSelect = document.getElementById('route-dest-select');
    const accessChk = document.getElementById('route-accessible-chk');

    const fromId = srcSelect ? srcSelect.value : null;
    const toId = destSelect ? destSelect.value : null;
    const accessible = accessChk ? accessChk.checked : false;

    if (!fromId || !toId || fromId === toId) return;

    const routeData = await Store.getCampusDirections(fromId, toId, accessible);
    if (!routeData) {
      console.warn('No route returned for:', fromId, toId);
      return;
    }

    this.currentRoute = routeData;
    this.drawRouteOnMap(routeData);
    this.renderRouteDirections(routeData);
  },

  drawRouteOnMap: function(routeData) {
    if (!this.mapInstance || !routeData || !routeData.coordinates) return;

    // Clear previous polyline and custom endpoint markers
    if (this.activePolyline) {
      this.mapInstance.removeLayer(this.activePolyline);
      this.activePolyline = null;
    }
    if (this.startMarker) {
      this.mapInstance.removeLayer(this.startMarker);
      this.startMarker = null;
    }
    if (this.endMarker) {
      this.mapInstance.removeLayer(this.endMarker);
      this.endMarker = null;
    }

    const latlngs = routeData.coordinates;

    // Glowing vibrant route line
    this.activePolyline = L.polyline(latlngs, {
      color: '#4f46e5',
      weight: 6,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(this.mapInstance);

    // Fit map bounds to show entire route with padding
    this.mapInstance.fitBounds(this.activePolyline.getBounds(), { padding: [60, 60], animate: true });
  },

  renderRouteDirections: function(routeData) {
    const dirPanel = document.getElementById('route-directions-panel');
    const locPanel = document.getElementById('locations-directory-panel');
    const distEl = document.getElementById('route-metric-distance');
    const timeEl = document.getElementById('route-metric-time');
    const stepsScroll = document.getElementById('route-steps-scroll');
    const badgeEl = document.getElementById('route-type-badge');

    if (!dirPanel || !locPanel) return;

    // Switch right pane to Directions view
    dirPanel.style.display = 'flex';
    locPanel.style.display = 'none';

    if (distEl) distEl.innerText = `${routeData.distanceMeters} m`;
    if (timeEl) timeEl.innerText = `~${routeData.walkingTimeMinutes} mins`;
    if (badgeEl) badgeEl.innerText = routeData.accessible ? 'Accessible Dijkstra Route' : 'Standard Dijkstra Route';

    if (stepsScroll && routeData.directions) {
      stepsScroll.innerHTML = '';
      routeData.directions.forEach((step, idx) => {
        const stepCard = document.createElement('div');
        stepCard.style.padding = '0.55rem 0.75rem';
        stepCard.style.background = 'var(--surface)';
        stepCard.style.border = '1px solid var(--border-color)';
        stepCard.style.borderRadius = 'var(--radius-sm)';
        stepCard.style.fontSize = '0.78rem';
        stepCard.style.lineHeight = '1.4';
        stepCard.style.color = 'var(--text-main)';
        stepCard.innerHTML = `
          <div style="display: flex; gap: 0.4rem; align-items: flex-start;">
            <span style="background: rgba(99, 102, 241, 0.2); color: #818cf8; font-weight: 700; border-radius: 50%; width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.68rem; flex-shrink: 0; margin-top: 1px;">
              ${idx + 1}
            </span>
            <span>${step.replace(/^\d+\.\s*/, '')}</span>
          </div>
        `;
        stepsScroll.appendChild(stepCard);
      });
    }

    if (window.lucide) lucide.createIcons();
  },

  clearRoute: function() {
    this.stopLiveNavigation();

    if (this.activePolyline && this.mapInstance) {
      this.mapInstance.removeLayer(this.activePolyline);
      this.activePolyline = null;
    }

    const dirPanel = document.getElementById('route-directions-panel');
    const locPanel = document.getElementById('locations-directory-panel');

    if (dirPanel && locPanel) {
      dirPanel.style.display = 'none';
      locPanel.style.display = 'flex';
    }

    if (this.mapInstance) {
      this.mapInstance.setView([12.9725, 79.1592], 16, { animate: true });
    }
  },

  swapEndpoints: function() {
    const srcSelect = document.getElementById('route-source-select');
    const destSelect = document.getElementById('route-dest-select');

    if (srcSelect && destSelect) {
      const temp = srcSelect.value;
      srcSelect.value = destSelect.value;
      destSelect.value = temp;
      this.calculateRoute();
    }
  },

  navigateHere: function(destId) {
    const destSelect = document.getElementById('route-dest-select');
    const srcSelect = document.getElementById('route-source-select');

    if (destSelect) destSelect.value = destId;
    if (srcSelect && srcSelect.value === destId) {
      srcSelect.value = 'loc-gate-01'; // Default origin to Main Gate
    }

    this.calculateRoute();
  },

  useMyLocation: function() {
    if (!navigator.geolocation) {
      if (typeof UI !== 'undefined' && UI.showNotification) {
        UI.showNotification('Geolocation is not supported by your browser.', 'warning');
      } else {
        alert('Geolocation is not supported by your browser.');
      }
      return;
    }

    const btn = document.getElementById('btn-use-my-location');
    if (btn) btn.innerHTML = '<span class="spinner" style="width:10px;height:10px;border-width:2px;display:inline-block;"></span> Acquiring GPS...';

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (btn) btn.innerHTML = '<i data-lucide="crosshair" style="width: 11px; height: 11px;"></i> Use My Current Location';
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;

        // Add or update glowing blue user location marker
        if (this.userLocationMarker && this.mapInstance) {
          this.mapInstance.removeLayer(this.userLocationMarker);
        }

        const userCircle = L.circleMarker([userLat, userLng], {
          radius: 8,
          fillColor: '#3b82f6',
          color: '#ffffff',
          weight: 3,
          opacity: 1,
          fillOpacity: 0.95
        });

        if (this.mapInstance) {
          this.userLocationMarker = userCircle.addTo(this.mapInstance);
          this.userLocationMarker.bindPopup('<strong>Current Browser Location</strong><br>GPS Coordinates Acquired').openPopup();
          this.mapInstance.setView([userLat, userLng], 17, { animate: true });
        }

        // Find nearest campus venue
        const locations = this.locationsCache.length > 0 ? this.locationsCache : [];
        if (locations.length === 0) return;

        let nearest = locations[0];
        let minDistance = Infinity;

        locations.forEach(loc => {
          const lat = loc.coordinates?.lat || 12.9722;
          const lng = loc.coordinates?.lng || 79.1592;
          const d = Math.hypot(lat - userLat, lng - userLng);
          if (d < minDistance) {
            minDistance = d;
            nearest = loc;
          }
        });

        const srcSelect = document.getElementById('route-source-select');
        if (srcSelect) {
          srcSelect.value = nearest.id;
        }

        if (typeof UI !== 'undefined' && UI.showNotification) {
          UI.showNotification(`GPS Acquired: Nearest campus venue is ${nearest.name}.`, 'success');
        }

        this.calculateRoute();
        if (window.lucide) lucide.createIcons();
      },
      (err) => {
        if (btn) btn.innerHTML = '<i data-lucide="crosshair" style="width: 11px; height: 11px;"></i> Use My Current Location';
        console.warn('Geolocation notice:', err.message);
        if (typeof UI !== 'undefined' && UI.showNotification) {
          UI.showNotification('Location access permission was not granted. Please select your origin manually.', 'info');
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  },

  startLiveNavigation: function() {
    if (!this.currentRoute) {
      this.calculateRoute();
    }

    const route = this.currentRoute;
    if (!route) return;

    this.isNavigating = true;
    const hud = document.getElementById('live-navigation-hud');
    const hudDest = document.getElementById('hud-destination');
    const hudNext = document.getElementById('hud-next-turn');
    const hudDist = document.getElementById('hud-remaining-distance');
    const hudTime = document.getElementById('hud-remaining-time');

    if (hud) {
      hud.style.display = 'block';
      if (hudDest) hudDest.innerText = `Navigating to ${route.destination?.name || 'Destination'}`;
      if (hudNext && route.directions && route.directions[0]) {
        hudNext.innerText = `Next: ${route.directions[0].replace(/^\d+\.\s*/, '')}`;
      }
      if (hudDist) hudDist.innerText = `${route.distanceMeters} m`;
      if (hudTime) hudTime.innerText = `~${route.walkingTimeMinutes} min walk`;
    }

    // Start tracking user location if available
    if (navigator.geolocation && !this.watchId) {
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          if (this.userLocationMarker && this.mapInstance) {
            this.userLocationMarker.setLatLng([lat, lng]);
          } else if (this.mapInstance) {
            this.userLocationMarker = L.circleMarker([lat, lng], {
              radius: 8,
              fillColor: '#3b82f6',
              color: '#ffffff',
              weight: 3,
              opacity: 1,
              fillOpacity: 0.95
            }).addTo(this.mapInstance);
          }
        },
        (err) => console.warn('Navigation watch notice:', err.message),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
      );
    }

    if (typeof UI !== 'undefined' && UI.showNotification) {
      UI.showNotification(`Live Turn-by-Turn Navigation started to ${route.destination?.name}.`, 'info');
    }
  },

  stopLiveNavigation: function() {
    this.isNavigating = false;
    const hud = document.getElementById('live-navigation-hud');
    if (hud) hud.style.display = 'none';

    if (this.watchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  },

  filterCategory: async function(category, btn) {
    document.querySelectorAll('.map-cat-btn').forEach(b => {
      b.classList.remove('btn-primary', 'active');
      b.classList.add('btn-secondary');
    });
    if (btn) {
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-primary', 'active');
    }

    this.selectedCategory = category;
    const all = this.locationsCache.length > 0 ? this.locationsCache : await Store.getCampusLocations();
    const filtered = category === 'all'
      ? all
      : all.filter(l => (l.category || '').toLowerCase().includes(category.toLowerCase()));

    this.renderMarkersAndList(filtered);
  },

  handleSearch: async function(query) {
    const all = this.locationsCache.length > 0 ? this.locationsCache : await Store.getCampusLocations();
    if (!query) {
      this.renderMarkersAndList(all);
      return;
    }
    const q = query.toLowerCase();
    const filtered = all.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.building.toLowerCase().includes(q) ||
      l.category.toLowerCase().includes(q) ||
      (l.services || []).some(s => s.toLowerCase().includes(q))
    );
    this.renderMarkersAndList(filtered);
  },

  checkDeepLinks: function() {
    try {
      const hash = window.location.hash || '';
      const queryIdx = hash.indexOf('?');
      if (queryIdx === -1) return;

      const queryString = hash.substring(queryIdx + 1);
      const params = new URLSearchParams(queryString);

      const dest = params.get('dest');
      const from = params.get('from') || 'loc-gate-01';
      const shouldStartNav = params.get('nav') === 'start';

      if (dest) {
        const destSelect = document.getElementById('route-dest-select');
        const srcSelect = document.getElementById('route-source-select');

        if (destSelect) destSelect.value = dest;
        if (srcSelect) srcSelect.value = from;

        setTimeout(async () => {
          await this.calculateRoute();
          if (shouldStartNav) {
            this.startLiveNavigation();
          }
        }, 250);
      }
    } catch (e) {
      console.warn('Deep link parse notice:', e.message);
    }
  }
};
