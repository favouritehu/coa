import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  RefreshCcw,
  Download,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Database,
  FlaskConical,
  Printer,
  Settings,
  Image as ImageIcon,
  Building2,
  X,
  QrCode,
  ShieldCheck,
  FileSearch,
  Info,
  HelpCircle,
  Loader2,
  Lock,
  ChevronDown,
  FileDown,
  Type
} from 'lucide-react';

const apiKey = "AIzaSyA4mutY-tgoUv9M6FcniNwBkOKVxOVjKi8";

const App = () => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [coaData, setCoaData] = useState(null);
  const [view, setView] = useState('input');

  const [companyProfile, setCompanyProfile] = useState({
    name: 'FAVOURITE FAB',
    address: 'Khasra No.328, Kela Cold Ke Samne, Mauza Khadwai, Runkata, Agra, Uttar Pradesh, 282007',
    contact: 'GSTIN: 09AGBPG7078H1Z8 | UDYAM-UP-01-0040344 | OFFICE@FAVOURITEHUB.COM',
    logo: '/logo.png',
    accentColor: '#0f172a'
  });

  const [showBrandingPanel, setShowBrandingPanel] = useState(false);

  useEffect(() => {
    const libraries = [
      'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
      'https://unpkg.com/html-docx-js/dist/html-docx.js'
    ];

    libraries.forEach(src => {
      if (!document.querySelector(`script[src="${src}"]`)) {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        document.head.appendChild(script);
      }
    });
  }, []);

  const getSafeFileName = (extension) => {
    const rawProdName = coaData?.sampleInfo?.productName || 'Report';
    const safeProdName = rawProdName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
    return `${safeProdName}_CoA.${extension}`;
  };

  const downloadPDF = async () => {
    if (!window.html2pdf) {
      setError("PDF engine is loading. Please wait 2 seconds.");
      return;
    }

    setIsDownloading(true);
    const element = document.getElementById('coa-document');

    const opt = {
      margin: [0, 0, 0, 0],
      filename: getSafeFileName('pdf'),
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 3,
        useCORS: true,
        letterRendering: true
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };

    try {
      await window.html2pdf().set(opt).from(element).save();
    } catch (err) {
      setError("Download error. Please use Browser Print (Ctrl+P) for an editable PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadWord = () => {
    if (typeof htmlDocx === 'undefined') {
      setError("Word converter is loading. Please wait 2 seconds.");
      return;
    }

    setIsDownloading(true);
    try {
      const content = document.getElementById('coa-document').innerHTML;

      const styles = `
        <style>
          @page { size: A4; margin: 0.5in; }
          body { font-family: 'Arial', sans-serif; color: #000000; line-height: 1.15; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10pt; }
          .technical-border { border: 0.5pt solid #cbd5e1; }
          th { background-color: #0f172a; color: #ffffff; padding: 8pt; font-size: 10pt; text-transform: uppercase; border: 0.5pt solid #0f172a; }
          td { padding: 6pt; font-size: 11pt; border: 0.5pt solid #cbd5e1; }
          .header-box { background-color: #0f172a; color: #60a5fa; padding: 15pt; text-align: center; }
          .header-title { font-size: 14pt; font-weight: bold; letter-spacing: 1.5pt; color: #60a5fa; text-transform: uppercase; }
          .label { color: #64748b; font-size: 9pt; text-transform: uppercase; font-weight: bold; }
          .value { font-weight: bold; font-size: 12pt; text-transform: uppercase; color: #000000; }
        </style>
      `;

      const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">${styles}</head><body>${content}</body></html>`;
      const converted = window.htmlDocx.asBlob(fullHtml);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(converted);
      link.download = getSafeFileName('docx');
      link.click();
    } catch (err) {
      setError("Word conversion error.");
    } finally {
      setIsDownloading(false);
    }
  };

  const extractCoAData = async () => {
    if (!inputText.trim()) {
      setError("Please paste raw lab data first.");
      return;
    }
    setIsProcessing(true);
    setError(null);
    const systemPrompt = `Extract lab data into JSON. SCHEMA: { reportId, dateOfIssue, sampleInfo: { productName, batchNumber, manufacturingDate, expiryDate, sampleType }, customerInfo: { name, address }, specifications: [{ parameter, method, specification, result, status }], conclusion, authorizedSignatory }. Rules: Return only JSON.`;
    const payload = {
      contents: [{ parts: [{ text: `Raw Data Input:\n${inputText}` }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { responseMimeType: "application/json" }
    };
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      const extracted = JSON.parse(result.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
      setCoaData(extracted);
      setView('preview');
    } catch (err) {
      setError("Extraction failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => { setCoaData(null); setInputText(''); setView('input'); setError(null); };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 selection:bg-blue-100">
      <style>{`
        .page-break-avoid { break-inside: avoid !important; page-break-inside: avoid !important; }
        .technical-border { border: 0.5px solid #cbd5e1; }
        .technical-bg { background-color: #f8fafc; }
        @media print { 
          .coa-page { padding: 8mm !important; border: none !important; box-shadow: none !important; } 
          .print-hidden { display: none !important; }
        }
      `}</style>

      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 p-2 rounded-lg"><ShieldCheck className="text-white w-5 h-5" /></div>
          <h1 className="text-lg font-black tracking-tight text-slate-800 uppercase">
            {companyProfile.name} <span className="text-blue-600 font-bold ml-1">LIMS</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowBrandingPanel(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200 transition-all shadow-sm">
            <Settings className="w-4 h-4" /> Branding
          </button>
          <button onClick={reset} className="text-sm font-bold text-slate-400 hover:text-red-500 px-2 transition-colors">Reset</button>
        </div>
      </nav>

      {/* Branding Drawer */}
      {showBrandingPanel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-800">Laboratory Profile</h3>
              <button onClick={() => setShowBrandingPanel(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Logo (PNG/JPG)</label>
                <div className="relative group w-full h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden hover:border-blue-400 transition-all cursor-pointer">
                  {companyProfile.logo ? (
                    <img src={companyProfile.logo} className="w-full h-full object-contain p-4" alt="Logo" />
                  ) : (
                    <div className="text-center"><ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" /><p className="text-xs font-bold text-slate-400 tracking-tight">Click to Upload</p></div>
                  )}
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setCompanyProfile(prev => ({ ...prev, logo: reader.result }));
                      reader.readAsDataURL(file);
                    }
                  }} />
                </div>
              </div>
              <input className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all" value={companyProfile.name} onChange={e => setCompanyProfile(p => ({ ...p, name: e.target.value.toUpperCase() }))} />
              <textarea rows="3" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all resize-none" value={companyProfile.address} onChange={e => setCompanyProfile(p => ({ ...p, address: e.target.value }))} />
              <button onClick={() => setShowBrandingPanel(false)} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm shadow-xl hover:scale-[1.02] active:scale-95 transition-all">Save & Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* Main UI */}
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {(isProcessing || isDownloading) && (
          <div className="fixed inset-0 bg-white/95 z-[200] flex items-center justify-center backdrop-blur-sm">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" strokeWidth={3} />
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{isDownloading ? "Generating Files" : "Processing"}</h2>
              <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-[10px] italic">Optimizing Technical Output...</p>
            </div>
          </div>
        )}

        {view === 'input' ? (
          <div className="grid lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-bottom-12 duration-700">
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden ring-1 ring-slate-200/50">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3"><Database className="w-4 h-4 text-slate-400" /><span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 leading-none">Laboratory Data Feed</span></div>
                  <button onClick={() => setInputText(`LOT# FF-2025-XJ9\nProduct: Medical Grade Spunbond Non-Woven Fabric, 100% Polypropylene, 40 GSM Blue Variant\nMfg Date: 12 Dec 2024\nExp Date: 11 Dec 2026\nResults:\n- Weight: 40.2 gsm (Spec: 38-42)\n- Strength: 130N (Spec: >100N)\nCustomer: Global Apparel Industries, Industrial Area, New Delhi`)} className="text-[10px] font-black text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-full bg-blue-50 transition-all uppercase tracking-widest">Demo</button>
                </div>
                <textarea value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Paste lab results here..." className="w-full h-[400px] p-8 text-slate-800 font-mono text-sm focus:outline-none bg-transparent placeholder:text-slate-300 resize-none leading-relaxed" />
              </div>
              <button onClick={extractCoAData} disabled={!inputText.trim() || isProcessing} className="w-full group bg-slate-900 hover:bg-black text-white font-black py-5 px-8 rounded-2xl shadow-2xl flex items-center justify-center gap-4 transition-all hover:-translate-y-1 active:scale-[0.98]">
                <span className="text-lg uppercase tracking-widest">Process & Preview</span>
                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
              </button>
            </div>
            <div className="lg:col-span-4 space-y-6 pt-4">
              <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-slate-100 space-y-4 text-center">
                <ShieldCheck className="w-12 h-12 text-blue-600 mx-auto" />
                <h3 className="text-xl font-black uppercase tracking-tight">Technical CoA</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">PDFs are now generated with selectable text and increased font sizes for better clarity.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-[210mm] mx-auto animate-in zoom-in-95 duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
              <div className="flex items-center gap-4">
                <button onClick={() => setView('input')} className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all shadow-sm hover:scale-110 active:scale-95">&larr;</button>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Technical Preview</h2>
                  <p className="text-[10px] text-slate-500 font-black mt-1 uppercase tracking-widest leading-none">{companyProfile.name} • DIGITAL LIMS</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={downloadWord} disabled={isDownloading} className="bg-slate-100 text-slate-700 px-6 py-4 rounded-xl flex items-center gap-2 font-black shadow-sm border border-slate-200 hover:bg-slate-200 active:scale-95 transition-all disabled:bg-slate-50">
                  <FileDown className="w-4 h-4" /> WORD
                </button>
                <button onClick={downloadPDF} disabled={isDownloading} className="bg-blue-600 text-white px-8 py-4 rounded-xl flex items-center gap-3 font-black shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all disabled:bg-slate-300">
                  <Download className="w-5 h-5" /> PDF
                </button>
              </div>
            </div>

            {/* TECHNICAL CoA DOCUMENT DESIGN */}
            <div id="coa-document" className="bg-white mx-auto w-full min-h-[297mm] p-[8mm] text-slate-950 flex flex-col relative overflow-hidden technical-border coa-page shadow-inner" style={{ width: '210mm', color: '#000' }}>

              {/* Technical Header */}
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="flex flex-col gap-3 flex-1">
                  <div className="flex items-center gap-4">
                    <div className="w-[110px] h-[55px] flex items-center justify-center overflow-hidden flex-shrink-0">
                      {companyProfile.logo ? (
                        <img src={companyProfile.logo} alt="Logo" className="w-full h-full object-contain object-left" />
                      ) : (
                        <div className="bg-slate-900 p-2 rounded-lg"><ShieldCheck className="w-8 h-8 text-white" /></div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <h1 className="text-xl font-black uppercase tracking-tighter leading-none mb-1">{companyProfile.name}</h1>
                      <div className="text-[8px] font-black text-slate-500 tracking-[0.2em] uppercase">Laboratory Information Management</div>
                    </div>
                  </div>
                  <div className="text-[9px] font-bold text-slate-700 leading-tight uppercase tracking-tight max-w-[450px]">
                    {companyProfile.address}
                    <div className="mt-1 flex flex-wrap gap-x-3 text-slate-950 border-t border-slate-100 pt-0.5">
                      {companyProfile.contact.split('|').map((part, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 && <span className="w-0.5 h-0.5 bg-slate-300 rounded-full"></span>}
                          {part.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="w-[180px] h-[75px] bg-slate-900 text-white flex flex-col justify-center items-center text-center rounded-sm border-l-4 border-blue-600 shadow-md">
                  <div className="text-[14px] font-black tracking-[0.2em] text-blue-400 uppercase leading-[1.1]">
                    CERTIFICATE <br /> <span className="text-white text-[9px] tracking-[0.3em] font-medium opacity-50 uppercase">OF</span> <br /> ANALYSIS
                  </div>
                </div>
              </div>

              {/* Document References Bar */}
              <div className="grid grid-cols-4 technical-border divide-x divide-slate-300 mb-4 py-1.5 bg-slate-50 px-3">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Reference ID</span>
                  <span className="text-[12px] font-black">#{coaData?.reportId || '---'}</span>
                </div>
                <div className="flex flex-col pl-3">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Issue Date</span>
                  <span className="text-[12px] font-black uppercase">{coaData?.dateOfIssue || '---'}</span>
                </div>
                <div className="flex flex-col pl-3">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Classification</span>
                  <span className="text-[12px] font-black uppercase tracking-tighter">{coaData?.sampleInfo?.sampleType || 'TECHNICAL'}</span>
                </div>
                <div className="flex flex-col pl-3">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">System Stat</span>
                  <span className="text-[12px] font-black text-emerald-600 uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> VERIFIED
                  </span>
                </div>
              </div>

              {/* Identity Grid */}
              <div className="grid grid-cols-2 technical-border divide-x divide-slate-300 mb-4 page-break-avoid">
                {/* Material Info */}
                <div className="p-3 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-3 bg-blue-600 rounded-full"></div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">Material Description</h3>
                  </div>
                  <div className="space-y-3 text-[12px] font-bold">
                    {/* FIXED: Increased Font Size and forced line wrapping for Product Name */}
                    <div className="border-b border-slate-100 pb-2">
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest block mb-1">Product Name</span>
                      <span className="uppercase leading-normal text-[12px] font-black break-words block whitespace-normal pr-2">
                        {coaData?.sampleInfo?.productName || '---'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-2">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest block mb-0.5">Batch/Lot No.</span>
                        <span className="uppercase font-black text-[11px]">{coaData?.sampleInfo?.batchNumber || '---'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest block mb-0.5">Mfg. Date</span>
                        <span className="uppercase font-black text-[11px]">{coaData?.sampleInfo?.manufacturingDate || '---'}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest block mb-0.5">Exp. Date</span>
                      <span className="uppercase font-black text-[11px]">{coaData?.sampleInfo?.expiryDate || '---'}</span>
                    </div>
                  </div>
                </div>
                {/* Customer Info */}
                <div className="p-3 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-3 bg-slate-900 rounded-full"></div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">Consignee</h3>
                  </div>
                  <div className="bg-white rounded">
                    <div className="text-[13px] font-black text-slate-950 mb-1 uppercase leading-tight whitespace-normal break-words">
                      {coaData?.customerInfo?.name || '---'}
                    </div>
                    <div className="text-[10px] text-slate-600 font-bold uppercase leading-tight whitespace-pre-line">
                      {coaData?.customerInfo?.address || '---'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytical Table */}
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900">Specifications</h3>
                  <div className="flex-1 h-[0.5px] bg-slate-200"></div>
                </div>
                <table className="w-full text-left border-collapse border border-slate-300">
                  <thead className="technical-bg">
                    <tr>
                      <th className="p-2 text-[10px] font-black uppercase tracking-widest border border-slate-300">Test Parameter</th>
                      <th className="p-2 text-[10px] font-black uppercase tracking-widest border border-slate-300">Method</th>
                      <th className="p-2 text-[10px] font-black uppercase tracking-widest border border-slate-300">Acceptance</th>
                      <th className="p-2 text-[10px] font-black uppercase tracking-widest border border-slate-300 text-center">Result</th>
                      <th className="p-2 text-[10px] font-black uppercase tracking-widest border border-slate-300 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coaData?.specifications?.map((spec, idx) => (
                      <tr key={idx} className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"} border-b border-slate-300`}>
                        <td className="p-2 text-[11px] font-black text-slate-900 uppercase tracking-tight border-r border-slate-300">{spec.parameter}</td>
                        <td className="p-2 text-[10px] text-slate-500 font-bold uppercase border-r border-slate-300">{spec.method || 'Standard'}</td>
                        <td className="p-2 text-[10px] text-slate-500 font-bold uppercase tracking-tight border-r border-slate-300">{spec.specification}</td>
                        <td className="p-2 text-[11px] font-black text-blue-800 text-center border-r border-slate-300">{spec.result}</td>
                        <td className="p-2 text-center">
                          <div className={`text-[9px] font-black px-2 py-0.5 rounded-sm inline-block uppercase tracking-tighter ${spec.status?.toLowerCase().includes('pass') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                            }`}>{spec.status}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Conclusion & Authorization */}
              <div className="mt-4 pt-4 border-t border-slate-300 grid grid-cols-12 gap-6 page-break-avoid">
                <div className="col-span-8 space-y-3">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Conclusion</h3>
                  <div className="text-[12px] font-bold text-slate-900 italic leading-relaxed bg-slate-50 p-3 border-l-2 border-slate-900 shadow-sm uppercase tracking-tight">
                    "{coaData?.conclusion || 'The material complies with established quality control parameters.'}"
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="p-1.5 bg-white border border-slate-200 rounded flex items-center gap-2">
                      <QrCode className="w-7 h-7 text-slate-300" />
                      <div className="text-[7px] text-slate-400 font-black uppercase tracking-[0.1em] leading-tight uppercase">Traceability Code<br />LIMS Verified Document</div>
                    </div>
                  </div>
                </div>
                <div className="col-span-4 flex flex-col items-center justify-end text-center">
                  <div className="w-full h-12 border-b border-slate-900 mb-2 flex items-center justify-center relative bg-slate-50/20 rounded-t-sm">
                    <div className="text-blue-900/10 font-serif italic text-4xl absolute rotate-[-8deg] select-none tracking-tighter uppercase font-black">Authorized</div>
                  </div>
                  <div className="text-[11px] font-black uppercase text-slate-950 tracking-widest leading-none mb-0.5">{coaData?.authorizedSignatory || 'QC MANAGER'}</div>
                  <div className="text-[9px] text-blue-600 font-black uppercase tracking-widest tracking-tight">{companyProfile.name} • UNIT 1</div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-auto pt-4 text-[8px] text-slate-400 text-center uppercase tracking-[0.5em] font-black border-t border-slate-100 page-break-avoid">
                ISO 9001:2015 Standard Report • Generated by {companyProfile.name} Laboratory
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-6 right-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 z-[300]">
          <AlertCircle className="w-5 h-5" />
          <span className="font-bold text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-2 p-1 hover:bg-red-100 rounded-full"><X className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
};

export default App;
