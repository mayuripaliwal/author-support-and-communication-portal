from pydantic import BaseModel, EmailStr, Field
from app.config import ROLES
from typing import Literal

class NewAuthor(BaseModel):
    name:str=Field(min_length=1, max_length=255)
    email:EmailStr
    phone:str | None=Field(default=None, max_length=30)
    city:str | None=Field(default=None, max_length=100)
    password:str=Field(min_length=8, max_length=128)

class LoginRequest(BaseModel):
    """
    - Validates `role` is either `AUTHOR` or `ADMIN`
    - Validates `email` is a valid email 
    - Validates `password` with basic length check
    """
    role:ROLES
    email:EmailStr
    password:str=Field(min_length=8, max_length=128)