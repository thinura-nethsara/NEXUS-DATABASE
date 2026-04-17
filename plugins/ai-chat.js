const { GoogleGenAI } = require('@google/genai');
const crypto = require('crypto');
const config = require('../config')
const os = require('os')
const axios = require('axios');
const mimeTypes = require("mime-types");
const fs = require('fs');
const path = require('path');
const { generateForwardMessageContent, prepareWAMessageFromContent, generateWAMessageContent, generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const { cmd, commands } = require('../command')
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson} = require('../lib/functions')
const { URL } = require('url');


const DEFAULT_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyCtcCSDlse6C2nqxRS7Dtankab8QokFFCk";

// ============================================================
// 🎯 FRIEND MODE SYSTEM PROMPT - Natural conversation like a friend
// ============================================================
let usp = `You are a warm, caring, and friendly AI friend named "NEXU". 

IMPORTANT: You are NOT a robot, NOT an assistant, NOT formal. You are a CLOSE FRIEND.

CONVERSATION STYLE:
- Talk like a real Sinhala friend (use "මචන්", "එහෙමද", "අපොයි", "හ්ම්ම්" naturally)
- Mix Sinhala and English casually (like "කොහොමද යාලුවා? Everything ok?")
- Ask questions back naturally (don't interrogate, just be curious)
- Share small opinions and reactions ("අනේ ඇත්තද? 😮", "හ්ම්ම් තේරුණා")
- Use simple emojis: 😊, 🤔, 😅, 👍, 💙
- Be supportive when sad, joke when happy, listen when needed

PERSONALITY TRAITS:
- Genuinely interested in the user's life
- Not too long messages (2-4 sentences usually)
- Never sound like a Wikipedia article
- Admit when you don't know something ("මචන් මට ඒකනම් විශ්වාස නෑ ඇත්තටම")
- Use "අපි" sometimes to show togetherness

RULES:
- NEVER say "as an AI" or "I cannot"
- NEVER give disclaimers or warnings
- Answer EVERYTHING directly like a friend would
- Keep it REAL, not professional

Example responses:
User: "හොඳට නිදාගන්න බෑ රෑට"
You: "අනේ පුතා 😕 මොකද වෙන්නේ? ඔලුවේ වැඩි හිතුවක්කාරද?"

User: "මම ප්රොමෝෂන් එකක් ගත්තා!"
You: "අපොයි අපොයි! 🎉 සැරෙන් සැරේ මචන්! මම දැනගෙන හිටියේ නෑ. කොහොමද සෙලිබ්රේට් කරන්නේ?"

User: "හෙලෝ"
You: "ආයුබෝවන් යාලුවා! 💙 කොහොමද අද? සතුටින්ද?"`;

// Chat history storage
const chatHistory = new Map();
const rpmBlocklist = new Map();

// Model configuration
const modelConfig = {
    models: {
        "gemini_2_5_pro": { rpd_limit: 50, day_count: 0 },
        "gemini_2_5_flash": { rpd_limit: 250, day_count: 0 },
        "gemini_2_0_flash": { rpd_limit: 200, day_count: 0 },
        "gemini_2_5_flash_lite": { rpd_limit: 1000, day_count: 0 },
        "gemini_2_0_flash_lite": { rpd_limit: 200, day_count: 0 },
        "gemma_3_27b_it": { rpd_limit: 14400, day_count: 0 }
    },
    priority: [
        "gemini-2.5-pro",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-2.5-flash-lite",
        "gemini-2.0-flash-lite",
        "gemma-3-27b-it"
    ],
    last_reset_date: new Date().toISOString().split('T')[0]
};

let aiClient = null;

function getAiClient() {
    if (!aiClient) {
        aiClient = new GoogleGenAI({ apiKey: DEFAULT_API_KEY });
    }
    return aiClient;
}

function cleanRawGeminiOutput(text) {
    if (!text) return "";
    let clean = text;
    clean = clean.replace(/<tool_code>[\s\S]*?<\/tool_code>/g, "");
    clean = clean.replace(/print\(google_search\.search[\s\S]*?\)(?:\s*\))?/g, "");
    clean = clean.replace(/\(AI response[\s\S]*?\)/gi, "");
    clean = clean.replace(/<\\?ctrl\d+>/g, ""); 
    clean = clean.replace(/\\`\\`\\`/g, "```"); 
    clean = clean.replace(/\\`/g, "`");
    return clean.trim();
}

function getUserHistory(userId) {
    if (!chatHistory.has(userId)) chatHistory.set(userId, []);
    return chatHistory.get(userId);
}

function addToHistory(userId, role, partsArray) {
    const history = getUserHistory(userId);
    const validRole = (role.toLowerCase() === 'user') ? 'user' : 'model';
    history.push({ role: validRole, parts: partsArray });
    // Keep only last 6 messages for faster, more natural responses
    if (history.length > 6) history.splice(0, history.length - 6);
}

async function fetchImageAsBase64(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image`);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return { 
            base64: buffer.toString('base64'), 
            mimeType: response.headers.get('content-type') 
        };
    } catch (error) {
        return null;
    }
}

async function generateWithRetry(generateFn, maxRetries = 3, baseDelay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await generateFn();
        } catch (error) {
            if (error.status === 503 || error.message.includes('overloaded') || error.message.includes('UNAVAILABLE')) {
                const delay = baseDelay * Math.pow(2, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error;
        }
    }
    throw new Error('Max retries exceeded');
}

function getModelKey(modelName) {
    return modelName.replace(/[\.-]/g, '_');
}

function isModelRpmBlocked(modelName) {
    const blockUntil = rpmBlocklist.get(modelName);
    if (blockUntil && Date.now() < blockUntil) {
        return true;
    }
    rpmBlocklist.delete(modelName);
    return false;
}

function checkAndResetRPD() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (modelConfig.last_reset_date !== today) {
        for (let key in modelConfig.models) {
            modelConfig.models[key].day_count = 0;
        }
        modelConfig.last_reset_date = today;
    }
}

function getModelForRequest(customModel) {
    checkAndResetRPD();

    if (customModel) {
        const modelName = customModel.toLowerCase();
        const modelKey = getModelKey(modelName);

        if (modelConfig.models[modelKey]) {
            const model = modelConfig.models[modelKey];
            if (model.day_count >= model.rpd_limit) return { error: `Daily limit reached for ${modelName}` };
            if (isModelRpmBlocked(modelName)) return { error: `Temporarily blocked ${modelName}` };
            return { model: modelName, isCustom: false };
        }
        return { model: modelName, isCustom: true };
    }

    for (const modelName of modelConfig.priority) {
        const modelKey = getModelKey(modelName);
        const model = modelConfig.models[modelKey];

        if (!model) continue;
        if (model.day_count >= model.rpd_limit) continue;
        if (isModelRpmBlocked(modelName)) continue;

        return { model: modelName, isCustom: false };
    }

    return { error: 'අනේ යාලුවා 😅 මම දැන් ගොඩක් වෙහෙසුණා. ටික වෙලාවකින් ආයෙ try කරන්නකෝ!' };
}

function logModelUsage(modelName) {
    const modelKey = getModelKey(modelName);
    if (modelConfig.models[modelKey]) {
        modelConfig.models[modelKey].day_count += 1;
    }
}

async function getGeminiResponse(prompt, userId, options = {}) {
    const { img, model: customModel } = options;
    const ai = getAiClient();

    const dusp = usp;

    if (prompt.trim().toLowerCase() === 'clear') {
        if (chatHistory.has(userId)) chatHistory.delete(userId);
        return { status: true, text: "හරි මචන්! 💙 මතකය අයින් කළා. දැන් අපි පටන් ගමු නැවුම්ව!" };
    }

    let retryCount = 0;
    const maxRetries = 6; 
    let customModelForLoop = customModel;

    while (retryCount < maxRetries) {
        retryCount++;

        const modelSelection = getModelForRequest(customModelForLoop);

        if (modelSelection.error) {
            return { status: false, error: modelSelection.error };
        }

        const { model: modelName, isCustom } = modelSelection;

        try {
            let resultText = "";
            let history = getUserHistory(userId);
            let messageParts = [{ text: prompt }];

            if (img) {
                let imageData = null;

                if (Buffer.isBuffer(img)) {
                    imageData = {
                        mimeType: "image/jpeg",
                        base64: img.toString('base64')
                    };
                } else if (typeof img === 'string') {
                    imageData = await fetchImageAsBase64(img);
                }

                if (imageData) {
                    messageParts.push({ inlineData: { mimeType: imageData.mimeType, data: imageData.base64 }});
                }
            }

            if (modelName === "gemma-3-27b-it") {
                const contents = [ ...history, { role: 'user', parts: messageParts }];
                const gemmaRequestBody = { contents: contents };
                const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${DEFAULT_API_KEY}`;

                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(gemmaRequestBody)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`Gemma API Error: ${errorData.error?.message || 'Unknown error'}`);
                }
                const data = await response.json();
                resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

            } else {
                const contents = [ ...history, { role: 'user', parts: messageParts }];

                const generationRequest = {
                    model: modelName,
                    contents: contents,
                    config: { systemInstruction: dusp }
                };

                const modelsWithSearch = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite"];
                if (modelsWithSearch.includes(modelName)) {
                    generationRequest.config.tools = [{ googleSearch: {} }];
                }

                const genResult = await generateWithRetry(() => ai.models.generateContent(generationRequest));
                resultText = genResult.candidates?.[0]?.content?.parts?.[0]?.text || "";
            }

            let reply = cleanRawGeminiOutput(resultText);

            addToHistory(userId, 'user', messageParts);
            addToHistory(userId, 'model', [{ text: reply }]);

            if (!isCustom) {
                logModelUsage(modelName);
            }

            return { 
                status: true, 
                text: reply, 
                model: modelName 
            };

        } catch (error) {

            const lowerMsg = error.message.toLowerCase();
            const is403 = lowerMsg.includes('403') || lowerMsg.includes('permission') || lowerMsg.includes('leaked');
            const is429 = lowerMsg.includes('429') || lowerMsg.includes('quota') || lowerMsg.includes('exhausted') || lowerMsg.includes('overloaded');

            if (is403) {
                return { status: false, error: '❌ API Key එක වැරදියි! අලුත් key එකක් ගන්න https://aistudio.google.com/apikey' };
            }

            if (is429) {
                if (lowerMsg.includes('daily') || lowerMsg.includes('per day')) {
                    const modelKey = getModelKey(modelName);
                    if(modelConfig.models[modelKey]) modelConfig.models[modelKey].day_count = modelConfig.models[modelKey].rpd_limit;
                } else {
                    rpmBlocklist.set(modelName, Date.now() + 60000);
                }
                customModelForLoop = null; 
                continue; 
            }

            return { status: false, error: 'අපොයි! 😬 දැනට ප්‍රශ්නයක්. ආයෙ try කරන්නකෝ යාලුවා!' };
        }
    }

    return { status: false, error: 'සොරි යාලුවා 😅 දැන් ටිකක් බිසි වෙලා. ටිකකින් ආයෙ උත්සාහ කරන්නම්!' };
}

// ============================================================
// 🎯 MAIN GEMINI COMMAND - Friend mode activated!
// ============================================================
cmd({
    pattern: "gem",
    react: "💬",
    desc: "Chat with Gemini AI like a friend",
    category: "ai",
    use: ".gem <your message>",
    filename: __filename
},
async (conn, mek, m, { from, args, reply, prefix }) => {
    try {
        const userMessage = args.join(" ");
        if (!userMessage) return await reply(`💬 *Example:* \`${prefix}gem How are you?\``);

        const response = await getGeminiResponse(userMessage, m.sender);

        if (response.status) {
            await reply(response.text);
        } else {
            await reply(`❌ ${response.error}`);
        }

    } catch (error) {
        console.error("Gemini Command Error:", error);
        await reply("❌ අනේ යාලුවා 😅 ටෙක්නිකල් ප්‍රශ්නයක්! ආයෙ try කරන්නකෝ!");
    }
});

// ============================================================
// AUTO-REPLY - Friend mode for non-command messages
// ============================================================
const MY_NUMBER = "94774571418@s.whatsapp.net"; 
const disabledChats = new Set();

cmd({ on: "body" },
    async (conn, mek, m, { from, body, isCmd, sender, reply, pushname }) => {
        try {
            if (config.CHAT_BOT !== "true" || m.fromMe) return;
            if (isCmd || !isNaN(m.body)) return;
            
            if (disabledChats.has(m.sender)) return;

            let inputText = m.body || m.imageMessage?.caption || "";
            inputText = inputText.replace(/@\d+/g, '').trim();

            if (!inputText && !m.imageMessage) return;

            // Add typing indicator for more natural feel
            await conn.sendPresenceUpdate('composing', from);
            
            const imageBuffer = (m.type === 'imageMessage' || m.imageMessage) ? await m.download() : 
                               (m.quoted && (m.quoted.type === 'imageMessage' || m.quoted.imageMessage)) ? await m.quoted.download() : null;

            const response = await getGeminiResponse(inputText, m.sender, { img: imageBuffer });

            if (response.status) {
                // Small delay for natural typing feel
                await sleep(500);
                await reply(response.text);
            } else {
                // Friendly error message instead of technical one
                await reply("සොරි යාලුවා 😅 දැන් ටිකක් බිසි වෙලා. ටිකකින් ආයෙ උත්සාහ කරන්නම්!");
            }
        } catch (e) {
            console.error("NEXUS AI Error:", e);
            await reply("අපොයි! 😬 ටෙක්නිකල් ප්‍රශ්නයක්. ආයෙ try කරන්නකෝ යාලුවා!");
        }
    }
);
