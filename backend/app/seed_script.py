
import json
import os
from datetime import date
from pathlib import Path

from argon2 import PasswordHasher

from app.database import SessionLocal
from app.models import Author, Book, BookStatus, Admin


BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "bookleaf_sample_data.json"

password_hasher = PasswordHasher()

def convert_status_to_BookStatus(status:str)->BookStatus:
    match status:
        case "Manuscript Received":
            return BookStatus.MANUSCRIPT_RECEIVED
        case "Editing":
            return BookStatus.EDITING
        case "In Production - Cover Design":
            return BookStatus.COVER_DESIGN
        case "In Production - Typesetting":
            return BookStatus.TYPESETTING
        case "Proofreading":
            return BookStatus.PROOFREADING
        case "ISBN Assignment":
            return BookStatus.ISBN_ASSIGNMENT
        case "Printing":
            return BookStatus.PRINTING
        case "Distribution Setup":
            return BookStatus.DISTRIBUTION_SETUP
        case "Published & Live":
            return BookStatus.PUBLISHED_AND_LIVE
        case _:
            raise ValueError(f"Unknown book status: {status}")

def seed_authors():
    demo_password = "password"

    with DATA_FILE.open("r", encoding="utf-8") as file:
        data = json.load(file)

    authors = data["authors"]
    inserted = 0

    with SessionLocal() as db:
        with db.begin():
            for item in authors:
                author_id = item["author_id"]
                email = item["email"]
                password_hash = password_hasher.hash(demo_password)

                author = Author(
                    author_id=author_id,
                    name=item["name"],
                    email=email,
                    phone=item.get("phone"),
                    city=item.get("city"),
                    joined_date=date.fromisoformat(
                        item["joined_date"]
                    ),
                    password_hash=password_hash,
                )

                db.add(author)
                inserted += 1

        print("Author seeding completed successfully!")
        print(f"Authors inserted: {inserted}")

def seed_books():    
    with DATA_FILE.open("r", encoding="utf-8") as file:
        data = json.load(file)

    authors = data["authors"]

    inserted = 0

    with SessionLocal() as db:
        with db.begin():
            for author in authors:
                books=author["books"]
                author_id=author["author_id"]
                for item in books:
                    book = Book(
                        book_id=item["book_id"],
                        author_id=author_id,
                        title=item["title"],
                        isbn=item["isbn"],
                        genre=item["genre"],
                        publication_date=date.fromisoformat(item["publication_date"]) if item["publication_date"] is not None else None,
                        status=convert_status_to_BookStatus(item["status"]),
                        mrp=item["mrp"],
                        author_royalty_per_copy=item["author_royalty_per_copy"],
                        total_copies_sold=item["total_copies_sold"],
                        total_royalty_earned=item["total_royalty_earned"],
                        royalty_paid=item["royalty_paid"],
                        royalty_pending=item["royalty_pending"],
                        last_royalty_payout_date=date.fromisoformat(item["last_royalty_payout_date"]) if item["last_royalty_payout_date"] is not None else None,
                        print_partner=item["print_partner"],
                        available_on=item["available_on"],
                    )

                    db.add(book)
                    inserted += 1

        print("Book seeding completed successfully!")
        print(f"Books inserted: {inserted}")

def seed_admin():
    demo_password="password"

    admins=[{
        "admin_id":"AD001",
        "email":"admin@email.com"
    }]

    inserted=0

    with SessionLocal() as db:
        with db.begin():
            for item in admins:
                admin_id = item["admin_id"]
                email = item["email"]
                password_hash = password_hasher.hash(demo_password)

                admin = Admin(
                    admin_id=admin_id,
                    email=email,
                    password_hash=password_hash,
                )

                db.add(admin)
                inserted += 1

        print("Admin seeding completed successfully!")
        print(f"Admins inserted: {inserted}")

if __name__ == "__main__":
    seed_authors()
    seed_books()
    seed_admin()
