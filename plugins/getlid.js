const { cmd } = require('../command');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

cmd({
    pattern: "getlid",
    alias: ["getid", "lid", "userid"],
    react: "🆔",
    desc: "Get user's LID ID from replied message or mentioned user",
    category: "owner",
    use: ".getlid (reply to a message or tag a user)",
    filename: __filename
}, 
async (conn, mek, m, { from, reply, isOwner, isMe, isSudo }) => {
    try {
        // Only owner and sudo users can use this
        if (!isOwner && !isMe && !isSudo) {
            return reply("*🔒 OWNER ONLY COMMAND*");
        }

        let targetJid = null;
        let targetName = "Unknown User";
        let pushName = null;

        // Safely get message text
        let text = '';
        try {
            if (mek.message?.conversation) {
                text = mek.message.conversation;
            } else if (mek.message?.extendedTextMessage?.text) {
                text = mek.message.extendedTextMessage.text;
            } else if (mek.message?.imageMessage?.caption) {
                text = mek.message.imageMessage.caption;
            } else if (mek.message?.videoMessage?.caption) {
                text = mek.message.videoMessage.caption;
            }
        } catch(e) {
            console.log("Error extracting text:", e.message);
        }

        // METHOD 1: Get from message text mention (@number)
        const mentionMatch = text.match(/@(\d+)/);
        if (mentionMatch && !targetJid) {
            const number = mentionMatch[1];
            targetJid = `${number}@s.whatsapp.net`;
            console.log("📌 Got from text mention:", targetJid);
        }

        // METHOD 2: Get from proper WhatsApp mentions array
        if (!targetJid && mek.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            const mentions = mek.message.extendedTextMessage.contextInfo.mentionedJid;
            if (mentions && mentions.length > 0) {
                targetJid = mentions[0];
                console.log("📌 Got from mentionedJid array:", targetJid);
            }
        }

        // METHOD 3: Get from quoted message (reply to someone)
        if (!targetJid && m?.quoted?.sender) {
            targetJid = m.quoted.sender;
            pushName = m.quoted.pushName || null;
            console.log("📌 Got from quoted message:", targetJid);
        }

        // METHOD 4: Get from contextInfo participant
        if (!targetJid && mek.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = mek.message.extendedTextMessage.contextInfo.participant;
            console.log("📌 Got from contextInfo participant:", targetJid);
        }

        // METHOD 5: If still no target, get sender's own ID
        if (!targetJid) {
            targetJid = m?.sender || mek?.key?.remoteJid;
            pushName = m?.pushName || null;
            console.log("📌 Got from self:", targetJid);
        }

        // Final validation
        if (!targetJid) {
            return reply("*❌ Could not identify the user. Please reply to a user's message or tag them.*\n\n*Usage:* `.getlid` (reply to message) or `.getlid @947XXXXXXXXX*");
        }

        // Clean up JID
        try {
            targetJid = jidNormalizedUser(targetJid);
        } catch(e) {
            console.log("JID Normalization error:", e.message);
        }
        console.log("📌 Final targetJid:", targetJid);

        // Try to get user's name - FIXED: Removed conn.getContact which doesn't exist
        try {
            if (pushName) {
                targetName = pushName;
            } else if (m?.quoted?.pushName) {
                targetName = m.quoted.pushName;
            } else if (m?.pushName && targetJid === (m.sender || mek?.key?.remoteJid)) {
                targetName = m.pushName;
            } else if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
                // Try to get from message itself
                const msgText = mek.message?.extendedTextMessage?.text || mek.message?.conversation || '';
                if (msgText.includes('@')) {
                    targetName = "Mentioned User";
                }
            }
            
            // Try to get from store if available
            if (global.db && global.db.data && global.db.data.users && global.db.data.users[targetJid]) {
                const userData = global.db.data.users[targetJid];
                if (userData.name) targetName = userData.name;
            }
        } catch(e) {
            console.log("Could not fetch name:", e.message);
        }

        // Clean the name (remove emojis and special chars if needed)
        if (targetName && targetName.length > 30) {
            targetName = targetName.substring(0, 27) + "...";
        }

        // Extract LID/number
        let lidNumber = null;
        let fullJid = targetJid;
        let jidType = "Unknown";

        if (targetJid.includes('@lid')) {
            lidNumber = targetJid.split('@')[0];
            jidType = "🆔 LID (LiD)";
        } 
        else if (targetJid.includes('@g.us')) {
            lidNumber = targetJid.split('@')[0];
            jidType = "👥 Group ID";
        }
        else if (targetJid.includes('@s.whatsapp.net')) {
            lidNumber = targetJid.split('@')[0];
            jidType = "📱 Phone Number";
        }
        else {
            const numberMatch = targetJid.match(/(\d+)/);
            if (numberMatch) {
                lidNumber = numberMatch[1];
                jidType = "🔢 Extracted Number";
            }
        }

        // Format phone number nicely (if it's a phone number)
        let formattedNumber = lidNumber || "N/A";
        if (lidNumber && lidNumber.length >= 10 && !targetJid.includes('@lid')) {
            // Format as +XXX XXX XXX XXX style
            if (lidNumber.startsWith('94')) {
                formattedNumber = `+${lidNumber.slice(0,2)} ${lidNumber.slice(2,5)} ${lidNumber.slice(5,8)} ${lidNumber.slice(8)}`;
            } else if (lidNumber.length === 10) {
                formattedNumber = `${lidNumber.slice(0,3)} ${lidNumber.slice(3,6)} ${lidNumber.slice(6)}`;
            } else if (lidNumber.length === 12 && lidNumber.startsWith('94')) {
                formattedNumber = `+${lidNumber.slice(0,2)} ${lidNumber.slice(2,5)} ${lidNumber.slice(5,8)} ${lidNumber.slice(8)}`;
            }
        }

        let responseMsg = `*╭───•[ 🆔 USER ID ]•───╮*\n`;
        responseMsg += `│\n`;
        responseMsg += `│ *👤 Name:* ${targetName}\n`;
        responseMsg += `│ *📱 Number:* ${formattedNumber}\n`;
        responseMsg += `│ *🔖 JID Type:* ${jidType}\n`;
        responseMsg += `│\n`;
        responseMsg += `│ *🆔 Full JID:*\n`;
        responseMsg += `│ \`${fullJid}\`\n`;
        responseMsg += `│\n`;
        responseMsg += `│ *🎯 LID/ID Part:*\n`;
        responseMsg += `│ \`${lidNumber || fullJid.split('@')[0]}\`\n`;
        responseMsg += `│\n`;
        responseMsg += `*╰──────────────────╯*\n\n`;
        responseMsg += `*📋 To use in Commands:*\n`;
        responseMsg += `\`"${lidNumber || fullJid.split('@')[0]}"\`\n\n`;
        responseMsg += `> *NEXUS-MD BOT* ✨`;

        // Send the response
        await conn.sendMessage(from, { text: responseMsg }, { quoted: mek });
        
        // React with success
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.error("GetLID Error:", e);
        // Send error message without crashing
        let errorMsg = "*❌ Error occurred:*\n";
        errorMsg += `\`\`\`${e.message}\`\`\`\n\n`;
        errorMsg += "*Possible solutions:*\n";
        errorMsg += "1. Make sure you reply to a user's message\n";
        errorMsg += "2. Tag the user with @number\n";
        errorMsg += "3. Try using `.getlid` without any parameters (gets your ID)";
        
        await reply(errorMsg).catch(console.error);
        
        // Try to react with error emoji
        try {
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        } catch(reactErr) {
            console.log("Could not send error reaction");
        }
    }
});
