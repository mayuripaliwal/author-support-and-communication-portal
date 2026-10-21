from fastapi import FastAPI, Depends, HTTPException, status, Request, Response, Body
from app.config import JWT_SECRET_KEY, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, IS_PRODUCTION, ROLES, FRONTEND_URL, GROQ_AUTHOR_SUPPORT_PORTAL_API, MODEL
from app.database import get_db, SessionLocal
from app.schemas import NewAuthor, LoginRequest, AuthorTicketCreate, TicketUpdate
from argon2 import PasswordHasher
from app.models import Author, Admin, Book, BookStatus, SenderType, Ticket, TicketStatus, TicketMessage, Visibility
from sqlalchemy import text, select, update
from sqlalchemy.exc import IntegrityError
import jwt
from datetime import datetime, timezone, timedelta
from typing import Literal
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
import json
from app.bookleaf_knowledge_base import knowledge_base, bookleaf_response_examples
from app.models import TicketCategory, TicketPriority
from fastapi import BackgroundTasks
from datetime import datetime
from strip_markdown import strip_markdown

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


categories=[category.value for category in TicketCategory]
priorities = [priority.value for priority in TicketPriority]

@app.get('/health')
def health_check():
    return {
        "status":"ok"
    }

def verify_user(request:Request,db=Depends(get_db))->dict[str,str]:
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

@app.get('/auth', status_code=status.HTTP_200_OK)
def auth(user=Depends(verify_user)):
    """
    - Returns `HTTP_200_OK` when user is authenticated
    """
    return {
        "status":"ok",
        "role":user["role"]
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
        samesite="none" if IS_PRODUCTION else "lax"
    )

    return {
        "message":"Login successful."
    }

@app.get('/author/books', status_code=status.HTTP_200_OK)
def fetchAuthorBooks(published_only:bool=True,user=Depends(verify_user), db=Depends(get_db)):
    """
    - `published_only`is by default True, Set it to False to get all books
    - Returns details for books by author - `book_id`, `title`, `isbn`, `genre`, `publication_date`, `status`, `mrp`, `total_copies_sold`,
    `total_royalty_earned`, `royalty_paid`, and `royalty_pending`
    """
    
    # verify role
    if user["role"]!="AUTHOR":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid role."
        )

    # get author's books

    books=get_books_by_author(user["user_id"], published_only, db)

    return {
        "books":books
    }

@app.post('/tickets', status_code=status.HTTP_200_OK)
def postTicket(ticket:AuthorTicketCreate, background_tasks:BackgroundTasks, user=Depends(verify_user),db=Depends(get_db)):
    """
    - Creates a ticket for the author
    - Raises `HTTP_403_FORBIDDEN` when role is not author
    """
    # verify role
    if user["role"]!="AUTHOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid role."
        )

    try:
        new_ticket=addTicket(user["user_id"],ticket, db)
        
        background_tasks.add_task(classify_and_update_ticket, new_ticket.ticket_id, new_ticket.subject, new_ticket.description)
    except HTTPException:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book does not exist."
        )

    return {
        "message":"Ticket raised successfully."
    }

@app.get('/tickets', status_code=status.HTTP_200_OK)
def getTickets(user=Depends(verify_user),db=Depends(get_db)):
    """
    - Returns all ticket details for tickets created by the author
    - Raises `HTTP_404_NOT_FOUND` when role is not author
    """
    # verify role
    if user["role"]!="AUTHOR":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No tickets found."
        )

    user_id=user["user_id"]

    tickets=getAuthorTicketDetails(user_id, db)

    return {
        "tickets":tickets
    }

@app.get('/tickets/{ticket_id}', status_code=status.HTTP_200_OK)
def getTicket(ticket_id:str, user=Depends(verify_user),db=Depends(get_db)):
    """
    - Returns ticket details for ticket_id if created by author
    - Raises `HTTP_404_NOT_FOUND` when role is not author
    - Raises `HTTP_404_NOT_FOUND` when ticket_id does not belong to author_id
    """
    # verify role
    if user["role"]!="AUTHOR":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No tickets found."
        )

    user_id=user["user_id"]

    ticket=getAuthorSingleTicketDetails(user_id, ticket_id, db)

    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No tickets found."
        )

    return {
        "ticket":ticket
    }

@app.post("/tickets/{ticket_id}/message", status_code=status.HTTP_201_CREATED)
def sendAuthorMessage(ticket_id: str,message: str = Body(...),user=Depends(verify_user),db=Depends(get_db)):
    # 1. Verify role
    if user["role"] != "AUTHOR":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid role."
        )

    # 2. Validate message
    message = message.strip()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Message cannot be blank."
        )

    # 3. Save message
    saveAuthorMessage(user["user_id"],ticket_id,message,db)

    return {
        "message": "Message sent successfully."
    }

@app.get('/admin/tickets', status_code=status.HTTP_200_OK)
def getAdminTickets(user=Depends(verify_user),db=Depends(get_db)):
    """
    - Returns all tickets
    - Raises `HTTP_404_NOT_FOUND` when role is not admin
    """
    # verify role
    if user["role"]!="ADMIN":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No tickets found."
        )

    user_id=user["user_id"]

    tickets=getAdminTicketDetails(user_id, db)

    return {
        "tickets":tickets
    }

@app.get('/admin/tickets/{ticket_id}', status_code=status.HTTP_200_OK)
def getAdminTicket(ticket_id:str, user=Depends(verify_user),db=Depends(get_db)):
    """
    - Returns ticket details for given ticket_id
    - Raises `HTTP_404_NOT_FOUND` when role is not admin
    """
    # verify role
    if user["role"]!="ADMIN":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket does not exist."
        )

    ticket=getTicketDetails(ticket_id, db)

    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found."
        )

    return {
        "ticket":ticket
    }

@app.post('/admin/tickets/{ticket_id}', status_code=status.HTTP_200_OK)
def assignTicket(ticket_id:str, user=Depends(verify_user),db=Depends(get_db)):
    """
    - Assigns given ticket to authenticated admin
    - Raises `HTTP_404_NOT_FOUND` when role is not admin
    - Raises `HTTP_404_NOT_FOUND` when ticket does not exist
    - Raises `HTTP_409_CONFLICT` when ticket already assigned to another admin
    """
    # verify role
    if user["role"]!="ADMIN":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid role"
        )
    
    user_id=user["user_id"]

    assigned_ticket_id=assignTicketToAdmin(ticket_id, user_id, db)

    if assigned_ticket_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket does not exist."
        )
    
    return {
        "ticket_id":assigned_ticket_id,
        "message":"Ticket assigned successfully."
    }

@app.patch('/admin/tickets/{ticket_id}', status_code=status.HTTP_200_OK)
def updateTicket(ticket_id:str, ticket_update:TicketUpdate, user=Depends(verify_user),db=Depends(get_db)):
    """
    - Updates given ticket details
    - Adds the internal_note provided (if any)
    - Raises `HTTP_404_NOT_FOUND` when role is not admin
    - Raises `HTTP_404_NOT_FOUND` when ticket does not exist
    - Raises `HTTP_422_UNPROCESSABLE_CONTENT` for invalid inputs
    - Raises `HTTP_403_FORBIDDEN` when assigned_admin_id is not null , and admin_id is not assigned_admin_id
    """
    # verify role
    if user["role"]!="ADMIN":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid role"
        )
    
    user_id=user["user_id"]

    #TODO: implement update ticket, and 404 exception handling
    changes=ticket_update.model_dump(exclude_unset=True)

    for field in ("category", "priority", "status"):
        if field in changes and changes[field] is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=f"{field} cannot be null."
            )

    internal_note=changes.pop("internal_note", None)

    if not changes and internal_note is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Provide at least one update."
        )

    updateTicketDetails(user_id, ticket_id, changes, db)
    
    
    return {
        "message":"Ticket updated successfully."
    }

@app.post('/admin/tickets/{ticket_id}/internal_note', status_code=status.HTTP_201_CREATED)
def addInternalNote(ticket_id:str, new_internal_note:str=Body(...), user=Depends(verify_user),db=Depends(get_db)):
    """
    - Adds the internal_note provided
    - Raises `HTTP_404_NOT_FOUND` when role is not admin
    - Raises `HTTP_404_NOT_FOUND` when ticket does not exist
    - Raises `HTTP_422_UNPROCESSABLE_CONTENT` for invalid inputs
    - Raises `HTTP_403_FORBIDDEN` when assigned_admin_id is not null , and admin_id is not assigned_admin_id
    """
    # verify role
    if user["role"]!="ADMIN":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid role"
        )
    
    user_id=user["user_id"]

    new_internal_note=new_internal_note.strip()

    if not new_internal_note:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Internal note cannot be blank."
        )
    
    saveInternalNote(user_id, ticket_id, new_internal_note, db)
    
    
    return {
        "message":"Successfully added internal note."
    }

@app.post('/admin/tickets/{ticket_id}/message', status_code=status.HTTP_201_CREATED)
def sendMessageToAuthor(ticket_id:str, message:str=Body(...), user=Depends(verify_user),db=Depends(get_db)):
    """
    - Adds the message provided
    - Raises `HTTP_404_NOT_FOUND` when role is not admin
    - Raises `HTTP_404_NOT_FOUND` when ticket does not exist
    - Raises `HTTP_422_UNPROCESSABLE_CONTENT` for invalid inputs
    - Raises `HTTP_403_FORBIDDEN` when assigned_admin_id is not null , and admin_id is not assigned_admin_id
    """
    # verify role
    if user["role"]!="ADMIN":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid role"
        )
    
    user_id=user["user_id"]

    message=message.strip()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Message cannot be blank."
        )
    
    saveMessage(user_id, ticket_id, message, db)
    
    
    return {
        "message":"Successfully added message."
    }

@app.post("/admin/tickets/{ticket_id}/generate-reply")
def generateAdminReply(ticket_id: str,user=Depends(verify_user),db = Depends(get_db)):
    if user["role"] != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can generate replies.",
        )

    # Fetch the ticket.
    ticket = db.get(Ticket, ticket_id)

    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found.",
        )

    # Fetch book context when this ticket concerns a book.
    book_details = None


    if ticket.book_id is not None:
        book_details = getBookDetails(ticket.book_id, db)

        if book_details is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="The associated book could not be retrieved.",
            )

    # Fetch only recent public messages.
    recent_messages = get_recent_public_messages(ticket_id, db)

    conversation_history = [
        {
            "sender_type": message.sender_type.value,
            "body": message.body,
            "created_at": message.created_at.isoformat(),
        }
        for message in recent_messages
    ]

    try:
        draft = generate_ticket_reply(
            subject=ticket.subject,
            description=ticket.description,
            ticket_status=ticket.status.value,
            ticket_created_at=ticket.created_at.isoformat(),
            conversation_history=conversation_history,
            book_details=book_details,
        )

        return {
            "draft":draft
        }

    except Exception as e:
        #TODO: add logging
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI reply generation is temporarily unavailable. Please write a reply manually.",
        )

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

def get_books_by_author(author_id:str,published_only:bool, db)->list[dict]:
    """
    - DB helper that returns a list of books by the author
    - Returns `title`, `isbn`, `genre`, `publication_date`, `status`, `mrp`,
    `total_copies_sold`, `total_royalty_earned`, `royalty_paid`, and `royalty_pending`

    """

    if published_only:
        rows=db.execute(select(
            Book.book_id,
            Book.title, 
            Book.isbn, 
            Book.genre, 
            Book.publication_date,
            Book.status, 
            Book.mrp, 
            Book.total_copies_sold, 
            Book.total_royalty_earned, 
            Book.royalty_paid, 
            Book.royalty_pending).
            where(
                Book.author_id==author_id,
                Book.status==BookStatus.PUBLISHED_AND_LIVE
            ).
            order_by(Book.publication_date.desc())
        )
    else:
        rows=db.execute(select(
            Book.book_id,
            Book.title, 
            Book.isbn, 
            Book.genre, 
            Book.publication_date,
            Book.status, 
            Book.mrp, 
            Book.total_copies_sold, 
            Book.total_royalty_earned, 
            Book.royalty_paid, 
            Book.royalty_pending).
            where(
                Book.author_id==author_id
            ).
            order_by(Book.publication_date.desc())
        )

    books=[]

    for row in rows:
        books.append({
            "book_id":row.book_id,
            "title":row.title,
            "isbn": row.isbn,
            "genre": row.genre,
            "publication_date": row.publication_date,
            "status": row.status,
            "mrp": row.mrp,
            "total_copies_sold": row.total_copies_sold,
            "total_royalty_earned": row.total_royalty_earned,
            "royalty_paid": row.royalty_paid,
            "royalty_pending": row.royalty_pending,
        })

    return books

def addTicket(user_id:str,ticket:AuthorTicketCreate, db):
    """
    - Db helper to add a ticket to tickets
    - Checks if book actually belongs to author_id or not, if not returns `HTTP_404_NOT_FOUND`
    """

    if ticket.book_id is not None:
        book_id=db.execute(
            select(Book.book_id).
            where(Book.author_id==user_id, Book.book_id==ticket.book_id)
        ).scalar_one_or_none()

        if book_id is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Book does not exist."
            )

    try:
        new_ticket=Ticket(
            ticket_id=generate_ticket_id(db),
            author_id=user_id,
            book_id=ticket.book_id,
            status=TicketStatus.OPEN,
            subject= ticket.subject,
            description=ticket.description,
            category=None,
            priority=None,
            assigned_admin_id=None
        )

        db.add(new_ticket)

        db.commit()
        db.refresh(new_ticket)

        return new_ticket

    except Exception:
        db.rollback()
        raise

def getAuthorTicketDetails(user_id:str, db):
    """
    Db helper to fetch tickets created by the user_id and ticket responses (if any)
    """

    rows=db.execute(select(Ticket.ticket_id,
    Ticket.book_id,
    Ticket.status,
    Ticket.subject,
    Ticket.description,
    Ticket.created_at,
    TicketMessage.ticket_message_id,
    TicketMessage.body,
    TicketMessage.created_at.label("message_created_at"),
    TicketMessage.sender_type
    ).outerjoin(
        TicketMessage,
        (TicketMessage.ticket_id==Ticket.ticket_id)
         & (TicketMessage.visibility==Visibility.PUBLIC),
        )
    .where(
        Ticket.author_id==user_id
    ).order_by(
        Ticket.created_at.desc()
    )).mappings().all()

    tickets={}

    for row in rows:
        ticket_id=row["ticket_id"]
        ticket_message_id=row["ticket_message_id"]

        if ticket_id not in tickets:
            tickets[ticket_id]=({
                "ticket_id": row["ticket_id"],
                "book_id": row["book_id"],
                "status": row["status"],
                "subject": row["subject"],
                "description": row["description"],
                "created_at": row["created_at"],   
                "responses":[]
            }
            )
        if ticket_message_id is not None:
            tickets[ticket_id]["responses"].append({
                "ticket_message_id": row["ticket_message_id"],
                "sender_type": row["sender_type"].value,
                "body": row["body"],
                "created_at": row["message_created_at"],
            })

    return list(tickets.values())

def getAdminTicketDetails(user_id:str, db):
    """
    Db helper to fetch all tickets
    """

    rows=db.execute(select(
        Ticket.ticket_id,
        Ticket.author_id,
        Ticket.book_id,
        Ticket.status,
        Ticket.subject,
        Ticket.description,
        Ticket.category,
        Ticket.priority,
        Ticket.assigned_admin_id,
        Ticket.created_at,
        TicketMessage.ticket_message_id,
        TicketMessage.ticket_id,
        TicketMessage.sender_author_id,
        TicketMessage.sender_admin_id,
        TicketMessage.sender_type,
        TicketMessage.visibility,
        TicketMessage.body,
        TicketMessage.created_at.label("message_created_at")
        ).outerjoin(
            TicketMessage,
            (TicketMessage.ticket_id==Ticket.ticket_id)
            )
        .order_by(
            Ticket.created_at.desc()
        )).mappings().all()
    
    tickets={}
    
    for row in rows:
        ticket_id=row["ticket_id"]
        ticket_message_id=row["ticket_message_id"]

        if ticket_id not in tickets:
            tickets[ticket_id]=({
                "ticket_id": row["ticket_id"],
                "author_id": row["author_id"],
                "book_id": row["book_id"],
                "status": row["status"],
                "subject": row["subject"],
                "description": row["description"],
                "category": row["category"],
                "priority": row["priority"],
                "assigned_admin_id": row["assigned_admin_id"],
                "created_at": row["created_at"],
                "responses":[]
            }
            )
        if ticket_message_id is not None:
            tickets[ticket_id]["responses"].append({
                "ticket_message_id": row["ticket_message_id"],
                "ticket_id": row["ticket_id"],
                "sender_author_id": row["sender_author_id"],
                "sender_admin_id": row["sender_admin_id"],
                "sender_type": row["sender_type"],
                "visibility": row["visibility"],
                "body": row["body"],
                "created_at": row["message_created_at"],
            })

    return list(tickets.values())

def classify_ticket(subject:str, description:str):
    """
    Returns a category and priority for the given ticket
    """

    client = Groq(api_key=GROQ_AUTHOR_SUPPORT_PORTAL_API)

    completion=client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role":"system",
                "content":(
                    "You classify BookLeaf support tickets. "
                    "Return the classification using the provided schema."
                ),
            },
            {
                "role":"user",
                "content":f"""
                    Classify this BookLeaf Publishing support ticket.
                    
                        Use the following knowledge base as factual context:
                        {knowledge_base}
                    
                        Ticket subject:
                        {subject}
                    
                        Ticket description:
                        {description}
                    """,
            }
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "ticket_classification",
                "strict": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "category": {
                            "type": "string",
                            "enum": categories,
                        },
                        "priority": {
                            "type": "string",
                            "enum": priorities,
                        },
                    },
                    "required": ["category", "priority"],
                    "additionalProperties": False,
                },
            },
        },
    )

    content = completion.choices[0].message.content

    if not content:
        raise ValueError("Groq returned an empty classification.")

    result = json.loads(content)

    return result

def update_ticket_classification(ticket_id:str, result:dict):
    """
    DB helper to update ticket category and priority
    """

    with SessionLocal() as db:
        try:
            ticket=db.get(Ticket, ticket_id)

            if ticket is None:
                return
            
            ticket.category=TicketCategory(result["category"])
            ticket.priority=TicketPriority(result["priority"])

            db.commit()

        except Exception:
            db.rollback()
            #TODO: add logging later
            raise

def classify_and_update_ticket(ticket_id:str, subject:str, description:str):
    try:
        result = classify_ticket(subject, description)
        update_ticket_classification(ticket_id, result)
    except Exception:
        #TODO: add logging
        pass

def getTicketDetails(ticket_id:str, db):
    """
    Db helper to fetch ticket details for given ticket_id
    """

    rows=db.execute(select(
        Ticket.ticket_id,
        Ticket.author_id,
        Ticket.book_id,
        Ticket.status,
        Ticket.subject,
        Ticket.description,
        Ticket.category,
        Ticket.priority,
        Ticket.assigned_admin_id,
        Ticket.created_at,
        TicketMessage.ticket_message_id,
        TicketMessage.ticket_id,
        TicketMessage.sender_author_id,
        TicketMessage.sender_admin_id,
        TicketMessage.sender_type,
        TicketMessage.visibility,
        TicketMessage.body,
        TicketMessage.created_at.label("message_created_at")
        ).outerjoin(
            TicketMessage,
            (TicketMessage.ticket_id==Ticket.ticket_id)
            ).where(
                Ticket.ticket_id==ticket_id
            )
        .order_by(
            TicketMessage.created_at.desc()
        )).mappings().all()
    
    
    if not rows:
        return None

    ticket = {
        "ticket_id": rows[0]["ticket_id"],
        "author_id": rows[0]["author_id"],
        "book_id": rows[0]["book_id"],
        "status": rows[0]["status"],
        "subject": rows[0]["subject"],
        "description": rows[0]["description"],
        "category": rows[0]["category"],
        "priority": rows[0]["priority"],
        "assigned_admin_id": rows[0]["assigned_admin_id"],
        "created_at": rows[0]["created_at"],
        "responses": [],
    }

    for row in rows:
        if row["ticket_message_id"] is not None:
            ticket["responses"].append({
                "ticket_message_id": row["ticket_message_id"],
                "sender_author_id": row["sender_author_id"],
                "sender_admin_id": row["sender_admin_id"],
                "sender_type": row["sender_type"],
                "visibility": row["visibility"],
                "body": row["body"],
                "created_at": row["message_created_at"],
            })

    return ticket

def assignTicketToAdmin(ticket_id:str, user_id:str, db):
    """
    - If ticket does not exist, it returns None
    - If ticket already assigned to current admin id, it returns ticket_id
    - If ticket already assigned to another admin, it raises HTTPException (409)
    - DB helper to assign ticket to given admin id
    - Returns ticket_id when ticket successfully assigned.
    """

    ticket_found=db.execute(
        select(Ticket.ticket_id, Ticket.assigned_admin_id)
        .where(
            Ticket.ticket_id == ticket_id
        )
    ).one_or_none()

    if ticket_found is None:
        return None

    current_assigned_admin_id=ticket_found.assigned_admin_id

    if current_assigned_admin_id==user_id:
        return ticket_id

    result = db.execute(
        update(Ticket)
        .where(
            Ticket.ticket_id == ticket_id,
            Ticket.assigned_admin_id.is_(None),
        )
        .values(assigned_admin_id=user_id)
        .returning(Ticket.ticket_id)
    ).scalar_one_or_none()

    if result is None:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ticket already assigned to another admin."
        )

    db.commit()

    return result

def updateTicketDetails(user_id:str, ticket_id:str, changes:dict, db):
    """
    DB helper to update provided ticket details
    """

    ticket=db.get(Ticket, ticket_id)

    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found.",
        )

    if ticket.assigned_admin_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please assign ticket before sending message."
        )
    
    if ticket.assigned_admin_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This ticket is assigned to another admin."
        )
    try:
        if "category" in changes:
            ticket.category=changes["category"]

        if "priority" in changes:
            ticket.priority=changes["priority"]

        if "status" in changes:
            ticket.status = changes["status"]

        db.commit()
        db.refresh(ticket)

        return ticket

    except Exception:
        db.rollback()
        raise

def saveInternalNote(user_id: str, ticket_id: str, new_internal_note:str, db):
    """
    Db helper to add a new internal note
    """

    ticket = db.get(Ticket, ticket_id)

    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found."
        )

    if ticket.assigned_admin_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please assign ticket before sending message."
        )
    
    if ticket.assigned_admin_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This ticket is assigned to another admin."
        )

    internal_note = TicketMessage(
        ticket_message_id=generate_ticket_message_id(db),
        ticket_id=ticket_id,
        sender_author_id=None,
        sender_admin_id=user_id,
        sender_type=SenderType.ADMIN,
        visibility=Visibility.PRIVATE,
        body=new_internal_note
    )

    try:
        db.add(internal_note)
        db.commit()
        db.refresh(internal_note)

        return internal_note

    except Exception:
        db.rollback()
        raise

def saveMessage(user_id:str, ticket_id:str, message:str, db):
    """
    DB helper to save a message in ticket_messages
    """

    ticket = db.get(Ticket, ticket_id)

    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found."
        )

    if ticket.assigned_admin_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please assign ticket before sending message."
        )

    if ticket.assigned_admin_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This ticket is assigned to another admin."
        )

    response = TicketMessage(
        ticket_message_id=generate_ticket_message_id(db),
        ticket_id=ticket_id,
        sender_author_id=None,
        sender_admin_id=user_id,
        sender_type=SenderType.ADMIN,
        visibility=Visibility.PUBLIC,
        body=message
    )

    try:
        db.add(response)
        db.commit()
        db.refresh(response)

        return response

    except Exception:
        db.rollback()
        raise

def getAuthorSingleTicketDetails(user_id:str, ticket_id:str, db):
    """
    Db helper to fetch ticket created by the user_id and ticket responses (if any)
    - Returns None when ticket does not exist
    """

    rows=db.execute(select(Ticket.ticket_id,
    Ticket.book_id,
    Ticket.status,
    Ticket.subject,
    Ticket.description,
    Ticket.created_at,
    TicketMessage.ticket_message_id,
    TicketMessage.body,
    TicketMessage.created_at.label("message_created_at"),
    TicketMessage.sender_type
    ).outerjoin(
        TicketMessage,
        (TicketMessage.ticket_id==Ticket.ticket_id)
         & (TicketMessage.visibility==Visibility.PUBLIC),
        )
    .where(
        Ticket.author_id==user_id,
        Ticket.ticket_id==ticket_id
    ).order_by(
        TicketMessage.created_at.desc()
    )).mappings().all()

    if not rows:
        return None

    ticket = {
        "ticket_id": rows[0]["ticket_id"],
        "book_id": rows[0]["book_id"],
        "status": rows[0]["status"],
        "subject": rows[0]["subject"],
        "description": rows[0]["description"],
        "created_at": rows[0]["created_at"],
        "responses": [],
    }

    for row in rows:
        if row["ticket_message_id"] is not None:
            ticket["responses"].append({
                "ticket_message_id": row["ticket_message_id"],
                "sender_type": row["sender_type"],
                "visibility": Visibility.PUBLIC,
                "body": row["body"],
                "created_at": row["message_created_at"],
            })

    return ticket

def saveAuthorMessage(user_id: str,ticket_id: str,message: str,db):
    # 1. Verify that the ticket belongs to this author
    ticket = db.get(Ticket, ticket_id)

    if ticket is None or ticket.author_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found."
        )

    # 2. Create the public author message
    author_message = TicketMessage(
        ticket_message_id=generate_ticket_message_id(db),
        ticket_id=ticket_id,
        sender_author_id=user_id,
        sender_admin_id=None,
        sender_type=SenderType.AUTHOR,
        visibility=Visibility.PUBLIC,
        body=message
    )

    # 3. Save it
    try:
        db.add(author_message)
        db.commit()
        db.refresh(author_message)

        return author_message

    except Exception:
        db.rollback()
        raise

def getBookDetails(book_id: str, db) -> dict | None:
    """
    Fetch book details
    """

    book = db.get(Book, book_id)

    if book is None:
        return None

    return {
        "book_id": book.book_id,
        "title": book.title,
        "isbn": book.isbn,
        "genre": book.genre,
        "publication_date": (
            book.publication_date.isoformat()
            if book.publication_date
            else "Not published yet."
        ),
        "status": book.status.value,
        "mrp": book.mrp,
        "author_royalty_per_copy": book.author_royalty_per_copy,
        "total_copies_sold": book.total_copies_sold,
        "total_royalty_earned": book.total_royalty_earned,
        "royalty_paid": book.royalty_paid,
        "royalty_pending": book.royalty_pending,
        "last_royalty_payout_date": (
            book.last_royalty_payout_date.isoformat()
            if book.last_royalty_payout_date
            else None
        ),
        "print_partner": book.print_partner,
        "available_on": book.available_on,
    }

def get_recent_public_messages(ticket_id: str, db):
    """
    Db helper to get 3 latest PUBLIC messages from ticket_messages
    """
    messages = db.query(TicketMessage).filter(
        TicketMessage.ticket_id == ticket_id,
        TicketMessage.visibility == Visibility.PUBLIC,
        ).order_by(
        TicketMessage.created_at.desc(),
        TicketMessage.ticket_message_id.desc(),
        ).limit(3).all()
    
    messages.reverse()
    return messages

def generate_ticket_reply(subject:str, description:str, ticket_created_at: str,ticket_status:TicketStatus, conversation_history:list, book_details):
    """
    Returns a AI generated ticket reply for given ticket_id
    """

    client = Groq(api_key=GROQ_AUTHOR_SUPPORT_PORTAL_API)

    ticket_history = "\n".join(
    (
        f"Timestamp: {message['created_at']}\n"
        f"Sender: {message['sender_type']}\n"
        f"Message: {message['body']}"
    )
    for message in conversation_history
)

    book_context = ("Associated Book Details:\n" + json.dumps(book_details, ensure_ascii=False, indent=2, default=str) if book_details is not None else "Book has not been published yet")
    
    completion=client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role":"system",
                "content":(
                    """
                    You are BookLeaf Publishing's Author Support Assistant.
                    Your role is to help BookLeaf administrators respond to author
                    support tickets by generating accurate, empathetic, professional,
                    and actionable reply drafts.

                    You assist administrators; you do not communicate with authors
                    directly or perform support operations yourself. Every response
                    you generate is a draft that an administrator must review and
                    approve before sending.

                    Use the provided knowledge base, ticket details, associated book
                    information, and recent ticket history to understand the
                    author's concern and prepare an appropriate response.

                    Follow BookLeaf's policies and communication guidelines.
                    Never invent facts, claim that an action has been completed
                    without confirmation, or promise unsupported outcomes or timelines.
                    """
                ),
            },
            {
                "role":"user",
                "content":f"""

                        Use the following knowledge base as factual context:
                        {knowledge_base}

                        Use the following examples to frame the responses
                        {bookleaf_response_examples}

                        Today's date and time:
                        {datetime.now(timezone.utc).isoformat()}

                        Ticket created at:
                        {ticket_created_at}
                    
                        Ticket subject:
                        {subject}
                    
                        Ticket description:
                        {description}

                        Ticket status:
                        {ticket_status}

                        {book_context}

                        Recent Ticket History:
                        {ticket_history}
                    """,
            }
        ],
        response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "bookleaf_support_reply",
                        "strict": True,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "acknowledgement": {
                                    "type": "string"
                                },
                                "response": {
                                    "type": "string"
                                },
                                "closing": {
                                    "type": "string"
                                }
                            },
                            "required": [
                                "acknowledgement",
                                "response",
                                "closing"
                            ],
                            "additionalProperties": False
                        }
                    }
                }
    )

    reply = completion.choices[0].message.content

    if not reply or not reply.strip():
        raise ValueError("Groq returned an empty reply.")

    result = json.loads(reply)

    final_response_draft = "\n\n".join(
        strip_markdown(result[field]).strip()
        for field in ("acknowledgement", "response", "closing")
        if result.get(field)
    )

    return final_response_draft