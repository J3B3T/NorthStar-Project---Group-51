# Northstar Retail Support

AI-powered customer support assistant and ticket deflection engine for Northstar Retail Co.

## Features

- **AI Chat Assistant** - Gemini-powered support for order status and returns/refunds
- **Order Database Explorer** - Browse and search pre-populated test orders
- **Deflection Analytics** - Real-time metrics on AI resolution vs human escalation
- **Human Escalation** - Seamless ticket creation for complex issues
- **Dark Mode** - Toggle between light and dark themes
- **Offline Support** - Service worker for offline access
- **Text-to-Speech** - Optional voice output for assistant responses

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Vite, Motion (Framer Motion)
- **Backend**: Express, Node.js, TypeScript
- **AI**: Google Gemini 3.6 Flash
- **DevOps**: Docker, GitHub Actions CI/CD

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and add your Gemini API key:

```bash
cp .env.example .env
```

Edit `.env`:
```
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

### Development

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Build

```bash
npm run build
npm start
```

### Testing

```bash
npm run test
```

### Linting

```bash
npm run lint
```

## Project Structure

```
├── config/
│   └── env.ts              # Environment variable validation
├── middleware/
│   ├── validation.ts       # Input validation & sanitization
│   └── rateLimit.ts        # Rate limiting middleware
├── routes/
│   ├── orders.ts           # Orders API routes
│   ├── analytics.ts        # Analytics API routes
│   ├── chat.ts             # Chat API routes with Gemini integration
│   └── reset.ts            # Demo data reset route
├── services/
│   ├── gemini.ts           # Gemini AI service with timeout
│   └── fallback.ts         # Deterministic fallback chat logic
├── types/
│   └── server.ts           # Server-side TypeScript types
├── src/
│   ├── components/
│   │   ├── ChatWindow.tsx
│   │   ├── DeflectionDashboard.tsx
│   │   ├── EscalationModal.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── Header.tsx
│   │   ├── OrderExplorer.tsx
│   │   └── StatusBadge.tsx
│   ├── contexts/
│   │   └── ThemeContext.tsx
│   ├── test/
│   │   ├── setup.ts
│   │   ├── StatusBadge.test.tsx
│   │   └── fallback.test.ts
│   ├── App.tsx
│   ├── main.tsx
│   ├── types.ts
│   ├── mockData.ts
│   └── index.css
├── server.ts               # Main server entry point
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get all orders |
| GET | `/api/orders/:orderNumber` | Get single order |
| GET | `/api/analytics` | Get deflection analytics |
| POST | `/api/chat` | Send chat message (rate limited) |
| POST | `/api/reset` | Reset demo data |
| GET | `/api/health` | Health check |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | Environment mode |

## Docker

```bash
docker build -t northstar .
docker run -p 3000:3000 -e GEMINI_API_KEY=your_key northstar
```

Or with Docker Compose:
```bash
docker-compose up
```

## CI/CD

GitHub Actions workflow runs on push/PR to main/develop:
- TypeScript type checking
- Unit tests
- Production build
- Docker image build and push (main branch only)

## Supported Intents

1. **Order Status** - Track orders, check delivery status
2. **Returns & Refunds** - Check eligibility, process returns

## License

Apache-2.0
