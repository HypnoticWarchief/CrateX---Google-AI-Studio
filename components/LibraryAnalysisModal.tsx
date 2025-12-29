
import React, { useEffect, useState } from 'react';
import { X, Activity, HardDrive, FileAudio, Tags, AlertTriangle, PieChart, Disc, Mic2, Layers, Music, BarChart, Zap, Sun, Moon, Key, FolderHeart } from 'lucide-react';
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
        <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 p-4 rounded-xl flex items-center justify-between overflow-hidden">
            <div className="min-w-0">
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1 truncate">{label}</div>
                <div className={`text-xl font-black tracking-tight truncate ${color}`}>{value}</div>
            </div>
            <div className="opacity-20 text-zinc-500 dark:text-zinc-400 flex-shrink-0 ml-2">{icon}</div>
        </div>
    );

    const Bar = ({ label, value, max, color }: any) => (
        <div className="mb-2 last:mb-0">
            <div className="flex justify-between text-[11px] font-bold mb-1">
                <span className="text-zinc-600 dark:text-zinc-400 truncate pr-2">{label}</span>
                <span className="text-zinc-900 dark:text-white font-mono">{value}</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${color}`} 
                    style={{ width: `${(value / max) * 100}%` }}
                />
            </div>
        </div>
    );

    const getIconForSmartFolder = (iconName: string) => {
        switch (iconName) {
            case 'Zap': return <Zap className="w-3.5 h-3.5 text-amber-500" />;
            case 'Sun': return <Sun className="w-3.5 h-3.5 text-orange-500" />;
            case 'Moon': return <Moon className="w-3.5 h-3.5 text-indigo-500" />;
            case 'Key': return <Key className="w-3.5 h-3.5 text-red-500" />;
            default: return <FolderHeart className="w-3.5 h-3.5 text-pink-500" />;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200 font-sans">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                
                {/* Header */}
                <div className="bg-zinc-50 dark:bg-zinc-950 px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-600/20">
                            <Activity className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight leading-none">Library Telemetry</h2>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1">Deep Audio Analysis</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors p-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                {loading || !data ? (
                    <div className="flex-1 flex items-center justify-center p-12">
                        <Activity className="w-6 h-6 text-red-500 animate-pulse" />
                    </div>
                ) : (
                    <div className="overflow-y-auto p-5 space-y-5 bg-white dark:bg-zinc-900 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                        
                        {/* Top Stats Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <StatCard 
                                label="Total Tracks" 
                                value={data.total_tracks} 
                                icon={<Disc className="w-6 h-6" />} 
                            />
                            <StatCard 
                                label="Library Size" 
                                value={`${data.total_size_gb} GB`} 
                                icon={<HardDrive className="w-6 h-6" />} 
                            />
                            <StatCard 
                                label="Health Score" 
                                value={`${data.health_score}%`} 
                                color={data.health_score > 80 ? 'text-green-500' : 'text-amber-500'}
                                icon={<Activity className="w-6 h-6" />} 
                            />
                            <StatCard 
                                label="Duplicates" 
                                value={data.duplicates} 
                                icon={<Layers className="w-6 h-6" />} 
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                            
                            {/* Format Distribution (Left Column) */}
                            <div className="md:col-span-4 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl">
                                <h3 className="flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-white mb-3 uppercase tracking-wide">
                                    <FileAudio className="w-3.5 h-3.5 text-red-500" /> File Formats
                                </h3>
                                <div className="space-y-3">
                                    <Bar label="AIFF" value={data.formats.aiff} max={data.total_tracks} color="bg-indigo-500" />
                                    <Bar label="WAV" value={data.formats.wav} max={data.total_tracks} color="bg-blue-500" />
                                    <Bar label="FLAC" value={data.formats.flac} max={data.total_tracks} color="bg-cyan-500" />
                                    <Bar label="MP3" value={data.formats.mp3} max={data.total_tracks} color="bg-zinc-600" />
                                    <Bar label="AAC" value={data.formats.aac} max={data.total_tracks} color="bg-zinc-500" />
                                </div>
                            </div>

                            {/* Genre Distribution (Middle Column) */}
                            <div className="md:col-span-4 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl">
                                <h3 className="flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-white mb-3 uppercase tracking-wide">
                                    <BarChart className="w-3.5 h-3.5 text-red-500" /> Genre Breakdown
                                </h3>
                                <div className="space-y-3">
                                    {data.genre_distribution.map((genre) => (
                                        <div key={genre.name} className="flex items-center gap-2">
                                            <div className="w-24 text-[11px] font-bold text-zinc-500 truncate text-right">{genre.name}</div>
                                            <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-red-500" 
                                                    style={{ width: `${genre.percentage}%` }}
                                                />
                                            </div>
                                            <div className="w-8 text-[10px] font-mono text-zinc-400 text-right">{genre.percentage}%</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Audio Quality (Right Column) */}
                            <div className="md:col-span-4 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl">
                                <h3 className="flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-white mb-3 uppercase tracking-wide">
                                    <Mic2 className="w-3.5 h-3.5 text-red-500" /> Audio Fidelity
                                </h3>
                                
                                <div className="space-y-2 mb-4">
                                    {data.audio_profiles.map((profile) => (
                                        <div key={profile.name} className="flex justify-between items-center text-[11px] border-b border-zinc-200 dark:border-zinc-800 pb-1.5 last:border-0 last:pb-0">
                                            <span className="font-medium text-zinc-600 dark:text-zinc-300 truncate pr-2">{profile.name}</span>
                                            <span className="font-mono text-zinc-900 dark:text-white">{profile.count}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-center">
                                        <div className="text-lg font-black text-green-500">{Math.round((data.quality.lossless + data.quality.high_res)/data.total_tracks * 100)}%</div>
                                        <div className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">Lossless</div>
                                    </div>
                                    <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-center">
                                        <div className="text-lg font-black text-amber-500">{data.quality.low_quality}</div>
                                        <div className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">Low Res</div>
                                    </div>
                                </div>
                            </div>

                            {/* Smart Folders */}
                            <div className="md:col-span-12">
                                <h3 className="flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-white mb-3 uppercase tracking-wide">
                                    <FolderHeart className="w-3.5 h-3.5 text-red-500" /> Smart Folder Suggestions
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                    {data.smart_folders.map((folder) => (
                                        <div key={folder.name} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg flex items-start gap-3 hover:border-red-500/30 transition-colors">
                                            <div className="mt-0.5 bg-zinc-50 dark:bg-zinc-800 p-1.5 rounded-md">
                                                {getIconForSmartFolder(folder.icon)}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-xs text-zinc-900 dark:text-white truncate">{folder.name}</div>
                                                <div className="text-[10px] text-zinc-500 mt-0.5 truncate">{folder.description}</div>
                                                <div className="mt-1.5 text-[9px] font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded inline-block text-zinc-600 dark:text-zinc-300">
                                                    {folder.count} tracks
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Metadata Health */}
                            <div className="md:col-span-12 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl">
                                <h3 className="flex items-center gap-2 font-bold text-sm text-zinc-900 dark:text-white mb-3 uppercase tracking-wide">
                                    <Tags className="w-3.5 h-3.5 text-red-500" /> Metadata Health Check
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    <div className="flex flex-col gap-0.5 p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                        <span className="text-[9px] uppercase font-bold text-zinc-500 truncate">Missing Artwork</span>
                                        <span className={`text-lg font-black ${data.metadata_health.missing_art > 0 ? 'text-amber-500' : 'text-zinc-300'}`}>
                                            {data.metadata_health.missing_art}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-0.5 p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                        <span className="text-[9px] uppercase font-bold text-zinc-500 truncate">Missing Key</span>
                                        <span className={`text-lg font-black ${data.metadata_health.missing_key > 0 ? 'text-red-500' : 'text-zinc-300'}`}>
                                            {data.metadata_health.missing_key}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-0.5 p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                        <span className="text-[9px] uppercase font-bold text-zinc-500 truncate">Missing BPM</span>
                                        <span className={`text-lg font-black ${data.metadata_health.missing_bpm > 0 ? 'text-red-500' : 'text-zinc-300'}`}>
                                            {data.metadata_health.missing_bpm}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-0.5 p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                        <span className="text-[9px] uppercase font-bold text-zinc-500 truncate">Missing Genre</span>
                                        <span className={`text-lg font-black ${data.metadata_health.missing_genre > 0 ? 'text-amber-500' : 'text-zinc-300'}`}>
                                            {data.metadata_health.missing_genre}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-0.5 p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                        <span className="text-[9px] uppercase font-bold text-zinc-500 truncate">Corrupt Files</span>
                                        <span className={`text-lg font-black ${data.metadata_health.corrupt > 0 ? 'text-red-600' : 'text-green-500'}`}>
                                            {data.metadata_health.corrupt}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LibraryAnalysisModal;
