import { Winner } from '../types';

interface WinnersPanelProps {
  winners: Winner[];
}

function money(n: number): string {
  return Number(n || 0).toLocaleString();
}

export function WinnersPanel({ winners }: WinnersPanelProps) {
  return (
    <section className="bg-[#111126] border border-[#30304b] rounded-2xl overflow-hidden shadow-xl flex flex-col">
      <div className="h-[45px] bg-gradient-to-r from-[#19192d] to-[#252542] px-4 flex items-center font-black text-sm tracking-wide text-white">
        🏆 WINNERS
      </div>
      <div className="p-3.5 flex-1 flex flex-col">
        <div className="text-[11px] text-[#8888a0] font-bold uppercase tracking-wider mb-2">
          RECENT AUCTION WINNERS
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 max-h-[360px] pr-1">
          {winners.length === 0 ? (
            <div className="h-[320px] grid place-items-center text-center text-[#7e7e98] text-xs border border-dashed border-[#353550] rounded-xl bg-[#0d0d20]">
              No winners yet.
            </div>
          ) : (
            [...winners].reverse().map((w, idx) => (
              <div
                key={`${w.username}-${idx}`}
                className="bg-gradient-to-br from-[#1a1a31] to-[#131329] border border-[#343452] rounded-xl p-2.5 flex items-center gap-2.5 shadow-sm animate-in fade-in duration-200"
              >
                <div className="text-[24px] shrink-0">👑</div>
                <div className="min-w-0 flex-1">
                  <div className="font-extrabold text-sm text-white truncate">
                    {w.username}
                  </div>
                  <div className="text-[11px] text-[#aaaabe] font-medium mt-0.5">
                    {w.time}
                  </div>
                </div>
                <div className="font-black text-[#ffd85a] text-xs whitespace-nowrap bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                  {money(w.value)} 💎
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
