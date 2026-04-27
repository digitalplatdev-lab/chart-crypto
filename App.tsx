
import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { analyzeChartImage, streamChat, getMarketPulse, getPriceCheck } from './services/geminiService';
import { getMarketData, syncCoinList, getHistoricalData } from './services/marketDataService';
import { Message, Sender, AppState, AnalysisResult, Timeframe, TradeMode, AnalysisConfig, PriceAlert, MarketData, SavedAnalysis, Drawing, DrawingTool } from './types';
import { BacktestChart } from './components/BacktestChart';
import { SentimentMeter } from './components/SentimentMeter';
import { MarketDisplay } from './components/MarketDisplay';
import { HistoricalChart } from './components/HistoricalChart';
import { ProbabilityScore } from './components/ProbabilityScore';
import { DrawingLayer } from './components/DrawingLayer';
import { DrawingToolbar } from './components/DrawingToolbar';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { BookmarkIcon, FolderIcon, TrashIcon, ZoomInIcon, ZoomOutIcon, RefreshCcwIcon } from 'lucide-react';

// Icons
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
  </svg>
);

const BoltIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" clipRule="evenodd" />
  </svg>
);

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
  </svg>
);

const PaperClipIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
  </svg>
);

const XMarkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const MagicWandIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09-3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09-3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
  </svg>
);

const MagnifyingGlassPlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6" />
  </svg>
);

const InformationCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
  </svg>
);

const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);

const TECHNICAL_GLOSSARY: Record<string, string> = {
  'RSI': 'Relative Strength Index (RSI) measures the speed and change of price movements. Values above 70 indicate overbought conditions, while below 30 indicate oversold.',
  'MACD': 'Moving Average Convergence Divergence (MACD) shows the relationship between two moving averages of a security’s price. It helps identify trend direction and momentum.',
  'Bollinger Bands': 'Bollinger Bands consist of a middle band (SMA) and two outer bands (standard deviations). They help identify volatility and potential overbought/oversold levels.',
  'Fibonacci Retracement': 'Fibonacci retracement levels are horizontal lines that indicate where support and resistance are likely to occur. They are based on Fibonacci numbers.',
  'Support': 'A price level where a downtrend tends to pause due to a concentration of demand.',
  'Resistance': 'A price level where an uptrend tends to pause due to a concentration of supply.',
  'Trendline': 'A line drawn over pivot highs or under pivot lows to show the prevailing direction of price.',
  'Head and Shoulders': 'A reversal pattern that signals a trend change from bullish to bearish.',
  'Double Bottom': 'A bullish reversal pattern that occurs after a downtrend, indicating a potential trend reversal.',
  'Liquidity Sweep': 'A move where price takes out previous highs or lows to "sweep" stop losses before reversing.',
  'Retail Trap': 'A pattern that looks like a breakout but is actually a move to trap retail traders before reversing.',
  'Volume': 'The total number of shares or contracts traded during a specific period. High volume confirms price moves.',
  'EMA': 'Exponential Moving Average (EMA) is a type of moving average that places a greater weight and significance on the most recent data points.',
  'SMA': 'Simple Moving Average (SMA) is the average price over a specific number of periods.',
  'Order Flow': 'The stream of buy and sell orders entering the market. It provides insight into supply and demand dynamics.'
};

const TechnicalTooltip = ({ term, description }: { term: string; description: string }) => (
  <div className="group relative inline-block">
    <span className="cursor-help border-b border-dotted border-slate-500 hover:text-cyan-400 transition-colors">
      {term}
    </span>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-xs text-slate-300 leading-relaxed">
      <div className="font-bold text-white mb-1">{term}</div>
      {description}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
    </div>
  </div>
);

const LoadingSpinner = () => (
  <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const GroundingSources = ({ urls }: { urls?: { title: string; uri: string }[] }) => {
  if (!urls || urls.length === 0) return null;
  return (
    <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-wrap gap-2">
      <span className="text-[10px] text-slate-500 font-mono w-full">SOURCES:</span>
      {urls.map((url, i) => (
        <a 
          key={i} 
          href={url.uri} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[10px] bg-slate-700/50 hover:bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded transition-colors truncate max-w-[200px]"
        >
          {url.title || url.uri}
        </a>
      ))}
    </div>
  );
};

const generateId = (prefix: string = 'id') => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSavedList, setShowSavedList] = useState(false);
  const [newAlertPrice, setNewAlertPrice] = useState('');
  const [newAlertCondition, setNewAlertCondition] = useState<'above' | 'below'>('above');
  
  const [config, setConfig] = useState<AnalysisConfig>({
    timeframe: '1h',
    mode: 'low_risk_investor'
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'original' | 'annotated'>('original');
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [chatImage, setChatImage] = useState<{data: string, mime: string, preview: string} | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [marketPulse, setMarketPulse] = useState<string>('');
  const [isGettingPulse, setIsGettingPulse] = useState(false);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [historicalData, setHistoricalData] = useState<{ time: number; value: number }[] | null>(null);
  const [selectedDays, setSelectedDays] = useState<number>(1);
  const [isFetchingMarketData, setIsFetchingMarketData] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingTool>(DrawingTool.NONE);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  const compressImage = (base64Str: string, maxWidth = 1200, maxHeight = 1200): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
    });
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  const fetchMarketData = useCallback(async (symbol: string) => {
    setIsFetchingMarketData(true);
    setMarketData(null);
    try {
      const [data, history] = await Promise.all([
        getMarketData(symbol),
        getHistoricalData(symbol, selectedDays)
      ]);
      setMarketData(data);
      setHistoricalData(history);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Failed to fetch market data", error);
      setErrorMessage(`Market Data Error: ${message}`);
      setMarketData(null);
    } finally {
      setIsFetchingMarketData(false);
    }
  }, [selectedDays]);

  const handleSyncCoins = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await syncCoinList();
      setMessages(prev => [...prev, {
        id: generateId('sync'),
        text: `✅ Successfully synced ${result.count} coins from CoinGecko.`,
        sender: Sender.AI,
        timestamp: new Date()
      }]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(`Sync Error: ${message}`);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (analysisResult?.detectedAsset) {
      fetchMarketData(analysisResult.detectedAsset);
    }
  }, [selectedDays, analysisResult?.detectedAsset, fetchMarketData]);

  const isHydrated = useRef(false);

  // Hydration Effect
  useEffect(() => {
    if (isHydrated.current) return;
    isHydrated.current = true;

    const savedMessagesRaw = localStorage.getItem('chart_alpha_messages');
    const savedResultRaw = localStorage.getItem('chart_alpha_result');
    const savedPreviewRaw = localStorage.getItem('chart_alpha_preview');
    const savedStateRaw = localStorage.getItem('chart_alpha_state');
    const savedAlertsRaw = localStorage.getItem('chart_alpha_alerts');
    const savedAnalysesRaw = localStorage.getItem('chart_alpha_saved');
    const savedDrawingsRaw = localStorage.getItem('chart_alpha_drawings');

    if (savedDrawingsRaw) {
      try {
        setDrawings(JSON.parse(savedDrawingsRaw));
      } catch (e) {
        console.error("Failed to load drawings", e);
      }
    }

    if (savedMessagesRaw && typeof savedMessagesRaw === 'string') {
      try {
        const parsed = JSON.parse(savedMessagesRaw);
        if (Array.isArray(parsed)) {
          setMessages(parsed.map((m: Message) => ({ ...m, timestamp: new Date(m.timestamp) })));
        }
      } catch (_e) {
        console.error("Hydration error: messages", _e);
      }    
    }
    if (savedResultRaw && typeof savedResultRaw === 'string') {
      try {
        const parsedResult = JSON.parse(savedResultRaw);
        setAnalysisResult(parsedResult);
        if (parsedResult?.detectedAsset) {
          fetchMarketData(parsedResult.detectedAsset);
        }
      } catch (_e) {
        console.error("Hydration error: analysisResult", _e);
      }
    }
    if (savedPreviewRaw) setImagePreview(savedPreviewRaw);
    if (savedStateRaw) setAppState(savedStateRaw as AppState);
    if (savedAlertsRaw && typeof savedAlertsRaw === 'string') {
      try {
        setAlerts(JSON.parse(savedAlertsRaw));
      } catch (_e) {
        console.error("Hydration error: alerts", _e);
      }
    }
    if (savedAnalysesRaw && typeof savedAnalysesRaw === 'string') {
      try {
        setSavedAnalyses(JSON.parse(savedAnalysesRaw));
      } catch (_e) {
        console.error("Hydration error: savedAnalyses", _e);
      }
    }
  }, [fetchMarketData]);

  // Initial Sync Check Effect
  useEffect(() => {
    const checkCoinList = async () => {
      try {
        await axios.get('/api/coins');
      } catch {
        console.warn("Coin list missing on server, triggering initial sync...");
        handleSyncCoins();
      }
    };
    checkCoinList();
  }, [handleSyncCoins]);

  useEffect(() => {
    if (appState !== AppState.IDLE && appState !== AppState.ANALYZING) {
      localStorage.setItem('chart_alpha_messages', JSON.stringify(messages));
      localStorage.setItem('chart_alpha_result', JSON.stringify(analysisResult));
      localStorage.setItem('chart_alpha_preview', imagePreview || '');
      localStorage.setItem('chart_alpha_state', String(appState));
    }
    localStorage.setItem('chart_alpha_alerts', JSON.stringify(alerts));
    localStorage.setItem('chart_alpha_saved', JSON.stringify(savedAnalyses));
  }, [messages, analysisResult, imagePreview, appState, alerts, savedAnalyses]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Alert Checker (Polling)
  useEffect(() => {
    if (typeof Audio !== 'undefined') {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'+'JvT19JTUFSVAAAAARAAAAeaW5mbwAAAAQAAABwZW5naW5lAAAAAQAAAARAAAAIZW5naW5lX3ZlcnNpb24AAAABAAAAAQAAAARAAAAOaV9pbmZvX2FydGlzdAAAAAEAAAAEAAAADmlfaW5mb19jb3B5cmlnaHQAAAABAAAAAQAAAARAAAAOaV9pbmZvX2NyZWF0aW9uX2RhdGUAAAABAAAAAQAAAARAAAAOaV9pbmZvX2NvbW1lbnQAAAABAAAAAQAAAARAAAAOaV9pbmZvX2dlbnJlAAAAAQAAAARAAAAOaV9pbmZvX2tleXdvcmRzAAAAAQAAAARAAAAOaV9pbmZvX21lZGl1bQAAAAEAAAAEAAAADmlfaW5mb19uYW1lAAAAAQAAAARAAAAOaV9pbmZvX3Byb2R1Y3QAAAABAAAAAQAAAARAAAAOaV9pbmZvX3NvZnR3YXJlAAAAAQAAAARAAAAOaV9pbmZvX3NvdXJjZQAAAAEAAAAEAAAADmlfaW5mb19zdWJqZWN0AAAAAQAAAARAAAAOaV9pbmZvX3RyYWNrAAAAAQAAAARAAAAOaV9pbmZvX2VuY29kZXI=');
    }

    const checkInterval = setInterval(async () => {
      const untriggered = alerts.filter(a => !a.triggered);
      if (untriggered.length === 0) return;

      const assetsToCheck = Array.from(new Set(untriggered.map(a => a.asset)));
      const pricePromises = assetsToCheck.map(asset => getPriceCheck(asset));
      const prices = await Promise.all(pricePromises);

      const priceMap = new Map<string, number | null>();
      assetsToCheck.forEach((asset, index) => {
        priceMap.set(asset, prices[index]);
      });

      let hasTriggered = false;
      const newNotifications: Message[] = [];
      const updatedAlerts = alerts.map(alert => {
        if (!alert.triggered) {
          const currentPrice = priceMap.get(alert.asset);
          if (currentPrice !== null && currentPrice !== undefined) {
            const hit = alert.condition === 'above' ? currentPrice >= alert.targetPrice : currentPrice <= alert.targetPrice;
            if (hit) {
              hasTriggered = true;
              newNotifications.push({
                id: generateId('alert'),
                text: `🚨 ALERT TRIGGERED: ${alert.asset} is now $${currentPrice.toLocaleString()} (Target: ${alert.condition} $${alert.targetPrice.toLocaleString()})`,
                sender: Sender.AI,
                timestamp: new Date()
              });
              return { ...alert, triggered: true };
            }
          }
        }
        return alert;
      });

      if (hasTriggered) {
        audioRef.current?.play().catch(e => console.error("Audio playback failed", e));
        // Only update state if the alerts have actually changed
        if (JSON.stringify(alerts) !== JSON.stringify(updatedAlerts)) {
          setAlerts(updatedAlerts);
        }
        setMessages(prev => [...prev, ...newNotifications]);
      }
    }, 60000); // Check every 60 seconds

    return () => clearInterval(checkInterval);
  }, [alerts]);

  const clearHistory = () => {
    localStorage.clear();
    setAppState(AppState.IDLE);
    setImagePreview(null);
    setMessages([]);
    setAnalysisResult(null);
    setMarketPulse('');
    setChatImage(null);
    setErrorMessage(null);
    setAlerts([]);
    setActiveView('original');
  };

  const [newAlertAsset, setNewAlertAsset] = useState('');
  
  const addAlert = () => {
    const asset = newAlertAsset || analysisResult?.detectedAsset;
    if (!asset || !newAlertPrice) return;
    const price = parseFloat(newAlertPrice);
    if (isNaN(price)) return;

    const alert: PriceAlert = {
      id: generateId('alert-item'),
      asset: asset,
      targetPrice: price,
      condition: newAlertCondition,
      createdAt: Date.now(),
      triggered: false
    };

    setAlerts(prev => [alert, ...prev]);
    setIsAlertModalOpen(false);
    setNewAlertPrice('');
    setNewAlertAsset('');
  };

  const saveAnalysis = () => {
    if (!analysisResult || !saveName.trim()) return;

    const newSave: SavedAnalysis = {
      id: generateId('save-item'),
      name: saveName,
      timestamp: Date.now(),
      result: analysisResult,
      imagePreview: imagePreview
    };

    setSavedAnalyses(prev => [newSave, ...prev]);
    setIsSaveModalOpen(false);
    setSaveName('');
    
    setMessages(prev => [...prev, {
      id: generateId('save'),
      text: `💾 Analysis "${saveName}" has been saved to your library.`,
      sender: Sender.AI,
      timestamp: new Date()
    }]);
  };

  const loadAnalysis = (saved: SavedAnalysis) => {
    setAnalysisResult(saved.result);
    setImagePreview(saved.imagePreview);
    setAppState(AppState.CHATTING);
    setShowSavedList(false);
    
    if (saved.result.detectedAsset) {
      fetchMarketData(saved.result.detectedAsset);
    }

    setMessages([{
      id: generateId('load'),
      text: `📂 Loaded analysis: "${saved.name}". Original analysis from ${new Date(saved.timestamp).toLocaleDateString()}.`,
      sender: Sender.AI,
      timestamp: new Date()
    }]);
  };

  const deleteSavedAnalysis = (id: string) => {
    setSavedAnalyses(prev => prev.filter(a => a.id !== id));
  };



  const handleClearHistory = () => {
    setMessages([]);
    setAnalysisResult(null);
    setImagePreview(null);
    setDrawings([]);
    localStorage.removeItem('chart_alpha_messages');
    localStorage.removeItem('chart_alpha_result');
    localStorage.removeItem('chart_alpha_preview');
    localStorage.removeItem('chart_alpha_drawings');
  };

  const renderTextWithTooltips = (text: string) => {
    if (!text) return null;
    
    // Split text by common technical terms
    const terms = Object.keys(TECHNICAL_GLOSSARY);
    const regex = new RegExp(`\\b(${terms.join('|')})\\b`, 'gi');
    
    const parts = text.split(regex);
    
    return parts.map((part, i) => {
      const lowerPart = part.toLowerCase();
      const termMatch = terms.find(t => t.toLowerCase() === lowerPart);
      
      if (termMatch) {
        return (
          <TechnicalTooltip 
            key={i} 
            term={part} 
            description={TECHNICAL_GLOSSARY[termMatch]} 
          />
        );
      }
      return part;
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (analysisResult?.annotatedChartUrl) {
      setActiveView('annotated');
    } else {
      setActiveView('original');
    }
  }, [analysisResult]);

  const fetchMarketPulse = async () => {
    setIsGettingPulse(true);
    const pulse = await getMarketPulse();
    setMarketPulse(pulse);
    setIsGettingPulse(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const originalBase64 = reader.result as string;
      const compressedBase64 = await compressImage(originalBase64);
      const base64Data = compressedBase64.split(',')[1];
      const mimeType = 'image/jpeg'; // After compression it's jpeg

      setImagePreview(compressedBase64);
      setAppState(AppState.ANALYZING);
      setLoadingStep("Calibrating Axis & Live Price...");
      setErrorMessage(null);
      
      try {
        const result = await analyzeChartImage(base64Data, mimeType, config);
        setLoadingStep("Drawing Precision Overlays...");
        setAnalysisResult(result);

        if (result.detectedAsset) {
          fetchMarketData(result.detectedAsset);
        }
        
        const initialMsg: Message = {
          id: generateId('initial'),
          text: result.initialAnalysis,
          sender: Sender.AI,
          timestamp: new Date(),
          patternSummary: {
            name: result.patternIdentified,
            signal: result.tradeSignal || 'HOLD',
            confidence: result.sentimentScore,
            riskReward: result.riskRewardRatio,
            probabilityScore: result.probabilityScore,
            isRetailTrap: result.isRetailTrap,
            isCounterTrend: result.isCounterTrend,
            isLowVolume: result.isLowVolume
          }
        };
        
        setMessages([initialMsg]);
        setAppState(AppState.CHATTING);
      } catch (err: unknown) {
        setAppState(AppState.ERROR);
        const message = err instanceof Error ? err.message : "Failed to analyze the chart. Please try again.";
        setErrorMessage(message);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleChatFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const originalBase64 = reader.result as string;
      const compressedBase64 = await compressImage(originalBase64);
      const base64Data = compressedBase64.split(',')[1];
      setChatImage({
        data: base64Data,
        mime: 'image/jpeg',
        preview: compressedBase64
      });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !chatImage) || appState !== AppState.CHATTING) return;

    const userMsg: Message = {
      id: generateId('user'),
      text: inputValue,
      sender: Sender.USER,
      timestamp: new Date(),
      imageUrl: chatImage?.preview
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setErrorMessage(null);
    
    setChatImage(null);
    
    const aiMsgId = generateId('ai');
    setMessages(prev => [...prev, {
      id: aiMsgId,
      text: "",
      sender: Sender.AI,
      timestamp: new Date(),
      isThinking: true
    }]);

    try {
      const history = messages.map(m => ({
        role: m.sender === Sender.USER ? 'user' : 'model',
        parts: [{ text: m.text }]
      })) as { role: 'user' | 'model'; parts: { text: string }[] }[];

      if (messages.length === 1 && analysisResult) {
        history.unshift({
          role: 'model',
          parts: [{ text: `Original Context: ${analysisResult.initialAnalysis}. Mode: ${config.mode}` }] 
        });
      }

      const stream = streamChat(history, userMsg.text);
      let fullText = "";
      const groundingUrls: {title: string, uri: string}[] = [];

      for await (const chunk of stream) {
        if (chunk.text) fullText += chunk.text;
        if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
          chunk.candidates[0].groundingMetadata.groundingChunks.forEach((c: { web: { title: string; uri: string; } }) => {
            if (c.web) groundingUrls.push(c.web);
          });
        }
        setMessages(prev => prev.map(m => 
          m.id === aiMsgId 
            ? { ...m, text: fullText, isThinking: false, groundingUrls: groundingUrls.length > 0 ? groundingUrls : undefined } 
            : m
        ));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: `ERROR: ${message}`, isThinking: false } : m));
    }
  };

  const activeImageUrl = activeView === 'annotated' && analysisResult?.annotatedChartUrl 
    ? analysisResult.annotatedChartUrl 
    : imagePreview || '';

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#0b0c15] text-slate-200 overflow-hidden relative">
      
      {/* High-Resolution Viewer Modal */}
      {isViewerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-fade-in" onClick={() => setIsViewerOpen(false)}>
          <div className="absolute top-4 right-4 md:top-6 md:right-6 z-[101] flex gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsViewerOpen(false); }}
              className="p-3 bg-white/10 hover:bg-rose-500/50 rounded-full text-white transition-all border border-white/20 shadow-2xl group pointer-events-auto"
            >
              <XMarkIcon />
            </button>
          </div>
          <div className="w-full h-full p-2 md:p-10 flex flex-col items-center justify-center pointer-events-none">
            <div className="relative max-w-full md:max-w-7xl w-full h-full flex flex-col items-center justify-center pointer-events-auto overflow-hidden">
              <TransformWrapper
                initialScale={1}
                initialPositionX={0}
                initialPositionY={0}
                centerOnInit={true}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <div className="absolute top-4 left-4 z-[102] flex flex-col gap-2">
                      <button onClick={() => zoomIn()} className="p-2 bg-slate-900/80 border border-slate-700 rounded-lg text-white hover:bg-cyan-600 transition-colors"><ZoomInIcon size={18} /></button>
                      <button onClick={() => zoomOut()} className="p-2 bg-slate-900/80 border border-slate-700 rounded-lg text-white hover:bg-cyan-600 transition-colors"><ZoomOutIcon size={18} /></button>
                      <button onClick={() => resetTransform()} className="p-2 bg-slate-900/80 border border-slate-700 rounded-lg text-white hover:bg-cyan-600 transition-colors"><RefreshCcwIcon size={18} /></button>
                    </div>
                    <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div className="relative">
                        <img 
                          src={activeImageUrl} 
                          alt="Full Resolution Analysis" 
                          className="max-h-full max-w-full object-contain shadow-[0_0_100px_rgba(6,182,212,0.15)] rounded-lg border border-white/5" 
                        />
                        {/* News Markers in Full View */}
                        {activeView === 'annotated' && analysisResult?.newsMarkers?.map((marker, idx) => (
                          <div 
                            key={idx}
                            className={`absolute w-4 h-4 rounded-full border-2 border-white shadow-[0_0_10px_rgba(255,255,255,0.5)] cursor-help transition-all hover:scale-150 animate-pulse ${
                              marker.sentiment === 'positive' ? 'bg-emerald-500 shadow-emerald-500/50' : marker.sentiment === 'negative' ? 'bg-rose-500 shadow-rose-500/50' : 'bg-yellow-500 shadow-yellow-500/50'
                            }`}
                            style={{ left: `${marker.x}%`, top: `${marker.y}%`, transform: 'translate(-50%, -50%)' }}
                          >
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-slate-900/90 backdrop-blur-md p-2 rounded text-[10px] text-white w-48 opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 pointer-events-none shadow-2xl">
                               {marker.snippet}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
              <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl border border-white/10 flex items-center gap-3 md:gap-4 shadow-2xl w-[90%] md:w-auto">
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-[8px] md:text-[10px] font-mono text-slate-500 uppercase tracking-widest truncate">Active Layer</span>
                  <span className="text-[10px] md:text-xs font-bold text-cyan-400 uppercase tracking-tight truncate">
                    {activeView === 'annotated' ? 'AI ANNOTATED INFOGRAPHIC' : 'RAW CHART SCREENSHOT'}
                  </span>
                  {analysisResult?.priceScale && (
                    <div className="text-[8px] font-mono text-slate-400 mt-1 flex gap-2">
                      <span>SCALE: {analysisResult.priceScale.min} - {analysisResult.priceScale.max}</span>
                      <span className="text-emerald-400 font-bold">CALIBRATED</span>
                    </div>
                  )}
                </div>
                {analysisResult?.tradeSignal && (
                  <div className={`px-3 py-1 md:px-4 md:py-1.5 rounded-lg font-black text-xs md:text-sm tracking-widest shadow-lg shrink-0 ${
                    analysisResult.tradeSignal === 'BUY' ? 'bg-emerald-500 text-white' : 
                    analysisResult.tradeSignal === 'SELL' ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {analysisResult.tradeSignal}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Analysis Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-[90%] max-w-sm shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BookmarkIcon size={20} className="text-cyan-400" /> Save Analysis
            </h3>
            <p className="text-xs text-slate-400">Give this analysis a name to store it in your library.</p>
            <input 
              type="text" 
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="e.g. BTC Bullish Breakout"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm outline-none focus:border-cyan-500 text-white"
              autoFocus
            />
            <div className="flex gap-3 pt-2">
              <button onClick={() => setIsSaveModalOpen(false)} className="flex-1 py-2 text-xs font-mono text-slate-500 hover:text-white">CANCEL</button>
              <button onClick={saveAnalysis} className="flex-1 py-2 bg-cyan-600 rounded-lg text-xs font-bold text-white shadow-lg">SAVE TO LIBRARY</button>
            </div>
          </div>
        </div>
      )}

      {/* Price Alert Modal */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-[90%] max-w-sm shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BellIcon /> Create Price Alert
            </h3>
            <p className="text-xs text-slate-400">Set a target price for <span className="text-cyan-400 font-bold">{analysisResult?.detectedAsset || 'Asset'}</span>.</p>
            <div className="space-y-3">
              {!analysisResult?.detectedAsset && (
                <input 
                  type="text" 
                  value={newAlertAsset}
                  onChange={(e) => setNewAlertAsset(e.target.value)}
                  placeholder="Asset Symbol (e.g. BTC)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm outline-none focus:border-cyan-500 text-white"
                />
              )}
              <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                <button 
                  onClick={() => setNewAlertCondition('above')}
                  className={`flex-1 py-1.5 text-[10px] rounded-md transition-all font-bold ${newAlertCondition === 'above' ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}
                >
                  ABOVE
                </button>
                <button 
                  onClick={() => setNewAlertCondition('below')}
                  className={`flex-1 py-1.5 text-[10px] rounded-md transition-all font-bold ${newAlertCondition === 'below' ? 'bg-rose-500 text-white' : 'text-slate-500'}`}
                >
                  BELOW
                </button>
              </div>
              <input 
                type="number" 
                value={newAlertPrice}
                onChange={(e) => setNewAlertPrice(e.target.value)}
                placeholder="Target Price (USD)"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm outline-none focus:border-cyan-500 text-white"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setIsAlertModalOpen(false)} className="flex-1 py-2 text-xs font-mono text-slate-500 hover:text-white">CANCEL</button>
              <button onClick={addAlert} className="flex-1 py-2 bg-cyan-600 rounded-lg text-xs font-bold text-white shadow-lg">SET ALERT</button>
            </div>
          </div>
        </div>
      )}

      {/* Visuals Panel */}
      <div className="w-full md:w-[45%] lg:w-[40%] h-[40%] md:h-full flex flex-col border-b md:border-b-0 md:border-r border-slate-800 bg-[#0f111a] relative z-10 shadow-2xl overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent tracking-tight">
              CHART ALPHA <span className="text-[10px] text-slate-500 font-mono align-top ml-1">v2.1</span>
            </h1>
            {appState !== AppState.IDLE && (
              <div className="flex gap-3">
                <button onClick={() => setIsSaveModalOpen(true)} className="text-[10px] md:text-xs text-cyan-500 hover:text-cyan-400 underline font-mono flex items-center gap-1">
                  <BookmarkIcon size={12} /> SAVE
                </button>
                <button onClick={clearHistory} className="text-[10px] md:text-xs text-rose-500 hover:text-rose-400 underline font-mono">
                  CLEAR
                </button>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 mt-4">
            <button 
              onClick={() => setShowSavedList(false)}
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold tracking-widest transition-all border ${!showSavedList ? 'bg-cyan-600/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
            >
              ANALYZER
            </button>
            <button 
              onClick={() => setShowSavedList(true)}
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold tracking-widest transition-all border ${showSavedList ? 'bg-cyan-600/20 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
            >
              LIBRARY ({savedAnalyses.length})
            </button>
          </div>
          
          {!showSavedList && (
            <div className="mt-4 p-2 md:p-3 bg-slate-900/50 rounded-lg border border-slate-800 animate-fade-in">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-[10px] md:text-xs font-mono text-cyan-400 shrink-0"><BoltIcon /><span className="uppercase tracking-wider">Pulse</span></div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleSyncCoins} 
                    disabled={isSyncing} 
                    className="text-[9px] md:text-[10px] px-2 py-0.5 bg-slate-800 rounded text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                    title="Sync Coin List"
                  >
                    {isSyncing ? <LoadingSpinner /> : <MagicWandIcon />} SYNC
                  </button>
                  <button onClick={fetchMarketPulse} disabled={isGettingPulse} className="text-[9px] md:text-[10px] px-2 py-0.5 bg-slate-800 rounded text-slate-400 hover:text-white transition-colors">
                    {isGettingPulse ? '...' : 'REFRESH'}
                  </button>
                </div>
              </div>
              <p className="text-[10px] md:text-xs text-slate-400 leading-relaxed line-clamp-2 md:line-clamp-none">
                {marketPulse || "Instant global market sentiment."}
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
          {showSavedList ? (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">
                <FolderIcon size={14} /> Saved Analyses
              </div>
              {savedAnalyses.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-600 space-y-2">
                  <BookmarkIcon size={40} className="opacity-10" />
                  <p className="text-xs font-mono">No saved analyses yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {savedAnalyses.map(saved => (
                    <div key={saved.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 hover:border-cyan-500/30 transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-white truncate">{saved.name}</h4>
                          <p className="text-[10px] text-slate-500 font-mono">{new Date(saved.timestamp).toLocaleDateString()} • {saved.result.detectedAsset}</p>
                        </div>
                        <button 
                          onClick={() => deleteSavedAnalysis(saved.id)}
                          className="p-1.5 text-slate-600 hover:text-rose-500 transition-colors"
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => loadAnalysis(saved)}
                          className="flex-1 py-1.5 bg-slate-800 hover:bg-cyan-600/20 text-[10px] font-bold text-slate-400 hover:text-cyan-400 rounded-lg border border-slate-700 hover:border-cyan-500/30 transition-all"
                        >
                          OPEN ANALYSIS
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {appState === AppState.IDLE && (
            <div className="space-y-4 md:space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] md:text-[10px] text-slate-500 font-mono uppercase tracking-widest">Timeframe</label>
                  <select 
                    value={config.timeframe}
                    onChange={(e) => setConfig({...config, timeframe: e.target.value as Timeframe})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-[10px] md:text-xs outline-none focus:border-cyan-500/50 transition-colors"
                  >
                    {['1m','5m','15m','1h','4h','1d','1w'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] md:text-[10px] text-slate-500 font-mono uppercase tracking-widest">Trade Mode</label>
                  <select 
                    value={config.mode}
                    onChange={(e) => setConfig({...config, mode: e.target.value as TradeMode})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-[10px] md:text-xs outline-none focus:border-cyan-500/50 transition-colors"
                  >
                    <option value="low_risk_investor">Low Risk</option>
                    <option value="scalping">Scalping</option>
                    <option value="high_risk_yolo">YOLO Mode</option>
                  </select>
                </div>
              </div>

              <div 
                className="border-2 border-dashed border-slate-700 rounded-2xl h-40 md:h-64 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500/50 hover:bg-slate-800/30 transition-all group p-4"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="p-3 md:p-4 bg-slate-800 rounded-full mb-3 md:mb-4 group-hover:scale-110 transition-transform"><UploadIcon /></div>
                <p className="text-xs md:text-sm font-medium text-slate-300">Upload Chart Screenshot</p>
                <p className="text-[10px] md:text-xs text-slate-500 mt-1 md:mt-2 text-center">Supports JPG, PNG (Max 5MB)</p>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              </div>
            </div>
          )}

          {appState === AppState.ANALYZING && (
            <div className="h-full flex flex-col items-center justify-center space-y-4 md:space-y-6 py-8">
              <div className="relative">
                {imagePreview && <img src={imagePreview} className="w-40 h-28 md:w-48 md:h-32 object-cover rounded-lg opacity-40 blur-sm" />}
                <div className="absolute inset-0 flex items-center justify-center"><div className="w-12 h-12 md:w-16 md:h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div></div>
              </div>
              <p className="text-sm md:text-lg font-mono text-cyan-400 animate-pulse px-4 text-center">{loadingStep}</p>
            </div>
          )}

          {appState === AppState.ERROR && (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-500 border border-rose-500/50">
                <XMarkIcon />
              </div>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">Analysis Failed</h2>
              <p className="text-xs text-slate-400 leading-relaxed">{errorMessage}</p>
              <button 
                onClick={() => setAppState(AppState.IDLE)}
                className="px-6 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-slate-300 hover:text-white transition-colors"
              >
                TRY AGAIN
              </button>
            </div>
          )}

          {analysisResult && (
            <div className="space-y-4 md:space-y-6 animate-fade-in pb-8">
              
              <div className="flex items-center gap-2">
                 {analysisResult.assetPrice && (
                    <div className="flex-1 p-2 md:p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center shadow-lg">
                        <span className="text-[8px] md:text-[9px] font-mono text-slate-500 uppercase tracking-tighter mb-0.5">EST. PRICE</span>
                        <span className="text-xs md:text-sm font-black text-white">{analysisResult.assetPrice}</span>
                    </div>
                 )}
                 {analysisResult.tradeSignal && (
                    <div className={`flex-1 p-2 md:p-3 border rounded-xl flex flex-col items-center justify-center shadow-lg ${
                        analysisResult.tradeSignal === 'BUY' ? 'bg-emerald-500/10 border-emerald-500/30' : 
                        analysisResult.tradeSignal === 'SELL' ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-800 border-slate-700'
                    }`}>
                        <span className="text-[8px] md:text-[9px] font-mono text-slate-500 uppercase tracking-tighter mb-0.5">SIGNAL</span>
                        <span className={`text-xs md:text-sm font-black tracking-widest ${
                            analysisResult.tradeSignal === 'BUY' ? 'text-emerald-400' : 
                            analysisResult.tradeSignal === 'SELL' ? 'text-rose-400' : 'text-slate-400'
                        }`}>{analysisResult.tradeSignal}</span>
                    </div>
                 )}
                 <button 
                  onClick={() => setIsAlertModalOpen(true)}
                  className="p-2 md:p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl flex flex-col items-center justify-center shadow-lg transition-colors group"
                 >
                    <span className="text-[8px] md:text-[9px] font-mono text-slate-500 uppercase tracking-tighter mb-0.5">ALERT</span>
                    <BellIcon />
                 </button>
              </div>

              {/* Main Visual Display */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Chart Analysis & Tools</div>
                  <DrawingToolbar 
                    activeTool={activeDrawingTool} 
                    onSelectTool={setActiveDrawingTool} 
                    onClearAll={() => setDrawings([])} 
                  />
                </div>
                <div 
                  ref={chartContainerRef}
                  className="relative group rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-[#0b0c15] aspect-[4/3] flex items-center justify-center cursor-zoom-in"
                  onClick={() => {
                    if (activeDrawingTool === DrawingTool.NONE) {
                      setIsViewerOpen(true);
                    }
                  }}
                >
                  <div className="relative w-full h-full pointer-events-none">
                    <img 
                        src={activeImageUrl} 
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02]" 
                    />
                    
                    {/* Drawing Layer */}
                    <DrawingLayer
                      drawings={drawings}
                      activeTool={activeDrawingTool}
                      onAddDrawing={(d) => setDrawings([...drawings, d])}
                      onRemoveDrawing={(id) => setDrawings(drawings.filter(d => d.id !== id))}
                      onUpdateDrawing={(d) => setDrawings(drawings.map(item => item.id === d.id ? d : item))}
                      containerRef={chartContainerRef}
                    />

                    {/* Sentiment Markers Overlay */}
                    {activeView === 'annotated' && analysisResult.newsMarkers?.map((marker, idx) => (
                      <div 
                        key={`news-${idx}`}
                        className={`absolute w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-white shadow-lg pointer-events-auto group/marker animate-pulse z-20 ${
                          marker.sentiment === 'positive' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : marker.sentiment === 'negative' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]' : 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]'
                        }`}
                        style={{ left: `${marker.x}%`, top: `${marker.y}%`, transform: 'translate(-50%, -50%)' }}
                      >
                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-40 md:w-56 p-3 bg-slate-900/95 border border-slate-700 rounded-xl text-[10px] md:text-xs text-white opacity-0 group-hover/marker:opacity-100 transition-all pointer-events-none shadow-2xl z-50">
                           <div className="font-bold mb-1 uppercase text-[8px] tracking-widest text-slate-500">Real Sentiment</div>
                           {marker.snippet}
                         </div>
                      </div>
                    ))}

                    {/* Support & Resistance Lines Overlay */}
                    {activeView === 'annotated' && analysisResult.supportResistanceLines?.map((line, idx) => (
                      <div 
                        key={`line-${idx}`}
                        className={`absolute left-0 right-0 h-[2px] cursor-help group/line pointer-events-auto z-10 transition-all hover:h-[4px] ${
                          line.type === 'support' ? 'bg-cyan-400/60 hover:bg-cyan-400' : 'bg-rose-400/60 hover:bg-rose-400'
                        }`}
                        style={{ top: `${line.y}%` }}
                      >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-900/90 border border-slate-700 rounded text-[10px] font-mono text-white opacity-0 group-hover/line:opacity-100 transition-opacity whitespace-nowrap z-30">
                          <span className={line.type === 'support' ? 'text-cyan-400' : 'text-rose-400'}>
                            {line.type.toUpperCase()}: ${line.price.toLocaleString()}
                          </span>
                        </div>
                        {/* Label on the left side too */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-900/90 border border-slate-700 rounded text-[10px] font-mono text-white opacity-0 group-hover/line:opacity-100 transition-opacity whitespace-nowrap z-30">
                          ${line.price.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 bg-black/60 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100 shadow-2xl pointer-events-none">
                      <MagnifyingGlassPlusIcon />
                  </div>

                  <div className="absolute top-3 right-3 flex bg-black/80 backdrop-blur-md rounded-lg p-1 border border-white/10" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setActiveView('original')} className={`px-2 md:px-3 py-1 md:py-1.5 rounded-md text-[8px] md:text-[10px] font-mono transition-all ${activeView === 'original' ? 'bg-slate-700 text-white shadow-inner' : 'text-slate-400 hover:text-white'}`}><EyeIcon /> RAW</button>
                      <button onClick={() => setActiveView('annotated')} disabled={!analysisResult.annotatedChartUrl} className={`px-2 md:px-3 py-1 md:py-1.5 rounded-md text-[8px] md:text-[10px] font-mono transition-all ${activeView === 'annotated' ? 'bg-cyan-600 text-white shadow-inner' : 'text-slate-400 hover:text-white disabled:opacity-20'}`}><MagicWandIcon /> AI ANALYSIS</button>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white font-mono border border-white/10 shadow-lg group/pattern">
                    {renderTextWithTooltips(analysisResult.patternIdentified)}
                  </div>
                </div>

                {/* Legend Section */}
                {activeView === 'annotated' && (
                  <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3 animate-fade-in shadow-xl backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">
                      <InformationCircleIcon /> Analysis Legend
                    </div>
                    <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.5)]"></span>
                        <div className="text-[11px] font-black text-white uppercase tracking-tight">{renderTextWithTooltips(analysisResult.patternIdentified)}</div>
                      </div>
                      <div className="text-[10px] text-slate-400 leading-relaxed pl-4 italic opacity-80">{renderTextWithTooltips(analysisResult.patternDefinition)}</div>
                    </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        <div className="flex flex-col gap-2 p-2 bg-slate-800/40 rounded-lg border border-slate-700/30">
                          <div className="flex items-center gap-2">
                             <div className="flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-emerald-500/50 shadow-lg animate-pulse"></div>
                                <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-yellow-500/50 shadow-lg animate-pulse"></div>
                                <div className="w-2 h-2 rounded-full bg-rose-500 shadow-rose-500/50 shadow-lg animate-pulse"></div>
                             </div>
                             <span className="text-[9px] text-slate-400 uppercase font-mono font-bold">SENTIMENT SYNC</span>
                          </div>
                          <p className="text-[9px] text-slate-500 leading-tight">Glow markers indicate real-time news volume synced to chart timeframes.</p>
                        </div>
                        <div className="flex flex-col gap-1.5 p-2 bg-slate-800/40 rounded-lg border border-slate-700/30">
                           <div className="flex gap-4 items-center">
                              <div className="flex flex-col gap-1">
                                 <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-yellow-400"></div><span className="text-[8px] text-slate-400 font-mono">Trend</span></div>
                                 <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-cyan-400"></div><span className="text-[8px] text-slate-400 font-mono">Level</span></div>
                              </div>
                              <div className="flex flex-col gap-1">
                                 <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-magenta-400" style={{backgroundColor: '#ff00ff'}}></div><span className="text-[8px] text-slate-400 font-mono">Target</span></div>
                                 <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-500/20 border border-emerald-500/40 rounded"></div><span className="text-[8px] text-slate-400 font-mono">BuyZone</span></div>
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">Historical: {analysisResult.detectedAsset}</p>
                  <div className="flex bg-slate-900/50 rounded-lg p-0.5 border border-slate-700/50">
                    {[1, 7, 30].map(d => (
                      <button 
                        key={d}
                        onClick={() => setSelectedDays(d)}
                        className={`px-2 py-0.5 text-[8px] font-mono rounded transition-all ${selectedDays === d ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        {d === 1 ? '24H' : d === 7 ? '7D' : '30D'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-32">
                  {historicalData ? <HistoricalChart data={historicalData} /> : <div className="h-full flex items-center justify-center text-[10px] text-slate-600 font-mono">LOADING DATA...</div>}
                </div>
              </div>

              <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                  <BoltIcon /> Risk Management
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  {analysisResult.riskManagementAdvice}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                    <p className="text-xs text-slate-500 font-mono mb-1 uppercase tracking-widest">Risk/Reward</p>
                    <p className="text-xl font-bold text-white tracking-wider">{analysisResult.riskRewardRatio}</p>
                 </div>
                 <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50"><SentimentMeter score={analysisResult.sentimentScore} /></div>
              </div>

              {analysisResult.probabilityScore !== undefined && analysisResult.scoreBreakdown && (
                <ProbabilityScore 
                  score={analysisResult.probabilityScore} 
                  breakdown={analysisResult.scoreBreakdown} 
                />
              )}

              {(analysisResult.isRetailTrap || analysisResult.isCounterTrend || analysisResult.isLowVolume) && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-2 animate-pulse">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-rose-500 uppercase tracking-widest">
                    <XMarkIcon /> Critical Warnings
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.isRetailTrap && (
                      <span className="px-2 py-1 bg-rose-500 text-white text-[9px] font-black rounded uppercase tracking-tighter">RETAIL TRAP DETECTED</span>
                    )}
                    {analysisResult.isCounterTrend && (
                      <span className="px-2 py-1 bg-rose-500 text-white text-[9px] font-black rounded uppercase tracking-tighter">COUNTER-TREND RISK</span>
                    )}
                    {analysisResult.isLowVolume && (
                      <span className="px-2 py-1 bg-rose-500 text-white text-[9px] font-black rounded uppercase tracking-tighter">LOW VOLUME FAKEOUT</span>
                    )}
                  </div>
                  <p className="text-[10px] text-rose-400 leading-tight">Institutional pressure is missing or structure is bearish on higher timeframes. Proceed with extreme caution.</p>
                </div>
              )}

              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 h-48 md:h-64">
                <div className="flex justify-between items-center mb-2">
                    <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">Simulation: {config.mode.replace('_', ' ')}</p>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30 font-bold">ESTIMATED</span>
                </div>
                <BacktestChart data={analysisResult.backtestData} />
              </div>

              {analysisResult.realTimeNews && (
                <div className="p-4 bg-slate-900/80 border border-cyan-500/30 rounded-2xl space-y-4 animate-fade-in shadow-[0_0_30px_rgba(6,182,212,0.1)] backdrop-blur-md relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                      <GlobeIcon /> Real-time Intel
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                      <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">LIVE FEED</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-slate-800/30 p-3 rounded-xl border border-white/5">
                      <p className="text-[9px] text-slate-500 font-mono uppercase mb-1.5 tracking-tighter">Market Intelligence Summary</p>
                      <p className="text-[11px] text-slate-200 leading-relaxed font-medium">{analysisResult.realTimeNews.summary}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-slate-800/30 p-3 rounded-xl border border-white/5">
                        <p className="text-[9px] text-slate-500 font-mono uppercase mb-1.5 tracking-tighter">Geopolitical Conflict Report</p>
                        <p className="text-[11px] text-slate-200 leading-relaxed">{analysisResult.realTimeNews.geopoliticalContext}</p>
                      </div>
                      <div className="bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/20">
                        <p className="text-[9px] text-emerald-500/60 font-mono uppercase mb-1.5 tracking-tighter">Strategic Market Impact</p>
                        <p className="text-[11px] text-emerald-400 leading-relaxed font-bold">{analysisResult.realTimeNews.marketImpact}</p>
                      </div>
                    </div>
                    <GroundingSources urls={analysisResult.realTimeNews.sources} />
                  </div>
                </div>
              )}

              <MarketDisplay 
                symbol={analysisResult.detectedAsset || 'N/A'}
                data={marketData}
                isLoading={isFetchingMarketData}
              />
            </div>
          )}
          </>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#0b0c15] relative h-[60%] md:h-full overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-800 bg-[#0b0c15]/80 backdrop-blur-md flex justify-between items-center relative z-20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Live Terminal</span>
          </div>
          <button 
            onClick={handleClearHistory}
            className="text-[10px] font-mono text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1.5 uppercase tracking-tighter"
          >
            <TrashIcon size={12} /> Clear History
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6 relative z-10">
            {messages.length === 0 && appState === AppState.IDLE && (
                <div className="h-full flex flex-col items-center justify-center opacity-30 select-none">
                    <div className="text-6xl font-black text-slate-800 tracking-tighter mb-4 uppercase">SETUP</div>
                    <div className="text-6xl font-black text-slate-800 tracking-tighter uppercase">ANALYZER</div>
                </div>
            )}
            {messages.map((msg) => (
                <div key={msg.id} className={`flex w-full ${msg.sender === Sender.USER ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-lg flex flex-col ${msg.sender === Sender.USER ? 'bg-cyan-600 text-white rounded-br-none items-end' : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none items-start'}`}>
                        {msg.sender === Sender.AI && (
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700/50 w-full">
                                <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-500"></div>
                                <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-tighter">AI_TRADER</span>
                                {msg.isThinking && <span className="text-[10px] text-slate-500 animate-pulse ml-auto">Thinking...</span>}
                            </div>
                        )}
                        {msg.imageUrl && <div className="mb-3 rounded-lg overflow-hidden border border-white/20 max-w-full"><img src={msg.imageUrl} className="max-h-48 w-auto object-cover" /></div>}
                        {msg.patternSummary && (
                            <div className="mb-4 p-4 bg-slate-900/80 rounded-xl border border-white/10 space-y-3 shadow-2xl w-full">
                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Setup Identified</span>
                                    <div className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest ${
                                        msg.patternSummary.signal === 'BUY' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                                        msg.patternSummary.signal === 'SELL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-700 text-slate-300'
                                    }`}>
                                        {msg.patternSummary.signal}
                                    </div>
                                </div>
                                <div className="text-base font-black text-white uppercase tracking-tight leading-none">{msg.patternSummary.name}</div>
                                <div className="grid grid-cols-2 gap-4 pt-1">
                                    <div className="space-y-1">
                                        <div className="text-[9px] text-slate-500 uppercase font-mono tracking-tighter">Confidence</div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-cyan-500" style={{ width: `${msg.patternSummary.confidence}%` }}></div>
                                            </div>
                                            <span className="text-xs font-bold text-cyan-400">{msg.patternSummary.confidence}%</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[9px] text-slate-500 uppercase font-mono tracking-tighter">R:R Ratio</div>
                                        <div className="text-xs font-bold text-slate-300">{msg.patternSummary.riskReward}</div>
                                    </div>
                                </div>
                                {msg.patternSummary.probabilityScore !== undefined && (
                                  <div className="mt-3 pt-3 border-t border-white/5">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-[9px] text-slate-500 uppercase font-mono tracking-tighter">Signal Probability</span>
                                      <span className={`text-[10px] font-black ${msg.patternSummary.probabilityScore > 75 ? 'text-cyan-400' : 'text-rose-400'}`}>
                                        {msg.patternSummary.probabilityScore}%
                                      </span>
                                    </div>
                                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full ${msg.patternSummary.probabilityScore > 75 ? 'bg-cyan-500' : 'bg-rose-500'}`} 
                                        style={{ width: `${msg.patternSummary.probabilityScore}%` }}
                                      ></div>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {msg.patternSummary.isRetailTrap && <span className="text-[8px] bg-rose-500/20 text-rose-400 px-1 rounded border border-rose-500/30">TRAP</span>}
                                      {msg.patternSummary.isCounterTrend && <span className="text-[8px] bg-rose-500/20 text-rose-400 px-1 rounded border border-rose-500/30">COUNTER-TREND</span>}
                                      {msg.patternSummary.isLowVolume && <span className="text-[8px] bg-rose-500/20 text-rose-400 px-1 rounded border border-rose-500/30">LOW VOL</span>}
                                    </div>
                                  </div>
                                )}
                            </div>
                        )}
                        <div className={`prose prose-invert prose-sm max-w-none font-sans whitespace-pre-wrap leading-relaxed ${msg.sender === Sender.USER ? 'text-right' : 'text-left'}`}>{renderTextWithTooltips(msg.text)}</div>
                        
                        {msg.sender === Sender.AI && !msg.isThinking && (
                            <div className="mt-3 flex gap-2">
                                <button 
                                    onClick={() => {
                                        const priceMatch = msg.text.match(/\$?\d{1,3}(?:,\d{3})*(?:\.\d+)?/);
                                        if (priceMatch) {
                                            setNewAlertPrice(priceMatch[0].replace(/[^0-9.]/g, ''));
                                            setIsAlertModalOpen(true);
                                        } else {
                                            setIsAlertModalOpen(true);
                                        }
                                    }}
                                    className="flex items-center gap-1.5 px-2 py-1 bg-slate-700/50 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 rounded text-[10px] font-mono transition-all border border-slate-700 hover:border-cyan-500/30"
                                >
                                    <BellIcon /> SET ALERT
                                </button>
                            </div>
                        )}

                        {msg.groundingUrls && <GroundingSources urls={msg.groundingUrls} />}
                        <div className={`mt-2 text-[10px] opacity-40 ${msg.sender === Sender.USER ? 'text-white' : 'text-slate-400'}`}>{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>

        <div className="p-3 md:p-6 bg-[#0f111a] border-t border-slate-800 relative z-20 flex-shrink-0">
            {chatImage && (
                <div className="mb-3 flex items-start animate-fade-in-up">
                    <div className="relative group">
                        <img src={chatImage.preview} className="h-16 w-16 object-cover rounded-lg border border-cyan-500/50 shadow-lg" />
                        <button onClick={() => setChatImage(null)} className="absolute -top-2 -right-2 bg-slate-900 border border-slate-700 text-slate-400 rounded-full p-0.5 hover:text-white hover:bg-red-500 transition-colors"><XMarkIcon /></button>
                    </div>
                </div>
            )}
            <div className="flex items-center gap-3 max-w-4xl mx-auto bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus-within:border-cyan-500/50 transition-all shadow-inner">
                <button onClick={() => chatFileInputRef.current?.click()} disabled={appState !== AppState.CHATTING} className="text-slate-400 hover:text-cyan-400 disabled:opacity-50 transition-colors shrink-0"><PaperClipIcon /></button>
                <input type="file" ref={chatFileInputRef} onChange={handleChatFileUpload} accept="image/*" className="hidden" />
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={appState === AppState.CHATTING ? "Ask about targets, levels, or news..." : "Upload chart to start..."}
                    disabled={appState !== AppState.CHATTING}
                    className="flex-1 bg-transparent outline-none text-slate-200 placeholder-slate-600 text-sm min-w-0"
                />
                <button onClick={handleSendMessage} disabled={(!inputValue.trim() && !chatImage) || appState !== AppState.CHATTING} className="p-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white rounded-lg transition-all active:scale-95 shadow-lg shadow-cyan-900/20 shrink-0">
                    {messages.length > 0 && messages[messages.length-1].isThinking ? <LoadingSpinner /> : <SendIcon />}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
