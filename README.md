# Stack-Masters
MindGuard AI is an AI-powered mental health monitoring platform that performs psychological screening, detects stress levels, and provides real-time AI-based emotional support through chatbot and voice interaction.
# 🧠 MindGuard AI  
### AI-Powered Psychological Readiness & Mental Health Early Intervention Platform

---

## 📌 Project Description

*MindGuard AI* is an intelligent mental health monitoring and early intervention platform designed to assess a user's emotional well-being using Artificial Intelligence.

The platform combines *psychological screening, AI-driven analysis, real-time chatbot counseling, voice interaction, and administrative monitoring dashboards* to help detect early signs of mental stress and provide immediate support.

MindGuard AI aims to bridge the gap between *mental health awareness and accessible support, enabling individuals to receive **instant psychological first-aid* while allowing institutions to monitor overall well-being in a secure and privacy-focused environment.

---

## ❗ Problem Statement

Mental health challenges such as *stress, anxiety, burnout, and depression* are rapidly increasing among students and young professionals.

However, there are several major challenges:

- Many individuals hesitate to seek professional help.
- Early warning signs of mental distress are often ignored.
- Mental health support is not always instantly accessible.
- Institutions struggle to monitor the psychological well-being of individuals.

Without early detection and support, small mental health issues can evolve into *serious psychological crises*.

---

## 💡 Solution Overview

MindGuard AI addresses these challenges by providing a *smart AI-powered mental wellness platform* that offers:

- AI-based psychological screening
- Personalized readiness scores
- Real-time mental health chatbot support
- Voice-based AI counseling
- Crisis detection and escalation
- Secure admin monitoring dashboards

The system helps users *identify stress early, receive support immediately, and track emotional well-being over time*.

---

## ✨ Key Features

🔐 *Secure Role-Based Authentication*
- User registration and login system
- Role-based access for students, adults, soldiers, and administrators

🧠 *AI Psychological Screening*
- 6-question mental wellness assessment
- AI analyzes responses and generates psychological insights

📊 *Readiness Score & Risk Level*
- AI calculates a readiness score (0–100)
- Risk categories: Low, Moderate, Critical

💬 *AI Mental Health Chatbot*
- Real-time emotional support
- Stress management guidance
- Coping strategy suggestions

🚨 *Crisis Detection & Escalation*
- Detects harmful or critical keywords
- Activates emergency intervention mode

🎤 *Voice Interaction with AI Counselor*
- Users can interact with the AI via voice
- Conversational AI support

🧑‍💻 *Admin Monitoring Dashboard*
- Admins can view mental health status of assigned users
- Institution-level monitoring

🛡️ *Strict Role-Based Access Control*
- Protected routes
- Segregated data access

🔑 *Secure Password Encryption*
- Password hashing using bcrypt

---

## 🏗️ System Architecture Overview

MindGuard AI follows a *modern full-stack architecture*.
### Architecture Flow

1. User interacts with the *React frontend*.
2. Data is sent to the backend using *Axios API requests*.
3. *FastAPI backend* processes requests and handles authentication.
4. User data and scores are stored in *MongoDB*.
5. Psychological responses are analyzed using *Google Gemini AI*.
6. AI returns readiness score, risk level, and feedback.

---

## 🛠️ Technology Stack

### Frontend

- ⚛️ React (Vite)
- 🔀 React Router DOM
- 🌐 Axios
- 🎨 CSS (Glassmorphism UI)
- 🎯 Lucide React Icons

### Backend

- 🐍 FastAPI (Python)
- ⚡ Uvicorn Server
- ✔️ Pydantic Data Validation
- 🔐 JWT Authentication
- 🔑 Passlib (bcrypt) Password Hashing

### Database

- 🍃 MongoDB
- ⚡ Motor Async MongoDB Driver

### Artificial Intelligence

- 🤖 Google Gemini API (gemini-2.5-flash)

---
