from pydantic import BaseModel

class Favorite(BaseModel):
    user_id: str
    room_id: str
    