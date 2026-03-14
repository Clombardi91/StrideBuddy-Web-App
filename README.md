# My Stride Buddy — Invite Web App

The supporter-facing Next.js web app. Supporters open an invite link
(no account needed), record a voice message or type one that gets
converted to speech, and it's stored in Supabase — ready to play
during the runner's next workout.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database + Storage | Supabase |
| Voice synthesis | OpenAI TTS (`tts-1`) |
| Fonts | Caveat (display) + DM Sans (body) |
| Deployment | Vercel |

---

## Prerequisites

```bash
node >= 18
npm >= 9
```

---

## Local Setup

### 1. Install dependencies

```bash
cd apps/web
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase start output>
SUPABASE_SERVICE_ROLE_KEY=<from supabase start output>
OPENAI_API_KEY=sk-your-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Start Supabase (from repo root)

```bash
supabase start
# Note the anon key and service_role key in the output
```

### 4. Start the dev server

```bash
npm run dev
# → http://localhost:3000
```

### 5. Test an invite link

```bash
# Get an invite token from the mobile app after creating a session
# Or query Supabase directly:
#   SELECT invite_token FROM sessions LIMIT 1;

open http://localhost:3000/invite/<your-token>
```

---

## Project Structure

```
app/
  layout.tsx                    Root layout — Google Fonts, metadata
  globals.css                   Tailwind + custom CSS (noise, animations)
  page.tsx                      Home (generic landing)
  not-found.tsx                 404 page
  invite/[token]/
    page.tsx                    ← Server Component: validates token via Supabase
    record/page.tsx             Voice recording page (client)
    type/page.tsx               TTS message page (client)
  api/
    tts/route.ts                POST — generates speech via OpenAI TTS
    upload/route.ts             POST — uploads audio to Supabase Storage + inserts message row
    session/route.ts            GET  — validates invite token (used by client components)

src/
  components/
    InviteLanding.tsx           Welcome screen — name input + method picker
    RecordPage.tsx              Voice recorder with waveform visualizer
    TTSPage.tsx                 Text composer + voice picker + TTS preview
    SuccessScreen.tsx           Celebration screen + emoji particle animation
    WaveformVisualizer.tsx      Canvas-based real-time audio waveform
  hooks/
    useAudioRecorder.ts         MediaRecorder lifecycle + Web Audio API analyser
  lib/
    supabase-server.ts          Server-side Supabase clients (anon + admin)
    supabase-browser.ts         Browser-side Supabase client (singleton)
    types.ts                    Shared TypeScript types + constants
    uploadAudio.ts              Client-side upload helpers + TTS fetch util
```

---

## User Flow

```
/invite/[token]              (Server Component — validates token)
    ↓
InviteLanding                Enter name → choose method
    ↓                ↓
/record              /type
    ↓                ↓
RecordPage          TTSPage
• tap Record        • write message
• speak             • pick voice + speed
• tap Stop          • Generate Preview
• review audio      • listen & review
• Send              • Send
    ↓                ↓
          SuccessScreen
```

---

## API Routes

### `POST /api/tts`

Generate speech from text using OpenAI.

**Request body:**
```json
{
  "text": "You've got this, keep going!",
  "voice": "nova",
  "speed": 1.0
}
```

**Response:**
```json
{
  "audioBase64": "//NExAA...",
  "mimeType": "audio/mpeg",
  "voice": "nova",
  "estimatedDurationSeconds": 4
}
```

**Voices:** `alloy` · `echo` · `fable` · `onyx` · `nova` · `shimmer`

---

### `POST /api/upload`

Upload audio to Supabase Storage and insert a `messages` row.

**Recorded audio** (`multipart/form-data`):
```
audio         File (Blob)
sessionId     string
supporterName string
sourceType    "recorded"
duration      number (seconds)
```

**TTS audio** (`application/json`):
```json
{
  "audioBase64": "//NExAA...",
  "mimeType": "audio/mpeg",
  "sessionId": "uuid",
  "supporterName": "Mom",
  "sourceType": "tts",
  "textContent": "You've got this!"
}
```

**Response (`201`):**
```json
{
  "messageId": "uuid",
  "audioUrl": "https://supabase.../messages/session-id/message-id.mp3",
  "supporterName": "Mom",
  "sourceType": "tts"
}
```

**Error responses:**
- `400` — Missing required fields
- `404` — Session not found
- `410` — Session inactive or invite expired
- `413` — File exceeds 10 MB
- `500` — Storage or DB error (with rollback)

---

### `GET /api/session?token=<invite_token>`

Validate an invite token and return session info.

---

## Supabase Storage

**Bucket:** `messages` (public, max 10 MB per file)

**Path pattern:** `{session_id}/{message_id}{ext}`

Example: `3f8a1b2c-...../a7e92d4f-....webm`

Files are uploaded with `cacheControl: 31536000` (1 year) since they're immutable.

---

## Design System

The web app uses a warm organic aesthetic — intentionally the opposite
of the dark athletic mobile app, since supporters (not runners) are the
audience here.

| Token | Value | Usage |
|---|---|---|
| `cream-50` | `#FDFAF4` | Page background |
| `cream-100` | `#FAF4E6` | Cards, inputs |
| `terra-500` | `#D4623A` | Primary CTA, accents |
| `ink-900` | `#1A0F08` | Headings |
| `ink-400` | `#8C6A52` | Body copy |
| `sage-500` | `#5A9068` | Success states |
| `Caveat` | Display font | Headings (`font-display`) |
| `DM Sans` | Body font | Body copy (`font-body`) |

Custom CSS features:
- `.noise-bg` — subtle SVG noise overlay via pseudo-element
- `.pulse-ring` — recording indicator pulse animation
- `.wave-bar` — animated waveform bar for idle state
- `.page-enter` — fade-up entrance animation for all pages

---

## Deployment (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add OPENAI_API_KEY
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_APP_URL

# Production deploy
vercel --prod
```

The `vercel.json` sets a 30-second max duration on the `/api/upload`
and `/api/tts` functions to handle larger audio files and TTS generation.

---

## Browser Support

The voice recorder uses `MediaRecorder` API with a mime type fallback chain:

1. `audio/webm;codecs=opus` — Chrome, Edge, Firefox
2. `audio/webm` — Chrome, Edge
3. `audio/ogg;codecs=opus` — Firefox
4. `audio/mp4` — Safari 14.1+

Safari note: Recording works on Safari 14.1+ (iOS 14.3+). If `MediaRecorder`
is not available, the recorder shows an error and suggests using the
"Type a message" option instead.

---

## Security Notes

- The **service role key** (`SUPABASE_SERVICE_ROLE_KEY`) is only used in
  server-side API routes and never exposed to the browser.
- All uploads go through `/api/upload` which validates:
  - Session exists and is active
  - Invite link hasn't expired
  - File size ≤ 10 MB
- The `messages` Supabase storage bucket is **public** (read), but all
  writes go through the admin client (bypasses RLS for the upload path).
  Add RLS `INSERT` policies if you want tighter control.
