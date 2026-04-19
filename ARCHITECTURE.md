# Project Architecture & Implementation Details

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Browser (Frontend)                    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ TestPanel Component                                  │   │
│  │ - Start/Stop buttons                                │   │
│  │ - Call state management                             │   │
│  │ - Live transcript display                           │   │
│  │ - Case logger display                               │   │
│  └──────────────────────────────────────────────────────┘   │
│       ↓                ↓                ↓                    │
│  [Microphone]  [Audio Processing]  [Playback]              │
│       ↓                ↓                ↓                    │
└─────────────────────────────────────────────────────────────┘
        ↓                ↓                ↓
        │                │                │
    [/api/transcribe]  [/api/process]  [/api/speak]
        │                │                │
        └────────────────┼────────────────┘
                         ↓
            ┌────────────────────────────┐
            │   Backend (Next.js)        │
            │                            │
            │   VoiceAgentController     │
            │   ConversationManager      │
            │   CaseLogger (in-memory)   │
            └────────────────────────────┘
                         ↓
            ┌────────────────────────────┐
            │   OpenAI APIs              │
            │                            │
            │   - Whisper (STT)          │
            │   - TTS (Speech)           │
            └────────────────────────────┘
```

## Data Flow

### 1. Call Initiation
```
User clicks "Start Test Call"
    ↓
/api/process?action=start
    ↓
VoiceAgentController.getGreeting()
    ↓
Response: "Thank you for calling..."
    ↓
/api/speak converts to audio
    ↓
Audio plays in browser
```

### 2. User Speech Processing
```
User speaks into microphone
    ↓
MediaRecorder captures audio
    ↓
User clicks "Stop Speaking"
    ↓
Audio chunks combined into Blob
    ↓
POST /api/transcribe with audio
    ↓
OpenAI Whisper API processes
    ↓
Response: { text: "SW1A 2AA, 15 March 1990" }
    ↓
Add to transcript display
```

### 3. Conversation Processing
```
Transcribed text sent to /api/process
    ↓
ConversationManager.processUserInput()
    ↓
Parse intent & extract data:
  - postcode (regex)
  - date of birth (regex)
  - location (keyword matching)
    ↓
Update CaseLogger
    ↓
Generate agent response
    ↓
Response: { agentResponse, nextStep, shouldEndCall, caseData }
    ↓
Send to /api/speak
    ↓
Audio plays back
```

### 4. Case Recording
```
As conversation progresses, case object builds:
  {
    id: "CASE-123456-1",
    issueType: "repair",
    postcode: "SW1A 2AA",
    dateOfBirth: "15/03/1990",
    description: "heating not working",
    location: "bedroom",
    timestamp: 2026-04-16T11:30:00Z,
    status: "open"
  }
    ↓
Stored in-memory via CaseLogger singleton
    ↓
Displayed as case logged when call ends
```

## Component Details

### TestPanel Component
- **Role**: Main UI container
- **State**: Call state (active, listening, transcript, case)
- **Actions**: Start call, start listening, stop listening, end call
- **Renders**: Control buttons, status, transcript, case logger

### useVoiceCall Hook
- **Role**: Encapsulates all voice call logic
- **Functions**:
  - `startCall()`: Initialize session and get greeting
  - `startListening()`: Begin audio recording
  - `stopListening()`: End recording and process
  - `endCall()`: Cleanup resources
  - `speakText()`: Convert text to speech
- **Refs**: MediaRecorder, AudioContext, stream, audio chunks

### VoiceAgentController
- **Role**: Conversation logic and NLU
- **Methods**:
  - `detectIntent()`: Simple keyword-based intent detection
  - `extractPostcode()`: Regex-based postcode extraction
  - `extractDateOfBirth()`: Date parsing
  - `extractLocation()`: Location keyword matching
  - Step-specific getters for agent messages

### ConversationManager (in /api/process)
- **Role**: Manages multi-turn conversation state
- **Steps**:
  1. Greeting → Verification
  2. Verification → Issue capture
  3. Issue capture → Follow-up questions
  4. Follow-ups → Closing
  5. Closing → End call
- **State**: Stored per session in Map<sessionId, ConversationManager>

### CaseLogger
- **Role**: In-memory case storage
- **Methods**:
  - `createCase()`: Create new case
  - `updateCase()`: Add data during conversation
  - `getCase()`: Retrieve case by ID
  - `closeCase()`: Mark as complete
- **Storage**: Map<caseId, CallCase> (lost on server restart)

## API Endpoints

### POST /api/transcribe
**Input**: Audio blob (WebM format)  
**Output**: `{ text: string, timestamp: string }`  
**Provider**: OpenAI Whisper API  
**Use**: Convert user speech to text

### POST /api/speak
**Input**: `{ text: string }`  
**Output**: Audio binary (MP3)  
**Provider**: OpenAI TTS API  
**Use**: Convert agent response to speech

### POST /api/process
**Input**: 
```json
{
  "sessionId": "session-123",
  "action": "start" | "process",
  "userText": "optional - for process action"
}
```
**Output**:
```json
{
  "agentResponse": "string",
  "nextStep": "string",
  "shouldEndCall": boolean,
  "caseData": object | null
}
```
**Use**: Manage conversation flow

## Conversation States

```
greeting
    ↓ (user provides postcode + DOB)
verification
    ↓ (validation complete)
issue_inquiry
    ↓ (user describes issue)
follow_up
    ↓ (follow-up questions: 1st)
follow_up
    ↓ (follow-up questions: 2nd)
closing
    ↓ (ask if anything else)
end
```

## Intent Detection

Simple keyword-based detection (MVP):

| Intent | Keywords |
|--------|----------|
| repair | broken, fix, repair, leak, heating |
| complaint | complain, problem, issue, concerned |
| end | bye, goodbye, thanks, that's all |
| general | (default) |

**Note**: Not ML-based. Uses simple string matching. Can be upgraded to NLU later.

## Error Handling

### Audio Capture Fails
```
try {
  getUserMedia()
} catch {
  alert("Could not access microphone")
}
```

### API Errors
```
if (!response.ok) {
  console.error("API error:", response.status)
  // Gracefully handle and continue
}
```

### Transcription Empty
```
if (!userText || userText.trim().length === 0) {
  // Don't process empty transcription
  // Prompt user to try again
}
```

## Performance Considerations

| Operation | Time | Notes |
|-----------|------|-------|
| Audio capture | Real-time | Limited by browser |
| Transcription | 1-3s | Depends on audio length |
| Agent response gen | 2-3s | API latency |
| TTS generation | 1-2s | Text-to-speech |
| Playback | Variable | Depends on response length |

Total typical turn: 5-8 seconds

## Security

- **API Key**: Stored in environment variable
- **Secrets**: Never logged or sent to client
- **Audio**: Not stored (processed and discarded)
- **Session ID**: Random generated per call
- **CORS**: Limited to same origin

## Limitations (MVP)

- ❌ No database (in-memory only)
- ❌ No authentication
- ❌ No multi-language support
- ❌ No call recording
- ❌ No agent handoff
- ❌ No analytics
- ❌ Basic NLU (keyword matching)
- ❌ Single issue type at a time

## Future Enhancements

1. **Database Integration**: Save cases to PostgreSQL/MongoDB
2. **Advanced NLU**: Use GPT or specialized NLU models
3. **Real Telephony**: Integrate with Twilio/Amazon Connect
4. **Multi-language**: Support multiple languages
5. **Call Recording**: Record and transcribe calls
6. **Analytics**: Track metrics and sentiment
7. **Agent Dashboard**: Manage and monitor calls
8. **ML-based Routing**: Intelligent call routing

---

**Status**: MVP (Minimum Viable Product) - Core functionality working
