import { useState } from 'react';
import { X, Wifi, WifiOff, Send, Gift, MessageSquare, Copy, Check, Info, Radio, Sparkles, RefreshCw } from 'lucide-react';
import { TikTokStatus, LiveStreamEvent } from '../types';
import { TIKTOK_GIFT_CATALOG, REAL_TIKTOK_CREATORS } from '../data/giftCatalog';

interface TikTokApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: TikTokStatus;
  events: LiveStreamEvent[];
  onConnect: (username: string) => Promise<void>;
  onDisconnect: () => Promise<void>;
  onSimulateGift: (username: string, gift: string, diamonds: number) => Promise<void>;
  onSimulateComment: (username: string, comment: string) => Promise<void>;
  leaderDiamondValue?: number;
  leaderUsername?: string;
}

export function TikTokApiModal({
  isOpen,
  onClose,
  status,
  events,
  onConnect,
  onDisconnect,
  onSimulateGift,
  onSimulateComment,
  leaderDiamondValue,
  leaderUsername,
}: TikTokApiModalProps) {
  const [usernameInput, setUsernameInput] = useState(status.username || '');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'webhook' | 'events' | 'simulator'>('live');
  const [copied, setCopied] = useState(false);

  // Simulator state
  const [simUser, setSimUser] = useState('@mrbeast');
  const [simGift, setSimGift] = useState('Galaxy');
  const [simComment, setSimComment] = useState('vouch');

  if (!isOpen) return null;

  const webhookUrl = `${window.location.origin}/api/tiktok/webhook`;

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    setLoading(true);
    try {
      await onConnect(usernameInput.trim());
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectClick = async () => {
    setLoading(true);
    try {
      await onDisconnect();
    } finally {
      setLoading(false);
    }
  };

  const handleCopyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleSendSimGift = async () => {
    const diamonds = TIKTOK_GIFT_CATALOG[simGift] || 1;
    await onSimulateGift(simUser, simGift, diamonds);
  };

  const handleSendSimComment = async () => {
    await onSimulateComment(simUser, simComment);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#15152b] border border-[#3c3c5e] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-white shadow-2xl animate-in fade-in duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#2d2d48] flex items-center justify-between bg-[#191932]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff2d78] to-[#7c4dff] flex items-center justify-center font-black text-xl shadow-lg">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">TikTok LIVE API Hub</h2>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    status.connected
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-stone-800 text-stone-400 border border-stone-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${status.connected ? 'bg-emerald-400' : 'bg-stone-500'}`} />
                  {status.connected ? 'Live Connected' : 'Offline'}
                </span>
              </div>
              <p className="text-xs text-[#9595b2] mt-0.5">
                Real-time WebSocket & Webhook connection for TikTok LIVE gifts, vouches, and comments.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#282842] bg-[#111124] px-4">
          <button
            onClick={() => setActiveTab('live')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'live'
                ? 'border-[#ff2d78] text-white'
                : 'border-transparent text-[#8888a5] hover:text-white'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Direct Stream Connector</span>
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'events'
                ? 'border-[#ff2d78] text-white'
                : 'border-transparent text-[#8888a5] hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Live Event Stream ({events.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('webhook')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'webhook'
                ? 'border-[#ff2d78] text-white'
                : 'border-transparent text-[#8888a5] hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Webhook / Developer API</span>
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'simulator'
                ? 'border-[#ff2d78] text-white'
                : 'border-transparent text-[#8888a5] hover:text-white'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Test Simulator</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: Direct Live Stream Connector */}
          {activeTab === 'live' && (
            <div className="space-y-4">
              <form onSubmit={handleConnectSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#a8a8c4] mb-1.5">
                    TikTok Streamer Username
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777794] font-bold">@</span>
                      <input
                        type="text"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        placeholder="your_tiktok_username"
                        className="w-full bg-[#0d0d1e] border border-[#353556] rounded-xl pl-8 pr-4 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-[#7c4dff]"
                        disabled={status.connected}
                      />
                    </div>
                    {status.connected ? (
                      <button
                        type="button"
                        onClick={handleDisconnectClick}
                        disabled={loading}
                        className="px-5 py-2.5 rounded-xl bg-[#e11d48] hover:bg-[#f43f5e] text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <WifiOff className="w-4 h-4" />
                        <span>Disconnect</span>
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={loading || !usernameInput.trim()}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ff2d78] to-[#7c4dff] hover:brightness-110 text-white text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-md"
                      >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                        <span>Connect to Live</span>
                      </button>
                    )}
                  </div>
                </div>
              </form>

              {/* Status Details Card */}
              <div className="p-4 rounded-xl bg-[#0f0f22] border border-[#2b2b46] space-y-2.5">
                <div className="text-xs font-bold text-[#8d8da5] uppercase tracking-wider">Connection Metrics</div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-[#17172e] rounded-lg border border-[#30304d]">
                    <span className="block text-[10px] text-[#82829e] uppercase font-bold">Status</span>
                    <b className={`text-sm ${status.connected ? 'text-emerald-400' : 'text-stone-400'}`}>
                      {status.connected ? 'ONLINE' : 'DISCONNECTED'}
                    </b>
                  </div>
                  <div className="p-3 bg-[#17172e] rounded-lg border border-[#30304d]">
                    <span className="block text-[10px] text-[#82829e] uppercase font-bold">Stream Viewers</span>
                    <b className="text-sm text-[#00efff]">{status.viewerCount.toLocaleString()}</b>
                  </div>
                  <div className="p-3 bg-[#17172e] rounded-lg border border-[#30304d]">
                    <span className="block text-[10px] text-[#82829e] uppercase font-bold">Room ID</span>
                    <b className="text-xs font-mono text-stone-300 truncate block">
                      {status.roomId || '—'}
                    </b>
                  </div>
                </div>

                {status.lastError && (
                  <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-xs text-rose-300 flex items-start gap-2">
                    <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Connection Note:</div>
                      <div>{status.lastError}</div>
                      <div className="text-[11px] text-rose-400/80 mt-1">
                        Note: The TikTok account must be actively broadcasting a live stream to receive live Webcast events.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* How it works info */}
              <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/40 text-xs text-blue-200 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-blue-300">
                  <Info className="w-4 h-4" />
                  <span>How Live Auction Sync Works</span>
                </div>
                <p className="text-[11px] text-blue-200/90 leading-relaxed">
                  1. When connected, any viewer who sends a TikTok gift (e.g. Rose, Swan, Galaxy, Universe) is automatically added to the auction participants list with their real avatar and diamond amount.
                </p>
                <p className="text-[11px] text-blue-200/90 leading-relaxed">
                  2. When the auction concludes, the highest bidder is marked as the winner.
                </p>
                <p className="text-[11px] text-blue-200/90 leading-relaxed">
                  3. When the winner types <b>"vouch"</b> in the TikTok live chat, the system detects it automatically, confirms their vouch, and starts the snipe delay countdown for the next round!
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Live Event Stream */}
          {activeTab === 'events' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>Incoming TikTok LIVE events received via WebSocket / API</span>
                <span>{events.length} events logged</span>
              </div>
              <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
                {events.length === 0 ? (
                  <div className="py-12 text-center text-xs text-stone-500 border border-dashed border-stone-800 rounded-xl">
                    No live events received yet. Connect to a live stream or use the Test Simulator.
                  </div>
                ) : (
                  [...events].reverse().map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 bg-[#111124] border border-[#2b2b46] rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-150"
                    >
                      <div className="flex items-center gap-2.5">
                        {ev.type === 'gift' ? (
                          <div className="w-7 h-7 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold">
                            🎁
                          </div>
                        ) : ev.type === 'chat' ? (
                          <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                            <MessageSquare className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                            ⚡
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{ev.username || 'Viewer'}</span>
                            {ev.type === 'gift' && (
                              <span className="text-[#ffd84a] font-extrabold">
                                sent {ev.gift} (x{ev.streak || 1}) • {ev.value} 💎
                              </span>
                            )}
                          </div>
                          {ev.comment && (
                            <div className="text-stone-300 font-mono text-[11px]">
                              "{ev.comment}"
                            </div>
                          )}
                          {ev.message && (
                            <div className="text-stone-400 text-[11px]">
                              {ev.message}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-stone-500 font-mono shrink-0">
                        {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Webhook / Developer API */}
          {activeTab === 'webhook' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#a8a8c4] mb-1.5">
                  Webhook Ingress Endpoint
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={webhookUrl}
                    readOnly
                    className="flex-1 bg-[#0d0d1e] border border-[#353556] rounded-xl px-3.5 py-2 text-xs font-mono text-stone-300"
                  />
                  <button
                    onClick={handleCopyWebhook}
                    className="px-4 py-2 bg-[#2d2d48] hover:bg-[#3d3d60] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy URL'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-stone-400 mt-1.5">
                  Configure this URL in the TikTok Developer Portal or third-party stream bots to deliver live event webhooks directly.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0f0f22] border border-[#2b2b46] space-y-2">
                <div className="text-xs font-bold text-stone-300">Supported JSON Webhook Payloads</div>
                <div className="font-mono text-[11px] bg-[#070712] p-3 rounded-lg text-emerald-400 overflow-x-auto">
                  {`// Gift Webhook Event:
POST /api/tiktok/webhook
{
  "type": "gift",
  "username": "@WinnerPro",
  "gift": "Galaxy",
  "diamonds": 1000,
  "streak": 1
}

// Chat / Vouch Webhook Event:
POST /api/tiktok/webhook
{
  "type": "chat",
  "username": "@WinnerPro",
  "comment": "vouch"
}`}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Test Simulator */}
          {activeTab === 'simulator' && (
            <div className="space-y-4">
              <div className="text-xs text-stone-400">
                Test the auction overlay and vouch verification immediately without waiting for a live stream broadcast.
              </div>

              <div className="p-4 rounded-xl bg-[#111124] border border-[#30304f] space-y-3">
                <div className="font-bold text-xs text-[#ff2d78] uppercase tracking-wider flex items-center gap-1.5">
                  <Gift className="w-4 h-4" />
                  <span>Simulate TikTok Gift Event (Real Creators)</span>
                </div>

                {/* Quick Real Creator Selector */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  {REAL_TIKTOK_CREATORS.slice(0, 6).map((c) => (
                    <button
                      key={c.username}
                      type="button"
                      onClick={() => setSimUser(c.username)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 border flex items-center gap-1 transition-all ${
                        simUser.toLowerCase() === c.username.toLowerCase()
                          ? 'bg-[#ff2d78] text-white border-transparent'
                          : 'bg-[#1a1a33] text-stone-300 border-[#323254] hover:text-white'
                      }`}
                    >
                      <img src={c.avatar} alt={c.nickname} className="w-3.5 h-3.5 rounded-full object-cover" />
                      <span>{c.nickname}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-stone-400 mb-1">Viewer Username</label>
                    <input
                      type="text"
                      value={simUser}
                      onChange={(e) => setSimUser(e.target.value)}
                      className="w-full bg-[#0a0a18] border border-[#353556] rounded-lg px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-stone-400 mb-1">TikTok Gift</label>
                    <select
                      value={simGift}
                      onChange={(e) => setSimGift(e.target.value)}
                      className="w-full bg-[#0a0a18] border border-[#353556] rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="Rose">Rose (1 💎)</option>
                      <option value="Super GG">Super GG (100 💎)</option>
                      <option value="Money Gun">Money Gun (500 💎)</option>
                      <option value="Swan">Swan (699 💎)</option>
                      <option value="Galaxy">Galaxy (1,000 💎)</option>
                      <option value="Fireworks">Fireworks (1,088 💎)</option>
                      <option value="Phoenix">Phoenix (25,999 💎)</option>
                      <option value="TikTok Universe">TikTok Universe (44,999 💎)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleSendSimGift}
                    className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#ff2d78] to-[#ff4fa0] text-white text-xs font-bold hover:brightness-110 transition-all shadow-sm"
                  >
                    🎁 Send {simGift} ({TIKTOK_GIFT_CATALOG[simGift] || 1} 💎)
                  </button>

                  {leaderDiamondValue && leaderDiamondValue > 0 ? (
                    <button
                      type="button"
                      onClick={() =>
                        onSimulateGift(
                          simUser,
                          `Matched Gift (${leaderDiamondValue.toLocaleString()} 💎)`,
                          leaderDiamondValue
                        )
                      }
                      className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#d97706] to-[#f59e0b] text-white text-xs font-black hover:brightness-110 transition-all shadow-sm flex items-center justify-center gap-1"
                      title={`Send a gift matching leader ${leaderUsername || ''} (${leaderDiamondValue.toLocaleString()} 💎)`}
                    >
                      <span>⚖️ Match Leader ({leaderDiamondValue.toLocaleString()} 💎)</span>
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#111124] border border-[#30304f] space-y-3">
                <div className="font-bold text-xs text-[#31d487] uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  <span>Simulate Chat / Vouch Comment</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={simComment}
                    onChange={(e) => setSimComment(e.target.value)}
                    placeholder="e.g. vouch"
                    className="flex-1 bg-[#0a0a18] border border-[#353556] rounded-lg px-3 py-2 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleSendSimComment}
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#18a765] to-[#31d487] text-white text-xs font-bold hover:brightness-110 transition-all"
                  >
                    Send Comment
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
