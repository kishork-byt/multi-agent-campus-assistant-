/**
 * Campus Graph & Dijkstra Routing Engine for CampusNova
 * Provides graph-based pathfinding, distances, walking times,
 * and step-by-step navigation instructions across campus locations.
 */

const CAMPUS_LOCATIONS = [
  {
    id: "loc-gate-01",
    name: "Main Gate",
    category: "Transport",
    building: "Main Campus Entrance",
    floor: "Ground Level",
    coordinates: { lat: 12.9700, lng: 79.1588 },
    description: "Main campus entrance gate with security checkpoint, visitor registration, and shuttle drop-off.",
    operatingHours: "Open 24/7",
    services: ["Visitor Pass", "Campus Security", "Shuttle Stop", "Auto/Cab Pickup"]
  },
  {
    id: "loc-prk-01",
    name: "Parking & Transit Depot",
    category: "Transport",
    building: "Central Parking Bay 1 & 2",
    floor: "Surface Level",
    coordinates: { lat: 12.9704, lng: 79.1585 },
    description: "Designated two-wheeler and four-wheeler parking with EV charging points and university bus terminal.",
    operatingHours: "6:00 AM - 10:00 PM",
    services: ["Student Parking", "Staff Parking", "EV Charging", "Bus Bay"]
  },
  {
    id: "loc-spt-01",
    name: "Sports Ground & Indoor Arena",
    category: "Health",
    building: "Campus Sports Complex",
    floor: "Ground & 1st Floor",
    coordinates: { lat: 12.9705, lng: 79.1570 },
    description: "Multipurpose sports grounds, 400m track, football field, and indoor badminton/gymnasium.",
    operatingHours: "6:00 AM - 8:30 PM",
    services: ["Athletic Track", "Gymnasium", "Badminton Courts", "Sports Equipment"]
  },
  {
    id: "loc-caf-01",
    name: "Cafeteria & Food Court",
    category: "Food",
    building: "Campus Student Center",
    floor: "Ground & Mezzanine",
    coordinates: { lat: 12.9712, lng: 79.1595 },
    description: "Central multicuisine food court with hot meals, quick snacks, coffee bar, and bakery counter.",
    operatingHours: "7:00 AM - 10:30 PM",
    services: ["Daily Meals", "Snack Counters", "Coffee Bar", "Indoor & Outdoor Dining"]
  },
  {
    id: "loc-med-01",
    name: "Medical Center & Clinic",
    category: "Health",
    building: "Block H Healthcare",
    floor: "Ground Floor",
    coordinates: { lat: 12.9718, lng: 79.1565 },
    description: "Full emergency clinic with resident doctors, 24/7 ambulance, observation beds, and pharmacy.",
    operatingHours: "24/7 Emergency | Outpatient: 8:00 AM - 8:00 PM",
    services: ["24/7 Emergency Care", "First Aid", "Ambulance", "Subsidized Pharmacy"]
  },
  {
    id: "loc-lib-01",
    name: "Central University Library",
    category: "Library",
    building: "Academic Block C",
    floor: "Floors 1 - 3",
    coordinates: { lat: 12.9716, lng: 79.1585 },
    description: "3-tier centralized library with 150,000+ volumes, digital e-library, quiet reading halls, and study pods.",
    operatingHours: "Monday - Saturday: 8:00 AM - 10:00 PM | Sunday: 9:00 AM - 5:00 PM",
    services: ["Book Issue & Return", "Digital Research Lab", "Thesis Archive", "Study Halls"]
  },
  {
    id: "loc-stu-01",
    name: "Student Services & Activity Center",
    category: "Administration",
    building: "Student Activity Center (SAC)",
    floor: "Ground Floor",
    coordinates: { lat: 12.9719, lng: 79.1592 },
    description: "Student helpdesk for bonafide certificates, ID card replacement, travel concessions, and clubs.",
    operatingHours: "Monday - Friday: 9:30 AM - 4:30 PM",
    services: ["Bonafide Certificates", "ID Card Desk", "Club Desks", "Grievance Help"]
  },
  {
    id: "loc-adm-01",
    name: "Administration Block",
    category: "Administration",
    building: "Dr. A.P.J. Abdul Kalam Administrative Block",
    floor: "Ground & 1st Floor",
    coordinates: { lat: 12.9722, lng: 79.1578 },
    description: "Central administrative headquarters housing the Registrar, Admissions Directorate, and Controller of Examinations.",
    operatingHours: "Monday - Friday: 9:00 AM - 5:00 PM",
    services: ["Registrar Office", "Student Admissions", "Fee Payments", "Examination Cell"]
  },
  {
    id: "loc-aud-01",
    name: "Main Auditorium",
    category: "Events",
    building: "Central Auditorium Hall",
    floor: "Ground Floor",
    coordinates: { lat: 12.9723, lng: 79.1582 },
    description: "1,500-seat grand auditorium for convocation ceremonies, keynote guest lectures, and cultural fests.",
    operatingHours: "Event Days: 8:00 AM - 9:00 PM",
    services: ["Keynote Presentations", "Conferences", "Cultural Events", "Seminar Hall"]
  },
  {
    id: "loc-acad-01",
    name: "Academic Block",
    category: "Academic",
    building: "Academic Block A & B",
    floor: "Floors 1 - 4",
    coordinates: { lat: 12.9725, lng: 79.1590 },
    description: "Primary classroom building with smart lecture halls, seminar halls, and department administrative offices.",
    operatingHours: "Monday - Saturday: 8:00 AM - 6:30 PM",
    services: ["Smart Classrooms", "Lecture Theatres", "Department Offices", "Notice Boards"]
  },
  {
    id: "loc-fac-01",
    name: "Faculty Block",
    category: "Academic",
    building: "Faculty Block",
    floor: "Floors 1 - 4",
    coordinates: { lat: 12.9726, lng: 79.1598 },
    description: "Faculty chambers, department HOD suites, research scholar cubicles, and meeting conference rooms.",
    operatingHours: "Monday - Friday: 8:30 AM - 5:30 PM",
    services: ["Faculty Cabins", "HOD Secretariat", "Office Hours Meeting", "Research Rooms"]
  },
  {
    id: "loc-clab-01",
    name: "Computer Lab",
    category: "Labs",
    building: "Alan Turing Technology Tower",
    floor: "Floor 2, Rooms 201-208",
    coordinates: { lat: 12.9729, lng: 79.1600 },
    description: "Undergraduate computing labs equipped with modern Linux/Windows workstations, high-speed campus LAN.",
    operatingHours: "Monday - Friday: 8:30 AM - 6:00 PM",
    services: ["Programming Practicals", "Database Labs", "High-speed Internet", "Printing"]
  },
  {
    id: "loc-lab3-01",
    name: "Lab 3",
    category: "Labs",
    building: "Alan Turing Technology Tower",
    floor: "3rd Floor, Room 303",
    coordinates: { lat: 12.9731, lng: 79.1602 },
    description: "Advanced AI & Deep Learning Laboratory with GPU acceleration, projectors, and server racks.",
    operatingHours: "Monday - Friday: 8:30 AM - 7:00 PM",
    services: ["AI/ML Computing", "GPU Clusters", "Multimedia Projectors", "Hardware IoT Kits"]
  },
  {
    id: "loc-inn-01",
    name: "Innovation Hub",
    category: "Academic",
    building: "Innovation & Incubation Tower",
    floor: "Floors 1 - 3",
    coordinates: { lat: 12.9735, lng: 79.1590 },
    description: "Student startup incubator, hackathon arena, maker space, 3D printers, and industry collaborative spaces.",
    operatingHours: "Open Daily: 8:00 AM - 9:00 PM",
    services: ["Hackathon Arena", "Startup Incubation", "Maker Space & 3D Lab", "Project Mentorship"]
  },
  {
    id: "loc-hst-01",
    name: "Hostel (Boys - Aryabhata)",
    category: "Hostel",
    building: "Campus North Residential Enclave",
    floor: "Blocks A, B, C (G+4)",
    coordinates: { lat: 12.9745, lng: 79.1580 },
    description: "Male student residential complex with Wi-Fi, study halls, mess dining, and recreation courts.",
    operatingHours: "24/7 Security | Night Curfew: 9:00 PM",
    services: ["Student Accommodation", "Mess Dining", "Study Rooms", "Warden Desk"]
  },
  {
    id: "loc-hst-02",
    name: "Hostel (Girls - Kalpana Chawla)",
    category: "Hostel",
    building: "Campus East Residential Enclave",
    floor: "Blocks 1, 2, 3 (G+5)",
    coordinates: { lat: 12.9725, lng: 79.1630 },
    description: "Secure female student residence with biometric security, in-house gymnasium, and recreation facilities.",
    operatingHours: "24/7 Biometric Security | Night Curfew: 8:30 PM",
    services: ["Student Accommodation", "Biometric Access", "Gymnasium", "Warden Desk"],
    accessible: true
  },
  {
    id: "loc-sec-01",
    name: "Security Gate & Verification Post",
    category: "Transport",
    building: "North Perimeter Post",
    floor: "Ground Level",
    coordinates: { lat: 12.9748, lng: 79.1575 },
    description: "North perimeter security checkpoint, visitor badge verification, and 24/7 campus patrol post.",
    operatingHours: "Open 24/7",
    services: ["Visitor Passes", "Vehicle Inspection", "Lost & Found Post", "Emergency Call Point"],
    accessible: true
  }
];

// Campus Graph Edges (undirected)
const EDGES = [
  { from: "loc-gate-01", to: "loc-prk-01", dist: 50, dirFrom: "Turn left towards Parking & Transit Depot", dirTo: "Walk straight to Main Gate entrance", accessible: true },
  { from: "loc-gate-01", to: "loc-adm-01", dist: 250, dirFrom: "Walk straight north along the Main Avenue towards Administration Block", dirTo: "Walk south along the Main Avenue towards Main Gate", accessible: true },
  { from: "loc-prk-01", to: "loc-spt-01", dist: 160, dirFrom: "Head west towards the Sports Complex and ground", dirTo: "Head east back towards the Parking & Transit Depot", accessible: true },
  { from: "loc-gate-01", to: "loc-caf-01", dist: 150, dirFrom: "Head northeast past the transit plaza towards the Cafeteria", dirTo: "Head southwest towards Main Gate", accessible: true },
  { from: "loc-caf-01", to: "loc-stu-01", dist: 90, dirFrom: "Walk north across the plaza to Student Services Center", dirTo: "Walk south across the plaza to Cafeteria", accessible: true },
  { from: "loc-adm-01", to: "loc-lib-01", dist: 100, dirFrom: "Walk east along the central corridor into Central Library Complex", dirTo: "Walk west along the central corridor to Administration Block", accessible: true },
  { from: "loc-adm-01", to: "loc-aud-01", dist: 70, dirFrom: "Take the east walkway towards the Main Auditorium", dirTo: "Walk west towards Administration Block", accessible: true },
  { from: "loc-adm-01", to: "loc-med-01", dist: 150, dirFrom: "Head southwest along the perimeter path to the Medical Center", dirTo: "Head northeast along the path to Administration Block", accessible: true },
  { from: "loc-lib-01", to: "loc-acad-01", dist: 110, dirFrom: "Head north from the library entrance into the Academic Block courtyard", dirTo: "Head south into Central Library Complex", accessible: true },
  { from: "loc-aud-01", to: "loc-acad-01", dist: 80, dirFrom: "Walk northeast across the central quad to Academic Block", dirTo: "Walk southwest across the central quad to Main Auditorium", accessible: true },
  { from: "loc-stu-01", to: "loc-acad-01", dist: 85, dirFrom: "Walk northwest from SAC towards Academic Block", dirTo: "Walk southeast towards Student Services & SAC", accessible: true },
  { from: "loc-acad-01", to: "loc-fac-01", dist: 80, dirFrom: "Follow the covered walkway east to Faculty Block", dirTo: "Follow the covered walkway west to Academic Block", accessible: true },
  { from: "loc-acad-01", to: "loc-clab-01", dist: 110, dirFrom: "Take the north promenade into Alan Turing Technology Tower (Computer Lab)", dirTo: "Walk south out of Technology Tower to Academic Block", accessible: true },
  { from: "loc-clab-01", to: "loc-lab3-01", dist: 30, dirFrom: "Take the elevator/ramp to 3rd Floor, Room 303 (Lab 3)", dirTo: "Take elevator/ramp down to 2nd Floor (Computer Lab)", accessible: true, hasElevator: true },
  { from: "loc-acad-01", to: "loc-inn-01", dist: 120, dirFrom: "Walk north past the fountain towards the Innovation Hub", dirTo: "Walk south past the fountain towards Academic Block", accessible: true },
  { from: "loc-clab-01", to: "loc-inn-01", dist: 100, dirFrom: "Head northwest on the technology concourse to the Innovation Hub", dirTo: "Head southeast on the concourse to Computer Lab", accessible: true },
  { from: "loc-inn-01", to: "loc-hst-01", dist: 150, dirFrom: "Head northwest along the residential pathway to Aryabhata Boys Hostel", dirTo: "Head southeast along the pathway to Innovation Hub", accessible: true },
  { from: "loc-fac-01", to: "loc-hst-02", dist: 320, dirFrom: "Head east along the perimeter ring road towards Kalpana Chawla Girls Hostel", dirTo: "Head west along the ring road back to Faculty Block", accessible: true },
  { from: "loc-lib-01", to: "loc-caf-01", dist: 110, dirFrom: "Head southeast down the garden steps towards the Cafeteria", dirTo: "Head northwest up the steps towards Central Library", accessible: false, hasStairs: true },
  { from: "loc-hst-01", to: "loc-sec-01", dist: 60, dirFrom: "Walk north to Security Gate & Verification Post", dirTo: "Walk south into Aryabhata Boys Hostel courtyard", accessible: true },
  { from: "loc-spt-01", to: "loc-sec-01", dist: 280, dirFrom: "Follow the north perimeter path to Security Gate", dirTo: "Follow the south perimeter path to Sports Complex", accessible: true }
];

// Build Adjacency Map
const adjacency = new Map();
CAMPUS_LOCATIONS.forEach(loc => adjacency.set(loc.id, []));

EDGES.forEach(edge => {
  if (adjacency.has(edge.from) && adjacency.has(edge.to)) {
    adjacency.get(edge.from).push({
      neighbor: edge.to,
      dist: edge.dist,
      instruction: edge.dirFrom,
      accessible: edge.accessible !== false,
      hasStairs: !!edge.hasStairs
    });
    adjacency.get(edge.to).push({
      neighbor: edge.from,
      dist: edge.dist,
      instruction: edge.dirTo,
      accessible: edge.accessible !== false,
      hasStairs: !!edge.hasStairs
    });
  }
});

/**
 * Dijkstra Shortest Path Algorithm with Accessibility Support
 */
function findShortestRoute(sourceId, destinationId, options = {}) {
  const src = (sourceId || "").trim();
  const dest = (destinationId || "").trim();
  const isAccessibleOnly = options === true || (typeof options === "object" && (options.accessible === true || options.accessible === "true"));

  if (!adjacency.has(src) || !adjacency.has(dest)) {
    return null;
  }

  if (src === dest) {
    const loc = CAMPUS_LOCATIONS.find(l => l.id === src);
    return {
      source: loc,
      destination: loc,
      distanceMeters: 0,
      walkingTimeMinutes: 0,
      pathNodes: [loc],
      directions: ["You are already at " + loc.name + "."],
      coordinates: [[loc.coordinates.lat, loc.coordinates.lng]],
      accessible: true,
      accessibilityNote: "Standard walking route."
    };
  }

  const distances = new Map();
  const previous = new Map();
  const edgeUsed = new Map();
  const unvisited = new Set();

  CAMPUS_LOCATIONS.forEach(loc => {
    distances.set(loc.id, Infinity);
    unvisited.add(loc.id);
  });
  distances.set(src, 0);

  while (unvisited.size > 0) {
    // Pick node with lowest distance
    let current = null;
    let lowestDist = Infinity;
    for (const nodeId of unvisited) {
      const d = distances.get(nodeId);
      if (d < lowestDist) {
        lowestDist = d;
        current = nodeId;
      }
    }

    if (current === null || lowestDist === Infinity) break;
    if (current === dest) break;

    unvisited.delete(current);

    const neighbors = adjacency.get(current) || [];
    for (const edge of neighbors) {
      if (!unvisited.has(edge.neighbor)) continue;
      if (isAccessibleOnly && (edge.accessible === false || edge.hasStairs)) continue;
      const alt = lowestDist + edge.dist;
      if (alt < distances.get(edge.neighbor)) {
        distances.set(edge.neighbor, alt);
        previous.set(edge.neighbor, current);
        edgeUsed.set(edge.neighbor, edge.instruction);
      }
    }
  }

  if (!previous.has(dest)) {
    return null;
  }

  // Reconstruct path
  const path = [];
  const instructions = [];
  let curr = dest;

  while (curr) {
    path.unshift(curr);
    const prev = previous.get(curr);
    if (prev) {
      instructions.unshift(edgeUsed.get(curr));
    }
    curr = prev;
  }

  const pathNodes = path.map(id => CAMPUS_LOCATIONS.find(l => l.id === id));
  const totalDistance = distances.get(dest);
  // Average walking speed: ~1.2 m/s -> ~72 m/min
  const walkingMinutes = Math.max(1, Math.round(totalDistance / 70));

  const formattedDirections = instructions.map((step, idx) => {
    const toNode = pathNodes[idx + 1];
    return `${idx + 1}. ${step}. (${toNode.name} is ahead)`;
  });
  formattedDirections.push(`${formattedDirections.length + 1}. You have arrived at ${pathNodes[pathNodes.length - 1].name} (${pathNodes[pathNodes.length - 1].building}).`);

  const coordinates = pathNodes.map(n => [n.coordinates.lat, n.coordinates.lng]);

  return {
    source: pathNodes[0],
    destination: pathNodes[pathNodes.length - 1],
    distanceMeters: totalDistance,
    walkingTimeMinutes: walkingMinutes,
    pathNodes,
    directions: formattedDirections,
    coordinates,
    accessible: isAccessibleOnly ? true : !instructions.some(i => i.toLowerCase().includes("steps") || i.toLowerCase().includes("stairs")),
    accessibilityNote: isAccessibleOnly
      ? "Wheelchair accessible route: Step-free walkways and ADA ramps."
      : "Standard walking route. Wheelchair ramp access available at Academic Block and Library."
  };
}

/**
 * Resolves a natural-language query to a specific location node
 */
function resolveLocationQuery(query) {
  if (!query || typeof query !== "string") return null;
  const q = query.toLowerCase().trim();

  // Check exact ID match
  const exact = CAMPUS_LOCATIONS.find(l => l.id.toLowerCase() === q);
  if (exact) return exact;

  // Keyword mappings for common campus terminology
  if (q.includes("security gate") || q.includes("security post") || q.includes("north gate") || q.includes("patrol post")) return CAMPUS_LOCATIONS.find(l => l.id === "loc-sec-01");
  if (q.includes("gate") || q.includes("entrance")) return CAMPUS_LOCATIONS.find(l => l.id === "loc-gate-01");
  if (q.includes("lab 3") || q.includes("lab3") || q.includes("ai lab")) return CAMPUS_LOCATIONS.find(l => l.id === "loc-lab3-01");
  if (q.includes("computer lab") || q.includes("clab") || q.includes("coding lab")) return CAMPUS_LOCATIONS.find(l => l.id === "loc-clab-01");
  if (q.includes("library") || q.includes("book") || q.includes("reading room")) return CAMPUS_LOCATIONS.find(l => l.id === "loc-lib-01");
  if (q.includes("innovation") || q.includes("incubator") || q.includes("hub") || q.includes("workshop")) return CAMPUS_LOCATIONS.find(l => l.id === "loc-inn-01");
  if (q.includes("cafeteria") || q.includes("canteen") || q.includes("food") || q.includes("dining")) return CAMPUS_LOCATIONS.find(l => l.id === "loc-caf-01");
  if (q.includes("auditorium") || q.includes("audi") || q.includes("hall")) return CAMPUS_LOCATIONS.find(l => l.id === "loc-aud-01");
  if (q.includes("admin") || q.includes("directorate") || q.includes("registrar") || q.includes("exam")) return CAMPUS_LOCATIONS.find(l => l.id === "loc-adm-01");
  if (q.includes("medical") || q.includes("health") || q.includes("clinic") || q.includes("hospital") || q.includes("doctor")) return CAMPUS_LOCATIONS.find(l => l.id === "loc-med-01");
  if (q.includes("sports") || q.includes("gym") || q.includes("ground") || q.includes("arena")) return CAMPUS_LOCATIONS.find(l => l.id === "loc-spt-01");
  if (q.includes("parking") || q.includes("bus") || q.includes("depot")) return CAMPUS_LOCATIONS.find(l => l.id === "loc-prk-01");
  if (q.includes("girls hostel") || q.includes("kalpana")) return CAMPUS_LOCATIONS.find(l => l.id === "loc-hst-02");
  if (q.includes("hostel") || q.includes("boys hostel") || q.includes("aryabhata")) return CAMPUS_LOCATIONS.find(l => l.id === "loc-hst-01");
  if (q.includes("faculty") || q.includes("prof") || q.includes("staff block")) return CAMPUS_LOCATIONS.find(l => l.id === "loc-fac-01");
  if (q.includes("academic") || q.includes("class") || q.includes("classroom")) return CAMPUS_LOCATIONS.find(l => l.id === "loc-acad-01");

  // General text search
  return CAMPUS_LOCATIONS.find(l => {
    const combined = `${l.name} ${l.building} ${l.category} ${l.description} ${(l.services || []).join(" ")}`.toLowerCase();
    return combined.includes(q);
  }) || null;
}

module.exports = {
  CAMPUS_LOCATIONS,
  EDGES,
  findShortestRoute,
  resolveLocationQuery
};
