// MUONS School Media Unit Portal (MVP)
// Requires global: auth, db, SV (serverTimestamp)

let currentUser = null;
let currentUserData = null;
let currentPage = "dashboard";
let submissionsTab = "mine";

const STAFF_ROLES = new Set(["admin","teacher","president","vice-president","secretary","organizer","technical","coordinator"]);

function isStaff() {
  const r = (currentUserData?.role || "member").toLowerCase();
  return STAFF_ROLES.has(r);
}

function showError(msg) {
  const el = document.getElementById("errorMsg");
  if (!el) return;
  el.textContent = msg;
  el.style.display = msg ? "block" : "none";
}

function hidePreloader() {
  const p = document.getElementById("preloader");
  if (p) p.style.display = "none";
}

function fmtDate(d) {
  if (!d) return "—";
  if (typeof d.toDate === "function") d = d.toDate();
  const dd = new Date(d);
  return isNaN(dd.getTime()) ? "—" : dd.toLocaleString();
}

async function ensureUserDoc(user) {
  const ref = db.collection("users").doc(user.uid);
  const snap = await ref.get();

  if (snap.exists) return snap.data();

  const fallbackName = (user.email || "user").split("@")[0];
  const doc = {
    uid: user.uid,
    email: user.email || "",
    name: user.displayName || fallbackName,
    role: "member",
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || fallbackName)}&background=00aaff&color=fff`,
    phone: "",
    bio: "",
    isActive: true,
    createdAt: SV()
  };

  await ref.set(doc, { merge: true });
  return doc;
}

function showLoginPage() {
  document.getElementById("loginPage").style.display = "flex";
  document.getElementById("portalPage").style.display = "none";
}

function showPortal() {
  document.getElementById("loginPage").style.display = "none";
  document.getElementById("portalPage").style.display = "flex";

  const name = currentUserData?.name || (currentUser.email || "User");
  document.getElementById("userName").textContent = name;
  document.getElementById("welcomeName").textContent = name.split(" ")[0] || name;
  document.getElementById("sidebarRole").textContent = (currentUserData?.role || "member");

  // profile form fill
  document.getElementById("pName").value = currentUserData?.name || "";
  document.getElementById("pRole").value = currentUserData?.role || "member";
  document.getElementById("pAvatar").value = currentUserData?.avatar || "";
  document.getElementById("pBio").value = currentUserData?.bio || "";
  document.getElementById("pPhone").value = currentUserData?.phone || "";
}

function switchPage(page) {
  // hide all pages
  document.querySelectorAll(".page-content").forEach(p => p.style.display = "none");
  document.querySelectorAll(".nav-item").forEach(a => a.classList.remove("active"));

  // show selected
  const el = document.getElementById(page + "Page");
  if (el) el.style.display = "block";

  const nav = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (nav) nav.classList.add("active");

  document.getElementById("pageTitle").textContent = page.charAt(0).toUpperCase() + page.slice(1);
  currentPage = page;

  // load page data
  loadPage(page);
}

async function loadPage(page) {
  if (!currentUser) return;

  if (page === "dashboard") return loadDashboard();
  if (page === "announcements") return loadAnnouncements();
  if (page === "events") return loadEvents();
  if (page === "submissions") return loadSubmissions();
  if (page === "library") return loadLibrary();
  if (page === "equipment") return loadEquipment();
  if (page === "training") return loadTraining();
  if (page === "attendance") return loadAttendancePage();
  if (page === "profile") return; // already populated
}

// ---------------- AUTH ----------------
document.addEventListener("DOMContentLoaded", () => {
  hidePreloader();

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    showError("");

    const email = document.getElementById("email").value.trim();
    const pass = document.getElementById("password").value.trim();

    try {
      await auth.signInWithEmailAndPassword(email, pass);
    } catch (err) {
      showError(err.message);
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await auth.signOut();
  });

  // nav
  document.querySelectorAll(".nav-item").forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      switchPage(a.getAttribute("data-page"));
    });
  });

  // dashboard quick goto buttons
  document.querySelectorAll("[data-goto]").forEach(btn => {
    btn.addEventListener("click", () => switchPage(btn.getAttribute("data-goto")));
  });

  // profile update
  document.getElementById("profileForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const ref = db.collection("users").doc(currentUser.uid);
    const snap = await ref.get();
    const old = snap.data();

    const update = {
      name: document.getElementById("pName").value.trim(),
      avatar: document.getElementById("pAvatar").value.trim(),
      bio: document.getElementById("pBio").value.trim(),
      phone: document.getElementById("pPhone").value.trim(),
      // role cannot be changed by user:
      role: old.role
    };

    await ref.update(update);
    currentUserData = { ...currentUserData, ...update };
    showPortal();
    alert("Profile saved!");
  });

  // auth state
  auth.onAuthStateChanged(async (user) => {
    hidePreloader();

    if (!user) {
      currentUser = null;
      currentUserData = null;
      showLoginPage();
      return;
    }

    currentUser = user;
    currentUserData = await ensureUserDoc(user);

    showPortal();
    switchPage("dashboard");
  });
});

// ---------------- DASHBOARD ----------------
async function loadDashboard() {
  // stats
  const [usersSnap, eventsSnap, subsSnap, eqSnap] = await Promise.all([
    db.collection("users").get(),
    db.collection("events").get(),
    db.collection("submissions").get(),
    db.collection("equipment").get()
  ]);

  document.getElementById("statMembers").textContent = usersSnap.size;
  document.getElementById("statEvents").textContent = eventsSnap.size;
  document.getElementById("statEquipment").textContent = eqSnap.size;

  // pending submissions count (staff sees all, members see own)
  let pendingCount = 0;
  subsSnap.forEach(d => {
    const s = d.data();
    if (s.status === "pending" && (isStaff() || s.uid === currentUser.uid)) pendingCount++;
  });
  document.getElementById("statPendingSubs").textContent = pendingCount;

  // latest announcements
  const aSnap = await db.collection("announcements").orderBy("createdAt", "desc").limit(3).get();
  const dashA = document.getElementById("dashAnnouncements");
  dashA.innerHTML = aSnap.empty ? `<div class="meta">No announcements</div>` : "";
  aSnap.forEach(d => {
    const a = d.data();
    dashA.innerHTML += `<div class="item"><div class="badge ${a.pinned ? "good" : ""}">${a.pinned ? "Pinned" : "Info"}</div><h3>${a.title}</h3><div class="meta">${fmtDate(a.createdAt)}</div></div>`;
  });

  // my recent submissions
  const mySnap = await db.collection("submissions")
    .where("uid", "==", currentUser.uid)
    .orderBy("createdAt", "desc")
    .limit(3)
    .get();

  const dashS = document.getElementById("dashMySubs");
  dashS.innerHTML = mySnap.empty ? `<div class="meta">No submissions yet</div>` : "";
  mySnap.forEach(d => {
    const s = d.data();
    dashS.innerHTML += `<div class="item"><div class="badge">${s.status}</div><h3>${s.title}</h3><div class="meta">${fmtDate(s.createdAt)}</div></div>`;
  });
}

// ---------------- ANNOUNCEMENTS ----------------
function bindAnnouncementUI() {
  const btn = document.getElementById("btnNewAnnouncement");
  const form = document.getElementById("announcementForm");
  const cancel = document.getElementById("aCancel");

  btn.onclick = () => {
    if (!isStaff()) return alert("Only staff can publish announcements.");
    form.style.display = "block";
  };
  cancel.onclick = () => (form.style.display = "none");

  form.onsubmit = async (e) => {
    e.preventDefault();
    if (!isStaff()) return alert("Only staff can publish announcements.");

    await db.collection("announcements").add({
      title: document.getElementById("aTitle").value.trim(),
      body: document.getElementById("aBody").value.trim(),
      pinned: document.getElementById("aPinned").value === "true",
      createdAt: SV(),
      createdBy: currentUser.uid
    });

    form.reset();
    form.style.display = "none";
    loadAnnouncements();
  };
}

async function loadAnnouncements() {
  bindAnnouncementUI();

  const list = document.getElementById("announcementsList");
  list.innerHTML = "";

  const snap = await db.collection("announcements").orderBy("createdAt", "desc").get();
  if (snap.empty) {
    list.innerHTML = `<div class="item"><div class="meta">No announcements yet.</div></div>`;
    return;
  }

  snap.forEach(doc => {
    const a = doc.data();
    list.innerHTML += `
      <div class="item">
        ${a.pinned ? `<span class="badge good">Pinned</span>` : `<span class="badge">Notice</span>`}
        <h3>${a.title}</h3>
        <div class="meta">${fmtDate(a.createdAt)}</div>
        <p style="margin-top:.6rem;color:rgba(245,247,255,.8)">${a.body}</p>
        ${isStaff() ? `<div class="form-actions" style="margin-top:.75rem;">
            <button class="ghost-btn" type="button" data-del-ann="${doc.id}">Delete</button>
          </div>` : ""}
      </div>
    `;
  });

  list.querySelectorAll("[data-del-ann]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!isStaff()) return;
      if (!confirm("Delete this announcement?")) return;
      await db.collection("announcements").doc(btn.getAttribute("data-del-ann")).delete();
      loadAnnouncements();
    });
  });
}

// ---------------- EVENTS & ASSIGNMENTS ----------------
function bindEventUI() {
  const btn = document.getElementById("btnNewEvent");
  const form = document.getElementById("eventForm");
  const cancel = document.getElementById("eCancel");

  btn.onclick = () => {
    if (!isStaff()) return alert("Only staff can create events.");
    form.style.display = "block";
  };
  cancel.onclick = () => (form.style.display = "none");

  form.onsubmit = async (e) => {
    e.preventDefault();
    if (!isStaff()) return alert("Only staff can create events.");

    await db.collection("events").add({
      title: document.getElementById("eTitle").value.trim(),
      date: document.getElementById("eDate").value,
      time: document.getElementById("eTime").value || "",
      location: document.getElementById("eLocation").value.trim(),
      brief: document.getElementById("eBrief").value.trim(),
      createdAt: SV(),
      createdBy: currentUser.uid
    });

    form.reset();
    form.style.display = "none";
    loadEvents();
  };
}

async function loadEvents() {
  bindEventUI();

  const list = document.getElementById("eventsList");
  list.innerHTML = "";

  const snap = await db.collection("events").orderBy("date", "desc").get();
  if (snap.empty) {
    list.innerHTML = `<div class="item"><div class="meta">No events created.</div></div>`;
    await fillEventsDropdowns(); // keep dropdowns safe
    return;
  }

  // used by other pages
  await fillEventsDropdowns();

  // members list for assignment select
  const usersSnap = await db.collection("users").orderBy("name", "asc").get();
  const members = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  snap.forEach(doc => {
    const e = doc.data();
    const id = doc.id;

    list.innerHTML += `
      <div class="item">
        <span class="badge">Event</span>
        <h3>${e.title}</h3>
        <div class="meta">${e.date || "—"} ${e.time || ""} · ${e.location || ""}</div>
        ${e.brief ? `<p style="margin-top:.6rem;color:rgba(245,247,255,.8)">${e.brief}</p>` : ""}

        <div class="form-actions" style="justify-content:flex-start;margin-top:1rem;">
          <button class="small-btn" type="button" data-toggle-assign="${id}">Assignments</button>
          ${isStaff() ? `<button class="small-btn" type="button" data-del-event="${id}">Delete</button>` : ""}
        </div>

        <div id="assignWrap-${id}" style="display:none;margin-top:1rem;">
          ${isStaff() ? `
          <form class="form-card" data-assign-form="${id}" style="margin:0;">
            <div class="form-grid">
              <div class="form-group">
                <label>Member</label>
                <select data-assign-member="${id}"></select>
              </div>
              <div class="form-group">
                <label>Role</label>
                <select data-assign-role="${id}">
                  <option value="photography">Photography</option>
                  <option value="videography">Videography</option>
                  <option value="editing">Editing</option>
                  <option value="design">Design</option>
                  <option value="social">Social Media</option>
                  <option value="live">Live Coverage</option>
                </select>
              </div>
              <div class="form-group full">
                <label>Notes</label>
                <input data-assign-notes="${id}" type="text" placeholder="Call time / shot list">
              </div>
            </div>
            <div class="form-actions">
              <button class="primary-btn" type="submit">Assign</button>
            </div>
          </form>
          ` : `<div class="meta">Assignments are view-only for members.</div>`}

          <div id="assignList-${id}" class="list" style="margin-top:1rem;"></div>
        </div>
      </div>
    `;
  });

  // bind toggles + delete
  list.querySelectorAll("[data-toggle-assign]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const eventId = btn.getAttribute("data-toggle-assign");
      const wrap = document.getElementById("assignWrap-" + eventId);
      wrap.style.display = wrap.style.display === "none" ? "block" : "none";
      await loadAssignments(eventId);

      // populate members dropdown if staff
      if (isStaff()) {
        const select = document.querySelector(`[data-assign-member="${eventId}"]`);
        if (select && select.options.length === 0) {
          const usersSnap = await db.collection("users").orderBy("name","asc").get();
          usersSnap.forEach(u => {
            const d = u.data();
            const opt = document.createElement("option");
            opt.value = u.id;
            opt.textContent = d.name || d.email || u.id;
            select.appendChild(opt);
          });
        }

        const form = document.querySelector(`[data-assign-form="${eventId}"]`);
        if (form && !form.dataset.bound) {
          form.dataset.bound = "1";
          form.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!isStaff()) return;

            const memberId = document.querySelector(`[data-assign-member="${eventId}"]`).value;
            const role = document.querySelector(`[data-assign-role="${eventId}"]`).value;
            const notes = document.querySelector(`[data-assign-notes="${eventId}"]`).value.trim();

            const memberDoc = await db.collection("users").doc(memberId).get();
            const member = memberDoc.data();

            await db.collection("events").doc(eventId).collection("assignments").add({
              uid: memberId,
              name: member?.name || "",
              role,
              notes,
              createdAt: SV(),
              createdBy: currentUser.uid
            });

            document.querySelector(`[data-assign-notes="${eventId}"]`).value = "";
            await loadAssignments(eventId);
          });
        }
      }
    });
  });

  list.querySelectorAll("[data-del-event]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!isStaff()) return;
      const id = btn.getAttribute("data-del-event");
      if (!confirm("Delete this event?")) return;
      await db.collection("events").doc(id).delete();
      loadEvents();
    });
  });
}

async function loadAssignments(eventId) {
  const target = document.getElementById("assignList-" + eventId);
  if (!target) return;

  const snap = await db.collection("events").doc(eventId).collection("assignments").orderBy("createdAt","desc").get();
  target.innerHTML = snap.empty ? `<div class="item"><div class="meta">No assignments yet.</div></div>` : "";

  snap.forEach(doc => {
    const a = doc.data();
    target.innerHTML += `
      <div class="item">
        <span class="badge good">${a.role}</span>
        <h3>${a.name || "Member"}</h3>
        <div class="meta">${a.notes || "—"}</div>
        ${isStaff() ? `<div class="form-actions" style="margin-top:.5rem;">
          <button class="ghost-btn" type="button" data-del-assign="${eventId}|${doc.id}">Remove</button>
        </div>` : ""}
      </div>
    `;
  });

  target.querySelectorAll("[data-del-assign]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!isStaff()) return;
      const [eId, aId] = btn.getAttribute("data-del-assign").split("|");
      await db.collection("events").doc(eId).collection("assignments").doc(aId).delete();
      loadAssignments(eId);
    });
  });
}

// ---------------- SUBMISSIONS & APPROVAL ----------------
function bindSubmissionUI() {
  const btn = document.getElementById("btnNewSubmission");
  const form = document.getElementById("submissionForm");
  const cancel = document.getElementById("sCancel");

  btn.onclick = async () => {
    form.style.display = "block";
    await fillEventsDropdowns();
  };
  cancel.onclick = () => (form.style.display = "none");

  form.onsubmit = async (e) => {
    e.preventDefault();
    await db.collection("submissions").add({
      uid: currentUser.uid,
      authorName: currentUserData?.name || "",
      eventId: document.getElementById("sEvent").value,
      type: document.getElementById("sType").value,
      title: document.getElementById("sTitle").value.trim(),
      link: document.getElementById("sLink").value.trim(),
      description: document.getElementById("sDesc").value.trim(),
      status: "pending",
      feedback: "",
      createdAt: SV(),
      reviewedAt: null,
      reviewedBy: ""
    });

    form.reset();
    form.style.display = "none";
    loadSubmissions();
  };

  // tabs
  document.querySelectorAll(".tab").forEach(t => {
    t.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      submissionsTab = t.getAttribute("data-subtab");
      loadSubmissions();
    });
  });
}

async function loadSubmissions() {
  bindSubmissionUI();
  await fillEventsDropdowns();

  const list = document.getElementById("submissionsList");
  list.innerHTML = "";

  const snap = await db.collection("submissions").orderBy("createdAt","desc").limit(50).get();
  const items = [];
  snap.forEach(d => items.push({ id: d.id, ...d.data() }));

  let filtered = items;

  if (submissionsTab === "mine") {
    filtered = items.filter(s => s.uid === currentUser.uid);
  } else if (submissionsTab === "pending") {
    filtered = items.filter(s => s.status === "pending");
  } else if (submissionsTab === "all") {
    if (!isStaff()) {
      list.innerHTML = `<div class="item"><div class="meta">Staff only.</div></div>`;
      return;
    }
  }

  if (filtered.length === 0) {
    list.innerHTML = `<div class="item"><div class="meta">No submissions.</div></div>`;
    return;
  }

  for (const s of filtered) {
    const canReview = isStaff();
    const canEdit = s.uid === currentUser.uid && s.status === "pending";

    list.innerHTML += `
      <div class="item">
        <span class="badge">${s.status}</span>
        <span class="badge good">${s.type}</span>
        <h3>${s.title}</h3>
        <div class="meta">By: ${s.authorName || "—"} · ${fmtDate(s.createdAt)}</div>
        <div class="meta">Event: ${s.eventId || "—"}</div>
        <p style="margin-top:.6rem;color:rgba(245,247,255,.85)">${s.description || ""}</p>
        <p style="margin-top:.4rem"><a href="${s.link}" target="_blank" rel="noopener" style="color:var(--primary);text-decoration:none;word-break:break-all">Open Link</a></p>

        ${s.feedback ? `<div class="item" style="margin-top:.8rem;background:rgba(0,0,0,.18)">
          <span class="badge warn">Feedback</span>
          <div style="color:rgba(245,247,255,.85)">${s.feedback}</div>
        </div>` : ""}

        <div class="form-actions" style="justify-content:flex-start;margin-top:.8rem;">
          ${canEdit ? `<button class="small-btn" type="button" data-edit-sub="${s.id}">Edit Link/Desc</button>` : ""}
          ${canReview ? `<button class="small-btn" type="button" data-approve="${s.id}">Approve</button>` : ""}
          ${canReview ? `<button class="small-btn" type="button" data-changes="${s.id}">Needs Changes</button>` : ""}
          ${canReview ? `<button class="small-btn" type="button" data-reject="${s.id}">Reject</button>` : ""}
          ${canReview ? `<button class="small-btn" type="button" data-publish="${s.id}">Publish to Library</button>` : ""}
        </div>
      </div>
    `;
  }

  // review actions
  list.querySelectorAll("[data-approve]").forEach(b => b.addEventListener("click", () => reviewSubmission(b.dataset.approve, "approved")));
  list.querySelectorAll("[data-reject]").forEach(b => b.addEventListener("click", () => reviewSubmission(b.dataset.reject, "rejected")));
  list.querySelectorAll("[data-changes]").forEach(b => b.addEventListener("click", async () => {
    const id = b.dataset.changes;
    const feedback = prompt("Enter feedback / required changes:");
    if (feedback === null) return;
    await reviewSubmission(id, "changes", feedback);
  }));

  list.querySelectorAll("[data-edit-sub]").forEach(b => b.addEventListener("click", async () => {
    const id = b.dataset.editSub;
    const doc = await db.collection("submissions").doc(id).get();
    const s = doc.data();
    if (!s || s.uid !== currentUser.uid || s.status !== "pending") return;

    const newLink = prompt("Update link:", s.link || "");
    if (newLink === null) return;
    const newDesc = prompt("Update description:", s.description || "");
    if (newDesc === null) return;

    await db.collection("submissions").doc(id).update({ link: newLink.trim(), description: newDesc.trim() });
    loadSubmissions();
  }));

  list.querySelectorAll("[data-publish]").forEach(b => b.addEventListener("click", () => publishSubmissionToLibrary(b.dataset.publish)));
}

async function reviewSubmission(id, status, feedback = "") {
  if (!isStaff()) return alert("Staff only.");

  await db.collection("submissions").doc(id).update({
    status,
    feedback: feedback || "",
    reviewedAt: SV(),
    reviewedBy: currentUser.uid
  });

  loadSubmissions();
}

async function publishSubmissionToLibrary(id) {
  if (!isStaff()) return alert("Staff only.");
  const subDoc = await db.collection("submissions").doc(id).get();
  if (!subDoc.exists) return;

  const s = subDoc.data();

  await db.collection("media").add({
    eventId: s.eventId || "",
    type: s.type || "other",
    title: s.title || "Untitled",
    link: s.link || "",
    tags: [],
    createdAt: SV(),
    createdBy: currentUser.uid,
    sourceSubmissionId: id
  });

  alert("Published to Media Library.");
  switchPage("library");
}

// ---------------- MEDIA LIBRARY ----------------
function bindMediaUI() {
  const btn = document.getElementById("btnNewMedia");
  const form = document.getElementById("mediaForm");
  const cancel = document.getElementById("mCancel");

  btn.onclick = async () => {
    if (!isStaff()) return alert("Staff only.");
    form.style.display = "block";
    await fillEventsDropdowns();
  };
  cancel.onclick = () => (form.style.display = "none");

  form.onsubmit = async (e) => {
    e.preventDefault();
    if (!isStaff()) return alert("Staff only.");

    const tags = document.getElementById("mTags").value
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    await db.collection("media").add({
      eventId: document.getElementById("mEvent").value,
      type: document.getElementById("mType").value,
      title: document.getElementById("mTitle").value.trim(),
      link: document.getElementById("mLink").value.trim(),
      tags,
      createdAt: SV(),
      createdBy: currentUser.uid
    });

    form.reset();
    form.style.display = "none";
    loadLibrary();
  };
}

async function loadLibrary() {
  bindMediaUI();
  await fillEventsDropdowns();

  const grid = document.getElementById("libraryGrid");
  grid.innerHTML = "";

  const snap = await db.collection("media").orderBy("createdAt","desc").limit(60).get();
  if (snap.empty) {
    grid.innerHTML = `<div class="card"><div class="meta">No approved media yet.</div></div>`;
    return;
  }

  snap.forEach(doc => {
    const m = doc.data();
    const tags = (m.tags || []).slice(0, 6).map(t => `<span class="badge">${t}</span>`).join(" ");
    grid.innerHTML += `
      <div class="card">
        <span class="badge good">${m.type || "media"}</span>
        <h3 style="margin:.5rem 0;">${m.title || "Untitled"}</h3>
        <div class="meta">Event: ${m.eventId || "—"}</div>
        <div class="meta" style="margin-top:.35rem;">${fmtDate(m.createdAt)}</div>
        <div style="margin-top:.6rem;">${tags}</div>
        <div style="margin-top:.8rem;">
          <a href="${m.link}" target="_blank" rel="noopener">Open Link</a>
        </div>
        ${isStaff() ? `<div class="form-actions" style="margin-top:.8rem;">
          <button class="ghost-btn" type="button" data-del-media="${doc.id}">Delete</button>
        </div>` : ""}
      </div>
    `;
  });

  grid.querySelectorAll("[data-del-media]").forEach(b => b.addEventListener("click", async () => {
    if (!isStaff()) return;
    if (!confirm("Delete from library?")) return;
    await db.collection("media").doc(b.dataset.delMedia).delete();
    loadLibrary();
  }));
}

// ---------------- EQUIPMENT + BOOKINGS ----------------
function bindEquipmentUI() {
  const btn = document.getElementById("btnNewEquipment");
  const form = document.getElementById("equipmentForm");
  const cancel = document.getElementById("eqCancel");

  btn.onclick = () => {
    if (!isStaff()) return alert("Staff only.");
    form.style.display = "block";
  };
  cancel.onclick = () => (form.style.display = "none");

  form.onsubmit = async (e) => {
    e.preventDefault();
    if (!isStaff()) return alert("Staff only.");

    await db.collection("equipment").add({
      name: document.getElementById("eqName").value.trim(),
      category: document.getElementById("eqCat").value,
      serial: document.getElementById("eqSerial").value.trim(),
      condition: document.getElementById("eqCondition").value,
      notes: document.getElementById("eqNotes").value.trim(),
      status: "available",
      createdAt: SV(),
      createdBy: currentUser.uid
    });

    form.reset();
    form.style.display = "none";
    loadEquipment();
  };

  // booking request
  document.getElementById("bookingForm").onsubmit = async (e) => {
    e.preventDefault();

    await db.collection("equipmentBookings").add({
      uid: currentUser.uid,
      name: currentUserData?.name || "",
      itemId: document.getElementById("bItem").value,
      from: document.getElementById("bFrom").value,
      to: document.getElementById("bTo").value,
      purpose: document.getElementById("bPurpose").value.trim(),
      status: "requested",
      createdAt: SV()
    });

    document.getElementById("bookingForm").reset();
    loadEquipment();
  };
}

async function loadEquipment() {
  bindEquipmentUI();

  const eqList = document.getElementById("equipmentList");
  const bookingsList = document.getElementById("bookingsList");
  const itemSelect = document.getElementById("bItem");

  eqList.innerHTML = "";
  bookingsList.innerHTML = "";
  itemSelect.innerHTML = "";

  const eqSnap = await db.collection("equipment").orderBy("createdAt","desc").get();
  if (eqSnap.empty) {
    eqList.innerHTML = `<div class="meta">No equipment items.</div>`;
  } else {
    eqSnap.forEach(doc => {
      const e = doc.data();
      const conditionBadge = e.condition === "good" ? "good" : (e.condition === "fair" ? "warn" : "bad");

      eqList.innerHTML += `
        <div class="item">
          <span class="badge good">${e.category}</span>
          <span class="badge ${conditionBadge}">${e.condition}</span>
          <h3>${e.name}</h3>
          <div class="meta">${e.serial || ""} · Status: ${e.status || "available"}</div>
          ${e.notes ? `<div class="meta" style="margin-top:.4rem;">${e.notes}</div>` : ""}
          ${isStaff() ? `<div class="form-actions" style="justify-content:flex-start;margin-top:.75rem;">
            <button class="small-btn" type="button" data-del-eq="${doc.id}">Delete</button>
          </div>` : ""}
        </div>
      `;

      // booking dropdown
      const opt = document.createElement("option");
      opt.value = doc.id;
      opt.textContent = `${e.name} (${e.category})`;
      itemSelect.appendChild(opt);
    });
  }

  // bookings
  const bSnap = await db.collection("equipmentBookings").orderBy("createdAt","desc").limit(30).get();
  const bookings = [];
  bSnap.forEach(d => bookings.push({ id: d.id, ...d.data() }));

  // staff sees all, members see own
  const visible = isStaff() ? bookings : bookings.filter(b => b.uid === currentUser.uid);

  if (visible.length === 0) {
    bookingsList.innerHTML = `<div class="meta">No bookings.</div>`;
  } else {
    visible.forEach(b => {
      bookingsList.innerHTML += `
        <div class="item">
          <span class="badge">${b.status}</span>
          <h3>${b.purpose}</h3>
          <div class="meta">By: ${b.name || "—"}</div>
          <div class="meta">From: ${b.from}</div>
          <div class="meta">To: ${b.to}</div>
          ${isStaff() ? `<div class="form-actions" style="justify-content:flex-start;margin-top:.75rem;">
            <button class="small-btn" type="button" data-approve-book="${b.id}">Approve</button>
            <button class="small-btn" type="button" data-reject-book="${b.id}">Reject</button>
            <button class="small-btn" type="button" data-return-book="${b.id}">Returned</button>
          </div>` : ""}
        </div>
      `;
    });
  }

  // staff booking actions
  bookingsList.querySelectorAll("[data-approve-book]").forEach(btn => btn.addEventListener("click", async () => {
    if (!isStaff()) return;
    await db.collection("equipmentBookings").doc(btn.dataset.approveBook).update({ status: "approved" });
    loadEquipment();
  }));
  bookingsList.querySelectorAll("[data-reject-book]").forEach(btn => btn.addEventListener("click", async () => {
    if (!isStaff()) return;
    await db.collection("equipmentBookings").doc(btn.dataset.rejectBook).update({ status: "rejected" });
    loadEquipment();
  }));
  bookingsList.querySelectorAll("[data-return-book]").forEach(btn => btn.addEventListener("click", async () => {
    if (!isStaff()) return;
    await db.collection("equipmentBookings").doc(btn.dataset.returnBook).update({ status: "returned" });
    loadEquipment();
  }));

  // delete equipment
  eqList.querySelectorAll("[data-del-eq]").forEach(btn => btn.addEventListener("click", async () => {
    if (!isStaff()) return;
    if (!confirm("Delete equipment item?")) return;
    await db.collection("equipment").doc(btn.dataset.delEq).delete();
    loadEquipment();
  }));
}

// ---------------- TRAINING ----------------
function bindTrainingUI() {
  const btn = document.getElementById("btnNewTraining");
  const form = document.getElementById("trainingForm");
  const cancel = document.getElementById("tCancel");

  btn.onclick = () => {
    if (!isStaff()) return alert("Staff only.");
    form.style.display = "block";
  };
  cancel.onclick = () => (form.style.display = "none");

  form.onsubmit = async (e) => {
    e.preventDefault();
    if (!isStaff()) return alert("Staff only.");

    await db.collection("training").add({
      title: document.getElementById("tTitle").value.trim(),
      category: document.getElementById("tCat").value,
      link: document.getElementById("tLink").value.trim(),
      description: document.getElementById("tDesc").value.trim(),
      createdAt: SV(),
      createdBy: currentUser.uid
    });

    form.reset();
    form.style.display = "none";
    loadTraining();
  };
}

async function loadTraining() {
  bindTrainingUI();

  const list = document.getElementById("trainingList");
  list.innerHTML = "";

  const [tSnap, cSnap] = await Promise.all([
    db.collection("training").orderBy("createdAt","desc").limit(60).get(),
    db.collection("trainingCompletions").where("uid","==",currentUser.uid).get()
  ]);

  const completed = new Set();
  cSnap.forEach(d => completed.add(d.data().resourceId));

  if (tSnap.empty) {
    list.innerHTML = `<div class="item"><div class="meta">No training resources yet.</div></div>`;
    return;
  }

  tSnap.forEach(doc => {
    const t = doc.data();
    const done = completed.has(doc.id);

    list.innerHTML += `
      <div class="item">
        <span class="badge good">${t.category}</span>
        ${done ? `<span class="badge good">Completed</span>` : `<span class="badge warn">Not Completed</span>`}
        <h3>${t.title}</h3>
        <div class="meta">${t.description || ""}</div>
        <div style="margin-top:.6rem;">
          <a href="${t.link}" target="_blank" rel="noopener" style="color:var(--primary);text-decoration:none;word-break:break-all">Open Resource</a>
        </div>
        <div class="form-actions" style="justify-content:flex-start;margin-top:.75rem;">
          ${done
            ? `<button class="ghost-btn" type="button" data-undone="${doc.id}">Mark Incomplete</button>`
            : `<button class="small-btn" type="button" data-done="${doc.id}">Mark Completed</button>`
          }
          ${isStaff() ? `<button class="ghost-btn" type="button" data-del-tr="${doc.id}">Delete</button>` : ""}
        </div>
      </div>
    `;
  });

  list.querySelectorAll("[data-done]").forEach(btn => btn.addEventListener("click", async () => {
    await db.collection("trainingCompletions").add({
      uid: currentUser.uid,
      resourceId: btn.dataset.done,
      completedAt: SV()
    });
    loadTraining();
  }));

  list.querySelectorAll("[data-undone]").forEach(btn => btn.addEventListener("click", async () => {
    // delete completion doc(s) for this resource
    const snap = await db.collection("trainingCompletions")
      .where("uid","==",currentUser.uid)
      .where("resourceId","==",btn.dataset.undone)
      .get();

    const batch = db.batch();
    snap.forEach(d => batch.delete(d.ref));
    await batch.commit();

    loadTraining();
  }));

  list.querySelectorAll("[data-del-tr]").forEach(btn => btn.addEventListener("click", async () => {
    if (!isStaff()) return;
    if (!confirm("Delete resource?")) return;
    await db.collection("training").doc(btn.dataset.delTr).delete();
    loadTraining();
  }));
}

// ---------------- ATTENDANCE ----------------
async function loadAttendancePage() {
  await fillEventsDropdowns();
  document.getElementById("btnLoadAttendance").onclick = loadAttendanceForEvent;
  await loadMyAttendance();
}

async function loadAttendanceForEvent() {
  const eventId = document.getElementById("attEvent").value;
  const editor = document.getElementById("attendanceEditor");
  editor.innerHTML = "";

  if (!eventId) return;

  if (!isStaff()) {
    editor.innerHTML = `<div class="meta">Staff only can edit attendance.</div>`;
    return;
  }

  const usersSnap = await db.collection("users").orderBy("name","asc").get();
  const attSnap = await db.collection("events").doc(eventId).collection("attendance").get();

  const existing = new Map();
  attSnap.forEach(d => existing.set(d.data().uid, { id: d.id, ...d.data() }));

  let html = `<div class="meta" style="margin-bottom:.75rem;">Mark attendance for selected event:</div>`;
  html += `<div class="list">`;

  usersSnap.forEach(doc => {
    const u = doc.data();
    const uid = doc.id;
    const record = existing.get(uid);
    const status = record?.status || "absent";

    html += `
      <div class="item">
        <h3>${u.name || u.email || uid}</h3>
        <div class="meta">Role: ${u.role || "member"}</div>
        <div class="form-actions" style="justify-content:flex-start;margin-top:.6rem;">
          <button class="small-btn" type="button" data-att="${uid}|present">Present</button>
          <button class="small-btn" type="button" data-att="${uid}|late">Late</button>
          <button class="ghost-btn" type="button" data-att="${uid}|absent">Absent</button>
          <span class="badge ${status==="present"?"good":status==="late"?"warn":"bad"}">Current: ${status}</span>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  editor.innerHTML = html;

  editor.querySelectorAll("[data-att]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const [uid, status] = btn.dataset.att.split("|");

      // find existing doc
      const snap = await db.collection("events").doc(eventId).collection("attendance").where("uid","==",uid).limit(1).get();
      if (snap.empty) {
        await db.collection("events").doc(eventId).collection("attendance").add({
          uid, status, markedAt: SV(), markedBy: currentUser.uid
        });
      } else {
        await snap.docs[0].ref.update({ status, markedAt: SV(), markedBy: currentUser.uid });
      }
      loadAttendanceForEvent();
      loadMyAttendance();
    });
  });
}

async function loadMyAttendance() {
  const target = document.getElementById("myAttendanceList");
  target.innerHTML = "";

  // read attendance across events: simplest way is scan events and subcollections in UI MVP
  const eventsSnap = await db.collection("events").orderBy("date","desc").limit(30).get();
  if (eventsSnap.empty) {
    target.innerHTML = `<div class="meta">No events.</div>`;
    return;
  }

  let found = 0;
  for (const eDoc of eventsSnap.docs) {
    const eventId = eDoc.id;
    const e = eDoc.data();

    const attSnap = await db.collection("events").doc(eventId).collection("attendance")
      .where("uid","==",currentUser.uid)
      .limit(1)
      .get();

    if (!attSnap.empty) {
      const a = attSnap.docs[0].data();
      found++;

      target.innerHTML += `
        <div class="item">
          <h3>${e.title}</h3>
          <div class="meta">${e.date || ""} ${e.time || ""}</div>
          <span class="badge ${a.status==="present"?"good":a.status==="late"?"warn":"bad"}">${a.status}</span>
        </div>
      `;
    }
  }

  if (!found) {
    target.innerHTML = `<div class="meta">No attendance records for you yet.</div>`;
  }
}

// ---------------- SHARED: fill event dropdowns ----------------
async function fillEventsDropdowns() {
  const snap = await db.collection("events").orderBy("date","desc").limit(100).get();
  const events = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  const sEvent = document.getElementById("sEvent");
  const mEvent = document.getElementById("mEvent");
  const attEvent = document.getElementById("attEvent");

  [sEvent, mEvent, attEvent].forEach(sel => {
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = "";
    events.forEach(e => {
      const opt = document.createElement("option");
      opt.value = e.id;
      opt.textContent = `${e.title} (${e.date || "—"})`;
      sel.appendChild(opt);
    });
    if (prev) sel.value = prev;
  });
}