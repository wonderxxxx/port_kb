from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL, connect_args={"options": "-c client_encoding=utf8"})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

from app.models import Base, User
from app.utils.auth_utils import get_password_hash

def init_admin():
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            hashed_password = get_password_hash("admin123")
            admin = User(
                username="admin",
                email="admin@example.com",
                hashed_password=hashed_password,
                full_name="管理员",
                role="admin"
            )
            db.add(admin)
            db.commit()
            print("管理员用户创建成功")
        else:
            print("管理员用户已存在")
    finally:
        db.close()

if __name__ == "__main__":
    init_admin()