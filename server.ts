import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { WebcastPushConnection } from 'tiktok-live-connector/legacy';

const app = express();
const PORT = 3000;

app.use(express.json());

// State for active TikTok connection
interface TikTokState {
  [key: string]: unknown;
  connected: boolean;
  username: string | null;
  roomId: string | null;
  viewerCount: number;
  lastError: string | null;
}

let tiktokConnection: any = null;
const state: TikTokState = {
  connected: false,
  username: null,
  roomId: null,
  viewerCount: 0,
  lastError: null,
};

// SSE Client subscriptions
const sseClients = new Set<Response>();

function broadcastSse(eventType: string, data: Record<string, unknown>) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
}

// 1. SSE Stream for Live Events
app.get('/api/tiktok/events', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send current status on connect
  res.write(`event: status\ndata: ${JSON.stringify(state)}\n\n`);

  sseClients.add(res);

  const heartbeat = setInterval(() => {
    res.write(': ping\n\n');
  }, 15000);

  _req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// 2. Status Endpoint
app.get('/api/tiktok/status', (_req: Request, res: Response) => {
  res.json({
    ...state,
    clientCount: sseClients.size,
  });
});

// 3. Connect to TikTok Live
app.post('/api/tiktok/connect', async (req: Request, res: Response) => {
  try {
    let { username, sessionId } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    username = String(username).trim().replace(/^@/, '');

    // Disconnect existing if any
    if (tiktokConnection) {
      try {
        tiktokConnection.disconnect();
      } catch {
        // ignore
      }
      tiktokConnection = null;
    }

    state.connected = false;
    state.username = username;
    state.lastError = null;

    const options: Record<string, unknown> = {
      enableExtendedGiftInfo: true,
    };
    if (sessionId || process.env.TIKTOK_SESSION_ID) {
      options.sessionId = sessionId || process.env.TIKTOK_SESSION_ID;
    }

    const connection = new WebcastPushConnection(username, options as any);

    // Setup event listeners
    connection.on('connected', (roomInfo: any) => {
      state.connected = true;
      state.roomId = roomInfo?.roomId || null;
      state.lastError = null;
      broadcastSse('status', state);
      broadcastSse('system', { message: `Connected to @${username}'s live stream!` });
    });

    connection.on('disconnected', () => {
      state.connected = false;
      broadcastSse('status', state);
      broadcastSse('system', { message: `Disconnected from @${username}` });
    });

    connection.on('streamEnd', () => {
      state.connected = false;
      broadcastSse('status', state);
      broadcastSse('system', { message: `Live stream ended for @${username}` });
    });

    connection.on('chat', (data: any) => {
      broadcastSse('chat', {
        username: data.uniqueId ? `@${data.uniqueId}` : '@Viewer',
        comment: data.comment,
        avatar: data.profilePictureUrl || `https://i.pravatar.cc/100?u=${encodeURIComponent(data.uniqueId || 'user')}`,
        timestamp: Date.now(),
      });
    });

    connection.on('gift', (data: any) => {
      const diamondCount = Number(data.diamondCount) || 1;
      const repeatCount = Number(data.repeatCount) || 1;
      const totalDiamonds = diamondCount * repeatCount;

      broadcastSse('gift', {
        username: data.uniqueId ? `@${data.uniqueId}` : '@Viewer',
        avatar: data.profilePictureUrl || `https://i.pravatar.cc/100?u=${encodeURIComponent(data.uniqueId || 'user')}`,
        gift: data.giftName || 'Gift',
        value: totalDiamonds,
        streak: repeatCount,
        timestamp: Date.now(),
      });
    });

    connection.on('roomUser', (data: any) => {
      state.viewerCount = data.viewerCount || 0;
      broadcastSse('roomUser', { viewerCount: state.viewerCount });
    });

    connection.on('like', (data: any) => {
      broadcastSse('like', {
        username: data.uniqueId ? `@${data.uniqueId}` : '@Viewer',
        likeCount: data.likeCount || 1,
      });
    });

    tiktokConnection = connection;

    const roomInfo = await connection.connect();
    state.connected = true;
    state.roomId = roomInfo?.roomId || null;

    res.json({
      success: true,
      username,
      roomId: roomInfo?.roomId,
      message: `Successfully connected to @${username}'s live stream`,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    state.connected = false;
    state.lastError = errorMsg;
    broadcastSse('status', state);

    res.status(500).json({
      success: false,
      error: errorMsg,
      hint: 'Make sure the user is currently streaming LIVE on TikTok and the username is typed correctly.',
    });
  }
});

// 4. Disconnect Endpoint
app.post('/api/tiktok/disconnect', (_req: Request, res: Response) => {
  if (tiktokConnection) {
    try {
      tiktokConnection.disconnect();
    } catch {
      // ignore
    }
    tiktokConnection = null;
  }
  state.connected = false;
  state.username = null;
  broadcastSse('status', state);
  res.json({ success: true, message: 'Disconnected' });
});

// 5. Webhook receiver for Official TikTok Developer API or third-party webhooks
app.post('/api/tiktok/webhook', (req: Request, res: Response) => {
  const payload = req.body;
  // Handle different event types from webhook
  if (payload.type === 'gift' || payload.event === 'gift') {
    broadcastSse('gift', {
      username: payload.username || `@${payload.sender || 'Viewer'}`,
      avatar: payload.avatar || `https://i.pravatar.cc/100?u=${encodeURIComponent(payload.username || 'user')}`,
      gift: payload.gift || payload.gift_name || 'Gift',
      value: Number(payload.value || payload.diamonds || 1),
      streak: Number(payload.streak || 1),
      timestamp: Date.now(),
    });
  } else if (payload.type === 'chat' || payload.event === 'comment') {
    broadcastSse('chat', {
      username: payload.username || `@${payload.sender || 'Viewer'}`,
      comment: payload.comment || payload.text || payload.message,
      avatar: payload.avatar,
      timestamp: Date.now(),
    });
  } else {
    broadcastSse('webhook', payload);
  }

  res.json({ received: true });
});

// 6. Real TikTok Profile Lookup, Avatar Proxy & Simulator helpers
const avatarCache = new Map<string, { buffer: Buffer; contentType: string; timestamp: number }>();

app.get('/api/tiktok/avatar/:username', async (req: Request, res: Response) => {
  const rawUser = String(req.params.username || '').trim().replace(/^@/, '');
  if (!rawUser) {
    return res.redirect('https://unavatar.io/tiktok/mrbeast');
  }
  const clean = rawUser.toLowerCase();

  // Return from in-memory cache if valid (cached for 1 hour)
  const cached = avatarCache.get(clean);
  if (cached && Date.now() - cached.timestamp < 3600000) {
    res.setHeader('Content-Type', cached.contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(cached.buffer);
  }

  // 1. Fetch real TikTok profile photo from unavatar.io
  try {
    const upstream = await fetch(`https://unavatar.io/tiktok/${encodeURIComponent(clean)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    });
    if (upstream.ok) {
      const contentType = upstream.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await upstream.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      avatarCache.set(clean, { buffer, contentType, timestamp: Date.now() });
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(buffer);
    }
  } catch {}

  // 2. Cross-platform creator lookup fallback (YouTube / Twitter / Instagram)
  try {
    const fallbackRes = await fetch(`https://unavatar.io/${encodeURIComponent(clean)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (fallbackRes.ok) {
      const contentType = fallbackRes.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await fallbackRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      avatarCache.set(clean, { buffer, contentType, timestamp: Date.now() });
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(buffer);
    }
  } catch {}

  // 3. Fallback to direct unavatar redirect
  return res.redirect(`https://unavatar.io/tiktok/${encodeURIComponent(clean)}`);
});

app.get('/api/tiktok/user-profile', async (req: Request, res: Response) => {
  const rawUser = String(req.query.username || '').trim().replace(/^@/, '');
  if (!rawUser) {
    return res.status(400).json({ error: 'Username is required' });
  }
  const clean = rawUser.toLowerCase();
  try {
    const oembedRes = await fetch(
      `https://www.tiktok.com/oembed?url=https://www.tiktok.com/@${encodeURIComponent(clean)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    let authorName = clean;
    if (oembedRes.ok) {
      const data: any = await oembedRes.json();
      authorName = data.author_name || clean;
    }
    res.json({
      username: `@${clean}`,
      nickname: authorName,
      avatar: `https://unavatar.io/tiktok/${encodeURIComponent(clean)}`,
      profileUrl: `https://www.tiktok.com/@${clean}`,
    });
  } catch {
    res.json({
      username: `@${clean}`,
      nickname: clean,
      avatar: `https://unavatar.io/tiktok/${encodeURIComponent(clean)}`,
      profileUrl: `https://www.tiktok.com/@${clean}`,
    });
  }
});

app.post('/api/tiktok/simulate-gift', (req: Request, res: Response) => {
  const rawUser = String(req.body.username || '@mrbeast').trim();
  const cleanUser = rawUser.replace(/^@/, '').toLowerCase();
  const gift = {
    username: rawUser.startsWith('@') ? rawUser : `@${rawUser}`,
    nickname: req.body.nickname,
    avatar: req.body.avatar || `https://unavatar.io/tiktok/${encodeURIComponent(cleanUser)}`,
    gift: req.body.gift || 'Rose',
    value: Number(req.body.value) || 1,
    streak: Number(req.body.streak) || 1,
    timestamp: Date.now(),
  };
  broadcastSse('gift', gift);
  res.json({ success: true, gift });
});

app.post('/api/tiktok/simulate-comment', (req: Request, res: Response) => {
  const rawUser = String(req.body.username || '@mrbeast').trim();
  const cleanUser = rawUser.replace(/^@/, '').toLowerCase();
  const comment = {
    username: rawUser.startsWith('@') ? rawUser : `@${rawUser}`,
    comment: req.body.comment || 'vouch',
    avatar: req.body.avatar || `https://unavatar.io/tiktok/${encodeURIComponent(cleanUser)}`,
    timestamp: Date.now(),
  };
  broadcastSse('chat', comment);
  res.json({ success: true, comment });
});

// 7. Standalone Transparent OBS Overlay Page
// Users and OBS Studio can load /auction-overlay or /overlay as a Browser Source
app.get(['/auction-overlay', '/overlay'], (_req: Request, res: Response) => {
  const overlayHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>TikTok Auction Overlay</title>
<style>
*{box-sizing:border-box}
html,body{margin:0;width:100%;height:100%;background:transparent;overflow:hidden}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#fff}
#overlay{position:relative;width:375px;height:667px;padding:12px 14px;background:radial-gradient(circle at 50% 10%,#10121a 0%,#08090d 60%,#050608 100%);overflow:hidden;border-radius:18px;border:1px solid rgba(255,255,255,.08);display:flex;flex-direction:column;justify-content:space-between}

/* Header Pills */
.header-box{display:flex;flex-direction:column;gap:8px}

.vouch-pill{height:34px;border-radius:12px;border:1px solid rgba(245,158,11,.5);background:#161208;padding:0 12px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 0 10px rgba(245,158,11,.12)}
.vouch-pill .left{display:flex;align-items:center;gap:6px;color:#fde047;font-weight:900;font-size:12px;letter-spacing:.3px}
.vouch-pill .star{font-size:14px}
.vouch-badge{background:#f59e0b;color:#0c0a09;font-weight:900;font-size:11px;padding:2px 8px;border-radius:8px}

.min-pill{height:36px;border-radius:12px;border:1.5px solid #00e599;background:#072218;display:flex;align-items:center;justify-content:center;gap:8px;padding:0 12px;box-shadow:0 0 12px rgba(0,229,153,.15)}
.min-pill .check-icon{width:18px;height:18px;border-radius:5px;background:rgba(0,229,153,.2);border:1px solid #00e599;color:#00e599;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900}
.min-pill .min-text{font-size:13px;font-weight:900;color:#00e599;letter-spacing:.5px}

.delay-pill-row{height:38px;border-radius:12px;border:1px solid #1e2438;background:#0d0f18;display:flex;align-items:center;justify-content:space-between;padding:0 12px;box-shadow:0 2px 8px rgba(0,0,0,.4)}
.delay-pill-row .left{display:flex;align-items:center;gap:8px;color:#fff;font-weight:900;font-size:12px;letter-spacing:.5px}
.delay-shield{color:#38bdf8;font-size:15px}
.delay-badge{background:#ff4b4b;color:#fff;font-weight:900;font-size:12px;padding:3px 10px;border-radius:8px;letter-spacing:.4px}

/* Dynamic Timer */
.timer-container{height:66px;display:flex;align-items:center;justify-content:center;margin:4px 0}
.timer-cyan{font-family:monospace,'SF Pro',Arial,sans-serif;font-size:38px;font-weight:900;color:#00f5b8;letter-spacing:1px;text-shadow:0 0 16px rgba(0,245,184,.9),0 0 32px rgba(0,245,184,.45);transition:all .2s ease}
.timer-cyan.pulse{animation:heartbeat .85s infinite ease-in-out}
.timer-snipe{font-size:28px;font-weight:900;color:#ff4d36;letter-spacing:.5px;text-shadow:0 0 16px rgba(255,77,54,.95),0 0 32px rgba(255,77,54,.5);display:flex;align-items:center;gap:10px;animation:snipePulse .9s infinite alternate ease-in-out}
.timer-snipe .clock{font-family:monospace;font-size:32px}
.timer-tie{font-size:24px;font-weight:900;color:#f59e0b;letter-spacing:.5px;text-shadow:0 0 16px rgba(245,158,11,.95),0 0 32px rgba(245,158,11,.5);display:flex;align-items:center;gap:8px;animation:snipePulse .9s infinite alternate ease-in-out}
.timer-tie .clock{font-family:monospace;font-size:30px;color:#fff;background:rgba(245,158,11,.2);border:1px solid rgba(245,158,11,.4);padding:2px 8px;border-radius:10px}
.tie-pill-row{display:none;align-items:center;justify-content:space-between;padding:0 12px;height:34px;border-radius:12px;background:#1c1407;border:1px solid rgba(245,158,11,.7);font-size:12px;font-weight:900;box-shadow:0 0 12px rgba(245,158,11,.25);animation:heartbeat 1.5s infinite;margin-bottom:6px}
.tie-pill-row.show{display:flex}
.tie-badge{background:#f59e0b;color:#0c0a09;padding:2px 8px;border-radius:8px;font-size:11px;font-weight:900}

@keyframes heartbeat{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
@keyframes snipePulse{0%{opacity:.85;transform:scale(.98)}100%{opacity:1;transform:scale(1.02)}}

/* Leaderboard Items */
#items{display:flex;flex-direction:column;gap:10px;flex:1;margin:4px 0;overflow:hidden}
.empty{height:160px;border:2px dashed rgba(255,255,255,.2);border-radius:16px;background:rgba(13,15,23,.8);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#94a3b8;font-size:12px;padding:16px;text-align:center}
.item{height:76px;border-radius:16px;border:2px solid #2a2e3d;background:#0d1017;display:flex;align-items:center;padding:8px 12px;gap:10px;box-shadow:0 2px 10px rgba(0,0,0,.4);transition:all .2s ease}
.item.rank-1{border-color:#eab308;background:linear-gradient(90deg,#171207 0%,#120e06 50%,#0f0c05 100%);box-shadow:0 0 15px rgba(234,179,8,.22)}
.item.rank-2{border-color:#9ca3af;background:linear-gradient(90deg,#141720 0%,#0d0f14 100%);box-shadow:0 0 10px rgba(156,163,175,.15)}
.item.rank-3{border-color:#b45309;background:linear-gradient(90deg,#181109 0%,#0f0b06 100%);box-shadow:0 0 10px rgba(180,83,9,.15)}

/* Ribbon Medal SVG container */
.medal-box{width:34px;height:40px;flex:0 0 34px;display:flex;align-items:center;justify-content:center}
.avatar{width:46px;height:46px;flex:0 0 46px;border-radius:12px;object-fit:cover;background:#171923;border:1px solid rgba(255,255,255,.15)}
.rank-1 .avatar{border-color:rgba(234,179,8,.6)}

.info{min-width:0;flex:1}
.name-row{display:flex;align-items:center;gap:6px;font-size:15px;font-weight:900;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.name-row .emoji{font-size:14px;flex-shrink:0}
.name-row .uname{overflow:hidden;text-overflow:ellipsis}
.equal-badge{font-size:9px;background:rgba(245,158,11,.25);border:1px solid rgba(245,158,11,.5);color:#fbbf24;padding:1px 5px;border-radius:4px;font-weight:900;flex-shrink:0}
.val-row{display:flex;align-items:center;gap:6px;margin-top:2px;font-size:17px;font-weight:900;color:#fff}
.val-row .coin{font-size:14px}
.val-row .streak{font-size:11px;color:#94a3b8;font-weight:700}

/* Footer Total Pill */
#footer{padding-top:6px;display:flex;justify-content:center}
.total-pill{display:inline-flex;align-items:center;gap:8px;padding:6px 16px;border-radius:12px;background:#16132a;border:1px solid #382b60;color:#c8c0ed;font-size:12px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,.3)}
.total-pill b{color:#fff}

/* Vouch confirmation overlay modal */
#vouchShade{position:absolute;inset:0;background:rgba(0,0,0,.65);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);display:none;z-index:30}
#vouchShade.show{display:flex;align-items:center;justify-content:center;padding:24px;animation:fadeIn .18s ease}
#vouchCard{width:100%;min-height:170px;padding:20px 16px;border-radius:18px;border:2px solid #54f48b;background:linear-gradient(180deg,#08a94d 0%,#079a45 100%);box-shadow:0 12px 36px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.25);text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center}
.vouch-check{width:28px;height:28px;border-radius:50%;background:#fff;color:#08a94d;font-size:18px;font-weight:900;line-height:28px;margin-bottom:4px;box-shadow:0 2px 6px rgba(0,0,0,.25)}
.vouch-title{font-size:22px;line-height:1.1;font-weight:900;letter-spacing:.3px;color:#fff;text-shadow:0 1px 2px #005627}
.vouch-user{margin-top:6px;font-size:16px;font-weight:900;color:#fff}
.vouch-instruction{margin-top:8px;font-size:11px;line-height:1.35;color:#fff;font-weight:800;max-width:240px}
.vouch-status{margin-top:8px;display:none;font-size:12px;font-weight:900;color:#eafff1;background:rgba(0,0,0,.25);padding:4px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.2)}
.vouch-secured{margin-top:12px;font-size:9px;color:#b9ffd0;font-weight:700}
.vouch-secured b{color:#e4ffe9}
#vouchShade.confirmed #vouchCard{background:linear-gradient(180deg,#0b9b49,#087e3c);border-color:#86ffad}
#vouchShade.confirmed .vouch-status{display:block}
#vouchShade.confirmed .vouch-instruction{display:none}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
</style>
</head>
<body>
<div id="overlay">
  <div class="header-box">
    <div class="vouch-pill">
      <div class="left"><span class="star">⭐</span><span>AUCTION VOUCHES</span></div>
      <div class="vouch-badge" id="vouchBalance">945</div>
    </div>
    <div class="min-pill">
      <div class="check-icon">✓</div>
      <div class="min-text" id="minText">NO MINIMUM</div>
    </div>
    <div class="delay-pill-row">
      <div class="left"><span class="delay-shield">🛡️</span><span>SNIPE DELAY</span></div>
      <span class="delay-badge" id="delayValue">30S</span>
    </div>
    <div class="tie-pill-row" id="tiePill">
      <div class="left"><span style="color:#f59e0b">⚖️</span><span style="color:#fcd34d">TIEBREAKER ACTIVE</span></div>
      <span class="tie-badge">+30S DELAY</span>
    </div>
    <div class="timer-container" id="timerContainer">
      <div class="timer-cyan" id="timerText">0:30</div>
    </div>
  </div>

  <div id="items"></div>
  <div id="empty" class="empty" style="display:none">
    <div style="font-size:24px;margin-bottom:4px">🎁</div>
    <b style="color:#fff;font-size:13px">Waiting for gifts...</b>
    <div style="margin-top:4px">Send a TikTok gift to join the auction!</div>
  </div>

  <div id="footer">
    <div class="total-pill">
      <span style="color:#a78bfa">👥</span>
      <span>Total participants: <b id="count">0</b></span>
    </div>
  </div>

  <div id="vouchShade" aria-live="polite" aria-hidden="true">
    <div id="vouchCard">
      <div class="vouch-check">✓</div>
      <div class="vouch-title">VOUCH AVAILABLE</div>
      <div class="vouch-user" id="vouchUser">@winner ✓</div>
      <div class="vouch-instruction">Type <b>"vouch"</b> in chat to confirm your trade</div>
      <div class="vouch-status" id="vouchStatus">✓ VOUCH CONFIRMED</div>
      <div class="vouch-secured">Secured by <b>BattleTik.app</b></div>
    </div>
  </div>
</div>
<script>
const timerContainer=document.getElementById('timerContainer'),items=document.getElementById('items'),empty=document.getElementById('empty'),count=document.getElementById('count');
const vouchShade=document.getElementById('vouchShade'),vouchUser=document.getElementById('vouchUser'),vouchStatus=document.getElementById('vouchStatus');
const vouchBalance=document.getElementById('vouchBalance'),delayValue=document.getElementById('delayValue'),minText=document.getElementById('minText'),tiePill=document.getElementById('tiePill');

function fmt(s){s=Math.max(0,Math.floor(Number(s)||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
function money(n){return Number(n||0).toLocaleString()}

function makeMedalSvg(rank, isTied){
  let fill='#eab308', stroke='#fef08a', textCol='#451a03', rLeft='#2563eb', rRight='#1d4ed8';
  if(rank===2){fill='#94a3b8';stroke='#f1f5f9';textCol='#0f172a';rLeft='#3b82f6';rRight='#2563eb'}
  else if(rank===3){fill='#b45309';stroke='#fde68a';textCol='#451a03';rLeft='#3b82f6';rRight='#1d4ed8'}
  else if(rank>3){fill='#475569';stroke='#94a3b8';textCol='#f8fafc';rLeft='#1e3a8a';rRight='#172554'}
  return '<svg width="34" height="40" viewBox="0 0 34 40" fill="none">'
    +'<path d="M10 19L5 37L11 33.5L16.5 36.5L14 19H10Z" fill="'+rLeft+'"/>'
    +'<path d="M16 19L18.5 36.5L24 33.5L30 37L25 19H16Z" fill="'+rRight+'"/>'
    +'<path d="M12 18L17 21L22 18H12Z" fill="#1e1b4b" opacity="0.4"/>'
    +'<circle cx="17" cy="15" r="12.5" fill="'+fill+'" stroke="'+stroke+'" stroke-width="1.5"/>'
    +'<circle cx="17" cy="15" r="9.5" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>'
    +'<text x="17" y="'+(isTied?'19':'19.5')+'" font-family="sans-serif" font-weight="900" font-size="'+(isTied?'10':'13')+'" fill="'+textCol+'" text-anchor="middle">'
    +(isTied?'⚖️':rank)+'</text></svg>';
}

function getSafeAvatar(cleanU, providedAvatar){
  if(providedAvatar && providedAvatar.length>5 && !providedAvatar.includes('/bottts/')) return providedAvatar;
  return 'https://unavatar.io/tiktok/'+encodeURIComponent(cleanU||'user');
}

function showVouch(winner, confirmed, vouches, req){
  if(!winner){vouchShade.classList.remove('show','confirmed');vouchShade.setAttribute('aria-hidden','true');return}
  vouchUser.textContent=(winner.username||'@winner') + ' ✓';
  vouchStatus.textContent=confirmed ? ('✓ VOUCH CONFIRMED ('+(vouches||1)+'/'+(req||1)+')') : '';
  vouchShade.classList.toggle('confirmed',!!confirmed);
  vouchShade.classList.add('show');
  vouchShade.setAttribute('aria-hidden','false');
}

function render(s){
  const tieActive = Boolean(s.isTieDelay || (Number(s.tieSeconds)||0) > 0);
  const snipeActive = !tieActive && Boolean(s.isSnipeDelay || (Number(s.delaySeconds)||0) > 0);
  const curSeconds = tieActive ? (Number(s.tieSeconds) || 30) : snipeActive ? (Number(s.delaySeconds) || s.seconds) : s.seconds;

  // Render Timer with smooth state-based animations
  if(tieActive){
    timerContainer.innerHTML = '<div class="timer-tie"><span>⚖️ TIE DELAY</span><span class="clock">'+fmt(curSeconds)+'</span></div>';
    if(tiePill) tiePill.classList.add('show');
  } else if(snipeActive){
    timerContainer.innerHTML = '<div class="timer-snipe"><span>SNIPE DELAY</span><span class="clock">'+fmt(curSeconds)+'</span></div>';
    if(tiePill) tiePill.classList.remove('show');
  } else {
    const isLow = s.seconds <= 10;
    timerContainer.innerHTML = '<div class="timer-cyan '+(isLow?'pulse':'')+'">'+fmt(s.seconds)+'</div>';
    if(tiePill) tiePill.classList.remove('show');
  }

  // Update Top Pills
  if(s.minimum > 0){
    minText.textContent = 'MINIMUM ' + money(s.minimum) + ' 💎';
  } else {
    minText.textContent = 'NO MINIMUM';
  }
  delayValue.textContent = (s.delay || 30) + 'S';

  const isVouchDone = Number(s.vouches||0) >= Number(s.requiredVouches||1);
  if(s.currentWinner){
    vouchBalance.textContent = (s.vouches||0) + '/' + (s.requiredVouches||1) + (isVouchDone?' ✓':'');
  } else {
    vouchBalance.textContent = money(s.vouchesBalance !== undefined ? s.vouchesBalance : 945);
  }

  // Render Leaderboard Cards
  const a=[...(s.participants||[])].sort((x,y)=>(Number(y.value)||0)-(Number(x.value)||0));
  const maxVal = a.length ? (Number(a[0].value) || 0) : 0;
  count.textContent = a.length;
  items.innerHTML = '';
  empty.style.display = a.length ? 'none' : 'flex';

  a.slice(0, 4).forEach((p, i)=>{
    const val = Number(p.value) || 0;
    const isTop = val === maxVal && maxVal > 0;
    const isTied = isTop && a.filter(x => (Number(x.value) || 0) === maxVal).length > 1;

    const row = document.createElement('div');
    row.className = 'item rank-' + (i + 1);
    if(isTied){
      row.style.borderColor = '#f59e0b';
      row.style.boxShadow = '0 0 15px rgba(245,158,11,0.35)';
    }

    const medalBox = document.createElement('div');
    medalBox.className = 'medal-box';
    medalBox.innerHTML = makeMedalSvg(i + 1, isTied);

    const cleanU = String(p.username || '').replace(/^@/, '');
    const img = document.createElement('img');
    img.className = 'avatar';
    img.referrerPolicy = 'no-referrer';
    img.src = getSafeAvatar(cleanU, p.avatar);
    img.onerror = () => {
      img.onerror = null;
      img.src = '/api/tiktok/avatar/' + encodeURIComponent(cleanU || 'user');
    };

    const info = document.createElement('div');
    info.className = 'info';

    const giftStr = String(p.gift || 'Gift');
    const emoji = giftStr.includes('🦁') ? '🦁' : giftStr.includes('👑') ? '👑' : giftStr.includes('🔥') ? '🔥' : giftStr.includes('🌹') ? '🌹' : '🎁';

    const nameRow = document.createElement('div');
    nameRow.className = 'name-row';
    nameRow.innerHTML = '<span class="emoji">'+emoji+'</span><span class="uname">'+(p.username||'@Viewer')+'</span>' + (isTied ? '<span class="equal-badge">EQUAL</span>' : '');

    const valRow = document.createElement('div');
    valRow.className = 'val-row';
    valRow.innerHTML = '<span>'+money(p.value)+'</span><span class="coin">🟡</span>' + (p.streak>1 ? '<span class="streak">x'+p.streak+'</span>' : '');

    info.append(nameRow, valRow);
    row.append(medalBox, img, info);
    items.append(row);
  });

  if(s.currentWinner){
    showVouch(s.currentWinner, isVouchDone, s.vouches, s.requiredVouches);
  } else {
    showVouch(null, false, 0, 1);
  }
}
let lastState={seconds:28,participants:[],currentWinner:null,vouches:0,requiredVouches:1,delay:30,delaySeconds:0,isSnipeDelay:false,minimum:0,vouchesBalance:945};
render(lastState);

// Sync via BroadcastChannel
const bc=new BroadcastChannel('tiktok-auction-overlay');
bc.onmessage=e=>{lastState={...lastState,...(e.data||{})};render(lastState)};

// Also sync via Server-Sent Events (SSE) for remote OBS browser sources
try {
  const es=new EventSource('/api/tiktok/events');
  es.addEventListener('auctionState', e => {
    try {
      const data = JSON.parse(e.data);
      lastState = { ...lastState, ...data };
      render(lastState);
    } catch(err){}
  });
} catch(err){}
</script>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(overlayHtml);
});

// Broadcast auction state from dashboard to SSE clients
app.post('/api/auction/sync', (req: Request, res: Response) => {
  broadcastSse('auctionState', req.body);
  res.json({ success: true });
});

// Integrate Vite
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
