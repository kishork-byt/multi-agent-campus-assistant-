/**
 * Multilingual Detection & Natural Gemini-Style Response Generator for CampusNova
 * Supports English, Tamil (Script & Tanglish), Hindi (Script & Hinglish),
 * Telugu, Kannada, Malayalam, and mixed code-switched queries.
 */

// Regex patterns for script detection
const TAMIL_SCRIPT_REGEX = /[\u0B80-\u0BFF]/;
const DEVANAGARI_SCRIPT_REGEX = /[\u0900-\u097F]/;
const TELUGU_SCRIPT_REGEX = /[\u0C00-\u0C7F]/;
const KANNADA_SCRIPT_REGEX = /[\u0C80-\u0CFF]/;
const MALAYALAM_SCRIPT_REGEX = /[\u0D00-\u0D7F]/;

// Keyword sets for romanized Indian languages
const TANGLISH_TOKENS = new Set([
  "iruka", "irukaa", "irukku", "iruku", "irukkum", "epdi", "eppadi", "poganum",
  "enga", "engae", "engayavathu", "pannunga", "pannu", "kudunga", "solunga",
  "solla", "vandhuruku", "enakku", "enaku", "unaku", "mudiyuma", "vaanga",
  "theriyuma", "neram", "velai", "aagala", "aaguthu", "nadakuthu", "panna",
  "kooduma", "seiyanum", "kitta", "pakka", "la", "ku", "oda", "odaathu", "theriyala"
]);

const HINGLISH_TOKENS = new Set([
  "kaha", "kahan", "hai", "hain", "kya", "kaise", "jaaye", "jaana", "batao",
  "bataiye", "dikhao", "kardo", "karona", "karo", "raha", "rahi", "nahi",
  "nahin", "chahiye", "chal", "kharab", "mera", "meri", "mujhe", "kitne",
  "kab", "milte", "milega", "hoga", "hogi", "bhi", "me", "mein", "se", "pe"
]);

/**
 * Detects language of incoming user query
 */
function detectLanguage(text, contextLanguage = "en") {
  if (!text || typeof text !== "string") return contextLanguage;
  const raw = text.trim();

  // 1. Script checks
  if (TAMIL_SCRIPT_REGEX.test(raw)) return "ta";
  if (DEVANAGARI_SCRIPT_REGEX.test(raw)) return "hi";
  if (TELUGU_SCRIPT_REGEX.test(raw)) return "te";
  if (KANNADA_SCRIPT_REGEX.test(raw)) return "kn";
  if (MALAYALAM_SCRIPT_REGEX.test(raw)) return "ml";

  // 2. Romanized Indian Languages
  const words = raw.toLowerCase().split(/[\s,?.!]+/).filter(w => w.length > 1);
  let tanglishScore = 0;
  let hinglishScore = 0;

  for (const w of words) {
    if (TANGLISH_TOKENS.has(w)) tanglishScore++;
    if (HINGLISH_TOKENS.has(w)) hinglishScore++;
  }

  if (tanglishScore >= 1 && tanglishScore >= hinglishScore) return "tanglish";
  if (hinglishScore >= 1) return "hinglish";

  return "en";
}

/**
 * Checks if query matches specific intent keywords across languages
 */
function matchesIntent(text, intentType) {
  const lower = (text || "").toLowerCase();

  switch (intentType) {
    case "EVENT_SEARCH":
      if (/event|events|workshop|hackathon|conference|seminar|find ai|ai workshop/i.test(lower)) return true;
      if (TAMIL_SCRIPT_REGEX.test(lower) && /நிகழ்வு|ஒர்க்‌ஷாப்|கருத்தரங்கம்|வாரம்|இருக்கா/i.test(lower)) return true;
      if (/iruka|iruku|irukku|nadakuthu|event iruka|workshop iruka/i.test(lower)) return true;
      if (DEVANAGARI_SCRIPT_REGEX.test(lower) && /कार्यक्रम|वर्कशॉप|सप्ताह|है क्या/i.test(lower)) return true;
      if (/event hai|workshop hai|kaha hai.*workshop|workshop.*kaha hai/i.test(lower)) return true;
      return false;

    case "EVENT_REGISTER":
      if (/register me|sign me up|enroll me/i.test(lower)) return true;
      if (TAMIL_SCRIPT_REGEX.test(lower) && /பதிவு செய்ய|பதிவு பண்ணு/i.test(lower)) return true;
      if (/register pannunga|register pannu|enaku register/i.test(lower)) return true;
      if (DEVANAGARI_SCRIPT_REGEX.test(lower) && /पंजीकरण|रजिस्टर/i.test(lower)) return true;
      if (/register kardo|enroll kardo|mera register/i.test(lower)) return true;
      return false;

    case "NAVIGATION_DIRECTIONS":
      if (/how do i get to|how to get to|how can i go from|take me to|take me from|directions to|route to|how to reach/i.test(lower)) return true;
      if (TAMIL_SCRIPT_REGEX.test(lower) && /எப்படி போகணும்|எப்படி செல்வது|வழி சொல்லுங்க/i.test(lower)) return true;
      if (/epdi poganum|eppadi poganum|route solunga|kaise jaye|kaise jau|rasta batao/i.test(lower)) return true;
      if (DEVANAGARI_SCRIPT_REGEX.test(lower) && /कैसे जाएं|रास्ता बताओ|पहुँचने का मार्ग/i.test(lower)) return true;
      return false;

    case "LOCATION_QUERY":
      if (/where is|location of|which building|what floor|timings of/i.test(lower)) return true;
      if (TAMIL_SCRIPT_REGEX.test(lower) && /எங்கே இருக்கு|எங்கே உள்ளது|எந்த கட்டிடம்/i.test(lower)) return true;
      if (/enga iruku|enga irukku|engae iruku/i.test(lower)) return true;
      if (DEVANAGARI_SCRIPT_REGEX.test(lower) && /कहाँ है|कहाँ स्थित है/i.test(lower)) return true;
      if (/kaha hai|kahan hai|kidhar hai/i.test(lower)) return true;
      return false;

    case "SUPPORT_ISSUE":
      if (/not working|isn't working|broken|repair|complaint|faulty|problem|issue/i.test(lower)) return true;
      if (/work aagala|vela seiyala|odala|repair aaiduchu/i.test(lower)) return true;
      if (/kaam nahi kar raha|chal nahi raha|kharab hai|tut gaya/i.test(lower)) return true;
      return false;

    case "TASK_REMINDER":
      if (/remind me|set a reminder|create task|add task|my tasks|what tasks/i.test(lower)) return true;
      if (/reminder set pannunga|remind pannunga|enakku reminder/i.test(lower)) return true;
      if (/reminder laga do|yaad dilana|task bana do/i.test(lower)) return true;
      return false;

    default:
      return false;
  }
}

/**
 * Strips multilingual noise/filler words to leave clean search keywords
 */
function cleanQueryKeyword(text) {
  let clean = (text || "").replace(/[.,?!]+$/, "").trim();

  // Strip English prefixes/suffixes
  clean = clean
    .replace(/^(?:can you\s+)?(?:please\s+)?(?:register me for|sign me up for|enroll me in|register for|register)\s+(?:the\s+)?/i, "")
    .replace(/^(?:find|search for|look for|show me|are there any|get|list|tell me about|where is|how do i get to|take me to|take me from)\s+(?:the\s+)?/i, "")
    .replace(/\s+(?:and\s+)?(?:remind me|set a reminder|send notification|yaad dila).*$/i, "")
    .replace(/\s+(?:and register me|and sign me up|and enroll me)$/i, "")
    .replace(/\s+(?:this week|today|tomorrow|next week)$/i, "")
    .replace(/[.,?!]+$/, "")
    .trim();

  // Strip Tamil & Tanglish
  clean = clean
    .replace(/^(?:இந்த வாரம்|இன்று|நாளை)\s+/i, "")
    .replace(/\s+(?:இருக்கா|எங்கே இருக்கு|எப்படி போகணும்)\??$/i, "")
    .replace(/\s+(?:iruka|iruku|irukku|epdi poganum|eppadi poganum|enga iruku|la register pannunga)\??$/i, "")
    .replace(/^(?:enakku|unaku|library ku|lab 3 ku)\s+/i, "")
    .replace(/\s+ku\s+/i, " ")
    .replace(/\s+la\s+/i, " ")
    .trim();

  // Strip Hindi & Hinglish
  clean = clean
    .replace(/^(?:kal\s+)?(?:koi\s+)?/i, "")
    .replace(/\s+(?:kaha hai|kahan hai|kaise jaye|hai kya|batao|kardo|hoga kya)\??$/i, "")
    .replace(/^(?:mujhe|mera)\s+/i, "")
    .trim();

  // Strip Telugu, Kannada, Malayalam markers
  clean = clean
    .replace(/^(?:ఈ వారం|ఈరోజు|రేపు)\s+/i, "")
    .replace(/\s+(?:ఉందా|ఎక్కడ ఉంది|ఎలా వెళ్ళాలి)\??$/i, "")
    .replace(/^(?:ಈ ವಾರ|ಇಂದು|ನಾಳೆ)\s+/i, "")
    .replace(/\s+(?:ಇದೆಯಾ|ಎಲ್ಲಿದೆ|ಹೇಗೆ ಹೋಗಬೇಕು)\??$/i, "")
    .replace(/^(?:ഈ ആഴ്ച|ഇന്ന്|നാളെ)\s+/i, "")
    .replace(/\s+(?:ഉണ്ടോ|എവിടെയാണ്|എങ്ങനെ പോകാം)\??$/i, "")
    .trim();

  return clean || text;
}

/**
 * Generates natural conversational responses in the requested language
 */
function formatResponse(templateKey, data, lang = "en") {
  switch (templateKey) {
    case "EVENT_FOUND":
      if (lang === "ta") {
        return `நான் **${data.events.length}** நிகழ்வைக் கண்டறிந்துள்ளேன்:\n\n` +
          data.events.map(e => `• **${e.title}**\n  📅 ${e.date} | 🕙 ${e.time || '10:00 AM'}\n  📍 ${e.location || e.venue || 'Innovation Hub'}`).join("\n\n") +
          `\n\nஉங்களை இதில் பதிவு செய்யவா?`;
      }
      if (lang === "tanglish") {
        return `Naan **${data.events.length}** campus event kandupidichen:\n\n` +
          data.events.map(e => `• **${e.title}**\n  📅 ${e.date} at ${e.time || '10:00 AM'}\n  📍 ${e.location || e.venue || 'Innovation Hub'}`).join("\n\n") +
          `\n\nUngalukku idhula register panna venduma?`;
      }
      if (lang === "hi") {
        return `मुझे **${data.events.length}** कैंपस कार्यक्रम मिले हैं:\n\n` +
          data.events.map(e => `• **${e.title}**\n  📅 ${e.date} | 🕙 ${e.time || '10:00 AM'}\n  📍 ${e.location || e.venue || 'Innovation Hub'}`).join("\n\n") +
          `\n\nक्या आप इसमें पंजीकरण (Register) कराना चाहते हैं?`;
      }
      if (lang === "hinglish") {
        return `Maine **${data.events.length}** campus event dhoondha hai:\n\n` +
          data.events.map(e => `• **${e.title}**\n  📅 ${e.date} at ${e.time || '10:00 AM'}\n  📍 ${e.location || e.venue || 'Innovation Hub'}`).join("\n\n") +
          `\n\nKya aap isme register hona chahte hain?`;
      }
      if (lang === "te") {
        return `నేను **${data.events.length}** క్యాంపస్ ఈవెంట్‌లను కనుగొన్నాను:\n\n` +
          data.events.map(e => `• **${e.title}**\n  📅 ${e.date} | 🕙 ${e.time || '10:00 AM'}\n  📍 ${e.location || e.venue || 'Innovation Hub'}`).join("\n\n") +
          `\n\nమీరు ఇందులో నమోదు (Register) చేసుకోవాలనుకుంటున్నారా?`;
      }
      if (lang === "kn") {
        return `ನಾನು **${data.events.length}** ಕ್ಯಾಂಪಸ್ ಕಾರ್ಯಕ್ರಮಗಳನ್ನು ಕಂಡುಕೊಂಡಿದ್ದೇನೆ:\n\n` +
          data.events.map(e => `• **${e.title}**\n  📅 ${e.date} | 🕙 ${e.time || '10:00 AM'}\n  📍 ${e.location || e.venue || 'Innovation Hub'}`).join("\n\n") +
          `\n\nನೀವು ಇದರಲ್ಲಿ ನೋಂದಾಯಿಸಲು (Register) ಬಯಸುವಿರಾ?`;
      }
      if (lang === "ml") {
        return `ഞാൻ **${data.events.length}** ക്യാമ്പസ് ഇവന്റുകൾ കണ്ടെത്തി:\n\n` +
          data.events.map(e => `• **${e.title}**\n  📅 ${e.date} | 🕙 ${e.time || '10:00 AM'}\n  📍 ${e.location || e.venue || 'Innovation Hub'}`).join("\n\n") +
          `\n\nനിങ്ങൾക്ക് ഇതിൽ രജിസ്റ്റർ ചെയ്യണമെന്നുണ്ടോ?`;
      }
      // English
      return `I found **${data.events.length} campus event${data.events.length > 1 ? 's' : ''}** matching your request:\n\n` +
        data.events.map(e => `• **${e.title}**\n  📅 ${e.date} • 🕙 ${e.time || '10:00 AM'}\n  📍 ${e.location || e.venue || 'Innovation Hub'}`).join("\n\n") +
        `\n\nWould you like me to register you?`;

    case "EVENT_CONFIRM_PROMPT":
      if (lang === "ta") {
        return `**${data.title}** நிகழ்வு **${data.date}**, **${data.time || '10:00 AM'}** மணிக்கு (${data.location || 'Innovation Hub'}) நடைபெறுகிறது.\n\nஉங்களை இதில் பதிவு செய்ய உறுதிப்படுத்தவா?`;
      }
      if (lang === "tanglish") {
        return `**${data.title}** event **${data.date}** at **${data.time || '10:00 AM'}** (${data.location || 'Innovation Hub'}) nadakuthu.\n\nUngalukku idhula register panni vidava?`;
      }
      if (lang === "hi") {
        return `**${data.title}** कार्यक्रम **${data.date}** को **${data.time || '10:00 AM'}** (${data.location || 'Innovation Hub'}) पर आयोजित होगा।\n\nक्या आप इसके लिए पंजीकरण की पुष्टि करते हैं?`;
      }
      if (lang === "hinglish") {
        return `**${data.title}** event **${data.date}** ko **${data.time || '10:00 AM'}** (${data.location || 'Innovation Hub'}) par hai.\n\nKya aap isme register confirm karna chahte hain?`;
      }
      return `I found **${data.title}** on **${data.date}** at **${data.time || '10:00 AM'}** (${data.location || 'Innovation Hub'}).\n\nWould you like me to register you?`;

    case "NAVIGATION_ROUTE":
      if (lang === "ta") {
        return `**${data.destination.name}** (${data.destination.building}) அடைவதற்கான வழி:\n\n` +
          `🚶‍♂️ **தூரம்**: ${data.distanceMeters} மீட்டர்கள் | **நடை நேரம்**: சுமார் ${data.walkingTimeMinutes} நிமிடங்கள்\n\n` +
          `**வழிமுறைகள்**:\n` +
          data.directions.map(d => `• ${d}`).join("\n") +
          `\n\nவிரிவான பார்வைக்கு கீழே உள்ள வரைபடத்தை (Map) பார்க்கவும்.`;
      }
      if (lang === "tanglish") {
        return `**${data.destination.name}**-ku (${data.destination.building}) poga route:\n\n` +
          `🚶‍♂️ **Distance**: ${data.distanceMeters} m | **Walking Time**: approx ${data.walkingTimeMinutes} mins\n\n` +
          `**Step-by-step Directions**:\n` +
          data.directions.map(d => `• ${d}`).join("\n") +
          `\n\nMap-la full route view panna keezha ulla card-ah click pannunga!`;
      }
      if (lang === "hi") {
        return `**${data.destination.name}** (${data.destination.building}) तक पहुँचने का पैदल मार्ग:\n\n` +
          `🚶‍♂️ **दूरी**: ${data.distanceMeters} मीटर | **पैदल समय**: लगभग ${data.walkingTimeMinutes} मिनट\n\n` +
          `**दिशा-निर्देश**:\n` +
          data.directions.map(d => `• ${d}`).join("\n") +
          `\n\nविस्तृत मार्ग देखने के लिए नीचे दिए गए मैप कार्ड का उपयोग करें।`;
      }
      if (lang === "hinglish") {
        return `**${data.destination.name}** (${data.destination.building}) jaane ka route:\n\n` +
          `🚶‍♂️ **Distance**: ${data.distanceMeters} m | **Walking Time**: lagbhag ${data.walkingTimeMinutes} mins\n\n` +
          `**Directions**:\n` +
          data.directions.map(d => `• ${d}`).join("\n") +
          `\n\nMap par live route dekhne ke liye neeche card par click karein!`;
      }
      if (lang === "te") {
        return `**${data.destination.name}** (${data.destination.building}) చేరుకోవడానికి కాలినడక మార్గం:\n\n` +
          `🚶‍♂️ **దూరం**: ${data.distanceMeters} మీటర్లు | **నడక సమయం**: సుమారు ${data.walkingTimeMinutes} నిమిషాలు\n\n` +
          `**దిశలు**:\n` +
          data.directions.map(d => `• ${d}`).join("\n") +
          `\n\nమరింత సమాచారం కోసం క్రింది మ్యాప్ కార్డుపై క్లిక్ చేయండి.`;
      }
      return `Here is your walking route to **${data.destination.name}** (${data.destination.building}):\n\n` +
        `🚶‍♂️ **Distance**: ${data.distanceMeters} m • **Walking Time**: ~${data.walkingTimeMinutes} mins\n\n` +
        `**Directions**:\n` +
        data.directions.map(d => `• ${d}`).join("\n") +
        `\n\nYou can click the interactive map card below to navigate directly on the campus map.`;

    case "LOCATION_INFO":
      if (lang === "ta") {
        return `**${data.name}** ஆனது **${data.building}**-ல் (${data.floor}) அமைந்துள்ளது.\n\n` +
          `• **இயங்கும் நேரம்**: ${data.operatingHours}\n` +
          `• **சேவைகள்**: ${(data.services || []).join(", ")}\n` +
          `• **விவரம்**: ${data.description}`;
      }
      if (lang === "tanglish") {
        return `**${data.name}** vandhu **${data.building}**-la (${data.floor}) irukku.\n\n` +
          `• **Operating Hours**: ${data.operatingHours}\n` +
          `• **Services**: ${(data.services || []).join(", ")}\n` +
          `• **Details**: ${data.description}`;
      }
      if (lang === "hi") {
        return `**${data.name}**, **${data.building}** (${data.floor}) में स्थित है।\n\n` +
          `• **कार्य समय**: ${data.operatingHours}\n` +
          `• **सेवाएं**: ${(data.services || []).join(", ")}\n` +
          `• **विवरण**: ${data.description}`;
      }
      if (lang === "hinglish") {
        return `**${data.name}**, **${data.building}** (${data.floor}) me hai.\n\n` +
          `• **Timings**: ${data.operatingHours}\n` +
          `• **Key Services**: ${(data.services || []).join(", ")}\n` +
          `• **Description**: ${data.description}`;
      }
      if (lang === "te") {
        return `**${data.name}**, **${data.building}** (${data.floor}) లో ఉంది.\n\n` +
          `• **పనివేళలు**: ${data.operatingHours}\n` +
          `• **సేవలు**: ${(data.services || []).join(", ")}\n` +
          `• **వివరాలు**: ${data.description}`;
      }
      return `**${data.name}** is located in **${data.building}** (${data.floor}).\n\n` +
        `• **Operating Hours**: ${data.operatingHours}\n` +
        `• **Key Services**: ${(data.services || []).join(", ")}\n` +
        `• **Description**: ${data.description}`;

    case "SUPPORT_CREATED":
      if (lang === "ta") {
        return `உங்களது வளாக உதவி கோரிக்கை **${data.issueId}** (${data.location}) வெற்றிகரமாக பதிவு செய்யப்பட்டது.\n\n• **துறை**: ${data.department}\n• **நிலை**: ${data.status}`;
      }
      if (lang === "tanglish") {
        return `Ungaloda support ticket **${data.issueId}** for ${data.location} successfully create aagiduchu.\n\n• **Department**: ${data.department}\n• **Status**: ${data.status}`;
      }
      if (lang === "hi") {
        return `आपकी सहायता शिकायत **${data.issueId}** (${data.location}) सफलतापूर्वक दर्ज कर दी गई है।\n\n• **विभाग**: ${data.department}\n• **स्थिति**: ${data.status}`;
      }
      if (lang === "hinglish") {
        return `Aapka campus support ticket **${data.issueId}** (${data.location}) successfully create ho gaya hai.\n\n• **Department**: ${data.department}\n• **Status**: ${data.status}`;
      }
      return `Support issue **${data.issueId}** has been created for the ${data.location} problem.\n\n• **Department**: ${data.department}\n• **Status**: ${data.status}`;

    default:
      return data.message || "Operation completed.";
  }
}

module.exports = {
  detectLanguage,
  matchesIntent,
  cleanQueryKeyword,
  formatResponse
};
