# 🤖 Recruitment Automation System

An AI-powered full-stack application that automates the recruitment process using machine learning, natural language processing and Generative AI. It streamlines resume screening, candidate analysis, AI driven test, and AI interview using a combination of **Flask** (backend) and **React** (frontend).

---

## 🚀 Features

- ✅ Resume similarity analysis
- ✅ Candidate ranking using ML models
- ✅ Email automation
- ✅ AI MCQ test
- ✅ AI Interview 
- ✅ Clean and responsive frontend (React)
- ✅ RESTful APIs built with Flask

---

## 📦 Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React.js                            |
| Backend    | Flask (Python)                      |
| ML/AI      | scikit-learn, pandas, NLTK          |
| Email      | Google OAuth                        |
| GenAI Model| Gemini 1.5 Flash                    |
| Database   | (Optional) SQLite / PostgreSQL      |
| Deployment | (Optional) Docker / Heroku / Vercel |

---

## ⚙️ Setup Instructions

### ✅ Prerequisites

- Python 3.9+
- Node.js & npm
- Git

---

### 📁 Clone the Repository

```bash
git clone https://github.com/Ammarkarimi/Recruitment-Automation-System.git
cd Recruitment-Automation-System
```

## 🔧 Backend (Flask API)
```
cd Flask
python -m venv venv
venv\Scripts\activate       # On Windows
# source venv/bin/activate  # On macOS/Linux

pip install -r requirements.txt
```
### Start the Flask server
```
python app.py
```

## 💻 Frontend (React App)
```
cd ../React/hire-app
npm install
npm start
```
- Frontend URL: http://localhost:3000
- Backend URL: http://localhost:5000

## 🔐 Environment Variables
Create a .env file in both the Flask/ and React/hire-app/ directories.

- Flask .env
```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
REFRESH_TOKEN=your-refresh-token
```

- React .env
```
REACT_APP_GOOGLE_CLIENT_ID=your-client-id
REACT_APP_BACKEND_URL=http://localhost:5000
```
🔒 Do not commit these files — ensure .env is listed in .gitignore.


## 🎥 Demo Video
🔗 [Click here to watch the demo](https://drive.google.com/file/d/1RVsJ96t_CYDnzQ9Z_ZtRqtROlh0naSlq/view?usp=sharing)


## 👨‍💻 Developed By

**Mohammed Ammar Karimi**<br>
💼 [LinkedIn](https://www.linkedin.com/in/mohammed-ammar)<br>
🌐 [Website](https://ammarkarimi.vercel.app/)<br>
📫 [Email](ammarkarimi9898@gmail.com)<br>

