import { useState, useCallback } from 'react';

const API_KEY = "USE YOUR OWN API!";
const API_URL = "/api/ai/chat/completions";

export const useGemini = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const sendMessage = useCallback(async (model, messages) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                }),
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`API Error: ${response.status} - ${errText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (err) {
            console.error("Gemini API Error:", err);
            setError(err.message);
            return `[System Error] ${err.message}`;
        } finally {
            setLoading(false);
        }
    }, []);

    return { sendMessage, loading, error };
};
