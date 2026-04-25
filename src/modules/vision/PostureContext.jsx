import React, { createContext, useContext, useRef, useState, useCallback } from 'react';

const PostureContext = createContext(null);

export function PostureProvider({ children }) {
    // Global refs for real-time tracking (no re-renders)
    const baselineRef = useRef(null);
    const latestLandmarksRef = useRef(null);
    const lastAlertTimeRef = useRef(0);

    // Shared state for UI (updated sparingly)
    const [alertState, setAlertState] = useState({ isAlert: false, message: "" });
    const [similarityScore, setSimilarityScore] = useState(1.0);

    return (
        <PostureContext.Provider value={{
            baselineRef,
            latestLandmarksRef,
            lastAlertTimeRef,
            alertState,
            setAlertState,
            similarityScore,
            setSimilarityScore
        }}>
            {children}
        </PostureContext.Provider>
    );
}

export function usePostureStore() {
    return useContext(PostureContext);
}
