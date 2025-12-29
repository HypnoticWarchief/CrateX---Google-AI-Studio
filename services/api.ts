import { PipelineStatus, ConfigResponse } from '../types';

const API_URL = "http://localhost:8000";

export const getStatus = async (): Promise<PipelineStatus> => {
    const res = await fetch(`${API_URL}/status`);
    if (!res.ok) throw new Error("Failed to fetch status");
    return res.json();
};

export const runPipeline = async (path: string, execute_mode: boolean): Promise<{ message: string }> => {
    const res = await fetch(`${API_URL}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, execute_mode }),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to start pipeline");
    }
    return res.json();
};

export const triggerRollback = async (): Promise<{ message: string }> => {
    const res = await fetch(`${API_URL}/rollback`, {
        method: "POST",
    });
    if (!res.ok) throw new Error("Failed to start rollback");
    return res.json();
};

export const getConfig = async (): Promise<ConfigResponse> => {
    const res = await fetch(`${API_URL}/config`);
    if (!res.ok) throw new Error("Failed to fetch config");
    return res.json();
};
