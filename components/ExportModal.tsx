
import React, { useState, useRef } from 'react';
import { X, Disc, Download, Wand2, CheckCircle2, FileCode, Layers, UploadCloud, RefreshCw, FileSymlink, Database } from 'lucide-react';
import { generateRekordboxXML, patchRekordboxXML } from '../services/api';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Tab = 'export' | 'patch';

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
    const [tab, setTab] = useState<Tab>('export');
    const [isGenerating, setIsGenerating] = useState(false);
    const [success, setSuccess] = useState(false);
    const [includeAIComments, setIncludeAIComments] = useState(true);
    const [createPlaylists, setCreatePlaylists] = useState(true);
    
    // Patch Mode State
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const downloadStringAsFile = (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'application/xml' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const handleExport = async () => {
        setIsGenerating(true);
        try {
            const xmlContent = await generateRekordboxXML("CrateX_Export", includeAIComments);
            downloadStringAsFile(xmlContent, `cratex_rekordbox_${new Date().getTime()}.xml`);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePatch = async () => {
        if (!uploadedFile) return;
        setIsGenerating(true);
        try {
            const text = await uploadedFile.text();
            const patchedXml = await patchRekordboxXML(text);
            downloadStringAsFile(patchedXml, `cratex_patched_${uploadedFile.name}`);
            setSuccess(true);
            setUploadedFile(null); // Reset
            setTimeout(() => setSuccess(false), 3000);
        } catch (e) {
            alert("Failed to patch XML: " + e);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploadedFile(e.target.files[0]);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
                {/* Header */}
                <div className="bg-zinc-50 dark:bg-zinc-950 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-900 dark:bg-white rounded-lg flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shadow-sm">
                            <Disc className="w-5 h-5 text-white dark:text-black" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Rekordbox Bridge</h2>
                            <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">XML Database Management</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <button 
                        onClick={() => setTab('export')}
                        className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${tab === 'export' ? 'text-red-600 border-b-2 border-red-600 bg-red-50 dark:bg-red-900/10' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}
                    >
                        Create New Database
                    </button>
                    <button 
                        onClick={() => setTab('patch')}
                        className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all ${tab === 'patch' ? 'text-red-600 border-b-2 border-red-600 bg-red-50 dark:bg-red-900/10' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}
                    >
                        Patch Existing
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 min-h-[300px] flex flex-col bg-white dark:bg-zinc-900 transition-colors">
                    
                    {tab === 'export' ? (
                        <div className="space-y-6 animate-in slide-in-from-left-4 duration-200">
                            <div className="bg-zinc-100 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                                    Generate a clean <strong>rekordbox.xml</strong> to import as a new playlist. Best for first-time organization.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className={`p-4 rounded-lg border-2 transition-all cursor-pointer flex items-start gap-4 ${includeAIComments ? 'bg-white dark:bg-zinc-800/50 border-red-500 shadow-lg shadow-red-500/10' : 'bg-transparent border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
                                     onClick={() => setIncludeAIComments(!includeAIComments)}>
                                    <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border transition-colors ${includeAIComments ? 'bg-red-500 border-red-500' : 'border-zinc-400'}`}>
                                        {includeAIComments && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                            AI CDJ Comments <Wand2 className="w-3 h-3 text-red-500" />
                                        </h4>
                                        <p className="text-xs text-zinc-500 mt-1 font-medium">
                                            Injects energy/genre tags into the 'Comments' field.
                                        </p>
                                    </div>
                                </div>

                                <div className={`p-4 rounded-lg border-2 transition-all cursor-pointer flex items-start gap-4 ${createPlaylists ? 'bg-white dark:bg-zinc-800/50 border-red-500 shadow-lg shadow-red-500/10' : 'bg-transparent border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
                                     onClick={() => setCreatePlaylists(!createPlaylists)}>
                                     <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border transition-colors ${createPlaylists ? 'bg-red-500 border-red-500' : 'border-zinc-400'}`}>
                                        {createPlaylists && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                            Smart Folder Structure <Layers className="w-3 h-3 text-red-500" />
                                        </h4>
                                        <p className="text-xs text-zinc-500 mt-1 font-medium">
                                            Maps your CrateX folder structure to Rekordbox Playlists.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-200 flex-1 flex flex-col">
                            <div className="bg-zinc-100 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                                    Update your existing collection. Export XML from Rekordbox, upload here, then re-import the patched file.
                                </p>
                            </div>

                            <div 
                                className={`flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 transition-all ${uploadedFile ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept=".xml" 
                                    onChange={handleFileChange} 
                                />
                                {uploadedFile ? (
                                    <>
                                        <FileCode className="w-12 h-12 text-red-500 mb-4" />
                                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{uploadedFile.name}</p>
                                        <p className="text-xs text-red-500 mt-1 font-bold">Ready to Patch</p>
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud className="w-12 h-12 text-zinc-400 mb-4" />
                                        <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">Click to Upload XML</p>
                                        <p className="text-xs text-zinc-400 mt-1">Supports rekordbox.xml</p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="bg-zinc-50 dark:bg-zinc-950 p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                    <div className="text-xs text-zinc-400 font-medium">
                        {tab === 'export' ? 'Generates new .xml' : 'Patches existing .xml'}
                    </div>
                    
                    {tab === 'export' ? (
                        <button 
                            onClick={handleExport}
                            disabled={isGenerating}
                            className={`px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg ${
                                success 
                                ? 'bg-green-600 text-white shadow-green-600/20' 
                                : 'bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200'
                            }`}
                        >
                            {isGenerating ? (
                                <>
                                    <Wand2 className="w-4 h-4 animate-spin" /> Generating...
                                </>
                            ) : success ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4" /> Done
                                </>
                            ) : (
                                <>
                                    <Database className="w-4 h-4" /> Generate Database
                                </>
                            )}
                        </button>
                    ) : (
                        <button 
                            onClick={handlePatch}
                            disabled={isGenerating || !uploadedFile}
                            className={`px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg ${
                                success 
                                ? 'bg-green-600 text-white shadow-green-600/20' 
                                : !uploadedFile 
                                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                                    : 'bg-red-600 text-white hover:bg-red-500 shadow-red-600/20'
                            }`}
                        >
                            {isGenerating ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" /> Patching...
                                </>
                            ) : success ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4" /> Download
                                </>
                            ) : (
                                <>
                                    <FileSymlink className="w-4 h-4" /> Patch & Download
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
