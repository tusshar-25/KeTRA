// Stock data service using existing backend API
import api from "./api";

export const getStockDetails = async (symbol) => {
  try {
    // Use existing market API to get stock details
    const response = await api.get(`/market/stocks?symbols=${symbol}`);
    
    if (response.data && response.data.stocks && response.data.stocks.length > 0) {
      const stock = response.data.stocks[0];
      
      // Map backend data to expected format
      return {
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        change: stock.change,
        percent: stock.changePercent,
        positive: stock.change >= 0,
        volume: stock.volume,
        marketCap: stock.marketCap,
        sector: stock.sector,
        industry: stock.industry,
        exchange: stock.exchange,
        marketType: stock.marketType,
        dayHigh: stock.dayHigh,
        dayLow: stock.dayLow,
        week52High: stock.week52High,
        week52Low: stock.week52Low,
        avgVolume: stock.avgVolume,
        pe: stock.pe,
        eps: stock.eps,
        bookValue: stock.bookValue,
        faceValue: stock.faceValue,
        dividend: stock.dividend,
        dividendYield: stock.dividendYield,
        promoterHolding: stock.promoterHolding,
        institutionalHolding: stock.institutionalHolding,
        publicHolding: stock.publicHolding,
        // Enhanced financial metrics
        roe: stock.roe,
        debtToEquity: stock.debtToEquity,
        currentRatio: stock.currentRatio,
        quickRatio: stock.quickRatio,
        grossMargin: stock.grossMargin,
        operatingMargin: stock.operatingMargin,
        netProfitMargin: stock.netProfitMargin,
        revenueGrowth: stock.revenueGrowth,
        earningsGrowth: stock.earningsGrowth,
        priceToBook: stock.priceToBook,
        priceToSales: stock.priceToSales,
        beta: stock.beta,
        volatility: stock.volatility,
        // Trading information
        avgTurnover: stock.avgTurnover,
        marketCapCategory: stock.marketCapCategory,
        listingDate: stock.listingDate,
        isinIndex: stock.isinIndex,
        circuitLimit: stock.circuitLimit,
        freezeLimit: stock.freezeLimit,
        lotSize: stock.lotSize,
        tickSize: stock.tickSize,
        // Additional details
        companyType: stock.companyType,
        founded: stock.founded,
        headquarters: stock.headquarters,
        website: stock.website,
        ceo: stock.ceo,
        employees: stock.employees,
        creditRating: stock.creditRating,
        description: stock.description
      };
    }
    
    throw new Error('Stock not found');
  } catch (error) {
    console.error('Error fetching stock details:', error);
    throw error;
  }
};

export const getHistoricalData = async (symbol, period = '1Y') => {
  try {
    // For now, generate mock historical data since backend doesn't have this endpoint
    // You can add a backend endpoint for historical data later
    const mockHistorical = [];
    let basePrice = 1500; // Base price
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000);
      const volatility = 0.02 + Math.random() * 0.01;
      const momentum = Math.random() > 0.5 ? 1 : -1;
      
      const open = basePrice * (1 + (Math.random() - 0.5) * volatility);
      const close = basePrice * (1 + momentum * volatility * 0.5);
      const high = Math.max(open, close) * (1 + Math.random() * volatility);
      const low = Math.min(open, close) * (1 - Math.random() * volatility);
      const volume = Math.floor(Math.random() * 3000000) + 500000;
      
      mockHistorical.push({
        date: date.toISOString().split('T')[0],
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: volume,
        change: parseFloat((close - basePrice).toFixed(2)),
        changePercent: parseFloat(((close - basePrice) / basePrice * 100).toFixed(2))
      });
      
      basePrice = close;
      if (Math.random() > 0.7) momentum *= -1;
    }
    
    return mockHistorical.reverse();
  } catch (error) {
    console.error('Error fetching historical data:', error);
    throw error;
  }
};

// Helper functions
const getMarketCapCategory = (marketCap) => {
  if (marketCap >= 20000) return 'Large Cap';
  if (marketCap >= 5000) return 'Mid Cap';
  return 'Small Cap';
};

const getCreditRating = (meta) => {
  // This would typically come from a separate API
  // Using defaults based on market position
  if (meta.marketCap && meta.marketCap > 50000) return 'AAA';
  if (meta.marketCap && meta.marketCap > 20000) return 'AA';
  return 'A';
};
