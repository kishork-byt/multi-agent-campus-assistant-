/**
 * Campus Locations Tool for CampusNova Autonomous Agent System
 * Provides precise campus venue, building, department, facility, and routing data.
 */

const { CAMPUS_LOCATIONS, findShortestRoute, resolveLocationQuery } = require("./campusGraph");

const CampusLocationsTool = {
  name: "campus_locations",
  description: "Search official campus venues, classroom blocks, hostels, library, examination cell, transport hub, and navigate routes.",

  getAllLocations: function() {
    return CAMPUS_LOCATIONS;
  },

  getLocationById: function(id) {
    if (!id) return null;
    return CAMPUS_LOCATIONS.find(loc => loc.id === id || loc.id.toLowerCase() === id.toLowerCase()) || null;
  },

  resolveLocation: function(query) {
    return resolveLocationQuery(query);
  },

  getDirections: function(sourceId, destinationId, options = {}) {
    return findShortestRoute(sourceId, destinationId, options);
  },

  searchLocations: function(query) {
    if (!query || typeof query !== "string") return CAMPUS_LOCATIONS;
    const q = query.toLowerCase().trim();
    if (!q) return CAMPUS_LOCATIONS;

    const resolvedAlias = typeof resolveLocationQuery === "function" ? resolveLocationQuery(q) : null;
    const tokens = q.split(/\s+/).filter(t => t.length >= 2);
    const scored = [];

    for (const loc of CAMPUS_LOCATIONS) {
      const nameLower = (loc.name || "").toLowerCase().trim();
      const catLower = (loc.category || "").toLowerCase().trim();
      const bldLower = (loc.building || "").toLowerCase().trim();
      const floorLower = (loc.floor || "").toLowerCase().trim();
      const descLower = (loc.description || "").toLowerCase().trim();
      const services = Array.isArray(loc.services) ? loc.services : [];
      const servicesLower = services.join(" ").toLowerCase();
      const combined = [nameLower, catLower, bldLower, floorLower, descLower, servicesLower].join(" ");

      let score = 0;

      // 1. Exact location name match
      if (nameLower === q) {
        score += 10000;
      }
      // 2. Exact phrase match in location name
      else if (nameLower.includes(q)) {
        score += 5000;
        if (nameLower.startsWith(q)) score += 1000;
      }

      // 3. Prefix match in location name
      if (nameLower.startsWith(q)) {
        score += 3000;
      }

      // Alias / Synonym match from campus ontology
      if (resolvedAlias && resolvedAlias.id === loc.id) {
        score += 4000;
      }

      // 4. Token matches in location name
      if (tokens.length > 0) {
        const tokensInName = tokens.filter(t => nameLower.includes(t));
        if (tokensInName.length === tokens.length) {
          // All tokens appear in location name
          score += 2500 + (tokens.length * 500);
          let inOrder = true;
          let lastIdx = -1;
          for (const t of tokens) {
            const idx = nameLower.indexOf(t, lastIdx + 1);
            if (idx === -1) { inOrder = false; break; }
            lastIdx = idx;
          }
          if (inOrder) score += 1500;
        } else if (tokensInName.length > 0) {
          // Partial tokens in name
          score += tokensInName.length * 400;
        }
      }

      // 5. Category match
      if (catLower === q) {
        score += 2000;
      } else if (catLower.includes(q)) {
        score += 1200;
      } else if (tokens.length > 0) {
        const tokensInCat = tokens.filter(t => catLower.includes(t));
        score += tokensInCat.length * 300;
      }

      // 6. Building / Facility / Services match
      if (bldLower === q) {
        score += 1500;
      } else if (bldLower.includes(q)) {
        score += 800;
      } else if (tokens.length > 0) {
        const tokensInBld = tokens.filter(t => bldLower.includes(t));
        score += tokensInBld.length * 200;
      }

      if (servicesLower.includes(q)) {
        score += 600;
      } else if (tokens.length > 0) {
        const tokensInServices = tokens.filter(t => servicesLower.includes(t));
        score += tokensInServices.length * 150;
      }

      // 7. Generic keyword / Description match
      if (descLower.includes(q)) {
        score += 300;
      } else if (tokens.length > 0) {
        const tokensInDesc = tokens.filter(t => descLower.includes(t));
        score += tokensInDesc.length * 50;
      }

      // Fallback if broad token match anywhere
      if (score === 0) {
        if (combined.includes(q)) {
          score += 100;
        } else if (tokens.length > 0 && tokens.every(t => combined.includes(t))) {
          score += 80;
        } else if (tokens.length > 1 && tokens.some(t => combined.includes(t))) {
          score += 40;
        }
      }

      if (score > 0) {
        scored.push({ loc, score });
      }
    }

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.loc.name.length - b.loc.name.length;
    });

    return scored.map(s => s.loc);
  },

  /**
   * Formats location results into human-readable text for AI agents
   */
  formatForAgent: function(locations) {
    if (!locations || locations.length === 0) {
      return "No specific campus locations matched the query.";
    }

    return locations.map(loc => {
      return `### ${loc.name} (${loc.category})
- **Building / Block**: ${loc.building}
- **Floor / Area**: ${loc.floor}
- **Operating Hours**: ${loc.operatingHours}
- **Key Services**: ${(loc.services || []).join(", ")}
- **Description**: ${loc.description}
- **Coordinates**: Latitude ${loc.coordinates.lat}, Longitude ${loc.coordinates.lng}`;
    }).join("\n\n");
  }
};

module.exports = CampusLocationsTool;
