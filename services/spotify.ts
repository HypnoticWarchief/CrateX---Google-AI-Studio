
// Spotify API Service
const SPOTIFY_API_URL = "https://api.spotify.com/v1";

export const getSpotifyToken = (): string | null => {
    return localStorage.getItem("cratex_spotify_token");
};

export const createSpotifyPlaylist = async (name: string, description: string): Promise<{ url: string; id: string }> => {
    const token = getSpotifyToken();
    if (!token) {
        throw new Error("Spotify Access Token not found. Please add it in Settings.");
    }

    // 1. Get User ID
    const userRes = await fetch(`${SPOTIFY_API_URL}/me`, {
        headers: { "Authorization": `Bearer ${token}` }
    });

    if (!userRes.ok) {
        if (userRes.status === 401) throw new Error("Spotify Token Expired or Invalid.");
        throw new Error("Failed to fetch Spotify Profile.");
    }
    
    const userData = await userRes.json();
    const userId = userData.id;

    // 2. Create Playlist
    const playlistRes = await fetch(`${SPOTIFY_API_URL}/users/${userId}/playlists`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: name,
            description: description + " | Created by CrateX AI",
            public: false
        })
    });

    if (!playlistRes.ok) {
        throw new Error(`Failed to create playlist: ${playlistRes.statusText}`);
    }

    const playlistData = await playlistRes.json();
    
    return {
        url: playlistData.external_urls.spotify,
        id: playlistData.id
    };
};
