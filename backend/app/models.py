from app.database import Base
from sqlalchemy import String, Date, func, Integer, ForeignKey, JSON, Text, DateTime, Enum as SQLAlchemyEnum, CheckConstraint, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from datetime import date, datetime
from enum import Enum

class Author(Base):
    """
    - Class for Author details
    - Stores `author_id`, `name`, `email`, `phone`, `city`, `joined_date`, `password_hash`

    """
    __tablename__="authors"

    author_id:Mapped[str]=mapped_column(String(20), primary_key=True)
    name:Mapped[str]=mapped_column(String(255),nullable=False)
    email:Mapped[str]=mapped_column(String(255),unique=True, nullable=False)
    phone:Mapped[str|None]=mapped_column(String(30))
    city:Mapped[str|None]=mapped_column(String(100))
    joined_date:Mapped[date]=mapped_column(Date, server_default=func.current_date(),nullable=False)
    password_hash:Mapped[str]=mapped_column(String(255), nullable=False)

class Admin(Base):
    """
    - Class for Admin details
    - Stores `admin_id`, `email`, and `password_hash`
    """
    __tablename__="admins"

    admin_id:Mapped[str]=mapped_column(String(20), primary_key=True)
    email:Mapped[str]=mapped_column(String(255), unique=True, nullable=False)
    password_hash:Mapped[str]=mapped_column(String(255), nullable=False)

class BookStatus(str, Enum):
    """
    Enum for Book status
    """
    MANUSCRIPT_RECEIVED = "Manuscript Received"
    EDITING = "Editing"
    COVER_DESIGN = "Cover Design"
    TYPESETTING = "Typesetting"
    PROOFREADING = "Proofreading"
    ISBN_ASSIGNMENT = "ISBN Assignment"
    PRINTING = "Printing"
    DISTRIBUTION_SETUP = "Distribution Setup"
    PUBLISHED_AND_LIVE = "Published & Live"

class Book(Base):
    """
    - Class for Book details
    """
    __tablename__="books"

    book_id:Mapped[str]=mapped_column(String(20), primary_key=True)
    author_id:Mapped[str]=mapped_column(String(20), ForeignKey("authors.author_id"), nullable=False)
    title:Mapped[str]=mapped_column(String(500), nullable=False)
    isbn:Mapped[str]=mapped_column(String(20), nullable=False, unique=True)
    genre:Mapped[str]=mapped_column(String(150), nullable=False)
    publication_date:Mapped[date | None]=mapped_column(Date, nullable=True)
    status:Mapped[BookStatus]=mapped_column(SQLAlchemyEnum(BookStatus, name="status"), nullable=False)
    mrp:Mapped[int | None]=mapped_column(Integer, nullable=True)
    author_royalty_per_copy:Mapped[int | None]=mapped_column(Integer, nullable=True)
    total_copies_sold:Mapped[int]=mapped_column(Integer, nullable=False)
    total_royalty_earned:Mapped[int]=mapped_column(Integer, nullable=False)
    royalty_paid:Mapped[int]=mapped_column(Integer, nullable=False)
    royalty_pending:Mapped[int]=mapped_column(Integer, nullable=False)
    last_royalty_payout_date:Mapped[date | None]=mapped_column(Date, nullable=True)
    print_partner:Mapped[str | None]=mapped_column(String(100), nullable=True)
    available_on:Mapped[list]=mapped_column(JSON, nullable=False, default=list)

class TicketStatus(str, Enum):
    """
    Enum for ticket status
    """
    OPEN="Open"
    IN_PROGRESS="In Progress"
    RESOLVED="Resolved"
    CLOSED="Closed"

class TicketCategory(str, Enum):
    """
    Enum for ticket category
    """
    ROYALTY_PAYMENTS="Royalty & Payments"
    ISBN_METADATA="ISBN & Metadata Issues"
    PRINTING_QUALITY="Printing & Quality"
    DISTRIBUTION_AVAILABILITY="Distribution & Availability"
    BOOK_STATUS_PRODUCTION_UPDATES="Book Status & Production Updates"
    GENERAL_INQUIRY="General Inquiry"

class TicketPriority(str, Enum):
    """
    Enum for ticket priority
    """
    CRITICAL="Critical"
    HIGH="High"
    MEDIUM="Medium"
    LOW="Low"

class Ticket(Base):
    """
    - Class for tickets
    """
    __tablename__="tickets"

    ticket_id:Mapped[str]=mapped_column(String(20), primary_key=True)
    author_id:Mapped[str]=mapped_column(String(20), ForeignKey("authors.author_id"), nullable=False)
    book_id:Mapped[str | None]=mapped_column(String(20), ForeignKey("books.book_id"), nullable=True)
    status:Mapped[TicketStatus]=mapped_column(SQLAlchemyEnum(TicketStatus, name="ticket_status"), nullable=False)
    subject:Mapped[str]=mapped_column(String(200), nullable=False)
    description:Mapped[str]=mapped_column(Text, nullable=False)
    category:Mapped[TicketCategory | None]=mapped_column(SQLAlchemyEnum(TicketCategory, name="ticket_category"), nullable=True)
    priority:Mapped[TicketPriority | None]=mapped_column(SQLAlchemyEnum(TicketPriority, name="ticket_priority"), nullable=True)
    assigned_admin_id:Mapped[str | None]=mapped_column(String(20), ForeignKey("admins.admin_id"), nullable=True)
    created_at:Mapped[datetime]=mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

class SenderType(str, Enum):
    """
    Enum for sender type
    """
    AUTHOR="Author"
    ADMIN="Admin"

class Visibility(str, Enum):
    """
    - Enum for visibilty of ticket message
    """
    PRIVATE="Private"
    PUBLIC="Public"

class TicketMessage(Base):
    """
    - Class for ticket messages (author replies, admin responses, and admin's internal notes)
    """
    __tablename__="ticket_messages"
    __table_args__=(
        CheckConstraint(
            """
            (sender_type='AUTHOR'
            AND sender_author_id IS NOT NULL
            AND sender_admin_id IS NULL            
            )
            OR
            (
            sender_type='ADMIN'
            AND sender_author_id IS NULL
            AND sender_admin_id IS NOT NULL
            )
            """,
            name="check_ticket_message_sender"
        ),
    )


    ticket_message_id:Mapped[str]=mapped_column(String(20), primary_key=True)
    ticket_id:Mapped[str]=mapped_column(String(20), ForeignKey("tickets.ticket_id"), nullable=False)
    sender_author_id:Mapped[str | None]=mapped_column(String(20), ForeignKey("authors.author_id"), nullable=True)
    sender_admin_id:Mapped[str | None]=mapped_column(String(20), ForeignKey("admins.admin_id"), nullable=True)
    sender_type:Mapped[SenderType]=mapped_column(SQLAlchemyEnum(SenderType, name="sender_type"), nullable=False)
    visibility:Mapped[Visibility]=mapped_column(SQLAlchemyEnum(Visibility, name="visibility"), nullable=False)
    body:Mapped[str]=mapped_column(Text, nullable=False)
    created_at:Mapped[datetime]=mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

