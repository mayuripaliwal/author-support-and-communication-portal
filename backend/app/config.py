import os
from dotenv import load_dotenv
from typing import Literal

load_dotenv()

DATABASE_URL=os.environ["DATABASE_URL"]

JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_SECRET_KEY=os.environ["JWT_SECRET_KEY"]

IS_PRODUCTION=True if os.environ["ENVIRONMENT"] =="production" else False

ROLES=Literal["AUTHOR", "ADMIN"]

FRONTEND_URL=os.environ["FRONTEND_URL"]

GROQ_AUTHOR_SUPPORT_PORTAL_API=os.environ["GROQ_AUTHOR_SUPPORT_PORTAL_API"]

MODEL=os.environ["GROQ_MODEL"]