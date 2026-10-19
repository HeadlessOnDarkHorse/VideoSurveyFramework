/* eslint-disable no-undef */
/// <reference path="../pb_data/types.d.ts" />

// =======================================================================
// 1. LOCATION FUZZING HOOK
// Automatically obscures exact GPS coordinates for public viewing to
// protect fragile paleontology/mineralogy sites from poaching.
// =======================================================================
onRecordBeforeCreateRequest((e) => {
    const exactLat = e.record.get("exact_lat");
    const exactLng = e.record.get("exact_lng");

    // Only apply fuzzing if coordinates exist
    if (exactLat && exactLng) {
        // Simple Hexagonal Grid Fuzzing (approx ~1.5km bins)
        const gridSize = 0.015;
        const fuzzedLat = Math.floor(exactLat / gridSize) * gridSize + (gridSize / 2.0);
        const fuzzedLng = Math.floor(exactLng / gridSize) * gridSize + (gridSize / 2.0);

        e.record.set("public_fuzzed_lat", fuzzedLat);
        e.record.set("public_fuzzed_lng", fuzzedLng);
    }
}, "findings");


// =======================================================================
// 2. MASTER GEOLOGIST CHAT API
// Securely proxies requests to OpenAI to protect the API key from clients.
// =======================================================================
routerAdd("POST", "/api/chat", (c) => {
    // 1. Enforce authentication
    const admin = c.get("admin");
    const user = c.get("authRecord");

    if (!admin && !user) {
        throw new BadRequestError("Unauthorized. You must be logged in to access the Master Geologist.");
    }

    // 2. Parse request body
    const body = new DynamicModel({
        findingTitle: "",
        messages: [] // Array of {role: string, content: string}
    });

    c.bind(body);

    const findingTitle = body.findingTitle || "an unknown rock";
    const userMessages = body.messages || [];

    // 3. Get API Key from environment
    const apiKey = $os.getenv("OPENAI_API_KEY");
    if (!apiKey) {
        throw new Error("Server configuration error: OPENAI_API_KEY is not set in environment.");
    }

    // 4. Construct OpenAI payload
    const systemPrompt = {
        role: "system",
        content: `You are the Master Geologist, an AI mentor for the Eon field science app.
        You are currently discussing a user's recent field finding which was visually identified as: ${findingTitle}.
        Be pedagogical, encouraging, and provide scientifically accurate information about geology, paleontology, or mineralogy. Keep answers concise.`
    };

    const payload = {
        model: "gpt-4o-mini",
        messages: [systemPrompt, ...userMessages],
        temperature: 0.7
    };

    // 5. Execute HTTP Request to OpenAI
    const res = $http.send({
        url: "https://api.openai.com/v1/chat/completions",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
    });

    if (res.statusCode !== 200) {
         throw new Error(`OpenAI API Error: ${res.raw}`);
    }

    // 6. Parse and return response
    const data = res.json();
    const aiResponseContent = data?.choices?.[0]?.message?.content || "I'm having trouble analyzing this right now.";

    return c.json(200, { content: aiResponseContent });
});
