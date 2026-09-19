import { useState } from 'react';
import { Copy, Check, ExternalLink, Code } from 'lucide-react';

interface RawHtmlViewerProps {
  onBackToStudio: () => void;
}

export function RawHtmlViewer({ onBackToStudio }: RawHtmlViewerProps) {
  const [copiedOverlay, setCopiedOverlay] = useState(false);

  const handleCopyOverlay = async () => {
    try {
      const res = await fetch('/auction-overlay');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopiedOverlay(true);
      setTimeout(() => setCopiedOverlay(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 text-white">
      <div className="flex items-center justify-between bg-[#111126] border border-[#30304b] p-4 rounded-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-600/20 text-orange-400 flex items-center justify-center">
            <Code className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Standalone HTML Overlay File</h3>
            <p className="text-xs text-stone-400">
              The exact transparent 375x667 OBS overlay HTML page is hosted at <code>/auction-overlay</code>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyOverlay}
            className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            {copiedOverlay ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedOverlay ? 'Copied HTML' : 'Copy Overlay HTML'}</span>
          </button>
          <a
            href="/auction-overlay"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-gradient-to-r from-[#7048ff] to-[#9a67ff] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:brightness-110 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in New Tab</span>
          </a>
        </div>
      </div>

      <div className="bg-[#0f0f22] border border-[#2b2b46] rounded-2xl p-5 space-y-4 text-xs text-stone-300 leading-relaxed">
        <h4 className="font-bold text-sm text-white flex items-center gap-2">
          <span>TikTok LIVE Studio Setup</span>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
            No Sign-In Needed
          </span>
        </h4>

        <div className="p-3 bg-[#16162d] rounded-xl border border-emerald-500/30 space-y-2">
          <div className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
            <span>METHOD 1 (Recommended): Window Capture</span>
          </div>
          <ol className="list-decimal pl-5 space-y-1.5 text-stone-300">
            <li>Click <b>&quot;Open in New Tab&quot;</b> or <b>&quot;Pop Out Overlay&quot;</b> to open the clean overlay window.</li>
            <li>In <b>TikTok LIVE Studio</b>, click <b>+ Add Source</b> at the bottom.</li>
            <li>Choose <b>Window Capture</b> (instead of Link/Browser).</li>
            <li>In the window dropdown, select <b>TikTok Auction Overlay</b>.</li>
            <li>Position and resize the overlay anywhere in your scene! No Google Sign In required.</li>
          </ol>
        </div>

        <div className="p-3 bg-[#16162d] rounded-xl border border-sky-500/30 space-y-2">
          <div className="font-bold text-sky-300 text-xs flex items-center gap-1.5">
            <span>METHOD 2: Public Shared Browser Link</span>
          </div>
          <ol className="list-decimal pl-5 space-y-1.5 text-stone-300">
            <li>Click <b>&quot;Share&quot;</b> in Google AI Studio (top-right corner).</li>
            <li>Copy the public URL: <code className="bg-black/40 px-2 py-0.5 rounded text-sky-300 select-all">{window.location.origin.replace('ais-dev-', 'ais-pre-')}/auction-overlay</code></li>
            <li>In TikTok LIVE Studio, add a <b>Link / Web Browser</b> source and paste this public URL.</li>
            <li>Set resolution to Width: <b>375</b>, Height: <b>667</b>.</li>
          </ol>
        </div>

        <h4 className="font-bold text-sm text-white pt-2">OBS Studio Setup Instructions</h4>
        <ol className="list-decimal pl-5 space-y-1.5 text-stone-300">
          <li>In OBS Studio or Streamlabs, add a new <b>Browser Source</b>.</li>
          <li>Set the URL to: <code className="bg-black/40 px-2 py-0.5 rounded text-emerald-400">{window.location.origin.replace('ais-dev-', 'ais-pre-')}/auction-overlay</code></li>
          <li>Set Width: <b>375</b> and Height: <b>667</b>.</li>
          <li>Enable <b>&quot;Shutdown source when not visible&quot;</b> and <b>&quot;Refresh browser when scene becomes active&quot;</b>.</li>
          <li>The overlay has a native transparent background and syncs instantly with your studio via BroadcastChannel and Server-Sent Events!</li>
        </ol>
      </div>
    </div>
  );
}
