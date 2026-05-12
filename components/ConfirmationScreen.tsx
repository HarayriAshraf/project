import React from 'react';
import { AuditLog } from '../types';
import { Check, ClipboardList, RefreshCw } from 'lucide-react';

interface Props {
  auditLogs: AuditLog[];
  onReset: () => void;
}

const ConfirmationScreen: React.FC<Props> = ({ auditLogs, onReset }) => {

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-3xl overflow-hidden">
        <div className="bg-green-600 p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
            <Check className="text-white h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Review Completed</h2>
          <p className="text-green-100 mt-2">Your changes have been staged for the backend patch.</p>
        </div>

        <div className="p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-slate-500" />
              Session Audit Trail
            </h3>
          </div>

          <div className="bg-slate-50 rounded-lg border border-slate-200 max-h-64 overflow-y-auto mb-8">
            {auditLogs.length === 0 ? (
              <div className="p-4 text-center text-slate-500 italic">No changes made in this session.</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="p-3 font-medium">{log.product}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          log.actionType === 'DELETE' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {log.actionType}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">
                        {log.details}
                        <div className="text-xs text-slate-400 mt-0.5">Reason: {log.reasonCode}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-center">
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold transition shadow-md"
            >
              <RefreshCw className="h-5 w-5" />
              Submit & Next Client
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationScreen;
