from fastapi import FastAPI
from database.connection import init_db
from routers import auth, users

app = FastAPI(title="Uni-con API", version="1.0.0")

app.include_router(auth.router)
app.include_router(users.router)


@app.on_event("startup")
async def startup_event():
    init_db()


@app.get("/")
async def root():
    return {"message": "Uni-con API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8080)