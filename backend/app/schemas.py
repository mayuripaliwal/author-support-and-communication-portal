from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.config import ROLES
from typing import Literal, Optional
from app.models import TicketCategory, TicketPriority, TicketStatus

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

class AuthorTicketCreate(BaseModel):
    """
    - Schema for a valid ticket raised by author
    """
    book_id:str|None
    subject:str=Field(min_length=1, max_length=200)
    description:str=Field(min_length=1)

class TicketUpdate(BaseModel):
    """
    - Schema to update ticket details like `category`, `priority`, `status`
    """
    model_config=ConfigDict(extra="forbid")

    category:Optional[TicketCategory]=None
    priority:Optional[TicketPriority]=None
    status:Optional[TicketStatus]=None