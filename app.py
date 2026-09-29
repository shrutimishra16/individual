import os
import re
import time
import secrets
import urllib.request
import urllib.parse
import json

from flask import Flask, send_from_directory, request, jsonify
from flask_socketio import SocketIO, emit, join_room

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ── YouTube API key — paste yours between the quotes ──────────────────────
YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "AIzaSy")

app = Flask(__name__, static_folder=BASE_DIR, static_url_path="")
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "obsession-secret-key")
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# ── In-memory rooms ────────────────────────────────────────────────────────
rooms = {}


def new_code():
    return secrets.token_hex(3).upper()


def get_room(room_id):
    room_id = room_id.strip().upper()
    if room_id not in rooms:
        rooms[room_id] = {
            "host_sid":   None,
            "dj_sid":     None,
            "users":      {},
            "video_id":   "",
            "title":      "No song loaded",
            "playing":    False,
            "position":   0.0,
            "updated_at": time.time(),
            "queue":      [],
        }
    return rooms[room_id]


def current_position(room):
    if room["playing"]:
        return max(0.0, room["position"] + (time.time() - room["updated_at"]))
    return max(0.0, room["position"])


def public_state(room):
    return {
        "video_id":   room["video_id"],
        "title":      room["title"],
        "playing":    room["playing"],
        "position":   current_position(room),
        "queue":      room["queue"],
        "dj_sid":     room["dj_sid"],
        "dj_name":    room["users"].get(room["dj_sid"], ""),
        "user_count": len(room["users"]),
    }


def extract_video_id(value):
    if not value:
        return None
    value = value.strip()
    if re.fullmatch(r"[\w-]{11}", value):
        return value
    for pattern in [
        r"[?&]v=([\w-]{11})",
        r"youtu\.be/([\w-]{11})",
        r"youtube\.com/embed/([\w-]{11})",
        r"youtube\.com/shorts/([\w-]{11})",
        r"youtube\.com/live/([\w-]{11})",
    ]:
        m = re.search(pattern, value)
        if m:
            return m.group(1)
    return None


# ── Routes ─────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/music")
def music():
    return send_from_directory(BASE_DIR, "music.html")


@app.route("/api/search")
def api_search():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify({"error": "empty query"}), 400

    if not YOUTUBE_API_KEY or YOUTUBE_API_KEY == "PASTE_YOUR_KEY_HERE":
        return jsonify({"error": "no_key",
                        "message": "Set YOUTUBE_API_KEY in app.py."}), 503

    params = urllib.parse.urlencode({
        "part":       "snippet",
        "q":          q,
        "type":       "video",
        "maxResults": 12,
        "key":        YOUTUBE_API_KEY,
    })
    url = "https://www.googleapis.com/youtube/v3/search?" + params

    try:
        with urllib.request.urlopen(url, timeout=8) as resp:
            data = json.loads(resp.read())
    except Exception as e:
        return jsonify({"error": str(e)}), 502

    results = []
    for item in data.get("items", []):
        vid  = item.get("id", {}).get("videoId")
        snip = item.get("snippet", {})
        if not vid:
            continue
        results.append({
            "video_id":  vid,
            "title":     snip.get("title", ""),
            "channel":   snip.get("channelTitle", ""),
            "thumbnail": snip.get("thumbnails", {}).get("medium", {}).get("url", ""),
        })

    return jsonify({"results": results})



@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(BASE_DIR, filename)


# ── Socket events ──────────────────────────────────────────────────────────

@socketio.on("create_room")
def on_create_room():
    code = new_code()
    get_room(code)
    emit("room_created", {"room_id": code})


@socketio.on("join_room_request")
def on_join(data):
    room_id = str(data.get("room_id", "")).strip().upper()
    name    = str(data.get("name", "Guest")).strip()[:30] or "Guest"

    if not re.fullmatch(r"[A-Z0-9]{4,12}", room_id):
        emit("room_error", {"message": "Invalid room code. Use 4–12 letters/numbers."})
        return

    room = get_room(room_id)
    join_room(room_id)
    room["users"][request.sid] = name

    if room["host_sid"] is None:
        room["host_sid"] = request.sid
    if room["dj_sid"] is None:
        room["dj_sid"] = request.sid

    emit("joined", {
        "room_id": room_id,
        "name":    name,
        "is_dj":   request.sid == room["dj_sid"],
        "state":   public_state(room),
    })

    socketio.emit("presence", {
        "user_count": len(room["users"]),
        "users":      list(room["users"].values()),
        "dj_name":    room["users"].get(room["dj_sid"], ""),
    }, to=room_id)


@socketio.on("request_state")
def on_request_state(data):
    room_id = str(data.get("room_id", "")).strip().upper()
    room = rooms.get(room_id)
    if room:
        emit("state", public_state(room))


@socketio.on("control")
def on_control(data):
    room_id = str(data.get("room_id", "")).strip().upper()
    action  = data.get("action")
    room    = rooms.get(room_id)

    if not room:
        emit("room_error", {"message": "Room not found."})
        return

    # Auto-promote sender to DJ
    if room.get("dj_sid") != request.sid:
        room["dj_sid"] = request.sid
        socketio.emit("dj_changed", {
            "dj_name": room["users"].get(request.sid, "Guest"),
            "dj_sid":  request.sid,
        }, to=room_id)

    pos = data.get("position")
    if isinstance(pos, (int, float)):
        room["position"] = max(0.0, float(pos))
    room["updated_at"] = time.time()

    if action == "play":
        room["playing"] = True
    elif action == "pause":
        room["playing"] = False
    elif action == "seek":
        room["position"] = max(0.0, float(pos or 0))
        room["playing"]  = True
    elif action == "load":
        vid = extract_video_id(str(data.get("video_id", "")))
        if not vid:
            emit("room_error", {"message": "Invalid YouTube URL or ID."})
            return
        room["video_id"]   = vid
        room["title"]      = str(data.get("title", "YouTube song")).strip()[:100] or "YouTube song"
        room["position"]   = 0.0
        room["playing"]    = True
        room["updated_at"] = time.time()
    elif action == "next":
        if room["queue"]:
            item = room["queue"].pop(0)
            room["video_id"]   = item["video_id"]
            room["title"]      = item["title"]
            room["position"]   = 0.0
            room["playing"]    = True
            room["updated_at"] = time.time()
    elif action == "previous":
        room["position"]   = 0.0
        room["updated_at"] = time.time()
    else:
        emit("room_error", {"message": "Unknown action."})
        return

    socketio.emit("state", public_state(room), to=room_id)


@socketio.on("heartbeat")
def on_heartbeat(data):
    room_id = str(data.get("room_id", "")).strip().upper()
    room    = rooms.get(room_id)
    if not room or room.get("dj_sid") != request.sid:
        return
    pos = data.get("position")
    if not isinstance(pos, (int, float)):
        return
    room["position"]   = max(0.0, float(pos))
    room["updated_at"] = time.time()
    room["playing"]    = bool(data.get("playing", room["playing"]))
    socketio.emit("sync_tick", {
        "position": current_position(room),
        "playing":  room["playing"],
        "video_id": room["video_id"],
    }, to=room_id, include_self=False)


@socketio.on("add_to_queue")
def on_add_queue(data):
    room_id = str(data.get("room_id", "")).strip().upper()
    room    = rooms.get(room_id)
    if not room:
        emit("room_error", {"message": "Room not found."})
        return
    # Any member can queue
    if room.get("dj_sid") != request.sid:
        room["dj_sid"] = request.sid
        socketio.emit("dj_changed", {
            "dj_name": room["users"].get(request.sid, "Guest"),
            "dj_sid":  request.sid,
        }, to=room_id)
    vid = extract_video_id(str(data.get("video_id", "")))
    if not vid:
        emit("room_error", {"message": "Invalid YouTube URL or ID."})
        return
    title = str(data.get("title", "YouTube song")).strip()[:100] or "YouTube song"
    room["queue"].append({"video_id": vid, "title": title})
    socketio.emit("state", public_state(room), to=room_id)


@socketio.on("take_control")
def on_take_control(data):
    room_id = str(data.get("room_id", "")).strip().upper()
    room    = rooms.get(room_id)
    if not room or request.sid not in room["users"]:
        return
    room["dj_sid"] = request.sid
    socketio.emit("dj_changed", {
        "dj_name": room["users"].get(request.sid, "Guest"),
        "dj_sid":  request.sid,
    }, to=room_id)


@socketio.on("disconnect")
def on_disconnect():
    for room_id, room in list(rooms.items()):
        if request.sid not in room["users"]:
            continue
        room["users"].pop(request.sid, None)
        if room["dj_sid"] == request.sid:
            room["dj_sid"] = next(iter(room["users"]), None)
        if room["host_sid"] == request.sid:
            room["host_sid"] = next(iter(room["users"]), None)
        socketio.emit("presence", {
            "user_count": len(room["users"]),
            "users":      list(room["users"].values()),
            "dj_name":    room["users"].get(room["dj_sid"], "Nobody"),
        }, to=room_id)
        if not room["users"]:
            del rooms[room_id]


if __name__ == "__main__":
    import os

    port = int(os.environ.get("PORT", 5000))

    socketio.run(
        app,
        host="0.0.0.0",
        port=port,
        allow_unsafe_werkzeug=True
    )