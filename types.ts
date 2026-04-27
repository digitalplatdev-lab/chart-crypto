export enum Sender {
  USER = 'USER',
  AI = 'AI',
  SYSTEM = 'SYSTEM'
}

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';
export type TradeMode = 'scalping' | 'high_risk_yolo' | 'low_risk_investor';

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: Date;
  isThinking?: boolean;
  groundingUrls?: { title: string; uri: string }[];
  imageUrl?: string; 
  patternSummary?: {
    name: string;
    signal: string;
    confidence: number;
    riskReward: string;
    probabilityScore?: number;
    isRetailTrap?: boolean;
    isCounterTrend?: boolean;
    isLowVolume?: boolean;
  };
}

export interface BacktestPoint {
  date: string;
  pnl: number;
}

export interface NewsMarker {
  sentiment: 'positive' | 'negative' | 'neutral';
  snippet: string;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
}

export interface PriceAlert {
  id: string;
  asset: string;
  targetPrice: number;
  condition: 'above' | 'below';
  createdAt: number;
  triggered: boolean;
}

export interface AnalysisConfig {
  timeframe: Timeframe;
  mode: TradeMode;
}

export interface SupportResistanceLine {
  price: number;
  type: 'support' | 'resistance';
  y: number; // Percentage 0-100
}

export interface RealTimeNews {
  summary: string;
  sources: { title: string; uri: string }[];
  geopoliticalContext: string;
  marketImpact: string;
}

export interface AnalysisResult {
  sentimentScore: number; 
  patternIdentified: string;
  patternDefinition: string; 
  riskRewardRatio: string;
  backtestData: BacktestPoint[];
  initialAnalysis: string;
  annotatedChartUrl?: string | null;
  config?: AnalysisConfig; 
  tradeSignal?: 'BUY' | 'SELL' | 'HOLD';
  assetPrice?: string;
  detectedAsset?: string;
  riskManagementAdvice?: string; // New: Risk management insights
  newsMarkers?: NewsMarker[];
  priceScale?: { min: string; max: string; current: string }; // New: Calibration data
  supportResistanceLines?: SupportResistanceLine[]; // New: Interactive lines
  realTimeNews?: RealTimeNews; // New: Real-time news and geopolitical context
  probabilityScore?: number; // New: Mathematical Confidence Scoring
  scoreBreakdown?: {
    patternMatch: number;
    volumeConfirmation: number;
    mtfmAlignment: number;
    keyLevelLiquidity: number;
  };
  isRetailTrap?: boolean;
  isCounterTrend?: boolean;
  isLowVolume?: boolean;
}

export interface SavedAnalysis {
  id: string;
  name: string;
  timestamp: number;
  result: AnalysisResult;
  imagePreview: string | null;
}

export enum DrawingTool {
  NONE = 'NONE',
  TRENDLINE = 'TRENDLINE',
  HORIZONTAL_LINE = 'HORIZONTAL_LINE',
  TEXT = 'TEXT',
  ERASER = 'ERASER'
}

export interface Drawing {
  id: string;
  type: DrawingTool;
  points: { x: number; y: number }[]; // Percentage 0-100
  text?: string;
  color: string;
  timestamp: number;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  CHATTING = 'CHATTING',
  ERROR = 'ERROR'
}

export interface MarketData {
  price: number;
  volume24h: number;
  change24h: number;
}
