
import React, { useEffect, useState } from 'react';
import { X, Activity, HardDrive, FileAudio, Tags, Layers, Disc, Mic2, BarChart, Zap, Sun, Moon, Key, FolderHeart } from 'lucide-react';
import { getLibraryAnalysis } from '../services/api';
import { LibraryAnalysis } from '../types';

interface LibraryAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const LibraryAnalysisModal: React.FC<LibraryAnalysisModalProps> = ({ isOpen, onClose }) => {
    const [data, setData] = useState<LibraryAnalysis | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            getLibraryAnalysis().then(setData).finally(() => setLoading(false));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const StatCard = ({ label, value, icon, color = "text-zinc-900 dark:text-white" }: any) => (
        <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 p-2.5 rounded-lg flex items-center justify-between overflow-hidden" title={`${label}: ${value}`}>
            <div className="min-w-0 flex-1">
                <div className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5 truncate">{label}</div>
                <div className={`text-sm font-black tracking-tight truncate ${color}`}>{value}</div>
            </div>
            <div className="opacity-20 text-zinc-500 dark:text-zinc-400 flex-shrink-0 ml-1.5">{icon}</div>
        </div>
    );

    const Bar = ({ label, value, max, color }: any) => (
        <div className="mb-1.5 last:mb-0" title={`${label}: ${value}`}>
            <div className="flex justify-between text-[9px] font-bold mb-0.5">
                <span className="text-zinc-600 dark:text-zinc-400 truncate pr-2">{label}</span>
                <span className="text-zinc-900 dark:text-white font-mono">{value}</span>
            </div>
            <div className="h-1 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${color}`} 
                    style={{ width: `${(value / max) * 100}%` }}
                />
            </div>
        </div>
    );

    const getIconForSmartFolder = (iconName: string) => {
        switch (iconName) {
            case 'Zap': return <Zap className="w-3 h-3 text-amber-500" />;
            case 'Sun': return <Sun className="w-3 h-3 text-orange-500" />;
            case 'Moon': return <Moon className="w-3 h-3 text-indigo-500" />;
            case 'Key': return <Key className="w-3 h-3 text-red-500" />;
            default: return <FolderHeart className="w-3 h-3 text-pink-500" />;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200 font-sans">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col">
                
                <div className="bg-zinc-50 dark:bg-zinc-950 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-red-600 rounded-md flex items-center justify-center shadow-lg shadow-red-600/20">
                            <Activity className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-zinc-900 dark:text-white tracking-tight leading-none">Library Telemetry</h2>
                            <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mt-0.5">Deep Audio Analysis</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors p-1">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {loading || !data ? (
                    <div className="flex-1 flex items-center justify-center p-12">
                        <Activity className="w-6 h-6 text-red-500 animate-pulse" />
                    </div>
                ) : (
                    <div className="overflow-y-auto p-4 space-y-4 bg-white dark:bg-zinc-900 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                            <StatCard label="Total Tracks" value={data.total_tracks} icon={<Disc className="w-5 h-5" />} />
                            <StatCard label="Library Size" value={`${data.total_size_gb} GB`} icon={<HardDrive className="w-5 h-5" />} />
                            <StatCard label="Health Score" value={`${data.health_score}%`} color={data.health_score > 80 ? 'text-green-500' : 'text-amber-500'} icon={<Activity className="w-5 h-5" />} />
                            <StatCard label="Duplicates" value={data.duplicates} icon={<Layers className="w-5 h-5" />} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                            <div className="md:col-span-4 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg">
                                <h3 className="flex items-center gap-2 font-black text-[9px] text-zinc-900 dark:text-white mb-2.5 uppercase tracking-widest" title="File Formats Breakdown">
                                    <FileAudio className="w-3 h-3 text-red-500" /> File Formats
                                </h3>
                                <div className="space-y-2">
                                    <Bar label="AIFF" value={data.formats.aiff} max={data.total_tracks} color="bg-indigo-500" />
                                    <Bar label="WAV" value={data.formats.wav} max={data.total_tracks} color="bg-blue-500" />
                                    <Bar label="FLAC" value={data.formats.flac} max={data.total_tracks} color="bg-cyan-500" />
                                    <Bar label="MP3" value={data.formats.mp3} max={data.total_tracks} color="bg-zinc-600" />
                                    <Bar label="AAC" value={data.formats.aac} max={data.total_tracks} color="bg-zinc-500" />
                                </div>
                            </div>

                            <div className="md:col-span-4 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg">
                                <h3 className="flex items-center gap-2 font-black text-[9px] text-zinc-900 dark:text-white mb-2.5 uppercase tracking-widest" title="Genre Distribution Breakdown">
                                    <BarChart className="w-3 h-3 text-red-500" /> Genre Breakdown
                                </h3>
                                <div className="space-y-2">
                                    {data.genre_distribution.map((genre) => (
                                        <div key={genre.name} className="flex items-center gap-2" title={`${genre.name}: ${genre.percentage}%`}>
                                            <div className="w-20 text-[9px] font-bold text-zinc-500 truncate text-right">{genre.name}</div>
                                            <div className="flex-1 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-red-500" style={{ width: `${genre.percentage}%` }} />
                                            </div>
                                            <div className="w-6 text-[8px] font-mono text-zinc-400 text-right">{genre.percentage}%</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="md:col-span-4 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg">
                                <h3 className="flex items-center gap-2 font-black text-[9px] text-zinc-900 dark:text-white mb-2.5 uppercase tracking-widest" title="Audio Fidelity and Resolution">
                                    <Mic2 className="w-3 h-3 text-red-500" /> Audio Fidelity
                                </h3>
                                <div className="space-y-1.5 mb-3">
                                    {data.audio_profiles.map((profile) => (
                                        <div key={profile.name} className="flex justify-between items-center text-[9px] border-b border-zinc-200 dark:border-zinc-800 pb-1 last:border-0 last:pb-0" title={`${profile.name}: ${profile.count} tracks`}>
                                            <span className="font-medium text-zinc-600 dark:text-zinc-300 truncate pr-2 max-w-[120px]">{profile.name}</span>
                                            <span className="font-mono text-zinc-900 dark:text-white">{profile.count}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-center" title="Lossless / High-Res Audio Percentage">
                                        <div className="text-[10px] font-black text-green-500 truncate">{Math.round((data.quality.lossless + data.quality.high_res)/data.total_tracks * 100)}%</div>
                                        <div className="text-[6px] text-zinc-500 font-bold uppercase mt-0.5 truncate tracking-tighter">Lossless</div>
                                    </div>
                                    <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-center" title="Count of Low Resolution Audio files">
                                        <div className="text-[10px] font-black text-amber-500 truncate">{data.quality.low_quality}</div>
                                        <div className="text-[6px] text-zinc-500 font-bold uppercase mt-0.5 truncate tracking-tighter">Low Res</div>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-12">
                                <h3 className="flex items-center gap-2 font-black text-[9px] text-zinc-900 dark:text-white mb-2.5 uppercase tracking-widest" title="AI Suggested Smart Collections">
                                    <FolderHeart className="w-3 h-3 text-red-500" /> Smart Folder Suggestions
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                                    {data.smart_folders.map((folder) => (
                                        <div key={folder.name} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg flex items-center gap-2 hover:border-red-500/30 transition-colors overflow-hidden h-14" title={`${folder.name}: ${folder.description}`}>
                                            <div className="bg-zinc-50 dark:bg-zinc-800 p-1.5 rounded-md flex-shrink-0">
                                                {getIconForSmartFolder(folder.icon)}
                                            </div>
                                            <div className="min-w-0 flex-1 flex flex-col justify-center">
                                                <div className="font-bold text-[9px] text-zinc-900 dark:text-white leading-tight line-clamp-2 uppercase">
                                                    {folder.name}
                                                </div>
                                            </div>
                                            <div className="text-[8px] font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-300 flex-shrink-0">
                                                {folder.count}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="md:col-span-12 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg">
                                <h3 className="flex items-center gap-2 font-black text-[9px] text-zinc-900 dark:text-white mb-2.5 uppercase tracking-widest" title="Missing or corrupt metadata identification">
                                    <Tags className="w-3 h-3 text-red-500" /> Metadata Health Check
                                </h3>
                                <div className="grid grid-cols-5 gap-2">
                                    <MetadataCard label="Missing Artwork" value={data.metadata_health.missing_art} status="warning" />
                                    <MetadataCard label="Missing Key" value={data.metadata_health.missing_key} status="error" />
                                    <MetadataCard label="Missing BPM" value={data.metadata_health.missing_bpm} status="error" />
                                    <MetadataCard label="Missing Genre" value={data.metadata_health.missing_genre} status="warning" />
                                    <MetadataCard label="Corrupt Files" value={data.metadata_health.corrupt} status="critical" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const MetadataCard = ({ label, value, status }: { label: string, value: number, status: 'warning' | 'error' | 'critical' }) => {
    let color = 'text-zinc-300';
    if (value > 0) {
        if (status === 'warning') color = 'text-amber-500';
        if (status === 'error') color = 'text-red-500';
        if (status === 'critical') color = 'text-red-600';
    } else if (status === 'critical') {
        color = 'text-green-500'; 
    }

    return (
        <div className="flex flex-col justify-center p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 h-16" title={`${label}: ${value} tracks affected`}>
            <span className="text-[8px] uppercase font-bold text-zinc-500 leading-tight mb-1 whitespace-normal tracking-tighter">{label}</span>
            <span className={`text-sm font-black ${color}`}>{value}</span>
        </div>
    );
}

export default LibraryAnalysisModal;
