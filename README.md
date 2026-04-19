# AI Voice Call System MVP

A multi-business AI voice operations platform built with Next.js and OpenAI Realtime.

## 🎯 Quick Start

### 1. Setup Environment

```bash
# Copy the example environment file
cp .env.local.example .env.local

# Edit .env.local and add your OpenAI API key
# Get it from: https://platform.openai.com/api-keys

# Optional but recommended for production:
# - DATABASE_URL for PostgreSQL persistence
# - DASHBOARD_SESSION_SECRET
# - SMTP credentials for email verification
# - SMS_VERIFICATION_WEBHOOK_URL if you want phone verification via your own provider
# - Zendesk credentials for real ticket creation
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Open in Browser

Navigate to `http://localhost:3000`

## 📊 Business Dashboard

- Login page: `http://localhost:3000/login`
- Admin login page: `http://localhost:3000/admin/login`
- Signup page: `http://localhost:3000/signup`
- Dashboard page: `http://localhost:3000/dashboard`
- Public inbound business line: `http://localhost:3000/call/<tenantId>`
- Dashboard is protected with tenant-aware business sessions.
- Includes search, filters (tenant, urgency, issue), ticket status sync, and CSV export.
- Admin dashboard login can view and operate all tenants in one place.

Repair workflow operations now support:
- `awaiting_contractor`
- `sent_to_contractor`
- `contractor_on_the_way`
- `resolved`

Businesses now sign up with email or phone verification and choose:
- their business model
- their verification method
- how many agents they want

## 🎤 How to Test

1. Open `/` for the multi-business intake screen or `/call/<tenantId>` for a specific business line.
2. Enter caller name, phone/account reference, and the reason for the call.
3. Start the call.
4. The system performs pre-answer routing and either connects directly to a department agent or falls back to the front-door agent when confidence is low.
5. Speak naturally and let the agent stay inside its department scope.
6. End the call and review the logged call, ticket, handoff recommendation, and department assignment in the dashboard.

## 📁 Project Structure

```
app/
├── page.tsx              # Main test panel page
└── api/
    ├── transcribe        # STT (Whisper)
    ├── speak            # TTS (OpenAI TTS)
    └── process          # Conversation logic & agent

components/
└── VoiceCall/
    ├── TestPanel.tsx    # Main UI component
    ├── Transcript.tsx   # Live conversation display
    └── CaseLogger.tsx   # Case display

lib/
├── types.ts             # TypeScript types
├── voiceAgent.ts        # Agent logic & intent detection
├── caseLogger.ts        # In-memory case storage
└── useVoiceCall.ts      # React hook for voice

public/                  # Static files
```

## 🔧 Architecture

### Frontend (Next.js)
- **TestPanel**: Admin test interface with call controls
- **useVoiceCall Hook**: Manages audio recording and API communication
- **Transcript**: Real-time conversation display
- **CaseLogger**: Displays captured case information

### Backend (Next.js API Routes)
- **`/api/transcribe`**: Converts user audio to text (Whisper API)
- **`/api/speak`**: Converts agent text to audio (TTS API)
- **`/api/process`**: Handles conversation flow and agent logic

### Voice Agent Logic
- Guides user through verification (postcode, DOB)
- Detects issue type (repair, complaint, general)
- Asks relevant follow-up questions
- Captures location and other details
- Logs all data to in-memory storage

## 🎯 Features Implemented

✅ Business signup and sign-in with email or phone verification flow  
✅ Multi-business templates including housing association, restaurant, utilities, and healthcare  
✅ Front-door and department-specific agent structure  
✅ Pre-answer call routing based on caller details, hinting, and prior history  
✅ Public tenant-specific inbound call URLs  
✅ Realtime voice conversations with department-scoped prompts  
✅ Call logs with routing metadata, caller identity, and handoff recommendation  
✅ Protected business dashboard for call logs and tickets  
✅ PostgreSQL persistence when `DATABASE_URL` is set  
✅ Zendesk ticket connector when Zendesk env vars are set  
✅ Ticket status sync from Zendesk when enabled  

## 🚀 Build for Production

```bash
npm run build
npm start
```

## 📝 Requirements

- Node.js 18+
- npm or yarn
- OpenAI API key with Audio Models enabled

## 💡 MVP Notes

This is still an MVP:
- In-memory fallback remains in place when PostgreSQL is not configured
- Phone verification depends on your own webhook-based SMS provider unless you add one
- Department routing is heuristic-based and should be upgraded with richer caller data over time
- Business workspace editing is only partially productized compared with a full no-code builder

## 🔐 Security Notes

- Never commit .env.local to version control
- Add .env.local to .gitignore (already done)
- Keep your OpenAI API key secret

## 🎤 Audio Setup

- Browser must have microphone access
- First call will request permission
- Audio context is created per session
- Supports modern browsers (Chrome, Firefox, Safari, Edge)

## 📞 Next Steps (Not in MVP)

- Telephony integration (Twilio, etc.)
- Database storage (PostgreSQL, MongoDB)
- Multi-language support
- Advanced NLU/NLG
- Real agent handoff
- Call recording and analysis
- Analytics dashboard
- Multi-tenant support

## 🐛 Troubleshooting

**"API key error"** → Check .env.local and API key validity  
**"Microphone not working"** → Ensure browser permission granted  
**"Verification email not sending"** → Check SMTP env vars or use the dev preview code  
**"Wrong agent answered"** → Improve the intake reason, caller history, or department hint before the call starts  
**"No audio output"** → Check speaker volume and browser audio settings  
**"Transcription fails"** → Ensure clear audio, try again  

---

**Built for the MVP sprint with focus on working functionality over features.**

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
