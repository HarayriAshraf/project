import React, { useState } from 'react';
import { User, ForecastRecord, ForecastStatus, RecordStatus } from '../types';
import { LogIn, Upload, ArrowLeft, FileJson, Check, Download, FileSpreadsheet } from 'lucide-react';

interface Props {
  onLogin: (user: User) => void;
  onImportData: (data: ForecastRecord[]) => void;
  users: User[];
}

const LoginScreen: React.FC<Props> = ({ onLogin, onImportData, users }) => {
  const [email, setEmail] = useState('admin@company.com');
  const [password, setPassword] = useState('password123');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'LOGIN' | 'IMPORT'>('LOGIN');
  
  // Import State
  const [inputData, setInputData] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    
    setTimeout(() => {
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user && password === 'password123') {
        onLogin(user);
      } else {
        setLoginError('Invalid email or password. Use admin@company.com / password123');
      }
      setLoading(false);
    }, 800);
  };

  const handleImport = () => {
    setImportError('');
    setImportSuccess(false);
    const rawInput = inputData.trim();
    
    if (!rawInput) {
      setImportError("Please paste data.");
      return;
    }

    try {
      let parsedData: ForecastRecord[] = [];

      // Detect JSON vs CSV/TSV
      if (rawInput.startsWith('[') || rawInput.startsWith('{')) {
        parsedData = JSON.parse(rawInput);
      } else {
        // CSV/TSV Parsing Logic
        const lines = rawInput.split('\n').map(l => l.trim()).filter(l => l);
        const delimiter = lines[0].includes('\t') ? '\t' : ',';
        const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
        
        parsedData = lines.slice(1).map((line, idx) => {
          const values = line.split(delimiter).map(v => v.trim());
          const record: any = {};
          headers.forEach((h, i) => {
            const val = values[i] || '';
            // Simple type inference
            if (['month', 'year', 'qty', 'sales', 'gp'].includes(h)) {
               let numStr = val.replace(/,/g, '');
               if (numStr === '-' || numStr === '') {
                 record[h] = 0;
               } else if (numStr.startsWith('(') && numStr.endsWith(')')) {
                 record[h] = -Number(numStr.slice(1, -1));
               } else {
                 record[h] = Number(numStr);
               }
            } else {
               record[h] = val;
            }
          });
          
          // Ensure ID exists if missing in CSV
          if (!record.id) record.id = `imp-${idx}`;
          return record as ForecastRecord;
        });
      }

      if (!Array.isArray(parsedData)) {
        throw new Error("Data must be an array of records.");
      }

      // Normalize data
      parsedData = parsedData.map(record => {
        // Normalize version
        if (record.version) {
          const v = String(record.version).trim();
          // Keep the version as is, maybe just capitalize Budget if it's budget
          if (v.toLowerCase() === 'budget') record.version = 'Budget';
          else record.version = v;
        }
        // Normalize status
        if (record.status) {
          const s = String(record.status).toLowerCase();
          if (s.includes('book')) record.status = 'Booked';
          else if (s.includes('forecast')) record.status = 'Forecasted';
          else if (s.includes('budget')) record.status = 'Budget';
          else record.status = 'Forecasted'; // default
        } else {
          record.status = 'Forecasted';
        }
        
        // Ensure workflowStatus exists if needed by app
        if (!record.workflowStatus) {
          record.workflowStatus = ForecastStatus.APPROVED;
        }

        return record;
      });

      if (parsedData.length > 0 && !parsedData[0].client) {
         throw new Error("Data missing required fields (e.g., client).");
      }
      
      onImportData(parsedData);
      setImportSuccess(true);
      setTimeout(() => {
        setMode('LOGIN'); // Return to login after success
        setImportSuccess(false);
      }, 1500);
    } catch (err: any) {
      setImportError(err.message || "Invalid Data Format");
    }
  };

  const loadJsonTemplate = () => {
    const template = [
      {
        "subsidiary": "Group A",
        "id": "rec-1",
        "section": "Trade",
        "client": "Alpha Corp",
        "country": "USA",
        "product": "Steel Coils",
        "category": "Raw Materials",
        "month": 1,
        "year": 2026,
        "version": "Budget",
        "qty": 100,
        "sales": 20000,
        "gp": 4000,
        "salesPerson": "John Doe",
        "salesPersonEmail": "john.doe@company.com",
        "status": "Budget",
        "supplier": "Global Steel Co"
      }
    ];
    setInputData(JSON.stringify(template, null, 2));
    setImportError('');
  };

  const downloadCsvTemplate = () => {
    const headers = "subsidiary,id,section,client,country,product,category,month,year,version,qty,sales,gp,salesPerson,salesPersonEmail,status,supplier";
    const sampleRow = "Group A,rec-1,Trade,Alpha Corp,USA,Steel Coils,Raw Materials,1,2026,Budget,100,20000,4000,John Doe,john.doe@company.com,Budget,Global Steel Co";
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + sampleRow;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "forecast_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (mode === 'IMPORT') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl border border-slate-200">
           <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
               <Upload className="text-blue-600" />
               Import Dataset
             </h2>
             <button onClick={() => setMode('LOGIN')} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1">
               <ArrowLeft size={16} /> Back
             </button>
           </div>
           
           <div className="mb-4">
             <div className="flex justify-between items-end mb-2">
               <label className="block text-sm font-semibold text-slate-700">Paste Data (JSON, CSV, or TSV)</label>
               <div className="flex gap-2">
                 <button 
                    onClick={downloadCsvTemplate}
                    className="text-xs flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded hover:bg-green-100 transition"
                  >
                    <FileSpreadsheet size={12} /> Download CSV Template
                  </button>
                  <button 
                    onClick={loadJsonTemplate}
                    className="text-xs flex items-center gap-1 bg-slate-50 text-slate-600 border border-slate-200 px-2 py-1 rounded hover:bg-slate-100 transition"
                  >
                    <FileJson size={12} /> Load JSON Sample
                  </button>
               </div>
             </div>
             
             <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                className="w-full h-64 p-4 font-mono text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Paste JSON array or CSV content here..."
              />
             
             {importError && <p className="text-red-500 text-sm mt-2">{importError}</p>}
             {importSuccess && (
               <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                 <Check size={16} /> Data loaded successfully! Redirecting...
               </p>
             )}
           </div>

           <div className="flex justify-end gap-3">
             <button 
               onClick={() => setMode('LOGIN')}
               className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
             >
               Cancel
             </button>
             <button 
               onClick={handleImport}
               className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-sm"
             >
               Load Data
             </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-slate-200">
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <LogIn className="text-white h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">S&OP PRO</h1>
          <p className="text-slate-500">Sign in to access forecast reviews</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Company Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="admin@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="••••••••"
            />
          </div>
          
          {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
          
          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded border border-slate-200">
            <p className="font-semibold mb-1">Demo Accounts (Password: password123):</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>admin@company.com (Admin)</li>
              <li>analyst@company.com (Data Analyst)</li>
              <li>sales@company.com (Sales)</li>
              <li>manager@company.com (Manager)</li>
              <li>board@company.com (Board)</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex justify-center items-center"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'Sign In with SSO'
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <button 
            onClick={() => setMode('IMPORT')}
            className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition"
          >
            <Download size={16} />
            Import / Upload Data
          </button>
        </div>
        
        <div className="mt-6 text-xs text-center text-slate-400">
          Powered by React
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
