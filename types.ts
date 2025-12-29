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
    ROLLBACK = "Rolling Back"
}

export interface PipelineStats {
    planned_moves: number;
    skipped_files: number;
    avg_confidence: number;
}

export interface PipelineStatus {
    is_running: boolean;
    current_stage: PipelineStage;
    progress: number;
    logs: string[];
    stats: PipelineStats;
}

export interface ConfigResponse {
    has_gemini_key: boolean;
    default_min_confidence: number;
    cwd: string;
}
