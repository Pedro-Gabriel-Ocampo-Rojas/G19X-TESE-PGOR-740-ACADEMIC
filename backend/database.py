import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base

# Carga las variables del archivo .env
load_dotenv()

# Lee la URL desde el .env, si no la encuentra usa un valor seguro por defecto
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql+asyncpg://usuario:password@localhost:5432/PluriOne_db"
)

# Motor asíncrono
engine = create_async_engine(SQLALCHEMY_DATABASE_URL, echo=True)
SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

# Dependencia asíncrona para FastAPI
async def get_db():
    async with SessionLocal() as db:
        yield db