"""
Email Service — SMTP-based notification sender.
Uses Python's built-in smtplib with TLS.
Set SMTP_ENABLED=true and fill SMTP_* vars in .env to activate.
"""
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


def _build_html(subject: str, body: str, footer: str = "") -> str:
    """Wrap plain text in a clean HTML email template."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
      <div style="max-width:600px; margin:auto; background:white; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background:#1e40af; padding:24px 32px;">
          <h1 style="color:white; margin:0; font-size:20px;">🎓 {settings.APP_NAME}</h1>
        </div>
        <!-- Body -->
        <div style="padding:32px; color:#333;">
          <h2 style="margin-top:0; color:#1e40af;">{subject}</h2>
          <div style="font-size:15px; line-height:1.6; white-space:pre-line;">{body}</div>
        </div>
        <!-- Footer -->
        <div style="background:#f9fafb; padding:16px 32px; border-top:1px solid #e5e7eb; font-size:12px; color:#6b7280;">
          {footer or f"This is an automated message from {settings.APP_NAME}. Please do not reply."}
        </div>
      </div>
    </body>
    </html>
    """


def send_email(
    to: List[str] | str,
    subject: str,
    body: str,
    html: Optional[str] = None,
    footer: str = "",
) -> bool:
    """
    Send an email via SMTP.
    Returns True on success, False on failure.
    Silently skips if SMTP_ENABLED=false.
    """
    if not settings.SMTP_ENABLED:
        logger.info(f"[Email SKIPPED — SMTP disabled] To: {to} | Subject: {subject}")
        return True

    recipients = [to] if isinstance(to, str) else to

    msg = MIMEMultipart("alternative")
    msg["From"]    = f"{settings.APP_NAME} <{settings.SMTP_FROM}>"
    msg["To"]      = ", ".join(recipients)
    msg["Subject"] = f"[{settings.APP_NAME}] {subject}"

    # Plain text fallback
    msg.attach(MIMEText(body, "plain"))
    # HTML version
    msg.attach(MIMEText(html or _build_html(subject, body, footer), "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM, recipients, msg.as_string())
        logger.info(f"✉️  Email sent → {recipients} | {subject}")
        return True
    except smtplib.SMTPException as exc:
        logger.error(f"❌ SMTP error sending to {recipients}: {exc}")
        return False
    except Exception as exc:
        logger.error(f"❌ Unexpected email error: {exc}")
        return False


# ── Pre-built email templates ─────────────────────────────────

def send_welcome_email(to: str, full_name: str, role: str, temp_password: str) -> bool:
    return send_email(
        to=to,
        subject="Welcome to School ERP — Your Account Details",
        body=f"""Dear {full_name},

Your account has been created on {settings.APP_NAME}.

Role: {role.replace('_', ' ').title()}
Email: {to}
Temporary Password: {temp_password}

Please log in and change your password immediately.

Login at: http://localhost:3000/login
""",
    )


def send_fee_receipt(to: str, student_name: str, invoice_no: str, amount: float, paid_at: str) -> bool:
    return send_email(
        to=to,
        subject=f"Fee Receipt — {invoice_no}",
        body=f"""Dear Parent/Guardian,

We acknowledge receipt of fee payment for {student_name}.

Invoice No : {invoice_no}
Amount Paid: ₹{amount:,.2f}
Date       : {paid_at}

Thank you for your prompt payment.
""",
    )


def send_attendance_alert(to: str, student_name: str, date: str, status: str) -> bool:
    return send_email(
        to=to,
        subject=f"Attendance Alert — {student_name}",
        body=f"""Dear Parent/Guardian,

This is to inform you that {student_name} was marked as **{status.upper()}** on {date}.

If this is incorrect, please contact the school administration.
""",
    )


def send_leave_decision(to: str, emp_name: str, decision: str, from_date: str, to_date: str, remarks: str = "") -> bool:
    return send_email(
        to=to,
        subject=f"Leave Request {decision.title()}",
        body=f"""Dear {emp_name},

Your leave request from {from_date} to {to_date} has been **{decision.upper()}**.

{f'Remarks: {remarks}' if remarks else ''}

Please contact HR for any queries.
""",
    )


def send_exam_result(to: str, student_name: str, exam_name: str, marks: float, total: float, grade: str) -> bool:
    pct = round((marks / total) * 100, 1) if total > 0 else 0
    return send_email(
        to=to,
        subject=f"Exam Result — {exam_name}",
        body=f"""Dear Parent/Guardian,

Results for {student_name} have been published.

Exam  : {exam_name}
Marks : {marks} / {total} ({pct}%)
Grade : {grade}

Kindly review and contact the class teacher for any clarification.
""",
    )


def send_bulk_notification(recipients: List[str], subject: str, body: str) -> dict:
    """Send the same email to multiple recipients. Returns success/failure counts."""
    sent, failed = 0, 0
    for email in recipients:
        if send_email(to=email, subject=subject, body=body):
            sent += 1
        else:
            failed += 1
    return {"sent": sent, "failed": failed, "total": len(recipients)}
