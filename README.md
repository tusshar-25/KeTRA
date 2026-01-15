# KeTrade – Modern Trading Platform

KeTrade is a comprehensive **full-stack trading learning platform** built with **React and Node.js**, designed to simulate real-world stock trading, IPO investments, portfolio tracking, and market analysis with a modern UI and secure backend.

---

## 🚀 Features

### Core Trading Features
- **Real-time Stock Trading** – Buy and sell stocks with live market data
- **Advanced Charting** – Interactive charts using Lightweight Charts
- **Market Overview** – Track indices, top gainers, and top losers
- **Stock Analysis** – Detailed stock data with historical performance

### IPO Management
- **IPO Discovery** – Browse upcoming and ongoing IPOs
- **Easy IPO Application** – Seamless IPO application flow
- **Allotment Tracking** – Monitor IPO allotment status
- **SME IPO Support** – Access SME and mainboard IPOs

### Portfolio & Wallet
- **Portfolio Management** – Track holdings and performance
- **Wallet Integration** – Fund management and balance tracking
- **Transaction History** – Complete audit trail of trades
- **SIP Calculator** – Systematic Investment Plan calculations

### User Experience
- **Modern UI/UX** – Clean, responsive interface using Tailwind CSS
- **Real-time Updates** – Live price feeds and portfolio valuation
- **Secure Authentication** – JWT-based authentication
- **Mobile Responsive** – Optimized for all screen sizes

---

## 🛠 Tech Stack

### Frontend
- **React 19**
- **Vite**
- **Tailwind CSS**
- **React Router**
- **Framer Motion**
- **Lightweight Charts**
- **Recharts**
- **Axios**

### Backend
- **Node.js**
- **Express.js**
- **MongoDB (Mongoose)**
- **JWT Authentication**
- **bcryptjs**
- **Yahoo Finance API**
- **Node Cache**
- **Helmet**
- **Rate Limiting**

---

## 📁 Project Structure

```

KeTrade/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── config/
│   │   └── utils/
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── assets/
│   ├── public/
│   └── package.json
│
└── README.md

````

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud)
- Git

---

### Installation

#### 1. Clone the repository
```bash
git clone https://github.com/tusshar-25/KeTRA.git
cd KeTrade
````

#### 2. Install backend dependencies

```bash
cd backend
npm install
```

#### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

---

### Start Development Servers

#### Backend

```bash
cd backend
npm run dev
```

#### Frontend

```bash
cd frontend
npm run dev
```

---

### Access the Application

* **Frontend:** [http://localhost:5173](http://localhost:5173)
* **Backend API:** [http://localhost:5000](http://localhost:5000)

---

## 📊 API Endpoints

### Authentication

* `POST /api/auth/register`
* `POST /api/auth/login`
* `GET /api/auth/profile`

### Market Data

* `GET /api/market/stocks`
* `GET /api/market/stock/:symbol`
* `GET /api/market/indices`
* `GET /api/market/gainers-losers`

### IPO

* `GET /api/ipo/list`
* `POST /api/ipo/apply`
* `GET /api/ipo/status/:id`

### Portfolio

* `GET /api/portfolio/holdings`
* `GET /api/portfolio/transactions`
* `POST /api/portfolio/trade`

---

## 🔐 Security Features

* JWT-based authentication
* API rate limiting
* Secure HTTP headers (Helmet)
* Input validation and sanitization
* CORS protection

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
   `git checkout -b feature/YourFeature`
3. Commit changes
   `git commit -m "Add YourFeature"`
4. Push to branch
   `git push origin feature/YourFeature`
5. Open a Pull Request

---

## 📝 License

This project is licensed under the **ISC License**.

---

## 🙏 Acknowledgments

* Yahoo Finance API
* React & Open Source Community

---

## 📬 Support

For questions or issues:

* Open an issue on GitHub

---

**KeTrade** – A modern gateway to smart trading and market learning.

````


