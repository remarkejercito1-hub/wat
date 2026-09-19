import { Play, Pause, Flag, Plus, Minus, RotateCcw, Gift, Scale, Zap } from 'lucide-react';

interface ControlsPanelProps {
  initial: number;
  onInitialChange: (val: number) => void;
  delay: number;
  onDelayChange: (val: number) => void;
  tieDelay?: number;
  onTieDelayChange?: (val: number) => void;
  minimum: number;
  onMinimumChange: (val: number) => void;
  seconds: number;
  total: number;
  running: boolean;
  onStart: () => void;
  onPause: () => void;
  onFinish: () => void;
  onChangeTime: (delta: number) => void;
  onRestart: () => void;
  onAddFakeGift: () => void;
  onEqualizeGifts?: () => void;
  autoEqualize?: boolean;
  onToggleAutoEqualize?: () => void;
  canEqualize?: boolean;
  isTieDelay?: boolean;
  tieSeconds?: number;
  onAddTieDelay?: (extra?: number) => void;
  autoTieDelay?: boolean;
  onToggleAutoTieDelay?: () => void;
  isTied?: boolean;
  tiedCount?: number;
  tiedDiamondValue?: number;
}

function fmt(s: number): string {
  const safe = Math.max(0, Math.floor(s || 0));
  return String(Math.floor(safe / 60)).padStart(2, '0') + ':' + String(safe % 60).padStart(2, '0');
}

export function ControlsPanel({
  initial,
  onInitialChange,
  delay,
  onDelayChange,
  tieDelay = 30,
  onTieDelayChange,
  minimum,
  onMinimumChange,
  seconds,
  total,
  running,
  onStart,
  onPause,
  onFinish,
  onChangeTime,
  onRestart,
  onAddFakeGift,
  onEqualizeGifts,
  autoEqualize = false,
  onToggleAutoEqualize,
  canEqualize = false,
  isTieDelay = false,
  tieSeconds = 0,
  onAddTieDelay,
  autoTieDelay = true,
  onToggleAutoTieDelay,
  isTied = false,
  tiedCount = 0,
  tiedDiamondValue = 0,
}: ControlsPanelProps) {
  const displaySec = isTieDelay ? tieSeconds : seconds;
  const progressPercent = total ? Math.max(0, Math.min(100, (1 - displaySec / total) * 100)) : 0;

  return (
    <section className="bg-[#111126] border border-[#30304b] rounded-2xl overflow-hidden shadow-xl flex flex-col">
      <div className="h-[45px] bg-gradient-to-r from-[#5935b7] to-[#7446df] px-4 flex items-center justify-between font-black text-sm tracking-wide text-white">
        <div className="flex items-center gap-1.5">
          <span>🎮 CONTROLS</span>
        </div>
        {isTieDelay && (
          <span className="bg-amber-500 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-sm flex items-center gap-1">
            <Scale className="w-3 h-3" />
            <span>TIEBREAKER ACTIVE</span>
          </span>
        )}
      </div>

      <div className="p-3.5 flex-1 flex flex-col justify-between">
        {/* Param Fields */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#191932] border border-[#353550] rounded-xl p-2">
            <label className="block text-[10px] font-bold text-[#8888a0] uppercase tracking-wider mb-1">
              INITIAL TIME (SEC)
            </label>
            <input
              type="number"
              value={initial}
              onChange={(e) => onInitialChange(Number(e.target.value) || 30)}
              className="w-full bg-transparent border-0 outline-none text-white font-black text-sm"
              disabled={running}
            />
          </div>

          <div className="bg-[#191932] border border-[#353550] rounded-xl p-2">
            <label className="block text-[10px] font-bold text-[#8888a0] uppercase tracking-wider mb-1">
              DELAY (SEC)
            </label>
            <input
              type="number"
              value={delay}
              onChange={(e) => onDelayChange(Number(e.target.value) || 3)}
              className="w-full bg-transparent border-0 outline-none text-white font-black text-sm"
            />
          </div>

          <div className="bg-[#191932] border border-[#353550] rounded-xl p-2">
            <label className="block text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Scale className="w-3 h-3" />
              <span>TIE DELAY (SEC)</span>
            </label>
            <input
              type="number"
              value={tieDelay}
              onChange={(e) => onTieDelayChange?.(Number(e.target.value) || 30)}
              className="w-full bg-transparent border-0 outline-none text-amber-300 font-black text-sm"
            />
          </div>

          <div className="bg-[#191932] border border-[#353550] rounded-xl p-2">
            <label className="block text-[10px] font-bold text-[#8888a0] uppercase tracking-wider mb-1">
              MIN ENTRY (DIAMONDS 💎)
            </label>
            <input
              type="number"
              value={minimum}
              onChange={(e) => onMinimumChange(Number(e.target.value) || 0)}
              className="w-full bg-transparent border-0 outline-none text-white font-black text-sm"
            />
          </div>
        </div>

        {/* TIE ALERT BANNER */}
        {isTied && (
          <div className="my-2 bg-gradient-to-r from-amber-500/20 via-amber-600/10 to-transparent border border-amber-500/50 rounded-xl p-2.5 flex items-center gap-2 text-amber-200 text-xs">
            <Scale className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
            <div className="min-w-0 flex-1">
              <div className="font-black text-amber-300">
                ⚖️ SAME GIFT TOTAL TIED ({tiedCount} tied at {tiedDiamondValue.toLocaleString()} 💎)
              </div>
              <div className="text-[10px] text-amber-200/80">
                {isTieDelay
                  ? `Tiebreaker delay active (${tieSeconds}s remaining)`
                  : '30s Tie Delay will automatically trigger when initial time reaches 0:00!'}
              </div>
            </div>
          </div>
        )}

        {/* Time Big Display */}
        <div className="my-2">
          {isTieDelay ? (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-amber-400 font-black text-xs tracking-wider uppercase mb-1 animate-pulse">
                <Scale className="w-3.5 h-3.5" />
                <span>⚖️ TIE DELAY COUNTDOWN</span>
              </div>
              <div
                className="text-[64px] text-center font-black tracking-wider leading-none text-amber-400 font-mono"
                style={{ textShadow: '0 0 24px rgba(245, 158, 11, 0.85)' }}
              >
                {fmt(tieSeconds)}
              </div>
            </div>
          ) : (
            <div
              className="text-[64px] text-center font-black tracking-wider leading-none text-white font-mono"
              style={{ textShadow: '0 0 24px rgba(139, 92, 255, 0.6)' }}
            >
              {fmt(seconds)}
            </div>
          )}

          <div className="h-2.5 bg-[#25253b] rounded-full overflow-hidden mt-3">
            <div
              className={`h-full transition-all duration-300 ${
                isTieDelay
                  ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                  : 'bg-gradient-to-r from-[#ff2d78] to-[#875cff]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Buttons Grid */}
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onStart}
              className="py-3 px-2 rounded-xl font-black text-xs text-white bg-gradient-to-r from-[#18a765] to-[#31d487] hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>START</span>
            </button>
            <button
              onClick={onPause}
              className="py-3 px-2 rounded-xl font-black text-xs text-white bg-[#30304a] hover:bg-[#3d3d5c] active:scale-95 transition-all flex items-center justify-center gap-1"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>PAUSE</span>
            </button>
            <button
              onClick={onFinish}
              className="py-3 px-2 rounded-xl font-black text-xs text-white bg-gradient-to-r from-[#ff2d78] to-[#ff4fa0] hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1"
            >
              <Flag className="w-3.5 h-3.5 fill-current" />
              <span>FINISH</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onChangeTime(10)}
              className="py-2.5 px-3 rounded-xl font-black text-xs text-white bg-gradient-to-r from-[#7048ff] to-[#9a67ff] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>＋10 SEC</span>
            </button>
            <button
              onClick={() => onChangeTime(-10)}
              className="py-2.5 px-3 rounded-xl font-black text-xs text-white bg-[#30304a] hover:bg-[#3d3d5c] active:scale-95 transition-all flex items-center justify-center gap-1"
            >
              <Minus className="w-3.5 h-3.5" />
              <span>−10 SEC</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onRestart}
              className="py-2.5 px-3 rounded-xl font-black text-xs text-white bg-[#30304a] hover:bg-[#3d3d5c] active:scale-95 transition-all flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESTART</span>
            </button>
            <button
              onClick={onAddFakeGift}
              className="py-2.5 px-3 rounded-xl font-black text-xs text-white bg-[#30304a] hover:bg-[#3d3d5c] active:scale-95 transition-all flex items-center justify-center gap-1"
            >
              <Gift className="w-3.5 h-3.5 text-pink-400" />
              <span>FAKE GIFT</span>
            </button>
          </div>

          {/* TIE DELAY TRIGGER BUTTON */}
          <button
            type="button"
            onClick={() => onAddTieDelay?.(30)}
            className="w-full py-2.5 px-3 rounded-xl font-black text-xs text-stone-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-300 hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5"
            title={
              isTieDelay
                ? 'Add 30 more seconds to the running tie delay'
                : 'Manually start 30s tie delay right now'
            }
          >
            <Scale className="w-4 h-4" />
            <span>⚖️ +30S TIE DELAY {isTieDelay ? '(EXTEND)' : '(MANUAL)'}</span>
          </button>

          {/* Equalize Gifts & Auto-Equalize */}
          <div className="pt-2 border-t border-[#2a2a46] space-y-2">
            <button
              type="button"
              onClick={onEqualizeGifts}
              disabled={!canEqualize}
              className={`w-full py-2.5 px-3 rounded-xl font-black text-xs text-white transition-all shadow-md flex items-center justify-center gap-1.5 ${
                canEqualize
                  ? 'bg-gradient-to-r from-[#d97706] via-[#f59e0b] to-[#fbbf24] hover:brightness-110 active:scale-95 cursor-pointer'
                  : 'bg-[#25253e] text-[#6e6e8a] border border-[#343450] cursor-not-allowed opacity-60'
              }`}
              title={
                canEqualize
                  ? "Equalize all participant gifts to match the highest bidder's gift total"
                  : "Need at least 2 participants with gifts to equalize"
              }
            >
              <Scale className="w-4 h-4" />
              <span>EQUALIZE GIFTS (MATCH ALL)</span>
            </button>

            {/* Toggle Row: Auto-Equalize & Auto-Tie Delay */}
            <div className="grid grid-cols-1 gap-1.5">
              {onToggleAutoTieDelay && (
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#191932] border border-[#2d2d48]">
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-bold">
                    <Scale className="w-3 h-3 text-amber-400" />
                    <span>Auto 30s Tie Delay on Time Expire</span>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleAutoTieDelay}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      autoTieDelay ? 'bg-amber-500' : 'bg-[#31314d]'
                    }`}
                    title="Automatically starts 30-second tie delay when initial time runs out and bidders are still same gifted"
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        autoTieDelay ? 'translate-x-4' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}

              {onToggleAutoEqualize && (
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#191932] border border-[#2d2d48]">
                  <div className="flex items-center gap-1.5 text-[11px] text-stone-300 font-bold">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>Auto-Equalize Incoming Gifts</span>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleAutoEqualize}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      autoEqualize ? 'bg-amber-500' : 'bg-[#31314d]'
                    }`}
                    title="Toggle automatic gift equalization to match the leader"
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        autoEqualize ? 'translate-x-4' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
