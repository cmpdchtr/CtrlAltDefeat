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
    name = data.get('name', 'Player')
    if code in rooms and rooms[code]['state'] == 'lobby':
        await sio.enter_room(sid, code)
        rooms[code]['players'][sid] = {"name": name, "score": 0, "status": "alive", "choice": None}
        await sio.emit('joined', {'code': code, 'name': name}, room=sid)
        await sio.emit('room_update', rooms[code], room=code)
    else:
        await sio.emit('error', {'message': 'Room not found or game started'}, room=sid)

@sio.on('start_game')
async def start_game(sid, data):
    code = data.get('code', '').upper()
    if code in rooms and rooms[code]['host'] == sid:
        await next_question(code)

@sio.on('answer')
async def answer(sid, data):
    code = data.get('code')
    choice = data.get('choice')
    if code in rooms and rooms[code]['state'] == 'question':
        if sid in rooms[code]['players'] and rooms[code]['players'][sid]['status'] == "alive":
            rooms[code]['players'][sid]['choice'] = choice
            await sio.emit('room_update', rooms[code], room=code)

async def game_loop(code):
    room = rooms[code]
    for t in range(15, -1, -1):
        if room['state'] != 'question':
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
    correct = q['correct']
    
    for sid, p in room['players'].items():
        if p['status'] == 'alive':
            if p['choice'] != correct:
                p['status'] = 'dead'
                await sio.emit('eliminated', room=sid)
            else:
                p['score'] += 100
    
    await sio.emit('room_update', room, room=code)
    await asyncio.sleep(4)
    
    room['current_q'] += 1
    
    alive_players = [p for p in room['players'].values() if p['status'] == 'alive']
    if len(alive_players) <= 1:
        room['state'] = 'end'
        await sio.emit('room_update', room, room=code)
    else:
        await next_question(code)



if __name__ == '__main__':
    import uvicorn
    uvicorn.run('server:socket_app', host='0.0.0.0', port=8000, reload=True)
