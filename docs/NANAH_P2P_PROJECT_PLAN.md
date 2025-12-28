# Nanah (नन्हा) P2P Project Plan

## 0) What Nanah is

Nanah is a **general-purpose P2P transport + crypto layer** that can power:

- **FilterTube settings sync** (primary immediate integration)
- **1:1 secure chat** (later)
- **1:1 file transfer** (later)

Nanah should be:

- **Account-less**
- **End-to-end encrypted** (server never sees plaintext)
- **Browser-first** (works inside extensions / websites)
- **Small + composable** (usable by other projects)

---

## 1) Reality check: “No server at all” options

### 1.1 Why browsers usually need signaling

For WebRTC, peers must exchange connection metadata (SDP + ICE candidates). Behind NAT, they can’t discover each other directly.

So in practice you need **one of these**:

- **Option A (recommended): Minimal signaling server**
  - Only forwards SDP/ICE messages for a few seconds.
  - Does *not* carry your data stream.
  - Can run on free tiers.

- **Option B (true no-server): Manual signaling**
  - Copy/paste SDP blobs, or scan multiple QR codes.
  - Works, but UX is painful because ICE candidates trickle over time.

- **Option C (LAN-only no-server): Direct IP/port**
  - In browsers, this is not a realistic general solution.
  - NAT traversal and security constraints still apply.

### 1.2 STUN vs TURN

- **STUN** tells each peer its public-facing network info. Free public STUN servers exist (commonly used).
- **TURN** relays traffic when direct P2P fails (costly because it carries the data).

**MVP decision:** ship with **STUN only**, no TURN. Nanah works for most home/mobile networks; may fail in strict corporate networks.

---

## 2) Relationship to FilterTube (YT vs YT Kids lists)

### 2.1 Key policy decision (recommended)

- **Main YouTube (www.youtube.com)** and **YouTube Kids (www.youtubekids.com)** must be treated as **separate profiles**.
- Do **not mix kids channels/keywords** with main YouTube by default.

This is both:

- a UX decision (parents don’t want their YouTube ruined)
- a technical decision (different DOM + different expectations)

### 2.2 Whitelist works on both sites, but independently

Whitelist is a feature available on:

- Main YouTube profile
- Kids profile

…but each has its own:

- allow-list
- block-list
- mode

### 2.3 Where to place whitelist UI

You have two viable UX layouts.

#### Option A (recommended): One “Whitelist” page with a profile switch

- A single Whitelist view
- A segmented control at top:
  - `Main YouTube`
  - `YouTube Kids`

Pros:
- consistent UX
- no duplicated UI code

Cons:
- you must make the “profile switch” very obvious

#### Option B (also good): Keep whitelist UI inside each site’s section

- Main whitelist inside the existing **Filters** page
- Kids whitelist inside the existing **Kids Mode** page

Pros:
- no confusion about which profile you are editing

Cons:
- duplicated UI layout

**Recommendation:** start with **Option B** (less confusion), and later refactor to Option A once lists are mature.

### 2.4 “Whitelist Mode” toggle behavior

We should support **mode per profile**:

- `profiles.main.policy.mode = blocklist | whitelist | hybrid`
- `profiles.kids.policy.mode = blocklist | whitelist | hybrid`

Then we optionally provide convenience buttons:

- “Enable Whitelist Mode (This site only)”
- “Enable Whitelist Mode (Both sites)”

This avoids mixing lists while still allowing a single click to activate whitelist behavior for both.

---

## 3) YouTube Kids DOM strategy (based on your DOM dump)

### 3.1 Separate DOM fallback module

Kids uses different elements (`ytk-*`), so the clean approach is:

- `js/content/dom_fallback_kids.js` (new)
  - its own selectors: `ytk-compact-video-renderer`, `ytk-compact-channel-renderer`, `ytk-compact-playlist-renderer`, etc.
  - its own “hide container” logic

### 3.2 “Use native Block this video” idea

Your idea: **don’t inject our own menu item**, instead detect when the parent clicks YouTube Kids’ built-in **“Block this video”** and then add to our Kids lists.

This is a good UX idea, but we should treat it as a **best-effort assist**, not the only control.

Recommended approach:

- **We observe the click** on the menu item text `Block this video`.
- We then extract:
  - `videoId` from the nearest `href="/watch?v=..."`
  - `title` from the card
  - `channelId` if available (Kids sometimes has channel cards with `/channel/UC...`)
  - If channel identity is not available, we still store **videoId** (prevents leaks of the same video), and we can later upgrade to channel-based blocking when we can resolve owner.

Optional advanced:

- In Kids mode settings, add a toggle:
  - “Also show FilterTube advanced blocking entries in menu” (off by default)

This keeps UI clean while preserving power for edge cases.

---

## 4) Nanah architecture (project-level)

### 4.1 Goals for v1

- 1:1 pairing by OTP/QR
- direct P2P channel (WebRTC data channel)
- encryption: **ECDH + HKDF + AES-GCM**
- human verification: **SAS**
- supports:
  - small JSON payload (FilterTube sync)
  - chunked binary payload (file transfer)

### 4.2 Components

```text
+-------------------+        +------------------------+
| Nanah Client      |        | Nanah Signaling Server |
| (Browser/Ext)     |<------>| (Bun WebSocket)        |
| - WebRTC          |  SDP   | - forwards messages     |
| - Crypto          |  ICE   | - no payload storage    |
+-------------------+        +------------------------+
         |
         | (after connection)
         v
   P2P Encrypted
   DataChannel
```

### 4.3 Why Bun + TypeScript

- **Bun (server):** very small WebSocket signaling server.
- **TypeScript (client):** safer protocol + binary framing.
- **Bundling:** Bun can bundle TS -> a single browser JS file.

Important:

- Browser/extension **will not run Bun**.
- Browser/extension runs bundled `nanah-client.js`.

---

## 5) Crypto design (ECDH + HKDF + AES-GCM + SAS)

### 5.1 MVP handshake (simple and strong)

- Each peer generates ephemeral ECDH keypair.
- Exchange public keys over the signaling channel (inside SDP metadata or as separate control messages).
- Derive shared secret `ss` via ECDH.
- Derive keys via HKDF:
  - `k_send`
  - `k_recv`
  - `k_sas`
- Compute a short authentication string (SAS) from `k_sas` and display it on both devices.
- Require user confirmation: “SAS matches” before allowing app payload.

### 5.2 Why not full Noise XX immediately?

Noise XX is excellent, but v1 can still be secure with:

- ephemeral ECDH
- SAS confirmation
- transport AEAD (AES-GCM)

Then, if you want “Signal-like” formalism, we can evolve v2 to a Noise pattern.

### 5.3 Threat model notes

- Without SAS confirmation, a malicious signaling server could MITM.
- With SAS confirmation, you get strong protection against MITM.

---

## 6) Message framing (chat + files + FilterTube sync)

### 6.1 Envelope format

Nanah transports typed messages:

```ts
type NanahEnvelope =
  | { t: 'settings_sync'; id: string; json: string }
  | { t: 'chat'; id: string; text: string }
  | { t: 'file_meta'; id: string; name: string; size: number; mime?: string }
  | { t: 'file_chunk'; id: string; idx: number; total: number; bytes: ArrayBuffer }
  | { t: 'ack'; id: string; ok: boolean; error?: string };
```

### 6.2 Chunking

- Use fixed chunk size (e.g. 16KB–64KB)
- Receiver reassembles
- Optional: hash per chunk + final file hash

### 6.3 Connection lifecycle

- FilterTube sync is **one-shot**: connect → send → ack → close.
- Chat is **long-lived**: connect → keep open until user presses Stop.

---

## 7) API design (what other apps import)

### 7.1 Minimal API

```ts
class NanahClient {
  constructor(opts: { signalingUrl?: string; stunUrls?: string[] });

  host(): Promise<{ code: string }>;
  join(code: string): Promise<void>;

  send(data: NanahEnvelope): Promise<void>;

  close(): void;

  on(event: 'code' | 'sas' | 'connected' | 'data' | 'progress' | 'closed' | 'error', cb: (...args: any[]) => void): void;
}
```

### 7.2 FilterTube usage

- Sender:
  - `export = IOManager.exportPortable()`
  - `nanah.send({ t: 'settings_sync', json: JSON.stringify(export) })`

- Receiver:
  - `IOManager.importPortable(json, { strategy: 'merge' })`

---

## 8) FilterTube integration flow (OTP/QR)

### 8.1 ASCII flow

```text
[Device A: Chrome Extension]         [Signaling]            [Device B: Chrome Extension]
          |                             |                               |
          | host()                       |                               |
          |----------------------------->|                               |
          |  code=482-190                |                               |
          |<-----------------------------|                               |
          |  show QR/OTP                 |                               |
          |                             |   join(482-190)               |
          |                             |<------------------------------|
          |   exchange SDP/ICE (seconds) via signaling                    |
          |<------------------------------------------------------------>|
          |==================== WebRTC DataChannel Connected =============|
          | show SAS: "blue-sun-42"           show SAS: "blue-sun-42"     |
          | user confirms SAS               user confirms SAS            |
          |---- encrypted settings_sync -------------------------------->|
          |<------------------------ ack(ok) ----------------------------|
          | close()                                                     close()
```

### 8.2 What user experiences

- No account
- No install
- No “upload” to your servers
- Just:
  - open FilterTube → Settings → Sync
  - show code/QR
  - other device enters code
  - done

---

## 9) Deployment options (no money)

### 9.1 Signaling server hosting

- Free tiers are fine because signaling bandwidth is tiny.
- You can also run it locally for development.

### 9.2 If you truly want “zero infra”

Support Manual Signaling Mode:

- Device A shows QR of Offer
- Device B scans → produces Answer QR
- Device A scans
- Then you still need trickle ICE exchange (multiple QRs)

This is educational, but not the default UX.

---

## 10) Decisions to confirm

1. **Whitelist UI location**
   - A) One Whitelist page with profile switch
   - B) Separate Whitelist sections inside Filters (Main) and Kids Mode (Kids)  **(recommended)**

2. **Whitelist Mode toggle**
   - A) Per-profile only (main toggle inside main, kids toggle inside kids)
   - B) Per-profile + convenience “apply to both” button **(recommended)**

3. **Kids block integration**
   - A) Intercept native “Block this video” and store videoId/channelId best-effort **(recommended)**
   - B) Inject our own FilterTube menu items in Kids too

---

## 11) Next steps

- Create a dedicated **Nanah repo** (separate from FilterTube) once you approve the above.
- For FilterTube itself, implement Phase 1 Import/Export first (so Nanah has a stable portable payload).
