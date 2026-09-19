import { Participant } from '../types';
import { getAvatarUrl, handleAvatarImgError } from '../utils/avatar';
import { Scale, Check } from 'lucide-react';

interface ParticipantsPanelProps {
  participants: Participant[];
  totalDiamonds: number;
  onEqualizeParticipant?: (username: string) => void;
  onEqualizeAll?: () => void;
  isTieDelay?: boolean;
  tieSeconds?: number;
}

function money(n: number): string {
  return Number(n || 0).toLocaleString();
}

export function ParticipantsPanel({
  participants,
  totalDiamonds,
  onEqualizeParticipant,
  onEqualizeAll,
  isTieDelay = false,
  tieSeconds = 0,
}: ParticipantsPanelProps) {
  const maxVal = participants.length > 0 ? Math.max(...participants.map((p) => p.value)) : 0;
  const countWithMax = participants.filter((p) => p.value === maxVal && maxVal > 0).length;
  const isTied = countWithMax > 1;
  const hasMultipleGifts = participants.length >= 2;
  const canEqualizeAny = hasMultipleGifts && participants.some((p) => p.value < maxVal);

  return (
    <section className="bg-[#111126] border border-[#30304b] rounded-2xl overflow-hidden shadow-xl flex flex-col">
      <div className="h-[45px] bg-gradient-to-r from-[#0d6339] to-[#11754a] px-4 flex items-center justify-between font-black text-sm tracking-wide text-white">
        <div className="flex items-center gap-2">
          <span>👥 PARTICIPANTS</span>
          {participants.length > 0 && (
            <span className="text-[11px] font-normal opacity-80">({participants.length})</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isTied && (
            <span className="bg-amber-500 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-sm flex items-center gap-1">
              <Scale className="w-3 h-3" />
              <span>{isTieDelay ? `TIE DELAY (${tieSeconds}s)` : 'TIED'}</span>
            </span>
          )}

          {canEqualizeAny && onEqualizeAll && (
            <button
              type="button"
              onClick={onEqualizeAll}
              className="px-2.5 py-1 rounded-lg bg-amber-500/25 hover:bg-amber-500/40 text-amber-200 border border-amber-400/50 text-[11px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
              title="Equalize all participants to match the highest gift total"
            >
              <Scale className="w-3 h-3 text-amber-300" />
              <span>Equalize Gifts</span>
            </button>
          )}
        </div>
      </div>

      {/* Tiebreaker banner if tied */}
      {isTied && (
        <div className="bg-gradient-to-r from-amber-500/20 via-amber-600/15 to-transparent border-b border-amber-500/30 px-3.5 py-2 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-1.5 font-bold">
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span>
              <b>{countWithMax} bidders tied</b> at {money(maxVal)} 💎!
            </span>
          </div>
          <span className="text-[10px] bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 rounded font-black text-amber-300">
            {isTieDelay ? `30S TIEBREAKER ACTIVE` : `+30S TIE DELAY READY`}
          </span>
        </div>
      )}

      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div className="flex-1 overflow-y-auto space-y-2 max-h-[340px] pr-1">
          {participants.length === 0 ? (
            <div className="h-[300px] grid place-items-center text-center text-[#7e7e98] text-xs border border-dashed border-[#353550] rounded-xl bg-[#0d0d20] p-4 leading-relaxed">
              <div>
                <p>No participants yet.</p>
                <p className="text-[11px] text-stone-500 mt-1">
                  Connect your TikTok LIVE or click <b>🎁 Fake Gift</b> to test the auction.
                </p>
              </div>
            </div>
          ) : (
            [...participants].reverse().map((p, idx) => {
              const isBelowLeader = maxVal > 0 && p.value < maxVal;
              const isMatchedLeader = countWithMax > 1 && p.value === maxVal && maxVal > 0;
              const diff = maxVal - p.value;

              return (
                <div
                  key={p.id || `${p.username}-${idx}`}
                  className={`bg-gradient-to-br from-[#1a1a31] to-[#131329] border ${
                    isMatchedLeader ? 'border-amber-500/70 shadow-[0_0_10px_rgba(245,158,11,0.15)]' : 'border-[#343452]'
                  } rounded-xl p-2 flex items-center gap-2.5 shadow-sm animate-in fade-in duration-150`}
                >
                  <img
                    src={getAvatarUrl(p.username, p.avatar)}
                    alt={p.username}
                    referrerPolicy="no-referrer"
                    onError={(e) => handleAvatarImgError(e, p.username)}
                    className={`w-10 h-10 rounded-xl object-cover border-2 ${
                      isMatchedLeader ? 'border-amber-400' : 'border-emerald-400'
                    } bg-stone-900 shrink-0`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold text-sm text-white truncate flex items-center gap-1.5">
                      <span>{p.username}</span>
                      {p.nickname && p.nickname.toLowerCase() !== p.username.replace(/^@/, '').toLowerCase() && (
                        <span className="text-[11px] font-medium text-[#c0c0db] truncate">
                          ({p.nickname})
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#aaaabe] truncate">
                      {p.gift} • x{p.streak || 1}
                    </div>
                  </div>

                  {/* Equalize / Match button or Matched tag */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isBelowLeader && onEqualizeParticipant && (
                      <button
                        type="button"
                        onClick={() => onEqualizeParticipant(p.username)}
                        className="px-2 py-1 bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/35 rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95"
                        title={`Match ${p.username}'s gifts to leader (${money(maxVal)} 💎)`}
                      >
                        <Scale className="w-2.5 h-2.5" />
                        <span>Match (+{money(diff)})</span>
                      </button>
                    )}

                    {isMatchedLeader && (
                      <div
                        className="px-1.5 py-0.5 rounded bg-amber-500/25 border border-amber-400/60 text-amber-300 text-[9px] font-black flex items-center gap-0.5 tracking-wider"
                        title="Tied for 1st place with highest gift total"
                      >
                        <Scale className="w-2.5 h-2.5" />
                        <span>TIED (1ST)</span>
                      </div>
                    )}

                    <div className="font-black text-[#ffd85a] text-xs whitespace-nowrap bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                      {money(p.value)} 💎
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Stats footer */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#25253e]">
          <div className="bg-[#191932] border border-[#2d2d48] rounded-xl p-2.5 text-center">
            <b className="block text-lg font-black text-white">{participants.length}</b>
            <span className="text-[10px] font-bold text-[#85859e] uppercase tracking-wider">
              PARTICIPANTS
            </span>
          </div>
          <div className="bg-[#191932] border border-[#2d2d48] rounded-xl p-2.5 text-center">
            <b className="block text-lg font-black text-[#ffd85a]">{money(totalDiamonds)}</b>
            <span className="text-[10px] font-bold text-[#85859e] uppercase tracking-wider">
              DIAMONDS
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
