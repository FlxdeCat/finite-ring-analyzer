# 📘 Finite Ring Analyzer

A tool for analyzing finite rings using custom-defined addition and multiplication tables.

## 🚀 How to Run

### Frontend
*(Instructions coming soon...)*

### Backend

1. Install dependencies:
   
   ```bash
   pip install -r requirements.txt

2. Start the API server:
   
   ```bash
    uvicorn api:app --reload

3. Open your browser and visit http://127.0.0.1:8000/docs to explore the interactive Swagger UI.

Example Backend Input:
   elements = ["(0,0)", "(0,1)", "(1,0)", "(1,1)"]
   add = [
         ["(0,0)", "(0,1)", "(1,0)", "(1,1)"],
         ["(0,1)", "(0,0)", "(1,1)", "(1,0)"],
         ["(1,0)", "(1,1)", "(0,0)", "(0,1)"],
         ["(1,1)", "(1,0)", "(0,1)", "(0,0)"]
      ]
   mul = [
         ["(0,0)", "(0,0)", "(0,0)", "(0,0)"],
         ["(0,0)", "(0,1)", "(0,0)", "(0,1)"],
         ["(0,0)", "(0,0)", "(1,0)", "(1,0)"],
         ["(0,0)", "(0,1)", "(1,0)", "(1,1)"]
      ]
