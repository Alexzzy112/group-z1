import { useState } from 'react';
import { Shield, Mail, Database } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StaffSettings() {
  const [thresholds, setThresholds] = useState({ low: 15, moderate: 30, high: 50 });
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { localStorage.setItem('plagiarismThresholds', JSON.stringify(thresholds)); toast.success('Settings saved'); setSaving(false); }, 500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div><h1 className="text-2xl font-bold text-slate-800 dark:text-white">Settings</h1><p className="text-slate-500 dark:text-slate-400">Configure plagiarism thresholds and system preferences</p></div>
      <div className="card">
        <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600"><Shield className="w-5 h-5" /></div><div><h3 className="font-semibold text-slate-800 dark:text-white">Plagiarism Thresholds</h3><p className="text-sm text-slate-500">Configure plagiarism severity levels</p></div></div>
        <div className="space-y-4">
          {[{ key: 'low', label: 'Low Risk (0-15%)', desc: 'Acceptable similarity', color: 'bg-emerald-500' }, { key: 'moderate', label: 'Moderate Risk (16-30%)', desc: 'Needs review', color: 'bg-amber-500' }, { key: 'high', label: 'High Risk (31-50%)', desc: 'Suspicious', color: 'bg-orange-500' }].map(t => (
            <div key={t.key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3"><div className={`w-3 h-3 rounded-full ${t.color}`} /><div><p className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.label}</p><p className="text-xs text-slate-500">{t.desc}</p></div></div>
              <input type="number" className="input w-20 text-center" value={thresholds[t.key]} onChange={(e) => setThresholds({ ...thresholds, [t.key]: parseInt(e.target.value) || 0 })} />
            </div>
          ))}
          <div className="flex justify-end"><button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Thresholds'}</button></div>
        </div>
      </div>
      <div className="card">
        <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600"><Database className="w-5 h-5" /></div><div><h3 className="font-semibold text-slate-800 dark:text-white">System Information</h3></div></div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"><span className="text-slate-500">Version</span><p className="font-medium text-slate-800 dark:text-white">2.0.0</p></div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"><span className="text-slate-500">Environment</span><p className="font-medium text-slate-800 dark:text-white">{import.meta.env.PROD ? 'Production' : 'Development'}</p></div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"><span className="text-slate-500">Authentication</span><p className="font-medium text-slate-800 dark:text-white">JWT with refresh tokens</p></div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"><span className="text-slate-500">Plagiarism Engine</span><p className="font-medium text-slate-800 dark:text-white">NLP + String Similarity</p></div>
        </div>
      </div>
    </div>
  );
}
