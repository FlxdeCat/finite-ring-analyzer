# Finite Ring Analyzer

A tool for analyzing finite rings using custom-defined addition and multiplication tables.

## How to Run

### Frontend

   ```bash
   npm i
   npm run dev
   ```

### Backend

   ```bash
   # 1. Install Python dependencies
   pip install -r requirements.txt
   
   # 2. Set up environment variables
   cp .env.example .env
   # (Edit .env to provide necessary configuration if needed)
   
   # 3. Start the API server
   uvicorn api:app --reload
   ```

### Example Backend Input:

```python
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
```

### Example CSV Input
```c
+,0,1
0,0,1
1,1,0
,,
*,0,1
0,0,0
1,0,1
```
First table will be the addition operation, while second is multiplication operation.
The empty row acts as the separator
