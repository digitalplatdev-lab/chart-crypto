
import axios from 'axios';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export const syncCoinList = async () => {
  try {
    const response = await axios.get(`${COINGECKO_API}/coins/list`);
    return response.data;
  } catch (error) {
    console.error('Error syncing coin list:', error);
    return [];
  }
};

export const searchCoinId = async (query: string): Promise<string | null> => {
  try {
    const response = await axios.get(`${COINGECKO_API}/search`, {
      params: { query }
    });
    const coins = response.data.coins;
    if (coins && coins.length > 0) {
      // Find exact symbol match if possible, otherwise take the first result
      const exactMatch = coins.find((c: { symbol: string; id: string }) => c.symbol.toLowerCase() === query.toLowerCase());
      return exactMatch ? exactMatch.id : coins[0].id;
    }
    return null;
  } catch (error) {
    console.error('Error searching coin ID:', error);
    return null;
  }
};

export const getMarketData = async (symbol: string) => {
  try {
    const coinId = symbol.toLowerCase();
    
    // Try to get data with the symbol as ID first
    try {
      const response = await axios.get(`${COINGECKO_API}/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
          sparkline: true,
        },
      });
      return response.data;
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.status === 404) {
        // If not found, search for the correct ID
        const searchedId = await searchCoinId(symbol);
        if (searchedId && searchedId !== coinId) {
          const response = await axios.get(`${COINGECKO_API}/coins/${searchedId}`, {
            params: {
              localization: false,
              tickers: false,
              market_data: true,
              community_data: false,
              developer_data: false,
              sparkline: true,
            },
          });
          return response.data;
        }
      }
      throw e;
    }
  } catch (error) {
    console.error('Error fetching market data:', error);
    throw error;
  }
};

export const getHistoricalData = async (symbol: string, days: number = 7) => {
  try {
    const coinId = symbol.toLowerCase();

    // Try with symbol as ID first
    try {
      const response = await axios.get(`${COINGECKO_API}/coins/${coinId}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: days,
        },
      });
      return response.data;
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.status === 404) {
        const searchedId = await searchCoinId(symbol);
        if (searchedId && searchedId !== coinId) {
          const response = await axios.get(`${COINGECKO_API}/coins/${searchedId}/market_chart`, {
            params: {
              vs_currency: 'usd',
              days: days,
            },
          });
          return response.data;
        }
      }
      throw e;
    }
  } catch (error) {
    console.error('Error fetching historical data:', error);
    throw error;
  }
};
