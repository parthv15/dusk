## Global Instructions

Before making changes, read `/Users/parthvyas/AGENTS.md` and follow it. Important standing rules from the global file:

- The user sets product direction and judgment calls. Agents should handle implementation decisions unless input is genuinely required.
- Default to doing rather than asking. Surface only decisions that matter.
- Never run database migration scripts. Present migrations for the user to run manually.
- Do not use em dashes in written output or committed docs. Use normal hyphens.
- Do not add an agent name or co-author line to commit messages.
- Prefer quality, simplicity, robustness, scalability, and long-term maintainability over lower development cost.
- Hold UI work to a high standard. Be precise about spacing, alignment, responsive behavior, and visual polish.

## Product Context

Dusk is a no-install, no-account YouTube watch-together app for long distance couples.

Core promise:

- Two people can open a link and watch YouTube together.
- Playback stays in sync without screen sharing.
- Built-in audio/video lets them be together without needing Zoom.
- The experience should feel intimate, simple, fast, and polished.

Primary user:

- A long distance couple using the product privately and repeatedly.
- This is not a generic group watch-party product in v1.

Design posture:

- Quiet, warm, and refined rather than loud or novelty-driven.
- The app should feel like a cozy shared room, not a SaaS dashboard.
- Keep the first experience direct: create or join a room, paste/open a YouTube video, connect media, watch together.

## Source Product Docs

The project docs live outside this repository:

- `/Users/parthvyas/Documents/gyan/Projects/Dusk/Architecture.md`
- `/Users/parthvyas/Documents/gyan/Projects/Dusk/🌇 Dusk.md`

Read these when making product or architecture decisions. Treat this `AGENTS.md` as the compact repo-level operating guide, not a replacement for those docs.

## V1 Architecture

Dusk has two different real-time systems, and they must be handled differently.

### Playback Sync

Use WebSockets via Socket.io.

- The server is the source of truth for room playback state.
- Clients emit playback events such as play, pause, seek, and timestamp updates.
- The server validates/normalizes events, updates Redis room state, and broadcasts to the other participant.
- Clients apply remote playback changes through the YouTube IFrame API.

Expected flow:

```text
YouTube IFrame event
-> Socket.io event to server
-> Redis room state update
-> Socket.io broadcast to room
-> remote client calls YouTube IFrame API
```

Do not use HTTP polling for playback sync.

### Audio And Video

Use WebRTC peer-to-peer media.

- Media must not flow through the application server.
- The server only handles signaling: offer, answer, ICE candidates, join/leave presence.
- Once the peer connection is established, audio/video flows directly between browsers.

Expected flow:

```text
Client A/B join room
-> Socket.io signaling exchange
-> WebRTC peer connection established
-> media flows peer-to-peer
```

## Stack Decisions

Use these defaults unless the user explicitly changes direction:

- Frontend: Next.js.
- Realtime server: Node.js with Socket.io.
- Room state: Redis with TTL.
- Media: WebRTC.
- Frontend hosting: Vercel.
- Realtime server hosting: Fly.io.
- Deployment packaging: Docker for the server.

Important constraints:

- No Postgres in v1.
- No accounts in v1.
- No watch history in v1.
- No Go backend in v1.
- Do not build raw WebSockets unless the user asks. Socket.io is the v1 choice because rooms, broadcasting, and reconnect behavior are part of the product surface.
- Do not host the WebSocket server on Vercel serverless functions. WebSockets need long-lived connections.

## State Model

Redis is the source of truth for ephemeral room state.

Use Redis for:

- Room existence.
- Participants and presence.
- Current video ID or URL.
- Playback status: playing, paused, current timestamp, last updated time.
- Room TTL and expiry.
- Any short-lived signaling/session metadata that is safe to lose.

Avoid persistent storage until the product explicitly needs accounts, saved rooms, history, billing, or analytics.

## Key Open Questions

Keep these visible while designing:

- What happens when one user disconnects and reconnects mid-session?
- How long should Redis rooms live after both users disconnect?
- How should host ownership or control conflicts work when both users interact with playback?
- What is the fallback when WebRTC P2P fails because of NAT/firewall restrictions?
- What mobile browser constraints affect YouTube IFrame, autoplay, camera, and microphone permissions?

If a choice here affects product behavior, make a clear recommendation and ask the user only when the direction is genuinely product-defining.

## Implementation Principles

- Keep the v1 code small and explicit. Avoid generic abstractions until repeated behavior proves they are needed.
- Model real-time behavior as events with clear payloads and ownership.
- Make server-side room state authoritative. Do not trust clients as the source of truth.
- Handle reconnects, duplicate events, stale timestamps, and participant leave events deliberately.
- Put shared event names and payload types in one place so frontend and server cannot drift.
- Prefer deterministic sync calculations over ad hoc client-side fixes.
- Log enough realtime state transitions to debug sync without exposing private media or unnecessary user data.
- Treat latency, clock drift, and out-of-order events as expected conditions.

## UI Expectations

- Build the actual watching experience first, not a marketing page.
- Optimize for a two-person shared room: video, partner presence, call controls, share link, and simple playback state.
- Controls should be obvious, stable, and touch-friendly.
- Avoid clutter. Avoid dashboard-like chrome unless it directly helps the watching session.
- Use real visual hierarchy, spacing, and responsive constraints. Text and controls must not overlap on mobile or desktop.
- For polished product pages later, use real or generated visual assets that show the actual Dusk experience.

## Verification

For meaningful changes, verify the path that was touched:

- Frontend: run the relevant typecheck, lint, build, or test command once those scripts exist.
- Realtime server: run the relevant test/build command once scripts exist.
- WebSocket/WebRTC behavior: prefer a local two-tab or browser automation check when practical.
- UI changes: inspect desktop and mobile viewports before considering the work complete.

If a verification step cannot be run, state why in the final response.
