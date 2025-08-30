from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from database.connection import init_db
from routers import auth, users, profile, rooms, favorites, policies, admin, contract_analysis, chat, policy_chat, activity
from dotenv import load_dotenv

# 환경변수 로드
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        print("🔄 Initializing database...")
        init_db()
        print("✅ Database initialization completed!")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        # 데이터베이스 초기화 실패해도 서버는 계속 실행
    yield


app = FastAPI(title="Uni-con API", version="1.0.0", lifespan=lifespan)


# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발용으로 모든 도메인 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth")
app.include_router(users.router, prefix="/users")
app.include_router(profile.router)
app.include_router(rooms.router)
app.include_router(favorites.router)
app.include_router(policies.router)
app.include_router(admin.router)
app.include_router(contract_analysis.router, prefix="/contract")
app.include_router(chat.router)
app.include_router(policy_chat.router)
app.include_router(activity.router)


@app.get("/")
async def root():
    return {"message": "Uni-con API is running"}


if __name__ == "__main__":
    import uvicorn
    import logging

    # 401 에러 로그를 숨기기 위해 uvicorn 로그 레벨 조정
    logging.getLogger("uvicorn.access").setLevel(logging.ERROR)

    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8080,
        access_log=False  # 액세스 로그 비활성화
    )
