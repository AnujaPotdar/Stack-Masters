# MindGuard AI - Project Setup and Execution Guide

This document contains all the necessary commands and steps to run the MindGuard AI MVP on your local Windows machine.

## Prerequisites
- Python 3.8+
- Node.js & npm
- MongoDB Community Server installed locally

---

## Step 1: Start the MongoDB Server
The backend requires MongoDB to store chat history. Open a terminal or PowerShell and run:

```powershell
& "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath C:\data\db
```
*(Keep this terminal window open and running)*

---

## Step 2: Setup and Run the FastAPI Backend
Open a **NEW** terminal window.

1. **Navigate to the backend directory:**
   ```powershell
   cd "c:\Users\ranve\OneDrive\Desktop\stack members\mindguard-ai\backend"
   ```

2. **Activate the Virtual Environment (if applicable):**
   ```powershell
   .\venv\Scripts\activate
   ```
   *(If you don't have a virtual environment, you can create one using `python -m venv venv` first)*

3. **Install Python Dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

4. **Start the Backend Server:**
   ```powershell
   uvicorn main:app --reload
   ```
   *(The backend API will now be running at `http://127.0.0.1:8000`)*

---

## Step 3: Setup and Run the React Frontend
Open another **NEW** terminal window.

1. **Navigate to the frontend directory:**
   ```powershell
   cd "c:\Users\ranve\OneDrive\Desktop\stack members\mindguard-ai\frontend"
   ```

2. **Install Node Modules (if not already installed):**
   ```powershell
   npm install && npm install axios react-router-dom lucide-react
   ```

3. **Start the Development Server:**
   ```powershell
   npm run dev
   ```

---

## Step 4: Access the Application
- **Frontend App:** Open your browser and go to the link provided by Vite (usually `http://localhost:5173`)
- **Backend API Docs:** Open your browser and go to `http://127.0.0.1:8000/docs` to see the FastAPI Swagger UI.

---

## Step 5: College Admin Dashboards (New Features)
Two dedicated dashboards have been created for college administrators to monitor their enrolled students' mental health profiles:
1. **DKTE Admin Dashboard:** To view students registered under "DKTE textile and Engineering Institute", navigate to `http://localhost:5173/admin/dkte` or click the **DKTE Admin** button in the navigation bar after logging in.
2. **Sharad Admin Dashboard:** To view students registered under "Sharad Institute of technology", navigate to `http://localhost:5173/admin/sharad` or click the **Sharad Admin** button in the navigation bar after logging in.

*Note: You must be registered and logged in to access these dashboards.*

---

## Step 6: Setup and Run the Project Admin Module 
A standalone Project Admin dashboard exists to monitor wide-scale global usage (Total Users, Therapy Sessions, Threat Analysis). This module runs completely independent of the main application.

1. **Start the Project Admin Backend (Terminal 4)**
Open a new terminal and run:
```powershell
cd "c:\Users\ranve\OneDrive\Desktop\stack members\mindguard-ai\project-admin\backend"
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt --upgrade
python main.py
```
*(This starts the admin API on port `8005`)*

2. **Start the Project Admin Frontend (Terminal 5)**
Open another new terminal and run:
```powershell
cd "c:\Users\ranve\OneDrive\Desktop\stack members\mindguard-ai\project-admin"
npm run dev
```
*(This starts the admin UI on port `5174`)*

You can access the Super Admin Dashboard by visiting `http://localhost:5174` in your browser.

---

Enjoy testing the MindGuard AI application!
