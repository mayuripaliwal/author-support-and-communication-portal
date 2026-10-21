# BookLeaf Author Support & Communication Portal

A full-stack author support portal for enabling authors to manage their books and support tickets while admins handle ticket assignments, classification, communication, and AI-assisted response drafting.

## Demo

- **Live Application:** https://author-support-and-communication-portal-1.onrender.com
- **API Documentation:** https://author-support-and-communication-portal.onrender.com/docs

### 1. Authentication

![Login page](screenshots/login.png)

![Sign up page](screenshots/register.png)


### 2. Author Portal
![Books page](screenshots/books.png)

![Submit Ticket page](screenshots/raise_ticket.png)

![View Tickets page](screenshots/author_tickets.png)

### 3. Admin Portal



## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, Tailwind CSS, React Router |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| ORM and Migrations | SQLAlchemy, Alembic |
| Authentication | JWT, HttpOnly cookies, Argon2 password hashing |
| AI Integration | Groq API |
| Background Processing | FastAPI BackgroundTasks |
| Deployment | Render (frontend, backend, PostgreSQL) |

## API Endpoints

All protected endpoints require authentication through the `access_token` HttpOnly cookie. Author and administrator endpoints enforce role-based access.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Check API health |
| POST | `/signup` | Register a new author account |
| POST | `/login` | Authenticate an author or administrator |
| POST | `/logout` | Clear the authentication cookie |
| GET | `/auth` | Verify the current authenticated session and retrieve the user's role |

### Author Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/author/books` | Retrieve the authenticated author's books; supports the `published_only` query parameter |
| POST | `/tickets` | Create a support ticket and schedule background classification |
| GET | `/tickets` | Retrieve the authenticated author's tickets and public responses |
| GET | `/tickets/{ticket_id}` | Retrieve details of a specific ticket belonging to the author |
| POST | `/tickets/{ticket_id}/message` | Add a author sent message to the author's ticket |

### Administrator Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/tickets` | Retrieve tickets across the portal, including their responses |
| GET | `/admin/tickets/{ticket_id}` | Retrieve detailed information for a specific ticket |
| POST | `/admin/tickets/{ticket_id}` | Assign a ticket to the authenticated administrator |
| PATCH | `/admin/tickets/{ticket_id}` | Update ticket category, priority, or status |
| POST | `/admin/tickets/{ticket_id}/internal_note` | Add a private internal note to a ticket |
| POST | `/admin/tickets/{ticket_id}/message` | Send a public response to the author |
| POST | `/admin/tickets/{ticket_id}/generate-reply` | Generate an AI-assisted response draft using ticket context and the BookLeaf knowledge base |

## Database Schema

The application uses PostgreSQL with five tables: `authors`, `admins`, `books`, `tickets`, and `ticket_messages`. SQLAlchemy models define primary keys, foreign keys, uniqueness, nullability, server defaults, enums, and a check constraint.

### 1. `authors`

Stores author account and profile information.

| Column | Type | Constraints |
|---|---|---|
| `author_id` | `VARCHAR(20)` | Primary key, NOT NULL |
| `name` | `VARCHAR(255)` | NOT NULL |
| `email` | `VARCHAR(255)` | UNIQUE, NOT NULL |
| `phone` | `VARCHAR(30)` | NULL allowed |
| `city` | `VARCHAR(100)` | NULL allowed |
| `joined_date` | `DATE` | NOT NULL, defaults to the current date |
| `password_hash` | `VARCHAR(255)` | NOT NULL |

### 2. `admins`

Stores administrator account credentials.

| Column | Type | Constraints |
|---|---|---|
| `admin_id` | `VARCHAR(20)` | Primary key, NOT NULL |
| `email` | `VARCHAR(255)` | UNIQUE, NOT NULL |
| `password_hash` | `VARCHAR(255)` | NOT NULL |

### 3. `books`

Stores book metadata, production status, sales, and royalty information.

| Column | Type | Constraints |
|---|---|---|
| `book_id` | `VARCHAR(20)` | Primary key, NOT NULL |
| `author_id` | `VARCHAR(20)` | Foreign key → `authors.author_id`, NOT NULL |
| `title` | `VARCHAR(500)` | NOT NULL |
| `isbn` | `VARCHAR(20)` | UNIQUE, NOT NULL |
| `genre` | `VARCHAR(150)` | NOT NULL |
| `publication_date` | `DATE` | NULL allowed |
| `status` | `ENUM` (`BookStatus`) | NOT NULL; restricted to defined book statuses |
| `mrp` | `INTEGER` | NULL allowed |
| `author_royalty_per_copy` | `INTEGER` | NULL allowed |
| `total_copies_sold` | `INTEGER` | NOT NULL |
| `total_royalty_earned` | `INTEGER` | NOT NULL |
| `royalty_paid` | `INTEGER` | NOT NULL |
| `royalty_pending` | `INTEGER` | NOT NULL |
| `last_royalty_payout_date` | `DATE` | NULL allowed |
| `print_partner` | `VARCHAR(100)` | NULL allowed |
| `available_on` | `JSON` | NOT NULL; defaults to an empty list in the ORM |

**Book status values:** Manuscript Received, Editing, Cover Design, Typesetting, Proofreading, ISBN Assignment, Printing, Distribution Setup, Published & Live.

### 4. `tickets`

Stores author support requests and their assignment and workflow details.

| Column | Type | Constraints |
|---|---|---|
| `ticket_id` | `VARCHAR(20)` | Primary key, NOT NULL |
| `author_id` | `VARCHAR(20)` | Foreign key → `authors.author_id`, NOT NULL |
| `book_id` | `VARCHAR(20)` | Foreign key → `books.book_id`, NULL allowed |
| `status` | `ENUM` (`TicketStatus`) | NOT NULL; restricted to defined ticket statuses |
| `subject` | `VARCHAR(200)` | NOT NULL |
| `description` | `TEXT` | NOT NULL |
| `category` | `ENUM` (`TicketCategory`) | NULL allowed; restricted to defined categories |
| `priority` | `ENUM` (`TicketPriority`) | NULL allowed; restricted to defined priorities |
| `assigned_admin_id` | `VARCHAR(20)` | Foreign key → `admins.admin_id`, NULL allowed |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | NOT NULL, defaults to the current timestamp |

**Ticket status values:** Open, In Progress, Resolved, Closed.

**Ticket category values:** Royalty & Payments, ISBN & Metadata Issues, Printing & Quality, Distribution & Availability, Book Status & Production Updates, General Inquiry.

**Ticket priority values:** Critical, High, Medium, Low.

### 5. `ticket_messages`

Stores author replies, public administrator responses, and private internal notes.

| Column | Type | Constraints |
|---|---|---|
| `ticket_message_id` | `VARCHAR(20)` | Primary key, NOT NULL |
| `ticket_id` | `VARCHAR(20)` | Foreign key → `tickets.ticket_id`, NOT NULL |
| `sender_author_id` | `VARCHAR(20)` | Foreign key → `authors.author_id`, NULL allowed |
| `sender_admin_id` | `VARCHAR(20)` | Foreign key → `admins.admin_id`, NULL allowed |
| `sender_type` | `ENUM` (`SenderType`) | NOT NULL; Author or Admin |
| `visibility` | `ENUM` (`Visibility`) | NOT NULL; Private or Public |
| `body` | `TEXT` | NOT NULL |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | NOT NULL, defaults to the current timestamp |

**Check constraint — `check_ticket_message_sender`:**

- If `sender_type = 'AUTHOR'`, `sender_author_id` must be NOT NULL and `sender_admin_id` must be NULL.
- If `sender_type = 'ADMIN'`, `sender_admin_id` must be NOT NULL and `sender_author_id` must be NULL.

This ensures that every message has a sender consistent with its declared sender type.

### Relationships

- One author can have multiple books and support tickets.
- A book belongs to one author and can be associated with multiple support tickets.
- A ticket belongs to one author and can optionally reference a book and an assigned administrator.
- A ticket can have multiple messages, each associated with either an author or an administrator.
- Message visibility distinguishes public conversation messages from private internal notes.
