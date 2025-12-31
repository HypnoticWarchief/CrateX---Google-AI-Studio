
import { PipelineStatus, ConfigResponse, PipelineStage, AIModel, FileOperation, HistoryItem, LibraryAnalysis, DryRunConfig } from '../types';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { createSpotifyPlaylist } from './spotify';

// --- CONFIGURATION ---
const API_URL = (import.meta as any).env?.PROD ? "" : "http://localhost:8000";

// --- RATE LIMITING ---
const RL_WINDOW_MS = 60000; 
const RL_MAX_REQUESTS = 10; 

const checkRateLimit = () => {
    const userKey = localStorage.getItem("cratex_api_key");
    if (userKey && userKey.trim().length > 0) return;

    // No rate limit check needed if we are using the system env key in a deployed environment
    if (process.env.API_KEY) return;

    const now = Date.now();
    try {
        const raw = localStorage.getItem("cratex_rl_timestamps");
        let timestamps: number[] = raw ? JSON.parse(raw) : [];
        timestamps = timestamps.filter(t => now - t < RL_WINDOW_MS);

        if (timestamps.length >= RL_MAX_REQUESTS) {
            const oldest = timestamps[0];
            const waitSec = Math.ceil((RL_WINDOW_MS - (now - oldest)) / 1000);
            throw new Error(`System Rate Limit Exceeded. Please wait ${waitSec}s or add your own API Key.`);
        }

        timestamps.push(now);
        localStorage.setItem("cratex_rl_timestamps", JSON.stringify(timestamps));
    } catch (e) {
        if (e instanceof Error && e.message.includes("System Rate Limit")) throw e;
    }
};

// --- STATE MANAGEMENT ---
let simStatus: PipelineStatus = {
    is_running: false,
    current_stage: PipelineStage.IDLE,
    progress: 0,
    logs: [],
    stats: { planned_moves: 0, skipped_files: 0, avg_confidence: 0 },
    proposed_changes: []
};

let simulationActive = false;
let currentPath = "/Volumes/Music/Unsorted";

// --- HELPERS ---
const getTimestamp = () => {
    // Returns [HH:MM:SS] - Exactly 10 characters
    return `[${new Date().toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]`;
};

// --- HISTORY HELPERS ---
export const getHistory = (): HistoryItem[] => {
    try {
        const raw = localStorage.getItem("cratex_history");
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
};

const saveHistoryItem = (item: HistoryItem) => {
    const history = getHistory();
    history.unshift(item);
    localStorage.setItem("cratex_history", JSON.stringify(history));
};

export const rollbackHistoryId = async (id: string): Promise<void> => {
    const history = getHistory();
    const item = history.find(h => h.id === id);
    if (!item) throw new Error("Conversion record not found.");
    
    // 24 Hour Check
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    if (Date.now() - item.timestamp > ONE_DAY_MS) {
        throw new Error("Rollback period expired. Conversions can only be reversed within 24 hours.");
    }

    if (item.status === 'rolled_back') {
        throw new Error("This conversion has already been rolled back.");
    }

    // Simulate Rollback Process
    simStatus.is_running = true;
    simStatus.current_stage = PipelineStage.ROLLBACK;
    simStatus.logs.push(`${getTimestamp()} INITIATING HISTORY ROLLBACK: ${id}`);
    simStatus.logs.push(`${getTimestamp()} Verifying file integrity...`);
    
    await new Promise(r => setTimeout(r, 1000));
    simStatus.logs.push(`${getTimestamp()} Moving files back to source...`);
    await new Promise(r => setTimeout(r, 1500));
    
    simStatus.logs.push(`${getTimestamp()} Rollback successful.`);
    simStatus.current_stage = PipelineStage.IDLE;
    simStatus.is_running = false;
    simStatus.proposed_changes = [];

    // Update History Record
    item.status = 'rolled_back';
    const updatedHistory = history.map(h => h.id === id ? item : h);
    localStorage.setItem("cratex_history", JSON.stringify(updatedHistory));
};

// --- API HELPERS ---
const handleResponse = async (res: Response) => {
    if (!res.ok) {
        let message = "An error occurred";
        try {
            const err = await res.json();
            message = err.detail || err.message || message;
        } catch (e) {}
        throw new Error(message);
    }
    return res.json();
};

export const getStatus = async (): Promise<PipelineStatus> => {
    try {
        const res = await fetch(`${API_URL}/status`);
        const data = await handleResponse(res);
        simulationActive = false;
        return data;
    } catch (e) {
        simulationActive = true;
        // IMPORTANT: Return deep copies of nested objects/arrays.
        // React's shallow comparison in useEffect/setState will fail to detect changes
        // if we return the same array reference for 'logs', causing the UI to freeze
        // even though the simulation loop is updating the data in the background.
        return { 
            ...simStatus,
            logs: [...simStatus.logs],
            stats: { ...simStatus.stats }
        };
    }
};

export const getLibraryAnalysis = async (): Promise<LibraryAnalysis> => {
    // In a real app, this would hit the backend. For now, we simulate based on simStatus.
    // Use simulated values or somewhat random values to show activity.
    const baseCount = simStatus.stats.planned_moves > 0 ? simStatus.stats.planned_moves : 2843;
    
    return {
        total_tracks: baseCount,
        total_size_gb: parseFloat((baseCount * 0.05).toFixed(1)), // approx 50MB per file avg
        health_score: 88,
        formats: {
            aiff: Math.floor(baseCount * 0.40),
            wav: Math.floor(baseCount * 0.30),
            mp3: Math.floor(baseCount * 0.15),
            flac: Math.floor(baseCount * 0.10),
            aac: Math.floor(baseCount * 0.05),
        },
        quality: {
            lossless: Math.floor(baseCount * 0.80),
            high_res: Math.floor(baseCount * 0.05),
            standard: Math.floor(baseCount * 0.10),
            low_quality: Math.floor(baseCount * 0.05),
        },
        genre_distribution: [
            { name: "Techno", count: Math.floor(baseCount * 0.35), percentage: 35 },
            { name: "House", count: Math.floor(baseCount * 0.25), percentage: 25 },
            { name: "Drum & Bass", count: Math.floor(baseCount * 0.15), percentage: 15 },
            { name: "Minimal", count: Math.floor(baseCount * 0.10), percentage: 10 },
            { name: "Ambient", count: Math.floor(baseCount * 0.05), percentage: 5 },
            { name: "Other", count: Math.floor(baseCount * 0.10), percentage: 10 }
        ],
        audio_profiles: [
            { name: "44.1kHz / 16-bit", count: Math.floor(baseCount * 0.60) },
            { name: "44.1kHz / 24-bit", count: Math.floor(baseCount * 0.20) },
            { name: "48kHz / 24-bit", count: Math.floor(baseCount * 0.10) },
            { name: "96kHz / 24-bit", count: Math.floor(baseCount * 0.05) },
            { name: "Lossy (320kbps)", count: Math.floor(baseCount * 0.05) }
        ],
        smart_folders: [
            { name: "Peak Time Energy", count: 450, icon: "Zap", description: "High Energy (>8)" },
            { name: "Warmup Vibes", count: 320, icon: "Sun", description: "Low BPM (<120) & Deep" },
            { name: "Fix: Missing Keys", count: 89, icon: "Key", description: "Tracks needing key detection" },
            { name: "Closing Set", count: 120, icon: "Moon", description: "Melodic & Emotional tracks" }
        ],
        metadata_health: {
            missing_art: 142,
            missing_key: 89,
            missing_bpm: 12,
            missing_genre: 450,
            corrupt: 3,
        },
        duplicates: 14
    };
};

export const getApiKey = (): string => {
    // 1. Check local storage for user override
    const localKey = localStorage.getItem("cratex_api_key");
    if (localKey && localKey.trim().length > 0) return localKey;
    
    // 2. Fallback to process.env.API_KEY (Strict adherence to guidelines)
    // Note: We access this directly as per instructions, assuming Vite replacement.
    return process.env.API_KEY || "";
};

export const getPreferredModel = (): string => {
    const stored = localStorage.getItem("cratex_model");
    if (stored && Object.values(AIModel).includes(stored as AIModel)) {
        return stored;
    }
    // Default to a Gemini 3 model
    return 'gemini-3-flash-preview';
};

// --- SIMULATION LOGIC ---

const generateMockOperations = (basePath: string): FileOperation[] => {
    const genreMap: Record<string, string[]> = {
        'Techno': ['Peak Time', 'Hypnotic', 'Raw', 'Hard', 'Dub'],
        'House': ['Deep', 'Tech House', 'Progressive', 'Lo-Fi', 'Afro'],
        'Drum & Bass': ['Liquid', 'Neurofunk', 'Jump Up', 'Intelligent'],
        'Ambient': ['Drone', 'Field Recordings', 'Space'],
        'UK Garage': ['2-Step', 'Speed Garage', 'Bassline']
    };

    const artists = [
        'Sub Focus', 'Four Tet', 'Bicep', 'Overmono', 'Mall Grab', 'Calibre', 'Burial', 'Aphex Twin',
        'Charlotte de Witte', 'Peggy Gou', 'Fred Again..', 'Skrillex', 'Floating Points', 'Caribou',
        'Bonobo', 'Jamie xx', 'Disclosure', 'Flume', 'Lane 8', 'Solomun', 'Amelie Lens', 'Carl Cox'
    ];

    const sanitize = (str: string) => str.replace(/\s+/g, '_');

    const ops: FileOperation[] = [];
    const usedFilenames = new Set<string>(); // Prevent duplicates
    
    // Generate 1500-3000 tracks
    const total = 1500 + Math.floor(Math.random() * 1500);

    for (let i = 1; i <= total; i++) {
        const mainGenres = Object.keys(genreMap);
        const mainGenre = mainGenres[Math.floor(Math.random() * mainGenres.length)];
        const subGenres = genreMap[mainGenre];
        const subGenre = subGenres[Math.floor(Math.random() * subGenres.length)];
        
        const artist = artists[Math.floor(Math.random() * artists.length)];
        
        // Ensure unique filename
        let trackName = `${artist} - Track ${String(i).padStart(4, '0')}`;
        let filename = `${trackName}.aiff`;
        
        // Sanity check for uniqueness (though loop index guarantees it here)
        if (usedFilenames.has(filename)) continue;
        usedFilenames.add(filename);

        // Sanitize folder names (Peak Time -> Peak_Time)
        const safeMainGenre = sanitize(mainGenre);
        const safeSubGenre = sanitize(subGenre);

        ops.push({
            id: `op_${i}`,
            filename: filename,
            source: `${basePath}/${filename}`,
            destination: `${basePath}/${safeMainGenre}/${safeSubGenre}/${filename}`,
            reason: `AI Classification: ${mainGenre} > ${subGenre} (${(85 + Math.random() * 14).toFixed(1)}%)`,
            status: 'pending'
        });
    }
    return ops;
};

export const runAnalysis = async (path: string, config?: DryRunConfig): Promise<{ message: string }> => {
    try {
        // Send config to backend if implemented
        const res = await fetch(`${API_URL}/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path, config }),
        });
        return handleResponse(res);
    } catch (e) {
        if (!simStatus.is_running) startSimulation(path, true, config);
        return { message: "Starting library analysis..." };
    }
};

export const commitChanges = async (): Promise<{ message: string }> => {
    try {
        const res = await fetch(`${API_URL}/execute`, { method: "POST" });
        return handleResponse(res);
    } catch (e) {
        if (!simStatus.is_running) startSimulation(currentPath, false);
        return { message: "Executing file moves..." };
    }
};

const startSimulation = async (path: string, isAnalysis: boolean, config?: DryRunConfig) => {
    if (simStatus.is_running) return;
    simulationActive = true;
    currentPath = path;
    
    // Configuration affects speed
    const workers = config?.workers || 4;
    const batchSize = config?.batchSize || 20;
    const fanOut = config?.smartFanOut !== undefined ? config.smartFanOut : true;

    // Faster workers = shorter duration
    // Base duration 30s. Each worker reduces time by 1.5s, min 5s.
    const baseDuration = 30000;
    const speedup = (workers - 1) * 1500;
    const actualDuration = Math.max(5000, baseDuration - speedup);

    simStatus = {
        ...simStatus,
        is_running: true,
        progress: 0,
        logs: isAnalysis 
            ? [`${getTimestamp()} Pipeline Initialized. Target: ${path}`] 
            : [`${getTimestamp()} EXECUTION STARTED. Moving files...`],
        proposed_changes: isAnalysis ? [] : simStatus.proposed_changes,
        stats: isAnalysis ? { planned_moves: 0, skipped_files: 0, avg_confidence: 0 } : simStatus.stats,
    };

    if (isAnalysis && fanOut) {
        // Ensure standard log format [HH:MM:SS] Message
        simStatus.logs.push(`${getTimestamp()} System: Spawning ${workers} parallel workers...`);
        simStatus.logs.push(`${getTimestamp()} System: Batch Strategy: ${batchSize} files/worker`);
    }

    const stages = isAnalysis 
        ? [PipelineStage.SCAN, PipelineStage.GROUP, PipelineStage.AI_DISCOVERY, PipelineStage.NORMALIZE]
        : [PipelineStage.SORT, PipelineStage.REPORT];
    
    const stepsPerStage = 25;
    const stepDelay = (actualDuration / stages.length) / stepsPerStage; 

    for (const stage of stages) {
        simStatus.current_stage = stage;
        simStatus.logs.push(`${getTimestamp()} Running Stage: ${stage}`); 
        
        for (let i = 0; i <= 100; i += (100 / stepsPerStage)) {
            simStatus.progress = i;
            
            if (isAnalysis) {
                 if (stage === PipelineStage.SCAN) {
                     simStatus.stats.planned_moves += Math.floor(Math.random() * (120 * (workers/4))); // Scale by workers
                     if (simStatus.stats.planned_moves > 3000) simStatus.stats.planned_moves = 3000;
                 }
                 if (stage === PipelineStage.AI_DISCOVERY) {
                    simStatus.stats.avg_confidence = 0.6 + (Math.random() * 0.39);
                    
                    // Simulate parallel worker logs
                    if (Math.random() > 0.85) {
                        const workerId = Math.floor(Math.random() * workers) + 1;
                        const batchId = Math.floor(Math.random() * 500) + 1;
                        simStatus.logs.push(`${getTimestamp()} Worker ${workerId}: Processing Batch #${batchId} (${batchSize} files)...`);
                    }
                 }
            }
            
            await new Promise(r => setTimeout(r, stepDelay));
        }
    }

    if (isAnalysis) {
        simStatus.logs.push(`${getTimestamp()} DRY RUN COMPLETE. Review proposed changes before execution.`);
        const newOps = generateMockOperations(path);
        simStatus.proposed_changes = newOps;
        simStatus.stats.planned_moves = newOps.length;
        simStatus.stats.avg_confidence = 0.94; 
    } else {
        simStatus.logs.push(`${getTimestamp()} Sort Complete. Rollback available.`);
        simStatus.proposed_changes = simStatus.proposed_changes?.map(op => ({...op, status: 'moved'}));
        
        saveHistoryItem({
            id: `job_${Date.now()}`,
            timestamp: Date.now(),
            fileCount: simStatus.stats.planned_moves,
            description: "Auto-Sort Execution",
            status: 'active'
        });
    }

    simStatus.is_running = false;
    simStatus.current_stage = PipelineStage.COMPLETED;
};

export const triggerRollback = async (): Promise<{ message: string }> => {
    try {
        const res = await fetch(`${API_URL}/rollback`, { method: "POST" });
        return handleResponse(res);
    } catch (e) {
        simStatus.current_stage = PipelineStage.ROLLBACK;
        simStatus.logs = [...simStatus.logs, `${getTimestamp()} !!! INITIATING ROLLBACK !!!`, `${getTimestamp()} Reversing file operations...`];
        await new Promise(r => setTimeout(r, 1500));
        simStatus.current_stage = PipelineStage.IDLE;
        simStatus.logs = [`${getTimestamp()} Rollback successful. Library restored to original state.`];
        simStatus.stats = { planned_moves: 0, skipped_files: 0, avg_confidence: 0 };
        simStatus.proposed_changes = [];
        return { message: "Rollback complete" };
    }
};

export const resetPipeline = async (): Promise<{ message: string }> => {
    try {
        const res = await fetch(`${API_URL}/reset`, { method: "POST" });
        return handleResponse(res);
    } catch (e) {
        simStatus = {
            is_running: false,
            current_stage: PipelineStage.IDLE,
            progress: 0,
            logs: [],
            stats: { planned_moves: 0, skipped_files: 0, avg_confidence: 0 },
            proposed_changes: []
        };
        return { message: "Pipeline reset." };
    }
}

export const getConfig = async (): Promise<ConfigResponse> => {
    return {
        has_gemini_key: !!getApiKey(),
        default_min_confidence: 0.75,
        cwd: currentPath,
        preferred_model: getPreferredModel() as AIModel
    };
};

export const isSimulated = () => simulationActive;

// --- AGENTIC AI CAPABILITIES ---

const tools = [
    {
        name: 'trigger_pipeline',
        description: 'Start the music organization pipeline.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                mode: { type: SchemaType.STRING, description: "Either 'dry_run' or 'execute'" }
            },
            required: ['mode']
        }
    },
    {
        name: 'update_path',
        description: 'Update the library folder path.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                path: { type: SchemaType.STRING, description: "The file system path to the music folder" }
            },
            required: ['path']
        }
    },
    {
        name: 'create_playlist',
        description: 'Create a playlist on Spotify or Apple Music based on a genre or mood.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                platform: { type: SchemaType.STRING, description: "spotify or apple_music" },
                name: { type: SchemaType.STRING, description: "Name of the playlist" },
                description: { type: SchemaType.STRING, description: "Description or genre/mood focus" }
            },
            required: ['platform', 'name']
        }
    },
    {
        name: 'find_purchase_link',
        description: 'Find a link to buy a specific track or album on Bandcamp or Beatport.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                query: { type: SchemaType.STRING, description: "Artist and Track Name" },
                store: { type: SchemaType.STRING, description: "bandcamp or beatport" }
            },
            required: ['query']
        }
    },
    // New Tool: Web Search
    {
        name: 'web_search',
        description: 'Search the internet for music definitions, genre history, or specific questions.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                query: { type: SchemaType.STRING, description: "The search query" }
            },
            required: ['query']
        }
    }
];

export const askGeminiAgent = async (
    prompt: string, 
    context: any, 
    onAction: (action: string, params: any) => void
) => {
    checkRateLimit(); 
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("Missing API Key");

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = getPreferredModel();

    const systemInstruction = `
        You are CrateX Agent, an expert DJ Librarian.
        
        Capabilities:
        1. Manage the local library (scan, sort, set path).
        2. Create playlists on Spotify/Apple Music.
        3. Find legal purchase links (Bandcamp/Beatport).
        4. Research music genres, history, and definitions using 'web_search'.

        Current App State:
        - Library Path: ${context.path}
        - Status: ${context.status.is_running ? "Running" : "Idle"}
        - Stats: ${JSON.stringify(context.status.stats)}

        Rules:
        - If user asks about a genre definition or history, use 'web_search'.
        - If user asks to buy a track, use 'find_purchase_link'.
        - If user wants a playlist exported, use 'create_playlist'.
    `;

    const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction,
        tools: [{ functionDeclarations: tools as any }]
    } as any); // Cast to any to bypass strict type check for beta features if version is lagging

    const result = await model.generateContent(prompt);
    const response = result.response;
    
    // Safety check for functionCalls existence (it depends on version)
    // Using explicit method check or property
    let toolCalls: any[] | undefined;
    if (typeof response.functionCalls === 'function') {
        toolCalls = response.functionCalls();
    }

    if (toolCalls && toolCalls.length > 0) {
        for (const call of toolCalls) {
            console.log("Agent executing:", call.name, call.args);
            
            // Handle Web Search internally by chaining a grounded request
            if (call.name === 'web_search') {
                const searchRes = await askGemini(call.args.query as string, 'search');
                let finalText = searchRes.text() || `Here is what I found for "${call.args.query}"`;
                
                // Grounding metadata extraction (checking for candidates)
                const candidate = searchRes.candidates?.[0];
                const chunks = (candidate as any)?.groundingMetadata?.groundingChunks;
                
                if (chunks) {
                    finalText += "\n\nSources:";
                    chunks.forEach((c: any) => {
                        if (c.web?.uri) finalText += `\n• ${c.web.title}: ${c.web.uri}`;
                    });
                }
                return finalText;
            }

            // Real Spotify Integration
            if (call.name === 'create_playlist' && call.args.platform === 'spotify') {
                try {
                    const result = await createSpotifyPlaylist(
                        call.args.name as string, 
                        call.args.description as string
                    );
                    onAction('create_playlist', { ...call.args, url: result.url });
                    return `Success! I created the Spotify playlist "${call.args.name}". You can view it here: ${result.url}`;
                } catch (e: any) {
                    return `I couldn't create the playlist. ${e.message}`;
                }
            }

            // For other tools, delegate to the UI callback
            onAction(call.name, call.args);
            
            if (call.name === 'create_playlist') {
                return `I'm creating a ${call.args.platform} playlist called "${call.args.name}". Verify the popup window.`;
            }
            if (call.name === 'find_purchase_link') {
                return `Searching stores for "${call.args.query}"...`;
            }
            
            return `Executing ${call.name}...`;
        }
    }

    return response.text() || "Command processed.";
};

export const askGemini = async (prompt: string, mode: 'fast' | 'think' | 'search' = 'fast') => {
    checkRateLimit();
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("Missing API Key");
    const genAI = new GoogleGenerativeAI(apiKey);

    if (mode === 'think') {
        // Cast as any to avoid type errors if thinkingConfig is not in stable types yet
        return await genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' } as any).generateContent(prompt).then(r => r.response);
    } else if (mode === 'search') {
        return await genAI.getGenerativeModel({ 
            model: 'gemini-3-flash-preview',
            tools: [{ googleSearch: {} }] as any 
        } as any).generateContent(prompt).then(r => r.response);
    } else {
        return await genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' }).generateContent(prompt).then(r => r.response);
    }
};

export const generateAIComment = async (genre: string, energyLevel: string): Promise<string> => {
    checkRateLimit();
    const apiKey = getApiKey();
    if (!apiKey) return "CrateX Processed";
    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
        const result = await model.generateContent(`DJ Comment (5 words max) for ${genre}, ${energyLevel} Energy. No quotes.`);
        return result.response.text().trim() || "CrateX Verified";
    } catch (e) {
        return "CrateX Verified";
    }
};

export const generateRekordboxXML = async (libraryName: string, includeAIComments: boolean, scanResults?: FileOperation[]): Promise<string> => {
    const date = new Date().toISOString();
    
    // Header
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<DJ_PLAYLISTS Version="1.0.0">
  <PRODUCT Name="rekordbox" Version="6.0.0" Company="Pioneer DJ"/>
  <COLLECTION Entries="${scanResults ? scanResults.length : 1}">`;

    if (scanResults && scanResults.length > 0) {
        for (let i = 0; i < scanResults.length; i++) {
            const op = scanResults[i];
            const parts = op.filename.split(' - ');
            const artist = parts[0] || "Unknown Artist";
            const title = parts[1] ? parts[1].replace(/\.[^/.]+$/, "") : op.filename;
            
            const reasonParts = op.reason.split(':');
            const genreInfo = reasonParts.length > 1 ? reasonParts[1].trim() : "Unknown";
            
            // Derive simpler metadata for XML
            const comments = includeAIComments ? `CrateX AI: ${genreInfo}` : "CrateX Verified";

            xml += `
    <TRACK TrackID="${i + 1}" Name="${title}" Artist="${artist}" Kind="Audio File" Size="102400" TotalTime="360" DateAdded="${date}" BitRate="320" SampleRate="44100" Comments="${comments}" Location="file://localhost${op.destination.replace(/ /g, '%20')}">
      <TEMPO Intro="0.000" Outro="0.000" Bpm="124.00"/>
    </TRACK>`;
        }
    } else {
        // Fallback default
        let comment = "Processed by CrateX";
        if (includeAIComments) comment = await generateAIComment("House", "High");
        xml += `
    <TRACK TrackID="1" Name="Agentic Track" Artist="CrateX" Kind="WAV File" Size="100000" TotalTime="360" DateAdded="${date}" BitRate="1411" SampleRate="44100" Comments="${comment}" Location="file://localhost/Music/${libraryName}/track.wav">
      <TEMPO Intro="0.000" Outro="0.000" Bpm="124.00"/>
    </TRACK>`;
    }

    xml += `
  </COLLECTION>
</DJ_PLAYLISTS>`;
    return xml;
};

export const patchRekordboxXML = async (xmlString: string): Promise<string> => {
    return xmlString; 
};

export const runPipeline = async () => ({message: "Deprecated"});
