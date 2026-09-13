const express = require("express");
const router = express.Router();
const campusLocationsTool = require("../services/tools/campusLocationsTool");

// GET /api/campus/locations - Get all locations or search
router.get("/locations", (req, res) => {
  const { query, category } = req.query;
  let locations = campusLocationsTool.getAllLocations();

  if (query) {
    locations = campusLocationsTool.searchLocations(query);
  }

  if (category && category !== "all") {
    locations = locations.filter(l => l.category.toLowerCase() === category.toLowerCase());
  }

  res.json({
    success: true,
    count: locations.length,
    data: locations
  });
});

// GET /api/campus/locations/:id - Get specific location
router.get("/locations/:id", (req, res) => {
  const loc = campusLocationsTool.getLocationById(req.params.id);
  if (!loc) {
    return res.status(404).json({ success: false, error: "Campus location not found." });
  }
  res.json({ success: true, data: loc });
});

// GET /api/campus/config - Map provider configuration
router.get("/config", (req, res) => {
  res.json({
    success: true,
    data: {
      tileUrl: process.env.MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: process.env.MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
      campusCenter: [12.9725, 79.1592],
      isDemoMap: true,
      venueCount: campusLocationsTool.getAllLocations().length,
      routingProvider: process.env.ROUTING_PROVIDER || "dijkstra-internal"
    }
  });
});

// GET /api/campus/directions - Calculate shortest route between campus locations
router.get("/directions", (req, res) => {
  let { from, to, accessible } = req.query;

  // Default from is Main Gate
  if (!from) from = "loc-gate-01";
  if (!to) {
    return res.status(400).json({ success: false, error: "A destination 'to' parameter is required." });
  }

  // If query names were passed instead of IDs, resolve them
  const srcNode = campusLocationsTool.getLocationById(from) || campusLocationsTool.resolveLocation(from);
  const destNode = campusLocationsTool.getLocationById(to) || campusLocationsTool.resolveLocation(to);

  if (!srcNode) {
    return res.status(404).json({ success: false, error: `Could not find source location '${from}'.` });
  }
  if (!destNode) {
    return res.status(404).json({ success: false, error: `Could not find destination location '${to}'.` });
  }

  const isAccessible = accessible === "true" || accessible === true || accessible === "1";
  const route = campusLocationsTool.getDirections(srcNode.id, destNode.id, { accessible: isAccessible });
  if (!route) {
    return res.status(404).json({
      success: false,
      error: `No viable walkway path found from ${srcNode.name} to ${destNode.name}.`
    });
  }

  res.json({
    success: true,
    data: route
  });
});

module.exports = router;
