import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs,
  setDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const app = initializeApp(window.firebaseConfig);
const db = getFirestore(app);

async function translateWithDetection(text, targetLang = "en") {
  const apiKey = "APIKEY";  // 🔁 Replace this with your real key
  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        q: text,
        target: targetLang,
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
    console.error("❌ Translate error:", err);
    return {
      translated: "[Translation failed]",
      detectedSourceLanguage: "unknown"
    };
  }
}

function languageNameFromCode(code) {
  const names = {
    af: "Afrikaans", ar: "Arabic", az: "Azerbaijani", be: "Belarusian",
    bg: "Bulgarian", bn: "Bengali", ca: "Catalan", cs: "Czech",
    da: "Danish", de: "German", el: "Greek", en: "English",
    es: "Spanish", et: "Estonian", fa: "Persian", fi: "Finnish",
    fr: "French", gu: "Gujarati", he: "Hebrew", hi: "Hindi",
    hr: "Croatian", hu: "Hungarian", id: "Indonesian", it: "Italian",
    ja: "Japanese", ka: "Georgian", ko: "Korean", lt: "Lithuanian",
    lv: "Latvian", ml: "Malayalam", mr: "Marathi", ms: "Malay",
    nl: "Dutch", no: "Norwegian", pa: "Punjabi", pl: "Polish",
    pt: "Portuguese", ro: "Romanian", ru: "Russian", sk: "Slovak",
    sl: "Slovenian", sr: "Serbian", sv: "Swedish", ta: "Tamil",
    te: "Telugu", th: "Thai", tr: "Turkish", uk: "Ukrainian",
    ur: "Urdu", vi: "Vietnamese", zh: "Chinese"
  };
  return names[code] || code;
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



// 🪄 Wait for Wix to send the member info
window.addEventListener("message", async (event) => {
if (!event.origin.endsWith("sur-clan.com")) return;

  const userData = event.data;
  if (!userData || !userData.id) return;
  
  console.log("✅ Got userData from Wix:", userData);

  currentUser = {
    name: userData.name,
    role: "Member",
    id: userData.id,
    avatar: userData.avatar
  };

  console.log("✅ Got userData from Wix:", currentUser);

  // prepare user data without undefined
  const userPayload = {
    name: currentUser.name,
    role: currentUser.role,
  };
  if (currentUser.avatar != null) {
    userPayload.avatar = currentUser.avatar;
  }

  // save to users/
  const userRef = doc(db, "users", currentUser.id);
  await setDoc(userRef, userPayload, { merge: true });

  // and add to default room
  const roomId = "general"; // 👈 default room

  try {
    const memberPayload = {
      name: currentUser.name,
      role: currentUser.role,
    };
    if (currentUser.avatar != null) {
      memberPayload.avatar = currentUser.avatar;
    }

    const memberRef = doc(db, "rooms", roomId, "members", currentUser.id);
    await setDoc(memberRef, memberPayload, { merge: true });

    console.log("✅ Added user to default room:", roomId);

    currentRoomName = roomId;
    populateRooms(); // ✅ Load the list of rooms
    showPage(chatListPage);
  

  } catch (err) {
    console.error("🔥 Failed to add user to default room:", err);
  }
});



const sendMessage = async (text) => {
  const messagesRef = collection(db, "rooms", currentRoomName, "messages");

  await addDoc(messagesRef, {
    senderId: currentUser.id,
    senderName: currentUser.name,
    text: text,
    timestamp: serverTimestamp()
  });
};





  function showPage(page) {
    pages.forEach(p => p.classList.remove("active"));
    page.classList.add("active");
  }

    async function populateRooms() {
    const roomsUl = document.getElementById("rooms");
    roomsUl.innerHTML = "";

    const querySnapshot = await getDocs(collection(db, "rooms"));

      
  querySnapshot.forEach((roomDoc) => {  // ✅ renamed from (doc) to (roomDoc)
    const room = roomDoc.data();

    
      const li = document.createElement("li");
    li.innerHTML = `
      <strong>${room.name || 'Unnamed Room'}</strong><br>
      <small>${room.lastMessage || ''}</small>`;

    li.addEventListener("click", async () => {
      currentRoomName = roomDoc.id;
      document.getElementById("room-name").textContent = currentRoomName;

 const msgsDiv = document.getElementById("messages");

  // 🚀 Clear immediately and show loading
  msgsDiv.innerHTML = `<div style="text-align:center; color:gold;">Loading messages…</div>`;


      
      showPage(chatRoomPage);

console.log("Joining room:", currentRoomName, "as user:", currentUser);

if (!currentUser.id) {
  console.error("❌ currentUser.id is undefined!");
  return;
}

try {
  const memberRef = doc(db, "rooms", currentRoomName, "members", currentUser.id);
  const existingMemberSnap = await getDoc(memberRef);

  if (existingMemberSnap.exists()) {
    // ✅ Member already exists – don’t overwrite role
    const existingData = existingMemberSnap.data();

    // 🔄 Sync local role with Firestore role
    if (existingData.role) {
      currentUser.role = existingData.role;
    }

    // ✅ Only update name/avatar (never touch role again)
    await setDoc(memberRef, {
      name: currentUser.name,
      avatar: currentUser.avatar || null
    }, { merge: true });

  } else {
    // 🚀 First time joining – set the role
    const memberData = {
      name: currentUser.name,
      role: currentUser.role,
      avatar: currentUser.avatar || null
    };
    await setDoc(memberRef, memberData);
  }

  console.log("✅ Member added to:", currentRoomName);
} catch (err) {
  console.error("🔥 Failed to add member:", err);
}


      


  safePopulateMessages();
});


      if (room.unread) {
        const icon = document.createElement("span");
        icon.className = "unread-envelope";
        icon.innerHTML = "✉";
        li.appendChild(icon);
      }
      roomsUl.appendChild(li);
    });
  }

let unsubscribeMessages = null;

function populateMessages() {
  if (!currentRoomName) {
    console.error("❌ currentRoomName is not set yet");
    return;
  }
 if (!currentUser.role) {
    console.warn("⚠️ populateMessages() called before role was set – stopping");
    return;
  }
  
  const msgsDiv = document.getElementById("messages");



 // 🧹 Stop the old listener *first*
  if (unsubscribeMessages) {
    unsubscribeMessages();
    unsubscribeMessages = null;
  }

  // clear messages & show placeholder immediately
msgsDiv.innerHTML = `<div style="text-align:center; color:gold;">Loading messages…</div>`;

  const messagesRef = collection(db, "rooms", currentRoomName, "messages");
  const q = query(messagesRef, orderBy("timestamp"));

    unsubscribeMessages = onSnapshot(q, (snapshot) => {
    const frag = document.createDocumentFragment();  

  if (snapshot.empty) {
    msgsDiv.innerHTML = `<div style="text-align:center; color:gray;">No messages yet…</div>`;
    return;
  }

    snapshot.forEach((doc) => {
      const msg = doc.data();


    if (blockedMembers.has(msg.senderName)) return;
    if (mutedMembers.has(msg.senderName) && currentUser.role === "Administrator") return;

      
    const wrapper = document.createElement("div");
    wrapper.className = "message-scroll";
    wrapper.dataset.messageId = doc.id;  // ✅ so we know which Firestore doc to update
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



    
      content.addEventListener("click", () => {
        showModal(msg, wrapper);
      });

      wrapper.appendChild(content);


    if (msg.senderName !== currentUser.name) {
      const actions = document.createElement("div");
      actions.className = "message-actions";

      const translateBtn = document.createElement("button");
      translateBtn.textContent = "🌐";
      
   translateBtn.addEventListener("click", async () => {
  const messageBody = wrapper.querySelector(".message-body");

  // Toggle: if already translated, revert to original
  if (messageBody.dataset.originalText) {
    messageBody.innerHTML = messageBody.dataset.originalText;
    delete messageBody.dataset.originalText;
    return;
  }

  // Save original HTML before translation
  messageBody.dataset.originalText = messageBody.innerHTML;

  const result = await translateWithDetection(msg.text, "en"); // translate to English

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

    // Clear & append everything at once to prevent flicker
    msgsDiv.innerHTML = "";
    msgsDiv.appendChild(frag);

    // Auto-scroll to bottom
    msgsDiv.scrollTo({ top: msgsDiv.scrollHeight, behavior: "smooth" });
    });
  }


async function safePopulateMessages(retries = 10) {
   if (!currentUser.role) {
     if (retries <= 0) {
       console.error("❌ Role not loaded after multiple attempts.");
       return;
     }
     console.log("⏳ Waiting for role to load...");
     await new Promise(resolve => setTimeout(resolve, 300)); 
     return safePopulateMessages(retries - 1);
   }
   populateMessages();
}





  

 async function populateMembers() {
  const membersUl = document.getElementById("members");
  membersUl.innerHTML = "";

     if (!currentRoomName) return;

const querySnapshot = await getDocs(collection(db, "rooms", currentRoomName, "members"));
  const members = [];
  querySnapshot.forEach((doc) => {
    members.push(doc.data());
  });

  members.forEach(m => {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = `${m.name} ${m.role === "Administrator" ? "(Admin)" : ""}`;
    nameSpan.style.cursor = "pointer";

    nameSpan.addEventListener("click", (e) => {
      showMemberMenu(e.target, m);
    });

    li.appendChild(nameSpan);

    if (currentUser.role === "Administrator" && m.name !== currentUser.name) {
      const btn = document.createElement("button");
      btn.textContent = "❌";
      btn.addEventListener("click", () => {
        if (confirm(`Remove ${m.name} from this room?`)) {
          const idx = members.findIndex(mem => mem.name === m.name);
          if (idx !== -1) {
            members.splice(idx, 1);
            populateMembers();
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

    menu.innerHTML = `
      <button id="menu-info">📄 Profile</button>
      <button id="menu-message">📩 Message</button>
      <button id="menu-block">🚫 Block</button>
      <button id="menu-mute">🔇 Mute</button>
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
      blockMember(member.name);
      menu.remove();
    document.removeEventListener("click", closeMemberMenu);
    };

    const muteBtn = menu.querySelector("#menu-mute");
    if (currentUser.role !== "Administrator") {
      muteBtn.disabled = true;
      muteBtn.title = "Only admins can mute";
    } else {
      muteBtn.onclick = () => {
        muteMember(member.name);
        menu.remove();
      document.removeEventListener("click", closeMemberMenu);

      };
    }
  }





  function startPrivateChat(name) {
    alert(`Starting private chat with ${name}`);
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
    blockedMembers.add(name);
    alert(`${name} is now blocked (you won’t see their future messages)`);
  }

  function muteMember(name) {
    mutedMembers.add(name);
    alert(`${name} is now muted (hidden for everyone)`);
  }










async function showModal(msg, wrapper) {
  // ✅ 1. Double-check your role before opening the modal
  try {
    const memberRef = doc(db, "rooms", currentRoomName, "members", currentUser.id);
    const memberSnap = await getDoc(memberRef);
    if (memberSnap.exists()) {
      const data = memberSnap.data();
      if (data.role) {
        currentUser.role = data.role;  // 🔄 Always refresh local role from Firestore
      }
    }
  } catch (err) {
    console.error("⚠️ Could not refresh role before showing modal:", err);
    // ⚠️ We won’t stop the modal from opening if the role check fails
  }

  // ✅ 2. Get modal elements
  const modal = document.getElementById("message-modal");
  const textElem = document.getElementById("modal-message-text");
  const replyBtn = document.getElementById("modal-reply");
  const copyBtn = document.getElementById("modal-copy");
  const closeBtn = document.getElementById("modal-close");

  // ✅ 3. Build modal content
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

  // ✅ 4. Show modal
  modal.classList.remove("hidden");

  // ✅ 5. Show reply/copy/close buttons
  replyBtn.style.display = "inline-block";
  copyBtn.style.display = "inline-block";
  closeBtn.style.display = "inline-block";

  // ✅ Reply to the sender (always replies to the name, even if hidden)
  replyBtn.onclick = () => {
    document.getElementById("message-input").value = `${msg.senderName}, `;
    modal.classList.add("hidden");
  };

  // ✅ Copy the message (blocked if hidden)
  copyBtn.onclick = () => {
    if (msg.hidden) {
      alert("⚠️ This message is hidden and cannot be copied.");
      modal.classList.add("hidden");
      return;
    }

    const ts = msg.timestamp?.toDate ? msg.timestamp.toDate() : new Date();
    const formatted = `${ts.toLocaleDateString()} ${ts.toLocaleTimeString()} ${msg.senderName}:\n${msg.text}`;
    navigator.clipboard.writeText(formatted)
      .then(() => alert("✅ Message copied!"))
      .catch(err => alert("❌ Failed to copy: " + err));
    modal.classList.add("hidden");
  };

  // ✅ Close modal
  closeBtn.onclick = () => {
    modal.classList.add("hidden");
  };

  // ✅ 6. Remove any previous Hide/Unhide button
  const oldHideBtn = document.getElementById("modal-hide");
  if (oldHideBtn) oldHideBtn.remove();

  // ✅ 7. Add Hide/Unhide button ONLY if user is an Administrator
  if (currentUser.role === "Administrator") {
    const hideBtn = document.createElement("button");
    hideBtn.id = "modal-hide";
    hideBtn.style.marginLeft = "8px";
    hideBtn.textContent = msg.hidden ? "Unhide" : "Hide";  // ✅ dynamic label

    closeBtn.parentElement.insertBefore(hideBtn, closeBtn);

    // ✅ Hide/unhide toggle logic
    hideBtn.onclick = async () => {
      const msgRef = doc(db, "rooms", currentRoomName, "messages", wrapper.dataset.messageId);

      if (!msg.hidden) {
        await updateDoc(msgRef, { hidden: true });
      } else {
        await updateDoc(msgRef, { hidden: false });
      }

      modal.classList.add("hidden");
    };
  }
}




   

 
  



// contacts search bar

    document.getElementById("contacts-search").addEventListener("input", (e) => {
  const term = e.target.value.trim().toLowerCase();
  const contactsUl = document.getElementById("contacts-list");
  const lis = contactsUl.querySelectorAll("li");

  lis.forEach(li => {
    const name = li.textContent.trim().toLowerCase();
    li.style.display = name.startsWith(term) ? "flex" : "none";
  });
});


  
  // member search bar
  document.getElementById("member-search").addEventListener("input", (e) => {
    const term = e.target.value.trim().toLowerCase();
    const membersUl = document.getElementById("members");
    const lis = membersUl.querySelectorAll("li");

    lis.forEach(li => {
      const name = li.querySelector("span").textContent.toLowerCase();
      li.style.display = name.startsWith(term) ? "flex" : "none";
    });

    // keep full count correct
    updateMemberCount();
  });

  document.getElementById("invite-member").addEventListener("click", () => {
    const name = prompt("Enter new member name:");
    if (name) {
      members.push({ name, role: "Member" });
      populateMembers();
    }
  });

document.getElementById("create-room").addEventListener("click", async () => {
 if (!currentUser || !currentUser.id || !currentUser.name) {
    alert("❌ Cannot create room — currentUser is not ready yet.");
    console.error("currentUser object is incomplete:", currentUser);
    return;
  }

  
  const roomName = prompt("Enter a name for the new room:");
  if (!roomName) return;

 if (!currentUser?.id || !currentUser.name) {
    alert("❌ Cannot create room — currentUser is not ready yet.");
    console.error("🚫 currentUser is not set properly:", currentUser);
    return;
  }
  
  const roomId = roomName.replace(/\s+/g, "_").toLowerCase(); // e.g., "My Room" → "my_room"
  const roomRef = doc(db, "rooms", roomId);

  const now = new Date().toISOString();

 try {
    // Save the room document
    await setDoc(roomRef, {
      name: roomName,
      createdBy: currentUser.name,
      createdAt: now,
      lastMessage: "Room created",
      unread: false
    });

   
// Add self to members subcollection with Administrator role
console.log("📥 Creating admin member doc...");

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

   currentUser.role = "Administrator";  // 🪄 You are now admin!

console.log("✅ Admin member doc created.");

    console.log(`✅ Room '${roomName}' created and ${currentUser.name} added as Administrator`);

 
  populateRooms();
  } catch (err) {
    console.error("🔥 Error creating room or adding admin member:", err);
    alert("Error creating room — see console.");
  }
});



  
  document.getElementById("back-btn").addEventListener("click", () => showPage(chatListPage));
  document.getElementById("back-to-rooms").addEventListener("click", () => showPage(chatListPage));



 document.getElementById("view-members").addEventListener("click", () => {
  showPage(membersListPage);
  document.querySelector('#members-list #room-name').textContent = currentRoomName;
  populateMembers();
});




  document.getElementById("back-to-chat").addEventListener("click", () => showPage(chatRoomPage));

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

  document.getElementById("paste-message").addEventListener("click", () => {
    navigator.clipboard.readText().then(text => {
      document.getElementById("message-input").value = text;
    });
  });

  document.getElementById("leave-chat").addEventListener("click", () => {
    if (!currentRoomName) return;
    const idx = rooms.findIndex(r => r.name === currentRoomName);
    if (idx !== -1) rooms.splice(idx, 1);
    populateRooms();
    showPage(chatListPage);
  });

// open contacts page & populate list
document.getElementById("contacts").addEventListener("click", () => {
  console.log("📣 CONTACTS CLICKED!");
showPage(contactsPage);
  populateContacts();
});

async function populateContacts() {
  const listEl = document.getElementById("contacts-list");
  listEl.innerHTML = "Loading…";

  try {
    const snapshot = await getDocs(collection(db, "users"));
    console.log("📄 Got snapshot:", snapshot);

    listEl.innerHTML = "";

    if (snapshot.empty) {
      listEl.innerHTML = "<li>No members found.</li>";
    } else {
      snapshot.forEach(doc => {
        const m = doc.data();
        const li = document.createElement("li");
        li.textContent = m.name + (m.role === "Administrator" ? " (Admin)" : "");
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



  
  document.getElementById("find-chat").addEventListener("click", () => alert("Show find chat modal."));

  const modalCloseBtn = document.getElementById("modal-close");
  const modal = document.getElementById("message-modal");
  modalCloseBtn.onclick = () => modal.style.display = "none";


  populateRooms();
  showPage(chatListPage);

});
