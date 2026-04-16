import os
import json
import asyncio
import socketio
import random
import string
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

# Try to import httpx for async proxying
try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    HAS_HTTPX = False

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

socket_app = socketio.ASGIApp(sio, other_asgi_app=app)
rooms = {}

@app.get("/")
async def root():
    return {"status": "CtrlAltDefeat Backend is Running!"}

@app.get("/api/proxy")
async def proxy(url: str = Query(...)):
    """
    Proxy request to bypass CORS for Wayground/external quiz imports.
    """
    if not HAS_HTTPX:
        return {"error": "httpx library not installed on server. Please install it to use the proxy."}
        
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json"
        }
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True, headers=headers) as client:
            response = await client.get(url)
            
            if response.status_code >= 400:
                return {
                    "error": f"Remote server returned {response.status_code}", 
                    "status": response.status_code,
                    "raw": response.text[:500]
                }
            
            content_type = response.headers.get('Content-Type', '')
            if 'application/json' in content_type:
                try:
                    return response.json()
                except Exception:
                    return {"error": "Failed to parse JSON from remote response", "raw": response.text[:500]}
            else:
                return {"error": "Remote server did not return JSON", "raw": response.text[:500]}
                
    except Exception as e:
        return {"error": str(e)}

try:
    with open(os.path.join(os.path.dirname(__file__), "questions.json"), "r", encoding="utf-8") as f:
        questions = json.load(f)
except FileNotFoundError:
    questions = []

def generate_room_code():
    return ''.join(random.choices(string.ascii_uppercase, k=4))

@sio.on('connect')
async def connect(sid, environ):
    pass

@sio.on('disconnect')
async def disconnect(sid):
    for code, room in rooms.items():
        if sid in room['players']:
            del room['players'][sid]
            await sio.emit('room_update', room, room=code)

@sio.on('create_room')
async def create_room(sid):
    code = generate_room_code()
    rooms[code] = {
        "code": code,
        "state": "lobby",
        "players": {},
        "current_q": 0,
        "questions": list(questions),
        "host": sid,
        "timer": 0,
        "default_timer": 15
    }
    await sio.enter_room(sid, code)
    await sio.emit('room_created', {'code': code}, room=sid)
    await sio.emit('room_update', rooms[code], room=code)

@sio.on('join_room')
async def join_room(sid, data):
    code = data.get('code', '').upper()
    name = data.get('name', 'Player').strip()
    avatar = data.get('avatar')
    if code in rooms and rooms[code]['state'] == 'lobby':
        for player_sid, p_data in rooms[code]['players'].items():
            if p_data['name'].lower() == name.lower():
                await sio.emit('error', {'message': f'Nickname "{name}" is already taken.'}, room=sid)
                return
                
        await sio.enter_room(sid, code)
        rooms[code]['players'][sid] = {"name": name, "score": 0, "status": "alive", "choice": None, "avatar": avatar, "combo": 0}
        await sio.emit('joined', {'code': code, 'name': name}, room=sid)
        await sio.emit('room_update', rooms[code], room=code)

@sio.on('send_reaction')
async def send_reaction(sid, data):
    code = data.get('code')
    emoji = data.get('emoji')
    if code in rooms:
        # Broadcast reaction to everyone in the room (primarily for the Host)
        await sio.emit('reaction', {'sid': sid, 'emoji': emoji}, room=code)
    else:
        await sio.emit('error', {'message': 'Room not found or game already started'}, room=sid)

@sio.on('kick_player')
async def kick_player(sid, data):
    code = data.get('code')
    player_sid = data.get('player_sid')
    if code in rooms and rooms[code]['host'] == sid:
        if player_sid in rooms[code]['players']:
            del rooms[code]['players'][player_sid]
            await sio.emit('kicked', {'message': 'You have been kicked.'}, room=player_sid)
            await sio.leave_room(player_sid, code)
            await sio.emit('room_update', rooms[code], room=code)

@sio.on('set_avatar')
async def set_avatar(sid, data):
    code = data.get('code')
    avatar = data.get('avatar')
    if code in rooms and sid in rooms[code]['players'] and rooms[code]['state'] == 'lobby':
        rooms[code]['players'][sid]['avatar'] = avatar
        await sio.emit('room_update', rooms[code], room=code)

@sio.on('start_game')
async def start_game(sid, data):
    code = data.get('code', '').upper()
    settings = data.get('settings', {})
    if code in rooms and rooms[code]['host'] == sid:
        room = rooms[code]
        room['default_timer'] = int(settings.get('timer', 15))
        room['fast_mode'] = bool(settings.get('fastMode', False))
        if 'questions' in settings and settings['questions']:
            room['questions'] = settings['questions']
        if settings.get('shuffle', True):
            random.shuffle(room['questions'])
        room['current_q'] = 0
        await next_question(code)

@sio.on('answer')
async def answer(sid, data):
    code = data.get('code')
    choice = data.get('choice')
    if code in rooms and rooms[code]['state'] == 'question':
        if sid in rooms[code]['players'] and rooms[code]['players'][sid]['status'] == "alive":
            rooms[code]['players'][sid]['choice'] = choice
            await sio.emit('room_update', rooms[code], room=code)
            if rooms[code].get('fast_mode', False):
                alive_players = [p for p in rooms[code]['players'].values() if p['status'] == 'alive']
                if all(p.get('choice') is not None for p in alive_players):
                    rooms[code]['timer_skip'] = True

async def game_loop(code):
    room = rooms[code]
    timer_duration = room.get('default_timer', 15)
    room['timer_skip'] = False
    for t in range(timer_duration, -1, -1):
        if room['state'] != 'question' or room.get('timer_skip', False):
            break
        room['timer'] = t
        await sio.emit('timer', {'time': t, 'total': timer_duration}, room=code)
        await asyncio.sleep(1)
    if room['state'] == 'question':
        await reveal_answer(code)

async def next_question(code):
    room = rooms[code]
    alive_players = [p for p in room['players'].values() if p['status'] == 'alive']
    if (len(alive_players) <= 1 and room['current_q'] > 0) or room['current_q'] >= len(room['questions']):
        room['state'] = 'end'
        await sio.emit('room_update', room, room=code)
        return
    room['state'] = 'question'
    for p in room['players'].values(): p['choice'] = None
    await sio.emit('room_update', room, room=code)
    asyncio.create_task(game_loop(code))

async def reveal_answer(code):
    room = rooms[code]
    room['state'] = 'reveal'
    q = room['questions'][room['current_q']]
    q_type = q.get('type', 'multiple_choice')

    for sid, p in room['players'].items():
        if p['status'] == 'alive':
            player_choice = p.get('choice')
            is_correct = False

            if q_type == 'multiple_choice' or q_type == 'image_options':
                correct_val = q['correct']
                # Support both single index and array of indices
                correct_arr = correct_val if isinstance(correct_val, list) else [correct_val]
                # Ensure player_choice is a list
                p_choice_arr = player_choice if isinstance(player_choice, list) else ([player_choice] if player_choice is not None else [])

                # Check if arrays match exactly (order doesn't strictly matter for set equality)
                if len(correct_arr) == len(p_choice_arr) and set(map(int, correct_arr)) == set(map(int, p_choice_arr)):
                    is_correct = True

            elif q_type == 'text':
                if player_choice and isinstance(player_choice, str):
                    correct_ans = q['correct']
                    if isinstance(correct_ans, list):
                        is_correct = any(str(a).lower() == player_choice.lower() for a in correct_ans)
                    else:
                        is_correct = (str(correct_ans).lower() == player_choice.lower())
            elif q_type == 'percentage':
                try: is_correct = (abs(float(q['correct']) - float(player_choice)) <= 5.0)
                except: pass
            elif q_type == 'image_zone':
                try:
                    dist = ((float(player_choice['x']) - float(q['correct']['x']))**2 + (float(player_choice['y']) - float(q['correct']['y']))**2)**0.5
                    is_correct = (dist <= float(q['correct']['radius']))
                except: pass
            if not is_correct:
                p['status'] = 'dead'
                p['combo'] = 0
                await sio.emit('eliminated', room=sid)
            else:
                p['combo'] = p.get('combo', 0) + 1
                bonus = min(p['combo'] * 10, 50) # Max 50 bonus points
                p['score'] += 100 + bonus
    await sio.emit('room_update', room, room=code)
    await asyncio.sleep(4)
    alive_players = [p for p in room['players'].values() if p['status'] == 'alive']
    if len(alive_players) <= 1:
        room['state'] = 'end'
        await sio.emit('room_update', room, room=code)
        return
    room['current_q'] += 1
    await next_question(code)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run('server:socket_app', host='0.0.0.0', port=8000, reload=True)
