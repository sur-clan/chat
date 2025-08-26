import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  where,
  collectionGroup,
  limitToLast
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const app = initializeApp(window.firebaseConfig);
const db = getFirestore(app);

// Complete Google Translate supported languages
const ALL_LANGUAGES = {
  'af': 'Afrikaans', 'sq': 'Albanian', 'am': 'Amharic', 'ar': 'Arabic', 'hy': 'Armenian',
  'az': 'Azerbaijani', 'eu': 'Basque', 'be': 'Belarusian', 'bn': 'Bengali', 'bs': 'Bosnian',
  'bg': 'Bulgarian', 'ca': 'Catalan', 'ceb': 'Cebuano', 'ny': 'Chichewa', 'zh': 'Chinese',
  'co': 'Corsican', 'hr': 'Croatian', 'cs': 'Czech', 'da': 'Danish', 'nl': 'Dutch',
  'en': 'English', 'eo': 'Esperanto', 'et': 'Estonian', 'tl': 'Filipino', 'fi': 'Finnish',
  'fr': 'French', 'fy': 'Frisian', 'gl': 'Galician', 'ka': 'Georgian', 'de': 'German',
  'el': 'Greek', 'gu': 'Gujarati', 'ht': 'Haitian Creole', 'ha': 'Hausa', 'haw': 'Hawaiian',
  'he': 'Hebrew', 'hi': 'Hindi', 'hmn': 'Hmong', 'hu': 'Hungarian', 'is': 'Icelandic',
  'ig': 'Igbo', 'id': 'Indonesian', 'ga': 'Irish', 'it': 'Italian', 'ja': 'Japanese',
  'jw': 'Javanese', 'kn': 'Kannada', 'kk': 'Kazakh', 'km': 'Khmer', 'ko': 'Korean',
  'ku': 'Kurdish', 'ky': 'Kyrgyz', 'lo': 'Lao', 'la': 'Latin', 'lv': 'Latvian',
  'lt': 'Lithuanian', 'lb': 'Luxembourgish', 'mk': 'Macedonian', 'mg': 'Malagasy', 'ms': 'Malay',
  'ml': 'Malayalam', 'mt': 'Maltese', 'mi': 'Maori', 'mr': 'Marathi', 'mn': 'Mongolian',
  'my': 'Myanmar', 'ne': 'Nepali', 'no': 'Norwegian', 'or': 'Odia', 'ps': 'Pashto',
  'fa': 'Persian', 'pl': 'Polish', 'pt': 'Portuguese', 'pa': 'Punjabi', 'ro': 'Romanian',
  'ru': 'Russian', 'sm': 'Samoan', 'gd': 'Scottish Gaelic', 'sr': 'Serbian', 'st': 'Sesotho',
  'sn': 'Shona', 'sd': 'Sindhi', 'si': 'Sinhala', 'sk': 'Slovak', 'sl': 'Slovenian',
  'so': 'Somali', 'es': 'Spanish', 'su': 'Sundanese', 'sw': 'Swahili', 'sv': 'Swedish',
  'tg': 'Tajik', 'ta': 'Tamil', 'te': 'Telugu', 'th': 'Thai', 'tr': 'Turkish',
  'uk': 'Ukrainian', 'ur': 'Urdu', 'ug': 'Uyghur', 'uz': 'Uzbek', 'vi': 'Vietnamese',
  'cy': 'Welsh', 'xh': 'Xhosa', 'yi': 'Yiddish', 'yo': 'Yoruba', 'zu': 'Zulu'
};

// Most popular languages for quick selection
const POPULAR_LANGUAGES = [
  'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 
  'ja', 'ko', 'ar', 'hi', 'nl', 'pl', 'tr', 'sv'
];

// Language selection variables
let selectedLanguage = null;
let filteredLanguages = [];

async function translateWithDetection(text, targetLang = null) {
  // Use user's preferred language if no specific target provided
  const actualTargetLang = targetLang || currentUser.preferredTranslationLang || "en";
  
  const apiKey = "APIKEY";  // Replace this with your real key
  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        q: text,
        target: actualTargetLang,
        format: "text"
      })
    });

    const data = await res.json();
    const translation = data.data.translations[0];
    return {
      translated: translation.translatedText,
      detectedSourceLanguage: translation.detectedSourceLanguage
    };
  } catch (err) {
    console.error("Translate error:", err);
    return {
      translated: "[Translation failed]",
      detectedSourceLanguage: "unknown"
    };
  }
}

function languageNameFromCode(code) {
  return ALL_LANGUAGES[code] || code;
}

// Room name validation function
function validateRoomName(name) {
  const trimmed = name.trim();
  
  if (!trimmed) {
    alert("Room name cannot be empty");
    return null;
  }
  
  if (trimmed.length > 14) {
    alert("Room name must be 14 characters or less");
    return null;
  }
  
  return trimmed;
}

// Function to format time ago
function getTimeAgo(timestamp) {
  if (!timestamp) return '';
  
  const now = new Date();
  const messageTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diffMs = now - messageTime;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffWeeks === 1) {
    return '1 week ago';
  } else if (diffWeeks < 4) {
    return `${diffWeeks} weeks ago`;
  } else if (diffMonths === 1) {
    return '1 month ago';
  } else if (diffMonths < 12) {
    return `${diffMonths} months ago`;
  } else if (diffYears === 1) {
    return '1 year ago';
  } else {
    return `${diffYears} years ago`;
  }
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Language Modal Functions
function initializePopularLanguages() {
  const container = document.getElementById('popular-languages');
  container.innerHTML = '';
  
  POPULAR_LANGUAGES.forEach(code => {
    const div = document.createElement('div');
    div.className = 'popular-language';
    div.dataset.lang = code;
    div.textContent = ALL_LANGUAGES[code];
    div.addEventListener('click', () => selectLanguage(code));
    container.appendChild(div);
  });
}

function initializeLanguageSearch() {
  const searchInput = document.getElementById('language-search');
  const dropdown = document.getElementById('language-dropdown');
  
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    
    if (query.length === 0) {
      dropdown.classList.add('hidden');
      return;
    }
    
    // Filter languages
    filteredLanguages = Object.entries(ALL_LANGUAGES).filter(([code, name]) => 
      name.toLowerCase().includes(query)
    ).slice(0, 10); // Limit to 10 results
    
    if (filteredLanguages.length === 0) {
      dropdown.classList.add('hidden');
      return;
    }
    
    // Populate dropdown
    dropdown.innerHTML = '';
    filteredLanguages.forEach(([code, name]) => {
      const div = document.createElement('div');
      div.className = 'language-dropdown-item';
      div.dataset.lang = code;
      div.textContent = name;
      div.addEventListener('click', () => {
        selectLanguage(code);
        searchInput.value = '';
        dropdown.classList.add('hidden');
      });
      dropdown.appendChild(div);
    });
    
    dropdown.classList.remove('hidden');
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      dropdown.classList.add('hidden');
    }
  });
}

function selectLanguage(code) {
  selectedLanguage = code;
  
  // Update visual selection for popular languages
  document.querySelectorAll('.popular-language').forEach(el => {
    el.classList.toggle('selected', el.dataset.lang === code);
  });
  
  // Show selected language
  const displayDiv = document.getElementById('selected-language-display');
  const nameSpan = document.getElementById('selected-language-name');
  nameSpan.textContent = ALL_LANGUAGES[code];
  displayDiv.classList.remove('hidden');
  
  // Enable confirm button
  document.getElementById('language-confirm-btn').disabled = false;
}

function showLanguageWelcomeModal() {
  document.getElementById('language-welcome-modal').classList.remove('hidden');
  
  // Initialize the modal components
  initializePopularLanguages();
  initializeLanguageSearch();
  
  // Auto-detect and pre-select browser language
  const browserLang = navigator.language.split('-')[0];
  
  if (ALL_LANGUAGES[browserLang]) {
    selectLanguage(browserLang);
  } else {
    selectLanguage('en'); // Default to English
  }
}

async function saveLanguagePreferenceAndProceed(languageCode) {
  currentUser.preferredTranslationLang = languageCode;
  
  // Save to Firebase
  const userPayload = {
    name: currentUser.name,
    role: currentUser.role,
    preferredTranslationLang: languageCode
  };
  
  if (currentUser.avatar != null) {
    userPayload.avatar = currentUser.avatar;
  }

  const userRef = doc(db, "users", currentUser.id);
  await setDoc(userRef, userPayload, { merge: true });
  
  console.log("Language preference saved:", languageCode);
  
  // Hide modal and proceed to chat
  document.getElementById('language-welcome-modal').classList.add('hidden');
  proceedToChat();
}

function proceedToChat() {
  // Initialize chat functionality
  const roomId = "general"; // default room

  try {
    const memberPayload = {
      name: currentUser.name,
      role: currentUser.role,
    };
    if (currentUser.avatar != null) {
      memberPayload.avatar = currentUser.avatar;
    }

    const memberRef = doc(db, "rooms", roomId, "members", currentUser.id);
    setDoc(memberRef, memberPayload, { merge: true });

    console.log("Added user to default room:", roomId);

    currentRoomName = roomId;
    populateRooms();
    setupRoomListener();
    showPage(chatListPage);

  } catch (err) {
    console.error("Failed to add user to default room:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {

let currentUser = {};

  const chatListPage = document.getElementById("chat-list");
  const chatRoomPage = document.getElementById("chat-room");
  const membersListPage = document.getElementById("members-list");
  const contactsPage = document.getElementById("contacts-page");

  const pages = [chatListPage, chatRoomPage, membersListPage, contactsPage];
  
  let currentRoomName = null;

  const blockedMembers = new Set();
  const mutedMembers = new Set();

// Cache variables
let roomsCache = null;
let lastRoomsCacheTime = 0;
const CACHE_DURATION = 15000; // 15 seconds cache

// Real-time listeners
let roomsListener = null;
let userMembershipsListener = null;
let unsubscribeMessages = null;

// Muted members cache
let mutedMembersCache = new Map();
let mutedMembersCacheTime = new Map();

// Language modal event listeners
document.getElementById('language-confirm-btn').addEventListener('click', () => {
  if (selectedLanguage) {
    console.log('Language confirmed:', selectedLanguage);
    saveLanguagePreferenceAndProceed(selectedLanguage);
  }
});

// Wait for Wix to send the member info
window.addEventListener("message", async (event) => {
if (!event.origin.endsWith("sur-clan.com")) return;

  const userData = event.data;
  if (!userData || !userData.id) return;
  
  console.log("Got userData from Wix:", userData);

  currentUser = {
    name: userData.name,
    role: "Member",
    id: userData.id,
    avatar: userData.avatar
  };

  console.log("Got userData from Wix:", currentUser);

  // Check if user has a language preference already
  const userRef = doc(db, "users", currentUser.id);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists() && userSnap.data().preferredTranslationLang) {
    // Existing user with language preference
    currentUser.preferredTranslationLang = userSnap.data().preferredTranslationLang;
    console.log("Existing user with language:", currentUser.preferredTranslationLang);
    proceedToChat();
  } else {
    // New user - show language selection modal
    console.log("New user - showing language selection modal");
    showLanguageWelcomeModal();
  }
});

const sendMessage = async (text) => {
  // Check if user is muted before sending
  try {
    const memberRef = doc(db, "rooms", currentRoomName, "members", currentUser.id);
    const memberSnap = await getDoc(memberRef);
    
    if (memberSnap.exists() && memberSnap.data().muted === true) {
      alert("You are muted in this room. Your message was not sent.");
      return;
    }
  } catch (error) {
    console.error("Error checking mute status before sending:", error);
  }

  const messagesRef = collection(db, "rooms", currentRoomName, "messages");

  await addDoc(messagesRef, {
    senderId: currentUser.id,
    senderName: currentUser.name,
    text: text,
    timestamp: serverTimestamp()
  });

  // Update room's last message info and mark as unread for others
  try {
    const roomRef = doc(db, "rooms", currentRoomName);
    await updateDoc(roomRef, {
      lastMessage: text.length > 50 ? text.substring(0, 50) + "..." : text,
      lastMessageTimestamp: serverTimestamp(),
      lastMessageBy: currentUser.id,
      unread: true
    });

    // Mark as read for the sender
    const currentUserMemberRef = doc(db, "rooms", currentRoomName, "members", currentUser.id);
    await updateDoc(currentUserMemberRef, {
      lastReadTimestamp: serverTimestamp()
    });

  } catch (error) {
    console.error("Error updating room last message:", error);
  }
};

  function showPage(page) {
    pages.forEach(p => p.classList.remove("active"));
    page.classList.add("active");
  }

// OPTIMIZED: Real-time room listener instead of polling
function setupRoomListener() {
  console.log("Setting up real-time room listener");
  
  // Stop any existing listeners
  if (roomsListener) {
    roomsListener();
    roomsListener = null;
  }
  
  if (userMembershipsListener) {
    userMembershipsListener();
    userMembershipsListener = null;
  }

  if (!currentUser.id) return;

  // Listen to ALL rooms changes in real-time
  const roomsRef = collection(db, "rooms");
  roomsListener = onSnapshot(roomsRef, async (snapshot) => {
    console.log("Rooms changed - updating list");
    
    // Only update if we're on the chat list page
    if (!document.getElementById("chat-list").classList.contains("active")) {
      return;
    }
    
    await updateRoomsFromSnapshot(snapshot);
  });

  // ALSO listen to user's membership changes across all rooms
  const membershipQuery = query(
    collectionGroup(db, "members"),
    where("name", "==", currentUser.name)
  );
  
  userMembershipsListener = onSnapshot(membershipQuery, async (snapshot) => {
    console.log("User memberships changed - updating rooms");
    
    // Only update if we're on the chat list page
    if (document.getElementById("chat-list").classList.contains("active")) {
      populateRooms(); // Refresh the room list
    }
  });
}

// Process room snapshot efficiently 
async function updateRoomsFromSnapshot(snapshot) {
  const roomsUl = document.getElementById("rooms");
  
  if (snapshot.empty) {
    roomsUl.innerHTML = `<li style="text-align:center; color:gray; font-size: 0.8rem;">No rooms available</li>`;
    return;
  }

  const userRooms = [];
  const membershipPromises = [];

  // Build batch membership checks
  snapshot.forEach((roomDoc) => {
    const roomData = roomDoc.data();
    
    membershipPromises.push(
      getDoc(doc(db, "rooms", roomDoc.id, "members", currentUser.id))
        .then(memberSnap => ({
          roomId: roomDoc.id,
          roomData,
          memberData: memberSnap.exists() ? memberSnap.data() : null
        }))
    );
  });

  // Execute all membership checks in parallel
  const membershipResults = await Promise.all(membershipPromises);
  
  for (const result of membershipResults) {
    if (result.memberData) {
      // Check unread status
      let hasUnread = false;
      if (result.roomData.lastMessageTimestamp && result.roomData.lastMessageBy !== currentUser.id) {
        if (!result.memberData.lastReadTimestamp) {
          hasUnread = true;
        } else {
          const lastMessage = result.roomData.lastMessageTimestamp.toDate ? 
            result.roomData.lastMessageTimestamp.toDate() : 
            new Date(result.roomData.lastMessageTimestamp);
          const lastRead = result.memberData.lastReadTimestamp.toDate ? 
            result.memberData.lastReadTimestamp.toDate() : 
            new Date(result.memberData.lastReadTimestamp);
          hasUnread = lastMessage > lastRead;
        }
      }
      
      userRooms.push({
        id: result.roomId,
        data: { ...result.roomData, unread: hasUnread }
      });
    }
  }

  renderRoomsUI(userRooms);
}

// OPTIMIZED: Cached room population
async function populateRooms() {
  const roomsUl = document.getElementById("rooms");

  // Check cache first
  const now = Date.now();
  if (roomsCache && (now - lastRoomsCacheTime) < CACHE_DURATION) {
    console.log("Using cached rooms data");
    renderRoomsUI(roomsCache);
    return;
  }

  // Only show "Loading rooms…" if nothing is already there
  if (!roomsUl.hasChildNodes() || roomsUl.innerHTML.trim() === "") {
    roomsUl.innerHTML = '<li style="text-align:center; color:gold; font-size: 0.8rem;">Loading rooms…</li>';
  }

  try {
    const allRoomsSnapshot = await getDocs(collection(db, "rooms"));
    const userRooms = [];

    // OPTIMIZATION: Batch the membership checks
    const membershipPromises = [];
    
    for (const roomDoc of allRoomsSnapshot.docs) {
      const roomData = roomDoc.data();
      
      // Add to batch check
      membershipPromises.push(
        getDoc(doc(db, "rooms", roomDoc.id, "members", currentUser.id))
          .then(memberSnap => ({
            roomId: roomDoc.id,
            roomData,
            memberData: memberSnap.exists() ? memberSnap.data() : null
          }))
      );
    }

    // Execute all membership checks in parallel (MUCH faster!)
    const membershipResults = await Promise.all(membershipPromises);
    
    for (const result of membershipResults) {
      if (result.memberData) {
        // Check if room has unread messages for this user
        let hasUnread = false;
        if (result.roomData.lastMessageTimestamp && result.roomData.lastMessageBy !== currentUser.id) {
          if (!result.memberData.lastReadTimestamp) {
            hasUnread = true;
          } else {
            const lastMessage = result.roomData.lastMessageTimestamp.toDate ? 
              result.roomData.lastMessageTimestamp.toDate() : 
              new Date(result.roomData.lastMessageTimestamp);
            const lastRead = result.memberData.lastReadTimestamp.toDate ? 
              result.memberData.lastReadTimestamp.toDate() : 
              new Date(result.memberData.lastReadTimestamp);
            hasUnread = lastMessage > lastRead;
          }
        }
        
        userRooms.push({
          id: result.roomId,
          data: { ...result.roomData, unread: hasUnread }
        });
      }
    }

    // Cache the results
    roomsCache = userRooms;
    lastRoomsCacheTime = now;

    renderRoomsUI(userRooms);

  } catch (err) {
    console.error("Failed to load rooms:", err);
    roomsUl.innerHTML = `<li style="color:red; font-size: 0.8rem;">Error loading rooms</li>`;
  }
}

// Render rooms UI efficiently
function renderRoomsUI(userRooms) {
  const roomsUl = document.getElementById("rooms");
  
  // Sort rooms by most recent message timestamp BUT keep General at top
  userRooms.sort((a, b) => {
    if (a.id === "general") return -1;
    if (b.id === "general") return 1;
    
    const timeA = a.data.lastMessageTimestamp;
    const timeB = b.data.lastMessageTimestamp;
    
    if (!timeA && !timeB) return 0;
    if (!timeA) return 1;
    if (!timeB) return -1;
    
    const dateA = timeA.toDate ? timeA.toDate() : new Date(timeA);
    const dateB = timeB.toDate ? timeB.toDate() : new Date(timeB);
    
    return dateB.getTime() - dateA.getTime();
  });

  // Build the list off-DOM first
  const frag = document.createDocumentFragment();
    
  userRooms.forEach((roomInfo) => {
    const room = roomInfo.data;
    const li = document.createElement("li");
    
    // Add class and data attribute for event delegation
    li.classList.add('room-item');
    li.dataset.roomId = roomInfo.id;
    
    // Display private rooms differently
    if (room.type === "private" && room.participants) {
      const otherParticipant = room.participants.find(name => name !== currentUser.name);
      const timeAgo = getTimeAgo(room.lastMessageTimestamp);
      li.innerHTML = `
        <strong><i class="fa-solid fa-user private-chat-icon"></i>${otherParticipant || 'Private Chat'}</strong><br>
        <small>${timeAgo}</small>`;
    } else {
      const timeAgo = getTimeAgo(room.lastMessageTimestamp);
      
      if (roomInfo.id === "general") {
        li.innerHTML = `
          <strong><i class="fa-solid fa-star general-star"></i>${room.name || 'Unnamed Room'}</strong><br>
          <small>${timeAgo}</small>`;
      } else {
        li.innerHTML = `
          <strong>${room.name || 'Unnamed Room'}</strong><br>
          <small>${timeAgo}</small>`;
      }
    }

    if (room.unread) {
      const icon = document.createElement("span");
      icon.className = "unread-envelope";
      icon.innerHTML = "✉";
      li.appendChild(icon);
    }
  
    frag.appendChild(li);
  });

  // Replace content once
  roomsUl.innerHTML = "";
  if (userRooms.length === 0) {
    roomsUl.innerHTML = `<li style="text-align:center; color:gray; font-size: 0.8rem;">No rooms available</li>`;
  } else {
    roomsUl.appendChild(frag);
  }
}

// OPTIMIZED: Event delegation for room clicks
document.getElementById("rooms").addEventListener("click", async (e) => {
  const roomItem = e.target.closest('.room-item');
  if (!roomItem) return;
  
  const roomId = roomItem.dataset.roomId;
  if (!roomId) return;
  
  currentRoomName = roomId;
  
  // Clear cache when entering a room
  roomsCache = null;
  
  await updateAllRoomNameDisplays();
  
  const msgsDiv = document.getElementById("messages");
  msgsDiv.innerHTML = '<div style="text-align:center; color:gold; font-size: 0.8rem;">Loading messages…</div>';
  
  showPage(chatRoomPage);
  
  console.log("Joining room:", currentRoomName, "as user:", currentUser);

  if (!currentUser.id) {
    console.error("currentUser.id is undefined!");
    return;
  }

  try {
    const memberRef = doc(db, "rooms", currentRoomName, "members", currentUser.id);
    const existingMemberSnap = await getDoc(memberRef);

    if (existingMemberSnap.exists()) {
      const existingData = existingMemberSnap.data();
      if (existingData.role) {
        currentUser.role = existingData.role;
      }
      await setDoc(memberRef, {
        name: currentUser.name,
        avatar: currentUser.avatar || null
      }, { merge: true });
    } else {
      const memberData = {
        name: currentUser.name,
        role: currentUser.role,
        avatar: currentUser.avatar || null
      };
      await setDoc(memberRef, memberData);
    }

    console.log("Member added to:", currentRoomName);
  } catch (err) {
    console.error("Failed to add member:", err);
  }

  safePopulateMessages();
});

// Function to check if current user was removed from current room (one-time check)
let hasBeenKicked = false;

async function checkIfRemovedFromCurrentRoom() {
  if (!currentRoomName || !currentUser.id || hasBeenKicked) return;
  
  try {
    const memberRef = doc(db, "rooms", currentRoomName, "members", currentUser.id);
    const memberSnap = await getDoc(memberRef);
    
    if (!memberSnap.exists()) {
      // User was removed from current room
      hasBeenKicked = true; // Prevent repeated checks
      
      // 1. First refresh the room list (removes the room from their list)
      await populateRooms();
      
      // 2. Then show alert and kick them back to room list
      alert("You have been removed from this room");
      showPage(chatListPage);
      
      // 3. Reset flag after they're back in chat list
      setTimeout(() => {
        hasBeenKicked = false;
        currentRoomName = null; // Clear current room
      }, 1000);
    }
  } catch (error) {
    console.error("Error checking room membership:", error);
  }
}

// Check every 3 seconds (faster detection)
setInterval(checkIfRemovedFromCurrentRoom, 3000);

// Cache muted members to avoid repeated queries
async function getCachedMutedMembers() {
  const cacheKey = currentRoomName;
  const now = Date.now();
  
  // Check if we have recent cached data (30 seconds)
  if (mutedMembersCache.has(cacheKey) && 
      (now - mutedMembersCacheTime.get(cacheKey)) < 30000) {
    return mutedMembersCache.get(cacheKey);
  }
  
  // Fetch fresh data
  const mutedMembers = new Set();
  try {
    const membersSnapshot = await getDocs(collection(db, "rooms", currentRoomName, "members"));
    membersSnapshot.forEach(doc => {
      const memberData = doc.data();
      if (memberData.muted === true) {
        mutedMembers.add(memberData.name);
      }
    });
    
    // Cache the results
    mutedMembersCache.set(cacheKey, mutedMembers);
    mutedMembersCacheTime.set(cacheKey, now);
    
  } catch (error) {
    console.error("Error getting muted members:", error);
  }
  
  return mutedMembers;
}

// OPTIMIZED: Load only recent messages with pagination
function populateMessages() {
  if (!currentRoomName) {
    console.error("currentRoomName is not set yet");
    return;
  }
  
  if (!currentUser.role) {
    console.warn("populateMessages() called before role was set – stopping");
    return;
  }

  const msgsDiv = document.getElementById("messages");

  // Stop the old listener first
  if (unsubscribeMessages) {
    unsubscribeMessages();
    unsubscribeMessages = null;
  }

  msgsDiv.innerHTML = '<div style="text-align:center; color:gold; font-size: 0.8rem;">Loading messages…</div>';
  checkMuteStatus();

  const messagesRef = collection(db, "rooms", currentRoomName, "messages");
  
  // CRITICAL: Only load last 50 messages instead of ALL messages!
  const q = query(
    messagesRef, 
    orderBy("timestamp"), 
    limitToLast(50) // This prevents loading thousands of old messages!
  );

  unsubscribeMessages = onSnapshot(q, async (snapshot) => {
    const frag = document.createDocumentFragment();  

    if (snapshot.empty) {
      msgsDiv.innerHTML = '<div style="text-align:center; color:gray; font-size: 0.8rem;">No messages yet…</div>';
      return;
    }

    // Get muted members list from Firebase (cache this too!)
    const mutedMembers = await getCachedMutedMembers();

    snapshot.forEach((doc) => {
      const msg = doc.data();

      // Skip blocked/muted members
      if (blockedMembers.has(msg.senderName) || mutedMembers.has(msg.senderName)) return;

      const wrapper = document.createElement("div");
      wrapper.className = "message-scroll";
      wrapper.dataset.messageId = doc.id;
      wrapper.classList.add(msg.senderName === currentUser.name ? "my-message" : "other-message");

      const content = document.createElement("div");
      content.className = "message-content";
    
      if (msg.hidden) {
        content.innerHTML = `
          <div class="message-header">${msg.senderName}</div>
          <div class="message-body" style="font-style: italic; color: gray;">
            This message has been hidden by admin.
          </div>
          <div class="message-time">${msg.timestamp?.toDate().toLocaleTimeString() || ''}</div>
        `;
      } else {
        content.innerHTML = `
          <div class="message-header">${msg.senderName}</div>
          <div class="message-body">${msg.text.replace(/\n/g, "<br>")}</div>
          <div class="message-time">${msg.timestamp?.toDate().toLocaleTimeString() || ''}</div>
        `;
      }

      content.addEventListener("click", async () => {
        await showModal(msg, wrapper);
      });

      wrapper.appendChild(content);

      if (msg.senderName !== currentUser.name) {
        const actions = document.createElement("div");
        actions.className = "message-actions";

        const translateBtn = document.createElement("button");
        translateBtn.innerHTML = '<i class="fa-solid fa-globe"></i>';
        translateBtn.className = "translate-btn";
        
        translateBtn.addEventListener("click", async () => {
          const messageBody = wrapper.querySelector(".message-body");

          if (messageBody.dataset.originalText) {
            messageBody.innerHTML = messageBody.dataset.originalText;
            delete messageBody.dataset.originalText;
            return;
          }

          messageBody.dataset.originalText = messageBody.innerHTML;
          const result = await translateWithDetection(msg.text, "en");

          messageBody.innerHTML = `
            ${result.translated}
            <div style="color: #bbb; font-size: 0.8rem; font-style: italic; margin-top: 4px;">
              original: ${languageNameFromCode(result.detectedSourceLanguage)}
            </div>
          `;
        });

        actions.appendChild(translateBtn);
        wrapper.appendChild(actions);
      }
   
      frag.appendChild(wrapper);
    });

    msgsDiv.innerHTML = "";
    msgsDiv.appendChild(frag);
    checkMuteStatus();
    msgsDiv.scrollTop = msgsDiv.scrollHeight;
  });
}

async function safePopulateMessages(retries = 10) {
   if (!currentUser.role) {
     if (retries <= 0) {
       console.error("Role not loaded after multiple attempts.");
       return;
     }
     console.log("Waiting for role to load...");
     await new Promise(resolve => setTimeout(resolve, 300)); 
     return safePopulateMessages(retries - 1);
   }
   
   // Check if current user is muted and show notification
   await checkMuteStatus();
   populateMessages();
}

async function checkMuteStatus() {
  if (!currentRoomName || !currentUser.id) return;
  
  try {
    const memberRef = doc(db, "rooms", currentRoomName, "members", currentUser.id);
    const memberSnap = await getDoc(memberRef);
    
    if (memberSnap.exists()) {
      const memberData = memberSnap.data();
      if (memberData.muted === true) {
        showMuteNotification();
      } else {
        removeMuteNotification();
      }
    }
  } catch (error) {
    console.error("Error checking mute status:", error);
  }
}

function showMuteNotification() {
  const msgsDiv = document.getElementById("messages");
  const existingNotification = document.getElementById("mute-notification");
  
  if (!existingNotification) {
    const notification = document.createElement("div");
    notification.id = "mute-notification";
    notification.style.backgroundColor = "rgba(255, 107, 107, 0.2)";
    notification.style.border = "1px solid #ff6b6b";
    notification.style.borderRadius = "8px";
    notification.style.color = "#ff6b6b";
    notification.style.padding = "0.8rem";
    notification.style.margin = "0.5rem";
    notification.style.textAlign = "center";
    notification.style.fontWeight = "bold";
    notification.style.position = "sticky";
    notification.style.top = "0";
    notification.style.zIndex = "100";
    
    notification.innerHTML = "You have been muted in this room by an administrator.<br><small style=\"opacity: 0.8;\">Your messages are not visible to other members.</small>";
    
    if (msgsDiv.firstChild) {
      msgsDiv.insertBefore(notification, msgsDiv.firstChild);
    } else {
      msgsDiv.appendChild(notification);
    }
  }
}

function removeMuteNotification() {
  const existingNotification = document.getElementById("mute-notification");
  if (existingNotification) {
    existingNotification.remove();
  }
}

async function populateMembers() {
  const membersUl = document.getElementById("members");
  membersUl.innerHTML = "";

  if (!currentRoomName) return;

  const querySnapshot = await getDocs(collection(db, "rooms", currentRoomName, "members"));
  const members = [];
  querySnapshot.forEach((doc) => {
    const memberData = doc.data();
    memberData.id = doc.id; // Add the document ID
    members.push(memberData);
  });

  members.forEach(m => {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";

    const nameSpan = document.createElement("span");
    let displayName = `${m.name} ${m.role === "Administrator" ? "(Admin)" : ""}`;
    if (m.muted === true) {
      displayName += " 🔇"; // Add mute icon
    }
    if (blockedMembers.has(m.name)) {
      displayName += " 🚫"; // Add blocked icon
    }
    nameSpan.textContent = displayName;
    nameSpan.style.cursor = "pointer";

    nameSpan.addEventListener("click", (e) => {
      showMemberMenu(e.target, m);
    });

    li.appendChild(nameSpan);

    if (currentUser.role === "Administrator" && m.name !== currentUser.name) {
      const btn = document.createElement("button");
      btn.textContent = "❌";
      btn.addEventListener("click", async () => {
        if (confirm(`Remove ${m.name} from this room?`)) {
          try {
            // Remove from Firebase using the stored ID
            const memberRef = doc(db, "rooms", currentRoomName, "members", m.id);
            await deleteDoc(memberRef);
            
            console.log(`Removed ${m.name} from ${currentRoomName}`);
            alert(`${m.name} has been removed from the room`);
            
            // Refresh the members list
            populateMembers();
          } catch (error) {
            console.error("Error removing member:", error);
            alert("Error removing member. Please try again.");
          }
        }
      });
      li.appendChild(btn);
    }

    membersUl.appendChild(li);
  });

  updateMemberCount(members.length);
}

function updateMemberCount(count) {
  document.getElementById("member-count").innerHTML =
    `<i class="fa-solid fa-users" style="color: gold;"></i> ${count} Members`;
}

function showMemberMenu(targetElem, member) {
  const existingMenu = document.getElementById("member-menu");
  if (existingMenu) existingMenu.remove();

  const menu = document.createElement("div");
  menu.id = "member-menu";
  menu.className = "member-menu";

  // Check if member is muted
  const isMuted = member.muted === true;
  const muteText = isMuted ? "🔊 Unmute" : "🔇 Mute";
  
  // Check if member is blocked (by current user)
  const isBlocked = blockedMembers.has(member.name);
  const blockText = isBlocked ? "✅ Unblock" : "🚫 Block";

  // Only show mute button to admins
  const muteButtonHtml = currentUser.role === "Administrator" ? 
    `<button id="menu-mute">${muteText}</button>` : '';

  menu.innerHTML = `
    <button id="menu-info">🔍 Profile</button>
    <button id="menu-message">💬 Message</button>
    <button id="menu-block">${blockText}</button>
    ${muteButtonHtml}
  `;

  document.body.appendChild(menu);

  const rect = targetElem.getBoundingClientRect();
  menu.style.top = `${rect.bottom + window.scrollY}px`;
  menu.style.left = `${rect.left + window.scrollX}px`;

  // Attach click-outside-to-close listener immediately
  function closeMemberMenu(e) {
    const menuEl = document.getElementById("member-menu");
    if (!menuEl) return;

    // If click was inside the menu → do nothing
    if (menuEl.contains(e.target)) return;

    // If click was on the same name → do nothing
    if (e.target === targetElem) return;

    // Otherwise → close
    menuEl.remove();
    document.removeEventListener("click", closeMemberMenu);
  }

  document.addEventListener("click", closeMemberMenu);

  menu.querySelector("#menu-info").onclick = () => {
    showProfileModal(member.name);
    menu.remove();
    document.removeEventListener("click", closeMemberMenu);
  };

  menu.querySelector("#menu-message").onclick = () => {
    startPrivateChat(member.name);
    menu.remove();
    document.removeEventListener("click", closeMemberMenu);
  };

  menu.querySelector("#menu-block").onclick = () => {
    if (isBlocked) {
      unblockMember(member.name);
    } else {
      blockMember(member.name);
    }
    menu.remove();
    document.removeEventListener("click", closeMemberMenu);
  };

  const muteBtn = menu.querySelector("#menu-mute");
  if (currentUser.role === "Administrator" && muteBtn) {
    muteBtn.onclick = () => {
      if (isMuted) {
        unmuteMember(member.name);
      } else {
        muteMember(member.name);
      }
      menu.remove();
      document.removeEventListener("click", closeMemberMenu);
      
      // Refresh member list to show updated status
      setTimeout(() => {
        populateMembers();
      }, 1000);
    };
  }
}

  function startPrivateChat(targetUserName) {
    if (targetUserName === currentUser.name) {
      alert("You cannot message yourself");
      return;
    }
    
    if (blockedMembers.has(targetUserName)) {
      alert("You have blocked this user");
      return;
    }
    
    createPrivateRoom(targetUserName);
  }

  async function createPrivateRoom(targetUserName) {
    try {
      // Create a consistent room ID for both users (alphabetical order)
      const users = [currentUser.name, targetUserName].sort();
      const privateRoomId = `private_${users[0]}_${users[1]}`.replace(/\s+/g, "_").toLowerCase();
      
      console.log("Creating/joining private room:", privateRoomId);
      
      // Check if private room already exists
      const roomRef = doc(db, "rooms", privateRoomId);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        // Create the private room
        await setDoc(roomRef, {
          name: `${currentUser.name} & ${targetUserName}`,
          type: "private",
          participants: [currentUser.name, targetUserName],
          createdBy: currentUser.name,
          createdAt: new Date().toISOString(),
          lastMessage: "Private chat created",
          lastMessageTimestamp: serverTimestamp(),
          lastMessageBy: currentUser.id,
          unread: false
        });
        
        console.log("Created new private room");
      }
      
      // Add both users as members
      const currentUserMemberRef = doc(db, "rooms", privateRoomId, "members", currentUser.id);
      await setDoc(currentUserMemberRef, {
        name: currentUser.name,
        role: "Member",
        avatar: currentUser.avatar || null
      }, { merge: true });
      
      // Add target user (we need to find their ID first)
      const usersSnapshot = await getDocs(collection(db, "users"));
      let targetUserId = null;
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.name === targetUserName) {
          targetUserId = doc.id;
        }
      });
      
      if (targetUserId) {
        const targetUserMemberRef = doc(db, "rooms", privateRoomId, "members", targetUserId);
        await setDoc(targetUserMemberRef, {
          name: targetUserName,
          role: "Member"
        }, { merge: true });
        
        console.log("Added both users to private room");
      }
      
      // Switch to the private room
      currentRoomName = privateRoomId;
      document.getElementById("room-name").textContent = targetUserName;
      
      // Clear messages and load the private chat
      const msgsDiv = document.getElementById("messages");
      msgsDiv.innerHTML = `<div style="text-align:center; color:gold;">Loading private chat…</div>`;
      
      showPage(chatRoomPage);
      
      // Update current user's role for this room
      const memberRef = doc(db, "rooms", currentRoomName, "members", currentUser.id);
      const existingMemberSnap = await getDoc(memberRef);
      if (existingMemberSnap.exists()) {
        const existingData = existingMemberSnap.data();
        if (existingData.role) {
          currentUser.role = existingData.role;
        }
      }
      
      // Load messages
      safePopulateMessages();
      
      // Refresh room list to show the new private chat
      populateRooms();
      
      alert(`Started private chat with ${targetUserName}`);
      
    } catch (error) {
      console.error("Error creating private room:", error);
      alert("Error starting private chat. Please try again.");
    }
  }

  function showProfileModal(name) {
    const modal = document.getElementById("message-modal");
    const textElem = document.getElementById("modal-message-text");

    textElem.innerHTML = `
      <iframe src="https://www.sur-clan.com/profile/${name}"
              style="width:100%;height:400px;border:none;"></iframe>`;
    modal.classList.remove("hidden");

 // hide reply & copy buttons
  document.getElementById("modal-reply").style.display = "none";
  document.getElementById("modal-copy").style.display = "none";
  document.getElementById("modal-close").style.display = "none";

 // REMOVE the hide button if it exists
  const oldHideBtn = document.getElementById("modal-hide");
  if (oldHideBtn) oldHideBtn.remove();

// Add click listener on modal to close when clicking outside content
  modal.onclick = (e) => {
    // only close if click is on the backdrop (not on modal content)
    if (e.target === modal) {
      modal.classList.add("hidden");
      modal.onclick = null; // clean up
    }
  };
}
  
  function blockMember(name) {
    if (name === currentUser.name) {
      alert("You cannot block yourself");
      return;
    }
    
    blockedMembers.add(name);
    alert(`${name} is now blocked (you won't see their messages)`);
    
    // Immediately refresh messages to hide blocked user's messages
    populateMessages();
    
    // Also refresh members list to show block status
    if (document.getElementById("members-list").classList.contains("active")) {
      populateMembers();
    }
  }

  function unblockMember(name) {
    blockedMembers.delete(name);
    alert(`${name} has been unblocked`);
    
    // Immediately refresh messages to show unblocked user's messages
    populateMessages();
    
    // Also refresh members list to update block status
    if (document.getElementById("members-list").classList.contains("active")) {
      populateMembers();
    }
  }

async function muteMember(memberName) {
  if (currentUser.role !== "Administrator") {
    alert("Only administrators can mute members");
    return;
  }

  if (memberName === currentUser.name) {
    alert("You cannot mute yourself");
    return;
  }

  try {
    // Find the member's ID
    const membersSnapshot = await getDocs(collection(db, "rooms", currentRoomName, "members"));
    let memberToMuteId = null;
    
    membersSnapshot.forEach(doc => {
      const memberData = doc.data();
      if (memberData.name === memberName) {
        memberToMuteId = doc.id;
      }
    });

    if (memberToMuteId) {
      // Add muted status to the member document
      const memberRef = doc(db, "rooms", currentRoomName, "members", memberToMuteId);
      await updateDoc(memberRef, {
        muted: true,
        mutedBy: currentUser.name,
        mutedAt: serverTimestamp()
      });

      alert(`${memberName} has been muted in this room`);
      console.log(`Muted ${memberName} in ${currentRoomName}`);
      
      // Force refresh messages regardless of current page
      if (unsubscribeMessages) {
        unsubscribeMessages();
        unsubscribeMessages = null;
      }
      // Re-setup the message listener to immediately reflect mute changes
      setTimeout(() => {
        if (currentRoomName && currentUser.role) {
          populateMessages();
        }
      }, 500);
    } else {
      alert(`Could not find ${memberName} to mute`);
    }
  } catch (error) {
    console.error("Error muting member:", error);
    alert("Error muting member. Please try again.");
  }
}

async function unmuteMember(memberName) {
  if (currentUser.role !== "Administrator") {
    alert("Only administrators can unmute members");
    return;
  }

  try {
    // Find the member's ID
    const membersSnapshot = await getDocs(collection(db, "rooms", currentRoomName, "members"));
    let memberToUnmuteId = null;
    
    membersSnapshot.forEach(doc => {
      const memberData = doc.data();
      if (memberData.name === memberName) {
        memberToUnmuteId = doc.id;
      }
    });

    if (memberToUnmuteId) {
      // Remove muted status from the member document
      const memberRef = doc(db, "rooms", currentRoomName, "members", memberToUnmuteId);
      await updateDoc(memberRef, {
        muted: false
      });

      alert(`${memberName} has been unmuted`);
      console.log(`Unmuted ${memberName} in ${currentRoomName}`);
      
      // Force refresh messages regardless of current page
      if (unsubscribeMessages) {
        unsubscribeMessages();
        unsubscribeMessages = null;
      }
      // Re-setup the message listener to immediately reflect unmute changes
      setTimeout(() => {
        if (currentRoomName && currentUser.role) {
          populateMessages();
        }
      }, 500);
    } else {
      alert(`Could not find ${memberName} to unmute`);
    }
  } catch (error) {
    console.error("Error unmuting member:", error);
    alert("Error unmuting member. Please try again.");
  }
}

async function showModal(msg, wrapper) {
  // STEP 1: Confirm the user's role from Firestore first
  let freshRole = currentUser.role;

  try {
    const memberRef = doc(db, "rooms", currentRoomName, "members", currentUser.id);
    const memberSnap = await getDoc(memberRef);
    if (memberSnap.exists()) {
      const data = memberSnap.data();
if (data.role) {
        freshRole = data.role;
        currentUser.role = data.role;  // update locally too
      }
    }
  } catch (err) {
    console.error("Could not refresh role before showing modal:", err);
    // We won't stop the modal from opening if the role check fails
  }

    console.log("Role check:", freshRole); // DEBUGGING LINE

  // STEP 2: Build modal only after role is confirmed
const modal = document.getElementById("message-modal");
modal.classList.remove("hidden");
  
  const textElem = document.getElementById("modal-message-text");
  const replyBtn = document.getElementById("modal-reply");
  const copyBtn = document.getElementById("modal-copy");
  const closeBtn = document.getElementById("modal-close");

  // 3. Build modal content
  if (msg.hidden) {
    textElem.innerHTML = `
      <div class="message-scroll ${msg.senderName === currentUser.name ? "my-message" : "other-message"}">
        <div class="message-content">
          <div class="message-header">${msg.senderName}</div>
          <div class="message-body" style="font-style: italic; color: gray;">
            This message has been hidden by admin.
          </div>
        </div>
      </div>
    `;
  } else {
    textElem.innerHTML = `
      <div class="message-scroll ${msg.senderName === currentUser.name ? "my-message" : "other-message"}">
        <div class="message-content">
          <div class="message-header">${msg.senderName}</div>
          <div class="message-body">${msg.text.replace(/\n/g, "<br>")}</div>
        </div>
      </div>
    `;
  }

  // 5. Show reply/copy/close buttons
  replyBtn.style.display = "inline-block";
  copyBtn.style.display = "inline-block";
  closeBtn.style.display = "inline-block";

  // Reply to the sender (always replies to the name, even if hidden)
  replyBtn.onclick = () => {
    document.getElementById("message-input").value = `${msg.senderName}, `;
    modal.classList.add("hidden");
  };

  // Copy the message (blocked if hidden)
copyBtn.onclick = () => {
  if (msg.hidden) {
    alert("This message is hidden and cannot be copied.");
    modal.classList.add("hidden");
    return;
  }

  const ts = msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date();
  const formatted = `${ts.toLocaleDateString()} ${ts.toLocaleTimeString()} ${msg.senderName}:\n${msg.text}`;
  
  // Try modern clipboard API first (works on iPhone and modern Android)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(formatted)
      .then(() => {
        alert("Message copied!");
        modal.classList.add("hidden");
      })
      .catch(err => {
        // Fallback for Android if modern API fails
        copyWithFallback(formatted);
        modal.classList.add("hidden");
      });
  } else {
    // Fallback for older browsers/Android
    copyWithFallback(formatted);
    modal.classList.add("hidden");
  }
};

function copyWithFallback(text) {
  // Create temporary textarea (same approach as your paste function)
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.top = "-1000px";
  textArea.style.left = "-1000px";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.select();
  
  try {
    document.execCommand('copy');
    alert("Message copied!");
  } catch (err) {
    alert("Failed to copy message");
  }
  
  document.body.removeChild(textArea);
}

  // Close modal
  closeBtn.onclick = () => {
    modal.classList.add("hidden");
  };

  // 6. Remove any previous Hide/Unhide button
  const oldHideBtn = document.getElementById("modal-hide");
  if (oldHideBtn) oldHideBtn.remove();

 // STEP 3: Only add Hide/Unhide button if freshRole is admin
  if (freshRole === "Administrator") {
        console.log("Adding Hide/Unhide button for admin");

    const hideBtn = document.createElement("button");
    hideBtn.id = "modal-hide";
    hideBtn.style.marginLeft = "8px";
    hideBtn.textContent = msg.hidden ? "Unhide" : "Hide";  // dynamic label

    closeBtn.parentElement.insertBefore(hideBtn, closeBtn);

    // Hide/unhide toggle logic
    hideBtn.onclick = async () => {
      const msgRef = doc(db, "rooms", currentRoomName, "messages", wrapper.dataset.messageId);

      if (!msg.hidden) {
        await updateDoc(msgRef, { hidden: true });
      } else {
        await updateDoc(msgRef, { hidden: false });
      }

      modal.classList.add("hidden");
    };

 } else {
    console.log("User is NOT admin – no Hide/Unhide button");
    
  }
}

// Debounced search functions
const debouncedContactsSearch = debounce((e) => {
  const term = e.target.value.trim().toLowerCase();
  const contactsUl = document.getElementById("contacts-list");
  const lis = contactsUl.querySelectorAll("li");

  lis.forEach(li => {
    const name = li.textContent.trim().toLowerCase();
    li.style.display = name.startsWith(term) ? "flex" : "none";
  });
}, 300);

const debouncedMemberSearch = debounce((e) => {
  const term = e.target.value.trim().toLowerCase();
  const membersUl = document.getElementById("members");
  const lis = membersUl.querySelectorAll("li");

  lis.forEach(li => {
    const name = li.querySelector("span").textContent.toLowerCase();
    li.style.display = name.startsWith(term) ? "flex" : "none";
  });
}, 300);

// Apply debounced search listeners
document.getElementById("contacts-search").addEventListener("input", debouncedContactsSearch);
document.getElementById("member-search").addEventListener("input", debouncedMemberSearch);

document.getElementById("invite-member").addEventListener("click", async () => {
  if (!currentRoomName) {
    alert("No room selected");
    return;
  }

  // Get current room members
  try {
    const membersSnapshot = await getDocs(collection(db, "rooms", currentRoomName, "members"));
    const currentMembers = [];
    membersSnapshot.forEach(doc => {
      const memberData = doc.data();
      currentMembers.push({
        id: doc.id,
        name: memberData.name
      });
    });

    // Initialize invite system if not already done
    if (!inviteSystem) {
      inviteSystem = new InviteSystem();
    }

    // Open the invite modal
    inviteSystem.openModal(currentRoomName, currentMembers);
    
  } catch (error) {
    console.error('Error loading current members:', error);
    alert('Error loading members. Please try again.');
  }
});

// OPTIMIZED: Enhanced room creation with real-time updates
document.getElementById("create-room").addEventListener("click", async () => {
  if (!currentUser || !currentUser.id || !currentUser.name) {
    alert("Cannot create room – currentUser is not ready yet.");
    console.error("currentUser object is incomplete:", currentUser);
    return;
  }

  const rawRoomName = prompt("Enter a name for the new room (max 14 characters):");
  if (!rawRoomName) return;

  const roomName = validateRoomName(rawRoomName);
  if (!roomName) return;

  const roomId = roomName.replace(/\s+/g, "_").toLowerCase();
  const roomRef = doc(db, "rooms", roomId);

  try {
    // Create room document with real-time update triggers
    await setDoc(roomRef, {
      name: roomName,
      createdBy: currentUser.name,
      createdAt: serverTimestamp(),
      lastMessage: "Room created",
      lastMessageTimestamp: serverTimestamp(),
      lastMessageBy: currentUser.id,
      unread: false
    });

    // Add creator as admin member
    const adminData = {
      name: currentUser.name,
      role: "Administrator"
    };

    if (currentUser.avatar !== undefined) {
      adminData.avatar = currentUser.avatar;
    }

    await setDoc(
      doc(db, "rooms", roomId, "members", currentUser.id),
      adminData
    );

    currentUser.role = "Administrator";

    console.log(`Room '${roomName}' created successfully`);
    
    // Clear cache to force refresh
    roomsCache = null;
    
    // The real-time listener will automatically update the room list!
    
  } catch (err) {
    console.error("Error creating room:", err);
    alert("Error creating room – see console.");
  }
});

document.getElementById("back-btn").addEventListener("click", () => showPage(chatListPage));

document.getElementById("back-to-rooms").addEventListener("click", () => {
  // Mark current room as read before leaving
  if (currentRoomName && currentUser.id) {
    try {
      const memberRef = doc(db, "rooms", currentRoomName, "members", currentUser.id);
      updateDoc(memberRef, {
        lastReadTimestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error marking room as read:", error);
    }
  }
  
  showPage(chatListPage);
  
  // Refresh room list to update unread status
  setTimeout(() => {
    populateRooms();
  }, 500);
});

document.getElementById("view-members").addEventListener("click", async () => {
  showPage(membersListPage);
  
  // Get fresh room name from Firebase for members page
  const roomNameElem = document.querySelector('#members-list #room-name');
  if (currentRoomName) {
    try {
      const roomRef = doc(db, "rooms", currentRoomName);
      const roomSnap = await getDoc(roomRef);
      
      if (roomSnap.exists()) {
        const roomData = roomSnap.data();
        
        if (roomData.type === "private" && roomData.participants) {
          const otherParticipant = roomData.participants.find(name => name !== currentUser.name);
          roomNameElem.textContent = otherParticipant || 'Private Chat';
        } else {
          roomNameElem.textContent = roomData.name || currentRoomName;
        }
      } else {
        // Fallback to current display
        roomNameElem.textContent = document.getElementById("room-name").textContent;
      }
    } catch (error) {
      console.error("Error getting room name for members page:", error);
      // Fallback to current display
      roomNameElem.textContent = document.getElementById("room-name").textContent;
    }
  }
  
  populateMembers();
});

// Add room name editing functionality for admins
document.getElementById("room-name").addEventListener("click", async () => {
  // Only allow admins to edit room names
  if (currentUser.role !== "Administrator") {
    return; // Do nothing for non-admins
  }
  
  if (!currentRoomName) {
    alert("No room selected");
    return;
  }
  
  // Check if it's a private room (can't rename private rooms)
  try {
    const roomRef = doc(db, "rooms", currentRoomName);
    const roomSnap = await getDoc(roomRef);
    
    if (roomSnap.exists()) {
      const roomData = roomSnap.data();
      
      if (roomData.type === "private") {
        alert("Private chat names cannot be changed");
        return;
      }
      
      const currentName = roomData.name || currentRoomName;
      const rawNewName = prompt(`Enter new name for "${currentName}" (max 14 characters):`, currentName);
      
      if (!rawNewName) return; // User cancelled
      
      // Validate the new room name
      const newName = validateRoomName(rawNewName);
      if (!newName) return; // Validation failed
      
      if (newName !== currentName) {
        try {
          // Update room name in Firebase
          await updateDoc(roomRef, {
            name: newName
          });
          
          console.log(`Room ${currentRoomName} renamed to: ${newName}`);
          alert(`Room renamed to "${newName}"`);
          
          // Force refresh everything with new name
          await updateAllRoomNameDisplays();
          
        } catch (error) {
          console.error("Error renaming room:", error);
          alert("Error renaming room. Please try again.");
        }
      }
    }
  } catch (error) {
    console.error("Error checking room data:", error);
    alert("Error accessing room data. Please try again.");
  }
});

// Function to update all room name displays
async function updateAllRoomNameDisplays() {
  if (!currentRoomName) return;
  
  try {
    const roomRef = doc(db, "rooms", currentRoomName);
    const roomSnap = await getDoc(roomRef);
    
    if (roomSnap.exists()) {
      const roomData = roomSnap.data();
      let displayName;
      
      if (roomData.type === "private" && roomData.participants) {
        const otherParticipant = roomData.participants.find(name => name !== currentUser.name);
        displayName = otherParticipant || 'Private Chat';
      } else {
        displayName = roomData.name || currentRoomName;
      }
      
      // Update chat room header
      const chatRoomName = document.getElementById("room-name");
      if (chatRoomName) {
        chatRoomName.textContent = displayName;
      }
      
      // Update members page header
      const membersRoomName = document.querySelector('#members-list #room-name');
      if (membersRoomName) {
        membersRoomName.textContent = displayName;
      }
      
      // Refresh room list to show new name
      populateRooms();
      
    }
  } catch (error) {
    console.error("Error updating room name displays:", error);
  }
}

document.getElementById("back-to-chat").addEventListener("click", () => {
  showPage(chatRoomPage);
  
  // Mark room as read when returning to chat
  if (currentRoomName && currentUser.id) {
    try {
      const memberRef = doc(db, "rooms", currentRoomName, "members", currentUser.id);
      updateDoc(memberRef, {
        lastReadTimestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error marking room as read:", error);
    }
  }
});

document.getElementById("leave-chat").addEventListener("click", async () => {
  if (!currentRoomName) {
    alert("No room selected");
    return;
  }

  // Get fresh room name for confirmation dialog
  let roomDisplayName = currentRoomName;
  try {
    const roomRef = doc(db, "rooms", currentRoomName);
    const roomSnap = await getDoc(roomRef);
    
    if (roomSnap.exists()) {
      const roomData = roomSnap.data();
      if (roomData.type === "private" && roomData.participants) {
        const otherParticipant = roomData.participants.find(name => name !== currentUser.name);
        roomDisplayName = otherParticipant || 'Private Chat';
      } else {
        roomDisplayName = roomData.name || currentRoomName;
      }
    }
  } catch (error) {
    console.error("Error getting room name for confirmation:", error);
  }

  // Check if user is the room creator/admin
  let isRoomCreator = false;
  let roomData = null;
  
  try {
    const roomRef = doc(db, "rooms", currentRoomName);
    const roomSnap = await getDoc(roomRef);
    
    if (roomSnap.exists()) {
      roomData = roomSnap.data();
      isRoomCreator = roomData.createdBy === currentUser.name;
    }
  } catch (error) {
    console.error("Error checking room creator:", error);
  }

  // Different confirmation messages based on role
  let confirmMessage;
  if (isRoomCreator) {
    confirmMessage = `WARNING: You are the creator of "${roomDisplayName}".\n\nLeaving will DELETE the entire room for all members!\n\nAre you sure you want to delete this room permanently?`;
  } else {
    // Prevent non-creators from leaving if this is their only room
    try {
      const allRoomsSnapshot = await getDocs(collection(db, "rooms"));
      let userRoomCount = 0;
      
      for (const roomDoc of allRoomsSnapshot.docs) {
        const memberRef = doc(db, "rooms", roomDoc.id, "members", currentUser.id);
        const memberSnap = await getDoc(memberRef);
        if (memberSnap.exists()) {
          userRoomCount++;
        }
      }
      
      if (userRoomCount <= 1) {
        alert("You cannot leave your last remaining room");
        return;
      }
    } catch (error) {
      console.error("Error checking room count:", error);
    }
    
    confirmMessage = `Are you sure you want to leave "${roomDisplayName}"?\n\nYou will no longer see messages from this room.`;
  }

  const confirmLeave = confirm(confirmMessage);
  
  if (confirmLeave) {
    try {
      if (isRoomCreator) {
        // Creator leaving = DELETE ENTIRE ROOM
        console.log(`Room creator leaving - deleting entire room: ${currentRoomName}`);
        
        // Delete all messages in the room
        const messagesSnapshot = await getDocs(collection(db, "rooms", currentRoomName, "messages"));
        const deleteMessagePromises = messagesSnapshot.docs.map(messageDoc => 
          deleteDoc(doc(db, "rooms", currentRoomName, "messages", messageDoc.id))
        );
        await Promise.all(deleteMessagePromises);
        
        // Delete all members in the room
        const membersSnapshot = await getDocs(collection(db, "rooms", currentRoomName, "members"));
        const deleteMemberPromises = membersSnapshot.docs.map(memberDoc => 
          deleteDoc(doc(db, "rooms", currentRoomName, "members", memberDoc.id))
        );
        await Promise.all(deleteMemberPromises);
        
        // Delete the room itself
        const roomRef = doc(db, "rooms", currentRoomName);
        await deleteDoc(roomRef);
        
        alert(`Room "${roomDisplayName}" has been deleted for all members`);
        
      } else {
        // Regular member leaving = just remove them
        const memberRef = doc(db, "rooms", currentRoomName, "members", currentUser.id);
        await deleteDoc(memberRef);
        
        alert(`You have left "${roomDisplayName}"`);
      }
      
      console.log(`Successfully processed leave request for: ${currentRoomName}`);
      
      // Go back to chat list and refresh rooms
      showPage(chatListPage);
      populateRooms();
      
      // Clear current room
      currentRoomName = null;
      
    } catch (error) {
      console.error("Error leaving/deleting room:", error);
      alert("Error processing request. Please try again.");
    }
  }
});

document.getElementById("send-message").addEventListener("click", async () => {
    const text = document.getElementById("message-input").value.trim();
    if (!text) return;

     await sendMessage(text);

    document.getElementById("message-input").value = "";
  });

  document.getElementById("message-input").addEventListener("keypress", e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      document.getElementById("send-message").click();
    }
  });

document.getElementById("paste-message").addEventListener("click", async () => {
  const messageInput = document.getElementById("message-input");
  
  // Method 1: Modern clipboard API (iPhone + newer Android)
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      const text = await navigator.clipboard.readText();
      messageInput.value = text;
      messageInput.focus();
      return;
    }
  } catch (err) {
    // Continue to fallback methods
  }
  
  // Method 2: Direct paste into the actual message input (like Total Battle probably does)
  try {
    // Store original state
    const originalValue = messageInput.value;
    const originalStart = messageInput.selectionStart;
    const originalEnd = messageInput.selectionEnd;
    
    // Focus and select all in the actual input field
    messageInput.focus();
    messageInput.setSelectionRange(0, messageInput.value.length);
    
    // Try to paste directly into the target input
    const success = document.execCommand('paste');
    
    // If paste didn't work or no change occurred, restore original state
    setTimeout(() => {
      if (!success || messageInput.value === originalValue) {
        messageInput.value = originalValue;
        messageInput.setSelectionRange(originalStart, originalEnd);
      }
      messageInput.focus();
    }, 100);
    
    return;
    
  } catch (err) {
    console.log("Direct input paste failed:", err);
  }
  
  // Method 3: Invisible input overlay method
  try {
    const overlay = document.createElement('input');
    overlay.type = 'text';
    overlay.style.position = 'fixed';
    overlay.style.top = '50%';
    overlay.style.left = '50%';
    overlay.style.transform = 'translate(-50%, -50%)';
    overlay.style.zIndex = '999999';
    overlay.style.opacity = '0.01';
    overlay.style.width = '100px';
    overlay.style.height = '50px';
    overlay.style.fontSize = '16px';
    overlay.style.border = 'none';
    overlay.style.background = 'transparent';
    
    document.body.appendChild(overlay);
    
    // Force focus and paste
    overlay.focus();
    overlay.click();
    overlay.select();
    
    // Multiple paste attempts
    document.execCommand('selectAll');
    document.execCommand('paste');
    
    setTimeout(() => {
      if (overlay.value) {
        messageInput.value = overlay.value;
        messageInput.focus();
      }
      document.body.removeChild(overlay);
    }, 200);
    
  } catch (err) {
    console.log("Overlay method failed:", err);
    
    // Final fallback - focus the target input
    messageInput.focus();
  }
});

// open contacts page & populate list
document.getElementById("contacts").addEventListener("click", () => {
  console.log("CONTACTS CLICKED!");
showPage(contactsPage);
  populateContacts();
});

async function populateContacts() {
  const listEl = document.getElementById("contacts-list");
  listEl.innerHTML = "Loading…";

  try {
    const snapshot = await getDocs(collection(db, "users"));
    console.log("Got snapshot:", snapshot);

    listEl.innerHTML = "";

    if (snapshot.empty) {
      listEl.innerHTML = "<li>No members found.</li>";
    } else {
      snapshot.forEach(doc => {
        const userData = doc.data();
        const memberData = {
          name: userData.name,
          role: userData.role || "Member",
          id: doc.id,
          avatar: userData.avatar
        };
        
        const li = document.createElement("li");
        li.textContent = userData.name + (userData.role === "Administrator" ? " (Admin)" : "");
        li.style.cursor = "pointer";
        
        // Add click listener to show member menu
        li.addEventListener("click", (e) => {
          showMemberMenu(e.target, memberData);
        });
        
        listEl.appendChild(li);
      });
    }
  } catch (err) {
    listEl.innerHTML = `<li>Error loading members: ${err.message}</li>`;
    console.error(err);
  }
}

document.getElementById("back-to-rooms-from-contacts").addEventListener("click", () => {
  showPage(chatListPage);
});

document.getElementById("find-chat").addEventListener("click", () => {
  showFindChatModal();
});

function showFindChatModal() {
  document.getElementById('find-chat-modal').classList.remove('hidden');
  document.getElementById('find-chat-input').value = '';
  document.getElementById('find-chat-input').focus();
}

function closeFindChatModal() {
  document.getElementById('find-chat-modal').classList.add('hidden');
}

// Event listeners for the find chat modal
document.getElementById('find-chat-close-btn').addEventListener('click', closeFindChatModal);

document.getElementById('find-chat-join-btn').addEventListener('click', async () => {
  const roomName = document.getElementById('find-chat-input').value.trim();
  if (!roomName) {
    alert("Please enter a room name");
    return;
  }
  
  await findAndJoinRoom(roomName);
  closeFindChatModal();
});

// Allow Enter key to join
document.getElementById('find-chat-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('find-chat-join-btn').click();
  }
});

// Close modal when clicking outside
document.getElementById('find-chat-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('find-chat-modal')) {
    closeFindChatModal();
  }
});

async function findAndJoinRoom(searchName) {
  try {
    console.log("Searching for room:", searchName);
    
    // Get all rooms from Firebase
    const allRoomsSnapshot = await getDocs(collection(db, "rooms"));
    let foundRoom = null;
    
    // Search for room (case-insensitive)
    allRoomsSnapshot.forEach((roomDoc) => {
      const roomData = roomDoc.data();
      const roomName = roomData.name || roomDoc.id;
      
      // Case-insensitive comparison
      if (roomName.toLowerCase() === searchName.toLowerCase()) {
        foundRoom = {
          id: roomDoc.id,
          data: roomData
        };
      }
    });

    if (!foundRoom) {
      alert("This chat does not exist");
      return;
    }

    // Check if user is already a member
    const memberRef = doc(db, "rooms", foundRoom.id, "members", currentUser.id);
    const memberSnap = await getDoc(memberRef);
    
    if (memberSnap.exists()) {
      alert("You are already a member of this room");
      return;
    }

    // Add user to the room
    const memberData = {
      name: currentUser.name,
      role: "Member", // New members always start as Member
      joinedAt: serverTimestamp()
    };
    
    if (currentUser.avatar) {
      memberData.avatar = currentUser.avatar;
    }
    
    await setDoc(memberRef, memberData);
    
    console.log(`Successfully joined room: ${foundRoom.data.name}`);
    alert(`Successfully joined "${foundRoom.data.name}"!`);
    
    // Refresh room list to show the new room
    populateRooms();
    
  } catch (error) {
    console.error("Error finding/joining room:", error);
    alert("Error searching for room. Please try again.");
  }
}
  
  const modalCloseBtn = document.getElementById("modal-close");
  const modal = document.getElementById("message-modal");
  modalCloseBtn.onclick = () => modal.style.display = "none";

  populateRooms();
  showPage(chatListPage);

  // ============ INVITE SYSTEM ============
class InviteSystem {
  constructor() {
    this.selectedContacts = new Set();
    this.allContacts = [];
    this.currentRoomMembers = new Set();
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('invite-confirm-btn').addEventListener('click', () => {
      this.confirmInvites();
    });

    document.getElementById('invite-close-btn').addEventListener('click', () => {
      this.closeModal();
    });

    document.getElementById('invite-search-input').addEventListener('input', (e) => {
      this.filterContacts(e.target.value);
    });

    document.getElementById('invite-modal').addEventListener('click', (e) => {
      if (e.target === document.getElementById('invite-modal')) {
        this.closeModal();
      }
    });
  }

  async openModal(currentRoomName, currentRoomMembers = []) {
    this.currentRoomName = currentRoomName;
    this.currentRoomMembers = new Set(currentRoomMembers.map(m => m.id || m.name));
    this.selectedContacts.clear();
    
    document.getElementById('invite-modal').classList.remove('hidden');
    await this.loadContacts();
    document.getElementById('invite-search-input').value = '';
    this.updateConfirmButton();
  }

  closeModal() {
    document.getElementById('invite-modal').classList.add('hidden');
    this.selectedContacts.clear();
  }

  async loadContacts() {
    const listEl = document.getElementById('invite-contacts-list');
    listEl.innerHTML = '<li class="invite-loading">Loading contacts...</li>';

    try {
      const snapshot = await getDocs(collection(db, "users"));
      this.allContacts = [];
      
      snapshot.forEach(doc => {
        const userData = doc.data();
        this.allContacts.push({
          id: doc.id,
          name: userData.name,
          role: userData.role || "Member",
          avatar: userData.avatar
        });
      });

      this.allContacts = this.allContacts.filter(contact => contact.id !== currentUser.id);
      this.renderContacts(this.allContacts);
      
    } catch (error) {
      console.error('Error loading contacts:', error);
      listEl.innerHTML = '<li class="invite-empty">Error loading contacts</li>';
    }
  }

  renderContacts(contacts) {
    const listEl = document.getElementById('invite-contacts-list');
    
    if (contacts.length === 0) {
      listEl.innerHTML = '<li class="invite-empty">No contacts found</li>';
      return;
    }

    listEl.innerHTML = '';
    
    contacts.forEach(contact => {
      const isAlreadyMember = this.currentRoomMembers.has(contact.id) || this.currentRoomMembers.has(contact.name);
      
      const li = document.createElement('li');
      li.className = `invite-contact-item ${isAlreadyMember ? 'already-member' : ''}`;
      
      li.innerHTML = `
        <input type="checkbox" 
               class="invite-checkbox" 
               data-contact-id="${contact.id}"
               ${isAlreadyMember ? 'disabled' : ''}
               ${this.selectedContacts.has(contact.id) ? 'checked' : ''}>
        <span class="invite-contact-name">
          ${contact.name} ${contact.role === 'Administrator' ? '(Admin)' : ''}
        </span>
        ${isAlreadyMember ? '<span class="already-member-text">Already in room</span>' : ''}
      `;

      if (!isAlreadyMember) {
        const checkbox = li.querySelector('.invite-checkbox');
        checkbox.addEventListener('change', (e) => {
          if (e.target.checked) {
            this.selectedContacts.add(contact.id);
          } else {
            this.selectedContacts.delete(contact.id);
          }
          this.updateConfirmButton();
        });

        li.addEventListener('click', (e) => {
          if (e.target !== checkbox) {
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
          }
        });
      }

      listEl.appendChild(li);
    });
  }

  filterContacts(searchTerm) {
    const filtered = this.allContacts.filter(contact => 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    this.renderContacts(filtered);
  }

  updateConfirmButton() {
    const confirmBtn = document.getElementById('invite-confirm-btn');
    confirmBtn.disabled = this.selectedContacts.size === 0;
  }

  async confirmInvites() {
    if (this.selectedContacts.size === 0) return;

    const confirmBtn = document.getElementById('invite-confirm-btn');
    const originalText = confirmBtn.innerHTML;
    confirmBtn.innerHTML = '⏳';
    confirmBtn.disabled = true;

    try {
      const selectedContactDetails = this.allContacts.filter(contact => 
        this.selectedContacts.has(contact.id)
      );

      // Batch all the member additions
      const invitePromises = selectedContactDetails.map(contact => {
        const memberRef = doc(db, "rooms", this.currentRoomName, "members", contact.id);
        
        const memberData = {
          name: contact.name,
          role: contact.role || "Member",
          joinedAt: serverTimestamp()
        };
        
        if (contact.avatar) {
          memberData.avatar = contact.avatar;
        }
        
        return setDoc(memberRef, memberData, { merge: true });
      });

      // Execute all invites in parallel
      await Promise.all(invitePromises);

      // Update room's last activity to trigger real-time updates
      const roomRef = doc(db, "rooms", this.currentRoomName);
      await updateDoc(roomRef, {
        lastMessage: `${selectedContactDetails.length} member(s) invited`,
        lastMessageTimestamp: serverTimestamp(),
        lastMessageBy: currentUser.id
      });

      const names = selectedContactDetails.map(c => c.name).join(', ');
      alert(`Successfully invited ${names}!`);

      this.closeModal();
      
      // The real-time listeners will automatically update everything!
      populateMembers();
      
    } catch (error) {
      console.error('Error inviting members:', error);
      alert('Error inviting members. Please try again.');
    } finally {
      confirmBtn.innerHTML = originalText;
      confirmBtn.disabled = false;
    }
  }
}

let inviteSystem;

// Cleanup function
function cleanupRealTimeListeners() {
  console.log("Cleaning up real-time listeners");
  
  if (roomsListener) {
    roomsListener();
    roomsListener = null;
  }
  
  if (userMembershipsListener) {
    userMembershipsListener();
    userMembershipsListener = null;
  }
  
  if (unsubscribeMessages) {
    unsubscribeMessages();
    unsubscribeMessages = null;
  }
}

// Add cleanup on page unload
window.addEventListener('beforeunload', cleanupRealTimeListeners);
window.addEventListener('pagehide', cleanupRealTimeListeners);

});
