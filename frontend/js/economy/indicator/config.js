export const INDICATORS_CONFIG = {
    '^GSPC': { name: 'S&P 500', unit: 'pt' },
    '^IXIC': { name: 'NASDAQ', unit: 'pt' },
    '^DJI': { name: 'Dow Jones', unit: 'pt' },
    '^VIX': { name: 'VIX', unit: 'pt' },
    '^KS11': { name: 'KOSPI', unit: 'pt' },
    '^KQ11': { name: 'KOSDAQ', unit: 'pt' },
    'KRW=X': { name: 'USD/KRW', unit: 'KRW' },
    'DX-Y.NYB': { name: 'Dollar Index', unit: 'pt' },
    'EURUSD=X': { name: 'EUR/USD', unit: 'USD' },
    'JPY=X': { name: 'USD/JPY', unit: 'JPY' },
    '^TNX': { name: 'US 10Y Yield', unit: '%' },
    '^IRX': { name: 'US 3M Yield', unit: '%' },
    'GC=F': { name: 'Gold', unit: 'USD' },
    'CL=F': { name: 'WTI Oil', unit: 'USD' },
    'SI=F': { name: 'Silver', unit: 'USD' },
};

export const indicatorSymbols = Object.keys(INDICATORS_CONFIG);
