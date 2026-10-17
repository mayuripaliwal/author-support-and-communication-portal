from pydantic import BaseModel, EmailStr, Field
from app.config import ROLES
from typing import Literal

class NewAuthor(BaseModel):
    name:str=Field(min_length=1, max_length=255, examples=["Priya Sharma"])
    email:EmailStr=Field(examples=["priya.sharma@email.com"])
    phone:str | None=Field(default=None, max_length=30, examples=["+91-98765-43210"])
    city:str | None=Field(default=None, max_length=100, examples=["Mumbai"])
    password:str=Field(min_length=8, max_length=128, examples=["password"])

class LoginRequest(BaseModel):
    """
    - Validates `role` is either `AUTHOR` or `ADMIN`
    - Validates `email` is a valid email 
    - Validates `password` with basic length check
    """
    role:ROLES
    email:EmailStr=Field(examples=["priya.sharma@email.com"])
    password:str=Field(min_length=8, max_length=128, examples=["password"])