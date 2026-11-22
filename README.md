# KHIRNA | خيرنا 🌱

> **« نستثمروا في أرضنا، ونكبروا بخيرنا »**  
> *Investissons dans notre terre, grandissons avec ses fruits.*

**KHIRNA** is a Tunisian agricultural crowdfunding platform prototype developed during a hackathon.

It connects citizens, farmers, and public institutions through a collaborative investment ecosystem, enabling citizens to support agricultural projects, monitor their progress, and track potential returns.

The platform also explores public-private partnerships by facilitating access to state-owned agricultural land while preserving public ownership.

## 🚀 Key Features

- **Investors:** Discover agricultural projects, simulate investments, and track portfolios.
- **Farmers:** Publish projects, manage funding, and share progress updates.
- **Public Institutions:** Manage agricultural land opportunities and co-investment scenarios.
- **Administrators:** Validate projects, milestones, and harvest declarations.
- **AI Assistant:** Conversational support in French, Arabic, and Tunisian Derja.
- **Interactive Experience:** Dashboards, maps, notifications, and bilingual interface (FR/AR).

## ⚙️ Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| State Management | Zustand |
| Routing | React Router |
| Database | Supabase (Optional) |
| Maps | Leaflet, OpenStreetMap |
| PWA | vite-plugin-pwa |
| AI Backend | Python, FastAPI, RAG, Groq |

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- npm
- Git

### Installation

```bash
# Clone the repository
git clone <YOUR_REPOSITORY_URL>

# Navigate to the project
cd <PROJECT_DIRECTORY>

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Production Build

```bash
npm run build
npm run preview
```

## 🗄️ Database Configuration (Optional)

KHIRNA works locally by default using browser `localStorage`.

To enable Supabase:

1. Create a project on [Supabase](https://supabase.com/).
2. Execute `supabase/schema.sql` in the SQL Editor.
3. Configure the required environment variables in `.env.local`, following `.env.example`.
4. Restart the development server.

## 🤖 AI Assistant

The project includes a separate FastAPI backend using RAG and Groq for document-based conversational assistance.

Backend source:

```text
assistant/khirna-ai-assistant/
```

Configure the backend environment variables locally before running the service.

## 📂 Project Structure

```text
KHIRNA/
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── store/
│   ├── data/
│   └── i18n/
├── assistant/
│   └── khirna-ai-assistant/
├── supabase/
│   └── schema.sql
├── .env.example
├── package.json
└── README.md
```

## 🔐 Security & Disclaimer

> **KHIRNA is a hackathon prototype, not a production-ready financial platform.**

- No real financial transactions are processed.
- Demonstration data is fictional.
- Never commit API keys, credentials, or private environment files.
- Supabase requires proper authentication, authorization, and Row Level Security (RLS) before handling real user data.
- Financial operations are simulated and require backend validation for production use.

## 📌 Project Status

**Status:** Hackathon Prototype · Under Development

**Built with 🌱 for the future of Tunisian agriculture.**
