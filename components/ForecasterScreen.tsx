import React, { useState, useMemo, useEffect } from 'react';
import { ForecastRecord, Client, Product } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, BarChart2, Settings } from 'lucide-react';
import { MaximizeWrapper } from './MaximizeWrapper';

interface ForecasterScreenProps {
  data: ForecastRecord[];
  clients: Client[];
  products: Product[];
}

export default function ForecasterScreen({ data, clients, products }: ForecasterScreenProps) {
  const [selectedClient, setSelectedClient] = useState<string>('All');
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<string>('All');
  const [selectedSubsidiary, setSelectedSubsidiary] = useState<string>('All');
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [metric, setMetric] = useState<'sales' | 'gp' | 'qty' | 'gp_mt'>('sales');

  // If Broker is selected, default metric to gp_mt if it was sales
  useEffect(() => {
    if (selectedSection === 'Broker' && metric === 'sales') {
      setMetric('gp_mt');
    }
  }, [selectedSection, metric]);

  // Forecasting Parameters
  const [method, setMethod] = useState<'linear' | 'sma' | 'wma' | 'ema' | 'sarima'>('linear');
  const [trainSplit, setTrainSplit] = useState<number>(90);
  const [smaPeriod, setSmaPeriod] = useState<number>(3);
  const [wmaPeriod, setWmaPeriod] = useState<number>(3);
  const [emaAlpha, setEmaAlpha] = useState<number>(0.3);

  // Extract unique options based on other filters
  const uniqueSubsidiaries = useMemo(() => {
    const validData = data.filter(d => 
      d.status === 'Booked' &&
      (selectedSection === 'All' || d.section === selectedSection) &&
      (selectedClient === 'All' || d.client === selectedClient) &&
      (selectedCountry === 'All' || d.country === selectedCountry) &&
      (selectedProduct === 'All' || d.product === selectedProduct)
    );
    const validClients = clients.filter(c => 
      (selectedSection === 'All' || c.section === selectedSection) &&
      (selectedClient === 'All' || c.name === selectedClient) &&
      (selectedCountry === 'All' || c.country === selectedCountry)
    );
    return Array.from(new Set([
      ...validData.map(d => d.subsidiary),
      ...validClients.map(c => c.subsidiary)
    ])).filter(Boolean).sort();
  }, [data, clients, selectedSection, selectedClient, selectedCountry, selectedProduct]);

  const uniqueSections = useMemo(() => {
    const validData = data.filter(d => 
      d.status === 'Booked' &&
      (selectedSubsidiary === 'All' || d.subsidiary === selectedSubsidiary) &&
      (selectedClient === 'All' || d.client === selectedClient) &&
      (selectedCountry === 'All' || d.country === selectedCountry) &&
      (selectedProduct === 'All' || d.product === selectedProduct)
    );
    const validClients = clients.filter(c => 
      (selectedSubsidiary === 'All' || c.subsidiary === selectedSubsidiary) &&
      (selectedClient === 'All' || c.name === selectedClient) &&
      (selectedCountry === 'All' || c.country === selectedCountry)
    );
    return Array.from(new Set([
      ...validData.map(d => d.section),
      ...validClients.map(c => c.section)
    ])).filter(Boolean).sort();
  }, [data, clients, selectedSubsidiary, selectedClient, selectedCountry, selectedProduct]);

  const uniqueClients = useMemo(() => {
    const validData = data.filter(d => 
      d.status === 'Booked' &&
      (selectedSubsidiary === 'All' || d.subsidiary === selectedSubsidiary) &&
      (selectedSection === 'All' || d.section === selectedSection) &&
      (selectedCountry === 'All' || d.country === selectedCountry) &&
      (selectedProduct === 'All' || d.product === selectedProduct)
    );
    const validClients = clients.filter(c => 
      (selectedSubsidiary === 'All' || c.subsidiary === selectedSubsidiary) &&
      (selectedSection === 'All' || c.section === selectedSection) &&
      (selectedCountry === 'All' || c.country === selectedCountry)
    );
    return Array.from(new Set([
      ...validData.map(d => d.client),
      ...validClients.map(c => c.name)
    ])).filter(Boolean).sort();
  }, [data, clients, selectedSubsidiary, selectedSection, selectedCountry, selectedProduct]);

  const uniqueCountries = useMemo(() => {
    const validData = data.filter(d => 
      d.status === 'Booked' &&
      (selectedSubsidiary === 'All' || d.subsidiary === selectedSubsidiary) &&
      (selectedSection === 'All' || d.section === selectedSection) &&
      (selectedClient === 'All' || d.client === selectedClient) &&
      (selectedProduct === 'All' || d.product === selectedProduct)
    );
    const validClients = clients.filter(c => 
      (selectedSubsidiary === 'All' || c.subsidiary === selectedSubsidiary) &&
      (selectedSection === 'All' || c.section === selectedSection) &&
      (selectedClient === 'All' || c.name === selectedClient)
    );
    return Array.from(new Set([
      ...validData.map(d => d.country),
      ...validClients.map(c => c.country)
    ])).filter(Boolean).sort();
  }, [data, clients, selectedSubsidiary, selectedSection, selectedClient, selectedProduct]);

  const uniqueProducts = useMemo(() => {
    const validData = data.filter(d => 
      d.status === 'Booked' &&
      (selectedSubsidiary === 'All' || d.subsidiary === selectedSubsidiary) &&
      (selectedSection === 'All' || d.section === selectedSection) &&
      (selectedClient === 'All' || d.client === selectedClient) &&
      (selectedCountry === 'All' || d.country === selectedCountry)
    );
    return Array.from(new Set(validData.map(d => d.product))).sort();
  }, [data, selectedSubsidiary, selectedSection, selectedClient, selectedCountry]);

  // Reset selections if they are no longer valid
  React.useEffect(() => {
    if (selectedSubsidiary !== 'All' && !uniqueSubsidiaries.includes(selectedSubsidiary)) {
      setSelectedSubsidiary('All');
    }
  }, [uniqueSubsidiaries, selectedSubsidiary]);

  React.useEffect(() => {
    if (selectedSection !== 'All' && !uniqueSections.includes(selectedSection)) {
      setSelectedSection('All');
    }
  }, [uniqueSections, selectedSection]);

  React.useEffect(() => {
    if (selectedClient !== 'All' && !uniqueClients.includes(selectedClient)) {
      setSelectedClient('All');
    }
  }, [uniqueClients, selectedClient]);

  React.useEffect(() => {
    if (selectedCountry !== 'All' && !uniqueCountries.includes(selectedCountry)) {
      setSelectedCountry('All');
    }
  }, [uniqueCountries, selectedCountry]);

  React.useEffect(() => {
    if (selectedProduct !== 'All' && !uniqueProducts.includes(selectedProduct)) {
      setSelectedProduct('All');
    }
  }, [uniqueProducts, selectedProduct]);

  const handleClearFilters = () => {
    setMetric('qty');
    setSelectedSubsidiary('All');
    setSelectedSection('All');
    setSelectedCountry('All');
    setSelectedClient('All');
    setSelectedProduct('All');
  };

  // Filter data based on selections
  const filteredHistory = useMemo(() => {
    return data.filter(d => {
      if (d.status !== 'Booked') return false;
      if (selectedSubsidiary !== 'All' && d.subsidiary !== selectedSubsidiary) return false;
      if (selectedSection !== 'All' && d.section !== selectedSection) return false;
      if (selectedClient !== 'All' && d.client !== selectedClient) return false;
      if (selectedCountry !== 'All' && d.country !== selectedCountry) return false;
      if (selectedProduct !== 'All' && d.product !== selectedProduct) return false;
      return true;
    });
  }, [data, selectedSubsidiary, selectedSection, selectedClient, selectedCountry, selectedProduct]);

  // Group by month/year and calculate metric
  const historicalData = useMemo(() => {
    const grouped = new Map<string, { sum: number, qty: number }>();
    
    filteredHistory.forEach(d => {
      const key = `${d.year}-${String(d.month).padStart(2, '0')}`;
      const current = grouped.get(key) || { sum: 0, qty: 0 };
      
      let val = 0;
      if (metric === 'sales') val = d.sales || 0;
      else if (metric === 'gp') val = d.gp || 0;
      else if (metric === 'qty') val = d.qty || 0;
      else if (metric === 'gp_mt') val = d.gp || 0; // We will divide by qty later

      grouped.set(key, {
        sum: current.sum + val,
        qty: current.qty + (d.qty || 0)
      });
    });

    // Sort chronologically
    const sortedKeys = Array.from(grouped.keys()).sort();
    return sortedKeys.map((key, index) => {
      const data = grouped.get(key)!;
      let value = data.sum;
      if (metric === 'gp_mt') {
        value = data.qty > 0 ? data.sum / data.qty : 0;
      }
      return {
        period: key,
        t: index, // time index for regression
        value
      };
    });
  }, [filteredHistory, metric]);

  // Forecasting Logic (Multiple Methods with Train/Test Split)
  const forecastModel = useMemo(() => {
    if (historicalData.length < 2) return null;

    const n = historicalData.length;
    const trainSize = Math.max(2, Math.floor(n * (trainSplit / 100)));
    const trainData = historicalData.slice(0, trainSize);
    const testData = historicalData.slice(trainSize);

    let standardError = 0;
    let testError = 0;
    let testMape = 0;
    
    const predictions: number[] = [];
    
    if (method === 'linear') {
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      trainData.forEach(d => {
        sumX += d.t;
        sumY += d.value;
        sumXY += d.t * d.value;
        sumXX += d.t * d.t;
      });
      const slope = (trainSize * sumXY - sumX * sumY) / (trainSize * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / trainSize;

      let sumSqErr = 0;
      trainData.forEach(d => {
        const pred = slope * d.t + intercept;
        predictions[d.t] = pred;
        sumSqErr += Math.pow(d.value - pred, 2);
      });
      standardError = Math.sqrt(sumSqErr / Math.max(1, trainSize - 2));

      for (let t = trainSize; t < n + 6; t++) {
        predictions[t] = slope * t + intercept;
      }
    } else if (method === 'sma') {
      let sumSqErr = 0;
      let countSE = 0;
      
      const getActualOrPred = (idx: number) => {
        if (idx < n) return historicalData[idx].value;
        return predictions[idx];
      };

      for (let t = 0; t < n + 6; t++) {
        if (t < smaPeriod) {
          predictions[t] = t === 0 ? trainData[0].value : trainData.slice(0, t).reduce((a, b) => a + b.value, 0) / t;
        } else {
          let sum = 0;
          for (let i = 1; i <= smaPeriod; i++) {
            sum += getActualOrPred(t - i);
          }
          predictions[t] = sum / smaPeriod;
        }

        if (t < trainSize && t >= smaPeriod) {
          sumSqErr += Math.pow(trainData[t].value - predictions[t], 2);
          countSE++;
        }
      }
      standardError = countSE > 0 ? Math.sqrt(sumSqErr / countSE) : 0;
    } else if (method === 'wma') {
      let sumSqErr = 0;
      let countSE = 0;
      
      const getActualOrPred = (idx: number) => {
        if (idx < n) return historicalData[idx].value;
        return predictions[idx];
      };

      const weightSum = (wmaPeriod * (wmaPeriod + 1)) / 2;

      for (let t = 0; t < n + 6; t++) {
        if (t < wmaPeriod) {
          predictions[t] = t === 0 ? trainData[0].value : trainData.slice(0, t).reduce((a, b) => a + b.value, 0) / t;
        } else {
          let sum = 0;
          for (let i = 1; i <= wmaPeriod; i++) {
            const w = wmaPeriod - i + 1;
            sum += getActualOrPred(t - i) * w;
          }
          predictions[t] = sum / weightSum;
        }

        if (t < trainSize && t >= wmaPeriod) {
          sumSqErr += Math.pow(trainData[t].value - predictions[t], 2);
          countSE++;
        }
      }
      standardError = countSE > 0 ? Math.sqrt(sumSqErr / countSE) : 0;
    } else if (method === 'ema') {
      let sumSqErr = 0;
      let countSE = 0;
      
      const getActualOrPred = (idx: number) => {
        if (idx < n) return historicalData[idx].value;
        return predictions[idx];
      };

      for (let t = 0; t < n + 6; t++) {
        if (t === 0) {
          predictions[t] = trainData[0].value;
        } else {
          predictions[t] = emaAlpha * getActualOrPred(t - 1) + (1 - emaAlpha) * predictions[t - 1];
        }

        if (t < trainSize && t > 0) {
          sumSqErr += Math.pow(trainData[t].value - predictions[t], 2);
          countSE++;
        }
      }
      standardError = countSE > 0 ? Math.sqrt(sumSqErr / countSE) : 0;
    } else if (method === 'sarima') {
      // Simplified SARIMA (Seasonal AR) implementation for demonstration
      // Uses a basic seasonal lag (e.g., lag 12 for monthly) and an AR(1) component
      const seasonality = 12; // Assume 12-month seasonality
      let sumSqErr = 0;
      let countSE = 0;
      
      const getActualOrPred = (idx: number) => {
        if (idx < n) return historicalData[idx].value;
        return predictions[idx];
      };

      for (let t = 0; t < n + 6; t++) {
        if (t < seasonality) {
          // Fallback to simple average for initial periods
          predictions[t] = t === 0 ? trainData[0].value : trainData.slice(0, t).reduce((a, b) => a + b.value, 0) / t;
        } else {
          // SARIMA simplified: Value = Seasonal_Lag + AR_Term * (Previous - Previous_Seasonal_Lag)
          const seasonalLag = getActualOrPred(t - seasonality);
          const prev = getActualOrPred(t - 1);
          const prevSeasonalLag = getActualOrPred(t - seasonality - 1 >= 0 ? t - seasonality - 1 : 0);
          const arTerm = 0.5; // Fixed AR coefficient for simplicity
          
          predictions[t] = seasonalLag + arTerm * (prev - prevSeasonalLag);
        }

        if (t < trainSize && t >= seasonality) {
          sumSqErr += Math.pow(trainData[t].value - predictions[t], 2);
          countSE++;
        }
      }
      standardError = countSE > 0 ? Math.sqrt(sumSqErr / countSE) : 0;
    }

    if (testData.length > 0) {
      let sumAbsErr = 0;
      let sumPctErr = 0;
      testData.forEach(d => {
        const pred = predictions[d.t];
        const actual = d.value;
        sumAbsErr += Math.abs(actual - pred);
        if (actual !== 0) {
          sumPctErr += Math.abs((actual - pred) / actual);
        }
      });
      testError = sumAbsErr / testData.length;
      testMape = (sumPctErr / testData.length) * 100;
    }

    const lastPeriod = historicalData[historicalData.length - 1].period;
    const [lastYear, lastMonth] = lastPeriod.split('-').map(Number);
    
    const forecasts = [];
    const zScore = 1.28;
    const marginOfError = zScore * standardError;

    for (let i = 1; i <= 6; i++) {
      let nextMonth = lastMonth + i;
      let nextYear = lastYear;
      if (nextMonth > 12) {
        nextMonth -= 12;
        nextYear += 1;
      }
      
      const t = n - 1 + i;
      const predicted = predictions[t];

      forecasts.push({
        period: `${nextYear}-${String(nextMonth).padStart(2, '0')}`,
        MostProbable: Math.max(0, predicted),
        Best: Math.max(0, predicted + marginOfError),
        Worst: Math.max(0, predicted - marginOfError)
      });
    }

    return {
      forecasts,
      predictions,
      testError,
      testMape,
      trainSize,
      testSize: testData.length
    };
  }, [historicalData, method, trainSplit, smaPeriod, wmaPeriod, emaAlpha]);

  // Combine history and forecast for charting
  const chartData = useMemo(() => {
    if (!forecastModel) return [];
    const { forecasts, predictions, trainSize } = forecastModel;

    const combined = historicalData.map(d => ({
      period: d.period,
      Historical: d.value,
      TestPrediction: d.t >= trainSize ? predictions[d.t] : null,
      MostProbable: null,
      Best: null,
      Worst: null,
      isTest: d.t >= trainSize
    }));

    if (combined.length > 0 && forecasts.length > 0) {
      const lastHist = combined[combined.length - 1];
      forecasts.unshift({
        period: lastHist.period,
        MostProbable: lastHist.Historical,
        Best: lastHist.Historical,
        Worst: lastHist.Historical
      } as any);
    }

    forecasts.forEach(f => {
      const existing = combined.find(c => c.period === f.period);
      if (existing) {
        existing.MostProbable = f.MostProbable;
        existing.Best = f.Best;
        existing.Worst = f.Worst;
      } else {
        combined.push({
          period: f.period,
          Historical: null,
          TestPrediction: null,
          MostProbable: f.MostProbable,
          Best: f.Best,
          Worst: f.Worst,
          isTest: false
        });
      }
    });

    return combined;
  }, [historicalData, forecastModel]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-JO', { style: 'currency', currency: 'JOD', maximumFractionDigits: 0 }).format(val);
  const formatNumber = (val: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(val);
  const formatGPMT = (val: number) => new Intl.NumberFormat('en-JO', { style: 'currency', currency: 'JOD', maximumFractionDigits: 1 }).format(val) + '/MT';
  const formatter = metric === 'qty' ? formatNumber : (metric === 'gp_mt' ? formatGPMT : formatCurrency);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="text-blue-600" />
            Statistical Forecaster
          </h1>
          <p className="text-slate-500">Predict future performance based on historical booked orders.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Metric</label>
            <select 
              value={metric} 
              onChange={(e) => setMetric(e.target.value as any)}
              className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {selectedSection !== 'Broker' && <option value="sales">Sales Revenue</option>}
              <option value="gp">Gross Profit</option>
              <option value="gp_mt">Gross Profit / MT</option>
              <option value="qty">Volume (Qty)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subsidiary</label>
            <select 
              value={selectedSubsidiary} 
              onChange={(e) => setSelectedSubsidiary(e.target.value)}
              className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="All">All Subsidiaries</option>
              {uniqueSubsidiaries.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Section</label>
            <select 
              value={selectedSection} 
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="All">All Sections</option>
              {uniqueSections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
            <select 
              value={selectedCountry} 
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="All">Total Business (All Countries)</option>
              {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Client</label>
            <select 
              value={selectedClient} 
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="All">All Clients</option>
              {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product</label>
            <select 
              value={selectedProduct} 
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="All">All Products</option>
              {uniqueProducts.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button 
            onClick={handleClearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Forecasting Parameters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Settings size={16} className="text-slate-400" />
          Model Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Method</label>
            <select 
              value={method} 
              onChange={(e) => setMethod(e.target.value as any)}
              className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-1.5"
            >
              <option value="linear">Linear Regression</option>
              <option value="sma">Simple Moving Average</option>
              <option value="wma">Weighted Moving Average</option>
              <option value="ema">Exponential Smoothing</option>
              <option value="sarima">SARIMA (Seasonal AR)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Train/Test Split ({trainSplit}% Train)</label>
            <input 
              type="range" 
              min="50" max="95" step="5"
              value={trainSplit} 
              onChange={(e) => setTrainSplit(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {method === 'sma' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">SMA Period (Months)</label>
              <input 
                type="number" min="2" max="12"
                value={smaPeriod} 
                onChange={(e) => setSmaPeriod(Number(e.target.value))}
                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-1.5"
              />
            </div>
          )}

          {method === 'wma' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">WMA Period (Months)</label>
              <input 
                type="number" min="2" max="12"
                value={wmaPeriod} 
                onChange={(e) => setWmaPeriod(Number(e.target.value))}
                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-1.5"
              />
            </div>
          )}

          {method === 'ema' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Alpha (Smoothing Factor)</label>
              <input 
                type="number" min="0.1" max="0.9" step="0.1"
                value={emaAlpha} 
                onChange={(e) => setEmaAlpha(Number(e.target.value))}
                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-1.5"
              />
            </div>
          )}
        </div>
      </div>

      {/* Chart Area */}
      <MaximizeWrapper title="Forecast Projection (Next 6 Months)">
        <div className="flex justify-end items-start mb-6">
          {forecastModel && forecastModel.testSize > 0 && (
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-end text-sm">
              <span className="font-semibold text-slate-700 mb-1">Model Accuracy (Test Set: {forecastModel.testSize} months)</span>
              <div className="flex gap-4">
                <div>
                  <span className="text-slate-500 mr-1">MAE:</span>
                  <span className="font-bold text-slate-800">{formatter(forecastModel.testError)}</span>
                </div>
                <div>
                  <span className="text-slate-500 mr-1">MAPE:</span>
                  <span className="font-bold text-slate-800">{forecastModel.testMape.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {historicalData.length < 2 ? (
          <div className="h-96 flex items-center justify-center text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            Not enough historical booked orders to generate a forecast for this selection.
          </div>
        ) : (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickMargin={10}
                />
                <YAxis 
                  tickFormatter={(val) => metric === 'qty' ? val.toString() : (metric === 'gp_mt' ? `JOD ${val}/MT` : `JOD ${val/1000}k`)}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  width={80}
                />
                <Tooltip 
                  formatter={(value: number) => formatter(value)}
                  labelStyle={{ color: '#0f172a', fontWeight: 'bold', marginBottom: '4px' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                
                <Line 
                  type="monotone" 
                  dataKey="Historical" 
                  stroke="#0f172a" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#0f172a' }}
                  activeDot={{ r: 6 }}
                  name="Historical Actuals"
                />
                <Line 
                  type="monotone" 
                  dataKey="TestPrediction" 
                  stroke="#f59e0b" 
                  strokeWidth={2} 
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#f59e0b' }}
                  name="Model Test Prediction"
                />
                <Line 
                  type="monotone" 
                  dataKey="MostProbable" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#3b82f6' }}
                  name="Most Probable Forecast"
                />
                <Line 
                  type="monotone" 
                  dataKey="Best" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  strokeDasharray="3 3"
                  dot={false}
                  name="Best Case Scenario"
                />
                <Line 
                  type="monotone" 
                  dataKey="Worst" 
                  stroke="#ef4444" 
                  strokeWidth={2} 
                  strokeDasharray="3 3"
                  dot={false}
                  name="Worst Case Scenario"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </MaximizeWrapper>

      {/* Summary Cards */}
      {forecastModel && forecastModel.forecasts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-xl">
            <h4 className="text-emerald-800 font-medium mb-1">Best Case (6 Mo Avg)</h4>
            <p className="text-2xl font-bold text-emerald-600">
              {formatter(forecastModel.forecasts.reduce((sum, f) => sum + f.Best, 0) / forecastModel.forecasts.length)}
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
            <h4 className="text-blue-800 font-medium mb-1">Most Probable (6 Mo Avg)</h4>
            <p className="text-2xl font-bold text-blue-600">
              {formatter(forecastModel.forecasts.reduce((sum, f) => sum + f.MostProbable, 0) / forecastModel.forecasts.length)}
            </p>
          </div>
          <div className="bg-red-50 border border-red-100 p-5 rounded-xl">
            <h4 className="text-red-800 font-medium mb-1">Worst Case (6 Mo Avg)</h4>
            <p className="text-2xl font-bold text-red-600">
              {formatter(forecastModel.forecasts.reduce((sum, f) => sum + f.Worst, 0) / forecastModel.forecasts.length)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
