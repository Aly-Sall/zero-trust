# 🛡️ Zero-Trust Secure Examination Platform 

![.NET Core](https://img.shields.io/badge/.NET%208-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![C#](https://img.shields.io/badge/C%23-239120?style=for-the-badge&logo=c-sharp&logoColor=white)
![SignalR](https://img.shields.io/badge/SignalR-0078D4?style=for-the-badge&logo=microsoft&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)
![React](https://img.shields.io/badge/React%2018-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)

> **An advanced, real-time proctoring system leveraging Behavioral Biometrics and Zero-Trust architecture to guarantee academic integrity in remote examinations.**

## 📖 About The Project

With the rise of remote learning and generative AI, traditional online examinations are highly vulnerable to fraud (impersonation, copy-pasting, tab-switching). 

This project aims to solve this issue without relying on highly intrusive, privacy-violating webcam surveillance. Instead, it uses a **Zero-Trust browser sandbox** combined with **Keystroke Dynamics (Behavioral Biometrics)** to continuously authenticate the user. Any suspicious activity is instantly streamed to a Professor's Security Operations Center (SOC) using **Microsoft SignalR WebSockets**.

## ✨ Key Features

* 🧠 **Biometric Keystroke Analysis:** A C# backend service that calculates the Euclidean distance between a user's calibrated typing rhythm (Flight/Dwell time) and their live exam typing to detect impersonation.
* ⚡ **Real-Time SOC Dashboard:** Utilizing **ASP.NET Core SignalR**, integrity alerts are pushed to the professor's dashboard in under 100ms, bypassing traditional HTTP polling.
* 🔒 **Zero-Trust Sandbox:** A customized React interface that actively intercepts and blocks DOM events like context menus, clipboard actions, and visibility changes.
* 🛡️ **Secure Architecture:** Built with JWT-based authentication, Role-Based Access Control (Admin, Professor, Student), and Entity Framework Core (Code-First).

## 🏗️ Tech Stack & Architecture

This project is built using a decoupled architecture, clearly separating the client interface from the business logic and real-time telemetry.

### Backend (.NET Core)
* **Framework:** C# 11, ASP.NET Core 8 Web API
* **Real-Time Engine:** Microsoft SignalR (WebSockets)
* **ORM & Database:** Entity Framework Core, SQLite
* **Security:** JWT Authentication, BCrypt Password Hashing

### Frontend (React)
* **Framework:** React 18 (Vite)
* **Styling:** Tailwind CSS (Dark Cyber-Theme)
* **HTTP Client:** Axios (with interceptors for JWT injection)

## 🚀 Getting Started

Follow these steps to run the project locally.

### Prerequisites
* [.NET 8 SDK](https://dotnet.microsoft.com/download)
* [Node.js](https://nodejs.org/) (v18+)

### 1. Setup the Backend (API & SignalR)
```bash
# Navigate to the API directory
cd SecureExam.API

# Apply Entity Framework migrations and create the SQLite database
dotnet ef database update


# Open a new terminal and navigate to the UI directory
cd secure-exam-ui

# Install dependencies
npm install

# Start the Vite development server
npm run dev
# Run the backend server
dotnet run
