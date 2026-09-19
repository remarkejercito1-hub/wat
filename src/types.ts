export interface Participant {
  id?: string;
  username: string;
  nickname?: string;
  avatar: string;
  gift: string;
  value: number;
  streak: number;
  timestamp?: number;
}

export interface RealTikTokCreator {
  username: string;
  nickname: string;
  avatar: string;
  followers?: string;
}

export interface Winner {
  username: string;
  value: number;
  time: string;
  avatar?: string;
}

export interface AuctionState {
  seconds: number;
  total: number;
  running: boolean;
  minimum: number;
  delay: number;
  vouchesBalance: number;
  currentWinner: Participant | null;
  vouches: number;
  requiredVouches: number;
  delaySeconds: number;
  isTieDelay?: boolean;
  tieSeconds?: number;
  tieDelay?: number;
  autoTieDelay?: boolean;
  isTied?: boolean;
}

export interface TikTokStatus {
  connected: boolean;
  username: string | null;
  roomId: string | null;
  viewerCount: number;
  lastError: string | null;
  clientCount?: number;
}

export interface LiveStreamEvent {
  id: string;
  type: 'gift' | 'chat' | 'like' | 'roomUser' | 'system' | 'status';
  username?: string;
  avatar?: string;
  comment?: string;
  gift?: string;
  value?: number;
  streak?: number;
  likeCount?: number;
  viewerCount?: number;
  message?: string;
  timestamp: number;
}
