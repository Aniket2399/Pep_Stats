# ⚽ Live Pitch Frontend - FIFA World Cup 2026

Official real-time analytics dashboard for FIFA World Cup 2026 with live match data, predictions, and fan sentiment.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend running on `http://localhost:8000`

### Setup

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### Build for Production

```bash
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/           # React components
│   │   ├── Nav.tsx          # Navigation bar
│   │   ├── MatchCard.tsx    # Hero match display
│   │   └── SoccerField.tsx  # Live soccer field
│   │
│   ├── pages/               # Page components
│   │   ├── TournamentPage.tsx
│   │   └── LiveMatchPage.tsx
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useWebSocket.ts
│   │   └── useMatchData.ts
│   │
│   ├── config/              # Configuration
│   │   └── api.ts
│   │
│   ├── styles/              # CSS files
│   │   └── globals.css
│   │
│   ├── App.tsx              # Main app component
│   └── main.tsx             # Entry point
│
├── public/                  # Static files
├── index.html              # HTML entry
├── package.json            # Dependencies
├── tailwind.config.js      # Tailwind config
├── vite.config.ts          # Vite config
└── tsconfig.json           # TypeScript config
```

## 🎨 Design System

### Colors (FIFA Official)
- **Gold**: `#FFD60A` - Primary accent
- **Navy**: `#0A3161` - Primary dark
- **Green**: `#1B4D2E` - Field color
- **Red**: `#E63946` - Alerts/energy
- **Orange**: `#F77F00` - Secondary accent

### Typography
- **Display**: Inter (Bold, 48px+)
- **Body**: Inter (Regular, 16px)
- **Mono**: IBM Plex Mono (Numbers, 14-16px)

## 🔌 API Integration

### WebSocket Endpoints
```typescript
// Match updates
ws://localhost:8000/ws/match/1

// Sentiment feed
ws://localhost:8000/ws/sentiment/1
```

### REST Endpoints
```typescript
// Get match data
GET http://localhost:8000/match/1

// Get sentiments
GET http://localhost:8000/match/1/sentiment

// Get predictions
GET http://localhost:8000/match/1/predictions

// Analyze sentiment
POST http://localhost:8000/sentiment/analyze
```

## 🧩 Components

### MatchCard
Hero component displaying live match information with real-time score updates.

```tsx
<MatchCard
  team1={{ name: 'France', flag: '🇫🇷', score: 2, ... }}
  team2={{ name: 'Argentina', flag: '🇦🇷', score: 1, ... }}
  time="45+2'"
  stadium="Lusail Stadium"
  status="LIVE"
/>
```

### SoccerField
Signature component showing real-time player positions, heatmaps, and possession.

```tsx
<SoccerField
  team1Players={players}
  team2Players={opponents}
  possession={58}
  passNet={passes}
/>
```

### Nav
Sticky navigation with tournament sections.

## 🪝 Hooks

### useWebSocket
Real-time data streaming via WebSocket.

```tsx
const { data, isConnected, error, send } = useWebSocket('/ws/match/1');
```

### useMatchData
Fetch match statistics from REST API.

```tsx
const { match, stats, loading, error } = useMatchData(1);
```

## 📊 Pages

- **Tournament**: Group standings, top scorers
- **Live Match**: Hero match card, soccer field, events, predictions
- **Teams**: Team analytics (placeholder)
- **Players**: Player stats (placeholder)
- **Predictions**: Match predictions & sentiment (placeholder)

## 🎬 Environment Variables

Create `.env` file:

```env
# Development
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000

# Production
# VITE_API_URL=https://api.example.com
# VITE_WS_URL=wss://api.example.com
```

## 🚀 Deployment

### Vercel
```bash
npm i -g vercel
vercel deploy
```

### Netlify
```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

### Docker
```bash
docker build -t live-pitch-frontend .
docker run -p 3000:80 live-pitch-frontend
```

## 📦 Dependencies

- **react**: UI library
- **react-router-dom**: Routing
- **framer-motion**: Animations
- **tailwindcss**: Styling
- **recharts**: Charts
- **axios**: HTTP client
- **lucide-react**: Icons

## 🧪 Development

```bash
# Start dev server with hot reload
npm run dev

# Run linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📝 Code Style

- TypeScript for type safety
- React Hooks for components
- Tailwind CSS for styling
- Framer Motion for animations

## 🐛 Troubleshooting

### WebSocket Connection Failed
```
Error: WebSocket is not connected
```
Make sure backend is running on `http://localhost:8000`

### API Endpoint Not Found
Update `src/config/api.ts` with correct backend URL

### Tailwind Classes Not Working
```bash
npm run build  # Rebuild
npm run dev    # Restart dev server
```

## 📖 Learn More

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion)

## 📄 License

This project is part of the Live Pitch portfolio project.

---

**Built with ⚽ for FIFA World Cup 2026**
