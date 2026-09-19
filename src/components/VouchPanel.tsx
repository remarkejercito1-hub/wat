import { useState } from 'react';
import { Participant } from '../types';
import { MessageSquare, Check, Clock } from 'lucide-react';

interface VouchPanelProps {
  currentWinner: Participant | null;
  vouches: number;
  requiredVouches: number;
  delaySeconds: number;
  onSubmitComment: (comment: string) => void;
  onSimulateWinnerVouch: () => void;
}

function fmt(s: number): string {
  const safe = Math.max(0, Math.floor(s || 0));
  return String(Math.floor(safe / 60)).padStart(2, '0') + ':' + String(safe % 60).padStart(2, '0');
}

export function VouchPanel({
  currentWinner,
  vouches,
  requiredVouches,
  delaySeconds,
  onSubmitComment,
  onSimulateWinnerVouch,
}: VouchPanelProps) {
  const [commentInput, setCommentInput] = useState('');

  if (!currentWinner) return null;

  const isConfirmed = Number(vouches || 0) >= Number(requiredVouches || 1);
  const fillPercent = Math.min(100, (vouches / (requiredVouches || 1)) * 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    onSubmitComment(commentInput.trim());
    setCommentInput('');
  };

  return (
    <div className="bg-gradient-to-br from-[#24184a] to-[#17172f] border border-[#59439a] rounded-2xl p-4 sm:p-5 shadow-2xl animate-in fade-in duration-200 text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-base font-black flex items-center gap-2">
            <span>🗣️ VOUCH REQUIRED</span>
            {isConfirmed && (
              <span className="bg-emerald-500 text-black text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                CONFIRMED
              </span>
            )}
          </div>
          <div className="text-xs text-[#c9b8ff] font-bold mt-0.5">
            Winner: <b className="text-white">{currentWinner.username}</b> — type <b>"vouch"</b> in TikTok chat to confirm trade
          </div>
        </div>
        <div className="text-2xl font-black text-[#ffd85a]">
          {vouches} / {requiredVouches}
        </div>
      </div>

      {/* Vouch Progress Bar */}
      <div className="h-2.5 bg-[#292744] rounded-full overflow-hidden my-3">
        <div
          className="h-full bg-gradient-to-r from-[#31d487] to-[#7d5cff] transition-all duration-300"
          style={{ width: `${fillPercent}%` }}
        />
      </div>

      {/* Hint */}
      <div className="text-[11px] text-[#9292aa] leading-relaxed mb-3">
        When the winner comments <b>vouch</b> in the TikTok LIVE stream, it is detected automatically via the TikTok Live connector. You can also simulate comments below.
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          placeholder={`Type live comment e.g. ${currentWinner.username} vouch`}
          className="flex-1 bg-[#0e0e20] border border-[#3b3b59] rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#7c4dff]"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gradient-to-r from-[#18a765] to-[#31d487] text-white rounded-xl text-xs font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Send Comment</span>
        </button>
      </form>

      {/* Quick Simulate Winner Vouch */}
      <button
        onClick={onSimulateWinnerVouch}
        className="w-full mt-2.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7048ff] to-[#9a67ff] hover:brightness-110 active:scale-95 transition-all shadow-sm"
      >
        🗣️ Simulate Winner Saying "VOUCH"
      </button>

      {/* Next Auction Delay Box */}
      {isConfirmed && (
        <div className="mt-3 p-3.5 rounded-xl bg-[#101027] border border-[#38385b] text-center space-y-1 animate-in fade-in duration-200">
          <div className="text-[10px] font-black uppercase tracking-wider text-[#9292aa] flex items-center justify-center gap-1">
            <Clock className="w-3 h-3 text-[#31d487]" />
            <span>NEXT AUCTION STARTS IN</span>
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {fmt(delaySeconds)}
          </div>
          <div className="text-xs font-extrabold text-[#54e6a0]">
            ✓ Vouch confirmed! Preparing next round…
          </div>
        </div>
      )}
    </div>
  );
}
