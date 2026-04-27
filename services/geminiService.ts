
import { GoogleGenAI, Type, GenerateContentResponse, ThinkingLevel } from "@google/genai";
import { AnalysisResult, AnalysisConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const retry = async <T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 2);
  }
};

const cleanJson = (text: string): string => {
  return text.replace(/```json\n?|```/g, "").trim();
};

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    sentimentScore: {
      type: Type.NUMBER,
      description: "Score 0-100 based on chart and news.",
    },
    patternIdentified: {
      type: Type.STRING,
      description: "Name of the technical pattern.",
    },
    patternDefinition: {
      type: Type.STRING,
      description: "Explanation of the pattern for the legend.",
    },
    riskRewardRatio: {
      type: Type.STRING,
      description: "Risk to reward ratio.",
    },
    tradeSignal: {
      type: Type.STRING,
      enum: ["BUY", "SELL", "HOLD"],
      description: "Definitive trade signal.",
    },
    assetPrice: {
      type: Type.STRING,
      description: "Exact price from the search tool.",
    },
    detectedAsset: {
      type: Type.STRING,
      description: "Asset name/ticker.",
    },
    priceScale: {
      type: Type.OBJECT,
      properties: {
        min: { type: Type.STRING, description: "Lowest price visible on Y-axis." },
        max: { type: Type.STRING, description: "Highest price visible on Y-axis." },
        current: { type: Type.STRING, description: "The most recent price shown on the chart." }
      },
      required: ["min", "max", "current"]
    },
    newsMarkers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          sentiment: { type: Type.STRING, enum: ["positive", "negative", "neutral"] },
          snippet: { type: Type.STRING },
          x: { type: Type.NUMBER },
          y: { type: Type.NUMBER },
        },
        required: ["sentiment", "snippet", "x", "y"],
      },
    },
    backtestData: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING },
          pnl: { type: Type.NUMBER },
        },
      },
    },
    initialAnalysis: {
      type: Type.STRING,
    },
    riskManagementAdvice: {
      type: Type.STRING,
      description: "Actionable advice on stop-loss, take-profit, and position sizing based on the pattern.",
    },
    supportResistanceLines: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          price: { type: Type.NUMBER },
          type: { type: Type.STRING, enum: ["support", "resistance"] },
          y: { type: Type.NUMBER, description: "Percentage 0-100 from top (0=top, 100=bottom)." },
        },
        required: ["price", "type", "y"],
      },
      description: "Key horizontal support and resistance levels identified on the chart.",
    },
    realTimeNews: {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING, description: "Concise summary of the most recent financial news." },
        geopoliticalContext: { type: Type.STRING, description: "Current wars, conflicts, or geopolitical tensions affecting markets." },
        marketImpact: { type: Type.STRING, description: "How these events are specifically impacting the crypto and traditional markets." },
        sources: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              uri: { type: Type.STRING }
            }
          }
        }
      },
      required: ["summary", "geopoliticalContext", "marketImpact", "sources"]
    },
    probabilityScore: {
      type: Type.NUMBER,
      description: "Mathematical Confidence Scoring (0-100%). Only alert if > 75%.",
    },
    scoreBreakdown: {
      type: Type.OBJECT,
      properties: {
        patternMatch: { type: Type.NUMBER, description: "Max +20%" },
        volumeConfirmation: { type: Type.NUMBER, description: "Max +25%" },
        mtfmAlignment: { type: Type.NUMBER, description: "Max +25%" },
        keyLevelLiquidity: { type: Type.NUMBER, description: "Max +30%" },
      },
      required: ["patternMatch", "volumeConfirmation", "mtfmAlignment", "keyLevelLiquidity"]
    },
    isRetailTrap: { type: Type.BOOLEAN },
    isCounterTrend: { type: Type.BOOLEAN },
    isLowVolume: { type: Type.BOOLEAN },
  },
  required: ["sentimentScore", "patternIdentified", "patternDefinition", "riskRewardRatio", "backtestData", "initialAnalysis", "tradeSignal", "assetPrice", "detectedAsset", "newsMarkers", "priceScale", "riskManagementAdvice", "supportResistanceLines", "realTimeNews", "probabilityScore", "scoreBreakdown", "isRetailTrap", "isCounterTrend", "isLowVolume"],
};

// Fixed: Removed responseMimeType and responseSchema as they are not supported for nano banana models (gemini-2.5-flash-image).
const getCalibrationData = async (base64Image: string, mimeType: string): Promise<{topPrice: number, bottomPrice: number, ticker: string} | null> => {
  try {
    const response = await retry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: mimeType } },
          { text: "OCR Task: Identify the numerical values on the Y-axis. What is the highest price visible and the lowest price visible? Also, what is the asset ticker? Return as JSON: {\"topPrice\": number, \"bottomPrice\": number, \"ticker\": \"string\"}" },
        ],
      },
    }));
    const text = response.text;
    if (!text) return null;
    try {
      return JSON.parse(cleanJson(text));
    } catch {
      console.error('Failed to parse calibration JSON:', text);
      return null;
    }
  } catch (e: unknown) {
    console.error('Calibration failed:', e);
    return null;
  }
};

const generateAnnotatedImage = async (base64Image: string, mimeType: string, config: AnalysisConfig, calibration: {topPrice: number, bottomPrice: number, ticker: string} | null, livePrice: string): Promise<string | null> => {
  try {
    const calContext = calibration ? `The visible Y-axis range is from ${calibration.bottomPrice} to ${calibration.topPrice}. The current live price is ${livePrice}.` : "";
    


    const response = await retry(() => ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: mimeType } },
          { text: `ACT AS AN IMAGE EDITOR. ${calContext} 
            COMMAND: Drawing precision is critical. Draw technical setup lines. 
            Align all horizontal support/resistance zones exactly with the price scale on the right. 
            The price ${livePrice} is your center point. 
            Draw 1 Support line (CYAN) and 1 Target line (MAGENTA) based on technical structure. 
            Return ONLY the modified image with neon overlays.` }
        ]
      },
      config: {
        systemInstruction: "You are a professional charting engine. You must read the Y-axis numbers carefully and place lines at mathematically correct heights based on the price labels. Never hallucinate price levels that don't match the image's axis."
      }
    }));

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (e: unknown) {
    console.error('Image annotation failed:', e);
    return null;
  }
};

export const analyzeChartImage = async (base64Image: string, mimeType: string, config: AnalysisConfig): Promise<AnalysisResult> => {
  try {
    console.log("Starting analysis: Calibration...");
    const calibration = await getCalibrationData(base64Image, mimeType);
    
    console.log("Starting analysis: Visual Description...");
    let visualDescription = "";
    try {
      const initialDescResponse = await retry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64Image, mimeType: mimeType } },
            { text: "Describe the chart structure, price action, and indicators. Pay close attention to the numerical scale." },
          ],
        },
      }));
      visualDescription = initialDescResponse.text || "No visual description available.";
    } catch (descErr) {
      console.warn("Visual description failed, continuing with minimal context:", descErr);
      visualDescription = "Visual description unavailable due to model error.";
    }

    console.log("Starting analysis: Market Search...");
    let searchResponse;
    try {
      searchResponse = await retry(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `
          Today's date is 2026-03-05. 
          FETCH REAL-TIME, ACCURATE WORLDWIDE FINANCIAL NEWS, WARS, AND CONFLICTS.
          Specifically look for:
          1. Major geopolitical conflicts or wars currently active.
          2. Financial news affecting global markets.
          3. Specific news for ${calibration?.ticker || 'the asset in this chart'}.
          4. How these events are impacting the crypto market and traditional stock market.
          DO NOT PROVIDE OLD OR SIMULATED NEWS. BE ACCURATE AS POSSIBLE.
        `,
        config: { tools: [{ googleSearch: {} }] },
      }));
    } catch (searchErr) {
      console.error("Search tool failed, continuing without search data:", searchErr);
      // Fallback if search fails
      searchResponse = { text: "Search data unavailable.", candidates: [] };
    }

    const livePrice = searchResponse.text?.match(/\$?\d{1,3}(?:,\d{3})*(?:\.\d+)?/)?.[0] || "1946.00";

    // Extract grounding sources
    const groundingSources = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => ({
      title: chunk.web?.title || "News Source",
      uri: chunk.web?.uri || ""
    })).filter(s => s.uri) || [];

    console.log("Starting analysis: Image Annotation...");
    const annotatedImage = await generateAnnotatedImage(base64Image, mimeType, config, calibration, livePrice);

    console.log("Starting analysis: Final Reasoning...");
    let analysisResponse;
    try {
      analysisResponse = await retry(() => ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `
          You are a world-class financial analyst, geopolitical strategist, and crypto TA specialist. 
          Current Date: 2026-03-05.
          
          Calibration: ${JSON.stringify(calibration)}
          Visual context: "${visualDescription}"
          Live Search Data & News: "${searchResponse.text}"
          Grounding Sources: ${JSON.stringify(groundingSources)}
          
          TASK: Perform a detailed technical and fundamental analysis and output it as JSON.
          
          ### EXPERTISE RULES:
          1. **Trap Detection (Liquidity Sweeps)**: Do NOT validate any reversal pattern (like Bearish Engulfing) unless it occurs immediately after a Liquidity Sweep (e.g., taking out the Previous Day High, Asian Session High, or a major Swing High). If the pattern forms in the middle of a consolidation range, set 'isRetailTrap' to true and reject the signal.
          2. **Multi-Timeframe Matrix (MTFM) Filter**: For every entry trigger on the execution timeframe, mandate a macro trend check (H1, H4, D1). If the signal is counter-trend to the H4/D1 structure, set 'isCounterTrend' to true and lower the validity score.
          3. **Volume Anomaly & Order Flow Check**: Cross-reference candlestick patterns with Volume data. A valid Bearish Engulfing MUST have a volume spike at least 1.5x to 2x higher than the 20-period moving average of volume. If volume is low or decreasing, set 'isLowVolume' to true.
          4. **Mathematical Confidence Scoring**: Never output definitive Buy or Sell commands in text. Output a 'probabilityScore' out of 100% based on:
             - Pattern Match (+20%)
             - Volume Confirmation (+25%)
             - Multi-Timeframe Alignment (+25%)
             - Key Level/Liquidity Interaction (+30%)
          
          - **Real-Time News**: In 'realTimeNews', provide a summary of the news found in the search data. 
            - 'summary' MUST be a factual, fluff-free summary of the most critical financial events.
            - 'geopoliticalContext' MUST cover current wars, conflicts, or international tensions with zero speculation—only facts from the search data.
            - 'marketImpact' MUST explain the direct correlation between these events and the price action of crypto and traditional stocks.
            - 'sources' MUST include the URLs from the search grounding.
          - **Pattern Recognition**: Identify the dominant chart pattern with high precision.
          - **Investment Advice**: In 'initialAnalysis', provide an "intelligent take" on investment advice for this specific coin. Integrate the technical chart setup with the current geopolitical climate. If the news is bearish but the chart is bullish, explain the conflict.
          - **Risk Management**: Provide specific, mathematically sound advice on stop-loss, take-profit, and position sizing.
          - **Coordinates**: Ensure all 'y' coordinates match the Y-axis scale (0=top, 100=bottom).
          
          STRICT REQUIREMENT: DO NOT FLUFF. DO NOT PROVIDE SIMULATED OR OLD NEWS. IF NO RELEVANT NEWS IS FOUND, STATE THAT CLEARLY.
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: ANALYSIS_SCHEMA,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        },
      }));
    } catch (proErr) {
      console.warn("Pro model failed, falling back to Flash for final analysis:", proErr);
      analysisResponse = await retry(() => ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `
          Perform a technical and fundamental analysis based on:
          Calibration: ${JSON.stringify(calibration)}
          Visual context: "${visualDescription}"
          Live Search Data & News: "${searchResponse.text}"
          
          Output as JSON following the schema.
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: ANALYSIS_SCHEMA,
        },
      }));
    }
    
    const text = analysisResponse.text;
    if (text) {
      console.log("Analysis successful, parsing result...");
      const result = JSON.parse(cleanJson(text)) as AnalysisResult;
      result.annotatedChartUrl = annotatedImage;
      result.config = config;
      return result;
    } else {
      console.error("Final analysis response was empty.");
      throw new Error("The AI model returned an empty analysis. This can happen if the image is too complex or triggers safety filters.");
    }
  } catch (error: unknown) {
    console.error("Analysis Error Details:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred during analysis.";
    throw new Error(`Analysis Failed: ${message}`);
  }
};

export const getPriceCheck = async (asset: string): Promise<number | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search for current price of ${asset}. Number only.`,
      config: { tools: [{ googleSearch: {} }] },
    });
    const priceStr = response.text?.replace(/[^0-9.]/g, '');
    return priceStr ? parseFloat(priceStr) : null;
  } catch (e: unknown) {
    console.error('Price check failed:', e);
    return null;
  }
};

export const streamChat = async function* (
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  newMessage: string
) {
  const chat = ai.chats.create({
    model: 'gemini-3.1-pro-preview',
    history: history,
    config: {
      systemInstruction: `You are a world-class financial analyst and crypto trader. 
        Follow these EXPERTISE RULES:
        1. **Trap Detection**: Do NOT validate reversal patterns unless they occur after a Liquidity Sweep (PDH, Asian High, Major Swing High). Tag middle-of-range patterns as 'Retail Trap'.
        2. **MTFM Filter**: Mandate macro trend checks (H1, H4, D1). If execution timeframe signal is counter-trend to H4/D1, flag as 'Counter-Trend Risk'.
        3. **Volume Anomaly**: Valid patterns MUST have 1.5x-2x volume spike vs 20-period MA.
        4. **Mathematical Confidence**: Output a 'Probability Score' out of 100% based on: Pattern Match (+20%), Volume (+25%), MTFM Alignment (+25%), Key Level/Liquidity (+30%).
        Only alert if score > 75%. Use Search for real-time data.`,
      tools: [{ googleSearch: {} }],
    }
  });
  const resultStream = await chat.sendMessageStream({ message: newMessage });
  for await (const chunk of resultStream) {
    yield chunk as GenerateContentResponse;
  }
};

export const getMarketPulse = async (): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "1-sentence crypto pulse.",
  });
  return response.text || "";
};
