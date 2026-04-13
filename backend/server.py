import os
import json
import asyncio
import socketio
import random
import string
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
    return {"status": "CtrlAltDefeat Backend is Running! This port is meant for Socket.IO connections, not for browser pages. Please open the Frontend port instead."}

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
        "questions": random.sample(questions, len(questions)),
        "host": sid,
        "timer": 0
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
        # Check for duplicate names
        for player_sid, p_data in rooms[code]['players'].items():
            if p_data['name'].lower() == name.lower():
                await sio.emit('error', {'message': f'Nickname "{name}" is already taken in this room.'}, room=sid)
                return
                
        await sio.enter_room(sid, code)
        rooms[code]['players'][sid] = {"name": name, "score": 0, "status": "alive", "choice": None, "avatar": avatar}
        await sio.emit('joined', {'code': code, 'name': name}, room=sid)
        await sio.emit('room_update', rooms[code], room=code)
    else:
        await sio.emit('error', {'message': 'Room not found or game already started'}, room=sid)

@sio.on('kick_player')
async def kick_player(sid, data):
    code = data.get('code')
    player_sid = data.get('player_sid')
    
    if code in rooms and rooms[code]['host'] == sid:
        if player_sid in rooms[code]['players']:
            del rooms[code]['players'][player_sid]
            await sio.emit('kicked', {'message': 'You have been kicked from the room by the host.'}, room=player_sid)
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
        
        # Apply custom settings
        if 'timer' in settings:
            room['default_timer'] = int(settings['timer'])
        else:
            room['default_timer'] = 15
            
        if 'fastMode' in settings:
            room['fast_mode'] = bool(settings['fastMode'])
        else:
            room['fast_mode'] = False
            
        if 'questions' in settings and settings['questions'] and isinstance(settings['questions'], list) and len(settings['questions']) > 0:
            room['questions'] = settings['questions']
        
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
            
            # Fast Reveal Mode check
            if rooms[code].get('fast_mode', False):
                alive_players = [p for p in rooms[code]['players'].values() if p['status'] == 'alive']
                if all(p.get('choice') is not None for p in alive_players):
                    rooms[code]['timer_skip'] = True

async def game_loop(code):
    room = rooms[code]
    timer_duration = room.get('default_timer', 15)
    room['timer_skip'] = False
    
    for t in range(timer_duration, -1, -1):
        if room['state'] != 'question':
            break
        if room.get('timer_skip', False):
            break
        room['timer'] = t
        await sio.emit('timer', {'time': t}, room=code)
        await asyncio.sleep(1)
        
    if room['state'] == 'question':
        await reveal_answer(code)

async def next_question(code):
    room = rooms[code]
    alive_players = [p for p in room['players'].values() if p['status'] == 'alive']
    
    if len(alive_players) <= 1 and room['current_q'] > 0:
        room['state'] = 'end'
        await sio.emit('room_update', room, room=code)
        return
        
    if room['current_q'] >= len(room['questions']):
        room['state'] = 'end'
        await sio.emit('room_update', room, room=code)
        return
        
    room['state'] = 'question'
    for p in room['players'].values():
        p['choice'] = None
        
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
                if isinstance(correct_val, str) and correct_val.isalpha():
                    correct_idx = ord(correct_val.upper()) - 65
                else:
                    try:
                        correct_idx = int(correct_val)
                    except ValueError:
                        correct_idx = 0
                is_correct = (player_choice == correct_idx)
                
            elif q_type == 'text':
                if player_choice and isinstance(player_choice, str):
                    correct_ans = q['correct']
                    if isinstance(correct_ans, list):
                        is_correct = any(str(a).lower() == player_choice.lower() for a in correct_ans)
                    else:
                        is_correct = (str(correct_ans).lower() == player_choice.lower())
                        
            elif q_type == 'percentage':
                try:
                    c_val = float(q['correct'])
                    p_val = float(player_choice)
                    # allow 5% margin of error
                    is_correct = (abs(c_val - p_val) <= 5.0)
                except:
                    pass
            
            elif q_type == 'image_zone':
                if player_choice and isinstance(player_choice, dict):
                    x = float(player_choice.get('x', 0))
                    y = float(player_choice.get('y', 0))
                    cx = float(q['correct'].get('x', 50))
                    cy = float(q['correct'].get('y', 50))
                    r = float(q['correct'].get('radius', 10))
                    
                    dist = ((x - cx)**2 + (y - cy)**2)**0.5
                    is_correct = (dist <= r)

            if not is_correct:
                p['status'] = 'dead'
                await sio.emit('eliminated', room=sid)
            else:
                p['score'] += 100
    
    await sio.emit('room_update', room, room=code)
    
    # Wait for 4 seconds to look at the reveal screen
    await asyncio.sleep(4)
    
    # Check if game should end immediately if <= 1 players alive
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
