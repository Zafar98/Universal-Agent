# ⚡ FASTEST START - Just Copy & Paste

## 🎯 What You Need

- OpenAI API key (get free $5 credit at https://platform.openai.com/api-keys)

## ⏱️ 3-Minute Setup

### Step 1: Create Environment File
```bash
cd c:\Users\USER\Desktop\ai-voice-call-system
copy .env.local.example .env.local
```

### Step 2: Edit .env.local
Open the file and change:
```
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
```

Replace `YOUR_KEY_HERE` with your actual OpenAI key.

### Step 3: Start Server
```bash
npm run dev
```

### Step 4: Open Browser
Go to: **http://localhost:3000**

---

## 🎤 Test It (1 Minute)

1. Click blue "Start Test Call" button
2. Click "Allow" when browser asks for microphone
3. Click "Start Speaking"
4. Say: *"SW1A 2AA, 15 March 1990"*
5. Click "Stop Speaking"
6. Wait for agent to respond
7. Repeat 3-6 for more messages
8. Say "bye" to end

**You're done!** 🎉

---

## 📝 Notes

- The dev server stays running. Press `Ctrl+C` to stop.
- Your API key is private - never share it
- You'll need a working microphone and speakers
- Modern browsers work best (Chrome, Firefox, Safari, Edge)

---

## 🆘 Stuck?

**API key not working?**
- Check you copied it correctly from https://platform.openai.com/api-keys
- Make sure `.env.local` file exists
- Restart the dev server

**Microphone not working?**
- Make sure you clicked "Allow" when browser asked
- Check Windows microphone settings
- Try a different browser

**Nothing's happening?**
- Check the browser console (press F12)
- Look for error messages
- Restart the dev server with `npm run dev`

---

## 📚 Want More Info?

- **Quick reference**: Read `QUICK_START.md`
- **Setup help**: Read `SETUP.md`
- **How it works**: Read `ARCHITECTURE.md`
- **Full guide**: Read `START_HERE.md`

---

That's it! Enjoy your AI voice call system! 🚀
