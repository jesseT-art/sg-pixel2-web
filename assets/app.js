
(function () {
  "use strict";

  var CONFIG = {
    apiBase: (typeof window.__ROOM_API__ !== "undefined") ? window.__ROOM_API__ : "",
    ttlMs: 5 * 60 * 1000,
    pollMsEvening: 15000,
    pollMsAfternoon: 25000,
    pollMsMorning: 40000,
    pollMsNight: 60000,
    pollMaxMs: 60000,
    splashMinMs: 250,
    qqGroupUin: "1124909778",
    qqGroupJoinUrl: "https://qun.qq.com/universal-share/share?ac=1&authKey=NcYpwsw0uyoFEvfs9K2U0pbty1aFJLvkQXB1WnvvOnZCPSvzCZwEphqSlFLl6wyi&busi_data=eyJncm91cENvZGUiOiIxMTI0OTA5Nzc4IiwidG9rZW4iOiJXQUZ6VVRtQmJOMnNJTTFiN2I0S2hQR1JiclgwVksxTWROSi8wVldZVmR6a016RFpNNjM5NTU0Q2hUdmFPN0tsIiwidWluIjoiMTYzNDM2NTAxOCJ9&data=RAJFbnazxsLdojQkwFPLDWRy45IJE61AEZPZvLGCa1pr1G0BoThgG3AXuHnVre6ylk5h6p8rtADBwgggG83gBA&svctype=4&tempid=h5_group_info",
    defaultTags: ["雪谷", "玛卡拉", "挂机老头", "刀4"],
    defaultWikiCategories: ["攻略", "图鉴", "地图", "新手"]
  };

  var STORAGE = "pixel-room-finder-v5";
  var CLIENT_KEY = "pixel-room-finder-client";
  var OWNED_KEY = "pixel-room-finder-owned";
  var THEME_KEY = "pixel-room-finder-theme";

  var state = {
    mode: "local", rooms: [], tags: CONFIG.defaultTags.slice(), publishTags: CONFIG.defaultTags.slice(),
    tag: "全部", keyword: "", info: null, words: [], feedback: [], adminRooms: [], adminTag: "announcement",
    adminWikiStatus: "pending",
    wiki: { categories: ["攻略", "图鉴", "地图", "新手"], items: [], current: null, category: "全部", keyword: "", adminStatus: "pending", quill: null, editing: null, coverId: "", pick: "攻略" }
  };

  var el = {};
  ["title", "themeBtn", "search", "tabs", "list", "mascotImg", "bubbleText", "modeDot", "toast",
   "fab", "feedbackBtn", "sheetMask", "publishForm", "fPaste", "parseHint", "fUid", "fNote", "pick",
   "submitBtn", "fbMask", "fFbText", "fFbContact", "fbSubmit", "fbClose",
   "adminMask", "adminHint", "adminLoginBox", "fAdminKey", "adminLoginBtn", "adminPanel",
   "fAnnText", "annSaveBtn", "adminTagList", "fAdminNewTag", "adminAddBtn",
   "adminWordList", "fAdminNewWord", "adminAddWordBtn", "adminRoomList", "adminFbList", "adminCloseBtn",
   "fImportText", "importHint", "fImportUid", "fImportNote", "fImportTag",
   "importOneBtn", "importMulti", "importMultiCount", "importAllBtn",
   "installBtn", "guideMask", "guideTitle", "guideSub", "guideBody", "guideCloseBtn", "refreshBtn",
   "mascotCard", "annMask", "annList", "annCloseBtn", "adminAnnList", "adminResetWordBtn",
   "colorBtn", "colorMask", "themeGrid", "colorCloseBtn",
   "wikiBtn", "wikiScreen", "wikiBackBtn", "wikiTitle", "wikiSub", "wikiSubmitBtn", "wikiThemeBtn", "wikiBody",
   "wikiVideoField", "wikiVideoUrl", "wikiVideoMask", "wikiVideoConfirmBtn", "wikiVideoCancelBtn", "wikiListView", "wikiDetailView", "wikiSubmitView", "wikiSearch", "wikiQueryInput", "wikiQueryBtn", "wikiQuerySubmitBtn", "wikiQueryCloseBtn", "wikiQueryMask", "wikiTypePick", "wikiDynamicFields",
   "mailTemplateBtn", "mailCopyMask", "mailCopyConfirmBtn", "mailCopyCancelBtn", "mailOfficialMask", "mailOfficialInput", "mailOfficialSaveBtn", "mailOfficialCancelBtn", "mailListView", "mailDetailView", "mailSubmitView", "mailSearch", "mailMascotCard", "mailBubbleText", "mailCount", "mailSubmitEntry", "mailOfficialEditBtn", "mailList", "mailDetail", "mailTitle", "mailPublisher", "mailSituation", "mailBody", "mailImageUpload", "mailImageInput", "mailImagePreview", "mailSubmitBtn", "wikiCodeMask", "wikiCodeValue", "wikiCodeCopyBtn", "wikiCoverMask", "wikiCoverCropViewport", "wikiCoverCropCanvas", "wikiCoverZoom", "wikiCoverSaveBtn", "wikiCoverCancelBtn",
   "wikiTabs", "wikiSubTabs", "wikiCount", "wikiRefreshBtn", "wikiList", "wikiMoreBtn", "wikiDetail", "wikiMascotCard", "wikiMascotImg", "wikiBubbleText", "wikiNickname", "wikiPick", "wikiCodexFields", "wikiItemAttrs", "wikiItemSource", "wikiTitleLabel", "wikiCoverLabel", "wikiSortLabel", "wikiEditorLabel", "wikiEditorNote", "wikiImageViewer", "wikiImageViewerImg", "wikiImageViewerCloseBtn", "qqGroupBtn", "qqGroupMask", "qqGroupCopyBtn", "qqGroupCancelBtn",
   "wikiFormTitle", "wikiCoverUpload", "wikiCoverInput", "wikiEditor", "wikiPublishBtn", "wikiSubmitResult",
   "adminWikiCreateBtn", "adminWikiEditsBtn", "adminWikiEditList", "adminMailReviewBtn", "adminMailList", "adminRejectMask", "adminRejectReason", "adminRejectConfirmBtn", "adminRejectCancelBtn", "adminDeleteMask", "adminDeleteTitle", "adminDeleteSub", "adminDeleteConfirmBtn", "adminDeleteCancelBtn", "adminWikiList", "adminWikiMoreBtn", "adminWikiCategories", "fAdminWikiCat", "adminWikiAddCatBtn", "adminStorageCard", "adminStoragePercent", "adminStorageFill", "adminStorageMeta", "adminStorageCleanBtn"].forEach(function (id) {
    el[id] = document.getElementById(id);
  });

  var pickedTag = "";
  var adminKey = "";
  var roomTabsSignature = "";
  var roomListSignature = "";
  var toastTimer = null;
  var pendingDel = null, pendingDelTimer = null;
  var pollTimer = null, pollFails = 0, bubbleTimer = null, bubbleIndex = 0;

  /* ---------------- 小工具 ---------------- */
  function rand() { return Math.random().toString(36).slice(2, 8); }
  function uid() { return Date.now().toString(36) + rand(); }
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function formatTime(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000)), m = Math.floor(s / 60), r = s % 60;
    return (m < 10 ? "0" : "") + m + ":" + (r < 10 ? "0" : "") + r;
  }
  function fmtDate(ts) {
    var d = new Date(ts);
    return (d.getMonth() + 1) + "月" + d.getDate() + "日 " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
  }
  function showToast(text) {
    el.toast.textContent = text;
    el.toast.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.classList.remove("show"); }, 2000);
  }
  var viewerGesture = {
    scale: 1,
    x: 0,
    y: 0,
    pointers: {},
    startDist: 0,
    startScale: 1,
    startMid: null,
    startPointer: null,
    startX: 0,
    startY: 0,
    moved: false
  };
  function applyViewerTransform() {
    if (!el.wikiImageViewerImg) return;
    el.wikiImageViewerImg.style.transform =
      "translate3d(" + viewerGesture.x + "px," + viewerGesture.y + "px,0) scale(" + viewerGesture.scale + ")";
  }
  function resetViewerTransform() {
    viewerGesture.scale = 1;
    viewerGesture.x = 0;
    viewerGesture.y = 0;
    viewerGesture.pointers = {};
    viewerGesture.moved = false;
    applyViewerTransform();
  }
  function clampViewerPan() {
    var maxX = Math.max(0, (viewerGesture.scale - 1) * (el.wikiImageViewer.clientWidth || 1) / 2);
    var maxY = Math.max(0, (viewerGesture.scale - 1) * (el.wikiImageViewer.clientHeight || 1) / 2);
    viewerGesture.x = Math.max(-maxX, Math.min(maxX, viewerGesture.x));
    viewerGesture.y = Math.max(-maxY, Math.min(maxY, viewerGesture.y));
  }
  function pointerPair() {
    var values = Object.keys(viewerGesture.pointers).map(function (key) { return viewerGesture.pointers[key]; });
    return values.length >= 2 ? [values[0], values[1]] : [];
  }
  function distance(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  function midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }
  function openImageViewer(src) {
    if (!el.wikiImageViewer || !el.wikiImageViewerImg || !src) return;
    el.wikiImageViewerImg.src = src;
    resetViewerTransform();
    el.wikiImageViewer.classList.add("open");
    el.wikiImageViewer.setAttribute("aria-hidden", "false");
  }
  function closeImageViewer() {
    if (!el.wikiImageViewer) return;
    el.wikiImageViewer.classList.remove("open");
    el.wikiImageViewer.setAttribute("aria-hidden", "true");
    resetViewerTransform();
  }
  function clientId() {
    var id = null;
    try { id = localStorage.getItem(CLIENT_KEY); } catch (e) {}
    if (!id) { id = "c_" + uid(); try { localStorage.setItem(CLIENT_KEY, id); } catch (e) {} }
    return id;
  }
  function ownedRooms() { try { return JSON.parse(localStorage.getItem(OWNED_KEY) || "{}") || {}; } catch (e) { return {}; } }
  function ownRoom(id, token) { var m = ownedRooms(); m[id] = token; try { localStorage.setItem(OWNED_KEY, JSON.stringify(m)); } catch (e) {} }
  function isOwned(id) { return !!ownedRooms()[id]; }
  function ownedToken(id) { return ownedRooms()[id] || ""; }
  function forgetRoom(id) { var m = ownedRooms(); delete m[id]; try { localStorage.setItem(OWNED_KEY, JSON.stringify(m)); } catch (e) {} }

  /* ---------------- 深色 / 浅色模式 ---------------- */
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    el.themeBtn.textContent = t === "dark" ? "☀️" : "🌙";
    if (el.wikiThemeBtn) el.wikiThemeBtn.textContent = t === "dark" ? "☀️" : "🌙";
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "dark" ? "#111d33" : "#eef4fd");
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    if (typeof applyThemeColor === "function") applyThemeColor(state.colorKey || "blue");

  }
  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    // 默认用浅色配色（不跟随系统深色），只有用户手动切过才用他的选择
    applyTheme(saved === "dark" ? "dark" : "light");
    var ck = null;
    try { ck = localStorage.getItem(COLOR_KEY); } catch (e) {}
    applyThemeColor(ck || "blue");
  }
  el.themeBtn.addEventListener("click", function () {
    var cur = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    applyTheme(cur === "dark" ? "light" : "dark");
  });

  /* ---------------- 复制 UID（同步执行，兼容 iOS / QQ / 微信） ---------------- */
  function copySync(text) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", "");
    ta.style.position = "fixed"; ta.style.top = "0"; ta.style.left = "0";
    ta.style.width = "1px"; ta.style.height = "1px"; ta.style.padding = "0";
    ta.style.border = "none"; ta.style.outline = "none"; ta.style.background = "transparent"; ta.style.fontSize = "16px";
    var ok = false;
    try {
      document.body.appendChild(ta);
      var range = document.createRange ? document.createRange() : null;
      if (range && ta.childNodes.length) range.selectNodeContents(ta);
      else if (ta.setSelectionRange) { ta.focus(); ta.setSelectionRange(0, text.length); }
      else ta.select();
      ok = document.execCommand("copy");
    } catch (e) { ok = false; }
    try { document.body.removeChild(ta); } catch (e) {}
    return ok;
  }
  function copyText(text) {
    if (copySync(text)) return Promise.resolve(true);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }).catch(function () { return false; });
    }
    return Promise.resolve(false);
  }

  /* ---------------- 本地演示模式 ---------------- */
  function loadLocal() {
    var data = null;
    try { data = JSON.parse(localStorage.getItem(STORAGE) || "null"); } catch (e) {}
    if (data && data.rooms) {
      state.rooms = data.rooms.filter(function (r) { return r.expiresAt > Date.now(); });
      state.tags = (data.tags && data.tags.length) ? data.tags : CONFIG.defaultTags.slice();
    } else {
      state.rooms = []; state.tags = CONFIG.defaultTags.slice();
    }
    state.publishTags = state.tags.slice();
    state.words = [];
    // 本地演示模式也给一条默认公告，避免面板空白
    if (!state.info) {
      state.info = {
        announcement: "欢迎来到 SG.像素2 寻房站，发房请填真实 UID，房间 5 分钟自动过期。",
        announcements: [{ id: "local_welcome", text: "欢迎来到 SG.像素2 寻房站，发房请填真实 UID，房间 5 分钟自动过期。", at: Date.now() }],
        stats: { day: "", published: 0, copies: 0, active: 0 }
      };
    }
  }
  function saveLocal() {
    try { localStorage.setItem(STORAGE, JSON.stringify({ rooms: state.rooms, tags: state.tags })); } catch (e) {}
  }

  /* ---------------- 接口 ---------------- */
  function api(path, options) {
    options = options || {};
    var headers = { "Content-Type": "application/json" };
    if (options.token) headers["X-Publish-Token"] = options.token;
    if (options.adminKey) headers["X-Admin-Key"] = options.adminKey;
    var body = options.body ? Object.assign({}, options.body) : null;
    if (body && options.token) body.token = options.token;
    if (body && options.adminKey) body.key = options.adminKey;
    if (!body && options.token) path += (path.indexOf("?") > -1 ? "&" : "?") + "token=" + encodeURIComponent(options.token);
    if (!body && options.adminKey) path += (path.indexOf("?") > -1 ? "&" : "?") + "key=" + encodeURIComponent(options.adminKey);

    var controller = null, timer = null;
    if (typeof AbortController !== "undefined") {
      controller = new AbortController();
      timer = setTimeout(function () { controller.abort(); }, options.timeout || 8000);
    }
    return fetch(CONFIG.apiBase + path, {
      method: options.method || "GET", headers: headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller ? controller.signal : undefined
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) throw new Error(data.error || ("HTTP " + res.status));
        return data;
      });
    }).catch(function (err) { if (timer) clearTimeout(timer); throw err; });
  }

  function applyTags(data) {
    if (!data) return;
    if (data.publishTags && data.publishTags.length) state.publishTags = data.publishTags.slice();
    else if (data.tags && data.tags.length) state.publishTags = data.tags.slice();
    if (data.tags && data.tags.length) state.tags = data.tags.slice();
  }

  function detectMode() {
    if (location.protocol === "file:") { state.mode = "local"; loadLocal(); return Promise.resolve(); }
    var roomsPromise = api(roomsPath(), { timeout: 6000 }).catch(function () { return null; });
    return api("/api/info", { timeout: 5000 }).then(function (data) {
      state.mode = "online";
      state.info = data;
      return roomsPromise.then(function (roomData) {
        if (roomData) applyRoomsData(roomData);
        else return refreshRooms();
      });
    }).catch(function () {
      state.mode = "local";
      loadLocal();
    });
  }

  function roomsPath() {
    return "/api/rooms?t=" + Date.now()
      + (state.tag !== "全部" ? "&tag=" + encodeURIComponent(state.tag) : "")
      + (state.keyword ? "&q=" + encodeURIComponent(state.keyword) : "");
  }
  function applyRoomsData(data) {
    state.rooms = (data.rooms || []).filter(function (r) { return r.expiresAt > Date.now(); });
    applyTags(data);
    render();
  }
  function refreshRooms() {
    if (state.mode !== "online") return Promise.resolve();
    return api(roomsPath(), { timeout: 6000 }).then(applyRoomsData);
  }

  function refreshInfo() {
    if (state.mode !== "online") return Promise.resolve();
    return api("/api/info", { timeout: 6000 }).then(function (data) {
      state.info = data;
      renderBubble(true);
    }).catch(function () {});
  }
  /* ---------------- 渲染 ---------------- */
  function renderTabs() {
    var all = ["全部"].concat(state.tags);
    if (all.indexOf(state.tag) === -1) state.tag = "全部";
    var signature = state.tag + "|" + all.join("|");
    if (signature === roomTabsSignature && el.tabs.innerHTML) return;
    roomTabsSignature = signature;
    el.tabs.innerHTML = all.map(function (t) {
      return '<button class="tab' + (t === state.tag ? " active" : "") + '" data-tag="' + escapeHtml(t) + '" type="button">' + escapeHtml(t) + "</button>";
    }).join("");
  }
  function filteredRooms() {
    var kw = state.keyword.trim().toLowerCase();
    return state.rooms.filter(function (r) {
      if (r.expiresAt <= Date.now()) return false;
      if (state.tag !== "全部" && r.tag !== state.tag) return false;
      if (!kw) return true;
      return (r.uid + " " + r.note + " " + r.tag).toLowerCase().indexOf(kw) > -1;
    }).sort(function (a, b) { return b.createdAt - a.createdAt; });
  }
  function cardHtml(r) {
    var left = Math.max(0, r.expiresAt - Date.now());
    var mine = isOwned(r.id);
    return '' +
      '<article class="card' + (left <= 30000 ? " soon" : "") + '" data-id="' + escapeHtml(r.id) + '">' +
        '<div class="uid-row">' +
          '<div class="uid-block"><span class="uid-label">房间UID</span><span class="uid">' + escapeHtml(r.uid) + "</span></div>" +
          '<div class="card-actions">' +
            (r.tag ? '<span class="tag-chip">' + escapeHtml(r.tag) + "</span>" : "") +
            (mine ? '<button class="del" type="button" data-del="' + escapeHtml(r.id) + '">撤下</button>' : "") +
          "</div>" +
        "</div>" +
        '<div class="note"><span class="note-label">备注</span>' + escapeHtml(r.note || "无") + "</div>" +
        '<div class="meta">' +
          '<span>剩余时间：<b class="time" data-time-id="' + escapeHtml(r.id) + '">' + formatTime(left) + "</b></span>" +
          '<span class="hot">🔥热度：已被复制 <b data-copy-id="' + escapeHtml(r.id) + '">' + (r.copies || 0) + "</b> 次</span>" +
        "</div>" +
      "</article>";
  }
  function renderList() {
    var rows = filteredRooms();
    var signature = state.tag + "|" + state.keyword + "|" + rows.map(function (r) {
      return r.id + "|" + r.uid + "|" + (r.note || "") + "|" + (r.tag || "") + "|" + (r.copies || 0);
    }).join("||");
    if (signature === roomListSignature && el.list.innerHTML) return;
    roomListSignature = signature;
    if (!rows.length) {
      var any = state.rooms.some(function (r) { return r.expiresAt > Date.now(); });
      el.list.innerHTML = '<div class="empty"><strong>' + (any ? "没有找到匹配的房间" : "当前没有进行中的房间") + "</strong>"
        + (any ? "换个关键词或标签试试" : "点右下角发布房间，5 分钟内有效") + "</div>";
      return;
    }
    el.list.innerHTML = rows.map(cardHtml).join("");
  }
  function render() { renderTabs(); renderList(); }

  /* ---------------- 小助手气泡（公告 / 今日数据 / 小提示 轮播） ---------------- */
  function bubbleMessages() {
    var list = [];
    if (state.info && state.info.announcement) list.push("📢 " + state.info.announcement);
    var st = state.info && state.info.stats;
    if (st) {
      list.push("📊 今日数据：已发布 <b>" + (st.published || 0) + "</b> 个房间，被复制 <b>" + (st.copies || 0)
        + "</b> 次，当前还有 <b>" + (state.rooms.filter(function (r) { return r.expiresAt > Date.now(); }).length || st.active || 0) + "</b> 个房间在线");
    }
    list.push("💡 房间 5 分钟自动过期，所以你看到的都是活房");
    list.push("👆 点卡片任意位置，就能复制房间 UID，切回游戏直接粘贴");
    if (!list.length) list.push("欢迎来到 SG.像素2 寻房站");
    return list;
  }
  function renderBubble(reset) {
    var msgs = bubbleMessages();
    if (reset) bubbleIndex = 0;
    if (bubbleIndex >= msgs.length) bubbleIndex = 0;
    el.bubbleText.innerHTML = msgs[bubbleIndex];
  }
  function startBubbleLoop() {
    if (bubbleTimer) clearInterval(bubbleTimer);
    bubbleTimer = setInterval(function () {
      if (document.hidden) return;
      var msgs = bubbleMessages();
      bubbleIndex = (bubbleIndex + 1) % msgs.length;
      el.bubbleText.style.opacity = "0";
      setTimeout(function () { renderBubble(false); el.bubbleText.style.opacity = "1"; }, 180);
    }, 5200);
  }

  /* ---------------- 倒计时 ---------------- */
  function tick() {
    if (document.hidden) return;
    var now = Date.now(), expired = [];
    state.rooms.forEach(function (r) { if (r.expiresAt <= now) expired.push(r.id); });
    if (expired.length) {
      expired.forEach(function (id) {
        var c = el.list.querySelector ? el.list.querySelector('.card[data-id="' + id + '"]') : null;
        if (c) c.classList.add("gone");
        forgetRoom(id);
      });
      state.rooms = state.rooms.filter(function (r) { return r.expiresAt > now; });
      if (state.mode === "local") saveLocal();
      setTimeout(renderList, 260);
    }
    Array.prototype.forEach.call(el.list.querySelectorAll(".time"), function (node) {
      var id = node.getAttribute("data-time-id"), room = null;
      for (var i = 0; i < state.rooms.length; i++) { if (state.rooms[i].id === id) { room = state.rooms[i]; break; } }
      if (!room) return;
      var left = Math.max(0, room.expiresAt - Date.now());
      node.textContent = formatTime(left);
      var card = node.closest ? node.closest(".card") : null;
      if (card) card.classList.toggle("soon", left <= 30000);
    });
  }

  /* ---------------- 轮询 ---------------- */
  function currentPollMs() {
    var h = new Date().getHours();
    if (h >= 18 || h < 1) return CONFIG.pollMsEvening;
    if (h >= 12) return CONFIG.pollMsAfternoon;
    if (h >= 6) return CONFIG.pollMsMorning;
    return CONFIG.pollMsNight;
  }
  function schedulePoll(delay) {
    if (pollTimer) clearTimeout(pollTimer);
    if (state.mode !== "online") return;
    pollTimer = setTimeout(pollTick, delay === undefined ? currentPollMs() : delay);
  }
  function pollTick() {
    if (document.hidden) return schedulePoll(currentPollMs() * 2);
    refreshRooms().then(function () {
      pollFails = 0; schedulePoll(currentPollMs());
      return refreshInfo();
    }).catch(function () {
      pollFails = Math.min(pollFails + 1, 4);
      schedulePoll(Math.min(currentPollMs() * Math.pow(2, pollFails), CONFIG.pollMaxMs));
    });
  }

  /* ---------------- 标签 / 搜索 ---------------- */
  function selectTag(tag) {
    state.tag = tag; renderTabs();
    if (state.mode === "online") refreshRooms().catch(function () {}); else renderList();
  }
  el.tabs.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest(".tab") : null;
    if (b) selectTag(b.getAttribute("data-tag"));
  });
  var searchTimer = null;
  el.search.addEventListener("input", function () {
    state.keyword = el.search.value;
    if (state.mode === "online") {
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(function () { refreshRooms().catch(function () {}); }, 300);
    } else renderList();
  });

  /* ---------------- 卡片：复制 / 撤下 ---------------- */
  el.list.addEventListener("click", function (e) {
    var delBtn = e.target.closest ? e.target.closest(".del") : null;
    if (delBtn) { onDeleteTap(delBtn); return; }
    var card = e.target.closest ? e.target.closest(".card") : null;
    if (!card) return;
    var id = card.getAttribute("data-id"), room = null;
    for (var i = 0; i < state.rooms.length; i++) { if (state.rooms[i].id === id) { room = state.rooms[i]; break; } }
    if (!room) return;
    copyText(room.uid).then(function (ok) {
      if (!ok) { showToast("复制失败，请长按选中 UID 手动复制"); return; }
      showToast("✅房间UID已复制");
      countCopy(room);
    });
  });
  function countCopy(room) {
    if (state.mode === "online") {
      api("/api/rooms/" + encodeURIComponent(room.id) + "/copy", { method: "POST", body: { visitorId: clientId() } })
        .then(function (res) { room.copies = res.copies; paintCopies(room.id, res.copies); refreshInfo(); })
        .catch(function () {});
    } else {
      room.copies = (room.copies || 0) + 1; paintCopies(room.id, room.copies); saveLocal();
    }
  }
  function paintCopies(id, n) {
    var node = el.list.querySelector ? el.list.querySelector('[data-copy-id="' + id + '"]') : null;
    if (node) node.textContent = n;
  }
  function onDeleteTap(btn) {
    var id = btn.getAttribute("data-del");
    if (pendingDel !== id) {
      pendingDel = id; btn.classList.add("confirm"); btn.textContent = "确认撤下";
      showToast("再点一次确认撤下");
      if (pendingDelTimer) clearTimeout(pendingDelTimer);
      pendingDelTimer = setTimeout(function () { pendingDel = null; btn.classList.remove("confirm"); btn.textContent = "撤下"; }, 3000);
      return;
    }
    if (pendingDelTimer) clearTimeout(pendingDelTimer);
    pendingDel = null; doRemove(id).catch(function () {});
  }
  function doRemove(id) {
    var finish = function (msg) {
      state.rooms = state.rooms.filter(function (r) { return r.id !== id; });
      forgetRoom(id);
      if (state.mode === "local") saveLocal();
      renderList(); showToast(msg);
    };
    if (state.mode !== "online") { finish("房间已撤下"); return Promise.resolve(); }
    return api("/api/rooms/" + encodeURIComponent(id), { method: "DELETE", token: ownedToken(id) })
      .then(function () { finish("房间已撤下"); })
      .catch(function (err) {
        var msg = (err && err.message) ? err.message : "撤下失败";
        if (msg.indexOf("过期") > -1 || msg.indexOf("不存在") > -1) { finish("房间已撤下"); return; }
        showToast(msg); throw err;
      });
  }
  /* ---------------- 智能识别（纯本地正则，不联网） ---------------- */
  function smartParse(text) {
    var raw = String(text || ""), uidVal = "", tag = "", note = raw;
    var m = raw.match(/\b\d{8,}_\d{2,6}\b/);
    if (!m) m = raw.match(/\b\d{12,}\b/);
    if (!m) m = raw.match(/\b[A-Za-z]{1,6}[_-]?\d{6,}\b/);
    if (m) { uidVal = m[0]; note = raw.split(m[0]).join(" "); }
    for (var i = 0; i < state.publishTags.length; i++) {
      if (raw.indexOf(state.publishTags[i]) > -1) { tag = state.publishTags[i]; break; }
    }
    // 标签名已经从下拉里选了，就没必要再留在备注里
    if (tag) note = note.split(tag).join(" ");
    note = note.replace(/\s+/g, " ").replace(/^[\s\-—,，、:：|]+/, "").trim().slice(0, 100);
    return { uid: uidVal, note: note, tag: tag };
  }

  el.fPaste.addEventListener("input", function () {
    var v = el.fPaste.value.trim();
    if (!v) { el.parseHint.className = "parse-hint"; el.parseHint.textContent = "粘贴后会自动填好下面的 UID、备注和标签"; return; }
    var r = smartParse(v);
    var parts = [];
    if (r.uid) { el.fUid.value = r.uid; parts.push("UID：" + r.uid); }
    if (r.note) { el.fNote.value = r.note; parts.push("备注：" + r.note.slice(0, 18) + (r.note.length > 18 ? "…" : "")); }
    pickedTag = r.tag || "";
    if (r.tag) parts.push("标签：" + r.tag);
    renderPick();
    if (r.uid) {
      el.parseHint.className = "parse-hint ok";
      el.parseHint.textContent = "✅ 已识别 " + parts.join(" · ");
    } else {
      el.parseHint.className = "parse-hint bad";
      el.parseHint.textContent = "⚠️ 没找到 UID（形如 2512132115852_99434），请手动填写";
    }
  });

  /* ---------------- 发布 ---------------- */
  function renderPick() {
    // 识别不到标签时保持"无标签"，不再默认选第一个
    if (pickedTag && state.publishTags.indexOf(pickedTag) === -1) pickedTag = "";
    var html = '<button type="button" data-pick=""' + (pickedTag ? "" : ' class="active"') + ">无标签</button>"
      + state.publishTags.map(function (t) {
          return '<button type="button" data-pick="' + escapeHtml(t) + '"' + (t === pickedTag ? ' class="active"' : "") + ">" + escapeHtml(t) + "</button>";
        }).join("");
    el.pick.innerHTML = html;
  }
  el.pick.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-pick]") : null;
    if (!b) return;
    pickedTag = b.getAttribute("data-pick");
    Array.prototype.forEach.call(el.pick.querySelectorAll("[data-pick]"), function (x) { x.classList.toggle("active", x === b); });
  });
  el.fab.addEventListener("click", function () {
    if (el.wikiScreen && el.wikiScreen.classList.contains("open")) { closeWiki(); return; }
    pickedTag = "";          // 每次打开都从"无标签"开始，粘贴文案后会自动识别
    renderPick();
    el.sheetMask.classList.add("open");
    setTimeout(function () { el.fPaste.focus(); }, 260);
  });
  el.sheetMask.addEventListener("click", function (e) { if (e.target === el.sheetMask) el.sheetMask.classList.remove("open"); });

  el.publishForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var uidVal = el.fUid.value.trim(), note = el.fNote.value.trim();
    if (!uidVal) { showToast("请填写房间UID"); el.fUid.focus(); return; }
    if (/https?:\/\/|www\.|\.com|\.cn|\.net/i.test(note)) { showToast("备注里不能带网址链接"); return; }
    el.submitBtn.disabled = true;
    publish({ uid: uidVal, note: note, tag: pickedTag }).then(function () {
      el.submitBtn.disabled = false;
      el.publishForm.reset();
      el.parseHint.className = "parse-hint";
      el.parseHint.textContent = "粘贴后会自动填好下面的 UID、备注和标签";
      el.sheetMask.classList.remove("open");
      showToast("✅房间已发布，5 分钟内有效");
      refreshInfo();
    }).catch(function (err) {
      el.submitBtn.disabled = false;
      showToast((err && err.message) ? err.message : "发布失败，请重试");
    });
  });

  function publish(payload) {
    if (state.mode === "online") {
      return api("/api/rooms", { method: "POST", body: payload, token: clientId() }).then(function (res) {
        if (res && res.room) ownRoom(res.room.id, clientId());
        state.keyword = ""; el.search.value = ""; state.tag = "全部";
        return refreshRooms().catch(function () {});
      });
    }
    var room = { id: "local_" + uid(), uid: payload.uid, note: payload.note || "无", tag: payload.tag || "",
      createdAt: Date.now(), expiresAt: Date.now() + CONFIG.ttlMs, copies: 0 };
    state.rooms = state.rooms.filter(function (r) { return r.uid !== room.uid; });
    state.rooms.unshift(room); ownRoom(room.id, "local");
    state.tag = "全部"; state.keyword = ""; el.search.value = "";
    saveLocal(); render();
    return Promise.resolve(room);
  }

  /* ---------------- 意见反馈 ---------------- */
  el.feedbackBtn.addEventListener("click", function () { el.fbMask.classList.add("open"); });
  el.fbClose.addEventListener("click", function () { el.fbMask.classList.remove("open"); });
  el.fbMask.addEventListener("click", function (e) { if (e.target === el.fbMask) el.fbMask.classList.remove("open"); });
  el.fbSubmit.addEventListener("click", function () {
    var text = el.fFbText.value.trim(), contact = el.fFbContact.value.trim();
    if (!text || text.length < 2) { showToast("请填写反馈内容"); return; }
    if (state.mode !== "online") {
      showToast("本地演示模式无法提交反馈，请打开正式网址");
      return;
    }
    el.fbSubmit.disabled = true;
    api("/api/feedback", { method: "POST", body: { text: text, contact: contact } }).then(function () {
      el.fbSubmit.disabled = false;
      el.fFbText.value = ""; el.fFbContact.value = "";
      el.fbMask.classList.remove("open");
      showToast("✅反馈已提交，谢谢！");
    }).catch(function (err) {
      el.fbSubmit.disabled = false;
      showToast((err && err.message) ? err.message : "提交失败，请重试");
    });
  });

  /* ---------------- 管理员面板 ---------------- */
  var pressTimer = null, tapCount = 0, tapTimer = null;
  function openAdmin() {
    el.adminMask.classList.add("open");
    if (state.mode !== "online") {
      el.adminLoginBox.style.display = "none";
      el.adminPanel.style.display = "block";
      el.adminHint.textContent = "本地演示模式：改动只存在这台手机上";
      loadAdminData();
      return;
    }
    if (adminKey) {
      el.adminLoginBox.style.display = "none";
      el.adminPanel.style.display = "block";
      el.adminHint.textContent = "已进入管理模式，改动对所有人生效";
      loadAdminData();
    } else {
      el.adminLoginBox.style.display = "block";
      el.adminPanel.style.display = "none";
      el.adminHint.textContent = "仅管理员可操作，改动对所有人生效";
    }
  }
  function startPress() { clearPress(); pressTimer = setTimeout(function () { pressTimer = null; openAdmin(); }, 1200); }
  function clearPress() { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } }
  el.title.addEventListener("pointerdown", startPress);
  el.title.addEventListener("pointerup", clearPress);
  el.title.addEventListener("pointercancel", clearPress);
  el.title.addEventListener("pointerleave", clearPress);
  el.title.addEventListener("touchstart", startPress, { passive: true });
  el.title.addEventListener("touchend", clearPress);
  el.title.addEventListener("click", function () {
    tapCount += 1;
    if (tapTimer) clearTimeout(tapTimer);
    if (tapCount >= 5) { tapCount = 0; openAdmin(); return; }
    tapTimer = setTimeout(function () { tapCount = 0; }, 3000);
  });
  el.adminCloseBtn.addEventListener("click", function () { el.adminMask.classList.remove("open"); });
  el.adminMask.addEventListener("click", function (e) { if (e.target === el.adminMask) el.adminMask.classList.remove("open"); });

  el.adminLoginBtn.addEventListener("click", function () {
    var key = el.fAdminKey.value.trim();
    if (!key) { showToast("请输入管理员口令"); return; }
    if (state.mode !== "online") { openAdmin(); return; }
    api("/api/admin/login", { method: "POST", body: { key: key } }).then(function (res) {
      adminKey = key;
      el.adminLoginBox.style.display = "none";
      el.adminPanel.style.display = "block";
      el.adminHint.textContent = "已进入管理模式，改动对所有人生效";
      if (res.words) state.words = res.words;
      if (res.announcement) el.fAnnText.value = res.announcement;
      applyTags(res);
      render(); renderPick(); loadAdminData();
    }).catch(function (err) { showToast((err && err.message) ? err.message : "口令不正确"); });
  });

  // 管理面板切页
  Array.prototype.forEach.call(document.querySelectorAll(".ad-tab"), function (btn) {
    btn.addEventListener("click", function () {
      Array.prototype.forEach.call(document.querySelectorAll(".ad-tab"), function (b) { b.classList.toggle("active", b === btn); });
      Array.prototype.forEach.call(document.querySelectorAll(".ad-pane"), function (p) {
        p.classList.toggle("active", p.id === btn.getAttribute("data-pane"));
      });
    });
  });

  function loadAdminData() {
    if (state.mode !== "online") {
      renderAdminTags(); renderAdminWords(); renderAdminRooms(state.rooms); renderAdminFb([]);
      renderAdminWikiCategories(); loadAdminStorage();
      if (!el.fAnnText.value && state.info) el.fAnnText.value = state.info.announcement || "";
      return;
    }
    api("/api/info").then(function (d) { el.fAnnText.value = d.announcement || ""; }).catch(function () {});
    api("/api/admin/words", { adminKey: adminKey }).then(function (r) { state.words = r.words || []; renderAdminWords(); }).catch(function () {});
    api("/api/rooms").then(function (r) { renderAdminRooms(r.rooms || []); }).catch(function () {});
    api("/api/admin/feedback", { adminKey: adminKey }).then(function (r) { renderAdminFb(r.feedback || []); }).catch(function () {});
    renderAdminTags();
    if (el.fImportTag) renderImportTagSelect(el.fImportTag.value || "");
    renderAdminAnn();
    loadWikiAdmin(true);
    loadWikiEdits(true);
    loadMailAdmin(true);
    loadAdminStorage();
  }
  function renderAdminTags() {
    el.adminTagList.innerHTML = state.publishTags.length
      ? state.publishTags.map(function (t) { return '<span class="ad-item">' + escapeHtml(t) + '<button type="button" data-adtag="' + escapeHtml(t) + '">×</button></span>'; }).join("")
      : '<span class="ad-empty">还没有标签</span>';
  }
  function renderAdminWords() {
    el.adminWordList.innerHTML = state.words.length
      ? state.words.map(function (w) { return '<span class="ad-item">' + escapeHtml(w) + '<button type="button" data-adword="' + escapeHtml(w) + '">×</button></span>'; }).join("")
      : '<span class="ad-empty">还没有屏蔽词</span>';
  }
  function renderAdminRooms(rooms) {
    if (!rooms.length) { el.adminRoomList.innerHTML = '<div class="ad-empty">当前没有在线房间</div>'; return; }
    el.adminRoomList.innerHTML = rooms.map(function (r) {
      return '<div class="ad-row"><div class="grow"><b>' + escapeHtml(r.uid) + "</b><br />"
        + escapeHtml(r.note || "无") + '<br /><span class="time2">' + escapeHtml(r.tag || "无标签") + " · 剩余 "
        + formatTime(Math.max(0, r.expiresAt - Date.now())) + " · 被复制 " + (r.copies || 0) + " 次</span></div>"
        + '<button class="del" type="button" data-adroom="' + escapeHtml(r.id) + '">删除</button></div>';
    }).join("");
  }
  function renderAdminFb(list) {
    if (!list.length) { el.adminFbList.innerHTML = '<div class="ad-empty">还没有收到反馈</div>'; return; }
    el.adminFbList.innerHTML = list.map(function (f) {
      return '<div class="ad-row"><div class="grow">' + escapeHtml(f.text) + '<br /><span class="time2">'
        + fmtDate(f.at) + (f.contact ? " · 联系：" + escapeHtml(f.contact) : "") + "</span></div>"
        + '<button class="del" type="button" data-adfb="' + escapeHtml(f.id) + '">删除</button></div>';
    }).join("");
  }

  function renderAdminAnn() {
    var list = (state.info && state.info.announcements) || [];
    el.adminAnnList.innerHTML = list.length
      ? list.map(function (a) {
          return '<div class="ad-row"><div class="grow">' + escapeHtml(a.text)
            + '<br /><span class="time2">' + fmtDate(a.at) + "</span></div>"
            + '<button class="del" type="button" data-adann="' + escapeHtml(a.id) + '">删除</button></div>';
        }).join("")
      : '<div class="ad-empty">还没有公告</div>';
  }

  function renderAnnList() {
    var list = (state.info && state.info.announcements) || [];
    el.annList.innerHTML = list.length
      ? list.map(function (a) {
          return '<div class="ann-item"><div class="ann-text">' + escapeHtml(a.text) + "</div>"
            + '<div class="ann-time">' + fmtDate(a.at) + "</div></div>";
        }).join("")
      : '<div class="ad-empty">还没有公告</div>';
  }

  /* 点小助手 → 查看全部公告 */
  el.mascotCard.addEventListener("click", function () {
    renderAnnList();
    el.annMask.classList.add("open");
    if (state.mode === "online") {
      api("/api/announcements").then(function (r) {
        if (!state.info) state.info = {};
        state.info.announcements = r.announcements || [];
        renderAnnList(); renderAdminAnn();
      }).catch(function () {});
    }
  });
  el.annCloseBtn.addEventListener("click", function () { el.annMask.classList.remove("open"); });
  el.annMask.addEventListener("click", function (e) { if (e.target === el.annMask) el.annMask.classList.remove("open"); });

  /* 管理员：发布新公告 */
  el.annSaveBtn.addEventListener("click", function () {
    var text = el.fAnnText.value.trim();
    if (!text) { showToast("公告不能为空"); return; }
    if (state.mode !== "online") {
      if (!state.info) state.info = {};
      state.info.announcements = [{ id: "local_" + uid(), text: text, at: Date.now() }].concat(state.info.announcements || []);
      state.info.announcement = text;
      el.fAnnText.value = "";
      renderAdminAnn(); renderAnnList(); renderBubble(true);
      showToast("已发布（仅本机）");
      return;
    }
    api("/api/admin/announcements", { method: "POST", body: { text: text }, adminKey: adminKey }).then(function (r) {
      if (!state.info) state.info = {};
      state.info.announcements = r.announcements || [];
      state.info.announcement = state.info.announcements.length ? state.info.announcements[0].text : text;
      el.fAnnText.value = "";
      renderAdminAnn(); renderAnnList(); renderBubble(true);
      showToast("✅ 公告已发布");
    }).catch(function (err) { showToast((err && err.message) ? err.message : "发布失败"); });
  });

  /* 管理员：删除公告 */
  el.adminAnnList.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-adann]") : null;
    if (!b) return;
    var id = b.getAttribute("data-adann");
    if (state.mode !== "online") {
      state.info.announcements = (state.info.announcements || []).filter(function (a) { return a.id !== id; });
      renderAdminAnn(); renderAnnList(); showToast("已删除"); return;
    }
    api("/api/admin/announcements/" + encodeURIComponent(id), { method: "DELETE", adminKey: adminKey }).then(function (r) {
      state.info.announcements = r.announcements || [];
      state.info.announcement = state.info.announcements.length ? state.info.announcements[0].text : "";
      renderAdminAnn(); renderAnnList(); renderBubble(true);
      showToast("已删除公告");
    }).catch(function (err) { showToast((err && err.message) ? err.message : "删除失败"); });
  });

  el.adminAddBtn.addEventListener("click", function () {
    var name = el.fAdminNewTag.value.trim();
    if (!name) { showToast("请输入标签名称"); return; }
    var done = function () { el.fAdminNewTag.value = ""; renderAdminTags(); renderTabs(); renderPick(); showToast("已添加标签：" + name); };
    if (state.mode !== "online") { if (state.tags.indexOf(name) === -1) { state.tags.push(name); state.publishTags.push(name); } saveLocal(); done(); return; }
    api("/api/admin/tags", { method: "POST", body: { name: name }, adminKey: adminKey }).then(function (r) { applyTags(r); done(); })
      .catch(function (err) { showToast((err && err.message) ? err.message : "添加失败"); });
  });
  el.adminTagList.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-adtag]") : null;
    if (!b) return;
    var name = b.getAttribute("data-adtag");
    var done = function () { renderAdminTags(); renderTabs(); renderPick(); showToast("已删除标签：" + name); };
    if (state.mode !== "online") {
      state.tags = state.tags.filter(function (t) { return t !== name; });
      state.publishTags = state.publishTags.filter(function (t) { return t !== name; });
      saveLocal(); done(); return;
    }
    api("/api/admin/tags/" + encodeURIComponent(name), { method: "DELETE", adminKey: adminKey }).then(function (r) { applyTags(r); done(); })
      .catch(function (err) { showToast((err && err.message) ? err.message : "删除失败"); });
  });

  el.adminAddWordBtn.addEventListener("click", function () {
    var w = el.fAdminNewWord.value.trim();
    if (!w) { showToast("请输入屏蔽词"); return; }
    if (state.mode !== "online") {
      if (state.words.indexOf(w) === -1) state.words.push(w);
      el.fAdminNewWord.value = ""; renderAdminWords(); showToast("已添加屏蔽词：" + w); return;
    }
    api("/api/admin/words", { method: "POST", body: { word: w }, adminKey: adminKey }).then(function (r) {
      state.words = r.words || []; el.fAdminNewWord.value = ""; renderAdminWords(); showToast("已添加屏蔽词：" + w);
    }).catch(function (err) { showToast((err && err.message) ? err.message : "添加失败"); });
  });
  el.adminWordList.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-adword]") : null;
    if (!b) return;
    var w = b.getAttribute("data-adword");
    if (state.mode !== "online") {
      state.words = state.words.filter(function (x) { return x !== w; }); renderAdminWords(); showToast("已删除：" + w); return;
    }
    api("/api/admin/words/" + encodeURIComponent(w), { method: "DELETE", adminKey: adminKey }).then(function (r) {
      state.words = r.words || []; renderAdminWords(); showToast("已删除屏蔽词：" + w);
    }).catch(function (err) { showToast((err && err.message) ? err.message : "删除失败"); });
  });

  /* 恢复默认词库（怕误删） */
  el.adminResetWordBtn.addEventListener("click", function () {
    if (state.mode !== "online") { showToast("本地模式不支持"); return; }
    api("/api/admin/words/reset", { method: "POST", adminKey: adminKey }).then(function (r) {
      state.words = r.words || [];
      renderAdminWords();
      showToast("已恢复默认词库（" + state.words.length + " 个）");
    }).catch(function (err) { showToast((err && err.message) ? err.message : "恢复失败"); });
  });

  el.adminRoomList.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-adroom]") : null;
    if (!b) return;
    var id = b.getAttribute("data-adroom");
    if (state.mode !== "online") {
      state.rooms = state.rooms.filter(function (r) { return r.id !== id; });
      saveLocal(); render(); loadAdminData(); showToast("已删除该房间"); return;
    }
    api("/api/admin/rooms/" + encodeURIComponent(id), { method: "DELETE", adminKey: adminKey }).then(function () {
      showToast("已删除该房间"); renderList(); loadAdminData();
    }).catch(function (err) { showToast((err && err.message) ? err.message : "删除失败"); });
  });
  el.adminFbList.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-adfb]") : null;
    if (!b) return;
    var id = b.getAttribute("data-adfb");
    if (state.mode !== "online") { showToast("本地模式不支持"); return; }
    api("/api/admin/feedback/" + encodeURIComponent(id), { method: "DELETE", adminKey: adminKey }).then(function () {
      showToast("已删除该反馈"); loadAdminData();
    }).catch(function (err) { showToast((err && err.message) ? err.message : "删除失败"); });
  });

  /* ---------------- 批量导入（管理员前期铺量用） ---------------- */
  var importRows = [];

  /** 把一段文本里的备注洗干净（去时间戳、昵称、等级、聊天噪音） */
  function cleanNote(raw) {
    var t = String(raw || "");
    t = t.replace(/\[[^\]]{0,20}\]/g, " ");                                  // [图片] [16:41]
    t = t.replace(/\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/g, " ");                  // 2026-10-07
    t = t.replace(/\d{1,2}:\d{2}(:\d{2})?/g, " ");                          // 16:41
    t = t.replace(/@[^\s]{1,20}/g, " ");                                     // @某人
    t = t.replace(/[\w\u4e00-\u9fa5.·\-]{1,24}\s*[（(][^）)]{0,24}[）)]/g, " "); // SG.某人(夢魔錠33/70)
    t = t.replace(/[（(]\s*\d+\s*[\/]\s*\d+\s*[）)]/g, " ");            // (33/70)
    t = t.replace(/撤回了一条消息|加入了群聊|邀请.*加入了群聊|【图片】|图片/g, " ");
    t = t.replace(/[|｜]/g, " ");
    t = t.replace(/\s+/g, " ");
    t = t.replace(/^[\s\-—,，、:：.。]+/, "").replace(/[\s\-—,，、:：]+$/, "");
    return t.trim();
  }

  /**
   * 智能识别：不再要求"一行一个房间"，而是先把全文里所有房间号找出来，
   * 再按"房间号 → 下一个房间号"之间的内容当备注。
   * 这样多行、单行、昵称时间混杂、备注在上一行/下一行都能认。
   */
  function parseBatchText(text) {
    var raw = String(text || "").replace(/\r/g, "\n");
    var patterns = [/\d{8,}_\d{2,6}/g, /\d{12,}/g, /[A-Za-z]{1,6}[_-]\d{6,}/g];
    var hits = [], m;

    for (var pi = 0; pi < patterns.length; pi++) {
      var re = new RegExp(patterns[pi].source, "g");
      while ((m = re.exec(raw)) !== null) {
        hits.push({ uid: m[0], at: m.index, end: m.index + m[0].length });
      }
    }
    hits.sort(function (a, b) { return a.at - b.at; });

    // 去掉互相重叠的匹配 + 同一个房间号只留一次
    // （注意：2512132115852_99434 这种会被两个正则同时命中，必须按"上一个匹配的结束位置"去重，
    //   否则 2512132115852 会被当成另一个房间）
    var uniq = [], seen = {}, lastEnd = -1;
    for (var i = 0; i < hits.length; i++) {
      var h = hits[i];
      if (h.at < lastEnd) continue;
      lastEnd = h.end;
      if (seen[h.uid]) continue;
      seen[h.uid] = 1;
      uniq.push(h);
    }

    var rows = [];
    for (var j = 0; j < uniq.length; j++) {
      var cur = uniq[j];
      var nextAt = (j + 1 < uniq.length) ? uniq[j + 1].at : raw.length;

      // ① 优先：房间号之后 → 下一个房间号之前的所有内容
      //    多行备注（长文字）要全部保留；只跳过"带时间的聊天消息头"（如 "SG.阿飞 16:42"）
      var seg = raw.slice(cur.end, nextAt);
      var segLines = seg.split("\n");
      var keep = [];
      for (var li = 0; li < segLines.length; li++) {
        var ln = segLines[li];
        if (!ln || !ln.trim()) continue;
        if (/\d{1,2}:\d{2}/.test(ln)) continue;      // 这一行是下一条消息的昵称+时间
        var onlyTag = false;                         // 整行只有一个标签名 → 当标签，不算备注
        var lt = ln.trim();
        for (var tk = 0; tk < state.publishTags.length; tk++) {
          if (lt === state.publishTags[tk]) { onlyTag = true; break; }
        }
        if (onlyTag) continue;
        keep.push(ln);
        if (keep.length >= 4) break;                 // 最多融合 4 行，防止吃进无关内容
      }
      var after = keep.length ? cleanNote(keep.join(" ")) : "";
      // ② 兜底：同一行里房间号之前的内容（备注写在号前面的情况）
      var lineStart = raw.lastIndexOf("\n", cur.at - 1);
      lineStart = (lineStart === -1) ? 0 : lineStart + 1;
      var before = cleanNote(raw.slice(lineStart, cur.at));
      // ③ 再兜底：上一行（房间号单独一行、备注在上一行）
      var note = after;
      if (note.length < 2) note = before;
      if (note.length < 2) {
        var prevLineEnd = lineStart - 1;
        var prevLineStart = raw.lastIndexOf("\n", Math.max(0, prevLineEnd - 1));
        prevLineStart = (prevLineStart === -1) ? 0 : prevLineStart + 1;
        note = cleanNote(raw.slice(prevLineStart, prevLineEnd));
      }

      // 标签：只看"房间号所在行 → 下一个房间号"这段，取出现位置最早的
      var tagLineStart = raw.lastIndexOf("\n", cur.at - 1);
      tagLineStart = (tagLineStart === -1) ? 0 : tagLineStart + 1;
      var around = raw.slice(tagLineStart, nextAt);
      var tag = "", bestPos = -1;
      for (var k = 0; k < state.publishTags.length; k++) {
        var pos = around.indexOf(state.publishTags[k]);
        if (pos > -1 && (bestPos === -1 || pos < bestPos)) { bestPos = pos; tag = state.publishTags[k]; }
      }
      // 兜底：本房间区段里没找到，就看看整段文字（只有一个房间时整段都是它的上下文）
      if (!tag) {
        for (var k2 = 0; k2 < state.publishTags.length; k2++) {
          if (raw.indexOf(state.publishTags[k2]) > -1) { tag = state.publishTags[k2]; break; }
        }
      }
      // 只有标签明确写在房间号前面时（例如「雪谷 2512… 备注」）才从备注里删掉；
      // 如果是备注正文里顺带提到的（例如「挂机老头带一151朋友」），备注要原样保留
      var uidOffset = cur.at - tagLineStart;
      if (tag && bestPos < uidOffset) note = note.split(tag).join(" ");
      note = cleanNote(note).slice(0, 100);

      rows.push({ uid: cur.uid, note: note || "无", tag: tag, checked: true });
    }
    return rows;
  }

  function renderImportTagSelect(curr) {
    el.fImportTag.innerHTML = '<option value="">无标签</option>'
      + state.publishTags.map(function (t) {
          return '<option value="' + escapeHtml(t) + '"' + (t === curr ? " selected" : "") + ">" + escapeHtml(t) + "</option>";
        }).join("");
    el.fImportTag.value = (curr && state.publishTags.indexOf(curr) > -1) ? curr : "";
  }

  function setImportHint(kind, text) {
    el.importHint.className = "parse-hint" + (kind ? " " + kind : "");
    el.importHint.textContent = text;
  }

  function resetImportBox() {
    importRows = [];
    el.fImportText.value = ""; el.fImportUid.value = ""; el.fImportNote.value = "";
    el.importMulti.style.display = "none";
    renderImportTagSelect("");
    setImportHint("", "粘贴后会自动填好下面的内容");
  }

  /* 粘贴即识别：不用点按钮，一边粘一边填好下面三个框 */
  el.fImportText.addEventListener("input", function () {
    var text = el.fImportText.value;
    if (!text.trim()) {
      importRows = [];
      el.importMulti.style.display = "none";
      setImportHint("", "粘贴后会自动填好下面的内容");
      return;
    }
    importRows = parseBatchText(text);
    if (!importRows.length) {
      el.importMulti.style.display = "none";
      setImportHint("bad", "⚠️ 没识别到房间号（形如 2512132115852_99434），请在下面手动填写");
      return;
    }
    var first = importRows[0];
    el.fImportUid.value = first.uid;
    el.fImportNote.value = (first.note && first.note !== "无") ? first.note : "";
    renderImportTagSelect(first.tag || "");
    setImportHint("ok", "✅ 已识别：UID " + first.uid + (first.tag ? " · 标签 " + first.tag : "")
      + "，确认无误后点下面的按钮发布");
    if (importRows.length > 1) {
      el.importMultiCount.textContent = String(importRows.length);
      el.importMulti.style.display = "block";
    } else {
      el.importMulti.style.display = "none";
    }
  });

  function doImport(list, btn) {
    if (!list.length) { showToast("没有可导入的房间"); return; }
    if (!list[0].uid) { showToast("请填写房间UID"); el.fImportUid.focus(); return; }

    if (state.mode !== "online") {
      list.forEach(function (r, i) {
        state.rooms.unshift({ id: "local_" + uid() + i, uid: r.uid, note: r.note || "无", tag: r.tag || "",
          createdAt: Date.now() - i * 1000, expiresAt: Date.now() + CONFIG.ttlMs, copies: 0 });
      });
      saveLocal(); render(); resetImportBox();
      showToast("已导入 " + list.length + " 个房间（仅本机）");
      return;
    }

    btn.disabled = true;
    api("/api/admin/import", { method: "POST", adminKey: adminKey, body: { rooms: list } })
      .then(function (res) {
        btn.disabled = false;
        if (res.imported > 0) {
          showToast("✅ 已发布 " + res.imported + " 个房间");
          resetImportBox();
          refreshRooms().catch(function () {});
          refreshInfo();
        } else if (res.skipped && res.skipped.length) {
          showToast("⚠️ " + res.skipped[0].reason);
        } else {
          showToast("没有导入任何房间");
        }
      })
      .catch(function (err) {
        btn.disabled = false;
        showToast((err && err.message) ? err.message : "发布失败");
      });
  }

  /* 单个发布：直接用上面三个（可编辑的）字段 */
  el.importOneBtn.addEventListener("click", function () {
    doImport([{ uid: el.fImportUid.value.trim(), note: el.fImportNote.value.trim(), tag: el.fImportTag.value }], el.importOneBtn);
  });

  /* 一次粘了多个房间时的额外按钮 */
  el.importAllBtn.addEventListener("click", function () {
    doImport(importRows.map(function (r) { return { uid: r.uid, note: r.note, tag: r.tag }; }), el.importAllBtn);
  });

  /* ---------------- 界面配色 ---------------- */
  var COLOR_KEY = "pixel-room-finder-color";
  /* sw = 色板显示的颜色；c = 实际用于按钮/标签的主色；d = 深一档；s = 浅底 */
  var THEMES = [
    { k: "white",  n: "极简白", sw: "#ffffff", c: "#6b7280", d: "#4b5563", s: "#f3f4f6" },
    { k: "gray",   n: "素雅灰", sw: "#f0f2f5", c: "#8b95a5", d: "#6d7789", s: "#eef0f4" },
    { k: "mint",   n: "浅葱绿", sw: "#3ed9c8", c: "#2bc4b4", d: "#1ea79a", s: "#e3f8f6" },
    { k: "yellow", n: "盛夏黄", sw: "#ffe066", c: "#e0b100", d: "#bf9600", s: "#fff8dd" },
    { k: "pink",   n: "桃桃粉", sw: "#ffa8b8", c: "#ff7f97", d: "#ef5f7b", s: "#ffedf1" },
    { k: "purple", n: "星辰紫", sw: "#7b4dff", c: "#7b4dff", d: "#6435e8", s: "#f0eaff" },
    { k: "blue",   n: "经典蓝", sw: "#2f7dff", c: "#2f7dff", d: "#1f6bff", s: "#eaf3ff" },
    { k: "red",    n: "元气红", sw: "#ff6b7a", c: "#ff5f70", d: "#e8434f", s: "#ffeaec" },
    { k: "black",  n: "极致黑", sw: "#2b2b2b", c: "#3a3a3a", d: "#1a1a1a", s: "#eeeef0" }
  ];
  function hex2rgb(h) {
    h = String(h).replace("#", "");
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  }
  function rgb2hex(r,g,b) {
    return "#" + [r,g,b].map(function(v){
      var s = Math.max(0, Math.min(255, Math.round(v))).toString(16);
      return s.length === 1 ? "0"+s : s;
    }).join("");
  }
  function mixColor(a, b, t) {
    var A = hex2rgb(a), B = hex2rgb(b);
    return rgb2hex(A[0]+(B[0]-A[0])*t, A[1]+(B[1]-A[1])*t, A[2]+(B[2]-A[2])*t);
  }
  function luminance(h) { var c = hex2rgb(h); return 0.299*c[0] + 0.587*c[1] + 0.114*c[2]; }

  function applyThemeColor(key) {
    var t = null;
    for (var i = 0; i < THEMES.length; i++) if (THEMES[i].k === key) t = THEMES[i];
    if (!t) t = THEMES[6];                       // 默认「经典蓝」
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    var c = t.c, d = t.d, soft = t.s;
    if (dark && luminance(c) < 120) {            // 深色模式下把过暗的主题色提亮
      c = mixColor(c, "#ffffff", 0.50);
      d = mixColor(d, "#ffffff", 0.35);
      soft = mixColor(t.c, "#16233a", 0.74);
    } else if (dark) {
      soft = mixColor(t.c, "#16233a", 0.78);
    }
    var r = document.documentElement.style;
    r.setProperty("--theme-c", c);
    r.setProperty("--theme-strong", d);
    r.setProperty("--theme-soft", soft);
    r.setProperty("--on-theme", luminance(c) > 168 ? "#1b2430" : "#ffffff");
    state.colorKey = t.k;
    try { localStorage.setItem(COLOR_KEY, t.k); } catch (e) {}
    renderThemeGrid();
  }
  function renderThemeGrid() {
    if (!el.themeGrid) return;
    el.themeGrid.innerHTML = THEMES.map(function (t) {
      return '<button class="theme-item' + (t.k === state.colorKey ? " active" : "") + '" type="button" data-color="' + t.k + '">'
        + '<span class="theme-sw" style="background:' + t.sw + '"></span>'
        + '<span class="theme-name">' + t.n + "</span></button>";
    }).join("");
  }
  el.colorBtn.addEventListener("click", function () {
    renderThemeGrid();
    el.colorMask.classList.add("open");
  });
  el.colorCloseBtn.addEventListener("click", function () { el.colorMask.classList.remove("open"); });
  el.colorMask.addEventListener("click", function (e) { if (e.target === el.colorMask) el.colorMask.classList.remove("open"); });
  el.themeGrid.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest("[data-color]") : null;
    if (!btn) return;
    applyThemeColor(btn.getAttribute("data-color"));
  });

  /* ---------------- 添加到桌面（App 图标） ---------------- */
  var deferredInstall = null;

  function isStandalone() {
    try {
      if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) return true;
    } catch (e) {}
    return !!(window.navigator && window.navigator.standalone === true);   // iOS Safari 专用标记
  }
  function isIOS() {
    var ua = navigator.userAgent || "";
    if (/iPad|iPhone|iPod/.test(ua)) return true;
    return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;  // iPadOS 13+ 伪装成 Mac
  }
  function isAndroid() { return /Android/i.test(navigator.userAgent || ""); }
  function isInAppBrowser() {
    // 注意：QQ 浏览器（MQQBrowser）是正经浏览器，能加到桌面；只有 QQ APP 内置浏览器不行
    return /MicroMessenger|Weibo|Alipay|DingTalk|QQ\/[\d.]+/i.test(navigator.userAgent || "");
  }
  /* 安卓浏览器五花八门，按 UA 分辨出具体是哪一家，给对应的菜单路径 */
  function detectBrowser() {
    var ua = navigator.userAgent || "";
    if (/MicroMessenger/i.test(ua)) return "wechat";
    if (/QQ\/[\d.]+/i.test(ua) && !/MQQBrowser/i.test(ua)) return "qqapp";
    if (/MQQBrowser/i.test(ua)) return "qqbrowser";
    if (/UCBrowser|UBrowser|UCWEB/i.test(ua)) return "uc";
    if (/HuaweiBrowser|HBPC/i.test(ua)) return "huawei";
    if (/MiuiBrowser|XiaoMi/i.test(ua)) return "miui";
    if (/realme|RMX\d|HeyTapBrowser|OppoBrowser|\bOPPO\b/i.test(ua)) return "realme";
    if (/vivoBrowser|VivoBrowser|\bvivo\b/i.test(ua)) return "vivo";
    if (/baidubrowser|BIDUBrowser|baiduboxapp/i.test(ua)) return "baidu";
    if (/SamsungBrowser/i.test(ua)) return "samsung";
    if (/EdgA?\//i.test(ua)) return "edge";
    if (/Firefox|FxiOS/i.test(ua)) return "firefox";
    if (/Chrome\//i.test(ua)) return "chrome";
    return "other";
  }
  /* 各家浏览器"添加到桌面"的菜单路径 */
  var BROWSER_GUIDE = {
    chrome:   { name: "Chrome", steps: ["点右上角的 <b>⋮</b> 菜单", "选「<b>安装应用</b>」或「<b>添加到主屏幕</b>」", "确认后桌面就出现图标了"] },
    edge:     { name: "Edge", steps: ["点底部中间的 <b>≡</b> 菜单", "选「<b>添加到手机</b>」", "确认后桌面就出现图标了"] },
    samsung:  { name: "三星浏览器", steps: ["点底部中间的 <b>≡</b> 菜单", "选「<b>添加页面到</b>」→「<b>主屏幕</b>」", "确认后桌面就出现图标了"] },
    huawei:   { name: "华为浏览器", steps: ["点底部中间的 <b>≡</b> 菜单", "选「<b>添加到桌面</b>」", "确认后桌面就出现图标了"] },
    miui:     { name: "小米浏览器", steps: ["点底部中间的 <b>≡</b> 菜单", "选「<b>添加到主屏幕</b>」", "确认后桌面就出现图标了"] },
    uc:       { name: "UC 浏览器", steps: ["点底部中间的 <b>≡</b> 菜单", "选「<b>添加书签</b>」或「<b>添加到桌面</b>」", "保存位置选「<b>桌面</b>」"] },
    qqbrowser:{ name: "QQ 浏览器", steps: ["点底部中间的 <b>≡</b> 菜单", "选「<b>添加到桌面</b>」（没有就选「添加书签」）", "确认后桌面就出现图标了"] },
    baidu:    { name: "百度浏览器", steps: ["点底部中间的 <b>≡</b> 菜单", "选「<b>添加到桌面</b>」", "确认后桌面就出现图标了"] },
    realme:   { name: "realme 浏览器", steps: ["点底部中间的 <b>≡</b> 菜单", "选「<b>添加到桌面</b>」；如果只有「<b>添加书签</b>」，就选它并把位置存成「<b>桌面</b>」", "如果两个都没有，说明这个浏览器不支持，请点下面的「换浏览器打开」"] },
    oppo:     { name: "OPPO 浏览器", steps: ["点底部或右上角的菜单", "选「<b>添加到桌面</b>」", "确认后桌面就出现图标了"] },
    vivo:     { name: "vivo 浏览器", steps: ["点底部或右上角的菜单", "选「<b>添加到桌面</b>」", "确认后桌面就出现图标了"] },
    firefox:  { name: "Firefox", steps: ["点右上角的 <b>⋮</b> 菜单", "选「<b>安装</b>」或「<b>添加到主屏幕</b>」", "确认后桌面就出现图标了"] },
    wechat:   { name: "微信内置浏览器", steps: ["点右上角的 <b>···</b> 菜单", "选「<b>在浏览器打开</b>」", "在系统浏览器里再点一次「<b>添加桌面</b>」"] },
    qqapp:    { name: "QQ 内置浏览器", steps: ["点右上角的 <b>···</b> 菜单", "选「<b>在浏览器打开</b>」", "在系统浏览器里再点一次「<b>添加桌面</b>」"] },
    other:    { name: "你的浏览器", steps: ["点浏览器的菜单（<b>⋮</b> 或 <b>≡</b>，一般在右上或底部）", "找「<b>添加到主屏幕</b>」/「<b>添加到桌面</b>」/「<b>添加书签</b>」", "保存到「<b>主屏幕</b>」即可"] }
  };

  function showInstallGuide() {
    var ua = navigator.userAgent || "";
    var inApp = /MicroMessenger/i.test(ua) || isInAppBrowser();
    var key = inApp ? (/MicroMessenger/i.test(ua) ? "wechat" : "qqapp") : detectBrowser();
    var g = BROWSER_GUIDE[key] || BROWSER_GUIDE.other;

    var title, sub, steps, needCopy = false;
    if (inApp) {
      title = "先在浏览器里打开";
      sub = g.name + "里不能直接添加，换到系统浏览器就行";
      steps = g.steps;
    } else if (isIOS()) {
      title = "添加到 iPhone 桌面";
      sub = "在 Safari 里操作，10 秒搞定";
      steps = [
        "点浏览器<b>底部中间</b>的「分享」按钮 <b>⬆︎</b>（方框带向上箭头）",
        "在弹出菜单里往下滑，找到「<b>添加到主屏幕</b>」",
        "点右上角「<b>添加</b>」，桌面就出现 SG 图标了"
      ];
    } else {
      title = "添加到手机桌面";
      sub = "检测到你在用 " + g.name + "，按下面 3 步操作";
      steps = g.steps;
      needCopy = true;
    }

    el.guideTitle.textContent = title;
    el.guideSub.textContent = sub;
    var html = steps.map(function (t, i) {
      return '<div class="guide-step"><span class="guide-num">' + (i + 1) + "</span><span>" + t + "</span></div>";
    }).join("");
    html += '<div class="guide-tip">试了还是不行？说明这个浏览器不支持"添加到桌面"，'
         + '可以点上面的<b>换一个浏览器打开</b>（推荐 Chrome），或者直接用<b>微信/QQ 收藏</b>这个页面，一样方便。</div>';
    if (needCopy) {
      if (isAndroid()) {
        html += '<a class="ghost" id="guideOpenBtn" href="intent://sg-pixel2.netlify.app/#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end">'
             + "换一个浏览器打开</a>";
      }
      html += '<button class="ghost" id="guideCopyBtn" type="button">复制网址（粘到 Chrome 里打开）</button>';
    }
    el.guideBody.innerHTML = html;
    el.guideMask.classList.add("open");
  }

  /* 引导页里的「复制网址」 */
  el.guideBody.addEventListener("click", function (e) {
    if (!e.target || e.target.id !== "guideCopyBtn") return;
    copyText("https://sg-pixel2.netlify.app").then(function (ok) {
      showToast(ok ? "✅ 网址已复制，粘到 Chrome 里打开" : "复制失败，请长按网址复制");
    });
  });

  el.guideCloseBtn.addEventListener("click", function () { el.guideMask.classList.remove("open"); });
  el.guideMask.addEventListener("click", function (e) { if (e.target === el.guideMask) el.guideMask.classList.remove("open"); });

  /* 安卓 Chrome 支持系统级安装弹窗，拦下来由我们的按钮触发 */
  if (window.addEventListener) {
    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      deferredInstall = e;
    });
    window.addEventListener("appinstalled", function () {
      deferredInstall = null;
      el.installBtn.style.display = "none";
      showToast("✅ 已添加到桌面");
    });
  }

  el.installBtn.addEventListener("click", function () {
    if (isStandalone()) { showToast("已经在桌面上了 👍"); return; }
    if (deferredInstall) {                       // 安卓：走系统原生安装流程
      deferredInstall.prompt();
      var p = deferredInstall.userChoice;
      deferredInstall = null;
      if (p && p.then) p.then(function (r) {
        if (r && r.outcome === "accepted") showToast("✅ 正在添加到桌面…");
      }).catch(function () {});
      return;
    }
    showInstallGuide();                          // iOS / 不支持原生安装时：给图文步骤
  });

  if (isStandalone()) el.installBtn.style.display = "none";   // 已经装过了就不再显示
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }

  /* 顶部背景图功能已下线（管理员觉得效果不好）。后端接口保留，以后想启用再加界面。 */
  function applyHeaderBg() {
    var r = document.documentElement.style;
    r.removeProperty("--header-bg-img");
    r.removeProperty("--header-bg-size");
  }

  /* ---------------- 刷新房间 ---------------- */
  el.refreshBtn.addEventListener("click", function () {
    if (el.refreshBtn.classList.contains("spinning")) return;
    if (state.mode !== "online") { render(); showToast("已刷新"); return; }
    el.refreshBtn.classList.add("spinning");
    Promise.all([refreshRooms(), refreshInfo()]).then(function () {
      el.refreshBtn.classList.remove("spinning");
      var n = state.rooms.filter(function (r) { return r.expiresAt > Date.now(); }).length;
      showToast(n ? "已刷新，当前 " + n + " 个房间" : "已刷新，暂时没有房间");
    }).catch(function () {
      el.refreshBtn.classList.remove("spinning");
      showToast("刷新失败，请检查网络");
    });
  });


  /* ---------------- 像素百科 ---------------- */
  state.wiki.sort = state.wiki.sort || "today";
  state.wiki.adminPreview = false;
  state.wiki.stats = state.wiki.stats || { visitors: 0, newPosts: 0, clicks: 0 };
  state.wiki.bubbleOverride = "";
  state.wiki.page = state.wiki.page || 1;
  state.wiki.total = state.wiki.total || 0;
  state.wiki.hasMore = !!state.wiki.hasMore;
  state.wiki.loading = false;
  state.wiki.adminPage = state.wiki.adminPage || 1;
  state.wiki.adminTotal = state.wiki.adminTotal || 0;
  state.wiki.adminHasMore = !!state.wiki.adminHasMore;
  state.wiki.adminLoading = false;
  state.wiki.adminItems = state.wiki.adminItems || [];
  var FIXED_WIKI_CATEGORIES = ["攻略", "图鉴", "地图"];
  var CODEX_SCHEMA = {
    "怪物": { label: "怪物图鉴", fields: [
      { key: "hp", label: "血量", placeholder: "例如 25000", card: true },
      { key: "attack", label: "攻击", placeholder: "例如 42", card: true },
      { key: "map", label: "出现地图", placeholder: "例如 玛卡拉东部", card: true }
    ] },
    "武器": { label: "武器图鉴", fields: [
      { key: "attack", label: "攻击力", placeholder: "例如 120", card: true },
      { key: "speed", label: "攻速", placeholder: "例如 1.2", card: true },
      { key: "acquire", label: "获取方式", placeholder: "例如 冰洞掉落 / 制作", card: true }
    ] },
    "材料": { label: "材料图鉴", fields: [
      { key: "acquire", label: "获取方式", placeholder: "例如 雪谷冰洞采集", card: true }
    ] },
    "饰品": { label: "饰品图鉴", fields: [
      { key: "acquire", label: "获取方式", placeholder: "例如 Boss 掉落 / 制作", card: true }
    ] },
    "装备": { label: "装备图鉴", fields: [
      { key: "attack", label: "攻击", placeholder: "例如 80", card: true },
      { key: "defense", label: "防御", placeholder: "例如 60", card: true },
      { key: "hp", label: "血量", placeholder: "例如 1500", card: true },
      { key: "stamina", label: "耐力", placeholder: "例如 20", card: true },
      { key: "mana", label: "法力", placeholder: "例如 10", card: false },
      { key: "magic", label: "法攻", placeholder: "例如 6", card: true, required: false },
      { key: "acquire", label: "获取方式", placeholder: "例如 Boss 掉落 / 制作", card: true }
    ] }
  };
  state.wiki.type = state.wiki.type || "怪物";
  state.wiki.fieldValues = state.wiki.fieldValues || {};
  state.wiki.coverPosX = state.wiki.coverPosX == null ? 50 : state.wiki.coverPosX;
  state.wiki.coverPosY = state.wiki.coverPosY == null ? 50 : state.wiki.coverPosY;
  state.wiki.detailArticle = null;
  state.wiki.coverTargetId = null;
  state.wiki.editMode = "";
  state.wiki.editBatchId = "";
  state.wiki.cropFrame = 0;
  state.mail = state.mail || { templates: [], officialEmail: "未设置", current: null, images: [], search: "", listScrollTop: 0, lastLoadedAt: 0 };
  state.pendingAdminReview = null;
  state.pendingAdminDelete = null;
  function wikiImageUrl(id) {
    return (CONFIG.apiBase || "") + "/api/wiki/images/" + encodeURIComponent(String(id || ""));
  }
  function wikiStatusText(s) {
    return s === "published" ? "已发布" : (s === "rejected" ? "已退回" : "待审核");
  }
  function wikiTypeLabel(a) {
    return a && a.category === "图鉴" && CODEX_SCHEMA[a.wikiType] ? CODEX_SCHEMA[a.wikiType].label : (a && a.category === "图鉴" ? "图鉴" : (a ? a.category : ""));
  }
  function firstUrlFromHtml(html) {
    var text = String(html || "").replace(/<[^>]*>/g, " ");
    var m = text.match(/https?:\/\/[^\s<>"']+/i);
    return m ? m[0].replace(/[，。,.、；;：:！!？?）)\]}】》]+$/g, "") : "";
  }
  function wikiCoverPos(a) {
    var x = Math.max(0, Math.min(100, Number(a && a.coverPosX == null ? 50 : a.coverPosX) || 50));
    var y = Math.max(0, Math.min(100, Number(a && a.coverPosY == null ? 50 : a.coverPosY) || 50));
    return "object-position:" + x + "% " + y + "%";
  }
  function wikiFieldTags(a, cardOnly, limit) {
    if (!a || a.category !== "图鉴" || !a.fields) return [];
    var schema = CODEX_SCHEMA[a.wikiType];
    if (!schema) return [];
    var out = [];
    schema.fields.forEach(function (f) {
      if (cardOnly && !f.card) return;
      if (a.fields[f.key]) out.push({ label: f.label, value: a.fields[f.key] });
    });
    return out.slice(0, limit || 99);
  }
  function mailBatchId() {
    try { var k="pixel-mail-batch"; var v=sessionStorage.getItem(k); if(!v){v="mail_"+uid();sessionStorage.setItem(k,v);} return v; } catch(e) { if(!state.mail.batchId) state.mail.batchId="mail_"+uid(); return state.mail.batchId; }
  }
  function wikiEditBatchId() {
    try {
      var k = "pixel-wiki-edit-batch";
      var v = sessionStorage.getItem(k);
      if (!v) { v = "edit_" + uid(); sessionStorage.setItem(k, v); }
      return v;
    } catch (e) {
      if (!state.wiki.editBatchId) state.wiki.editBatchId = "edit_" + uid();
      return state.wiki.editBatchId;
    }
  }
  function setWikiCoverFieldVisible(show) {
    var field = el.wikiCoverUpload ? el.wikiCoverUpload.closest(".wiki-field") : null;
    if (field) field.style.display = show ? "block" : "none";
  }
  function showWikiView(view) {
    state.wiki.view = view || "list";
    var map = { list: "wikiListView", detail: "wikiDetailView", submit: "wikiSubmitView", mailList: "mailListView", mailDetail: "mailDetailView", mailSubmit: "mailSubmitView" };
    Object.keys(map).forEach(function (k) { el[map[k]].classList.toggle("active", k === view); });
    el.wikiBackBtn.style.display = view === "list" ? "none" : "grid";
    el.wikiSubmitBtn.style.display = view === "list" ? "block" : "none";
    if (view === "list") el.wikiTitle.textContent = "Pixel Survival Game 2 中文百科";
    else if (view === "detail") el.wikiTitle.textContent = state.wiki.adminPreview ? "内容预览" : "词条详情";
    else if (view === "submit") el.wikiTitle.textContent = state.wiki.editing ? "编辑词条" : "投稿百科";
    else if (view === "mailList") el.wikiTitle.textContent = "邮箱模板";
    else if (view === "mailDetail") el.wikiTitle.textContent = "邮箱模板详情";
    else el.wikiTitle.textContent = "投稿邮箱模板";
    if (el.wikiSub) el.wikiSub.textContent = view === "submit" || view === "mailSubmit" ? "提交后由管理员审核" : "";
    if (el.wikiBody) el.wikiBody.scrollTop = 0;
  }
  function renderWikiTabs() {
    if (!el.wikiTabs) return;
    var cats = ["全部"].concat(state.wiki.categories || []);
    el.wikiTabs.innerHTML = cats.map(function (c) {
      return '<button class="wiki-tab' + (c === state.wiki.category ? " active" : "") + '" type="button" data-wiki-tab="' + escapeHtml(c) + '">' + escapeHtml(c) + "</button>";
    }).join("");
    if (el.wikiCount) el.wikiCount.textContent = (state.wiki.total || state.wiki.items.length || 0) + " 个词条";
    var isCodex = state.wiki.category === "图鉴";
    if (!isCodex && state.wiki.subtype) state.wiki.subtype = "";
    if (el.wikiSubTabs) {
      el.wikiSubTabs.classList.toggle("show", isCodex);
      el.wikiSubTabs.style.display = isCodex ? "flex" : "none";
      el.wikiSubTabs.innerHTML = isCodex ? ["", "怪物", "武器", "装备", "饰品", "材料"].map(function (t) { return '<button type="button" class="wiki-subtab' + (state.wiki.subtype === t ? " active" : "") + '" data-wiki-subtype="' + escapeHtml(t) + '">' + (t || "全部") + '</button>'; }).join("") : "";
    }
    document.querySelectorAll("[data-wiki-sort]").forEach(function (b) { if (b.getAttribute("data-wiki-sort") === "random") b.style.display = isCodex ? "block" : "none"; });
  }
  function updateWikiMoreButton() {
    if (!el.wikiMoreBtn) return;
    el.wikiMoreBtn.style.display = state.wiki.hasMore ? "block" : "none";
    el.wikiMoreBtn.disabled = !!state.wiki.loading;
    el.wikiMoreBtn.textContent = state.wiki.loading ? "加载中…" : "加载更多";
  }
  function wikiCardHtml(a, i, featureAllowed) {
    var cover = a.coverId ? '<div class="wiki-cover' + (a.category === "图鉴" ? "" : " cover-wide") + '"><img src="' + escapeHtml(wikiImageUrl(a.coverId)) + '" alt="" loading="lazy" decoding="async" style="' + wikiCoverPos(a) + '"></div>' : '<div class="wiki-cover' + (a.category === "图鉴" ? "" : " cover-wide") + '">像素百科</div>';
    var feature = featureAllowed && i === 0 && state.wiki.page === 1 && !state.wiki.keyword && state.wiki.category === "全部" ? " wiki-feature" : "";
    var tags = wikiFieldTags(a, true, 5).map(function (t) { return '<span class="wiki-field-tag">' + escapeHtml(t.label + " " + t.value) + '</span>'; }).join("");
    return '<article class="wiki-card' + feature + '" data-wiki-id="' + escapeHtml(a.id) + '">' + cover
      + '<div class="wiki-card-main"><h4>' + escapeHtml(a.title) + '</h4><p>' + escapeHtml(a.summary || "点击查看详情") + '</p>'
      + '<div class="wiki-card-meta"><span class="wiki-chip">' + escapeHtml(wikiTypeLabel(a)) + '</span><b>' + escapeHtml(a.nickname) + '</b><span>' + (a.views || 0) + ' 总浏览' + (a.todayViews ? ' · ' + a.todayViews + ' 今日' : "") + "</span></div>" + (tags ? '<div class="wiki-field-tags">' + tags + '</div>' : "") + "</div></article>";
  }
  function appendWikiList(items, startIndex) {
    if (!el.wikiList || !items.length) return;
    el.wikiList.insertAdjacentHTML("beforeend", items.map(function (a, i) {
      return wikiCardHtml(a, startIndex + i, false);
    }).join(""));
  }
  function renderWikiList() {
    if (!el.wikiList) return;
    var items = (state.wiki.items || []).slice();
    if (el.wikiSortLabel) el.wikiSortLabel.textContent = state.wiki.sort === "random" ? "随机排序" : (state.wiki.sort === "new" ? "按发布时间" : "按今日点击量");
    document.querySelectorAll("[data-wiki-sort]").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-wiki-sort") === state.wiki.sort); });
    updateWikiMoreButton();
    if (!items.length) {
      el.wikiList.innerHTML = '<div class="wiki-empty"><strong>还没有内容</strong><br>成为第一个投稿的人吧</div>';
      renderWikiTabs();
      return;
    }
    el.wikiList.innerHTML = items.map(function (a, i) { return wikiCardHtml(a, i, true); }).join("");
    renderWikiTabs();
  }
  function loadWikiData(reset, append) {
    if (state.wiki.loading) return Promise.resolve();
    if (state.mode !== "online") {
      state.wiki.total = (state.wiki.items || []).length;
      state.wiki.hasMore = false;
      state.wiki.page = 1;
      renderWikiTabs(); renderWikiList(); return Promise.resolve();
    }
    if (reset) { state.wiki.items = []; state.wiki.page = 1; state.wiki.hasMore = false; }
    var page = append ? state.wiki.page + 1 : 1;
    var params = "page=" + page + "&limit=20&sort=" + encodeURIComponent(state.wiki.sort) + "&visitorId=" + encodeURIComponent(clientId());
    if (state.wiki.category && state.wiki.category !== "全部") params += "&category=" + encodeURIComponent(state.wiki.category);
    if (state.wiki.category === "图鉴" && state.wiki.subtype) params += "&wikiType=" + encodeURIComponent(state.wiki.subtype);
    if (state.wiki.sort === "random") params += "&seed=" + encodeURIComponent(state.wiki.randomSeed || "");
    if (state.wiki.keyword) params += "&q=" + encodeURIComponent(state.wiki.keyword);
    state.wiki.loading = true; updateWikiMoreButton();
    return api("/api/wiki?" + params).then(function (r) {
      var incoming = r.articles || [];
      var previousCount = (state.wiki.items || []).length;
      if (append) state.wiki.items = (state.wiki.items || []).concat(incoming);
      else state.wiki.items = incoming;
      state.wiki.page = r.page || page;
      state.wiki.total = typeof r.total === "number" ? r.total : state.wiki.items.length;
      state.wiki.hasMore = !!r.hasMore;
      if (r.categories && r.categories.length) state.wiki.categories = r.categories.slice();
      if (r.stats) state.wiki.stats = r.stats;
      if (state.wiki.category !== "全部" && state.wiki.categories.indexOf(state.wiki.category) === -1) state.wiki.category = "全部";
      state.wiki.loading = false;
      state.wiki.lastLoadedAt = Date.now();
      renderWikiTabs();
      if (append) appendWikiList(incoming, previousCount);
      else renderWikiList();
      updateWikiMoreButton();
      renderWikiBubble();
    }).catch(function (err) {
      state.wiki.loading = false;
      updateWikiMoreButton();
      showToast((err && err.message) ? err.message : "百科加载失败");
    });
  }
  function loadMoreWiki() {
    if (!state.wiki.hasMore || state.wiki.loading) return;
    return loadWikiData(false, true);
  }

  function renderWikiBubble() {
    if (!el.wikiBubbleText) return;
    if (state.wiki.bubbleOverride) { el.wikiBubbleText.textContent = state.wiki.bubbleOverride; return; }
    var st = state.wiki.stats || {};
    el.wikiBubbleText.textContent = "今日访客 " + (st.visitors || 0) + " 人 · 新增帖子 " + (st.newPosts || 0) + " 条 · 今日点击 " + (st.clicks || 0) + " 次";
  }
  function setNavPage(page) {
    if (!el.fab || !el.wikiBtn) return;
    var inWiki = page === "wiki";
    el.fab.classList.toggle("primary", !inWiki);
    el.wikiBtn.classList.toggle("primary", inWiki);
    el.fab.setAttribute("aria-current", inWiki ? "false" : "page");
    el.wikiBtn.setAttribute("aria-current", inWiki ? "page" : "false");
  }
  function openWiki() {
    setNavPage("wiki");
    state.wiki.adminPreview = false;
    state.wiki.bubbleOverride = "";
    el.fab.querySelector("span").textContent = "寻找房间";
    renderWikiBubble();
    el.wikiScreen.classList.add("open");
    el.wikiScreen.setAttribute("aria-hidden", "false");
    showWikiView("list");
    requestAnimationFrame(function () {
      if (state.mode === "online") {
        if (state.wiki.items.length && Date.now() - (state.wiki.lastLoadedAt || 0) < 60000) { renderWikiTabs(); renderWikiList(); renderWikiBubble(); }
        else loadWikiData(true);
      } else { state.wiki.categories = CONFIG.defaultWikiCategories.slice(); renderWikiTabs(); renderWikiList(); }
    });
  }
  function closeWiki() {
    setNavPage("room");
    closeImageViewer();
    el.wikiScreen.classList.remove("open");
    el.wikiScreen.setAttribute("aria-hidden", "true");
    state.wiki.editing = null;
    state.wiki.adminPreview = false;
    el.fab.querySelector("span").textContent = "发布房间";
    showWikiView("list");
  }
  function renderWikiDetail(a) {
    state.wiki.detailArticle = a;
    var cover = a.coverId ? '<div class="wiki-detail-cover' + (a.category === "图鉴" ? "" : " cover-wide") + '"><img src="' + escapeHtml(wikiImageUrl(a.coverId)) + '" alt="" loading="lazy" decoding="async" style="' + wikiCoverPos(a) + '"></div>' : '<div class="wiki-detail-cover' + (a.category === "图鉴" ? "" : " cover-wide") + '"></div>';
    var fieldTags = wikiFieldTags(a, false, 99).map(function (t) { return '<span class="wiki-field-tag">' + escapeHtml(t.label + "：" + t.value) + '</span>'; }).join("");
    var itemMeta = a.category === "图鉴" ? '<div class="wiki-card-meta" style="margin-top:8px"><span class="wiki-chip">' + escapeHtml(wikiTypeLabel(a)) + '</span>' + fieldTags + '</div>' : '<span class="wiki-chip">' + escapeHtml(a.category) + '</span>';
    var editBtn = '<button class="wiki-edit-small" type="button" data-wiki-edit="' + escapeHtml(a.id) + '">修改</button>';
    var adminCoverBtn = adminKey ? '<button class="wiki-admin-cover-btn" type="button" data-admin-cover="' + escapeHtml(a.id) + '">' + (a.coverId ? "更换图片" : "添加图片") + '</button>' : "";
    var adminDeleteBtn = adminKey ? '<button class="wiki-edit-small" type="button" data-admin-delete-wiki="' + escapeHtml(a.id) + '">删除</button>' : "";
    var detailVideoUrl = a.videoUrl || firstUrlFromHtml(a.content || "");
    var videoBtn = detailVideoUrl ? '<button class="wiki-video-btn" type="button" data-wiki-video="' + escapeHtml(detailVideoUrl) + '">观看视频</button>' : "";
    var detailActions = '<div class="wiki-detail-actions">' + videoBtn + editBtn + adminCoverBtn + adminDeleteBtn + '</div>';
    el.wikiDetail.innerHTML = cover
      + '<div class="wiki-detail-title-card">' + itemMeta + '<h3>' + escapeHtml(a.title) + '</h3><p>作者 ' + escapeHtml(a.nickname) + ' · ' + (a.views || 0) + ' 总浏览' + (a.todayViews ? ' · ' + a.todayViews + ' 今日' : "") + '</p>' + detailActions + '</div>'
      + '<article class="wiki-detail-card"><div class="wiki-detail-meta"><div class="wiki-avatar">' + escapeHtml((a.nickname || "?").slice(0, 1)) + '</div><div><b>' + escapeHtml(a.nickname) + '</b><br>游戏昵称已验证</div><span style="margin-left:auto">👁 ' + (a.views || 0) + '</span></div>'
      + '<div class="wiki-rich">' + (a.content || "") + '</div></article>';
    showWikiView("detail");
  }
  function openWikiDetail(id) {
    if (state.mode !== "online") { showToast("本地演示模式无法打开百科详情"); return; }
    state.wiki.listScrollTop = el.wikiBody ? el.wikiBody.scrollTop : 0;
    state.wiki.adminPreview = false;
    api("/api/wiki/" + encodeURIComponent(id)).then(function (r) { if (r.article) renderWikiDetail(r.article); }).catch(function (err) { showToast((err && err.message) ? err.message : "内容加载失败"); });
  }
  function openAdminWikiPreview(id) {
    api("/api/admin/wiki/" + encodeURIComponent(id), { adminKey: adminKey }).then(function (r) {
      state.wiki.adminPreview = true;
      setNavPage("wiki");
      el.adminMask.classList.remove("open");
      el.wikiScreen.classList.add("open");
      renderWikiDetail(r.article || {});
    }).catch(function (err) { showToast((err && err.message) ? err.message : "预览加载失败"); });
  }
  function queryWiki() {
    var code = String(el.wikiQueryInput.value || "").replace(/\D/g, "").slice(0, 6);
    el.wikiQueryInput.value = code;
    if (!/^\d{6}$/.test(code)) { showToast("请输入 6 位数字查询码"); return; }
    el.wikiQuerySubmitBtn.disabled = true;
    var done = function () { el.wikiQuerySubmitBtn.disabled = false; };
    api("/api/wiki/query", { method: "POST", body: { code: code } }).then(function (r) {
      done(); el.wikiQueryMask.classList.remove("open");
      if (r.type === "editGroup" || r.type === "mailGroup") {
        var edits = r.items || [];
        var pending = edits.filter(function (x) { return x.status === "pending"; }).length;
        var approved = edits.filter(function (x) { return x.status === "approved"; }).length;
        var rejected = edits.filter(function (x) { return x.status === "rejected"; }).length;
        state.wiki.bubbleOverride = (r.type === "mailGroup" ? "邮箱模板查询：" : "查询结果：") + "共 " + edits.length + " 条，待审核 " + pending + " 条、已通过 " + approved + " 条、已退回 " + rejected + " 条";
        renderWikiBubble();
        return;
      }
      var a = r.article || {};
      if (a.status === "published") {
        state.wiki.bubbleOverride = "查询结果：已发布《" + (a.title || "") + "》" + (a.category ? " · " + a.category : "");
      } else if (a.status === "rejected") {
        state.wiki.bubbleOverride = "查询结果：已退回《" + (a.title || "") + "》" + (a.rejectedReason ? "，原因：" + a.rejectedReason : "");
      } else {
        state.wiki.bubbleOverride = "查询结果：正在审核中《" + (a.title || "") + "》";
      }
      renderWikiBubble();
    }).catch(function (err) { done(); showToast((err && err.message) ? err.message : "没有找到这个查询码"); });
  }
  function openMailOfficialEditor() {
    el.mailOfficialInput.value = state.mail.officialEmail === "未设置" ? "" : (state.mail.officialEmail || "");
    el.mailOfficialMask.classList.add("open");
    setTimeout(function () { el.mailOfficialInput.focus(); }, 220);
  }
  function saveMailOfficialEmail() {
    var email = el.mailOfficialInput.value.trim();
    if (!email) { showToast("请输入官方邮箱"); return; }
    el.mailOfficialSaveBtn.disabled = true;
    api("/api/admin/mail/official", { method: "POST", body: { email: email }, adminKey: adminKey }).then(function (r) {
      el.mailOfficialSaveBtn.disabled = false; state.mail.officialEmail = r.officialEmail; renderMailBubble(); el.mailOfficialMask.classList.remove("open"); showToast("✅官方邮箱已更新");
    }).catch(function (err) { el.mailOfficialSaveBtn.disabled = false; showToast((err && err.message) ? err.message : "修改失败"); });
  }
  function renderMailBubble() {
    if (!el.mailBubbleText) return;
    el.mailBubbleText.textContent = "官方邮箱：" + (state.mail.officialEmail || "未设置") + (adminKey ? "（点击修改）" : "（点击复制）");
  }
  function loadMailData(force) {
    if (state.mode !== "online") { renderMailList(); return Promise.resolve(); }
    if (!force && state.mail.lastLoadedAt && Date.now() - state.mail.lastLoadedAt < 60000) {
      renderMailList(); renderMailBubble(); return Promise.resolve();
    }
    return api("/api/mail").then(function (r) {
      state.mail.templates = r.templates || [];
      state.mail.officialEmail = r.officialEmail || "未设置";
      state.mail.lastLoadedAt = Date.now();
      renderMailList(); renderMailBubble();
    }).catch(function () { renderMailList(); });
  }
  function renderMailList() {
    if (!el.mailList) return;
    var q = (state.mail.search || "").toLowerCase();
    var arr = (state.mail.templates || []).filter(function (m) {
      return !q || ((m.title || "") + " " + (m.publisher || "") + " " + (m.situation || "")).toLowerCase().indexOf(q) > -1;
    });
    el.mailCount.textContent = arr.length + " 个模板";
    el.mailList.innerHTML = arr.length ? arr.map(function (m) {
      return '<article class="mail-card" data-mail-id="' + escapeHtml(m.id) + '"><h4>' + escapeHtml(m.title) + '</h4><p>' + escapeHtml(m.situation || "") + '</p><div class="mail-publisher">发布者：' + escapeHtml(m.publisher || "SG.匿名") + '</div></article>';
    }).join("") : '<div class="wiki-empty">还没有邮箱模板</div>';
  }
  function openMailList() {
    if (el.mailOfficialEditBtn) el.mailOfficialEditBtn.style.display = adminKey ? "block" : "none";
    renderMailBubble();
    showWikiView("mailList");
    return loadMailData();
  }
  function renderMailDetail(m) {
    var imgs = (m.images || []).map(function (id) { return '<img src="' + escapeHtml(wikiImageUrl(id)) + '" alt="" loading="lazy" decoding="async">'; }).join("");
    var mailAdminDelete = adminKey ? '<div class="wiki-detail-actions"><button class="wiki-edit-small" type="button" data-admin-delete-mail="' + escapeHtml(m.id) + '">删除</button></div>' : "";
    el.mailDetail.innerHTML = '<div class="wiki-detail-title-card"><span class="wiki-chip">邮箱模板</span><h3>' + escapeHtml(m.title) + '</h3><p>发布者：' + escapeHtml(m.publisher || "SG.匿名") + '</p>' + mailAdminDelete + '</div><div class="wiki-detail-card"><div class="wiki-detail-meta"><div class="wiki-avatar">' + escapeHtml((m.publisher || "?").slice(0, 1)) + '</div><div><b>' + escapeHtml(m.publisher || "SG.匿名") + '</b><br>常用情形：' + escapeHtml(m.situation || "") + '</div></div><div class="mail-detail-body" data-mail-copy-body="' + escapeHtml(m.id) + '">' + escapeHtml(m.body || "") + '</div>' + (imgs ? '<div class="mail-detail-images">' + imgs + '</div>' : "") + '</div>';
    state.mail.current = m;
    showWikiView("mailDetail");
  }
  function openMailDetail(id) {
    state.mail.listScrollTop = el.wikiBody ? el.wikiBody.scrollTop : 0;
    var m = (state.mail.templates || []).find(function (x) { return x.id === id; });
    if (m) renderMailDetail(m);
  }
  function resetMailForm() {
    el.mailTitle.value = ""; el.mailPublisher.value = ""; el.mailSituation.value = ""; el.mailBody.value = "";
    state.mail.images = []; renderMailImages();
  }
  function renderMailImages() {
    el.mailImagePreview.innerHTML = (state.mail.images || []).map(function (id) { return '<img src="' + escapeHtml(wikiImageUrl(id)) + '" alt="" decoding="async">'; }).join("");
  }
  function submitMailTemplate() {
    var title = el.mailTitle.value.trim(), publisher = el.mailPublisher.value.trim() || "SG.匿名";
    var situation = el.mailSituation.value.trim(), body = el.mailBody.value.trim();
    if (!title || !situation || !body) { showToast("请填写标题、常用情形和正文"); return; }
    if (state.mode !== "online") { showToast("本地演示模式无法投稿"); return; }
    el.mailSubmitBtn.disabled = true;
    api("/api/mail", { method: "POST", body: { title: title, publisher: publisher, situation: situation, body: body, images: state.mail.images, batchId: mailBatchId(), adminKey: adminKey || undefined } }).then(function (r) {
      el.mailSubmitBtn.disabled = false; resetMailForm(); showWikiView("mailList"); loadMailData(true);
      if (adminKey || r.published) { showToast("✅邮箱模板已发布"); return; }
      if (r.isFirst) showWikiCodePopup(r.code || "", "本次会话继续投稿邮箱模板，将沿用这个查询码。");
      else showToast("✅已提交审核，继续沿用之前的查询码");
    }).catch(function (err) { el.mailSubmitBtn.disabled = false; showToast((err && err.message) ? err.message : "提交失败"); });
  }
  function renderWikiTypePick() {
    if (!el.wikiTypePick) return;
    if (!CODEX_SCHEMA[state.wiki.type]) state.wiki.type = "怪物";
    el.wikiTypePick.innerHTML = Object.keys(CODEX_SCHEMA).map(function (t) {
      return '<button type="button" class="' + (t === state.wiki.type ? "active" : "") + '" data-wiki-type="' + escapeHtml(t) + '">' + escapeHtml(CODEX_SCHEMA[t].label) + "</button>";
    }).join("");
  }
  function renderWikiDynamicFields() {
    if (!el.wikiDynamicFields) return;
    var schema = CODEX_SCHEMA[state.wiki.type] || CODEX_SCHEMA["怪物"];
    el.wikiDynamicFields.innerHTML = '<div class="wiki-dynamic-grid">' + schema.fields.map(function (f) {
      return '<div class="wiki-field' + (f.key === "acquire" ? " wide" : "") + '"><label for="wikiField_' + f.key + '">' + escapeHtml(f.label) + '</label><input class="wiki-input" id="wikiField_' + f.key + '" data-wiki-field="' + f.key + '" maxlength="120" placeholder="' + escapeHtml(f.placeholder) + '" value="' + escapeHtml(state.wiki.fieldValues[f.key] || "") + '" /></div>';
    }).join("") + '</div>';
  }
  function collectWikiFields() {
    var out = {};
    if (!el.wikiDynamicFields) return out;
    Array.prototype.forEach.call(el.wikiDynamicFields.querySelectorAll("[data-wiki-field]"), function (input) {
      out[input.getAttribute("data-wiki-field")] = input.value.trim();
    });
    return out;
  }
  function parseShareTitle(text) {
    var raw = String(text || "").trim();
    if (!/[【\[].*(哔哩哔哩|bilibili|b23\.tv)|b23\.tv|哔哩哔哩/i.test(raw)) return null;
    var url = (raw.match(/https?:\/\/[^\s]+/i) || [""])[0].replace(/[，。,.、；;：:）)\]}】》]+$/g, "");
    var title = "";
    var nested = raw.match(/【([^【]+)【[^】]*】[^】]*】/);
    if (nested) title = nested[1];
    if (!title) {
      var first = raw.match(/【([^】]+)】/);
      if (first) title = first[1];
    }
    if (!title) return null;
    title = title.replace(/【[^】]*像素生存者2[^】]*】/gi, "").replace(/\s*[-—]?\s*(哔哩哔哩|bilibili).*$/i, "").replace(/^[【\s]+|[】\s]+$/g, "").trim();
    return title ? { title: title, url: url } : null;
  }
  function extractUrlFromText(text) {
    var m = String(text || "").match(/https?:\/\/[^\s<>"']+/i);
    return m ? m[0].replace(/[，。,.、；;：:！!？?）)\]}】》]+$/g, "") : "";
  }
  function applyAutoTitle(text, source) {
    var parsed = parseShareTitle(text);
    if (!parsed) {
      var onlyUrl = extractUrlFromText(text);
      if (!onlyUrl) return;
      parsed = { title: "", url: onlyUrl };
    }
    var current = el.wikiFormTitle ? el.wikiFormTitle.value.trim() : "";
    if (parsed.title && (source === "title" || !current || /https?:|【/.test(current))) el.wikiFormTitle.value = parsed.title;
    if (parsed.url && el.wikiVideoUrl && !el.wikiVideoUrl.value.trim()) el.wikiVideoUrl.value = parsed.url;
    var message = parsed.title ? "已自动识别标题" : "已自动识别视频链接";
    if (state.wiki.lastAutoText !== text) { state.wiki.lastAutoText = text; showToast(message); }
  }
  function updateWikiFormForCategory() {
    var isCodex = state.wiki.pick === "图鉴";
    if (el.wikiCodexFields) el.wikiCodexFields.style.display = isCodex ? "block" : "none";
    if (el.wikiVideoField) el.wikiVideoField.style.display = state.wiki.pick === "攻略" ? "block" : "none";
    if (el.wikiTitleLabel) el.wikiTitleLabel.textContent = isCodex ? "名称" : "标题";
    if (el.wikiFormTitle) el.wikiFormTitle.placeholder = isCodex ? "例如：寒晶矿" : "例如：雪谷速通路线与物资点";
    var imgBtn = document.querySelector("#wikiSubmitView .ql-toolbar .ql-image") || (el.wikiEditor ? el.wikiEditor.querySelector(".ql-image") : null);
    if (imgBtn) imgBtn.style.display = isCodex ? "none" : "inline-block";
    if (isCodex && state.wiki.quill) {
      var imgs = state.wiki.quill.root.querySelectorAll("img");
      if (imgs.length) { Array.prototype.forEach.call(imgs, function (im) { im.parentNode.removeChild(im); }); showToast("图鉴正文只保留文字，已移除正文图片"); }
    }
    if (el.wikiCoverLabel) el.wikiCoverLabel.textContent = isCodex ? "封面图（必填，自动压缩到 200KB）" : "封面图（可选，自动压缩到 200KB）";
    if (isCodex) { renderWikiTypePick(); renderWikiDynamicFields(); }
    if (el.wikiEditorLabel) el.wikiEditorLabel.textContent = isCodex ? "正文（仅文字）" : "正文（支持标题、图片、列表和链接）";
    if (el.wikiEditorNote) el.wikiEditorNote.textContent = isCodex ? "图鉴封面必填；正文只允许输入文字。" : (adminKey ? "管理员发布无需审核，确认后直接公开。" : "图片自动压缩；正文最多 3 张图；审核通过后才会公开。");
  }
  function renderWikiPick() {
    var cats = state.wiki.categories && state.wiki.categories.length ? state.wiki.categories : CONFIG.defaultWikiCategories;
    if (cats.indexOf(state.wiki.pick) === -1) state.wiki.pick = cats[0] || "";
    el.wikiPick.innerHTML = cats.map(function (c) {
      return '<button type="button" class="' + (c === state.wiki.pick ? "active" : "") + '" data-wiki-pick="' + escapeHtml(c) + '">' + escapeHtml(c) + "</button>";
    }).join("");
    updateWikiFormForCategory();
  }
  function ensureQuill() {
    if (window.Quill) return Promise.resolve(window.Quill);
    if (state.wiki.quillLoading) return state.wiki.quillLoading;
    state.wiki.quillLoading = new Promise(function (resolve, reject) {
      if (!document.getElementById("quillSnowCss")) {
        var css = document.createElement("link");
        css.id = "quillSnowCss"; css.rel = "stylesheet"; css.href = "assets/wiki/quill.snow.css";
        document.head.appendChild(css);
      }
      var script = document.createElement("script");
      script.src = "assets/wiki/quill.js";
      script.async = true;
      script.onload = function () { window.Quill ? resolve(window.Quill) : reject(new Error("富文本编辑器加载失败")); };
      script.onerror = function () { reject(new Error("富文本编辑器加载失败")); };
      document.head.appendChild(script);
    });
    return state.wiki.quillLoading;
  }
  function initWikiEditor(callback) {
    if (state.wiki.quill) { if (callback) callback(); return; }
    if (!el.wikiEditor) return;
    ensureQuill().then(function () {
      if (!state.wiki.quill) {
        state.wiki.quill = new window.Quill(el.wikiEditor, {
          theme: "snow", placeholder: "请输入正文内容，支持标题、图片、列表和链接…",
          modules: { toolbar: { container: [[{ header: [2, 3, false] }], ["bold", "italic"], [{ list: "ordered" }, { list: "bullet" }], ["link", "image"]], handlers: { image: function () { chooseWikiImage("inline"); } } } }
        });
        var editorAutoTimer = null;
        state.wiki.quill.on("text-change", function () {
          if (editorAutoTimer) clearTimeout(editorAutoTimer);
          editorAutoTimer = setTimeout(function () {
            var plain = state.wiki.quill ? state.wiki.quill.getText() : "";
            if (plain && /https?:|【.*(哔哩哔哩|bilibili)|b23\.tv/i.test(plain)) applyAutoTitle(plain, "editor");
          }, 180);
        });
      }
      if (callback) callback();
    }).catch(function () { showToast("富文本编辑器加载失败，请刷新再试"); });
  }
  function setWikiEditorHtml(html) {
    initWikiEditor(function () {
      if (!state.wiki.quill) return;
      try { state.wiki.quill.clipboard.dangerouslyPasteHTML(html || ""); } catch (e) { state.wiki.quill.root.innerHTML = html || ""; }
    });
  }
  function resetWikiForm(keepResult) {
    state.wiki.coverTargetId = null;
    el.wikiNickname.value = ""; el.wikiFormTitle.value = ""; if (el.wikiVideoUrl) el.wikiVideoUrl.value = "";
    state.wiki.pick = (state.wiki.categories && state.wiki.categories[0]) || "攻略"; state.wiki.coverId = "";
    state.wiki.type = "怪物"; state.wiki.fieldValues = {}; state.wiki.coverPosX = 50; state.wiki.coverPosY = 50;
    el.wikiCoverUpload.innerHTML = '<span class="plus">＋</span><span>上传封面</span>';
    setWikiEditorHtml("");
    if (!keepResult) el.wikiSubmitResult.innerHTML = "";
    renderWikiPick();
  }
  function openWikiSubmit(article) {
    state.wiki.adminPreview = false;
    state.wiki.coverTargetId = null;
    state.wiki.editing = article || null;
    state.wiki.editMode = article ? (adminKey ? "admin" : "public") : "";
    setWikiCoverFieldVisible(!article);
    initWikiEditor();
    if (article) {
      state.wiki.pick = article.category;
      el.wikiNickname.value = article.nickname || "";
      el.wikiFormTitle.value = article.title || "";
      if (el.wikiVideoUrl) el.wikiVideoUrl.value = article.videoUrl || firstUrlFromHtml(article.content || "");
      state.wiki.type = article.wikiType || "怪物";
      state.wiki.fieldValues = Object.assign({}, article.fields || {});
      state.wiki.coverId = article.coverId || "";
      state.wiki.coverPosX = article.coverPosX == null ? 50 : article.coverPosX;
      state.wiki.coverPosY = article.coverPosY == null ? 50 : article.coverPosY;
      if (article.coverId) el.wikiCoverUpload.innerHTML = '<img src="' + escapeHtml(wikiImageUrl(article.coverId)) + '" alt="" style="' + wikiCoverPos(article) + '">';
      setWikiEditorHtml(article.content || "");
    } else resetWikiForm(false);
    renderWikiPick();
    el.wikiPublishBtn.textContent = article ? (adminKey ? "直接保存" : "提交修改审核") : (adminKey ? "直接发布" : "提交审核");
    if (article && !adminKey) el.wikiEditorNote.textContent = "图片不可修改；其他信息提交后由管理员审核。本次会话继续沿用同一个查询码。";
    showWikiView("submit");
  }
  function readWikiFile(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(new Error("读取图片失败")); };
      reader.readAsDataURL(file);
    });
  }
  function compressWikiImage(file, kind) {
    return readWikiFile(file).then(function (src) {
      return new Promise(function (resolve, reject) {
        var img = new Image();
        img.onload = function () {
          var maxW = kind === "cover" ? 1280 : 1200, maxH = kind === "cover" ? 720 : 900;
          var ratio = Math.min(1, maxW / img.width, maxH / img.height);
          var canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.width * ratio)); canvas.height = Math.max(1, Math.round(img.height * ratio));
          var ctx = canvas.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          var quality = 0.86, data = canvas.toDataURL("image/jpeg", quality), limit = kind === "cover" ? 200 * 1024 : 150 * 1024;
          while (Math.round(data.length * 0.75) > limit && quality > 0.43) { quality -= 0.08; data = canvas.toDataURL("image/jpeg", quality); }
          if (Math.round(data.length * 0.75) > limit) reject(new Error("图片压缩后仍超过限制，请换一张小一点的")); else resolve(data);
        };
        img.onerror = function () { reject(new Error("图片格式不支持")); }; img.src = src;
      });
    });
  }
  function uploadWikiImage(data, kind) {
    if (state.mode !== "online") return Promise.reject(new Error("本地演示模式无法上传图片，请使用正式网址"));
    return api("/api/wiki/images", { method: "POST", body: { data: data, kind: kind }, timeout: 30000 });
  }
  function uploadWikiImageBlob(blob, kind) {
    if (state.mode !== "online") return Promise.reject(new Error("本地演示模式无法上传图片，请使用正式网址"));
    return fetch((CONFIG.apiBase || "") + "/api/wiki/images/raw?kind=" + encodeURIComponent(kind), {
      method: "POST", headers: { "Content-Type": blob.type || "image/jpeg" }, body: blob
    }).then(function (res) { return res.json().catch(function () { return {}; }).then(function (data) { if (!res.ok) throw new Error(data.error || ("HTTP " + res.status)); return data; }); });
  }
  function scheduleCoverCrop() {
    if (state.wiki.cropFrame) return;
    state.wiki.cropFrame = requestAnimationFrame(function () { state.wiki.cropFrame = 0; renderCoverCrop(); });
  }
  function coverCanvasBlob(canvas, quality) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) { blob ? resolve(blob) : reject(new Error("生成图片失败")); }, "image/jpeg", quality);
    });
  }
  function currentWikiCoverAspect() {
    var category = (state.wiki.editing && state.wiki.editing.category) || (state.wiki.detailArticle && state.wiki.detailArticle.category) || state.wiki.pick || "";
    return category === "图鉴" ? 1 : 16 / 9;
  }
  function coverCropSize(img, zoom, aspect) {
    var nw = img.naturalWidth, nh = img.naturalHeight;
    var cropW, cropH;
    if (nw / nh > aspect) { cropH = nh / zoom; cropW = cropH * aspect; }
    else { cropW = nw / zoom; cropH = cropW / aspect; }
    return { w: cropW, h: cropH };
  }
  function renderCoverCrop() {
    var c = state.wiki.crop;
    if (!c || !c.img || !el.wikiCoverCropCanvas) return;
    var canvas = el.wikiCoverCropCanvas, ctx = canvas.getContext("2d");
    var aspect = c.aspect || 1;
    var size = coverCropSize(c.img, c.zoom, aspect), cropW = size.w, cropH = size.h;
    var maxX = Math.max(0, c.img.naturalWidth - cropW), maxY = Math.max(0, c.img.naturalHeight - cropH);
    c.x = Math.max(0, Math.min(1, c.x)); c.y = Math.max(0, Math.min(1, c.y));
    var sx = maxX * c.x, sy = maxY * c.y;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#e8f1ff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(c.img, sx, sy, cropW, cropH, 0, 0, canvas.width, canvas.height);
    if (el.wikiCoverZoom) el.wikiCoverZoom.value = c.zoom;
  }
  function openWikiCoverAdjust(file) {
    if (!file || !el.wikiCoverCropViewport) return;
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var aspect = currentWikiCoverAspect();
        state.wiki.crop = { img: img, zoom: 1, x: 0.5, y: 0.5, aspect: aspect };
        el.wikiCoverCropViewport.style.aspectRatio = aspect === 1 ? "1 / 1" : "16 / 9";
        var canvas = el.wikiCoverCropCanvas;
        canvas.width = 480; canvas.height = aspect === 1 ? 480 : 270;
        el.wikiCoverMask.classList.add("open");
        requestAnimationFrame(renderCoverCrop);
      };
      img.onerror = function () { showToast("图片格式不支持"); };
      img.src = reader.result;
    };
    reader.onerror = function () { showToast("读取图片失败"); };
    reader.readAsDataURL(file);
  }
  function moveCoverCrop(dx, dy) {
    var c = state.wiki.crop; if (!c || !c.img) return;
    var aspect = c.aspect || 1, size = coverCropSize(c.img, c.zoom, aspect), cropW = size.w, cropH = size.h;
    var vp = el.wikiCoverCropViewport;
    var vpW = vp ? vp.clientWidth : 280, vpH = vp ? vp.clientHeight : (vpW / aspect);
    var scaleX = cropW / vpW, scaleY = cropH / vpH;
    var maxX = Math.max(1, c.img.naturalWidth - cropW), maxY = Math.max(1, c.img.naturalHeight - cropH);
    c.x -= (dx * scaleX) / maxX; c.y -= (dy * scaleY) / maxY;
    scheduleCoverCrop();
  }
  function saveWikiCoverCrop() {
    var c = state.wiki.crop;
    if (!c || !c.img) { showToast("请先选择封面图"); return; }
    var aspect = c.aspect || 1, size = coverCropSize(c.img, c.zoom, aspect), cropW = size.w, cropH = size.h;
    var maxX = Math.max(0, c.img.naturalWidth - cropW), maxY = Math.max(0, c.img.naturalHeight - cropH);
    var sx = maxX * c.x, sy = maxY * c.y;
    var outW = 640, outH = Math.round(640 / aspect);
    var out = document.createElement("canvas"); out.width = outW; out.height = outH;
    var ctx = out.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, outW, outH);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(c.img, sx, sy, cropW, cropH, 0, 0, outW, outH);
    showToast("正在生成封面…");
    el.wikiCoverSaveBtn.disabled = true;
    function makeBlob(q) { return coverCanvasBlob(out, q); }
    function shrinkBlob(blob, q) {
      if (blob.size <= 200 * 1024 || q < 0.5) return Promise.resolve(blob);
      return makeBlob(q).then(function (next) { return shrinkBlob(next, q - 0.08); });
    }
    var chain = makeBlob(0.86).then(function (blob) { return shrinkBlob(blob, 0.78); });
    chain.then(function (blob) { return uploadWikiImageBlob(blob, "cover"); }).then(function (r) {
      var targetId = state.wiki.coverTargetId;
      if (targetId) {
        return api("/api/admin/wiki/" + encodeURIComponent(targetId), { method: "POST", body: { coverId: r.id }, adminKey: adminKey }).then(function () {
          el.wikiCoverMask.classList.remove("open"); el.wikiCoverSaveBtn.disabled = false; state.wiki.coverTargetId = null; showToast("✅图片已保存"); if (state.wiki.adminPreview) openAdminWikiPreview(targetId); else openWikiDetail(targetId);
        });
      }
      state.wiki.coverId = r.id;
      el.wikiCoverUpload.innerHTML = '<img src="' + escapeHtml(wikiImageUrl(r.id)) + '" alt="">';
      el.wikiCoverMask.classList.remove("open"); el.wikiCoverSaveBtn.disabled = false; showToast("✅封面已保存");
    }).catch(function (err) { el.wikiCoverSaveBtn.disabled = false; showToast((err && err.message) ? err.message : "封面上传失败"); });
  }
  function chooseWikiImage(kind) {
    var input = document.createElement("input"); input.type = "file"; input.accept = "image/*";
    input.onchange = function () {
      var file = input.files && input.files[0]; if (!file) return;
      if (kind !== "cover" && state.wiki.quill && state.wiki.quill.root.querySelectorAll("img").length >= 3) { showToast("正文最多插入 3 张图片"); return; }
      if (kind === "cover") { openWikiCoverAdjust(file); return; }
      showToast("正在压缩并上传图片…");
      compressWikiImage(file, kind).then(function (data) { return uploadWikiImage(data, kind); }).then(function (r) {
        var q = state.wiki.quill, range = q ? q.getSelection(true) : { index: 0 };
        if (q) { q.insertEmbed(range.index, "image", wikiImageUrl(r.id), "user"); q.setSelection(range.index + 1); }
        showToast("✅正文图片已插入");
      }).catch(function (err) { showToast((err && err.message) ? err.message : "图片上传失败"); });
    };
    input.click();
  }
  function showWikiCodePopup(code, extra) {
    state.wiki.lastCode = code || "";
    el.wikiCodeValue.textContent = code || "------";
    var popup = el.wikiCodeMask.querySelector(".wiki-code-popup");
    var old = popup ? popup.querySelector(".wiki-code-extra") : null;
    if (old && old.parentNode) old.parentNode.removeChild(old);
    if (extra && popup) {
      var note = document.createElement("p");
      note.className = "wiki-code-extra";
      note.style.color = "#d96570"; note.style.marginTop = "8px"; note.textContent = extra;
      popup.insertBefore(note, el.wikiCodeCopyBtn);
    }
    el.wikiCodeMask.classList.add("open");
  }
  function publishWiki() {
    var title = el.wikiFormTitle.value.trim(), nickname = el.wikiNickname.value.trim() || "SG.匿名";
    if (!title) { showToast(state.wiki.pick === "图鉴" ? "请填写图鉴名称" : "请填写标题"); return; }
    var fields = collectWikiFields();
    if (state.wiki.pick === "图鉴") {
      if (!state.wiki.editing && !state.wiki.coverId) { showToast("图鉴必须上传封面图"); return; }
      var schema = CODEX_SCHEMA[state.wiki.type];
      if (!schema) { showToast("请选择图鉴类型"); return; }
      for (var i = 0; i < schema.fields.length; i++) {
        if (schema.fields[i].required !== false && !fields[schema.fields[i].key]) {
          showToast("请填写" + schema.fields[i].label);
          return;
        }
      }
    }
    var content = state.wiki.quill ? state.wiki.quill.root.innerHTML : "";
    if (!state.wiki.quill || !state.wiki.quill.getText().replace(/\s/g, "")) { showToast("请填写正文"); return; }
    if (state.mode !== "online") { showToast("本地演示模式无法投稿，请打开正式网址"); return; }
    var videoUrl = state.wiki.pick === "攻略" ? (el.wikiVideoUrl ? el.wikiVideoUrl.value.trim() : "") : "";
    videoUrl = videoUrl.replace(/[，。,.、；;：:！!？?）)\]}】》]+$/g, "");
    if (videoUrl && !/^https?:\/\//i.test(videoUrl)) { showToast("视频链接需要以 http:// 或 https:// 开头"); return; }
    var payload = { title: title, nickname: nickname, category: state.wiki.pick, coverId: state.wiki.coverId, coverPosX: state.wiki.coverPosX, coverPosY: state.wiki.coverPosY, videoUrl: videoUrl, content: content, wikiType: state.wiki.pick === "图鉴" ? state.wiki.type : "", fields: state.wiki.pick === "图鉴" ? fields : {} };
    el.wikiPublishBtn.disabled = true;
    var editing = state.wiki.editing;
    var req;
    if (editing && adminKey) {
      req = api("/api/admin/wiki/" + encodeURIComponent(editing.id), { method: "POST", body: payload, adminKey: adminKey });
    } else if (editing) {
      req = api("/api/wiki/edits", { method: "POST", body: { articleId: editing.id, title: title, nickname: nickname, category: state.wiki.pick, wikiType: state.wiki.pick === "图鉴" ? state.wiki.type : "", fields: state.wiki.pick === "图鉴" ? fields : {}, videoUrl: videoUrl, content: content, batchId: wikiEditBatchId() } });
    } else {
      req = api("/api/wiki", { method: "POST", body: payload, adminKey: adminKey || undefined });
    }
    req.then(function (r) {
      el.wikiPublishBtn.disabled = false;
      if (editing) {
        var restoreY = state.wiki.listScrollTop || 0;
        var editedId = editing.id;
        state.wiki.editing = null;
        if (adminKey && r.article) {
          state.wiki.items = (state.wiki.items || []).map(function (x) { return x.id === editedId ? r.article : x; });
        }
        showWikiView("list");
        renderWikiList();
        requestAnimationFrame(function () { el.wikiBody.scrollTop = restoreY; });
        if (adminKey) { showToast("✅修改已直接保存"); loadWikiAdmin(true); return; }
        if (r.isFirst) { showWikiCodePopup(r.code || "", "本次会话继续修改其他图鉴，将沿用这个查询码。"); }
        else { showToast("✅修改已提交，继续沿用之前的查询码"); }
        return;
      } else {
        var code = r.code || "------";
        var extra = "";
        if (r.duplicateCandidates && r.duplicateCandidates.length) extra += "AI 检测到 " + r.duplicateCandidates.length + " 条疑似重复内容，管理员审核时会看到合并建议。";
        if (r.autoDelete && r.autoDelete.deleted) extra += (extra ? " " : "") + "存储超过 80%，已自动删除最低点击量内容《" + (r.autoDelete.deletedTitle || "") + "》。";
        el.wikiSubmitResult.innerHTML = "";
        resetWikiForm(true);
        showWikiCodePopup(code, extra);
        showToast(r.published ? "✅已直接发布" : "✅投稿已提交，等待管理员审核");
      }
    }).catch(function (err) { el.wikiPublishBtn.disabled = false; showToast((err && err.message) ? err.message : "投稿失败，请重试"); });
  }
  function renderAdminWiki(arr, append) {
    if (!el.adminWikiList) return;
    var rows = arr || [];
    if (!append && !rows.length) { el.adminWikiList.innerHTML = '<div class="ad-empty">这个状态暂无内容</div>'; }
    else if (rows.length) {
      var html = rows.map(function (a) {
      var cover = a.coverId ? '<div class="ad-wiki-cover"><img src="' + escapeHtml(wikiImageUrl(a.coverId)) + '" alt="" loading="lazy" decoding="async"></div>' : '<div class="ad-wiki-cover"></div>';
      var thumbs = (a.imageIds || []).slice(0, 4).map(function (id) { return '<img src="' + escapeHtml(wikiImageUrl(id)) + '" alt="" loading="lazy" decoding="async">'; }).join("");
      var fieldText = wikiFieldTags(a, true, 5).map(function (t) { return t.label + "：" + t.value; }).join(" · ");
      var actions = '<button class="ad-wiki-edit" type="button" data-wiki-admin="preview" data-wiki-id="' + escapeHtml(a.id) + '">预览</button><button class="ad-wiki-edit" type="button" data-wiki-admin="edit" data-wiki-id="' + escapeHtml(a.id) + '">编辑</button><button class="ad-wiki-edit" type="button" data-wiki-admin="merge" data-wiki-id="' + escapeHtml(a.id) + '">合并</button>';
      if (a.status === "pending") actions += '<button class="ad-wiki-ok" type="button" data-wiki-admin="approve" data-wiki-id="' + escapeHtml(a.id) + '">通过</button><button class="ad-wiki-del" type="button" data-wiki-admin="reject" data-wiki-id="' + escapeHtml(a.id) + '">退回</button>';
      actions += '<button class="ad-wiki-del" type="button" data-wiki-admin="delete" data-wiki-id="' + escapeHtml(a.id) + '">删除</button>';
      return '<div class="ad-wiki-row"><div style="display:flex;gap:9px">' + cover + '<div style="min-width:0;flex:1"><h4>' + escapeHtml(a.title) + '</h4><p>' + escapeHtml(a.nickname) + ' · ' + escapeHtml(a.category) + (a.category === "图鉴" && a.wikiType ? ' · ' + escapeHtml(CODEX_SCHEMA[a.wikiType] ? CODEX_SCHEMA[a.wikiType].label : a.wikiType) : "") + (fieldText ? ' · ' + escapeHtml(fieldText) : "") + ' · ' + escapeHtml(wikiStatusText(a.status)) + '<br>查询码 ' + escapeHtml(a.code || "") + ' · 总浏览 ' + (a.views || 0) + ' · 今日 ' + (a.todayViews || 0) + '</p>' + (thumbs ? '<div class="ad-wiki-thumbs">' + thumbs + '</div>' : "") + '</div></div><div class="ad-wiki-actions">' + actions + '</div></div>';
      }).join("");
      el.adminWikiList.innerHTML = append ? (el.adminWikiList.innerHTML + html) : html;
    }
    if (el.adminWikiMoreBtn) { el.adminWikiMoreBtn.style.display = state.wiki.adminHasMore ? "block" : "none"; el.adminWikiMoreBtn.disabled = !!state.wiki.adminLoading; el.adminWikiMoreBtn.textContent = state.wiki.adminLoading ? "加载中…" : "加载更多"; }
  }
  function renderWikiEdits(list) {
    if (!el.adminWikiEditList) return;
    var arr = list || [];
    if (!arr.length) { el.adminWikiEditList.innerHTML = '<div class="ad-empty">暂无待审核修改</div>'; return; }
    el.adminWikiEditList.innerHTML = arr.map(function (e) {
      var fieldText = wikiFieldTags({ category: e.category, wikiType: e.wikiType, fields: e.fields }, true, 5).map(function (t) { return t.label + "：" + t.value; }).join(" · ");
      return '<div class="ad-wiki-row"><h4>' + escapeHtml(e.articleTitle || "原图鉴") + ' → ' + escapeHtml(e.title) + '</h4><p>提交人：' + escapeHtml(e.nickname) + ' · ' + escapeHtml(e.category) + (fieldText ? ' · ' + escapeHtml(fieldText) : "") + '<br>查询码：' + escapeHtml(e.code || "") + '</p><div class="ad-wiki-actions"><button class="ad-wiki-ok" type="button" data-edit-review="approve" data-edit-id="' + escapeHtml(e.id) + '">通过</button><button class="ad-wiki-del" type="button" data-edit-review="reject" data-edit-id="' + escapeHtml(e.id) + '">退回</button></div></div>';
    }).join("");
  }
  function loadWikiEdits(show) {
    if (!el.adminWikiEditList) return;
    if (show) el.adminWikiEditList.style.display = "block";
    if (state.mode !== "online") { renderWikiEdits([]); return; }
    api("/api/admin/wiki/edits?status=pending", { adminKey: adminKey }).then(function (r) { renderWikiEdits(r.edits || []); }).catch(function () { renderWikiEdits([]); });
  }
  function renderMailAdmin(list) {
    if (!el.adminMailList) return;
    var arr = list || [];
    if (!arr.length) { el.adminMailList.innerHTML = '<div class="ad-empty">暂无待审核邮箱模板</div>'; return; }
    el.adminMailList.innerHTML = arr.map(function (m) {
      return '<div class="ad-wiki-row"><h4>' + escapeHtml(m.title) + '</h4><p>' + escapeHtml(m.publisher) + ' · ' + escapeHtml(m.situation) + '<br>查询码：' + escapeHtml(m.code || "") + '</p><div class="ad-wiki-actions"><button class="ad-wiki-ok" type="button" data-mail-review="approve" data-mail-id="' + escapeHtml(m.id) + '">通过</button><button class="ad-wiki-del" type="button" data-mail-review="reject" data-mail-id="' + escapeHtml(m.id) + '">退回</button></div></div>';
    }).join("");
  }
  function loadMailAdmin(show) {
    if (!el.adminMailList) return;
    if (show) el.adminMailList.style.display = "block";
    if (state.mode !== "online") { renderMailAdmin([]); return; }
    api("/api/admin/mail?status=pending", { adminKey: adminKey }).then(function (r) { renderMailAdmin(r.templates || []); }).catch(function () { renderMailAdmin([]); });
  }
  function renderAdminWikiCategories() {
    if (!el.adminWikiCategories) return;
    el.adminWikiCategories.innerHTML = (state.wiki.categories || []).map(function (c) {
      var fixed = FIXED_WIKI_CATEGORIES.indexOf(c) > -1;
      return '<div class="ad-cat-row"><b>' + escapeHtml(c) + '</b><span>' + (fixed ? '<i class="ad-cat-fixed">默认</i>' : '<button type="button" data-wiki-cat="edit" data-wiki-cat-name="' + escapeHtml(c) + '">编辑</button> <button type="button" data-wiki-cat="delete" data-wiki-cat-name="' + escapeHtml(c) + '">删除</button>') + '</span></div>';
    }).join("");
  }
  function loadWikiAdmin(reset, append) {
    if (state.mode !== "online") { renderAdminWiki([]); renderAdminWikiCategories(); return; }
    if (state.wiki.adminLoading) return;
    if (reset) { state.wiki.adminItems = []; state.wiki.adminPage = 1; state.wiki.adminHasMore = false; }
    var page = append ? state.wiki.adminPage + 1 : 1;
    state.wiki.adminLoading = true;
    renderAdminWiki(state.wiki.adminItems, true);
    api("/api/admin/wiki?status=" + encodeURIComponent(state.wiki.adminStatus) + "&page=" + page + "&limit=50", { adminKey: adminKey }).then(function (r) {
      var incoming = r.articles || [];
      state.wiki.adminItems = append ? state.wiki.adminItems.concat(incoming) : incoming;
      state.wiki.adminPage = r.page || page;
      state.wiki.adminTotal = r.total || state.wiki.adminItems.length;
      state.wiki.adminHasMore = !!r.hasMore;
      if (r.categories && r.categories.length) state.wiki.categories = r.categories.slice();
      state.wiki.adminLoading = false;
      renderAdminWiki(state.wiki.adminItems, false); renderAdminWikiCategories();
    }).catch(function () { state.wiki.adminLoading = false; renderAdminWiki(state.wiki.adminItems, false); });
  }
  function loadMoreWikiAdmin() { if (state.wiki.adminHasMore && !state.wiki.adminLoading) loadWikiAdmin(false, true); }
  function openAdminReject(type, id) {
    state.pendingAdminReview = { type: type, id: id };
    el.adminRejectReason.value = "";
    el.adminRejectMask.classList.add("open");
  }
  function openAdminDelete(id, type) {
    type = type || "wiki";
    state.pendingAdminDelete = { id: id, type: type, scrollTop: el.wikiBody ? el.wikiBody.scrollTop : (state.wiki.listScrollTop || 0), mailScrollTop: state.mail.listScrollTop || 0 };
    el.adminDeleteTitle.textContent = type === "mail" ? "删除邮箱模板" : "删除图鉴";
    el.adminDeleteSub.textContent = type === "mail" ? "删除后无法恢复，确认删除这条邮箱模板吗？" : "删除后无法恢复，确认删除这条图鉴吗？";
    el.adminDeleteMask.classList.add("open");
  }
  function finishAdminReject() {
    var pending = state.pendingAdminReview;
    if (!pending) return;
    var reason = el.adminRejectReason.value.trim();
    var path = pending.type === "mail" ? "/api/admin/mail/" + encodeURIComponent(pending.id) + "/review" : pending.type === "edit" ? "/api/admin/wiki/edits/" + encodeURIComponent(pending.id) + "/review" : "/api/admin/wiki/" + encodeURIComponent(pending.id) + "/review";
    api(path, { method: "POST", body: { action: "reject", reason: reason }, adminKey: adminKey }).then(function () {
      el.adminRejectMask.classList.remove("open"); state.pendingAdminReview = null; showToast("已退回");
      if (pending.type === "mail") { loadMailAdmin(true); loadMailData(true); } else if (pending.type === "edit") { loadWikiEdits(true); loadWikiAdmin(true); } else { loadWikiAdmin(true); loadWikiData(true); }
    }).catch(function (err) { showToast((err && err.message) ? err.message : "退回失败"); });
  }
  function finishAdminDelete() {
    var pending = state.pendingAdminDelete;
    if (!pending) return;
    var path = pending.type === "mail" ? "/api/admin/mail/" + encodeURIComponent(pending.id) : "/api/admin/wiki/" + encodeURIComponent(pending.id);
    api(path, { method: "DELETE", adminKey: adminKey }).then(function () {
      el.adminDeleteMask.classList.remove("open"); state.pendingAdminDelete = null;
      if (pending.type === "mail") {
        state.mail.templates = (state.mail.templates || []).filter(function (x) { return x.id !== pending.id; });
        renderMailList(); showWikiView("mailList");
        requestAnimationFrame(function () { el.wikiBody.scrollTop = pending.mailScrollTop || 0; });
        loadMailAdmin(true); loadMailData(true);
      } else {
        state.wiki.adminPreview = false;
        state.wiki.items = (state.wiki.items || []).filter(function (x) { return x.id !== pending.id; });
        state.wiki.adminItems = (state.wiki.adminItems || []).filter(function (x) { return x.id !== pending.id; });
        renderWikiList(); renderAdminWiki(state.wiki.adminItems, false); showWikiView("list");
        requestAnimationFrame(function () { el.wikiBody.scrollTop = pending.scrollTop || 0; });
      }
      showToast("已删除");
    }).catch(function (err) { showToast((err && err.message) ? err.message : "删除失败"); });
  }
  function wikiAdminAction(action, id) {
    if (state.mode !== "online") { showToast("本地模式不支持百科管理"); return; }
    if (action === "preview") { openAdminWikiPreview(id); return; }
    if (action === "edit") {
      api("/api/admin/wiki/" + encodeURIComponent(id), { adminKey: adminKey }).then(function (r) {
        el.adminMask.classList.remove("open");
        setNavPage("wiki");
        el.wikiScreen.classList.add("open");
        el.wikiScreen.setAttribute("aria-hidden", "false");
        openWikiSubmit(r.article || {});
      }).catch(function (err) { showToast((err && err.message) ? err.message : "加载失败"); });
      return;
    }
    if (action === "merge") {
      api("/api/admin/wiki/" + encodeURIComponent(id) + "/duplicates", { adminKey: adminKey }).then(function (r) {
        var list = r.duplicates || [];
        if (!list.length) { showToast("AI 未检测到疑似重复内容"); return; }
        var tip = "AI 检测到疑似重复内容，输入要保留的查询码：\n" + list.map(function (x) { return x.code + "  " + x.title + "（" + x.score + "%）"; }).join("\n");
        var targetCode = window.prompt(tip, list[0].code);
        if (!targetCode) return;
        api("/api/admin/wiki/" + encodeURIComponent(id) + "/merge", { method: "POST", body: { targetCode: targetCode.trim() }, adminKey: adminKey }).then(function () { showToast("✅已合并重复内容"); loadWikiAdmin(true); loadWikiData(true); }).catch(function (err) { showToast((err && err.message) ? err.message : "合并失败"); });
      }).catch(function (err) { showToast((err && err.message) ? err.message : "重复检测失败"); });
      return;
    }
    if (action === "delete") { openAdminDelete(id); return; }
    if (action === "reject") { openAdminReject("wiki", id); return; }
    api("/api/admin/wiki/" + encodeURIComponent(id) + "/review", { method: "POST", body: { action: action, reason: "" }, adminKey: adminKey }).then(function () { showToast("✅已通过并发布"); loadWikiAdmin(true); loadWikiData(true); }).catch(function (err) { showToast((err && err.message) ? err.message : "操作失败"); });
  }

  el.wikiBtn.addEventListener("click", function () { if (el.wikiScreen.classList.contains("open")) closeWiki(); else openWiki(); });
  el.wikiBackBtn.addEventListener("click", function () {
    if (state.wiki.adminPreview) { closeWiki(); openAdmin(); return; }
    if (state.wiki.view === "mailDetail" || state.wiki.view === "mailSubmit") {
      var my = state.mail.listScrollTop || 0;
      openMailList().then(function () { requestAnimationFrame(function () { el.wikiBody.scrollTop = my; }); });
      return;
    }
    var y = state.wiki.listScrollTop || 0;
    showWikiView("list");
    requestAnimationFrame(function () { el.wikiBody.scrollTop = y; });
  });
  el.wikiThemeBtn.addEventListener("click", function () { var cur = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light"; applyTheme(cur === "dark" ? "light" : "dark"); });
  el.wikiSubmitBtn.addEventListener("click", function () { openWikiSubmit(null); });
  el.mailTemplateBtn.addEventListener("click", function () { openMailList(); });
  el.mailSubmitEntry.addEventListener("click", function () { resetMailForm(); showWikiView("mailSubmit"); });
  el.mailSearch.addEventListener("input", function () { state.mail.search = el.mailSearch.value.trim(); renderMailList(); });
  el.mailList.addEventListener("click", function (e) { var c = e.target.closest ? e.target.closest("[data-mail-id]") : null; if (c) openMailDetail(c.getAttribute("data-mail-id")); });
  el.mailDetail.addEventListener("click", function (e) {
    var img = e.target.closest ? e.target.closest(".mail-detail-images img") : null;
    if (img) { openImageViewer(img.currentSrc || img.src); return; }
    var del = e.target.closest ? e.target.closest("[data-admin-delete-mail]") : null;
    if (del) { openAdminDelete(del.getAttribute("data-admin-delete-mail"), "mail"); return; }
    var body = e.target.closest ? e.target.closest("[data-mail-copy-body]") : null;
    if (!body || !state.mail.current) return;
    state.mail.copyBody = state.mail.current.body || "";
    el.mailCopyMask.classList.add("open");
  });
  el.mailBubbleText.addEventListener("click", function () {
    if (adminKey) { openMailOfficialEditor(); return; }
    copyText(state.mail.officialEmail || "").then(function (ok) { showToast(ok ? "✅官方邮箱已复制" : "复制失败，请长按复制"); });
  });
  el.mailOfficialEditBtn.addEventListener("click", openMailOfficialEditor);
  el.mailOfficialSaveBtn.addEventListener("click", saveMailOfficialEmail);
  el.mailOfficialCancelBtn.addEventListener("click", function () { el.mailOfficialMask.classList.remove("open"); });
  el.mailOfficialMask.addEventListener("click", function (e) { if (e.target === el.mailOfficialMask) el.mailOfficialMask.classList.remove("open"); });
  el.mailImageUpload.addEventListener("click", function () { el.mailImageInput.click(); });
  el.mailImageInput.addEventListener("change", function () {
    var files = Array.prototype.slice.call(el.mailImageInput.files || []);
    if (!files.length) return;
    var room = 4 - (state.mail.images || []).length;
    if (room <= 0) { showToast("最多添加 4 张图片"); return; }
    files = files.slice(0, room);
    var chain = Promise.resolve();
    files.forEach(function (file) {
      chain = chain.then(function () { return compressWikiImage(file, "inline"); }).then(function (data) { return uploadWikiImage(data, "inline"); }).then(function (r) { state.mail.images.push(r.id); renderMailImages(); });
    });
    chain.then(function () { showToast("✅图片已添加"); el.mailImageInput.value = ""; }).catch(function (err) { showToast((err && err.message) ? err.message : "图片上传失败"); });
  });
  el.mailSubmitBtn.addEventListener("click", submitMailTemplate);
  el.wikiVideoCancelBtn.addEventListener("click", function () { el.wikiVideoMask.classList.remove("open"); state.wiki.videoConfirmUrl = ""; });
  el.wikiVideoConfirmBtn.addEventListener("click", function () {
    var url = state.wiki.videoConfirmUrl || "";
    el.wikiVideoMask.classList.remove("open"); state.wiki.videoConfirmUrl = "";
    if (!url) return;
    try { var w = window.open(url, "_blank", "noopener,noreferrer"); if (!w) location.href = url; } catch (e) { location.href = url; }
  });
  el.mailCopyCancelBtn.addEventListener("click", function () { el.mailCopyMask.classList.remove("open"); });
  el.mailCopyConfirmBtn.addEventListener("click", function () {
    copyText(state.mail.copyBody || "").then(function (ok) { if (ok) el.mailCopyMask.classList.remove("open"); showToast(ok ? "✅正文已复制" : "复制失败，请长按选择"); });
  });
  el.mailCopyMask.addEventListener("click", function (e) { if (e.target === el.mailCopyMask) el.mailCopyMask.classList.remove("open"); });
  el.qqGroupBtn.addEventListener("click", function () { el.qqGroupMask.classList.add("open"); });
  el.qqGroupCancelBtn.addEventListener("click", function () { el.qqGroupMask.classList.remove("open"); });
  function openQqGroupCard() {
    var ua = navigator.userAgent || "";
    var inQQ = /QQ\//i.test(ua) || /QQBrowser/i.test(ua);
    var inWeChat = /MicroMessenger/i.test(ua);
    var android = /Android/i.test(ua);
    var uin = CONFIG.qqGroupUin;
    var cardUrl = "mqqapi://card/show_pslcard?src_type=internal&version=1&uin=" + uin + "&card_type=group&source=qrcode";
    var cardUrlExternal = "mqqapi://card/show_pslcard?src_type=internal&version=1&uin=" + uin + "&card_type=group&source=external";
    var intentUrl = "intent://card/show_pslcard?src_type=internal&version=1&uin=" + uin + "&card_type=group&source=qrcode#Intent;scheme=mqqapi;package=com.tencent.mobileqq;end";
    var primary = inQQ
      ? (CONFIG.qqGroupJoinUrl || cardUrl)
      : (inWeChat ? (CONFIG.qqGroupJoinUrl || cardUrl) : (android ? intentUrl : (CONFIG.qqGroupJoinUrl || cardUrl)));
    var fallback = CONFIG.qqGroupJoinUrl || (inQQ ? cardUrlExternal : cardUrl);
    var opened = false;
    function markOpened() { opened = true; }
    function openViaFrame(url) {
      var frame = document.createElement("iframe");
      frame.style.display = "none";
      frame.src = url;
      document.body.appendChild(frame);
      setTimeout(function () { if (frame.parentNode) frame.parentNode.removeChild(frame); }, 900);
    }
    function openViaLink(url) {
      var link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      setTimeout(function () { if (link.parentNode) link.parentNode.removeChild(link); }, 900);
    }
    window.addEventListener("pagehide", markOpened, { once: true });
    window.addEventListener("blur", markOpened, { once: true });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) markOpened();
    }, { once: true });
    try {
      window.location.href = primary;
    } catch (e) {
      openViaFrame(primary);
    }
    setTimeout(function () {
      if (opened || document.hidden) return;
      if (inWeChat && !CONFIG.qqGroupJoinUrl) {
        showToast("微信内无法直接跳转QQ，请点右上角用浏览器打开");
        return;
      }
      try {
        if (inQQ) openViaFrame(fallback);
        else if (android) window.location.href = fallback;
        else openViaLink(fallback);
      } catch (e) {}
    }, 700);
  }
  el.qqGroupCopyBtn.addEventListener("click", function () {
    var copied = copySync("1124909778");
    if (copied) {
      showToast("✅QQ群号已复制，正在尝试打开QQ");
      openQqGroupCard();
      return;
    }
    copyText("1124909778").then(function (ok) {
      if (ok) {
        showToast("✅QQ群号已复制，正在尝试打开QQ");
        openQqGroupCard();
      } else {
        showToast("复制失败，请长按选择");
      }
    });
  });
  el.qqGroupMask.addEventListener("click", function (e) { if (e.target === el.qqGroupMask) el.qqGroupMask.classList.remove("open"); });
  el.wikiImageViewer.addEventListener("click", function (e) { if (e.target === el.wikiImageViewer) closeImageViewer(); });
  el.wikiImageViewerCloseBtn.addEventListener("click", closeImageViewer);
  el.wikiImageViewerImg.addEventListener("pointerdown", function (e) {
    if (!el.wikiImageViewer.classList.contains("open")) return;
    e.preventDefault();
    viewerGesture.pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    viewerGesture.moved = false;
    var count = Object.keys(viewerGesture.pointers).length;
    if (count === 1) {
      viewerGesture.startX = viewerGesture.x;
      viewerGesture.startY = viewerGesture.y;
      viewerGesture.startPointer = { x: e.clientX, y: e.clientY };
    } else if (count === 2) {
      var pair = pointerPair();
      viewerGesture.startDist = distance(pair[0], pair[1]);
      viewerGesture.startScale = viewerGesture.scale;
      viewerGesture.startMid = midpoint(pair[0], pair[1]);
      viewerGesture.startX = viewerGesture.x;
      viewerGesture.startY = viewerGesture.y;
    }
    try { el.wikiImageViewerImg.setPointerCapture(e.pointerId); } catch (err) {}
  });
  el.wikiImageViewerImg.addEventListener("pointermove", function (e) {
    if (!viewerGesture.pointers[e.pointerId]) return;
    e.preventDefault();
    viewerGesture.pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    var count = Object.keys(viewerGesture.pointers).length;
    if (count >= 2) {
      var pair = pointerPair();
      if (!pair.length || !viewerGesture.startDist) return;
      var mid = midpoint(pair[0], pair[1]);
      var nextScale = viewerGesture.startScale * (distance(pair[0], pair[1]) / viewerGesture.startDist);
      viewerGesture.scale = Math.max(1, Math.min(5, nextScale));
      viewerGesture.x = viewerGesture.startX + mid.x - viewerGesture.startMid.x;
      viewerGesture.y = viewerGesture.startY + mid.y - viewerGesture.startMid.y;
      viewerGesture.moved = true;
    } else if (count === 1 && viewerGesture.scale > 1 && viewerGesture.startPointer) {
      viewerGesture.x = viewerGesture.startX + e.clientX - viewerGesture.startPointer.x;
      viewerGesture.y = viewerGesture.startY + e.clientY - viewerGesture.startPointer.y;
      viewerGesture.moved = true;
    }
    if (viewerGesture.moved) {
      clampViewerPan();
      el.wikiImageViewer.classList.add("gesturing");
      applyViewerTransform();
    }
  });
  function endViewerPointer(e) {
    delete viewerGesture.pointers[e.pointerId];
    var count = Object.keys(viewerGesture.pointers).length;
    if (count === 1) {
      var pair = pointerPair();
      viewerGesture.startX = viewerGesture.x;
      viewerGesture.startY = viewerGesture.y;
      viewerGesture.startPointer = pair.length ? { x: pair[0].x, y: pair[0].y } : null;
    } else if (count === 0) {
      viewerGesture.startPointer = null;
      el.wikiImageViewer.classList.remove("gesturing");
    }
  }
  el.wikiImageViewerImg.addEventListener("pointerup", endViewerPointer);
  el.wikiImageViewerImg.addEventListener("pointercancel", endViewerPointer);
  el.wikiImageViewer.addEventListener("wheel", function (e) {
    if (!el.wikiImageViewer.classList.contains("open")) return;
    e.preventDefault();
    var next = viewerGesture.scale * (e.deltaY < 0 ? 1.12 : 0.9);
    viewerGesture.scale = Math.max(1, Math.min(5, next));
    if (viewerGesture.scale === 1) { viewerGesture.x = 0; viewerGesture.y = 0; }
    else clampViewerPan();
    applyViewerTransform();
  }, { passive: false });
  el.wikiImageViewerImg.addEventListener("dblclick", function (e) {
    e.preventDefault();
    viewerGesture.scale = viewerGesture.scale > 1 ? 1 : 2;
    viewerGesture.x = 0;
    viewerGesture.y = 0;
    applyViewerTransform();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeImageViewer(); });
  var wikiSearchTimer = null;
  el.wikiSearch.addEventListener("input", function () {
    state.wiki.keyword = el.wikiSearch.value.trim();
    if (wikiSearchTimer) clearTimeout(wikiSearchTimer);
    wikiSearchTimer = setTimeout(function () { loadWikiData(true); }, 320);
  });
  el.wikiTabs.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-wiki-tab]") : null; if (!b) return;
    state.wiki.category = b.getAttribute("data-wiki-tab");
    if (state.wiki.category === "图鉴") { state.wiki.subtype = ""; state.wiki.sort = "random"; state.wiki.randomSeed = "seed_" + uid(); }
    else if (state.wiki.category === "攻略") state.wiki.sort = "new";
    else if (state.wiki.sort === "random") state.wiki.sort = "today";
    loadWikiData(true);
  });
  el.wikiSubTabs.addEventListener("click", function (e) { var b = e.target.closest ? e.target.closest("[data-wiki-subtype]") : null; if (!b) return; state.wiki.subtype = b.getAttribute("data-wiki-subtype"); loadWikiData(true); });
  document.querySelectorAll("[data-wiki-sort]").forEach(function (b) { b.addEventListener("click", function () { state.wiki.sort = b.getAttribute("data-wiki-sort"); if (state.wiki.sort === "random") state.wiki.randomSeed = "seed_" + uid(); loadWikiData(true); }); });
  el.wikiList.addEventListener("click", function (e) { var card = e.target.closest ? e.target.closest("[data-wiki-id]") : null; if (card) openWikiDetail(card.getAttribute("data-wiki-id")); });
  el.wikiRefreshBtn.addEventListener("click", function () {
    if (state.wiki.loading) return;
    el.wikiRefreshBtn.disabled = true;
    el.wikiRefreshBtn.textContent = "刷新中…";
    Promise.resolve(loadWikiData(true)).then(function () {
      el.wikiRefreshBtn.disabled = false;
      el.wikiRefreshBtn.textContent = "刷新词条";
      showToast("✅词条已刷新");
    }).catch(function () {
      el.wikiRefreshBtn.disabled = false;
      el.wikiRefreshBtn.textContent = "刷新词条";
    });
  });
  el.wikiMoreBtn.addEventListener("click", function () { loadMoreWiki(); });
  el.wikiBody.addEventListener("scroll", function () {
    if (state.wiki.view !== "list" || !state.wiki.hasMore || state.wiki.loading) return;
    if (el.wikiBody.scrollTop + el.wikiBody.clientHeight >= el.wikiBody.scrollHeight - 180) loadMoreWiki();
  }, { passive: true });
  el.wikiQueryBtn.addEventListener("click", function () { el.wikiQueryMask.classList.add("open"); setTimeout(function () { el.wikiQueryInput.focus(); }, 250); });
  el.wikiQueryCloseBtn.addEventListener("click", function () { el.wikiQueryMask.classList.remove("open"); });
  el.wikiQueryMask.addEventListener("click", function (e) { if (e.target === el.wikiQueryMask) el.wikiQueryMask.classList.remove("open"); });
  el.wikiQuerySubmitBtn.addEventListener("click", queryWiki);
  el.wikiQueryInput.addEventListener("keydown", function (e) { if (e.key === "Enter") queryWiki(); });
  el.wikiDetail.addEventListener("click", function (e) {
    var img = e.target.closest ? e.target.closest(".wiki-rich img") : null;
    if (img) { openImageViewer(img.currentSrc || img.src); return; }
    var video = e.target.closest ? e.target.closest("[data-wiki-video]") : null;
    if (video) { state.wiki.videoConfirmUrl = video.getAttribute("data-wiki-video"); el.wikiVideoMask.classList.add("open"); return; }
    var edit = e.target.closest ? e.target.closest("[data-wiki-edit]") : null;
    if (edit) { openWikiSubmit(state.wiki.detailArticle || {}); return; }
    var del = e.target.closest ? e.target.closest("[data-admin-delete-wiki]") : null;
    if (del) {
      openAdminDelete(del.getAttribute("data-admin-delete-wiki"), "wiki");
      return;
    }
    var b = e.target.closest ? e.target.closest("[data-admin-cover]") : null;
    if (!b) return;
    state.wiki.coverTargetId = b.getAttribute("data-admin-cover");
    el.wikiCoverInput.value = "";
    el.wikiCoverInput.click();
  });
  el.wikiPick.addEventListener("click", function (e) { var b = e.target.closest ? e.target.closest("[data-wiki-pick]") : null; if (!b) return; state.wiki.pick = b.getAttribute("data-wiki-pick"); renderWikiPick(); });
  el.wikiTypePick.addEventListener("click", function (e) { var b = e.target.closest ? e.target.closest("[data-wiki-type]") : null; if (!b) return; state.wiki.type = b.getAttribute("data-wiki-type"); state.wiki.fieldValues = collectWikiFields(); renderWikiTypePick(); renderWikiDynamicFields(); });
  el.wikiDynamicFields.addEventListener("input", function (e) { var input = e.target.closest ? e.target.closest("[data-wiki-field]") : null; if (!input) return; state.wiki.fieldValues[input.getAttribute("data-wiki-field")] = input.value; });
  var autoTitleTimer = null;
  function scheduleAutoTitle(source) {
    if (autoTitleTimer) clearTimeout(autoTitleTimer);
    autoTitleTimer = setTimeout(function () {
      autoTitleTimer = null;
      applyAutoTitle(source === "title" ? el.wikiFormTitle.value : el.wikiVideoUrl.value, source);
    }, 220);
  }
  el.wikiFormTitle.addEventListener("input", function () { scheduleAutoTitle("title"); });
  el.wikiVideoUrl.addEventListener("input", function () { scheduleAutoTitle("video"); });
  el.wikiFormTitle.addEventListener("paste", function () { setTimeout(function () { scheduleAutoTitle("title"); }, 0); });
  el.wikiVideoUrl.addEventListener("paste", function () { setTimeout(function () { scheduleAutoTitle("video"); }, 0); });
  el.wikiCoverUpload.addEventListener("click", function () { el.wikiCoverInput.click(); });
  el.wikiCoverInput.addEventListener("change", function () { var f = el.wikiCoverInput.files && el.wikiCoverInput.files[0]; if (!f) return; openWikiCoverAdjust(f); });
  el.wikiCoverZoom.addEventListener("input", function () { if (state.wiki.crop) { state.wiki.crop.zoom = Math.max(1, Math.min(3, Number(el.wikiCoverZoom.value) || 1)); scheduleCoverCrop(); } });
  var coverDrag = null;
  el.wikiCoverCropViewport.addEventListener("pointerdown", function (e) { if (!state.wiki.crop) return; coverDrag = { x: e.clientX, y: e.clientY }; try { el.wikiCoverCropViewport.setPointerCapture(e.pointerId); } catch (err) {} });
  el.wikiCoverCropViewport.addEventListener("pointermove", function (e) { if (!coverDrag || !state.wiki.crop) return; moveCoverCrop(e.clientX - coverDrag.x, e.clientY - coverDrag.y); coverDrag = { x: e.clientX, y: e.clientY }; });
  el.wikiCoverCropViewport.addEventListener("pointerup", function () { coverDrag = null; });
  el.wikiCoverCropViewport.addEventListener("pointercancel", function () { coverDrag = null; });
  el.wikiCoverSaveBtn.addEventListener("click", saveWikiCoverCrop);
  el.wikiCoverCancelBtn.addEventListener("click", function () { state.wiki.crop = null; el.wikiCoverMask.classList.remove("open"); });
  el.wikiPublishBtn.addEventListener("click", publishWiki);
  el.wikiCodeCopyBtn.addEventListener("click", function () {
    var code = state.wiki.lastCode || el.wikiCodeValue.textContent || "";
    copyText(code).then(function (ok) {
      if (!ok) { showToast("复制失败，请长按查询码手动复制"); return; }
      el.wikiCodeMask.classList.remove("open");
      showToast("✅查询码已复制，窗口已关闭");
    });
  });
  el.adminRejectConfirmBtn.addEventListener("click", finishAdminReject);
  el.adminRejectCancelBtn.addEventListener("click", function () { el.adminRejectMask.classList.remove("open"); state.pendingAdminReview = null; });
  el.adminRejectMask.addEventListener("click", function (e) { if (e.target === el.adminRejectMask) el.adminRejectMask.classList.remove("open"); });
  el.adminDeleteConfirmBtn.addEventListener("click", finishAdminDelete);
  el.adminDeleteCancelBtn.addEventListener("click", function () { el.adminDeleteMask.classList.remove("open"); state.pendingAdminDelete = null; });
  el.adminDeleteMask.addEventListener("click", function (e) { if (e.target === el.adminDeleteMask) el.adminDeleteMask.classList.remove("open"); });
  Array.prototype.forEach.call([el.installBtn, el.colorBtn, el.feedbackBtn], function (b) { b.addEventListener("click", function () { if (el.wikiScreen.classList.contains("open")) closeWiki(); }); });
  function formatStorageBytes(n) {
    n = Number(n || 0);
    if (n >= 1024 * 1024 * 1024) return (n / 1024 / 1024 / 1024).toFixed(2) + "GB";
    if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + "MB";
    return Math.round(n / 1024) + "KB";
  }
  function renderAdminStorage(usage) {
    if (!el.adminStoragePercent) return;
    usage = usage || {};
    var pct = Number(usage.percent || 0);
    el.adminStoragePercent.textContent = pct.toFixed(2) + "%";
    el.adminStorageFill.style.width = Math.min(100, pct) + "%";
    el.adminStorageMeta.textContent = "已用 " + formatStorageBytes(usage.usedBytes || 0) + " / " + formatStorageBytes(usage.totalBytes || 5368709120) + " · 图片 " + formatStorageBytes(usage.imageBytes || 0) + " · 文字 " + formatStorageBytes(usage.textBytes || 0) + " · 上次清理 " + (usage.lastCleanupAt ? fmtDate(usage.lastCleanupAt) : "未清理");
  }
  function loadAdminStorage() {
    if (state.mode !== "online") { renderAdminStorage({ usedBytes: 0, totalBytes: 5368709120, percent: 0 }); return; }
    api("/api/admin/storage", { adminKey: adminKey }).then(function (r) { renderAdminStorage(r.usage || {}); }).catch(function () {});
  }
  el.adminStorageCleanBtn.addEventListener("click", function () {
    if (state.mode !== "online") { showToast("本地模式不支持清理"); return; }
    el.adminStorageCleanBtn.disabled = true;
    api("/api/admin/storage/cleanup", { method: "POST", adminKey: adminKey }).then(function (r) {
      el.adminStorageCleanBtn.disabled = false; renderAdminStorage(r.usage || {}); showToast("✅已清理 " + ((r.cleaned && r.cleaned.removed) || 0) + " 个无用文件");
    }).catch(function (err) { el.adminStorageCleanBtn.disabled = false; showToast((err && err.message) ? err.message : "清理失败"); });
  });
  el.adminWikiCreateBtn.addEventListener("click", function () {
    el.adminMask.classList.remove("open");
    setNavPage("wiki");
    el.wikiScreen.classList.add("open");
    el.wikiScreen.setAttribute("aria-hidden", "false");
    openWikiSubmit(null);
    state.wiki.pick = "图鉴";
    renderWikiPick();
    showWikiView("submit");
  });
  el.adminWikiEditsBtn.addEventListener("click", function () { loadWikiEdits(true); });
  el.adminMailReviewBtn.addEventListener("click", function () { loadMailAdmin(true); });
  el.adminMailList.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-mail-review]") : null;
    if (!b) return;
    var action = b.getAttribute("data-mail-review"), id = b.getAttribute("data-mail-id");
    if (action === "reject") { openAdminReject("mail", id); return; }
    api("/api/admin/mail/" + encodeURIComponent(id) + "/review", { method: "POST", body: { action: action, reason: "" }, adminKey: adminKey }).then(function () { showToast("✅邮箱模板已通过"); loadMailAdmin(true); loadMailData(true); }).catch(function (err) { showToast((err && err.message) ? err.message : "操作失败"); });
  });
  el.adminWikiEditList.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-edit-review]") : null;
    if (!b) return;
    var action = b.getAttribute("data-edit-review"); var id = b.getAttribute("data-edit-id");
    if (action === "reject") { openAdminReject("edit", id); return; }
    api("/api/admin/wiki/edits/" + encodeURIComponent(id) + "/review", { method: "POST", body: { action: action, reason: "" }, adminKey: adminKey }).then(function () { showToast("✅修改已通过"); loadWikiEdits(true); loadWikiAdmin(true); loadWikiData(true); }).catch(function (err) { showToast((err && err.message) ? err.message : "操作失败"); });
  });
  el.adminWikiMoreBtn.addEventListener("click", function () { loadMoreWikiAdmin(); });
  el.adminWikiList.addEventListener("click", function (e) { var b = e.target.closest ? e.target.closest("[data-wiki-admin]") : null; if (b) wikiAdminAction(b.getAttribute("data-wiki-admin"), b.getAttribute("data-wiki-id")); });
  el.adminWikiCategories.addEventListener("click", function (e) { var b = e.target.closest ? e.target.closest("[data-wiki-cat]") : null; if (!b) return; var name = b.getAttribute("data-wiki-cat-name"); if (b.getAttribute("data-wiki-cat") === "delete") { if (!window.confirm("确定删除分类「" + name + "」吗？")) return; api("/api/admin/wiki/categories/" + encodeURIComponent(name), { method: "DELETE", adminKey: adminKey }).then(function (r) { state.wiki.categories = r.categories || []; renderAdminWikiCategories(); showToast("已删除分类"); }).catch(function (err) { showToast((err && err.message) ? err.message : "删除失败"); }); } else { var next = window.prompt("修改分类名称", name); if (!next || next === name) return; api("/api/admin/wiki/categories", { method: "POST", body: { oldName: name, name: next }, adminKey: adminKey }).then(function (r) { state.wiki.categories = r.categories || []; renderAdminWikiCategories(); loadWikiData(true); showToast("分类已更新"); }).catch(function (err) { showToast((err && err.message) ? err.message : "修改失败"); }); } });
  el.adminWikiAddCatBtn.addEventListener("click", function () { var name = el.fAdminWikiCat.value.trim(); if (!name) { showToast("请输入分类名"); return; } api("/api/admin/wiki/categories", { method: "POST", body: { name: name }, adminKey: adminKey }).then(function (r) { state.wiki.categories = r.categories || []; el.fAdminWikiCat.value = ""; renderAdminWikiCategories(); showToast("已添加分类"); }).catch(function (err) { showToast((err && err.message) ? err.message : "添加失败"); }); });
  document.querySelectorAll("[data-wiki-status]").forEach(function (b) { b.addEventListener("click", function () { document.querySelectorAll("[data-wiki-status]").forEach(function (x) { x.classList.toggle("active", x === b); }); state.wiki.adminStatus = b.getAttribute("data-wiki-status"); loadWikiAdmin(true); }); });

  /* ---------------- 启动 ---------------- */
  function shouldPrefetch() {
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!c) return true;
    if (c.saveData) return false;
    return !/(^|slow-2g|2g)/.test(String(c.effectiveType || ""));
  }
  function scheduleIdle(fn, delay) {
    var run = function () {
      if (document.hidden) return;
      fn();
    };
    if (window.requestIdleCallback) {
      window.requestIdleCallback(run, { timeout: delay || 2500 });
    } else {
      setTimeout(run, delay || 2500);
    }
  }
  var splashAt = Date.now();
  function hideSplash() {
    var left = Math.max(0, CONFIG.splashMinMs - (Date.now() - splashAt));
    setTimeout(function () {
      var node = document.getElementById("splash");
      if (!node) return;
      node.classList.add("hide");
      setTimeout(function () { if (node.parentNode && node.parentNode.removeChild) node.parentNode.removeChild(node); }, 450);
    }, left);
  }
  function boot() {
    initTheme();
    render();
    renderBubble(true);
    startBubbleLoop();
    detectMode().then(function () {
      renderPick(); render(); renderBubble(true); refreshInfo();
      if (state.mode === "online") {
        el.modeDot.textContent = "";
        schedulePoll(currentPollMs());
        scheduleIdle(function () {
          if (!state.wiki.items.length && !state.wiki.loading && shouldPrefetch()) {
            loadWikiData(true).catch(function () {});
          }
        }, 2200);
      }
      else { el.modeDot.textContent = "本地演示模式"; }
      hideSplash();
    });
  }
  function tapCardTarget(e) {
    var node = e.target && e.target.closest ? e.target.closest(".card,.wiki-card,.mail-card,.entry") : null;
    if (!node || (e.target.closest && e.target.closest("button,a,input,textarea,.del"))) return null;
    return node;
  }
  function isCoarsePointer() {
    return !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  }
  document.addEventListener("pointerdown", function (e) {
    if (isCoarsePointer()) return;
    var c = tapCardTarget(e); if (c) c.classList.add("tap-down");
  }, { passive: true });
  document.addEventListener("pointerup", function (e) {
    if (isCoarsePointer()) return;
    var c = tapCardTarget(e); if (c) c.classList.remove("tap-down");
  }, { passive: true });
  document.addEventListener("pointercancel", function () { Array.prototype.forEach.call(document.querySelectorAll(".tap-down"), function (x) { x.classList.remove("tap-down"); }); }, { passive: true });
  document.addEventListener("click", function (e) { var c = tapCardTarget(e); if (!c) return; c.classList.remove("tap-bounce"); void c.offsetWidth; c.classList.add("tap-bounce"); setTimeout(function () { c.classList.remove("tap-bounce"); }, 260); });
  setInterval(tick, 1000);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) return;
    tick();
    if (state.mode === "online") {
      refreshRooms().then(function () { pollFails = 0; schedulePoll(currentPollMs()); return refreshInfo(); }).catch(function () {});
    }
  });
  boot();
})();
