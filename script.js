function showEpisode(title, text) {
  document.getElementById('title').innerText = title;
  document.getElementById('content').innerText = text;
  document.getElementById('modal').classList.add('active');
}

function showMessage(title, text) { showEpisode(title, text); }

function closeModal() {
  document.getElementById('modal').classList.remove('active');
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('modal')) closeModal();
}

const memories = [
  '💬 Our First Message ❤️',
  '😂 That Funny Fight We Still Laugh About',
  '🌹 The Best Date Ever',
  '✈️ Our Dream Vacation Together',
  '😄 The Day We Could Not Stop Laughing',
  '📞 The Call That Lasted All Night',
  '🌙 That Late Night Walk',
  '💌 The Sweetest Text You Ever Sent',
];

function spin() {
  const el = document.getElementById('slot-result');
  let count = 0;
  const interval = setInterval(() => {
    el.innerText = memories[Math.floor(Math.random() * memories.length)];
    count++;
    if (count >= 12) {
      clearInterval(interval);
      el.innerText = memories[Math.floor(Math.random() * memories.length)];
    }
  }, 80);
}

// Floating hearts
(function spawnHearts() {
  const canvas = document.getElementById('heartsCanvas');
  const symbols = ['❤', '♥', '💕', '💗', '💖'];
  function create() {
    const h = document.createElement('span');
    h.className = 'heart-float';
    h.innerText = symbols[Math.floor(Math.random() * symbols.length)];
    h.style.left = Math.random() * 100 + 'vw';
    h.style.fontSize = (.6 + Math.random() * 1.2) + 'rem';
    const dur = 8 + Math.random() * 10;
    h.style.animationDuration = dur + 's';
    h.style.animationDelay = Math.random() * 5 + 's';
    canvas.appendChild(h);
    setTimeout(() => h.remove(), (dur + 5) * 1000);
  }
  setInterval(create, 1200);
  for (let i = 0; i < 6; i++) create();
})();

// ── Navbar smooth scroll ──────────────────────────────────────────────────
function smoothScroll(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const navbarHeight = document.querySelector('.navbar')
    ? document.querySelector('.navbar').offsetHeight
    : 70;
  const top = el.getBoundingClientRect().top + window.scrollY - navbarHeight - 12;
  window.scrollTo({ top, behavior: 'smooth' });
}

// ── Our Music Space ───────────────────────────────────────────────────────
(function musicRoom() {
  const ms = (id) => document.getElementById(id);

  let socket = null;
  let ytPlayer = null;
  let ytReady = false;
  let joined = false;
  let roomId = '';
  let myName = '';
  let isDJ = false;
  let applyingRemote = false;
  let heartbeatTimer = null;
  let syncTimer = null;

  // ── helpers ──
  function setJoinError(msg) {
    ms('ms-join-error').textContent = msg || '';
  }
  function setCtrlMsg(msg) {
    ms('ms-ctrl-msg').textContent = msg || '';
  }

  function updateDJUI(djName) {
    ms('ms-dj-status').textContent = `🎧 DJ: ${djName || 'Nobody'}`;
    ms('ms-take-dj').textContent = isDJ ? '🎧 You are the DJ' : '🎧 Take DJ control';
  }

  function canControl() {
    if (!isDJ) {
      setCtrlMsg('Only the DJ controls playback. Tap "Take DJ control" if needed.');
      return false;
    }
    return true;
  }

  function emitControl(action, extra = {}) {
    if (!canControl()) return;
    const position = ytPlayer && typeof ytPlayer.getCurrentTime === 'function'
      ? ytPlayer.getCurrentTime() : 0;
    socket.emit('control', { room_id: roomId, action, position, ...extra });
  }

  function escHtml(v) {
    return String(v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function extractVideoId(val) {
    const s = String(val || '').trim();
    if (/^[\w-]{11}$/.test(s)) return s;
    const patterns = [
      /[?&]v=([\w-]{11})/,
      /youtu\.be\/([\w-]{11})/,
      /youtube\.com\/embed\/([\w-]{11})/,
      /youtube\.com\/shorts\/([\w-]{11})/,
      /youtube\.com\/live\/([\w-]{11})/,
    ];
    for (const re of patterns) {
      const m = s.match(re);
      if (m) return m[1];
    }
    return null;
  }

  function renderQueue(queue) {
    const el = ms('ms-queue-list');
    if (!queue || !queue.length) {
      el.innerHTML = '<p class="ms-muted" style="margin-top:8px">Queue is empty.</p>';
      return;
    }
    el.innerHTML = queue.map((item, i) => `
      <div class="ms-queue-item">
        <div>
          <strong>${escHtml(item.title)}</strong><br>
          <small>#${i + 1}</small>
        </div>
      </div>`).join('');
  }

  function applyState(state) {
    if (!ytPlayer || !ytReady || !state) return;
    ms('ms-song-title').textContent = state.title || 'YouTube song';
    renderQueue(state.queue || []);

    const currentId = typeof ytPlayer.getVideoData === 'function'
      ? ytPlayer.getVideoData().video_id : '';

    applyingRemote = true;
    if (currentId !== state.video_id) {
      ytPlayer.loadVideoById({ videoId: state.video_id, startSeconds: Number(state.position) || 0 });
      if (!state.playing) setTimeout(() => ytPlayer.pauseVideo(), 500);
    } else {
      const diff = Math.abs((ytPlayer.getCurrentTime() || 0) - (Number(state.position) || 0));
      if (diff > 1.5) ytPlayer.seekTo(Number(state.position), true);
      state.playing ? ytPlayer.playVideo() : ytPlayer.pauseVideo();
    }
    setTimeout(() => { applyingRemote = false; }, 800);
  }

  function startSyncLoops() {
    clearInterval(heartbeatTimer);
    clearInterval(syncTimer);

    heartbeatTimer = setInterval(() => {
      if (!joined || !isDJ || !ytPlayer || !ytReady) return;
      const playing = ytPlayer.getPlayerState() === YT.PlayerState.PLAYING;
      socket.emit('heartbeat', { room_id: roomId, position: ytPlayer.getCurrentTime(), playing });
    }, 2000);

    syncTimer = setInterval(() => {
      if (joined && !isDJ) socket.emit('request_state', { room_id: roomId });
    }, 5000);
  }

  function showRoomPanel(roomCode) {
    ms('ms-join-panel').classList.add('ms-hidden');
    ms('ms-room-panel').classList.remove('ms-hidden');
    ms('ms-code-display').textContent = roomCode;
  }

  function leaveRoom() {
    clearInterval(heartbeatTimer);
    clearInterval(syncTimer);
    if (socket) { socket.disconnect(); socket = null; }
    joined = false; isDJ = false; roomId = ''; myName = '';
    ms('ms-room-panel').classList.add('ms-hidden');
    ms('ms-join-panel').classList.remove('ms-hidden');
    ms('ms-join-error').textContent = '';
    ms('ms-room').value = '';
  }

  // ── Socket setup ──
  function setupSocket() {
    // Socket.IO will connect to whatever server served the page.
    // If the Flask server isn't running the connection will silently fail,
    // but the UI still renders correctly (offline-friendly).
    try {
      socket = io({ transports: ['websocket', 'polling'] });
    } catch (e) {
      setJoinError('Could not connect to music server.');
      return;
    }

    socket.on('connect', () => ms('ms-conn-status').textContent = '🟢 Connected');
    socket.on('disconnect', () => ms('ms-conn-status').textContent = '🔴 Disconnected');

    socket.on('room_created', (data) => {
      roomId = data.room_id;
      ms('ms-room').value = roomId;
      setJoinError(`Room ${roomId} created — now press Join Room.`);
    });

    socket.on('room_error', (data) => setJoinError(data.message));

    socket.on('joined', (data) => {
      joined = true;
      roomId = data.room_id;
      isDJ = data.is_dj;
      showRoomPanel(roomId);
      updateDJUI(data.state && data.state.dj_name);
      applyState(data.state);
      socket.emit('request_state', { room_id: roomId });
      startSyncLoops();
    });

    socket.on('state', applyState);

    socket.on('sync_tick', (data) => {
      if (!ytPlayer || !ytReady || !joined) return;
      if (data.video_id !== (ytPlayer.getVideoData && ytPlayer.getVideoData().video_id)) return;
      const diff = Math.abs((ytPlayer.getCurrentTime() || 0) - (Number(data.position) || 0));
      applyingRemote = true;
      if (diff > 1.5) ytPlayer.seekTo(Number(data.position), true);
      if (data.playing && ytPlayer.getPlayerState() !== YT.PlayerState.PLAYING) ytPlayer.playVideo();
      if (!data.playing && ytPlayer.getPlayerState() === YT.PlayerState.PLAYING) ytPlayer.pauseVideo();
      setTimeout(() => { applyingRemote = false; }, 500);
    });

    socket.on('presence', (data) => {
      ms('ms-presence').textContent = `👥 ${data.user_count} ${data.user_count === 1 ? 'person' : 'people'}`;
      updateDJUI(data.dj_name);
    });

    socket.on('dj_changed', (data) => {
      isDJ = data.dj_sid === socket.id;
      updateDJUI(data.dj_name);
      setCtrlMsg(isDJ ? 'You have DJ control 🎧' : `${data.dj_name} is now the DJ.`);
    });
  }

  // ── YouTube IFrame API ──
  // The global callback is called by the YouTube script once it loads.
  // We wrap it so we don't clobber any existing handler.
  const _prevYTReady = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = function () {
    if (typeof _prevYTReady === 'function') _prevYTReady();
    ytReady = true;
    ytPlayer = new YT.Player('ms-player', {
      width: '100%',
      height: '100%',
      videoId: '',
      playerVars: { playsinline: 1, controls: 1, rel: 0 },
      events: {
        onReady: () => {
          if (joined) socket.emit('request_state', { room_id: roomId });
        },
        onStateChange: (event) => {
          if (!joined || applyingRemote || !isDJ) return;
          if (event.data === YT.PlayerState.PLAYING) {
            socket.emit('control', { room_id: roomId, action: 'play', position: ytPlayer.getCurrentTime() });
          } else if (event.data === YT.PlayerState.PAUSED) {
            socket.emit('control', { room_id: roomId, action: 'pause', position: ytPlayer.getCurrentTime() });
          } else if (event.data === YT.PlayerState.ENDED) {
            socket.emit('control', { room_id: roomId, action: 'next', position: 0 });
          }
        }
      }
    });
  };

  // ── Button listeners ──
  ms('ms-create').addEventListener('click', () => {
    if (!socket) setupSocket();
    socket.emit('create_room');
  });

  ms('ms-join').addEventListener('click', () => {
    if (!socket) setupSocket();
    const name = ms('ms-name').value.trim() || 'Guest';
    const room = ms('ms-room').value.trim().toUpperCase();
    if (!room) { setJoinError('Enter a room code or create a new room first.'); return; }
    myName = name;
    socket.emit('join_room_request', { room_id: room, name });
  });

  ms('ms-play-btn').addEventListener('click', () => {
    if (canControl()) ytPlayer.playVideo();
  });
  ms('ms-pause-btn').addEventListener('click', () => {
    if (canControl()) ytPlayer.pauseVideo();
  });
  ms('ms-prev-btn').addEventListener('click', () => emitControl('previous'));
  ms('ms-next-btn').addEventListener('click', () => emitControl('next'));

  ms('ms-sync-btn').addEventListener('click', () => {
    if (socket) socket.emit('request_state', { room_id: roomId });
    setCtrlMsg('Sync requested 🔄');
  });

  ms('ms-take-dj').addEventListener('click', () => {
    if (joined && socket) socket.emit('take_control', { room_id: roomId });
  });

  ms('ms-load-btn').addEventListener('click', () => {
    if (!canControl()) return;
    const videoId = extractVideoId(ms('ms-yt-input').value.trim());
    const title = ms('ms-title-input').value.trim() || 'YouTube song';
    if (!videoId) { setCtrlMsg('Please enter a valid YouTube URL or video ID.'); return; }
    socket.emit('control', { room_id: roomId, action: 'load', video_id: videoId, title });
  });

  ms('ms-queue-btn').addEventListener('click', () => {
    if (!canControl()) return;
    const videoId = extractVideoId(ms('ms-yt-input').value.trim());
    const title = ms('ms-title-input').value.trim() || 'YouTube song';
    if (!videoId) { setCtrlMsg('Please enter a valid YouTube URL or video ID.'); return; }
    socket.emit('add_to_queue', { room_id: roomId, video_id: videoId, title });
    ms('ms-yt-input').value = '';
    ms('ms-title-input').value = '';
  });

  ms('ms-leave-btn').addEventListener('click', leaveRoom);
})();
