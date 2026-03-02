"""
Seed script to create initial admin user and sample data.
Run: python -m scripts.seed
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal, Base, engine
from app.models.user import User, UserPermission, RoleEnum
from app.models.student import Student
from app.models.payroll import Employee
from app.core.security import hash_password
from datetime import date
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")


def seed():
    logger.info("🌱 Starting seed...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # ── Users ─────────────────────────────────────────
        users = [
            {"full_name": "Super Admin",         "email": "admin@school.com",      "phone": "9999999999", "password": "Admin@123",      "role": RoleEnum.super_admin},
            {"full_name": "Mr. Principal",       "email": "principal@school.com",  "phone": "9888888888", "password": "Principal@123",  "role": RoleEnum.school_admin},
            {"full_name": "Ms. Priya Teacher",   "email": "teacher@school.com",    "phone": "9777777777", "password": "Teacher@123",    "role": RoleEnum.teacher},
            {"full_name": "Mr. Rajan Accounts",  "email": "accounts@school.com",   "phone": "9666666666", "password": "Accounts@123",   "role": RoleEnum.accountant},
            {"full_name": "Ms. Anitha SubAdmin", "email": "subadmin@school.com",   "phone": "9555555555", "password": "Subadmin@123",   "role": RoleEnum.sub_admin},
            {"full_name": "Mr. Ganesh Teacher",  "email": "teacher2@school.com",   "phone": "9444444444", "password": "Teacher@123",    "role": RoleEnum.teacher},
            {"full_name": "Ms. Kavitha HR",      "email": "hr@school.com",         "phone": "9333333333", "password": "Hr@123456",      "role": RoleEnum.hr_manager},
            {"full_name": "Mr. Raj Librarian",   "email": "library@school.com",    "phone": "9222222222", "password": "Library@123",    "role": RoleEnum.librarian},
        ]
        for u in users:
            if not db.query(User).filter(User.email == u["email"]).first():
                db.add(User(
                    full_name=u["full_name"], email=u["email"], phone=u["phone"],
                    password=hash_password(u["password"]), role=u["role"],
                    is_active=True, is_verified=True,
                ))
                logger.info(f"✅ User created: {u['email']}")
        db.commit()

        # ── 10 Students per Class (Classes 1–10) ──────────
        # Names pool
        first_names_m = ["Arjun", "Karthik", "Ravi", "Vijay", "Suresh", "Ganesh", "Murugan", "Dinesh", "Arun", "Praveen"]
        first_names_f = ["Priya", "Sneha", "Divya", "Kavitha", "Lakshmi", "Meena", "Nithya", "Pooja", "Revathi", "Sunita"]
        last_names    = ["Kumar", "Sharma", "Patel", "Raj", "Singh", "Mehta", "Nair", "Pillai", "Reddy", "Iyer"]

        # DOB years per class (Class 1 = ~2018, Class 10 = ~2009)
        dob_years = {
            "1": 2018, "2": 2017, "3": 2016, "4": 2015, "5": 2014,
            "6": 2013, "7": 2012, "8": 2011, "9": 2010, "10": 2009,
        }

        count = 0
        for cls in range(1, 11):
            cls_str = str(cls)
            for i in range(1, 11):  # 10 students per class
                admission_no = f"{cls:02d}{i:03d}25"  # e.g. 01001-25 for Class1 Student1
                if db.query(Student).filter(Student.admission_no == admission_no).first():
                    continue

                gender = "male" if i <= 5 else "female"
                fname  = first_names_m[i - 1] if gender == "male" else first_names_f[i - 6]
                lname  = last_names[(i - 1) % len(last_names)]
                dob    = date(dob_years[cls_str], (i % 12) + 1, (i % 28) + 1)

                student = Student(
                    admission_no     = admission_no,
                    roll_no          = str(i),
                    first_name       = fname,
                    last_name        = lname,
                    date_of_birth    = dob,
                    gender           = gender,
                    class_name       = cls_str,
                    section          = "A",
                    academic_year    = "2024-25",
                    guardian_name    = f"{last_names[i % len(last_names)]} Parent",
                    guardian_phone   = f"90{cls:02d}00{i:04d}",
                    guardian_email   = f"parent.{fname.lower()}{cls}{i}@email.com",
                    is_active        = True,
                )
                db.add(student)
                count += 1

        db.commit()
        logger.info(f"✅ {count} students created across Classes 1–10 (10 per class)")

        # ── Sample Employees ──────────────────────────────
        sample_employees = [
            {"emp_code": "EMP001", "first_name": "Rajan",   "last_name": "Kumar",  "department": "Science",     "designation": "Sr. Teacher", "salary": 45000, "employee_type": "teaching"},
            {"emp_code": "EMP002", "first_name": "Latha",   "last_name": "Devi",   "department": "Mathematics", "designation": "Teacher",     "salary": 38000, "employee_type": "teaching"},
            {"emp_code": "EMP003", "first_name": "Selvam",  "last_name": "M",      "department": "Admin",       "designation": "Office Staff","salary": 25000, "employee_type": "admin"},
            {"emp_code": "EMP004", "first_name": "Kavitha", "last_name": "S",      "department": "English",     "designation": "HoD",         "salary": 55000, "employee_type": "teaching"},
        ]
        for e_data in sample_employees:
            if not db.query(Employee).filter(Employee.emp_code == e_data["emp_code"]).first():
                db.add(Employee(**e_data, is_active=True))
        db.commit()
        logger.info(f"✅ {len(sample_employees)} employees created")

        logger.info("\n🎉 Seed completed!")
        logger.info("\n📋 Login Credentials:")
        logger.info("  Super Admin : admin@school.com       / Admin@123")
        logger.info("  Principal   : principal@school.com   / Principal@123")
        logger.info("  Sub Admin   : subadmin@school.com    / Subadmin@123")
        logger.info("  Teacher 1   : teacher@school.com     / Teacher@123")
        logger.info("  Teacher 2   : teacher2@school.com    / Teacher@123")
        logger.info("  Accountant  : accounts@school.com    / Accounts@123")
        logger.info("  HR Manager  : hr@school.com          / Hr@123456")
        logger.info("  Librarian   : library@school.com     / Library@123")
        logger.info("\n📚 Students: 10 per class × 10 classes = 100 students total")
        logger.info("  Classes 1–10, Section A, Academic Year 2024-25")
        logger.info("\n📱 Portal Login Examples (name + phone):")
        logger.info("  Arjun Kumar   (Class 1)  → phone: 9001000001")
        logger.info("  Karthik Sharma (Class 1) → phone: 9001000002")
        logger.info("  Priya Nair    (Class 5)  → phone: 9005000006")
        logger.info("  Arjun Kumar   (Class 10) → phone: 9010000001")

    except Exception as e:
        logger.error(f"❌ Seed failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
