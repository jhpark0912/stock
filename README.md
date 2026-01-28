# 📊 Stock Analysis Web Platform with AI

React, FastAPI, and Gemini AI for real-time stock analysis, news, and AI-powered insights.

## Features

- **Real-time Stock Data**: Fetches and displays real-time stock prices, volume, and market cap.
- **In-depth Financials**: Provides over 15 key financial metrics including PE, PBR, ROE, and debt-to-equity.
- **Technical Indicators**: Calculates and visualizes SMA, EMA, RSI, MACD, and Bollinger Bands.
- **Latest News**: Aggregates and displays the latest news for the selected stock.
- **🤖 Gemini AI Analysis**:
  - **Sentiment Analysis**: Analyzes news sentiment and provides a sentiment score and label.
  - **Summarization**: Summarizes key news insights into a concise overview.
- **Mock Data Mode**: Allows frontend development without hitting API rate limits.
- **Interactive UI**: Built with React, TypeScript, and Tailwind CSS for a modern user experience.

## Project Structure

```
stock/
├── backend/
│   ├── app/
│   |   ├── api/
│   |   |   └── routes/
│   |   |       ├── health.py
│   |   |       └── stock.py           # Stock, News, and AI Analysis APIs
│   |   ├── services/
│   |   |   ├── stock_service.py       # Business logic for fetching data and AI analysis
│   |   |   └── ...
│   |   └── models/
│   |       └── stock.py               # Pydantic data models
│   ├── requirements.txt
│   └── ...
├── frontend/
│   ├── src/
│   |   ├── components/
│   |   |   ├── StockSearch.tsx
│   |   |   ├── StockInfo.tsx
│   |   |   ├── StockNews.tsx
│   |   |   └── StockAnalysis.tsx      # Component for displaying AI analysis
│   |   ├── lib/
│   |   |   └── api.ts                 # API fetching logic
│   |   ├── types/
│   |   |   └── stock.ts               # TypeScript types
│   |   └── App.tsx                    # Main application component
│   ├── package.json
│   └── ...
└── README.md
```

## Setup and Installation

### 1. Dependencies

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Environment Variables

Create `.env` files for both the backend and frontend.

**Backend (`stock/.env`):**
```env
GEMINI_API_KEY=your_gemini_api_key_here
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:5173
USE_MOCK_DATA=true # Set to false to use live data
```

**Frontend (`stock/frontend/.env`):**
```env
VITE_API_URL=http://localhost:8000
```

### 3. Running the Application

**Run the backend server:**
```bash
cd backend
uvicorn app.main:app --reload
```

**Run the frontend development server (in a separate terminal):**
```bash
cd frontend
npm run dev
```

### 4. Accessing the Application

- **Web App**: [http://localhost:5173](http://localhost:5173)
- **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

## API Endpoints

| Method | Path                         | Description                               |
|--------|------------------------------|-------------------------------------------|
| GET    | `/api/health`                | Health check                             |
| GET    | `/api/stock/{ticker}`        | Get real-time stock data                  |
| GET    | `/api/stock/{ticker}/news`   | Get latest news for a stock               |
| GET    | `/api/stock/{ticker}/analysis`| Get AI-powered news analysis (Gemini)    |

## License

MIT