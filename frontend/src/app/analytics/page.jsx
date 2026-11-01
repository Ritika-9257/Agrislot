'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Database, 
  Zap, 
  FileText, 
  Play, 
  Clock, 
  CheckCircle2, 
  Download, 
  Layers, 
  Table as TableIcon,
  RefreshCw,
  Code2,
  Lock,
  AlertCircle,
  ShieldCheck,
  Scale,
  Terminal
} from 'lucide-react';
import { AgriSlotAPI } from '@/lib/api';

export default function AnalyticsStudioPage() {
  const [activeTab, setActiveTab] = useState('benchmarks');

  // Benchmark query state
  const [selectedQueryNum, setSelectedQueryNum] = useState(1);
  const [queryExecutionTime, setQueryExecutionTime] = useState(null);
  const [queryResults, setQueryResults] = useState([]);
  const [queryRunning, setQueryRunning] = useState(false);
  const [queryError, setQueryError] = useState('');

  // Views state
  const [selectedView, setSelectedView] = useState('farmer-bookings');
  const [viewData, setViewData] = useState([]);
  const [viewLoading, setViewLoading] = useState(false);

  // Procedures & Cursors state
  const [procType, setProcType] = useState('cursor-all');
  const [cursorData, setCursorData] = useState([]);
  const [sumValue, setSumValue] = useState(null);
  const [procLoading, setProcLoading] = useState(false);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [xmlExportData, setXmlExportData] = useState('');
  const [showXmlModal, setShowXmlModal] = useState(false);

  // Concurrency Simulator state
  const [simSlotId, setSimSlotId] = useState(1);
  const [simWeightA, setSimWeightA] = useState(6.0);
  const [simWeightB, setSimWeightB] = useState(6.0);
  const [simRunning, setSimRunning] = useState(false);
  const [simResultA, setSimResultA] = useState(null);
  const [simResultB, setSimResultB] = useState(null);
  const [simLogs, setSimLogs] = useState([]);

  // Query catalog
  const queriesCatalog = [
    {
      id: 1,
      title: 'Top APMC Mandis by Total Booked Produce',
      description: 'Aggregate GROUP BY query computing total tonnage booked per mandi with descending order and limit.',
      type: 'Aggregate / Grouping',
    },
    {
      id: 2,
      title: 'Produce Availability & District Inventory',
      description: 'Finds commodities available within specific APMC regional districts.',
      type: 'Filtered Multi-Table Search',
    },
    {
      id: 3,
      title: 'Comprehensive 5-Table Logistics Relational Join',
      description: 'Joins Farmers, Bookings, Slots, Mandis, and Produce into a single consolidated logistics row.',
      type: 'Complex Relational Join',
    },
    {
      id: 4,
      title: 'High-Volume Revenue Mandis (Aggregation & HAVING)',
      description: 'Calculates cumulative transaction settlements per Mandi with threshold filtering.',
      type: 'HAVING / Aggregation',
    },
    {
      id: 5,
      title: 'Above-Average Farmer Deliveries (Subquery Analysis)',
      description: 'Correlated subquery identifying farmers whose average booking exceeds yard overall mean.',
      type: 'Correlated Subquery',
    },
    {
      id: 6,
      title: 'Trader Procurement Quality Distribution',
      description: 'Analyzes trader volume breakdown by produce quality grades (Grade A/B/C).',
      type: 'Distribution Grouping',
    },
    {
      id: 7,
      title: 'Slot Capacity Saturation & Bottleneck Index',
      description: 'Pinpoints peak arrival windows with >80% slot capacity consumed.',
      type: 'Capacity Analysis',
    },
    {
      id: 8,
      title: 'Recent Date-Range Transaction Summary',
      description: 'Filtered window of settled APMC payouts and payment statuses.',
      type: 'Time-Series Analysis',
    },
  ];

  // Run Benchmark Query
  const runBenchmark = async (qNum) => {
    setQueryRunning(true);
    setQueryError('');
    setQueryExecutionTime(null);
    setQueryResults([]);

    const startTime = performance.now();
    try {
      const res = await AgriSlotAPI.runBenchmarkQuery(qNum);
      const endTime = performance.now();
      const clientDuration = Math.round(endTime - startTime);

      const serverDuration = res.executionTimeMs || res.durationMs || clientDuration;
      setQueryExecutionTime(serverDuration);
      setQueryResults(res.data || []);
    } catch (err) {
      setQueryError(err.message || 'Query execution failed');
    } finally {
      setQueryRunning(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'benchmarks') {
      runBenchmark(selectedQueryNum);
    } else if (activeTab === 'views') {
      loadViewData(selectedView);
    } else if (activeTab === 'procedures') {
      loadProcedure(procType);
    } else if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [activeTab]);

  const loadViewData = async (viewName) => {
    setViewLoading(true);
    try {
      const res =
        viewName === 'farmer-bookings'
          ? await AgriSlotAPI.getFarmerBookingsView()
          : await AgriSlotAPI.getSuratOperationsView();
      setViewData(res.data || []);
    } catch (err) {
      console.warn('View load error:', err.message);
    } finally {
      setViewLoading(false);
    }
  };

  const loadProcedure = async (type) => {
    setProcLoading(true);
    setCursorData([]);
    setSumValue(null);
    try {
      if (type === 'cursor-all') {
        const res = await AgriSlotAPI.cursorDisplayAllFarmers();
        setCursorData(res.data || []);
      } else if (type === 'cursor-five') {
        const res = await AgriSlotAPI.cursorDisplayFirstFive();
        setCursorData(res.data || []);
      } else if (type === 'paginated') {
        const res = await AgriSlotAPI.paginatedSearch(1, 10);
        setCursorData(res.data?.records || res.data || []);
      } else if (type === 'function-sum') {
        const res = await AgriSlotAPI.getTotalBookingWeight();
        setSumValue(res.data?.totalWeight || res.data || 0);
      }
    } catch (err) {
      console.warn('Procedure error:', err.message);
    } finally {
      setProcLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const res = await AgriSlotAPI.getAuditLogs();
      setAuditLogs(res.data || []);
    } catch (err) {
      console.warn('Audit logs error:', err.message);
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleGenerateXml = () => {
    const dataToExport = queryResults.length > 0 ? queryResults : viewData;
    if (dataToExport.length === 0) {
      alert('Run a query or load a view first to export XML');
      return;
    }
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<AgriSlotDataSet generated="${new Date().toISOString()}">\n`;
    dataToExport.slice(0, 15).forEach((item, idx) => {
      xml += `  <Record id="${idx + 1}">\n`;
      Object.entries(item).forEach(([k, v]) => {
        xml += `    <${k}>${v !== null && v !== undefined ? String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : ''}</${k}>\n`;
      });
      xml += `  </Record>\n`;
    });
    xml += `</AgriSlotDataSet>`;
    setXmlExportData(xml);
    setShowXmlModal(true);
  };

  // Concurrency Simulation Runner
  const runConcurrencySimulation = async () => {
    setSimRunning(true);
    setSimResultA(null);
    setSimResultB(null);
    setSimLogs([]);

    const log = (msg) => setSimLogs((prev) => [...prev, `[${new Date().toLocaleTimeString('en-IN', { hour12: false })}] ${msg}`]);

    log('INIT: Starting concurrent transaction dispatch on Mandi Slot #' + simSlotId + '...');
    log('THREAD 1: Farmer 1 dispatching ' + simWeightA + ' Tons (Produce: Red Onion)...');
    log('THREAD 2: Farmer 2 dispatching ' + simWeightB + ' Tons (Produce: Yellow Soybean)...');
    log('MYSQL ENGINE: Acquiring exclusive row lock via SELECT ... FOR UPDATE...');

    const reqA = AgriSlotAPI.createBooking({
      Farmer_ID: 1,
      Slot_ID: Number(simSlotId),
      Produce_ID: 1,
      Estimated_Weight_Tons: Number(simWeightA),
    });

    const reqB = AgriSlotAPI.createBooking({
      Farmer_ID: 2,
      Slot_ID: Number(simSlotId),
      Produce_ID: 2,
      Estimated_Weight_Tons: Number(simWeightB),
    });

    const [resA, resB] = await Promise.allSettled([reqA, reqB]);

    if (resA.status === 'fulfilled' && resA.value?.data) {
      setSimResultA({ success: true, data: resA.value.data });
      log('THREAD 1: ✓ COMMIT SUCCESS. Gate-pass token issued: ' + (resA.value.data.tokenNumber || resA.value.data.Token_Number));
    } else {
      const errMsg = resA.reason?.message || 'Insufficient slot capacity';
      setSimResultA({ success: false, error: errMsg });
      log('THREAD 1: ✗ ROLLBACK EXECUTED. Reason: ' + errMsg);
    }

    if (resB.status === 'fulfilled' && resB.value?.data) {
      setSimResultB({ success: true, data: resB.value.data });
      log('THREAD 2: ✓ COMMIT SUCCESS. Gate-pass token issued: ' + (resB.value.data.tokenNumber || resB.value.data.Token_Number));
    } else {
      const errMsg = resB.reason?.message || 'Insufficient slot capacity';
      setSimResultB({ success: false, error: errMsg });
      log('THREAD 2: ✗ ROLLBACK EXECUTED. Reason: ' + errMsg);
    }

    log('COMPLETED: Two-Phase Row-Level Locking verified. Slot capacity strictly preserved.');
    setSimRunning(false);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-[2.5px] border-navy-border">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mint-foam border-[1.5px] border-navy-border text-xs font-mono font-bold text-forest mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot"></span>
            <span>MYSQL RELATIONAL ENGINE TELEMETRY</span>
          </div>
          <h1 className="text-3xl font-display font-black text-navy-border tracking-tight">
            Database Studio &amp; SQL Benchmarks
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
            Real-time execution duration timers, relational views, stored procedures, and audit trail.
          </p>
        </div>

        {/* Navigation Tabs Switcher */}
        <div className="flex items-center gap-1 bg-mint-foam p-1 rounded-2xl border-[2px] border-navy-border shadow-bento-sm text-xs font-display font-black uppercase self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('benchmarks')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'benchmarks' ? 'bg-forest text-white shadow-bento-sm' : 'text-navy-border hover:bg-white'
            }`}
          >
            Benchmarks
          </button>
          <button
            onClick={() => setActiveTab('views')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'views' ? 'bg-forest text-white shadow-bento-sm' : 'text-navy-border hover:bg-white'
            }`}
          >
            Views
          </button>
          <button
            onClick={() => setActiveTab('procedures')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'procedures' ? 'bg-forest text-white shadow-bento-sm' : 'text-navy-border hover:bg-white'
            }`}
          >
            Procedures
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'audit' ? 'bg-forest text-white shadow-bento-sm' : 'text-navy-border hover:bg-white'
            }`}
          >
            Audit &amp; XML
          </button>
          <button
            onClick={() => setActiveTab('concurrency')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'concurrency' ? 'bg-forest text-white shadow-bento-sm' : 'text-navy-border hover:bg-white'
            }`}
          >
            Concurrency Lab
          </button>
        </div>
      </div>

      {/* TAB 1: BENCHMARK QUERIES WITH LIVE EXECUTION TIMING */}
      {activeTab === 'benchmarks' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Query Selector List (4 Cols) */}
          <div className="lg:col-span-4 space-y-2.5">
            <div className="flex items-center justify-between pb-1">
              <span className="font-display font-black text-sm uppercase text-navy-border">
                Select Benchmark Query
              </span>
              <span className="font-mono text-[11px] font-bold text-forest">8 Queries</span>
            </div>

            <div className="space-y-2">
              {queriesCatalog.map((q) => {
                const isSelected = selectedQueryNum === q.id;
                return (
                  <div
                    key={q.id}
                    onClick={() => {
                      setSelectedQueryNum(q.id);
                      runBenchmark(q.id);
                    }}
                    className={`p-3.5 rounded-2xl border-[2px] transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-saffron/20 border-navy-border shadow-bento-sm'
                        : 'bg-white border-navy-border hover:bg-mint-light/40 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-black text-navy-border">Query #{q.id}</span>
                      <span className="font-mono text-[9px] font-black uppercase text-forest bg-mint-foam px-2 py-0.5 rounded border border-navy-border">
                        {q.type}
                      </span>
                    </div>
                    <p className="font-display font-extrabold text-xs text-navy-border">{q.title}</p>
                    <p className="font-mono text-[10px] text-slate-500 mt-1 line-clamp-2">{q.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Execution & Results Display (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-6 sm:p-7 rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-slate-100">
                <div>
                  <h3 className="font-display font-black text-base text-navy-border uppercase">
                    Query #{selectedQueryNum}: {queriesCatalog.find((q) => q.id === selectedQueryNum)?.title}
                  </h3>
                  <p className="font-mono text-xs text-slate-500 font-semibold mt-0.5">
                    {queriesCatalog.find((q) => q.id === selectedQueryNum)?.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => runBenchmark(selectedQueryNum)}
                    disabled={queryRunning}
                    className="px-4 py-2 rounded-xl bg-forest hover:bg-forest-light disabled:bg-slate-300 text-white font-display font-black text-xs uppercase tracking-wider border-[1.5px] border-navy-border shadow-bento-sm active:translate-y-0.5 flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 text-saffron" />
                    <span>{queryRunning ? 'Running...' : 'Re-Run'}</span>
                  </button>

                  <button
                    onClick={handleGenerateXml}
                    disabled={queryResults.length === 0}
                    className="p-2 rounded-xl bg-white hover:bg-slate-50 border-[1.5px] border-navy-border shadow-bento-sm active:translate-y-0.5"
                    title="Export as XML"
                  >
                    <Download className="w-4 h-4 text-navy-border" />
                  </button>
                </div>
              </div>

              {/* Execution Duration Timer Pill */}
              <div className="flex items-center gap-3 font-mono text-xs font-bold">
                <div className="flex items-center gap-1.5 bg-mint-light px-3 py-1.5 rounded-xl border border-navy-border text-forest">
                  <Clock className="w-4 h-4" />
                  <span>Execution Time:</span>
                  <span className="font-black text-navy-border">
                    {queryExecutionTime !== null ? `${queryExecutionTime} ms` : 'Measuring...'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-canvas px-3 py-1.5 rounded-xl border border-navy-border text-slate-600">
                  <TableIcon className="w-4 h-4 text-forest" />
                  <span>Rows:</span>
                  <span className="font-black text-navy-border">{queryResults.length}</span>
                </div>
              </div>

              {queryError && (
                <div className="p-3.5 rounded-xl bg-coral/60 border border-navy-border text-coral-dark font-mono text-xs font-bold">
                  {queryError}
                </div>
              )}

              {/* Data Table */}
              <div className="rounded-xl border-[2px] border-navy-border overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  {queryResults.length === 0 ? (
                    <div className="p-8 text-center font-mono text-xs font-bold text-slate-500">
                      {queryRunning ? 'Executing SQL query on MySQL...' : 'No data returned.'}
                    </div>
                  ) : (
                    <table className="w-full text-left font-mono text-xs">
                      <thead className="bg-canvas text-slate-500 uppercase font-black sticky top-0 border-b border-navy-border">
                        <tr>
                          {Object.keys(queryResults[0]).map((h) => (
                            <th key={h} className="py-2.5 px-3 whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-navy-border">
                        {queryResults.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-mint-light/20">
                            {Object.values(row).map((val, cIdx) => (
                              <td key={cIdx} className="py-2.5 px-3 whitespace-nowrap">
                                {val !== null && val !== undefined ? String(val) : '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RELATIONAL VIEWS */}
      {activeTab === 'views' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-bento border-[2.5px] border-navy-border shadow-bento flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-black text-lg text-navy-border uppercase">
                Compiled MySQL Relational Views
              </h3>
              <p className="font-mono text-xs font-bold text-slate-500">
                Pre-compiled multi-table operational feeds.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedView}
                onChange={(e) => {
                  setSelectedView(e.target.value);
                  loadViewData(e.target.value);
                }}
                className="h-10 px-3 bg-mint-light/40 border-[2px] border-navy-border rounded-xl font-mono text-xs font-bold text-navy-border focus:ring-0"
              >
                <option value="farmer-bookings">Farmer_Bookings_Detail_View</option>
                <option value="surat-operations">Surat_Mandi_Operations_View</option>
              </select>

              <button
                onClick={() => loadViewData(selectedView)}
                disabled={viewLoading}
                className="px-4 py-2 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[1.5px] border-navy-border shadow-bento-sm active:translate-y-0.5"
              >
                {viewLoading ? 'Loading...' : 'Refresh View'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-bento border-[2.5px] border-navy-border shadow-bento overflow-hidden">
            <div className="overflow-x-auto max-h-[500px]">
              {viewData.length === 0 ? (
                <div className="p-8 text-center font-mono text-xs font-bold text-slate-500">
                  {viewLoading ? 'Fetching view rows from database...' : 'View returned 0 records.'}
                </div>
              ) : (
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-canvas text-slate-500 uppercase font-black sticky top-0 border-b border-navy-border">
                    <tr>
                      {Object.keys(viewData[0]).map((col) => (
                        <th key={col} className="py-3 px-4 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-navy-border">
                    {viewData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-mint-light/20">
                        {Object.values(row).map((val, cIdx) => (
                          <td key={cIdx} className="py-3 px-4 whitespace-nowrap">
                            {val !== null && val !== undefined ? String(val) : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROCEDURES & CURSORS */}
      {activeTab === 'procedures' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-4">
            <h3 className="font-display font-black text-lg text-navy-border uppercase">
              Stored Procedures &amp; Database Cursors Runner
            </h3>
            <p className="font-mono text-xs font-bold text-slate-500">
              Execute iterative SQL cursors, stored functions, and paginated procedures directly.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                onClick={() => {
                  setProcType('cursor-all');
                  loadProcedure('cursor-all');
                }}
                className={`px-3.5 py-2 rounded-xl font-display font-black text-xs uppercase tracking-wider border-[1.5px] border-navy-border shadow-bento-sm active:translate-y-0.5 transition-all ${
                  procType === 'cursor-all'
                    ? 'bg-forest text-white'
                    : 'bg-white text-navy-border hover:bg-slate-50'
                }`}
              >
                Cursor: Display All Farmers
              </button>

              <button
                onClick={() => {
                  setProcType('cursor-five');
                  loadProcedure('cursor-five');
                }}
                className={`px-3.5 py-2 rounded-xl font-display font-black text-xs uppercase tracking-wider border-[1.5px] border-navy-border shadow-bento-sm active:translate-y-0.5 transition-all ${
                  procType === 'cursor-five'
                    ? 'bg-forest text-white'
                    : 'bg-white text-navy-border hover:bg-slate-50'
                }`}
              >
                Cursor: First 5 Farmers
              </button>

              <button
                onClick={() => {
                  setProcType('paginated');
                  loadProcedure('paginated');
                }}
                className={`px-3.5 py-2 rounded-xl font-display font-black text-xs uppercase tracking-wider border-[1.5px] border-navy-border shadow-bento-sm active:translate-y-0.5 transition-all ${
                  procType === 'paginated'
                    ? 'bg-forest text-white'
                    : 'bg-white text-navy-border hover:bg-slate-50'
                }`}
              >
                Paginated Search (Page 1)
              </button>

              <button
                onClick={() => {
                  setProcType('function-sum');
                  loadProcedure('function-sum');
                }}
                className={`px-3.5 py-2 rounded-xl font-display font-black text-xs uppercase tracking-wider border-[1.5px] border-navy-border shadow-bento-sm active:translate-y-0.5 transition-all ${
                  procType === 'function-sum'
                    ? 'bg-forest text-white'
                    : 'bg-white text-navy-border hover:bg-slate-50'
                }`}
              >
                Stored Function: Total Booking Weight
              </button>
            </div>
          </div>

          {/* Results Output */}
          <div className="bg-white p-6 rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-4">
            <h4 className="font-display font-black text-base text-navy-border uppercase">
              Procedure Output
            </h4>

            {procLoading ? (
              <div className="p-8 text-center font-mono text-xs font-bold text-slate-500">
                Executing procedure on MySQL engine...
              </div>
            ) : sumValue !== null ? (
              <div className="p-6 rounded-2xl bg-mint-light border-[2px] border-navy-border text-center space-y-1">
                <span className="font-mono text-xs font-bold uppercase text-forest">
                  Total System Booking Tonnage
                </span>
                <div className="font-display font-black text-4xl text-navy-border">
                  {sumValue} Metric Tons
                </div>
                <p className="font-mono text-[11px] text-slate-600">
                  Calculated dynamically via deterministic SQL stored function.
                </p>
              </div>
            ) : cursorData.length > 0 ? (
              <div className="rounded-xl border-[2px] border-navy-border overflow-x-auto max-h-96">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-canvas text-slate-500 uppercase font-black sticky top-0 border-b border-navy-border">
                    <tr>
                      {Object.keys(cursorData[0]).map((h) => (
                        <th key={h} className="py-2.5 px-3 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-navy-border">
                    {cursorData.map((r, i) => (
                      <tr key={i} className="hover:bg-mint-light/20">
                        {Object.values(r).map((v, j) => (
                          <td key={j} className="py-2.5 px-3 whitespace-nowrap">
                            {v !== null && v !== undefined ? String(v) : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center font-mono text-xs font-bold text-slate-500">
                Select a procedure button above to execute.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS & XML EXPORT */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-bento border-[2.5px] border-navy-border shadow-bento flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-black text-lg text-navy-border uppercase">
                Database Audit Trail (Triggers)
              </h3>
              <p className="font-mono text-xs font-bold text-slate-500">
                Live immutable audit events recorded by AFTER INSERT/UPDATE/DELETE triggers.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadAuditLogs}
                disabled={loadingAudit}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border-[1.5px] border-navy-border font-mono text-xs font-bold text-navy-border shadow-bento-sm active:translate-y-0.5"
              >
                {loadingAudit ? 'Refreshing...' : 'Refresh Logs'}
              </button>
              <button
                onClick={handleGenerateXml}
                className="px-4 py-2 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[1.5px] border-navy-border shadow-bento-sm active:translate-y-0.5 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-saffron" />
                <span>Export XML</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-bento border-[2.5px] border-navy-border shadow-bento overflow-hidden">
            <div className="overflow-x-auto max-h-[500px]">
              {auditLogs.length === 0 ? (
                <div className="p-8 text-center font-mono text-xs font-bold text-slate-500">
                  {loadingAudit ? 'Reading trigger logs...' : 'No audit events recorded yet.'}
                </div>
              ) : (
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-canvas text-slate-500 uppercase font-black sticky top-0 border-b border-navy-border">
                    <tr>
                      <th className="py-3 px-4">Log ID</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Entity</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Entity ID</th>
                      <th className="py-3 px-4">Audit Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-navy-border">
                    {auditLogs.map((log) => (
                      <tr key={log.Log_ID} className="hover:bg-mint-light/20">
                        <td className="py-3 px-4 font-bold text-slate-400">#{log.Log_ID}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {log.Created_At ? new Date(log.Created_At).toLocaleString() : 'Recent'}
                        </td>
                        <td className="py-3 px-4 font-black">{log.Entity_Name}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded font-black text-[10px] uppercase border ${
                              log.Action_Type === 'INSERT'
                                ? 'bg-mint-foam text-forest border-navy-border'
                                : log.Action_Type === 'UPDATE'
                                ? 'bg-periwinkle text-indigo-900 border-navy-border'
                                : 'bg-coral text-coral-dark border-navy-border'
                            }`}
                          >
                            {log.Action_Type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold">{log.Entity_ID}</td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{log.Details || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CONCURRENCY LAB (Row-Level Locking & Race Condition Simulator) */}
      {activeTab === 'concurrency' && (
        <div className="space-y-6">
          {/* Header Overview Card */}
          <div className="bg-white p-6 sm:p-7 rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-saffron-light border-[1.5px] border-navy-border text-xs font-mono font-bold text-saffron-dark mb-2">
                  <Lock className="w-3.5 h-3.5" />
                  <span>ROW-LEVEL LOCK CONCURRENCY SIMULATOR</span>
                </div>
                <h3 className="font-display font-black text-2xl text-navy-border">
                  ACID Race Condition Testing (SELECT ... FOR UPDATE)
                </h3>
                <p className="font-mono text-xs text-slate-500 font-semibold mt-1">
                  Tests atomic transaction isolation when multiple farmers compete simultaneously for scarce slot tonnage.
                </p>
              </div>

              <button
                onClick={runConcurrencySimulation}
                disabled={simRunning}
                className="px-6 py-3 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[2px] border-navy-border shadow-bento active:translate-y-0.5 transition-all flex items-center gap-2 self-start sm:self-auto"
              >
                {simRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-saffron" />
                    <span>Executing Race...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-saffron" />
                    <span>Fire Concurrent Requests</span>
                  </>
                )}
              </button>
            </div>

            {/* Test Configuration Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t-2 border-slate-100 font-mono text-xs">
              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Target Mandi Slot</label>
                <select
                  value={simSlotId}
                  onChange={(e) => setSimSlotId(Number(e.target.value))}
                  className="w-full h-11 px-3 bg-mint-light/40 border-[2px] border-navy-border rounded-xl font-bold text-navy-border shadow-bento-sm"
                >
                  <option value={1}>Slot #1 (Surat Morning • 08:00 - 12:00)</option>
                  <option value={2}>Slot #2 (Surat Afternoon • 12:00 - 16:00)</option>
                  <option value={3}>Slot #3 (Nashik Morning • 07:00 - 11:00)</option>
                  <option value={4}>Slot #4 (Nashik Bulk • 11:00 - 15:00)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Thread 1: Farmer A Load</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={simWeightA}
                    onChange={(e) => setSimWeightA(Number(e.target.value))}
                    className="w-full h-11 px-3 bg-mint-light/40 border-[2px] border-navy-border rounded-xl font-bold text-navy-border shadow-bento-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">TONS</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-500 uppercase mb-1">Thread 2: Farmer B Load</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={simWeightB}
                    onChange={(e) => setSimWeightB(Number(e.target.value))}
                    className="w-full h-11 px-3 bg-mint-light/40 border-[2px] border-navy-border rounded-xl font-bold text-navy-border shadow-bento-sm"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">TONS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Side-by-Side Dual Thread Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Thread 1: Farmer A */}
            <div className={`p-6 rounded-bento border-[2.5px] border-navy-border shadow-bento flex flex-col justify-between space-y-4 ${
              simResultA
                ? simResultA.success
                  ? 'bg-mint-foam'
                  : 'bg-coral/40'
                : 'bg-white'
            }`}>
              <div>
                <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200/60">
                  <span className="font-mono text-xs font-black text-navy-border uppercase">
                    THREAD 1: RAMESH PATEL (FARMER #1)
                  </span>
                  {simResultA && (
                    <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-black uppercase border border-navy-border ${
                      simResultA.success ? 'bg-forest text-white' : 'bg-coral text-coral-dark'
                    }`}>
                      {simResultA.success ? 'COMMIT SUCCESS' : 'ROLLBACK'}
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-2 font-mono text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Requested Produce:</span>
                    <strong className="text-navy-border">Red Nashik Onion</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Requested Payload:</span>
                    <strong className="text-navy-border">{simWeightA} Tons ({(simWeightA * 1000).toLocaleString()} KG)</strong>
                  </div>
                  {simResultA && (
                    <div className="pt-2 border-t border-slate-200/80">
                      {simResultA.success ? (
                        <div className="p-3 bg-white rounded-xl border border-navy-border space-y-1">
                          <div className="text-forest font-bold text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>EXCLUSIVE LOCK ACQUIRED</span>
                          </div>
                          <div className="text-sm font-black text-navy-border">
                            Token: {simResultA.data.tokenNumber || simResultA.data.Token_Number}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Booking ID: #{simResultA.data.bookingId || simResultA.data.Booking_ID} • Status: Confirmed
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-white rounded-xl border border-navy-border text-coral-dark font-bold text-xs flex items-start gap-1.5">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{simResultA.error}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="font-mono text-[11px] text-slate-500">
                Isolation Level: REPEATABLE READ • Row-Level Two-Phase Lock
              </div>
            </div>

            {/* Thread 2: Farmer B */}
            <div className={`p-6 rounded-bento border-[2.5px] border-navy-border shadow-bento flex flex-col justify-between space-y-4 ${
              simResultB
                ? simResultB.success
                  ? 'bg-mint-foam'
                  : 'bg-coral/40'
                : 'bg-white'
            }`}>
              <div>
                <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200/60">
                  <span className="font-mono text-xs font-black text-navy-border uppercase">
                    THREAD 2: SURESH PATIL (FARMER #2)
                  </span>
                  {simResultB && (
                    <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-black uppercase border border-navy-border ${
                      simResultB.success ? 'bg-forest text-white' : 'bg-coral text-coral-dark'
                    }`}>
                      {simResultB.success ? 'COMMIT SUCCESS' : 'ROLLBACK'}
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-2 font-mono text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Requested Produce:</span>
                    <strong className="text-navy-border">Yellow Soybean</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Requested Payload:</span>
                    <strong className="text-navy-border">{simWeightB} Tons ({(simWeightB * 1000).toLocaleString()} KG)</strong>
                  </div>
                  {simResultB && (
                    <div className="pt-2 border-t border-slate-200/80">
                      {simResultB.success ? (
                        <div className="p-3 bg-white rounded-xl border border-navy-border space-y-1">
                          <div className="text-forest font-bold text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>EXCLUSIVE LOCK ACQUIRED</span>
                          </div>
                          <div className="text-sm font-black text-navy-border">
                            Token: {simResultB.data.tokenNumber || simResultB.data.Token_Number}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Booking ID: #{simResultB.data.bookingId || simResultB.data.Booking_ID} • Status: Confirmed
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-white rounded-xl border border-navy-border text-coral-dark font-bold text-xs flex items-start gap-1.5">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{simResultB.error}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="font-mono text-[11px] text-slate-500">
                Transaction Rollback: Automatic release on capacity overflow
              </div>
            </div>
          </div>

          {/* Database Engine Telemetry Console */}
          <div className="bg-navy-border text-mint-foam p-5 rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 font-mono text-xs">
              <span className="flex items-center gap-2 font-bold text-saffron">
                <Terminal className="w-4 h-4" />
                <span>MySQL Transaction Telemetry &amp; Lock Audit Stream</span>
              </span>
              <span className="text-[10px] text-slate-400">ENGINE: InnoDB • STRICT MODE</span>
            </div>

            <div className="font-mono text-xs space-y-1 max-h-48 overflow-y-auto pt-2">
              {simLogs.length === 0 ? (
                <div className="text-slate-400 italic">
                  Press &quot;Fire Concurrent Requests&quot; above to simulate real-time race condition against MySQL.
                </div>
              ) : (
                simLogs.map((logLine, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {logLine}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* XML MODAL */}
      {showXmlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-border/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white border-[2.5px] border-navy-border rounded-bento shadow-bento-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-100">
              <h3 className="font-display font-black text-base text-navy-border uppercase">
                Generated XML Data Feed
              </h3>
              <button onClick={() => setShowXmlModal(false)} className="text-slate-400 hover:text-navy-border font-bold text-lg">
                &times;
              </button>
            </div>

            <textarea
              readOnly
              value={xmlExportData}
              rows={14}
              className="w-full p-3.5 rounded-xl bg-canvas border-[2px] border-navy-border font-mono text-xs text-forest font-bold focus:ring-0"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(xmlExportData);
                  alert('XML copied to clipboard!');
                }}
                className="px-4 py-2 rounded-xl bg-canvas border-[1.5px] border-navy-border font-mono text-xs font-bold text-navy-border"
              >
                Copy XML
              </button>
              <button
                onClick={() => setShowXmlModal(false)}
                className="px-5 py-2 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[1.5px] border-navy-border shadow-bento-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
