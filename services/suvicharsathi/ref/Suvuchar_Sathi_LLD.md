Low Level Design Document – SuvicharSathi

# 1\. Overview

SuvicharSathi is a WhatsApp-based daily Marathi सुविचार (quotes) delivery service. Users subscribe, pay online, and receive curated quotes daily. Admins manage quotes, users, payments, and scheduling. Future AI integration will allow automatic quote generation.

# 2\. Architecture

\- Frontend: Admin Portal (React.js / Next.js), Public microsite (HTML5/CSS3)  
\- Backend: Python (FastAPI), PostgreSQL, Redis, Celery + RabbitMQ  
\- Integrations: WhatsApp Business API (Interakt), Razorpay API, SendGrid/SES  
\- Hosting & Infra: AWS (EC2/Lambda), Docker

# 3\. Package & Module Structure

suvicharsathi/  
│  
├── core/ # Common utilities & reusable components  
├── users/ # User management  
├── auth/ # Authentication & Authorization  
├── quotes/ # सुविचार management  
├── payments/ # Razorpay integration  
├── scheduler/ # Daily सुविचार scheduler  
├── whatsapp/ # WhatsApp API integration (Interakt)  
├── admin/ # Admin panel APIs  
└── main.py # Entry point (FastAPI app)  

# 4\. Database Design

Tables: users, subscriptions, quotes, payments, delivery_logs, admin_users

# 5\. API Design

Authentication:  
\- POST /auth/register – register user  
\- POST /auth/login – login, returns JWT  
\- POST /auth/logout – logout  
\- POST /auth/refresh – refresh JWT  
<br/>Users:  
\- GET /users/me – fetch user profile  
\- PATCH /users/me – update profile  
\- DELETE /users/me – delete account  
<br/>Quotes:  
\- POST /quotes – add new quote (Admin only)  
\- GET /quotes – list all quotes  
\- GET /quotes/{id} – view quote by ID  
\- DELETE /quotes/{id} – delete quote (Admin only)  
<br/>Payments:  
\- POST /payments/initiate – start Razorpay payment  
\- POST /payments/webhook – Razorpay webhook for confirmation  
<br/>WhatsApp:  
\- POST /whatsapp/send – send manual WhatsApp message  
\- POST /whatsapp/webhook – receive delivery status callbacks  

# 6\. Screen Design

Admin Panel Screens include Login, Quotes Management, User Management, Payment Dashboard, Delivery Logs with field-level details.

# 7\. Security Considerations

JWT auth, role-based access, rate limiting, HTTPS-only, encryption, webhook validation, secret management.

# 8\. Reusable Components

logger.py, validators.py, security.py, templates.py

# 9\. Integration Flows

Subscription Flow:  
1\. User registers → Login → Chooses plan  
2\. Payment initiated → Razorpay confirms → Subscription record created  
3\. Scheduler picks active subscriptions daily → Sends quotes via WhatsApp  
<br/>Quote Delivery:  
\- Celery job runs every morning at 7 AM IST  
\- Fetches all active users  
\- Picks a random quote from DB  
\- Sends via Interakt API  
\- Logs success/failure in delivery_logs