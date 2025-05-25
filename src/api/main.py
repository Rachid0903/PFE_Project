
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import sqlite3
from datetime import datetime

# Initialize FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class SensorData(BaseModel):
    chip_id: str
    temperature: float
    humidity: int
    rssi: int

class SensorResponse(BaseModel):
    id: str
    temperature: float
    humidity: int
    rssi: int
    last_updated: str

# Database initialization
def init_db():
    conn = sqlite3.connect('sensors.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS sensors
        (chip_id TEXT PRIMARY KEY, 
        temperature REAL,
        humidity INTEGER,
        rssi INTEGER,
        last_updated TIMESTAMP)
    ''')
    conn.commit()
    conn.close()

init_db()

@app.post("/sensor-data/")
async def receive_sensor_data(data: SensorData):
    conn = sqlite3.connect('sensors.db')
    c = conn.cursor()
    
    try:
        c.execute('''
            INSERT OR REPLACE INTO sensors 
            (chip_id, temperature, humidity, rssi, last_updated)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            data.chip_id,
            data.temperature,
            data.humidity,
            data.rssi,
            datetime.now().isoformat()
        ))
        conn.commit()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/sensors/", response_model=List[SensorResponse])
async def get_sensors():
    conn = sqlite3.connect('sensors.db')
    c = conn.cursor()
    
    try:
        c.execute('SELECT * FROM sensors')
        rows = c.fetchall()
        return [
            {
                "id": row[0],
                "temperature": row[1],
                "humidity": row[2],
                "rssi": row[3],
                "last_updated": row[4]
            }
            for row in rows
        ]
    finally:
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
