import os
import smtplib
import ssl
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()


def send_verification_email(to_email: str, code: str):
    user = os.getenv("EMAIL_USER")
    password = os.getenv("EMAIL_APP_PASSWORD")

    # No email credentials set: print the code in the terminal (testing only)
    if not user or not password:
        print(f"[DEV] Verification code for {to_email}: {code}")
        return

    msg = EmailMessage()
    msg["Subject"] = "Your FashLink verification code"
    msg["From"] = f"FashLink <{user}>"
    msg["To"] = to_email
    msg.set_content(
        f"Your FashLink verification code is {code}.\n\n"
        "It expires in 10 minutes. If you didn't sign up, you can ignore this email."
    )

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context, timeout=15) as server:
        server.login(user, password)
        server.send_message(msg)
