import { Wifi, RotateCcw, Radio, LayoutDashboard, Monitor, Code, ExternalLink } from 'lucide-react';
import { TikTokStatus } from '../types';

interface StudioHeaderProps {
  status: TikTokStatus;
  activeView: 'studio' | 'overlay' | 'rawHtml';
  onViewChange: (view: 'studio' | 'overlay' | 'rawHtml') => void;
  onOpenTikTokModal: () => void;
  onResetAll: () => void;
}

export function StudioHeader({
  status,
  activeView,
  onViewChange,
  onOpenTikTokModal,
  onResetAll,
}: StudioHeaderProps) {
  const handlePopoutOverlay = () => {
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
    <header className="h-[66px] bg-[#0f0f1f]/95 border-b border-[#34334e] flex items-center px-4 sm:px-6 gap-3 select-none text-white shadow-lg sticky top-0 z-30">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-[42px] h-[42px] rounded-xl bg-gradient-to-br from-[#ff2d78] to-[#7c4dff] grid place-items-center text-[22px] font-black shadow-md">
          ⚒
        </div>
        <div>
          <div className="font-extrabold text-[17px] tracking-tight leading-none text-white">
            TikTok Live Auction Studio
          </div>
          <div className="text-[11px] font-bold text-[#8d8da5] tracking-wide mt-1">
            TIKTOK API EDITION • v2.0
          </div>
        </div>
      </div>

      {/* Center View Tabs */}
      <div className="hidden md:flex items-center bg-[#17172e] p-1 rounded-xl border border-[#30304f] ml-4 text-xs font-bold">
        <button
          onClick={() => onViewChange('studio')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            activeView === 'studio'
              ? 'bg-gradient-to-r from-[#7048ff] to-[#9a67ff] text-white shadow-sm'
              : 'text-[#8888a5] hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Auction Studio</span>
        </button>
        <button
          onClick={() => onViewChange('overlay')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            activeView === 'overlay'
              ? 'bg-gradient-to-r from-[#7048ff] to-[#9a67ff] text-white shadow-sm'
              : 'text-[#8888a5] hover:text-white'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>OBS Overlay (375x667)</span>
        </button>
        <button
          onClick={() => onViewChange('rawHtml')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
            activeView === 'rawHtml'
              ? 'bg-gradient-to-r from-[#7048ff] to-[#9a67ff] text-white shadow-sm'
              : 'text-[#8888a5] hover:text-white'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>HTML Source</span>
        </button>
      </div>

      <div className="flex-1" />

      {/* Direct Popout Button for Window Capture in TikTok LIVE Studio */}
      <button
        onClick={handlePopoutOverlay}
        className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all"
        title="Open standalone overlay window for Window Capture in TikTok LIVE Studio"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        <span>Pop Out Overlay</span>
      </button>

      {/* Connection Indicator */}
      <div className="flex items-center gap-2 text-xs text-[#a7a7bd] font-bold">
        <span
          className={`w-2.5 h-2.5 rounded-full transition-all ${
            status.connected
              ? 'bg-[#31e58a] shadow-[0_0_12px_#31e58a] animate-pulse'
              : 'bg-[#777] shadow-[0_0_8px_#777]'
          }`}
        />
        <span className="hidden sm:inline">
          {status.connected ? 'CONNECTED' : 'NOT CONNECTED'}
        </span>
      </div>

      {/* Streamer Username */}
      <div className="bg-[#24243b] border border-[#3c3c5b] px-3 py-1.5 rounded-xl text-xs font-mono text-stone-300 max-w-[140px] truncate">
        {status.connected && status.username ? `@${status.username}` : '@not_connected'}
      </div>

      {/* TikTok API Modal Button */}
      <button
        onClick={onOpenTikTokModal}
        className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7048ff] to-[#9a67ff] hover:brightness-110 shadow-md flex items-center gap-1.5 transition-all active:scale-95"
      >
        <Radio className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">TikTok API</span>
      </button>

      {/* Reset */}
      <button
        onClick={onResetAll}
        className="px-3 py-2 rounded-xl text-xs font-bold text-stone-300 bg-[#30304a] hover:bg-[#3d3d5e] hover:text-white transition-all active:scale-95"
        title="Reset auction state"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </header>
  );
}
