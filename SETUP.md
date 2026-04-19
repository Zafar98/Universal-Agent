# Setup Instructions

## Prerequisites

- **Node.js**: 18.17 or later (check with `node --version`)
- **npm**: 9 or later (check with `npm --version`)
- **OpenAI API Key**: Get from https://platform.openai.com/api-keys
- **Microphone**: Working microphone connected to your computer
- **Modern Browser**: Chrome, Firefox, Safari, or Edge (latest versions)

## Step-by-Step Setup

### 1. Get Your OpenAI API Key

1. Visit https://platform.openai.com/api-keys
2. Sign in with your OpenAI account (create one if needed)
3. Click "Create new secret key"
4. Copy the key (you won't be able to see it again, so save it somewhere safe)

### 2. Configure Environment Variables

```bash
# In the project root, create a .env.local file
cp .env.local.example .env.local

# Edit .env.local and add your OpenAI API key
# It should look like:
# OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

You should see:
```
  ▲ Next.js 16.2.4 (Turbopack)
  - Local:        http://localhost:3000
```

### 5. Open in Browser

Open your browser and go to: **http://localhost:3000**

You should see the AI Voice Call Test Panel with a blue "Start Test Call" button.

## Running the System

### First Time Setup

1. Click "Start Test Call"
2. Browser will ask for microphone permission - **Allow it**
3. Wait for the agent to introduce itself: "Thank you for calling Developers Housing..."

### During a Call

1. **Start Speaking**: Click the blue "Start Speaking" button
2. **Speak Clearly**: Say your postcode and date of birth
   - Example: "SW1A 2AA, 15 March 1990"
3. **Stop Speaking**: Click "Stop Speaking" when done
4. **Wait**: System transcribes and agent responds
5. **Repeat**: Click "Start Speaking" for each turn

### Example Test Call

| Step | You Say | Agent Says |
|------|---------|-----------|
| 1 | - | "Thank you for calling Developers Housing, may I take your postcode and date of birth?" |
| 2 | "SW1A 2AA, 15 March 1990" | "Thank you for providing your information. How can I help you today?" |
| 3 | "The heating in my bedroom isn't working" | "Can you tell me where exactly the issue is located?" |
| 4 | "Bedroom" | "When did this issue start?" |
| 5 | "Last week" | "Alright, I've got that logged for you. Is there anything else I can help with today?" |
| 6 | "No, thanks" | "Thank you for calling. Have a great day!" |

Then the case is logged and displayed on screen.

## Project Structure

```
ai-voice-call-system/
├── app/
│   ├── page.tsx                 # Main page (renders TestPanel)
│   ├── layout.tsx               # App layout
│   └── api/
│       ├── transcribe/
│       │   └── route.ts         # Speech-to-text endpoint
│       ├── speak/
│       │   └── route.ts         # Text-to-speech endpoint
│       └── process/
│           └── route.ts         # Conversation logic endpoint
│
├── components/
│   └── VoiceCall/
│       ├── TestPanel.tsx        # Main UI component
│       ├── Transcript.tsx       # Conversation display
│       └── CaseLogger.tsx       # Case display
│
├── lib/
│   ├── types.ts                 # TypeScript types
│   ├── voiceAgent.ts            # Agent logic & NLU
│   ├── caseLogger.ts            # In-memory case storage
│   └── useVoiceCall.ts          # React state & audio management
│
├── .env.local.example           # Environment template
├── .env.local                   # Your API keys (NOT in git)
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── tailwind.config.ts           # Tailwind CSS config
└── README.md                    # This file
```

## Troubleshooting

### "Network error" or "Failed to start call"

**Problem**: The API isn't responding  
**Solution**:
1. Check you added the API key to `.env.local`
2. Verify API key is correct (copy from https://platform.openai.com/api-keys)
3. Restart the dev server: `npm run dev`
4. Check the browser console (F12 → Console tab) for error messages

### "Microphone not working"

**Problem**: Browser won't let you use the microphone  
**Solution**:
1. Check browser asked for permission - allow it
2. Go to browser settings and verify microphone access is allowed
3. Try a different browser (Chrome, Firefox)
4. Check your computer's microphone settings
5. Test microphone in system settings first

### "No audio output"

**Problem**: Can't hear the agent speaking  
**Solution**:
1. Check speaker volume is up
2. Check browser volume isn't muted
3. Open browser dev tools (F12) and check Console for errors
4. Test speakers with a YouTube video
5. Try a different browser

### "Transcription didn't work"

**Problem**: Your speech wasn't converted to text  
**Solution**:
1. Speak clearly and slowly
2. Reduce background noise
3. Make sure microphone is selected correctly
4. Try a longer phrase
5. Check the browser console for error details

### "Agent gave wrong response"

**Problem**: Agent didn't understand what you said  
**Solution**:
- This is MVP with basic AI - try speaking clearly
- Use keywords like "repair", "broken", "heating"
- For postcode, say it clearly: "S W one A two A A"
- For date: "15 March 1990" works better than "3/15/90"

### Build Errors

If you see build errors:

```bash
# Clear next cache
rm -r .next

# Reinstall dependencies
rm -r node_modules package-lock.json
npm install

# Try build again
npm run build
```

## Performance Tips

- Development builds take ~3 seconds
- First build after changes takes ~5 seconds
- Audio typically takes 1-2 seconds to process
- Agent response generation takes 2-3 seconds

## Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome  | 90+     | ✅ Fully supported |
| Firefox | 88+     | ✅ Fully supported |
| Safari  | 14+     | ✅ Fully supported (iOS 14.5+) |
| Edge    | 90+     | ✅ Fully supported |

## Security Reminders

⚠️ **IMPORTANT**: Never commit `.env.local` to version control!

- Your API key is private and should never be shared
- The `.env.local` file is in `.gitignore` automatically
- If your key is exposed, regenerate it at https://platform.openai.com/api-keys
- Use environment variables for all secrets

## Costs

- **Whisper API** (STT): $0.02 per minute of audio
- **TTS API** (Speech): $15 per 1 million characters
- **Testing**: Expect to use a few dollars per day during development

Monitor usage at https://platform.openai.com/account/billing/overview

## Getting Help

1. Check the Troubleshooting section above
2. Look at browser console errors (F12 → Console)
3. Check the README.md for features and architecture
4. Review the code comments in the components

## Next Steps After Setting Up

Once you have it working:

1. Try different issue types (repair, complaint)
2. Test with different postcodes and dates
3. Examine the case logged at the bottom
4. Look at the network requests in browser DevTools (F12 → Network)
5. Read through the code to understand how it works

---

**MVP is ready to test!** 🎉
