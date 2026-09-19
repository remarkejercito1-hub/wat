import { useState, useEffect, useRef, useCallback } from 'react';
import { StudioHeader } from './components/StudioHeader';
import { WinnersPanel } from './components/WinnersPanel';
import { ParticipantsPanel } from './components/ParticipantsPanel';
import { ControlsPanel } from './components/ControlsPanel';
import { VouchPanel } from './components/VouchPanel';
import { AddParticipantBox } from './components/AddParticipantBox';
import { OverlayPreview } from './components/OverlayPreview';
import { TikTokApiModal } from './components/TikTokApiModal';
import { RawHtmlViewer } from './components/RawHtmlViewer';
import { Participant, Winner, TikTokStatus, LiveStreamEvent } from './types';
import { REAL_TIKTOK_CREATORS, TIKTOK_GIFT_CATALOG } from './data/giftCatalog';
import { getAvatarUrl } from './utils/avatar';

export default function App() {
  // Auction State
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [diamonds, setDiamonds] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(30);
  const [total, setTotal] = useState<number>(30);
  const [running, setRunning] = useState<boolean>(false);
  const [initialTime, setInitialTime] = useState<number>(30);
  const [delay, setDelay] = useState<number>(3);
  const [minimum, setMinimum] = useState<number>(0);
  const [vouchesBalance, setVouchesBalance] = useState<number>(945);

  // Vouch State
  const [currentWinner, setCurrentWinner] = useState<Participant | null>(null);
  const [vouches, setVouches] = useState<number>(0);
  const [requiredVouches] = useState<number>(1);
  const [delaySeconds, setDelaySeconds] = useState<number>(0);

  // TikTok API Connection State
  const [status, setStatus] = useState<TikTokStatus>({
    connected: false,
    username: null,
    roomId: null,
    viewerCount: 0,
    lastError: null,
  });
  const [events, setEvents] = useState<LiveStreamEvent[]>([]);
  const [isTikTokModalOpen, setIsTikTokModalOpen] = useState<boolean>(false);

  // View state
  const [activeView, setActiveView] = useState<'studio' | 'overlay' | 'rawHtml'>('studio');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [autoEqualize, setAutoEqualize] = useState<boolean>(false);

  // Tie System State
  const [tieDelay, setTieDelay] = useState<number>(30);
  const [isTieDelay, setIsTieDelay] = useState<boolean>(false);
  const [tieSeconds, setTieSeconds] = useState<number>(0);
  const [autoTieDelay, setAutoTieDelay] = useState<boolean>(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const delayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tieTimerRef = useRef<NodeJS.Timeout | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const autoEqualizeRef = useRef(autoEqualize);
  const autoTieDelayRef = useRef(autoTieDelay);
  const participantsRef = useRef(participants);
  const tieDelayRef = useRef(tieDelay);

  useEffect(() => {
    autoEqualizeRef.current = autoEqualize;
  }, [autoEqualize]);

  useEffect(() => {
    autoTieDelayRef.current = autoTieDelay;
  }, [autoTieDelay]);

  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  useEffect(() => {
    tieDelayRef.current = tieDelay;
  }, [tieDelay]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2400);
  }, []);

  // Leaderboard & Tie Status Calculations
  const leaderParticipant =
    participants.length > 0
      ? [...participants].sort((a, b) => b.value - a.value)[0]
      : null;
  const highestDiamondValue = leaderParticipant ? leaderParticipant.value : 0;
  const tiedParticipantsCount =
    highestDiamondValue > 0
      ? participants.filter((p) => p.value === highestDiamondValue).length
      : 0;
  const isLeaderTied = tiedParticipantsCount >= 2;
  const canEqualize =
    participants.length >= 2 &&
    participants.some((p) => leaderParticipant && p.value < leaderParticipant.value);

  // Trigger or extend Tie Delay by 30 seconds (only activated when initial time runs out and still tied)
  const triggerTieDelay = useCallback((extraSeconds = 30) => {
    setIsTieDelay(true);
    setTieSeconds((prev) => (prev > 0 ? prev + extraSeconds : extraSeconds));

    if (tieTimerRef.current) clearInterval(tieTimerRef.current);

    tieTimerRef.current = setInterval(() => {
      setTieSeconds((prev) => {
        if (prev <= 1) {
          if (tieTimerRef.current) {
            clearInterval(tieTimerRef.current);
            tieTimerRef.current = null;
          }
          setIsTieDelay(false);

          // Evaluate state when tiebreaker timer expires:
          // If still same gifted, add another 30 seconds!
          setParticipants((curr) => {
            if (!curr.length) return curr;
            const sorted = [...curr].sort((a, b) => b.value - a.value);
            const topVal = sorted[0].value;
            const tiedNow = sorted.filter((p) => p.value === topVal && topVal > 0);

            if (tiedNow.length >= 2 && autoTieDelayRef.current) {
              // Still same gifted when tie delay expired! Add another 30s
              showToast(`⚖️ Still tied at ${topVal.toLocaleString()} 💎! Adding another 30s Tie Delay...`);
              setTimeout(() => {
                triggerTieDelay(tieDelayRef.current || 30);
              }, 120);
              return curr;
            } else if (tiedNow.length === 1) {
              const top = tiedNow[0];
              showToast(`🏆 Tie broken! ${top.username} won with ${top.value.toLocaleString()} 💎!`);
              setCurrentWinner(top);
              setWinners((prevW) => [
                ...prevW,
                {
                  username: top.username,
                  value: top.value,
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  avatar: top.avatar,
                },
              ]);
              setDiamonds(0);
              setVouches(0);
              return [];
            }
            return curr;
          });

          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [showToast]);

  // Broadcast state to OBS Overlay (via BroadcastChannel + Backend sync)
  const broadcastOverlayState = useCallback(() => {
    const payload = {
      participants,
      winners,
      diamonds,
      seconds,
      total,
      running,
      currentWinner,
      minimum,
      delay,
      vouches,
      requiredVouches,
      vouchesBalance,
      isTieDelay,
      tieSeconds,
      tieDelay,
      autoTieDelay,
      isTied: isLeaderTied,
    };

    try {
      if (!broadcastChannelRef.current) {
        broadcastChannelRef.current = new BroadcastChannel('tiktok-auction-overlay');
      }
      broadcastChannelRef.current.postMessage(payload);
    } catch {
      // ignore
    }

    // Also sync to backend for remote OBS browser sources
    fetch('/api/auction/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }, [
    participants,
    winners,
    diamonds,
    seconds,
    total,
    running,
    currentWinner,
    minimum,
    delay,
    vouches,
    requiredVouches,
    vouchesBalance,
    isTieDelay,
    tieSeconds,
    tieDelay,
    autoTieDelay,
    isLeaderTied,
  ]);

  useEffect(() => {
    broadcastOverlayState();
  }, [broadcastOverlayState]);

  // Connect to SSE event stream from /api/tiktok/events
  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource('/api/tiktok/events');

      eventSource.addEventListener('status', (e) => {
        try {
          const data = JSON.parse(e.data);
          setStatus((prev) => ({ ...prev, ...data }));
        } catch {
          // ignore
        }
      });

      eventSource.addEventListener('system', (e) => {
        try {
          const data = JSON.parse(e.data);
          setEvents((prev) => [
            ...prev.slice(-100),
            {
              id: String(Date.now() + Math.random()),
              type: 'system',
              message: data.message,
              timestamp: Date.now(),
            },
          ]);
          showToast(`ℹ️ ${data.message}`);
        } catch {
          // ignore
        }
      });

      eventSource.addEventListener('roomUser', (e) => {
        try {
          const data = JSON.parse(e.data);
          setStatus((prev) => ({ ...prev, viewerCount: data.viewerCount || 0 }));
        } catch {
          // ignore
        }
      });

      // Handle LIVE Gifts from TikTok
      eventSource.addEventListener('gift', (e) => {
        try {
          const data = JSON.parse(e.data);
          const val = Number(data.value) || 1;

          setEvents((prev) => [
            ...prev.slice(-100),
            {
              id: String(Date.now() + Math.random()),
              type: 'gift',
              username: data.username,
              avatar: data.avatar,
              gift: data.gift,
              value: val,
              streak: data.streak || 1,
              timestamp: Date.now(),
            },
          ]);

          // Add to auction if meets minimum or minimum is 0
          if (val >= minimum) {
            setParticipants((prev) => {
              // Check if participant exists, add streak/value
              const idx = prev.findIndex((p) => p.username.toLowerCase() === data.username.toLowerCase());
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = {
                  ...updated[idx],
                  value: updated[idx].value + val,
                  gift: data.gift,
                  streak: (updated[idx].streak || 1) + 1,
                };
                return updated;
              }
              return [
                ...prev,
                {
                  id: String(Date.now() + Math.random()),
                  username: data.username,
                  avatar: getAvatarUrl(data.username, data.avatar),
                  gift: data.gift || 'Gift',
                  value: val,
                  streak: data.streak || 1,
                  timestamp: Date.now(),
                },
              ];
            });

            setDiamonds((prev) => prev + val);
            showToast(`🎁 ${data.username} sent ${data.gift} (+${val} 💎)`);
          } else {
            showToast(`🎁 ${data.username} sent ${data.gift} (below minimum ${minimum} 💎)`);
          }
        } catch {
          // ignore
        }
      });

      // Handle LIVE Chat / Comments from TikTok (Vouch detection)
      eventSource.addEventListener('chat', (e) => {
        try {
          const data = JSON.parse(e.data);
          setEvents((prev) => [
            ...prev.slice(-100),
            {
              id: String(Date.now() + Math.random()),
              type: 'chat',
              username: data.username,
              avatar: data.avatar,
              comment: data.comment,
              timestamp: Date.now(),
            },
          ]);

          // Check for vouch from the winner
          handleLiveComment(data.username, data.comment);
        } catch {
          // ignore
        }
      });
    } catch {
      // ignore
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [minimum, showToast]);

  // Handle a live comment (e.g. "vouch")
  const handleLiveComment = (username: string, commentText: string) => {
    if (!currentWinner) return;

    const clean = (commentText || '').trim().toLowerCase().replace(/[.!?,#]/g, '');
    const cleanUser = (username || '').trim().toLowerCase().replace(/^@/, '');
    const cleanWinner = (currentWinner.username || '').trim().toLowerCase().replace(/^@/, '');

    if (clean.includes('vouch')) {
      if (cleanUser === cleanWinner) {
        setVouches((prev) => {
          const next = prev + 1;
          showToast(`✅ Vouch received from ${currentWinner.username}!`);
          if (next >= requiredVouches) {
            setVouchesBalance((b) => b + 1);
            startSnipeDelay();
          }
          return next;
        });
      } else {
        showToast(`Vouch received from @${cleanUser}, but waiting for winner ${currentWinner.username}`);
      }
    }
  };

  // Start Snipe Delay after vouch confirmed
  const startSnipeDelay = () => {
    if (delayTimerRef.current) clearInterval(delayTimerRef.current);
    const delayDuration = Math.max(0, delay || 3);
    setDelaySeconds(delayDuration);

    if (delayDuration <= 0) {
      beginNextAuction();
      return;
    }

    delayTimerRef.current = setInterval(() => {
      setDelaySeconds((prev) => {
        if (prev <= 1) {
          if (delayTimerRef.current) clearInterval(delayTimerRef.current);
          delayTimerRef.current = null;
          beginNextAuction();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const beginNextAuction = () => {
    setCurrentWinner(null);
    setParticipants([]);
    setDiamonds(0);
    setVouches(0);
    const nextTotal = Math.max(1, initialTime || 30);
    setTotal(nextTotal);
    setSeconds(nextTotal);
    showToast('🚀 New auction starting now!');
    // Auto-start next auction
    startAuction();
  };

  // Timer Tick
  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setRunning(false);

            // Initial time ran out!
            // Check if top participants are still same gifted (tied)
            const currentParticipants = participantsRef.current;
            const maxVal =
              currentParticipants.length > 0
                ? Math.max(...currentParticipants.map((p) => p.value))
                : 0;
            const tied = currentParticipants.filter(
              (p) => p.value === maxVal && maxVal > 0
            );

            if (tied.length >= 2 && autoTieDelayRef.current) {
              // Both still same gifted when initial time ran out -> Start 30s Tie Delay!
              triggerTieDelay(tieDelayRef.current || 30);
              showToast(
                `⚖️ Initial time expired & ${tied.length} bidders are tied at ${maxVal.toLocaleString()} 💎! Starting 30s Tie Delay!`
              );
              return 0;
            }

            // Not tied -> Finish auction normally
            finishAuction();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running, triggerTieDelay, showToast]);

  // Auction Controls
  const startAuction = () => {
    if (running) return;
    if (isTieDelay) {
      if (tieSeconds > 0 && !tieTimerRef.current) {
        triggerTieDelay(0);
        showToast('🔴 Resumed Tie Delay countdown');
        return;
      }
    }
    if (seconds <= 0) restartAuction();
    setRunning(true);
    showToast('🔴 Auction started');
  };

  const pauseAuction = () => {
    setRunning(false);
    if (tieTimerRef.current) {
      clearInterval(tieTimerRef.current);
      tieTimerRef.current = null;
    }
    showToast('⏸ Auction paused');
  };

  const finishAuction = (force = false) => {
    setRunning(false);
    if (tieTimerRef.current) {
      clearInterval(tieTimerRef.current);
      tieTimerRef.current = null;
    }
    setIsTieDelay(false);
    setTieSeconds(0);

    const currentParticipants = participantsRef.current;
    if (!currentParticipants.length) {
      showToast('🏁 Auction finished (No participants)');
      return;
    }

    const sorted = [...currentParticipants].sort((a, b) => b.value - a.value);
    const top = sorted[0];
    const tied = sorted.filter((p) => p.value === top.value && top.value > 0);

    if (!force && tied.length >= 2 && autoTieDelayRef.current) {
      triggerTieDelay(tieDelayRef.current || 30);
      showToast(`⚖️ Cannot finish: ${tied.length} participants tied at ${top.value.toLocaleString()} 💎! 30s Tie Delay active!`);
      return;
    }

    setCurrentWinner(top);
    setWinners((prev) => [
      ...prev,
      {
        username: top.username,
        value: top.value,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: top.avatar,
      },
    ]);

    setParticipants([]);
    setDiamonds(0);
    setVouches(0);
    showToast(`🏆 ${top.username} won! Waiting for vouch in chat.`);
  };

  const restartAuction = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (delayTimerRef.current) clearInterval(delayTimerRef.current);
    if (tieTimerRef.current) clearInterval(tieTimerRef.current);
    tieTimerRef.current = null;
    setIsTieDelay(false);
    setTieSeconds(0);
    setRunning(false);
    setCurrentWinner(null);
    setVouches(0);
    setDelaySeconds(0);
    const t = Math.max(1, initialTime || 30);
    setTotal(t);
    setSeconds(t);
  };

  const changeTime = (delta: number) => {
    setSeconds((prev) => {
      const next = Math.max(0, prev + delta);
      setTotal((currTotal) => Math.max(currTotal, next));
      return next;
    });
  };

  const addFakeGift = () => {
    const creator = REAL_TIKTOK_CREATORS[Math.floor(Math.random() * REAL_TIKTOK_CREATORS.length)];
    const giftKeys = Object.keys(TIKTOK_GIFT_CATALOG);
    const randomGift = giftKeys[Math.floor(Math.random() * giftKeys.length)];
    const giftVal = TIKTOK_GIFT_CATALOG[randomGift];

    addParticipantDirect(
      creator.username,
      creator.avatar,
      randomGift,
      giftVal,
      Math.floor(Math.random() * 3) + 1,
      creator.nickname
    );
  };

  const handleEqualizeAll = () => {
    if (participants.length < 2) {
      showToast('⚠️ Need at least 2 participants to equalize gifts');
      return;
    }

    const maxVal = Math.max(...participants.map((p) => p.value));
    const minVal = Math.min(...participants.map((p) => p.value));

    if (maxVal === minVal) {
      showToast(`⚖️ All ${participants.length} participants are already equalized at ${maxVal.toLocaleString()} 💎!`);
      return;
    }

    let totalDiff = 0;
    setParticipants((prev) => {
      return prev.map((p) => {
        if (p.value < maxVal) {
          const diff = maxVal - p.value;
          totalDiff += diff;
          return {
            ...p,
            value: maxVal,
            gift: `${p.gift} • Matched (${maxVal.toLocaleString()} 💎)`,
            streak: (p.streak || 1) + 1,
          };
        }
        return p;
      });
    });

    setDiamonds((prev) => prev + totalDiff);

    setEvents((prev) => [
      ...prev.slice(-100),
      {
        id: String(Date.now() + Math.random()),
        type: 'gift',
        username: 'AUCTION EQUALIZER',
        gift: `⚖️ All Gifts Equalized to ${maxVal.toLocaleString()} 💎`,
        value: totalDiff,
        timestamp: Date.now(),
      },
    ]);

    showToast(`⚖️ Equalized! All ${participants.length} participants matched to ${maxVal.toLocaleString()} 💎 (+${totalDiff.toLocaleString()} 💎 total)`);
  };

  const handleEqualizeParticipant = (targetUsername: string) => {
    if (!participants.length) return;
    const maxVal = Math.max(...participants.map((p) => p.value));
    const target = participants.find(
      (p) => p.username.toLowerCase() === targetUsername.toLowerCase()
    );

    if (!target) return;
    if (target.value >= maxVal) {
      showToast(`ℹ️ ${targetUsername} is already at or above highest bid (${target.value.toLocaleString()} 💎)`);
      return;
    }

    const diff = maxVal - target.value;
    setParticipants((prev) => {
      return prev.map((p) => {
        if (p.username.toLowerCase() === targetUsername.toLowerCase()) {
          return {
            ...p,
            value: maxVal,
            gift: `${p.gift} • Matched (+${diff.toLocaleString()} 💎)`,
            streak: (p.streak || 1) + 1,
          };
        }
        return p;
      });
    });

    setDiamonds((prev) => prev + diff);

    setEvents((prev) => [
      ...prev.slice(-100),
      {
        id: String(Date.now() + Math.random()),
        type: 'gift',
        username: target.username,
        avatar: target.avatar,
        gift: `⚖️ Matched to Leader (${maxVal.toLocaleString()} 💎)`,
        value: diff,
        timestamp: Date.now(),
      },
    ]);

    showToast(`⚖️ Matched ${targetUsername}'s gifts to ${maxVal.toLocaleString()} 💎 (+${diff.toLocaleString()} 💎)`);
  };

  const addParticipantDirect = (
    username: string,
    avatar: string,
    gift: string,
    val: number,
    streak = 1,
    nickname?: string
  ) => {
    const cleanUser = username.replace(/^@/, '');
    const realAvatar = getAvatarUrl(cleanUser, avatar);

    let finalVal = val;
    let finalGift = gift;

    if (autoEqualize && participants.length > 0) {
      const leaderVal = Math.max(...participants.map((p) => p.value));
      if (leaderVal > val) {
        finalVal = leaderVal;
        finalGift = `${gift} • Auto-Equalized (${leaderVal.toLocaleString()} 💎)`;
      }
    }

    setParticipants((prev) => {
      const normalizedUser = username.startsWith('@') ? username : `@${username}`;
      const existingIdx = prev.findIndex((p) => p.username.toLowerCase() === normalizedUser.toLowerCase());
      if (existingIdx >= 0) {
        const nextList = [...prev];
        nextList[existingIdx] = {
          ...nextList[existingIdx],
          value: nextList[existingIdx].value + finalVal,
          gift: finalGift,
          streak: (nextList[existingIdx].streak || 1) + streak,
        };
        return nextList;
      }

      return [
        ...prev,
        {
          id: String(Date.now() + Math.random()),
          username: normalizedUser,
          nickname,
          avatar: realAvatar,
          gift: finalGift,
          value: finalVal,
          streak,
          timestamp: Date.now(),
        },
      ];
    });

    setDiamonds((d) => d + finalVal);
    showToast(`🎁 ${username} sent ${finalGift}`);
  };

  const handleAddCustom = (
    username: string,
    gift: string,
    diamondsVal: number,
    avatar?: string,
    nickname?: string
  ) => {
    const clean = username.replace(/^@/, '');
    const realAvatar = getAvatarUrl(clean, avatar);
    addParticipantDirect(
      username,
      realAvatar,
      gift,
      diamondsVal,
      1,
      nickname
    );
  };

  const resetAll = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (delayTimerRef.current) clearInterval(delayTimerRef.current);
    if (tieTimerRef.current) clearInterval(tieTimerRef.current);
    tieTimerRef.current = null;
    setIsTieDelay(false);
    setTieSeconds(0);
    setRunning(false);
    setParticipants([]);
    setWinners([]);
    setDiamonds(0);
    restartAuction();
    showToast('Board reset');
  };

  // TikTok API actions
  const handleConnectTikTok = async (streamerUsername: string) => {
    try {
      const res = await fetch('/api/tiktok/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: streamerUsername }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus((prev) => ({
          ...prev,
          connected: true,
          username: data.username,
          roomId: data.roomId,
          lastError: null,
        }));
        showToast(`✓ Connected to @${data.username}'s TikTok LIVE`);
      } else {
        setStatus((prev) => ({ ...prev, connected: false, lastError: data.error }));
        showToast(`⚠️ ${data.error || 'Connection failed'}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus((prev) => ({ ...prev, connected: false, lastError: msg }));
      showToast(`⚠️ Failed to connect: ${msg}`);
    }
  };

  const handleDisconnectTikTok = async () => {
    try {
      await fetch('/api/tiktok/disconnect', { method: 'POST' });
      setStatus((prev) => ({ ...prev, connected: false, username: null }));
      showToast('Disconnected from TikTok LIVE');
    } catch {
      // ignore
    }
  };

  const handleSimulateGift = async (simUser: string, simGift: string, diamondsVal: number) => {
    try {
      await fetch('/api/tiktok/simulate-gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: simUser, gift: simGift, value: diamondsVal }),
      });
    } catch {
      // fallback locally
      addParticipantDirect(
        simUser,
        getAvatarUrl(simUser),
        simGift,
        diamondsVal,
        1
      );
    }
  };

  const handleSimulateComment = async (simUser: string, simComment: string) => {
    try {
      await fetch('/api/tiktok/simulate-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: simUser, comment: simComment }),
      });
    } catch {
      // fallback locally
      handleLiveComment(simUser, simComment);
    }
  };

  return (
    <div className="min-h-screen bg-radial-[circle_at_50%_-20%] from-[#2b1a55] via-[#111124] to-[#080812] text-white flex flex-col font-sans selection:bg-[#ff2d78]/30">
      {/* Studio Header */}
      <StudioHeader
        status={status}
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenTikTokModal={() => setIsTikTokModalOpen(true)}
        onResetAll={resetAll}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1540px] w-full mx-auto p-3 sm:p-5">
        {/* VIEW 1: Main Auction Studio */}
        {activeView === 'studio' && (
          <div className="space-y-4">
            {/* Top 3 Columns: WINNERS, PARTICIPANTS, CONTROLS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-3 min-w-0">
                <WinnersPanel winners={winners} />
              </div>
              <div className="lg:col-span-5 min-w-0">
                <ParticipantsPanel
                  participants={participants}
                  totalDiamonds={diamonds}
                  onEqualizeParticipant={handleEqualizeParticipant}
                  onEqualizeAll={handleEqualizeAll}
                  isTieDelay={isTieDelay}
                  tieSeconds={tieSeconds}
                />
              </div>
              <div className="lg:col-span-4 min-w-0">
                <ControlsPanel
                  initial={initialTime}
                  onInitialChange={(val) => {
                    setInitialTime(val);
                    if (!running && !isTieDelay) {
                      setTotal(val);
                      setSeconds(val);
                    }
                  }}
                  delay={delay}
                  onDelayChange={setDelay}
                  tieDelay={tieDelay}
                  onTieDelayChange={setTieDelay}
                  minimum={minimum}
                  onMinimumChange={setMinimum}
                  seconds={seconds}
                  total={total}
                  running={running}
                  onStart={startAuction}
                  onPause={pauseAuction}
                  onFinish={finishAuction}
                  onChangeTime={changeTime}
                  onRestart={restartAuction}
                  onAddFakeGift={addFakeGift}
                  onEqualizeGifts={handleEqualizeAll}
                  autoEqualize={autoEqualize}
                  onToggleAutoEqualize={() => {
                    setAutoEqualize((prev) => {
                      const next = !prev;
                      showToast(
                        next
                          ? '⚡ Auto-equalize ON: Incoming gifts will match leader'
                          : '⚪ Auto-equalize OFF'
                      );
                      return next;
                    });
                  }}
                  canEqualize={canEqualize}
                  isTieDelay={isTieDelay}
                  tieSeconds={tieSeconds}
                  onAddTieDelay={(extra = 30) => {
                    triggerTieDelay(extra);
                    showToast(`⚖️ Added +${extra}s Tie Delay!`);
                  }}
                  autoTieDelay={autoTieDelay}
                  onToggleAutoTieDelay={() => {
                    setAutoTieDelay((prev) => {
                      const next = !prev;
                      showToast(next ? '⚖️ Auto Tie Delay ON (+30s on tie)' : '⚪ Auto Tie Delay OFF');
                      return next;
                    });
                  }}
                  isTied={isLeaderTied}
                  tiedCount={tiedParticipantsCount}
                  tiedDiamondValue={highestDiamondValue}
                />
              </div>
            </div>

            {/* Vouch Panel (Visible when auction has finished and winner is awaiting confirmation) */}
            <VouchPanel
              currentWinner={currentWinner}
              vouches={vouches}
              requiredVouches={requiredVouches}
              delaySeconds={delaySeconds}
              onSubmitComment={(comment) => {
                const match = comment.match(/^(\S+)\s+(.+)$/);
                const u = match ? match[1] : currentWinner?.username || '@Viewer';
                const c = match ? match[2] : comment;
                handleLiveComment(u, c);
              }}
              onSimulateWinnerVouch={() => {
                if (currentWinner) {
                  handleLiveComment(currentWinner.username, 'vouch');
                }
              }}
            />

            {/* Bottom Boxes: Add Test Participant & TikTok Connection */}
            <AddParticipantBox
              onAddCustom={handleAddCustom}
              status={status}
              onOpenTikTokModal={() => setIsTikTokModalOpen(true)}
              leader={leaderParticipant}
              onEqualizeAll={handleEqualizeAll}
              canEqualize={canEqualize}
            />
          </div>
        )}

        {/* VIEW 2: OBS Overlay Preview */}
        {activeView === 'overlay' && (
          <div className="py-2 flex flex-col items-center">
            <OverlayPreview
              seconds={seconds}
              participants={participants}
              currentWinner={currentWinner}
              vouches={vouches}
              requiredVouches={requiredVouches}
              delay={delay}
              delaySeconds={delaySeconds}
              isSnipeDelay={false}
              isTieDelay={isTieDelay}
              tieSeconds={tieSeconds}
              vouchesBalance={vouchesBalance}
              minimum={minimum}
            />
          </div>
        )}

        {/* VIEW 3: Standalone HTML Source & Setup */}
        {activeView === 'rawHtml' && (
          <RawHtmlViewer onBackToStudio={() => setActiveView('studio')} />
        )}
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-[#202039] border border-[#45456b] py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-2xl z-50 animate-in slide-in-from-bottom-3 duration-200">
          {toastMessage}
        </div>
      )}

      {/* TikTok Live API Modal */}
      <TikTokApiModal
        isOpen={isTikTokModalOpen}
        onClose={() => setIsTikTokModalOpen(false)}
        status={status}
        events={events}
        onConnect={handleConnectTikTok}
        onDisconnect={handleDisconnectTikTok}
        onSimulateGift={handleSimulateGift}
        onSimulateComment={handleSimulateComment}
        leaderDiamondValue={highestDiamondValue}
        leaderUsername={leaderParticipant?.username}
      />
    </div>
  );
}
