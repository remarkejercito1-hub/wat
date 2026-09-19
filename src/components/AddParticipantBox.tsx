import { useState } from 'react';
import { TIKTOK_GIFT_CATALOG, REAL_TIKTOK_CREATORS } from '../data/giftCatalog';
import { TikTokStatus, RealTikTokCreator, Participant } from '../types';
import { getAvatarUrl, handleAvatarImgError } from '../utils/avatar';
import { Radio, Gift, Copy, Check, Sparkles, ExternalLink, RefreshCw, UserCheck, Scale, Equal } from 'lucide-react';

interface AddParticipantBoxProps {
  onAddCustom: (username: string, gift: string, diamonds: number, avatar?: string, nickname?: string) => void;
  status: TikTokStatus;
  onOpenTikTokModal: () => void;
  leader?: Participant | null;
  onEqualizeAll?: () => void;
  canEqualize?: boolean;
}

export function AddParticipantBox({
  onAddCustom,
  status,
  onOpenTikTokModal,
  leader,
  onEqualizeAll,
  canEqualize = false,
}: AddParticipantBoxProps) {
  // Select first real creator by default
  const [selectedCreator, setSelectedCreator] = useState<RealTikTokCreator>(REAL_TIKTOK_CREATORS[0]);
  const [customUsername, setCustomUsername] = useState(REAL_TIKTOK_CREATORS[0].username);
  const [customNickname, setCustomNickname] = useState(REAL_TIKTOK_CREATORS[0].nickname);
  const [customAvatar, setCustomAvatar] = useState(REAL_TIKTOK_CREATORS[0].avatar);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const [selectedGift, setSelectedGift] = useState('Galaxy');
  const [streakCount, setStreakCount] = useState<number>(1);
  const [customDiamondAmount, setCustomDiamondAmount] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const diamondValue = customDiamondAmount !== null
    ? customDiamondAmount
    : (TIKTOK_GIFT_CATALOG[selectedGift] || 1) * streakCount;

  // Whenever user chooses a preset creator chip
  const handleSelectPreset = (creator: RealTikTokCreator) => {
    setSelectedCreator(creator);
    setCustomUsername(creator.username);
    setCustomNickname(creator.nickname);
    setCustomAvatar(creator.avatar);
  };

  // Quick lookup of custom typed TikTok username
  const handleLookupProfile = async (rawHandle: string) => {
    const clean = rawHandle.trim().replace(/^@/, '').toLowerCase();
    if (!clean) return;

    setIsLookingUp(true);
    try {
      const res = await fetch(`/api/tiktok/user-profile?username=${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = await res.json();
        setCustomUsername(data.username || `@${clean}`);
        setCustomNickname(data.nickname || clean);
        setCustomAvatar(data.avatar || `https://unavatar.io/tiktok/${encodeURIComponent(clean)}`);
      } else {
        setCustomAvatar(`https://unavatar.io/tiktok/${encodeURIComponent(clean)}`);
        setCustomNickname(clean);
      }
    } catch {
      setCustomAvatar(`https://unavatar.io/tiktok/${encodeURIComponent(clean)}`);
      setCustomNickname(clean);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handlePickRandomCreator = () => {
    const random = REAL_TIKTOK_CREATORS[Math.floor(Math.random() * REAL_TIKTOK_CREATORS.length)];
    handleSelectPreset(random);
  };

  const handleMatchLeaderGift = () => {
    if (!leader || leader.value <= 0) return;
    const target = leader.value;

    // Check if there's an exact single gift in catalog
    const exactGift = Object.entries(TIKTOK_GIFT_CATALOG).find(([_, val]) => val === target);
    if (exactGift) {
      setSelectedGift(exactGift[0]);
      setStreakCount(1);
      setCustomDiamondAmount(null);
      return;
    }

    // Try finding matching combo (e.g. 100 * 10 = 1000)
    for (const streak of [1, 3, 5, 10, 20]) {
      if (target % streak === 0) {
        const perUnit = target / streak;
        const matched = Object.entries(TIKTOK_GIFT_CATALOG).find(([_, val]) => val === perUnit);
        if (matched) {
          setSelectedGift(matched[0]);
          setStreakCount(streak);
          setCustomDiamondAmount(null);
          return;
        }
      }
    }

    // Otherwise set exact custom diamond total to match
    setCustomDiamondAmount(target);
  };

  const handleAdd = () => {
    let uname = customUsername.trim() || selectedCreator.username;
    if (!uname.startsWith('@')) uname = `@${uname}`;
    const clean = uname.replace(/^@/, '');
    const avatarToUse = getAvatarUrl(clean, customAvatar);

    const isMatched = customDiamondAmount !== null && leader && customDiamondAmount === leader.value;
    const giftNameToUse = isMatched ? `${selectedGift} • Matched (${diamondValue.toLocaleString()} 💎)` : selectedGift;

    onAddCustom(uname, giftNameToUse, diamondValue, avatarToUse, customNickname);
  };

  const overlayUrl = `${window.location.origin}/auction-overlay`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(overlayUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 text-white">
      {/* Box 1: Add Real Test Participant */}
      <div className="lg:col-span-8 bg-[#111126] border border-[#30304b] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>ADD REAL TEST PARTICIPANT</span>
              <span className="text-[10px] text-[#8f8fa8] font-semibold lowercase">
                • with verified TikTok profiles & real avatars
              </span>
            </h3>

            <button
              type="button"
              onClick={handlePickRandomCreator}
              className="px-2.5 py-1 rounded-lg bg-[#20203d] hover:bg-[#2d2d52] text-[#c9b8ff] text-[11px] font-bold flex items-center gap-1 transition-colors border border-[#3c3c62]"
            >
              <Sparkles className="w-3 h-3 text-[#ff2d78]" />
              <span>Random Real Star</span>
            </button>
          </div>

          {/* Quick Select Chips of Real TikTok Creators */}
          <div>
            <div className="text-[10px] uppercase font-bold text-[#82829e] mb-1.5">
              Quick Pick Authentic TikTok Creators:
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {REAL_TIKTOK_CREATORS.slice(0, 8).map((creator) => {
                const isSelected = customUsername.toLowerCase() === creator.username.toLowerCase();
                return (
                  <button
                    key={creator.username}
                    type="button"
                    onClick={() => handleSelectPreset(creator)}
                    className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#ff2d78] to-[#7c4dff] text-white border-transparent shadow-sm'
                        : 'bg-[#181830] text-[#a5a5c0] border-[#2c2c48] hover:border-stone-500 hover:text-white'
                    }`}
                  >
                    <img
                      src={getAvatarUrl(creator.username, creator.avatar)}
                      alt={creator.nickname}
                      referrerPolicy="no-referrer"
                      onError={(e) => handleAvatarImgError(e, creator.username)}
                      className="w-4 h-4 rounded-full object-cover bg-stone-800"
                    />
                    <span>{creator.nickname}</span>
                    {creator.followers && (
                      <span className="text-[9px] opacity-75 font-mono">({creator.followers})</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Profile Card & Custom Input */}
          <div className="bg-[#181832] border border-[#343454] rounded-xl p-3 flex flex-col sm:flex-row items-center gap-3">
            {/* Real Avatar Thumbnail */}
            <div className="relative shrink-0">
              <img
                src={getAvatarUrl(customUsername, customAvatar)}
                alt={customNickname}
                referrerPolicy="no-referrer"
                onError={(e) => handleAvatarImgError(e, customUsername)}
                className="w-14 h-14 rounded-full object-cover border-2 border-emerald-400 bg-stone-900 shadow-md"
              />
              <div
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-black grid place-items-center border border-white"
                title="Verified Real TikTok Profile"
              >
                ✓
              </div>
            </div>

            {/* Handle & Nickname details */}
            <div className="min-w-0 flex-1 w-full">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customUsername}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomUsername(val);
                    const clean = val.trim().replace(/^@/, '').toLowerCase();
                    if (clean) {
                      setCustomAvatar(`https://unavatar.io/tiktok/${encodeURIComponent(clean)}`);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLookupProfile(customUsername);
                    }
                  }}
                  onBlur={() => handleLookupProfile(customUsername)}
                  placeholder="@real_tiktok_username"
                  className="bg-[#0f0f22] border border-[#3d3d63] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold w-full max-w-[200px] focus:outline-none focus:border-[#ff2d78]"
                />
                <button
                  type="button"
                  onClick={() => handleLookupProfile(customUsername)}
                  disabled={isLookingUp}
                  className="px-2.5 py-1.5 bg-[#2a2a4b] hover:bg-[#383861] text-stone-200 text-xs font-bold rounded-lg transition-colors shrink-0 flex items-center gap-1"
                  title="Verify real profile picture from TikTok"
                >
                  {isLookingUp ? <RefreshCw className="w-3 h-3 animate-spin text-[#00efff]" /> : null}
                  <span>{isLookingUp ? 'Fetching...' : 'Fetch Profile'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 mt-1.5 text-xs text-[#a5a5c0] flex-wrap">
                <span className="font-extrabold text-white">{customNickname}</span>
                <span>•</span>
                <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-0.5">
                  ✓ Real TikTok Profile Photo
                </span>
                <span>•</span>
                <a
                  href={`https://www.tiktok.com/@${customUsername.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00efff] hover:underline flex items-center gap-0.5 text-[11px]"
                >
                  <span>View TikTok Page</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Gift Selection and Streak */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-6">
              <label className="block text-[10px] font-bold text-[#8888a0] uppercase tracking-wider mb-1">
                TikTok Live Gift
              </label>
              <select
                value={selectedGift}
                onChange={(e) => {
                  setSelectedGift(e.target.value);
                  setCustomDiamondAmount(null);
                }}
                className="w-full bg-[#181832] border border-[#393959] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7c4dff]"
              >
                {Object.entries(TIKTOK_GIFT_CATALOG).map(([gift, val]) => (
                  <option key={gift} value={gift}>
                    {gift} — {val.toLocaleString()} 💎
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[10px] font-bold text-[#8888a0] uppercase tracking-wider mb-1">
                Gift Streak
              </label>
              <select
                value={streakCount}
                onChange={(e) => {
                  setStreakCount(Number(e.target.value) || 1);
                  setCustomDiamondAmount(null);
                }}
                className="w-full bg-[#181832] border border-[#393959] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7c4dff]"
              >
                <option value={1}>x1 Streak</option>
                <option value={3}>x3 Combo</option>
                <option value={5}>x5 Combo</option>
                <option value={10}>x10 Combo</option>
                <option value={20}>x20 Combo</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[10px] font-bold text-[#8888a0] uppercase tracking-wider mb-1">
                Total Diamonds
              </label>
              <div className="w-full bg-[#141428] border border-[#33334e] rounded-xl px-3 py-2 text-xs text-[#ffd85a] font-black text-center truncate">
                {diamondValue.toLocaleString()} 💎
              </div>
            </div>
          </div>

          {/* Match Leader's Gift Banner */}
          {leader && leader.value > 0 && (
            <div className="mt-2.5 flex items-center justify-between flex-wrap gap-2 p-2.5 rounded-xl bg-[#191936] border border-[#373760]">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <Scale className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs truncate">
                  <span className="text-stone-400">Current Leader: </span>
                  <b className="text-amber-300">{leader.username}</b>
                  <span className="text-stone-300 font-bold"> ({leader.value.toLocaleString()} 💎)</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMatchLeaderGift}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                  title={`Equalize and match ${customNickname}'s gift to ${leader.value.toLocaleString()} diamonds`}
                >
                  <Equal className="w-3.5 h-3.5" />
                  <span>Match Leader's Gift</span>
                </button>

                {canEqualize && onEqualizeAll && (
                  <button
                    type="button"
                    onClick={onEqualizeAll}
                    className="px-2.5 py-1 bg-[#2e2e50] hover:bg-[#3d3d66] text-stone-200 border border-[#43436b] rounded-lg text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
                    title="Equalize all existing participants to highest gift"
                  >
                    <Scale className="w-3.5 h-3.5 text-amber-400" />
                    <span>Equalize All</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="mt-3 pt-3 border-t border-[#23233b]">
          <button
            type="button"
            onClick={handleAdd}
            className="w-full py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#18a765] to-[#31d487] hover:brightness-110 active:scale-95 text-white transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <Gift className="w-4 h-4" />
            <span>
              Add {customNickname} ({customUsername}) with {selectedGift} ({diamondValue.toLocaleString()} 💎)
              {customDiamondAmount !== null && leader && customDiamondAmount === leader.value
                ? ' • [Matched Leader]'
                : ` (x${streakCount})`}
            </span>
          </button>
        </div>
      </div>

      {/* Box 2: TikTok Live Connection Info & OBS */}
      <div className="lg:col-span-4 bg-[#111126] border border-[#30304b] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-black text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-[#ff2d78]" />
            <span>TIKTOK LIVE CONNECTION</span>
          </h3>

          <div className="text-xs text-[#9999b0] leading-relaxed mb-3">
            {status.connected ? (
              <div className="space-y-1">
                <span className="text-emerald-400 font-bold block">
                  ✓ Connected to @{status.username}
                </span>
                <span className="text-[11px] text-stone-400 block font-mono">
                  Room: {status.roomId || 'live'} • Viewers: {status.viewerCount.toLocaleString()}
                </span>
              </div>
            ) : (
              <span>
                Connect to any live TikTok streamer to receive real-time gifts, comments, and winner vouches directly from TikTok.
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={onOpenTikTokModal}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7048ff] to-[#9a67ff] hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{status.connected ? 'Manage Connection' : 'Connect TikTok Stream'}</span>
          </button>
          <button
            onClick={handleCopyUrl}
            className="w-full py-2 px-3 bg-[#262642] hover:bg-[#323254] text-stone-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors"
            title="Copy OBS Overlay Link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied OBS Link' : 'Copy OBS Browser Source URL'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
