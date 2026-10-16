from app.config import DATABASE_URL

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

class Base(DeclarativeBase):
    pass

engine=create_engine(DATABASE_URL)

SessionLocal=sessionmaker(bind=engine, autoflush=False)

def get_db():
    with SessionLocal() as db:
        yield db
        