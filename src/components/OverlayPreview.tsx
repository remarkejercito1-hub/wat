import { ExternalLink, Copy, Check, Shield, Scale, HelpCircle, Monitor, Globe, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { Participant } from '../types';
import { RibbonMedal } from './RibbonMedal';
import { getAvatarUrl, handleAvatarImgError } from '../utils/avatar';

interface OverlayPreviewProps {
  seconds: number;
  participants: Participant[];
  currentWinner: Participant | null;
  vouches: number;
  requiredVouches: number;
  delay: number;
  delaySeconds?: number;
  isSnipeDelay?: boolean;
  isTieDelay?: boolean;
  tieSeconds?: number;
  vouchesBalance: number;
  minimum: number;
  onCopyUrl?: () => void;
}

function fmt(s: number): string {
  const safe = Math.max(0, Math.floor(Number(s) || 0));
  return Math.floor(safe / 60) + ':' + String(safe % 60).padStart(2, '0');
}

function money(n: number): string {
  return Number(n || 0).toLocaleString();
}

export function OverlayPreview({
  seconds,
  participants,
  currentWinner,
  vouches,
  requiredVouches,
  delay,
  delaySeconds = 0,
  isSnipeDelay = false,
  isTieDelay = false,
  tieSeconds = 0,
  vouchesBalance,
  minimum,
}: OverlayPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  const isDevHost = typeof window !== 'undefined' && window.location.hostname.includes('ais-dev-');
  const publicSharedUrl = typeof window !== 'undefined'
    ? window.location.origin.replace('ais-dev-', 'ais-pre-') + '/auction-overlay'
    : '';

  const sorted = [...participants].sort((x, y) => (Number(y.value) || 0) - (Number(x.value) || 0));
  const maxDiamondVal = sorted.length > 0 ? Number(sorted[0].value) || 0 : 0;
  const isConfirmed = Number(vouches || 0) >= Number(requiredVouches || 1);

  // Active tie delay if tieSeconds > 0 or isTieDelay prop is set
  const tieActive = isTieDelay || tieSeconds > 0;
  const activeTieSeconds = tieSeconds > 0 ? tieSeconds : 30;

  // Active snipe delay if delaySeconds > 0 or prop is set (only if not in tie delay)
  const snipeActive = !tieActive && (isSnipeDelay || delaySeconds > 0);
  const activeSnipeSeconds = delaySeconds > 0 ? delaySeconds : seconds;

  const handleCopy = async () => {
    try {
      const url = `${window.location.origin}/auction-overlay`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopyPublic = async () => {
    try {
      await navigator.clipboard.writeText(publicSharedUrl);
      setCopiedPublic(true);
      setTimeout(() => setCopiedPublic(false), 2000);
    } catch {
      // ignore
    }
  };

  const handlePopout = () => {
    const popout = window.open(
      '/auction-overlay',
      'TikTok_Live_Auction_Overlay',
      'width=400,height=720,menubar=no,toolbar=no,location=no,status=no,resizable=yes'
    );
    if (popout) {
      popout.focus();
    }
  };

  return (
    <div className="flex flex-col items-center max-w-xl w-full mx-auto px-2">
      {/* TikTok LIVE Studio "Google Sign In" Fix Banner */}
      <div className="w-full max-w-[440px] mb-3 bg-[#17172e] border border-amber-500/40 rounded-2xl p-3.5 shadow-xl text-left">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-black text-amber-300">
                Fix TikTok LIVE Studio &quot;Google Sign In&quot;
              </div>
              <div className="text-[10px] text-stone-400">
                TikTok&apos;s browser cannot sign into Google. Use one of these 2 fixes:
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowGuide((prev) => !prev)}
            className="text-stone-400 hover:text-white p-1 rounded transition-colors"
            title="Toggle setup instructions"
          >
            {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showGuide && (
          <div className="mt-3 pt-3 border-t border-white/10 space-y-2.5 text-xs">
            {/* FIX 1: Window Capture (FASTEST & RECOMMENDED) */}
            <div className="p-2.5 rounded-xl bg-[#0e0e1e] border border-emerald-500/30">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400 text-[11px]">
                  <Monitor className="w-3.5 h-3.5" />
                  <span>METHOD 1 (Recommended): Window Capture</span>
                </div>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-black">
                  NO SIGN IN NEEDED
                </span>
              </div>
              <p className="text-[11px] text-stone-300 leading-snug mb-2">
                1. Click below to pop out the overlay window on your screen.
                <br />
                2. In TikTok LIVE Studio, click <b>+ Add Source</b> ➔ choose <b>Window Capture</b> (not Link).
                <br />
                3. Select <b>TikTok Auction Overlay</b>. Done!
              </p>
              <button
                onClick={handlePopout}
                className="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Popout Window (For Window Capture)</span>
              </button>
            </div>

            {/* FIX 2: Browser Source with Public Shared URL */}
            <div className="p-2.5 rounded-xl bg-[#0e0e1e] border border-sky-500/30">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 font-bold text-sky-400 text-[11px]">
                  <Globe className="w-3.5 h-3.5" />
                  <span>METHOD 2: Public Shared Browser Link</span>
                </div>
              </div>
              <p className="text-[11px] text-stone-300 leading-snug mb-2">
                The development link is private. Click <b>&quot;Share&quot;</b> in Google AI Studio (top right) to publish, then paste this public link into TikTok LIVE Studio:
              </p>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={publicSharedUrl}
                  className="flex-1 bg-[#141427] border border-[#2b2b45] rounded-lg px-2 py-1 text-[10px] font-mono text-stone-300 truncate select-all"
                />
                <button
                  onClick={handleCopyPublic}
                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[10px] font-bold shrink-0 flex items-center gap-1 transition-colors"
                >
                  {copiedPublic ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPublic ? 'Copied' : 'Copy Public URL'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top action bar for OBS Browser Source */}
      <div className="w-[375px] mb-2 flex items-center justify-between text-xs text-stone-400 px-1">
        <div className="flex items-center gap-1.5 truncate mr-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="font-mono truncate text-[11px]">/auction-overlay</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleCopy}
            className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded flex items-center gap-1 text-[11px] font-medium transition-colors"
            title="Copy URL for OBS Browser Source"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={handlePopout}
            className="p-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded transition-colors"
            title="Pop out OBS Overlay in new window"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* The 375x667 Exact Overlay Frame matching the video */}
      <div
        id="overlay-frame"
        className="relative w-[375px] h-[667px] p-[10px_12px_12px] overflow-hidden rounded-2xl border-2 border-stone-800/80 shadow-2xl select-none font-sans text-white flex flex-col justify-between"
        style={{
          background: 'radial-gradient(circle at 50% 10%, #10121a 0%, #08090d 60%, #050608 100%)',
        }}
      >
        {/* TOP STATUS HEADER */}
        <div className="space-y-2">
          {/* VOUCHES BADGE (Preserved & Styled seamlessly) */}
          <div className="h-[34px] rounded-xl border border-amber-500/50 bg-[#161208] px-3 flex items-center justify-between shadow-[0_0_10px_rgba(245,158,11,0.12)]">
            <div className="flex items-center gap-1.5 text-[#fde047] font-black text-[12px] tracking-wide">
              <span className="text-[14px]">⭐</span>
              <span>AUCTION VOUCHES</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="bg-[#f59e0b] text-stone-950 font-black text-[11px] px-2 py-0.5 rounded-lg shadow-sm">
                {currentWinner ? `${vouches}/${requiredVouches}` : money(vouchesBalance)}
              </span>
              {isConfirmed && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-black">
                  ✓ VERIFIED
                </span>
              )}
            </div>
          </div>

          {/* NO MINIMUM PILL */}
          <div className="h-[36px] rounded-xl border-[1.5px] border-[#00e599] bg-[#072218] flex items-center justify-center gap-2 px-3 shadow-[0_0_12px_rgba(0,229,153,0.15)]">
            <div className="w-[18px] h-[18px] rounded-md bg-[#00e599]/20 border border-[#00e599] flex items-center justify-center text-[#00e599] font-black text-[11px]">
              ✓
            </div>
            <span className="font-black text-[13px] tracking-wider text-[#00e599]">
              {minimum > 0 ? `MINIMUM ${money(minimum)} 💎` : 'NO MINIMUM'}
            </span>
          </div>

          {/* SNIPE DELAY PILL */}
          <div className="h-[38px] rounded-xl border border-[#1e2438] bg-[#0d0f18] flex items-center justify-between px-3 shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#38bdf8] fill-[#38bdf8]/20" />
              <span className="text-white font-black text-[12px] tracking-wider">
                SNIPE DELAY
              </span>
            </div>
            <span className="bg-[#ff4b4b] text-white font-black text-[12px] px-2.5 py-1 rounded-lg tracking-wider shadow-sm">
              {delay}S
            </span>
          </div>

          {/* TIE DELAY PILL (Visible during Tiebreaker) */}
          {tieActive && (
            <div className="h-[36px] rounded-xl border border-amber-500/70 bg-[#1c1407] flex items-center justify-between px-3 shadow-[0_0_14px_rgba(245,158,11,0.25)] animate-pulse">
              <div className="flex items-center gap-1.5 text-amber-300 font-black text-[12px] tracking-wider">
                <Scale className="w-4 h-4 text-amber-400" />
                <span>TIEBREAKER ACTIVE</span>
              </div>
              <span className="bg-amber-500 text-stone-950 font-black text-[11px] px-2 py-0.5 rounded-lg shadow-sm">
                +30S TIE DELAY
              </span>
            </div>
          )}

          {/* DYNAMIC TIMER & ANIMATION */}
          <div className="relative h-[66px] flex items-center justify-center my-1">
            {tieActive ? (
              <div
                className="text-[#f59e0b] font-black text-[26px] tracking-wider animate-pulse flex items-center gap-2"
                style={{
                  textShadow:
                    '0 0 16px rgba(245, 158, 11, 0.95), 0 0 32px rgba(245, 158, 11, 0.5)',
                }}
              >
                <span className="flex items-center gap-1">
                  <span>⚖️</span>
                  <span>TIE DELAY</span>
                </span>
                <span className="font-mono text-[32px] text-white bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 rounded-xl shadow-sm">
                  {fmt(activeTieSeconds)}
                </span>
              </div>
            ) : snipeActive ? (
              <div
                className="text-[#ff4d36] font-black text-[28px] tracking-wider animate-pulse flex items-center gap-2"
                style={{
                  textShadow:
                    '0 0 16px rgba(255, 77, 54, 0.95), 0 0 32px rgba(255, 77, 54, 0.5)',
                }}
              >
                <span>SNIPE DELAY</span>
                <span className="font-mono text-[32px]">{fmt(activeSnipeSeconds)}</span>
              </div>
            ) : (
              <div
                className={`font-black text-[38px] tracking-wider text-[#00f5b8] font-mono transition-all ${
                  seconds <= 10 ? 'animate-bounce' : ''
                }`}
                style={{
                  textShadow:
                    '0 0 16px rgba(0, 245, 184, 0.9), 0 0 32px rgba(0, 245, 184, 0.45)',
                }}
              >
                {fmt(seconds)}
              </div>
            )}
          </div>
        </div>

        {/* PARTICIPANTS LEADERBOARD CARDS */}
        <div className="flex-1 flex flex-col justify-start gap-2.5 my-1 overflow-hidden">
          {sorted.length === 0 ? (
            <div className="h-[180px] rounded-2xl border-2 border-dashed border-stone-700/60 bg-[#0d0f17]/80 flex flex-col items-center justify-center text-center p-4 text-stone-400">
              <div className="text-2xl mb-1">🎁</div>
              <div className="font-bold text-[13px] text-stone-300">Waiting for first gift...</div>
              <div className="text-[11px] text-stone-500 mt-1">Send a TikTok gift to join the auction!</div>
            </div>
          ) : (
            sorted.slice(0, 4).map((p, i) => {
              const val = Number(p.value) || 0;
              const isLeader = i === 0 || (val === maxDiamondVal && maxDiamondVal > 0);
              const isTied = isLeader && sorted.filter((x) => (Number(x.value) || 0) === maxDiamondVal).length > 1;

              // Border and styling based on rank
              let cardBorder = 'border-[#2a2e3d]';
              let cardBg = 'bg-[#0d1017]';
              let cardGlow = '';

              if (isTied) {
                cardBorder = 'border-amber-400';
                cardBg = 'bg-gradient-to-r from-[#1c1407] via-[#140e05] to-[#0d0903]';
                cardGlow = 'shadow-[0_0_15px_rgba(245,158,11,0.35)]';
              } else if (i === 0) {
                cardBorder = 'border-[#eab308]';
                cardBg = 'bg-gradient-to-r from-[#171207] via-[#120e06] to-[#0f0c05]';
                cardGlow = 'shadow-[0_0_15px_rgba(234,179,8,0.22)]';
              } else if (i === 1) {
                cardBorder = 'border-[#9ca3af]';
                cardBg = 'bg-gradient-to-r from-[#141720] to-[#0d0f14]';
                cardGlow = 'shadow-[0_0_10px_rgba(156,163,175,0.15)]';
              } else if (i === 2) {
                cardBorder = 'border-[#b45309]';
                cardBg = 'bg-gradient-to-r from-[#181109] to-[#0f0b06]';
                cardGlow = 'shadow-[0_0_10px_rgba(180,83,9,0.15)]';
              }

              // Extract gift emoji or clean name
              const giftEmoji = p.gift.includes('🦁')
                ? '🦁'
                : p.gift.includes('👑')
                ? '👑'
                : p.gift.includes('🌹')
                ? '🌹'
                : p.gift.includes('🔥')
                ? '🔥'
                : '🎁';

              const cleanUsername = (p.username || '@Viewer').replace(/^@/, '');

              return (
                <div
                  key={p.id || `${p.username}-${i}`}
                  className={`h-[76px] rounded-2xl border-2 ${cardBorder} ${cardBg} ${cardGlow} px-3 py-2 flex items-center gap-2.5 transition-all animate-in fade-in duration-200`}
                >
                  {/* Blue Ribbon Medal */}
                  <RibbonMedal rank={i + 1} isTied={isTied} />

                  {/* Rounded-Square Avatar (Guaranteed NEVER black profile) */}
                  <img
                    src={getAvatarUrl(cleanUsername, p.avatar)}
                    alt={cleanUsername}
                    referrerPolicy="no-referrer"
                    onError={(e) => handleAvatarImgError(e, cleanUsername)}
                    className={`w-[46px] h-[46px] rounded-[12px] object-cover shrink-0 bg-stone-900 border ${
                      i === 0 ? 'border-[#eab308]/60' : 'border-stone-700/60'
                    }`}
                  />

                  {/* User Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-white font-black text-[15px] truncate">
                      <span className="text-[14px] shrink-0">{giftEmoji}</span>
                      <span className="truncate">{cleanUsername}</span>
                      {isTied && (
                        <span className="text-[9px] bg-amber-400/25 border border-amber-400/40 text-amber-300 font-black px-1.5 py-0.5 rounded shrink-0">
                          EQUAL
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[17px] font-black text-white font-sans">
                        {money(p.value)}
                      </span>
                      <span className="text-[14px]">🟡</span>
                      {p.streak && p.streak > 1 ? (
                        <span className="text-[11px] text-stone-400 font-bold ml-1">
                          x{p.streak}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* BOTTOM TOTAL PARTICIPANTS PILL */}
        <div className="pt-2 flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#16132a] border border-[#382b60] text-[#c8c0ed] text-[12px] font-bold shadow-sm">
            <span className="text-[#a78bfa]">👥</span>
            <span>
              Total participants: <b className="text-white ml-0.5">{sorted.length}</b>
            </span>
          </div>
        </div>

        {/* VOUCH POPUP CARD OVERLAY (Appears when auction winner is selected) */}
        {currentWinner && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-6 z-30 animate-in fade-in duration-200">
            <div
              className={`w-full min-h-[170px] p-5 rounded-2xl border-2 text-center flex flex-col items-center justify-center shadow-2xl transition-all ${
                isConfirmed
                  ? 'bg-gradient-to-b from-[#0b9b49] to-[#087e3c] border-[#86ffad]'
                  : 'bg-gradient-to-b from-[#08a94d] to-[#079a45] border-[#54f48b]'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-white text-[#08a94d] text-[18px] font-black leading-7 mb-1 shadow-sm">
                ✓
              </div>
              <div className="text-[22px] leading-tight font-black tracking-wide text-white drop-shadow-sm">
                VOUCH AVAILABLE
              </div>
              <div className="mt-1.5 text-[16px] font-black text-white flex items-center gap-1">
                <span className="opacity-95">{currentWinner.username}</span>
                <span className="text-[13px] bg-white/20 rounded-full px-1.5 py-0.2">✓</span>
              </div>

              {!isConfirmed ? (
                <div className="mt-2 text-[11px] leading-snug text-white font-extrabold max-w-[240px]">
                  Type <b>"vouch"</b> in chat to confirm your trade
                </div>
              ) : (
                <div className="mt-2 text-[12px] font-black text-[#eafff1] bg-black/25 px-3.5 py-1 rounded-full border border-white/25 shadow-inner">
                  ✓ VOUCH CONFIRMED ({vouches}/{requiredVouches})
                </div>
              )}

              <div className="mt-3 text-[9px] text-[#b9ffd0] font-bold">
                Secured by <b className="text-[#e4ffe9]">BattleTik.app</b>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
