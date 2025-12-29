
export enum PipelineStage {
    IDLE = "Idle",
    SCAN = "Scan Metadata",
    GROUP = "Group Releases",
    AI_DISCOVERY = "AI Genre Discovery",
    NORMALIZE = "Assignment Normalization",
    SORT = "Sort & Log Files",
    ANALYSIS = "Essentia Audio Analysis",
    EMBED = "Metadata Embedding",
    SKIPPED = "Skipped Audio Classification",
    REPORT = "Library Report Generation",
    COMPLETED = "Completed",
    ROLLBACK = "Rolling Back",
    RESET = "Resetting"
}

export enum AIModel {
    FLASH_LITE = "gemini-2.5-flash-lite-latest", // Maximum Speed
    FLASH = "gemini-3-flash-preview",             // Balanced
    PRO = "gemini-3-pro-preview"                  // Maximum Reasoning
}

export interface PipelineStats {
    planned_moves: number;
    skipped_files: number;
    avg_confidence: number;
}

export interface FileOperation {
    id: string;
    filename: string;
    source: string;
    destination: string;
    reason: string; // e.g., "AI Detected: Deep House"
    status: 'pending' | 'moved' | 'error';
}

export interface PipelineStatus {
    is_running: boolean;
    current_stage: PipelineStage;
    progress: number;
    logs: string[];
    stats: PipelineStats;
    proposed_changes?: FileOperation[]; // New: Holds the plan
}

export interface ConfigResponse {
    has_gemini_key: boolean;
    default_min_confidence: number;
    cwd: string;
    preferred_model: AIModel;
}

export interface HistoryItem {
    id: string;
    timestamp: number;
    fileCount: number;
    description: string;
    status: 'active' | 'rolled_back';
}

export interface LibraryAnalysis {
    total_tracks: number;
    total_size_gb: number;
    health_score: number;
    formats: {
        aiff: number;
        wav: number;
        mp3: number;
        flac: number;
        aac: number;
    };
    quality: {
        lossless: number;
        high_res: number;
        standard: number;
        low_quality: number;
    };
    genre_distribution: Array<{ name: string; count: number; percentage: number }>;
    audio_profiles: Array<{ name: string; count: number }>;
    smart_folders: Array<{
        name: string;
        count: number;
        icon: string;
        description: string;
    }>;
    metadata_health: {
        missing_art: number;
        missing_key: number;
        missing_bpm: number;
        missing_genre: number;
        corrupt: number;
    };
    duplicates: number;
}

export interface DryRunConfig {
    batchSize: number;
    workers: number;
    smartFanOut: boolean;
}
