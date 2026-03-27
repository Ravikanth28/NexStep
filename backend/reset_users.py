"""
Reset / seed default users with known credentials.
Run once: python reset_users.py
"""
from database import SessionLocal, engine
from models import Base, User
from auth import hash_password

# Ensure tables exist
Base.metadata.create_all(bind=engine)

USERS = [
    {"username": "teacher1",  "email": "teacher1@example.com",  "password": "teacher123", "role": "teacher"},
    {"username": "student1",  "email": "student1@example.com",  "password": "student123", "role": "student"},
    {"username": "newstudent","email": "newstudent@test.com",   "password": "password123","role": "student"},
    {"username": "student_user","email":"student_user@test.com","password": "password123","role": "student"},
]

db = SessionLocal()
try:
    for u in USERS:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if existing:
            # Update password hash to the known value
            existing.password_hash = hash_password(u["password"])
            existing.role = u["role"]
            existing.username = u["username"]
            print(f"Updated : {u['email']} (role={u['role']})")
        else:
            new_user = User(
                username=u["username"],
                email=u["email"],
                password_hash=hash_password(u["password"]),
                role=u["role"],
            )
            db.add(new_user)
            print(f"Created : {u['email']} (role={u['role']})")

    db.commit()
    print("\nDone! Credentials:")
    for u in USERS:
        print(f"  {u['role']:8s}  {u['email']}  /  {u['password']}")
finally:
    db.close()
