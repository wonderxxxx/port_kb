from app.database import engine, Base
from pgvector.sqlalchemy import Vector

# 在 SQLAlchemy 2.0 + pgvector 0.3.0 中，register_vector 已被移除
# Vector 类型会自动注册，无需显式调用 register_vector

Base.metadata.create_all(bind=engine)
print("Database tables created successfully")