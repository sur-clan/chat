import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs,
  setDoc,
  doc,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const app = initializeApp(window.firebaseConfig);
const db = getFirestore(app);




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
    document.getElementById("room-name").textContent = currentRoomName;
    showPage(chatRoomPage);
    populateMessages();
    populateMembers();

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
      showPage(chatRoomPage);

console.log("Joining room:", currentRoomName, "as user:", currentUser);

if (!currentUser.id) {
  console.error("❌ currentUser.id is undefined!");
  return;
}

try {
  const memberRef = doc(db, "rooms", currentRoomName, "members", currentUser.id);
const memberData = {
  name: currentUser.name,
  role: currentUser.role
};
if (currentUser.avatar) {
  memberData.avatar = currentUser.avatar;
}
await setDoc(memberRef, memberData, { merge: true });




  
  console.log("✅ Member added to:", currentRoomName);
} catch (err) {
  console.error("🔥 Failed to add member:", err);
}


  populateMessages();
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

async function populateMessages() {
    const msgsDiv = document.getElementById("messages");
    msgsDiv.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "rooms", currentRoomName, "messages"));
  
  querySnapshot.forEach((doc) => {
    const msg = doc.data();

    if (blockedMembers.has(msg.senderName)) return;
    if (mutedMembers.has(msg.senderName) && currentUser.role === "Administrator") return;

      
    const wrapper = document.createElement("div");
    wrapper.className = "message-scroll";
    wrapper.classList.add(msg.senderName === currentUser.name ? "my-message" : "other-message");

      const content = document.createElement("div");
      content.className = "message-content";
    content.innerHTML = `
      <div class="message-header">${msg.senderName}</div>
      <div class="message-body">${msg.text.replace(/\n/g, "<br>")}</div>
      <div class="message-time">${msg.timestamp?.toDate().toLocaleTimeString() || ''}</div>
    `;

    
      content.addEventListener("click", () => {
        showModal(msg, wrapper);
      });

      wrapper.appendChild(content);


    if (msg.senderName !== currentUser.name) {
      const actions = document.createElement("div");
      actions.className = "message-actions";

      const translateBtn = document.createElement("button");
      translateBtn.textContent = "🌐";
      translateBtn.addEventListener("click", () => {
        alert("Translate message");
      });

      actions.appendChild(translateBtn);
      wrapper.appendChild(actions);
    }

   

      msgsDiv.appendChild(wrapper);
    });
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










  function showModal(msg, wrapper) {
    const modal = document.getElementById("message-modal");
    const textElem = document.getElementById("modal-message-text");
    const replyBtn = document.getElementById("modal-reply");
    const copyBtn = document.getElementById("modal-copy");
    const closeBtn = document.getElementById("modal-close");


 // Save original message HTML if not already saved
  if (!wrapper.dataset.originalHtml) {
    wrapper.dataset.originalHtml = wrapper.innerHTML;
  }


 // Format message for modal (styled like chat)
  textElem.innerHTML = `
    <div class="message-scroll ${msg.user === currentUser.name ? "my-message" : "other-message"}">
      <div class="message-content">
        <div class="message-header">${msg.user}</div>
        <div class="message-body">${msg.text.replace(/\n/g, "<br>")}</div>
      </div>
    </div>
  `;

    modal.classList.remove("hidden");

replyBtn.style.display = "inline-block";
  copyBtn.style.display = "inline-block";
  closeBtn.style.display = "inline-block";

replyBtn.onclick = () => {
    document.getElementById("message-input").value = `${msg.user}, `;
    modal.classList.add("hidden");
  };

  copyBtn.onclick = () => {
    const formatted = `${msg.date} ${msg.time} ${msg.user}:\n${msg.text}`;
    navigator.clipboard.writeText(formatted)
      .then(() => alert("✅ Message copied!"))
      .catch(err => alert("❌ Failed to copy: " + err));
    modal.classList.add("hidden");
  };


 closeBtn.onclick = () => {
    modal.classList.add("hidden");
  };


// Remove any previous extra hide button
const oldHideBtn = document.getElementById("modal-hide");
if (oldHideBtn) oldHideBtn.remove();

if (currentUser.role === "Administrator") {
  const hideBtn = document.createElement("button");
  hideBtn.id = "modal-hide";
  hideBtn.style.marginLeft = "8px";

  const contentDiv = wrapper.querySelector(".message-content");

  // Check if already hidden
  if (contentDiv.dataset.original) {
    hideBtn.textContent = "Unhide";
  } else {
    hideBtn.textContent = "Hide";
  }

  closeBtn.parentElement.insertBefore(hideBtn, closeBtn);

  hideBtn.onclick = () => {
    if (!contentDiv.dataset.original) {
      // Save original and hide
      contentDiv.dataset.original = contentDiv.innerHTML;
      contentDiv.innerHTML = `
        <div style="font-style: italic; color: gray;">
          This message has been hidden by admin.
          <button id="unhide-btn">Unhide</button>
        </div>`;

      contentDiv.querySelector("#unhide-btn").onclick = (e) => {
        e.stopPropagation(); // prevent triggering modal on click
        contentDiv.innerHTML = contentDiv.dataset.original;
        delete contentDiv.dataset.original;
      };
    } else {
      // Already hidden → unhide
      contentDiv.innerHTML = contentDiv.dataset.original;
      delete contentDiv.dataset.original;
    }

    modal.classList.add("hidden");
  };
}



   

 
  }

  // search bar
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
  const roomName = prompt("Enter a name for the new room:");
  if (!roomName) return;

  const roomId = roomName.replace(/\s+/g, "_").toLowerCase(); // e.g., "My Room" → "my_room"
  const roomRef = doc(db, "rooms", roomId);

  const now = new Date().toISOString();

  // Save the new room
  await setDoc(roomRef, {
    name: roomName,
    createdBy: currentUser.name,
    createdAt: now,
    lastMessage: "Room created",
    unread: false
  });


   // Add yourself to the new room
  await setDoc(doc(db, "rooms", roomId, "members", currentUser.id), {
    name: currentUser.name,
    role: currentUser.role,
    avatar: currentUser.avatar
  });

  
  populateRooms();
});



  
  document.getElementById("back-btn").addEventListener("click", () => showPage(chatListPage));
  document.getElementById("back-to-rooms").addEventListener("click", () => showPage(chatListPage));



 document.getElementById("view-members").addEventListener("click", () => {
  showPage(membersListPage);
  document.querySelector('#members-list #room-name').textContent = currentRoomName;
  populateMembers();
});




  document.getElementById("back-to-chat").addEventListener("click", () => showPage(chatRoomPage));

  document.getElementById("send-message").addEventListener("click", () => {
    const text = document.getElementById("message-input").value.trim();
    if (!text) return;

    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString();

    const wrapper = document.createElement("div");
    wrapper.className = "message-scroll my-message";

    const content = document.createElement("div");
    content.className = "message-content";

    content.innerHTML = `
      <div class="message-header">${currentUser.name}</div>
      <div class="message-body">${text.replace(/\n/g, "<br>")}</div>
      <div class="message-time">${time}</div>
    `;

    content.addEventListener("click", () => {
      const msgObj = { user: currentUser.name, text, time, date };
      showModal(msgObj, wrapper);
    });

    wrapper.appendChild(content);
    document.getElementById("messages").appendChild(wrapper);


 // 🪄 Auto-scroll to the bottom after sending
  const msgsDiv = document.getElementById("messages");
msgsDiv.scrollTo({ top: msgsDiv.scrollHeight, behavior: "smooth" });


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
  showPage(document.getElementById("contacts-page"));
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
