from fastapi import FastAPI, Depends, HTTPException, status, Request, Response
from app.config import DATABASE_URL, JWT_SECRET_KEY, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, IS_PRODUCTION, ROLES, FRONTEND_URL
from app.database import get_db
from app.schemas import NewAuthor, LoginRequest
from argon2 import PasswordHasher
from app.models import Author, Admin
from sqlalchemy import text, select
from sqlalchemy.exc import IntegrityError
import jwt
from datetime import datetime, timezone, timedelta
from typing import Literal
from fastapi.middleware.cors import CORSMiddleware

app=FastAPI(
    swagger_ui_parameters={"tryItOutEnabled": True}
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["GET","OPTIONS","POST","PATCH"],
    allow_headers=["Content-Type"]
)

ph=PasswordHasher()

@app.get('/health')
def health_check():
    return {
        "status":"ok"
    }

def verify_user(request:Request,db=Depends(get_db))->dict:
    """
    - Returns user_id and role of a authenticated user
    - If not authenticated, raises `HTTP_401_UNAUTHORIZED`
    """
    access_token=request.cookies.get("access_token")
    if access_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token missing."
        )

    try:
        decoded_payload=decode_jwt_access_token(access_token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token expired."
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token."
        )
    
    user_id=decoded_payload["sub"]
    role=decoded_payload["role"]

    if not findUserByID(role,user_id,db):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user."
        )   
        
    return {
        "user_id":user_id,
        "role":role
    }

@app.post('/signup', status_code=status.HTTP_201_CREATED)
def authorSignup(author:NewAuthor,db=Depends(get_db)):
    """
    - Creates an account for the author and returns `HTTP_201_CREATED`
    - Returns `HTTP_409_CONFLICT` when an account with the same email already exists.
    - Returns `HTTP_422_UNPROCESSABLE_ENTITY` for invalid input fields.
    """
    password_hash=hash_password(author.password)

    try:
        createAuthorAccount(author.name, author.email, author.phone, author.city, password_hash,db)
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists."
        )

    return {
        "message":"Account created successfully."
    }

@app.post('/login', status_code=status.HTTP_200_OK)
def userLogin(response:Response,user:LoginRequest, db=Depends(get_db)):
    """
    - Returns `HTTP_200_OK` on successful user login
    - Returns `HTTP_401_UNAUTHORIZED` when invalid email or password
    """
    existing_user=findUserByEmail(user.role,user.email,db)

    if existing_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
    
    try:
        verify_password(user.password, existing_user["password_hash"])
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    payload={
        "sub":existing_user["user_id"],
        "exp":datetime.now(timezone.utc)+timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "role":user.role
    }

    access_token=create_jwt_access_token(payload=payload)

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True if IS_PRODUCTION else False,
        samesite="lax"
    )

    return {
        "message":"Login successful."
    }

def hash_password(password:str)->str:
    """
    - Hashes a given password using argon2-cffi
    """
    return ph.hash(password)

def verify_password(password:str, password_hash:str)->bool:
    """
    - Returns true if given password matches the given password hash 
    - If not matched, then exception is raised
    """
    return ph.verify(password_hash, password)

def createAuthorAccount(name:str, email:str, phone:str|None, city:str|None, password_hash:str, db):
    """
    - DB helper to create a author account for given email and password_hash
    """
    try:
        db.add(Author(
        author_id=generate_author_id(db),
        name=name,
        email=email,
        phone=phone, 
        city=city,
        password_hash=password_hash
    ))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise

def generate_author_id(db)->str:
    next_id=db.execute(
        text("SELECT nextval('author_id_seq')")
    ).scalar_one()

    return f"AUTH{next_id:03d}"

def generate_book_id(db)->str:
    next_id=db.execute(
        text("SELECT nextval('book_id_seq')")
    ).scalar_one()

    return f"BK{next_id:03d}"

def generate_admin_id(db)->str:
    next_id=db.execute(
        text("SELECT nextval('admin_id_seq')")
    ).scalar_one()

    return f"AD{next_id:03d}"

def generate_ticket_id(db)->str:
    next_id=db.execute(
        text("SELECT nextval('ticket_id_seq')")
    ).scalar_one()

    return f"TK{next_id:03d}"

def generate_ticket_message_id(db)->str:
    next_id=db.execute(
        text("SELECT nextval('ticket_message_id_seq')")
    ).scalar_one()

    return f"TM{next_id:03d}"

def findUserByEmail(role:ROLES, email:str,db)->dict|None:
    """
    - Returns a dict with user_id and password_hash
    - If email does not exist for the given role, returns None
    """
    if role=="AUTHOR":
        result=db.execute(
            select(Author.author_id, Author.password_hash)
            .where(Author.email==email)
        ).one_or_none()
    else:
        result=db.execute(
            select(Admin.admin_id, Admin.password_hash)
            .where(Admin.email==email)
        ).one_or_none()

    if result is None:
        return None

    user_id, password_hash=result

    return {
        "user_id":user_id,
        "password_hash":password_hash
    }

def create_jwt_access_token(payload:dict)->str:
    """
    - Returns JWT access token for given payload
    """

    token=jwt.encode(payload=payload, key=JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

    return token

def decode_jwt_access_token(token:str)->dict:
    """
    - Returns JWT access token for given payload

    """

    decoded_payload=jwt.decode(jwt=token, key=JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])

    return decoded_payload

def findUserByID(role:ROLES, user_id:str,db)->bool:
    """
    - Returns True if the user_id exists for the given role
    - Else returns False
    """
    if role=="AUTHOR":
        result=db.execute(
            select(Author.author_id)
            .where(Author.author_id==user_id)
        ).scalar_one_or_none()
    else:
        result=db.execute(
            select(Admin.admin_id)
            .where(Admin.admin_id==user_id)
        ).scalar_one_or_none()

    if result is None:
        return False

    return True