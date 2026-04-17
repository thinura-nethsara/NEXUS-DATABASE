const config = require('../config')
const axios = require('axios');
const fs = require('fs')
const file_size_url = (...args) => import('file_size_url')
.then(({ default: file_size_url }) => file_size_url(...args));
const cheerio = require('cheerio'); 
const { phsearch, phdl } = require('darksadas-yt-pornhub-scrape')
const { File } = require('megajs');
const fg = require('api-dylux');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const { igdl } = require('ruhend-scraper')
const { sizeFormatter} = require('human-readable');;
const { exec } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const { ytmp3, tiktok, facebook, instagram, twitter, ytmp4 } = require('sadaslk-dlcore');
const {
    getBuffer,
    getGroupAdmins,
    getRandom,
    getsize,
    h2k,
    isUrl,
    Json,
    runtime,
    sleep,
    fetchJson
} = require('../lib/functions')
const { search, download } = require('../lib/apkdl')

const {
    cmd,
    commands
} = require('../command')
const { getFbVideoInfo } =  require("fb-downloader-scrapper")
const https = require('https');
let wm = config.FOOTER
let newsize = config.MAX_SIZE * 1024 * 1024
var sizetoo =  "_This file size is too big_"
const yts = require("ytsearch-venom")
const g_i_s = require('g-i-s'); 
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
const sharp = require('sharp');

//===================================Sahrp funtion===============================================
async function resizeImage(inputBuffer, width, height) {
    try {
        return await sharp(inputBuffer).resize(width, height).toBuffer();
    } catch (error) {
        console.error('Error resizing image:', error);
        return inputBuffer; 
    }
}

//====================================Google Drive Dl Scrap==========================================






//=============================================== Filwe size checker=========================================

async function checkFileSize(url, maxMB = 150) {
    return new Promise((resolve, reject) => {
        let totalBytes = 0;
        https.get(url, res => {
            res.on('data', chunk => {
                totalBytes += chunk.length;
                const sizeMB = totalBytes / (1024 * 1024);
                if (sizeMB > maxMB) {
                    res.destroy(); // abort download
                    reject(new Error(`File exceeds ${maxMB} MB!`));
                }
            });
            res.on('end', () => resolve(totalBytes));
            res.on('error', err => reject(err));
        }).on('error', err => reject(err));
    });
}

//===============================================================================================

cmd({
    pattern: "gdrive",
    alias: ["gd"],
    react: '📑',
    desc: "Download googledrive files.",
    category: "download",
    use: '.gdrive <googledrive link>',
    filename: __filename
},
async(conn, mek, m, {from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
    try {
        if (!q) return await reply('*Please give me Google Drive URL !!*\n\n*Example:* .gdrive https://drive.google.com/file/d/xxxxx/view');
        
        // Extract File ID from various Google Drive URL formats
        let fileId = extractGoogleDriveFileId(q);
        
        if (!fileId) {
            return await reply('*❌ Invalid Google Drive URL!*\n\nPlease send a valid Google Drive share link.');
        }
        
        // Send initial processing message
        const processingMsg = await reply('*📥 Processing your Google Drive file...*\n\n_Getting file information..._');
        
        // Get file info and download URL
        const fileData = await getGoogleDriveFileInfo(fileId);
        
        if (!fileData) {
            return await conn.sendMessage(from, { 
                text: '*❌ Failed to fetch file information!*\n\nMake sure the file is publicly accessible or the link is correct.',
                edit: processingMsg.key 
            });
        }
        
        // Fix Unicode filename - properly decode and clean
        let cleanFileName = decodeUnicodeFilename(fileData.fileName);
        
        // Edit the processing message to show the downloader message
        await conn.sendMessage(from, { 
            text: `*🗃️ NEXUS GDRIVE DOWNLOADER 🗃️*\n\n` +
                `*📃 File name:* ${cleanFileName}\n` +
                `*⏳ Downloading and sending...*\n\n` +
				`*⭕ Please Wait...*\n\n` +
                `${config.FOOTER || '© Nexus MD Bot'}`,
            edit: processingMsg.key 
        });
        
        // Send the file with properly encoded filename
        await conn.sendMessage(from, { 
            document: { url: fileData.downloadUrl }, 
            fileName: cleanFileName,
            mimetype: fileData.mimetype, 
            caption: '*📁 Google Drive File*\n\n' + cleanFileName + '\n\n> *•ɴᴇxᴜꜱ ᴍᴅ ᴡʜ ʙᴏᴛ•*'
        }, { quoted: mek });
        
    } catch (e) {
        console.error('GDrive Error:', e);
        reply(`*❌ Error downloading file!*\n\n*Error:* ${e.message || 'Unknown error'}`);
    }
});

// Helper function to extract Google Drive File ID
function extractGoogleDriveFileId(url) {
    if (!url || typeof url !== 'string') return null;
    
    url = url.trim();
    
    let match = url.match(/\/d\/([-\w]+)(?:\/|$|\?)/);
    if (match && match[1]) return match[1];
    
    match = url.match(/\/file\/d\/([-\w]+)/);
    if (match && match[1]) return match[1];
    
    match = url.match(/[?&]id=([-\w]+)/);
    if (match && match[1]) return match[1];
    
    match = url.match(/open\?id=([-\w]+)/);
    if (match && match[1]) return match[1];
    
    match = url.match(/uc\?export=download&id=([-\w]+)/);
    if (match && match[1]) return match[1];
    
    match = url.match(/([-\w]{25,})/);
    if (match && match[1] && !match[1].includes('drive') && !match[1].includes('google')) {
        return match[1];
    }
    
    return null;
}

// NEW: Function to properly decode Unicode filenames
function decodeUnicodeFilename(filename) {
    if (!filename) return 'unknown_file';
    
    try {
        // Try to fix common encoding issues
        
        // Method 1: If it contains % encoded characters
        if (filename.includes('%')) {
            try {
                filename = decodeURIComponent(filename);
            } catch(e) {}
        }
        
        // Method 2: Fix for latin1/utf8 double encoding
        try {
            // Check if it looks like garbled UTF-8
            if (/[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/i.test(filename)) {
                // Try to re-encode from latin1 to utf8
                const latin1Buffer = Buffer.from(filename, 'latin1');
                const utf8String = latin1Buffer.toString('utf8');
                if (utf8String && !utf8String.includes('��')) {
                    filename = utf8String;
                }
            }
        } catch(e) {}
        
        // Method 3: Remove any remaining invalid UTF-8 sequences
        filename = filename.replace(/[^\x20-\x7E\u0080-\uFFFF]/g, '');
        
        // Method 4: Ensure it has proper extension if missing
        if (!filename.includes('.') && filename.length > 0) {
            filename += '.file';
        }
        
        // Limit filename length (WhatsApp has limits)
        if (filename.length > 200) {
            const ext = filename.substring(filename.lastIndexOf('.'));
            const name = filename.substring(0, 190);
            filename = name + ext;
        }
        
        return filename || 'unknown_file';
        
    } catch(e) {
        console.error('Error decoding filename:', e);
        return 'google_drive_file.mp4';
    }
}

// Helper function to get Google Drive file info
async function getGoogleDriveFileInfo(fileId) {
    try {
        const metadataUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        try {
            // Try GET request to get full HTML response with filename
            const response = await fetch(metadataUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            let fileName = `google_drive_file_${fileId}`;
            let fileSize = "Unknown";
            let contentType = "application/octet-stream";
            let downloadUrl = metadataUrl;
            
            const html = await response.text();
            
            // Try multiple methods to extract filename
            
            // Method 1: Look for filename in HTML meta tags
            const metaMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
            if (metaMatch && metaMatch[1]) {
                fileName = metaMatch[1];
            }
            
            // Method 2: Look for filename in JavaScript variables
            const jsMatch = html.match(/var\s+filename\s*=\s*"([^"]+)"/i);
            if (jsMatch && jsMatch[1]) {
                fileName = jsMatch[1];
            }
            
            // Method 3: Look for view file name
            const viewMatch = html.match(/<div\s+class="TWG4Gb"[^>]*>([^<]+)<\/div>/i);
            if (viewMatch && viewMatch[1]) {
                fileName = viewMatch[1].trim();
            }
            
            // Method 4: Look in title tag
            const titleMatch = html.match(/<title>(.*?)<\/title>/);
            if (titleMatch && titleMatch[1] && !titleMatch[1].includes('Google Drive')) {
                fileName = titleMatch[1].replace(' - Google Drive', '').trim();
            }
            
            // Method 5: Try to get from Content-Disposition in case of direct download
            const contentDisposition = response.headers.get('content-disposition');
            if (contentDisposition && !fileName || fileName.includes('google_drive')) {
                const cdMatch = contentDisposition.match(/filename\*?=([^;]+)/i);
                if (cdMatch) {
                    let cdFilename = cdMatch[1].trim().replace(/['"]/g, '');
                    if (cdFilename.startsWith('UTF-8')) {
                        cdFilename = decodeURIComponent(cdFilename.split("''")[1] || cdFilename);
                    }
                    if (cdFilename && cdFilename !== '') {
                        fileName = cdFilename;
                    }
                }
            }
            
            // Get file size from HTML
            const sizeMatch = html.match(/(\d+(?:\.\d+)?)\s*(KB|MB|GB)/i);
            if (sizeMatch) {
                fileSize = sizeMatch[0];
            }
            
            // Get file size from meta if available
            const sizeMetaMatch = html.match(/<meta\s+property="og:image:height"[^>]*>/i);
            if (sizeMetaMatch && html.match(/<meta\s+property="og:image:width"[^>]*>/i)) {
                // This is for images
            }
            
            // Get content type
            const mimeMatch = html.match(/<meta\s+property="og:video:type"\s+content="([^"]+)"/i);
            if (mimeMatch && mimeMatch[1]) {
                contentType = mimeMatch[1];
            } else {
                const ogType = html.match(/<meta\s+property="og:type"\s+content="([^"]+)"/i);
                if (ogType) {
                    if (ogType[1] === 'video') contentType = 'video/mp4';
                    if (ogType[1] === 'audio') contentType = 'audio/mpeg';
                    if (ogType[1] === 'image') contentType = 'image/jpeg';
                }
            }
            
            // Check for confirmation token (large files)
            const confirmMatch = html.match(/confirm=([^;&"]+)/);
            if (confirmMatch && confirmMatch[1]) {
                const confirmToken = confirmMatch[1];
                downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=${confirmToken}`;
            }
            
            // Clean filename - ensure proper encoding
            fileName = cleanGoogleDriveFilename(fileName, fileId);
            
            return { fileName, fileSize, mimetype: contentType, downloadUrl };
            
        } catch (fetchError) {
            clearTimeout(timeoutId);
            throw fetchError;
        }
        
    } catch (error) {
        console.error('Error getting Google Drive file info:', error);
        
        // Fallback
        return {
            fileName: `google_drive_file_${fileId}.mp4`,
            fileSize: "Unknown",
            mimetype: "video/mp4",
            downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`
        };
    }
}

// NEW: Clean Google Drive filename properly
function cleanGoogleDriveFilename(filename, fallbackId) {
    if (!filename || filename.includes('google_drive')) {
        return `google_drive_file_${fallbackId}.mp4`;
    }
    
    try {
        // Remove any HTML entities
        filename = filename.replace(/&nbsp;/g, ' ')
                         .replace(/&amp;/g, '&')
                         .replace(/&lt;/g, '<')
                         .replace(/&gt;/g, '>')
                         .replace(/&quot;/g, '"')
                         .replace(/&#39;/g, "'");
        
        // Remove any path characters
        filename = filename.replace(/[\\/:*?"<>|]/g, '');
        
        // Ensure proper UTF-8 encoding
        try {
            // Try to fix if it's already a Buffer
            if (Buffer.isBuffer(filename)) {
                filename = filename.toString('utf8');
            }
            
            // Ensure valid UTF-8
            const utf8Buffer = Buffer.from(filename, 'utf8');
            filename = utf8Buffer.toString('utf8');
            
        } catch(e) {}
        
        // Add extension if missing
        const hasExtension = /\.(mp4|mkv|avi|mov|wmv|flv|webm|mp3|wav|ogg|m4a|jpg|jpeg|png|gif|bmp|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar|7z)$/i.test(filename);
        
        if (!hasExtension && filename.length > 0) {
            filename += '.mp4'; // Default extension
        }
        
        // Limit length
        if (filename.length > 200) {
            const ext = filename.substring(filename.lastIndexOf('.'));
            const name = filename.substring(0, 190);
            filename = name + ext;
        }
        
        return filename || `google_drive_file_${fallbackId}.mp4`;
        
    } catch(e) {
        return `google_drive_file_${fallbackId}.mp4`;
    }
}

// Helper function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}


cmd({
    pattern: "mega",
    react: "🍟",
    alias: ["megadl", "meganz"],
    desc: "Download files from Mega.nz",
    category: "download",
    use: ".mega <mega.nz URL>",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("⚠️ Please provide a Mega.nz URL!");

        const apiUrl = `https://sadaslk-fast-mega-dl.vercel.app/mega?q=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data.status) {
            return await reply(`❌ *API Error:* ${data.error}`);
        }

        const fileData = data.result;
        const fileSizeMB = (fileData.size / (1024 * 1024)).toFixed(2);

        await reply(
            `⏳ *Downloading from Mega.nz...*\n\n` +
            `📄 *File:* ${fileData.name}\n` +
            `📁 *Size:* ${fileSizeMB} MB`
        );

        // Mimetype detect
        const ext = fileData.name.split('.').pop().toLowerCase();
        const mimeTypes = {
            mp4: "video/mp4",
            pdf: "application/pdf",
            zip: "application/zip",
            rar: "application/x-rar-compressed",
            "7z": "application/x-7z-compressed",
            jpg: "image/jpeg",
            png: "image/png",
            mp3: "audio/mpeg"
        };

        const mimetype = mimeTypes[ext] || "application/octet-stream";
        const dllink = fileData.download;

        await conn.sendMessage(
            from,
            {
                document: { url: dllink },
                mimetype: mimetype,
                fileName: `${fileData.name}`,
                caption:
                    `*Name:* ${fileData.name}\n` +
                    `*Type:* ${mimetype}\n` +
                    `*Size:* ${fileSizeMB} MB\n\n` +
                    `${config.FOOTER}`
            },
            { quoted: mek }
        );

        await conn.sendMessage(from, {
            react: { text: "✔️", key: mek.key }
        });

    } catch (e) {
        console.error(e);
        await reply(`❌ *Error occurred:* ${e.response?.data?.error || e.message}`);
    }
});




function ytreg(url) {
    const ytIdRegex = /(?:http(?:s|):\/\/|)(?:(?:www\.|)youtube(?:\-nocookie|)\.com\/(?:watch\?.*(?:|\&)v=|embed|shorts\/|v\/)|youtu\.be\/)([-_0-9A-Za-z]{11})/
    return ytIdRegex.test(url);
}
cmd({
    pattern: "yts",
    alias: ["ytsearch"],
    use: ".yts <song name or URL>",
    react: "🔎",
    desc: "Search songs on YouTube",
    category: "search",
    filename: __filename
},
async (conn, mek, m, { from, q, reply, isCmd, command, l }) => {
    try {
        if (!q) {
            return await reply("*⚠️ Please provide a search term or URL!*");
        }

        // Check if input is a URL but not a valid YouTube URL
        if (isUrl(q) && !ytreg(q)) {
            return await reply("*⚠️ Invalid YouTube URL!*");
        }

        // Import ytsearch-venom dynamically
        let yts;
        try {
            yts = require("ytsearch-venom");
        } catch (err) {
            l(err);
            return await reply("*❌ ytsearch-venom module is missing!*");
        }

        // Perform search
        let arama;
        try {
            arama = await yts(q);
        } catch (err) {
            l(err);
            return await reply("*❌ Error while searching YouTube!*");
        }

        // Format search results
        if (!arama.all || arama.all.length === 0) {
            return await reply("*⚠️ No results found!*");
        }

        let mesaj = '';
        arama.all.map((video, index) => {
            mesaj += `*${index + 1}. ${video.title}*\n🔗 ${video.url}\n\n`;
        });

        await conn.sendMessage(from, { text: mesaj }, { quoted: mek });

    } catch (err) {
        l(err);
        await reply("*❌ Unexpected error occurred!*");
    }
});

// api-dark-shan-yt.koyeb.app API එක සඳහා මූලික URL එක
const SHAN_API_BASE = "https://api-dark-shan-yt.koyeb.app/download/ytmp3";
const SHAN_API_KEY = "82406ca340409d44";

// උපකාරක ශ්රිතය: නව API එකෙන් දත්ත ලබා ගැනීමට
async function getShanDownload(youtubeUrl) {
    const apiUrl = `${SHAN_API_BASE}?url=${encodeURIComponent(youtubeUrl)}&apikey=${SHAN_API_KEY}`;
    const response = await fetchJson(apiUrl);
    
    // API එකෙන් එන Response structure එක පරීක්ෂා කිරීම
    if (!response || !response.status || !response.data || !response.data.download) {
        throw new Error('Invalid API response structure');
    }
    return response.data; // { title, duration, quality, thumbnail, download }
}

cmd({
    pattern: "song",
    alias: ["ytsong"],
    use: '.song <query or url>',
    react: "🎧",
    desc: "Download high-quality songs from YouTube",
    category: "Download",
    filename: __filename
},

async(conn, mek, m, {
  from, prefix, q, reply
}) => {
  try {
    if (!q) return await reply('🔎 *Please provide a song name or YouTube link!*');

    const url = q.replace(/\?si=[^&]*/, '');
    const results = await yts(url);
    const result = results.videos[0];
    const wm = config.FOOTER;

 
  let caption = `*🎶NEXUS MD SONG DOWNLODER🎶*

*☘️ Title :* *${result.title}*
*👁️ Views :* *${result.views}*
*⏰ Duration :* *${result.duration}*
*💃 Url :* *${result.url}*`;
	  

    const buttons = [
      {
        buttonId: `${prefix}ytaa ${result.url}`,
        buttonText: { displayText: 'Audio Format 🎶' },
        type: 1
      },
      {
        buttonId: `${prefix}ytad ${result.url}&${result.thumbnail}&${result.title}`,
        buttonText: { displayText: 'Document Format 📂' },
        type: 1
      },
		 {
        buttonId: `${prefix}ytaap ${result.url}`,
        buttonText: { displayText: 'Voice Format 🎤' },
        type: 1
      }
    ];

    const buttonMessage = {
      image: { url: result.thumbnail },
      caption: caption,
      footer: wm,
      buttons: buttons,
      headerType: 4
    };


   await conn.buttonMessage(from, buttonMessage, mek);

 } catch (e) {
    console.error(e);
    reply('❌ *Song not found or an error occurred.*');
  }
});




cmd({
    pattern: "ytaa",
    react: "⬇️",
    dontAddCommandList: true,
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    if (!q) return await reply('*Need a YouTube URL!*');

    try {
        const prog = await fetchJson(`https://sulamd-ytmp3.vercel.app/download?q=${q}&format=mp3&apikey=SULA0310`)
        if (!prog || !prog.result.download) return await reply('*Conversion failed, try again!*');

        try {
            const bytes = await checkFileSize(prog.result.download, config.MAX_SIZE);
            const sizeInMB = (bytes / (1024 * 1024)).toFixed(2);

            // This check is redundant now, but left for safety
            if (sizeInMB > config.MAX_SIZE) {
                return reply(`*⚠️ File too large!*\n\n*📌 Maximum allowed: \`${config.MAX_SIZE}\` MB*`);
            }

        } catch (err) {
            return reply(`*⚠️ File too large or cannot determine size!*\n\n*📌 Maximum allowed: \`${config.MAX_SIZE}\` MB*`);
        }

        await conn.sendMessage(from, { react: { text: '⬆️', key: mek.key } });

        await conn.sendMessage(
            from,
            { audio: { url: prog.result.download }, mimetype: 'audio/mpeg' },
            { quoted: mek }
        );

        await conn.sendMessage(from, { react: { text: '✔️', key: mek.key } });

    } catch (e) {
        reply(N_FOUND);
        console.log(e);
    }
});



cmd({
  pattern: "ytaap",
  react: "⬇️",
  dontAddCommandList: true,
  filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
  if (!q) return await reply('*Need a youtube url!*');

  try {
    const prog = await fetchJson(`https://sulamd-ytmp3.vercel.app/download?q=${encodeURIComponent(q)}&format=mp3&apikey=SULA0310`);
    if (!prog?.result?.download) throw new Error('No download URL');

    await conn.sendMessage(from, { react: { text: '⬆️', key: mek.key } });

    // තාවකාලික file names
    const inputPath = `./temp_${Date.now()}.mp3`;
    const outputPath = `./temp_${Date.now()}.opus`;

    // 1. MP3 එක download කරලා save කරනවා
    const res = await fetch(prog.result.download);
    const arrayBuffer = await res.arrayBuffer();
    fs.writeFileSync(inputPath, Buffer.from(arrayBuffer));

    // 2. ffmpeg-static පාවිච්චි කරලා convert කරනවා
    // ffmpegPath එක පාවිච්චි කරන්නේ අන්න ඒ නිසයි
    exec(`${ffmpegPath} -i ${inputPath} -c:a libopus -b:a 64k -vbr on -f ogg ${outputPath}`, async (error) => {
      if (error) {
        console.error(error);
        return await reply('❌ Conversion error!');
      }

      const buffer = fs.readFileSync(outputPath);

      // 3. Audio එක voice message එකක් විදිහට යවනවා
      await conn.sendMessage(
        from,
        {
          audio: buffer,
          mimetype: 'audio/ogg; codecs=opus',
          ptt: true
        },
        { quoted: mek }
      );

      // වැඩේ ඉවර වුණාම file අයින් කරනවා
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

      await conn.sendMessage(from, { react: { text: '✔️', key: mek.key } });
    });

  } catch (e) {
    await reply('❌ Failed: ' + (e.message || e));
    console.log(e);
  }
});

cmd({
    pattern: "ytad",
    react: "⬇️",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply('*Need a YouTube URL!*');

        const datae = q.split("&")[0];
        const datas = q.split("&")[1];
        const title = q.split("&")[2];

        // --- Thumbnail fetch ---
        const botimgResponse = await fetch(datas);
        const botimgBuffer = await botimgResponse.buffer();

        
        // Resize image to 200x200 before sending
        const resizedBotImg = await resizeImage(botimgBuffer, 200, 200);
        // --- Get audio download link ---
        const prog = await fetchJson(`https://sulamd-ytmp3.vercel.app/download?q=${datae}&format=mp3&apikey=SULA0310`);
       

        // --- Send audio file ---
        await conn.sendMessage(from, { react: { text: '⬆️', key: mek.key } });

        await conn.sendMessage(
            from,
            {
                document: { url: prog.result.download },
                jpegThumbnail: resizedBotImg,
                mimetype: 'audio/mpeg',
                caption: `*${title}*\n\n${config.FOOTER}`,
                fileName: `${title}.mp3`
            },
            { quoted: mek }
        );

        await conn.sendMessage(from, { react: { text: '✔️', key: mek.key } });

    } catch (e) {
        console.log(e);
        await reply('*❌ Error occurred while processing your request.*');
    }
});


  cmd({
    pattern: "directmp3",
    react: "⬇️",
    dontAddCommandList: true,
    filename: __filename
},
    async (conn, mek, m, { from, q, reply }) => {
try {
           if (!q) return await reply('*Need a youtube url!*')
	
 

	await conn.sendMessage(from, { react: { text: '⬆️', key: mek.key } });
	const up_mg =  await conn.sendMessage(from, { text : `*Uploading request ..⬆️*` }, {quoted: mek} )
           
	await conn.sendMessage(from, { audio:{ url: q }, caption: config.FOOTER , mimetype: 'audio/mpeg' , caption: wm, fileName: `test.mp3` });
        await conn.sendMessage(from, { delete: up_mg.key })
	await conn.sendMessage(from, { react: { text: '✔️', key: mek.key } });
} catch (e) {
	       console.log(e)
        }
    });

cmd({
    pattern: "tiktok",    
  alias: ["tt","ttdl","tiktokdl"],
    react: '🎩',
    desc: "Download tiktok videos",
    category: "download",
    use: '.tiktok < tiktok url >',
    filename: __filename
},
async(conn, mek, m,{from, l, prefix, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
  
  
  if (!q) return await reply('TEXT') 
      if (!q.includes('tiktok')) return await reply('valid_url') 


const mov = await fetchJson(`https://darksadasyt-tiktokdl.vercel.app/api/tiktok?q=${q}`)

let caption = `*🪺 NEXUS TIK TOK DOWNLODER 🪺*

*┌──────────────────*
*├ 🎩 Title :* ${mov.title}
*├ 🎃 Region :* ${mov.regions}
*├ ⏰ Duration :* ${mov.runtime}
*├ 🔗 Url :* ${q}
*└──────────────────*
${config.FOOTER}
`



const buttons = [
  {buttonId: prefix + 'ttdl1 ' + mov.no_watermark, buttonText: {displayText: '*Video No Watermark 📼*'}, type: 1},
  {buttonId: prefix + 'ttdl2 ' + mov.watermark, buttonText: {displayText: '*Video Watermark 📼*'}, type: 1},
  {buttonId: prefix + 'ttdl3 ' + mov.music, buttonText: {displayText: '*Audio 🎶*'}, type: 1}
 
]
const buttonMessage = {
    image: {url: mov.thumbnail},
    caption: caption,
    footer: config.FOOTER,
    buttons: buttons,
    headerType: 4
}

const listButtons = {
  title: "❯❯ Choose a video Format ❮❮",
  sections: [
    {
      title: "Tiktok Video Type 📽️",
      rows: [
        { title: "Video No Watermark", "description":"No Watermark", id: prefix + 'ttdl1 ' + mov.no_watermark },
        { title: "Video Watermark",  "description":"With Watermark",id: prefix + 'ttdl2 ' + mov.watermark},
        { title: "Audio", "description":"Only Mp3", id: prefix + 'ttdl3 ' + mov.music }
      ]
    }
  ]
};

    // Sending logic based on config.BUTTON
    if (config.BUTTON === "true") {
      return await conn.sendMessage(from, {
        image: {url: mov.thumbnail },
        caption,
        footer: config.FOOTER,
        buttons: [
          {
            buttonId: "Video quality list",
            buttonText: { displayText: "🎥 Select Option" },
            type: 4,
            nativeFlowInfo: {
              name: "single_select",
              paramsJson: JSON.stringify(listButtons)
            }
          }
        ],
        headerType: 1,
        viewOnce: true
      }, { quoted: mek });

} else if (config.BUTTON === 'false') {
  
await conn.buttonMessage(from, buttonMessage, mek)

}

} catch (e) {
  reply(`Error !!\n\n*${e}*`)
  console.log(e)
}
})


cmd({
    pattern: "ttdl1",
    react: '⬇️',
    dontAddCommandList: true,
    filename: __filename
},
  
async(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{

await conn.sendMessage(from, { react: { text: '⬆️', key: mek.key } });	
conn.sendMessage(from, { video: { url: q }, mimetype: "video/mp4", caption: `${config.FOOTER}` }, { quoted: mek })
  await conn.sendMessage(from, { react: { text: `✔️`, key: mek.key } })
} catch (e) {
console.log(e)
reply(`Error !!\n\n*${e}*`)
}
})

cmd({
    pattern: "ttdl2",
    react: '⬇️',
    dontAddCommandList: true,
    filename: __filename
},
  
async(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{

await conn.sendMessage(from, { react: { text: '⬆️', key: mek.key } });	
conn.sendMessage(from, { video: { url: q }, mimetype: "video/mp4", caption: `${config.FOOTER}` }, { quoted: mek })
  await conn.sendMessage(from, { react: { text: `✔️`, key: mek.key } })
} catch (e) {
console.log(e)
reply(`Error !!\n\n*${e}*`)
}
})

cmd({
    pattern: "ttdl3",
    react: '⬇️',
    dontAddCommandList: true,
    filename: __filename
},
  
async(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{

	await conn.sendMessage(from, { react: { text: '⬆️', key: mek.key } });
conn.sendMessage(from, { audio: { url: q }, mimetype: "audio/mpeg", caption: `${config.FOOTER}` }, { quoted: mek })
  await conn.sendMessage(from, { react: { text: `✔️`, key: mek.key } })
} catch (e) {
console.log(e)
reply(`Error !!\n\n*${e}*`)
}
})


cmd({
    pattern: "ttdl4",
    react: '⬇️',
    dontAddCommandList: true,
    filename: __filename
},
  
async(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
await conn.sendMessage(from, { react: { text: '⬆️', key: mek.key } });
conn.sendMessage(from, { audio: { url: q }, mimetype: "audio/mpeg", caption: `${config.FOOTER}` }, { quoted: mek })
  await conn.sendMessage(from, { react: { text: `✔️`, key: mek.key } })
} catch (e) {
console.log(e)
reply(`Error !!\n\n*${e}*`)
}
})




cmd({
    pattern: "fb",
    alias: ["facebook"],
    use: '.fb <facebook url>',
    react: "🏮",
    desc: 'Download videos from Facebook',
    category: "download",
    filename: __filename
}, async (conn, m, mek, { from, prefix, q, reply }) => {
    try {
        if (!q || !q.includes('facebook.com')) {
            return await reply('*❌ Please enter a valid Facebook URL!*');
        }

        const apiKey = '82406ca340409d44';
        const apiURL = `https://api-dark-shan-yt.koyeb.app/download/facebook?apikey=${apiKey}&url=${encodeURIComponent(q)}`;
        console.log('🌐 FB API URL:', apiURL);

        let response;
        try {
            const res = await axios.get(apiURL, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Accept": "application/json"
                }
            });
            response = res.data;
            console.log('📦 API Response:', JSON.stringify(response, null, 2));
        } catch (err) {
            console.error("❌ API Error:", err.response?.data || err.message);
            return reply('*⚠️ Failed to fetch data from Facebook API. Check console.*');
        }

        // ✅ නිවැරදි data path එක: response.data.data (API structure එකට අනුව)
        const videoData = response?.data?.data;
        
        if (!videoData || !videoData.video) {
            console.log('❌ Video data not found in:', response);
            return reply('*❌ No downloadable data found. Try another video.*');
        }

        const hdUrl = videoData.video.hd;
        const sdUrl = videoData.video.sd;
        let thumb = videoData.thumbnail;

        if (!thumb || !thumb.startsWith('http')) {
            thumb = 'https://i.imgur.com/qNQv8Ru.jpeg';
        } else {
            thumb = `https://images.weserv.nl/?url=${encodeURIComponent(thumb.replace(/^https?:\/\//, ''))}`;
        }

        const duration = videoData.duration || 'Unknown';
        const title = videoData.title || 'Facebook video';
        const views = videoData.engagement?.views || 'N/A';
        const uploader = videoData.uploader?.name || 'Unknown';

        const caption = `*🏮 NEXUS FB DOWNLOADER 🏮*
┌──────────────────*
├ 🐼 Title: ${title}
├ 👤 Uploader: ${uploader}
├ 👁️ Views: ${views}
├ ⏱️ Duration: ${duration}
├ 🔗 Url: ${q}
└──────────────────*`;

        const buttons = [];

        if (hdUrl) {
            buttons.push({
                buttonId: prefix + 'downfb ' + hdUrl,
                buttonText: { displayText: '*HD Quality*' },
                type: 1
            });
        }

        if (sdUrl) {
            buttons.push({
                buttonId: prefix + 'downfb ' + sdUrl,
                buttonText: { displayText: '*SD Quality*' },
                type: 1
            });
        }

        if (buttons.length === 0) {
            return reply('*❌ No video formats found.*');
        }

        const buttonMessage = {
            image: { url: thumb },
            caption: caption,
            footer: config.FOOTER,
            buttons: buttons,
            headerType: 4
        };

        await conn.buttonMessage(from, buttonMessage, mek);

    } catch (e) {
        console.error('❌ Unexpected Error:', e);
        return reply('*⚠️ An unexpected error occurred. Try again later.*');
    }
});

// downfb command (එලෙසම)
cmd({
  pattern: "downfb",
  react: "🎥",
  dontAddCommandList: true,
  filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q || !q.includes('fbcdn')) return await reply('*❌ Invalid Facebook CDN video URL!*');

    reply('⏳ *Downloading Facebook video...*');

    const response = await axios.get(q, {
      responseType: 'arraybuffer',
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "*/*",
        "Accept-Encoding": "identity",
        "Referer": "https://fdown.net/",
        "Origin": "https://fdown.net"
      }
    });

    const videoBuffer = Buffer.from(response.data, 'binary');

    await conn.sendMessage(from, {
      video: videoBuffer,
      mimetype: 'video/mp4',
      caption: '✅ *Facebook video downloaded successfully!*'
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: '✔️', key: mek.key } });

  } catch (error) {
    console.log("❌ Facebook video download error:", error);
    reply('*❌ Failed to download. The video might be geo-blocked or expired.*');
  }
});




cmd({
    pattern: "imgdlm",
    //alias: ["googleimg"],
    react: "🌅",
    //desc: "Search for images on Google",
    //category: "search",
    use: '.imgsearch <query>',
    filename: __filename
},
async(conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return await reply("Please provide a search query!");

        g_i_s(q, (error, result) => {
            if (error || !result.length) return reply("No images found!");

            // Send the first 5 images
            const imageUrls = result.slice(0, 5).map(img => img.url);
            imageUrls.forEach(async (url) => {
               await conn.sendMessage(from, 
    { 
        image: { url }, 
        caption: config.FOOTER 
    }, 
    { quoted: mek }
);

            });
        });

    } catch (error) {
        console.error(error);
        reply('An error occurred while processing your request. Please try again later.');
    }
});

cmd({
    pattern: "imgdld",
    //alias: ["googleimg"],
    react: "🌅",
    //desc: "Search for images on Google",
    //category: "search",
    use: '.imgsearch <query>',
    filename: __filename
},
async(conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return await reply("Please provide a search query!");

        g_i_s(q, (error, result) => {
            if (error || !result.length) return reply("No images found!");

            // Send the first 5 images
            const imageUrls = result.slice(0, 5).map(img => img.url);
            imageUrls.forEach(async (url) => {
                await conn.sendMessage(from, { 
            document: { url: url },
            caption: config.FOOTER,
            mimetype: "image/jpeg",
            
            fileName: `${q}.jpeg`
        });


            });
        });

    } catch (error) {
        console.error(error);
        reply('An error occurred while processing your request. Please try again later.');
    }
});


cmd({
    pattern: "ig",
    desc: "To download Instagram videos/reels.",
    react: "🎀",
    use: '.ig < Link >',
    category: "download",
    filename: __filename
},

async(conn, mek, m, {from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {

try {
    if (!q) return m.reply(`Please provide a valid Instagram link...`);
    
    // Initial reaction
    m.react('⬇️');

    // Fetching from the API
    let res = await fetchJson(`https://api-dark-shan-yt.koyeb.app/download/instagram?q=${encodeURIComponent(q)}&apikey=82406ca340409d44`);

    // Check if API response is valid
    if (!res.status || !res.data || !res.data.download) {
        return m.reply("Error: Could not fetch the video. Please check the link or API status.");
    }

    // Get the correct download URL from API response
    let downloadUrl = res.data.download;
    let caption = res.data.caption || "Instagram Video";
    let username = res.data.owner?.username || "Unknown";
    let likes = res.data.likes || 0;
    let duration = res.data.duration || 0;

    m.react('⬆️');

    // Send the video with metadata
    await conn.sendMessage(from, { 
        video: { url: downloadUrl }, 
        mimetype: "video/mp4", 
        caption: `*📸 NEXUS INSTAGRAM DOWNLOADER*\n\n` +
                 `👤 *User:* @${username}\n` +
                 `❤️ *Likes:* ${likes}\n` +
                 `⏱️ *Duration:* ${duration} seconds\n` +
                 `📝 *Caption:* ${caption.substring(0, 100)}${caption.length > 100 ? '...' : ''}\n\n` +
                 `> 🚀 *NEXUS MD*`
    }, { quoted: mek });

    m.react('✔️');

} catch (e) {
    console.error('Instagram Download Error:', e);
    m.reply("❌ An error occurred while processing your request.\n\n" + e.message);
}
})

cmd({

    pattern: "twitter",
    alias: ["tw"],
    desc: "To get the instragram.",
    react: "❄️",
    use: '.twitter < Link >',
    category: "download",
    filename: __filename

},

async(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {

try{
    
if (!q) return m.reply(`Please Give Me a vaild Link...`);
m.react('⬇️')

         let res = await fetchJson(`https://darksadasyt-twiterdl.vercel.app/api/download?url=${q}`);
        
     
             m.react('⬆️')
            await conn.sendMessage(from,{video: {url: res.videos[0].url },mimetype:"video/mp4",caption: config.FOOTER},{quoted:mek})
             m.react('✔️')
       

}catch(e){
console.log(e)
}
})





















cmd({
    pattern: "apk",
    react: "🗃️",
    alias: ["findapk","playstore"],
    category: "download",
    use: '.apk whatsapp',
    filename: __filename
},
async(conn, mek, m,{from, q, reply}) => {
  try {
    await conn.sendMessage(from, { react: { text: '⬇️', key: mek.key }})

    if(!q) return reply('*🗃️ Enter apk name...*') 

    const data = await download(q)
    if (!data || !data.dllink) return reply("❌ APK not found!")

    let listdata = `*🗃️ NEXUS APK DOWNLOADER 🗃️*

*┌──────────────────╮*
*├ 📚 Name :* ${data.name}
*├ 📦 Package :* ${data.package}
*├ ⬆️ Last update :* ${data.lastup}
*├ 📥 Size :* ${data.size}
*└──────────────────╯*

${config.FOOTER}`

    // send info + footer
    await conn.sendMessage(from, { image: { url: data.icon }, caption: listdata }, { quoted: mek })

    // send apk file
    let sendapk = await conn.sendMessage(from , { 
        document : { url : data.dllink }, 
        mimetype : 'application/vnd.android.package-archive', 
        fileName : data.name + '.apk',
        caption: config.FOOTER
    }, { quoted: mek })

    // reactions
    await conn.sendMessage(from, { react: { text: '📁', key: sendapk.key }})
    await conn.sendMessage(from, { react: { text: '✔', key: mek.key }})
    
  } catch (e) {
    console.log("APK CMD ERROR:", e)
    reply('❌ ERROR while downloading APK!')
  }
})


cmd({
    pattern: "video",
    alias: ["ytvideo", "vd"],
    use: '.video <YouTube URL or search term>',
    react: "📽️",
    desc: "Download YouTube videos",
    category: "download",
    filename: __filename
},
async(conn, mek, m, {from, prefix, q, reply}) => {
    try {            
        if (!q) return await reply('*📌 Please enter a YouTube URL or search term!*\n\n*Example:* .video Despacito\n*Example:* .video https://youtu.be/xxxxx');
        
        await conn.sendMessage(from, { react: { text: '🔍', key: mek.key } });
        
        const url = q.replace(/\?si=[^&]*/, '');
        const results = await yts(url);
        
        if (!results || !results.videos || results.videos.length === 0) {
            return await reply('*❌ No results found! Try a different search term.*');
        }
        
        const result = results.videos[0];
        
        const caption = `*🎥 NEXUS VIDEO DOWNLOADER 🎥*
*┌─────────────────────┐*
*├ 📹 Title : ${result.title}* 
*├ 👁️ Views : ${result.views}*
*├ ⏰ Duration : ${result.duration}*
*├ 🔗 URL : ${result.url}*
*└─────────────────────┘*

*Select download type:*`;

        // NEW BUTTON SYSTEM (changed from sections to buttons)
        const buttons = [
            {
                buttonId: `${prefix}vd_work ${result.url}&${result.thumbnail}&${encodeURIComponent(result.title)}`,
                buttonText: { displayText: '📹 Video (MP4)' },
                type: 1
            },
            {
                buttonId: `${prefix}doc_work ${result.url}&${result.thumbnail}&${encodeURIComponent(result.title)}`,
                buttonText: { displayText: '📁 Document (File)' },
                type: 1
            },
            {
                buttonId: `${prefix}vn_work ${result.url}&${result.thumbnail}&${encodeURIComponent(result.title)}`,
                buttonText: { displayText: '🎥 Video Note' },
                type: 1
            }
        ];

        const buttonMessage = {
            image: { url: result.thumbnail },
            caption: caption,
            footer: config.FOOTER || '© Nexus MD Bot',
            buttons: buttons,
            headerType: 4
        };

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
        await conn.buttonMessage(from, buttonMessage, mek);

    } catch (e) {
        console.error('Video command error:', e);
        reply('*❌ Error occurred!*\n\nMake sure you entered a valid YouTube URL or search term.');
    }
});

// ============= VIDEO TYPE =============
cmd({
    pattern: "vd_work",
    react: "⬇️",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply('*❌ Need a YouTube URL!*');

        const parts = q.split("&");
        const videoUrl = parts[0];
        const thumbUrl = parts[1];
        const title = decodeURIComponent(parts[2] || 'Video');

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const apiKey = '82406ca340409d44';
        const apiUrl = `https://api-dark-shan-yt.koyeb.app/download/ytdl?url=${encodeURIComponent(videoUrl)}&format=720&apikey=${apiKey}`;
        
        const res = await fetchJson(apiUrl);
        
        let downloadUrl = null;
        let videoTitle = title;
        
        if (res && res.status && res.data) {
            downloadUrl = res.data.download;
            videoTitle = res.data.title || title;
        }
        
        if (!downloadUrl) {
            return await reply('*❌ Could not get download URL! Please try again.*');
        }

        let thumbnailBuffer = null;
        try {
            const thumbRes = await fetch(thumbUrl);
            const thumbArrayBuffer = await thumbRes.arrayBuffer();
            thumbnailBuffer = Buffer.from(thumbArrayBuffer);
        } catch(e) {}

        await conn.sendMessage(from, { react: { text: '⬆️', key: mek.key } });

        await conn.sendMessage(from, {
            video: { url: downloadUrl },
            caption: `🎬 *${videoTitle}*\n📺 Quality: 720p HD\n\n${config.FOOTER || ''}`,
            thumbnail: thumbnailBuffer
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✔️', key: mek.key } });

    } catch (e) {
        console.error('Video download error:', e);
        await reply('*❌ Error downloading video! Please try again later.*');
    }
});

// ============= DOCUMENT TYPE =============
cmd({
    pattern: "doc_work",
    react: "⬇️",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply('*❌ Need a YouTube URL!*');

        const parts = q.split("&");
        const videoUrl = parts[0];
        const thumbUrl = parts[1];
        const title = decodeURIComponent(parts[2] || 'Video');

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const apiKey = '82406ca340409d44';
        const apiUrl = `https://api-dark-shan-yt.koyeb.app/download/ytdl?url=${encodeURIComponent(videoUrl)}&format=720&apikey=${apiKey}`;
        
        const res = await fetchJson(apiUrl);
        
        let downloadUrl = null;
        let videoTitle = title;
        
        if (res && res.status && res.data) {
            downloadUrl = res.data.download;
            videoTitle = res.data.title || title;
        }
        
        if (!downloadUrl) {
            return await reply('*❌ Could not get download URL! Please try again.*');
        }

        let resizedBotImg = null;
        try {
            const botimgResponse = await fetch(thumbUrl);
            const botimgArrayBuffer = await botimgResponse.arrayBuffer();
            const botimgBuffer = Buffer.from(botimgArrayBuffer);
            resizedBotImg = await resizeImage(botimgBuffer, 200, 200);
        } catch(e) {}

        await conn.sendMessage(from, { react: { text: '⬆️', key: mek.key } });

        await conn.sendMessage(from, {
            document: { url: downloadUrl },
            jpegThumbnail: resizedBotImg,
            caption: `📄 *${videoTitle}*\n📺 Quality: 720p HD\n📁 Type: Document\n\n${config.FOOTER || ''}`,
            mimetype: 'video/mp4',
            fileName: `${videoTitle.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 100)}.mp4`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✔️', key: mek.key } });

    } catch (e) {
        console.error(e);
        await reply('*❌ Error downloading document! Please try again.*');
    }
});

// ============= VIDEO NOTE TYPE =============
cmd({
    pattern: "vn_work",
    react: "⬇️",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply('*❌ Need a YouTube URL!*');

        const parts = q.split("&");
        const videoUrl = parts[0];
        const title = decodeURIComponent(parts[2] || 'Video');

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const apiKey = '82406ca340409d44';
        const apiUrl = `https://api-dark-shan-yt.koyeb.app/download/ytdl?url=${encodeURIComponent(videoUrl)}&format=720&apikey=${apiKey}`;
        
        const res = await fetchJson(apiUrl);
        
        let downloadUrl = null;
        let videoTitle = title;
        
        if (res && res.status && res.data) {
            downloadUrl = res.data.download;
            videoTitle = res.data.title || title;
        }
        
        if (!downloadUrl) {
            return await reply('*❌ Could not get download URL! Please try again.*');
        }

        const videoResponse = await fetch(downloadUrl);
        const videoArrayBuffer = await videoResponse.arrayBuffer();
        const videoBuffer = Buffer.from(videoArrayBuffer);

        await conn.sendMessage(from, { react: { text: '🔄', key: mek.key } });

        await conn.sendMessage(from, {
            videoNote: videoBuffer,
            ptt: false,
            seconds: 60
        }, { quoted: mek });

        await conn.sendMessage(from, { 
            text: `🎥 *${videoTitle}*\n📺 Quality: 720p HD\n📝 Type: Video Note\n\n${config.FOOTER || ''}` 
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✔️', key: mek.key } });

    } catch (e) {
        console.error(e);
        await reply('*❌ Error creating video note! Try another format.*');
    }
});



cmd({
    pattern: "mediafire",
    react: "🔥",
    alias: ["mfire","mfdl"],
    category: "download",
    use: '.mediafire < link >',
    filename: __filename
},
async(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
await conn.sendMessage(from, { react: { text: '⬇️', key: mek.key }})
if(!q) return await conn.sendMessage(from , { text: '*🔥 Enter mediafire link...*' }, { quoted: mek } ) 
const data = await fetchJson(`https://mfire-dl.vercel.app/mfire?url=${q}`)
let listdata = `*🔥NEXUS MEDIAFIRE DOWNLODER 🔥*

*┌──────────────────╮*
*├ 🔥 Name :* ${data.fileName}
*├ ⏩ Type :* ${data.fileType}
*├ 📁 Size :* ${data.size}
*├ 📅 Date :* ${data.date}
*└──────────────────╯*\n ${config.FOOTER}`

	
reply(listdata)
//if (data.size.includes('GB')) return await conn.sendMessage(from , { text: 'File size is too big...' }, { quoted: mek } )
//if (data.size.includes('MB') && data.size.replace(' MB','') > config.MAX_SIZE) return await conn.sendMessage(from , { text: 'File size is too big...' }, { quoted: mek } )
let sendapk = await conn.sendMessage(from, {
    document: {
        url: data.dl_link
    },
    mimetype: `${data.type}`,
    fileName: `${data.fileName}`,
    caption: `*${data.fileName}*\n\n ${config.FOOTER}`
}, { quoted: mek });

await conn.sendMessage(from, { react: { text: '📁', key: sendapk.key }})
await conn.sendMessage(from, { react: { text: '✔', key: mek.key }})
} catch (e) {
    reply('ERROR !!')
    console.log(e)
}
})
async function xnxxs(query) {
  return new Promise((resolve, reject) => {
    const baseurl = 'https://www.xnxx.com';
    fetch(`${baseurl}/search/${query}/${Math.floor(Math.random() * 3) + 1}`, {method: 'get'}).then((res) => res.text()).then((res) => {
      const $ = cheerio.load(res, {xmlMode: false});
      const title = [];
      const url = [];
      const desc = [];
      const results = [];
      $('div.mozaique').each(function(a, b) {
        $(b).find('div.thumb').each(function(c, d) {
          url.push(baseurl + $(d).find('a').attr('href').replace('/THUMBNUM/', '/'));
        });
      });
      $('div.mozaique').each(function(a, b) {
        $(b).find('div.thumb-under').each(function(c, d) {
          desc.push($(d).find('p.metadata').text());
          $(d).find('a').each(function(e, f) {
            title.push($(f).attr('title'));
          });
        });
      });
      for (let i = 0; i < title.length; i++) {
        results.push({title: title[i], info: desc[i], link: url[i]});
      }
      resolve({status: true, result: results});
    }).catch((err) => reject({status: false, result: err}));
  });
}

cmd({
    pattern: "xnxx",	
    react: '🔎',
    category: "download",
    desc: "xnxx download",
    use: ".xnxx new",
    
    filename: __filename
},
async (conn, m, mek, { from, q, isSudo, isOwner, prefix, isMe, reply }) => {
try{

if( config.XNXX_BLOCK == "true" && !isMe && !isSudo && !isOwner ) {
	await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return await conn.sendMessage(from, { text: "*This command currently only works for the Bot owner. To disable it for others, use the .settings command 👨‍🔧.*" }, { quoted: mek });

}
if (!q) return reply('🚩 *Please give me words to search*')
let res = await xnxxs(q)
const data = res.result

var srh = [];  
for (var i = 0; i < res.result.length; i++) {
srh.push({
title: res.result[i].title,
description: '',
rowId: prefix + `xnxxdown ${res.result[i].link}}`
});
}

const sections = [{
title: "xnxx results",
rows: srh
}	  
]
const listMessage = {
text: `*NEXUS XNXX SEARCH 🔞*

*\`Input :\`* ${q}`,
footer: config.FOOTER,
title: 'xnxx results',
buttonText: '*Reply Below Number 🔢*',
sections
}

const caption = `*_XNXX SEARCH RESULT 🔞_*

*\`Input :\`* ${q}`
	
const listButtons = {
  title: "🔞 XNXX Search Results",
  sections: [
    {
      title: "🔍 Search Results",
      rows: res.result.map(video => ({
        title: video.title,
        description: "", // Optional: can add duration or views here
        id: prefix + `xnxxdown ${video.link}`
      }))
    }
  ]
};

 if (config.BUTTON === "true") {
      return await conn.sendMessage(from, {
        image: {url: config.LOGO },
        caption,
        footer: config.FOOTER,
        buttons: [
          {
            buttonId: "Video quality list",
            buttonText: { displayText: "🎥 Select Option" },
            type: 4,
            nativeFlowInfo: {
              name: "single_select",
              paramsJson: JSON.stringify(listButtons)
            }
          }
        ],
        headerType: 1,
        viewOnce: true
      }, { quoted: mek });

} else if (config.BUTTON === 'false') {

	
await conn.listMessage(from, listMessage,mek)

 }
} catch (e) {
    console.log(e)
  await conn.sendMessage(from, { text: '🚩 *Error !!*' }, { quoted: mek } )
}
})





async function xdl(URL) {
  return new Promise((resolve, reject) => {
    fetch(`${URL}`, {method: 'get'}).then((res) => res.text()).then((res) => {
      const $ = cheerio.load(res, {xmlMode: false});
      const title = $('meta[property="og:title"]').attr('content');
      const duration = $('meta[property="og:duration"]').attr('content');
      const image = $('meta[property="og:image"]').attr('content');
      const videoType = $('meta[property="og:video:type"]').attr('content');
      const videoWidth = $('meta[property="og:video:width"]').attr('content');
      const videoHeight = $('meta[property="og:video:height"]').attr('content');
      const info = $('span.metadata').text();
      const videoScript = $('#video-player-bg > script:nth-child(6)').html();
      const files = {
        low: (videoScript.match('html5player.setVideoUrlLow\\(\'(.*?)\'\\);') || [])[1],
        high: videoScript.match('html5player.setVideoUrlHigh\\(\'(.*?)\'\\);' || [])[1],
        HLS: videoScript.match('html5player.setVideoHLS\\(\'(.*?)\'\\);' || [])[1],
        thumb: videoScript.match('html5player.setThumbUrl\\(\'(.*?)\'\\);' || [])[1],
        thumb69: videoScript.match('html5player.setThumbUrl169\\(\'(.*?)\'\\);' || [])[1],
        thumbSlide: videoScript.match('html5player.setThumbSlide\\(\'(.*?)\'\\);' || [])[1],
        thumbSlideBig: videoScript.match('html5player.setThumbSlideBig\\(\'(.*?)\'\\);' || [])[1]};
      resolve({status: true, result: {title, URL, duration, image, videoType, videoWidth, videoHeight, info, files}});
    }).catch((err) => reject({status: false, result: err}));
  });
}

cmd({
    pattern: "xnxxdown",
    alias: ["dlxnxx","xnxxdl"],
    react: '🔞',
    dontAddCommandList: true,
    filename: __filename
},
async(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
 //if (!isMe) return await reply('🚩 You are not a premium user\nbuy via message to owner!!')
 if (!q) return reply('*Please give me instagram url !!*')
  let res = await xdl(q)
  let title = res.result.title
  await conn.sendMessage(from, { video: { url: res.result.files.high }, caption: title}, { quoted: mek })
} catch (e) {
reply('*Error !!*')
console.log(e)
}
})

cmd({
    pattern: "pornhub",	
    react: '🔎',
    category: "download",
    desc: "xnxx download",
    use: ".xnxx new",
    
    filename: __filename
},
async (conn, m, mek, { from, q, isSudo, isOwner, prefix, isMe, reply }) => {
try{

if( config.XNXX_BLOCK == "true" && !isMe && !isSudo && !isOwner ) {
	await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return await conn.sendMessage(from, { text: "*This command currently only works for the Bot owner. To disable it for others, use the .settings command 👨‍🔧.*" }, { quoted: mek });

}
if (!q) return reply('🚩 *Please give me words to search*')
let res = await phsearch(q)


var srh = [];  
for (var i = 0; i < res.length; i++) {
srh.push({
title: res[i].title,
description: '',
rowId: prefix + `phinfo ${res[i].link}}`
});
}

const sections = [{
title: "pornhub.com results",
rows: srh
}	  
]
const listMessage = {
text: `*_PORNHUB SEARCH RESULT 🔞_*

*\`Input :\`* ${q}`,
footer: config.FOOTER,
title: 'pornhub.com results',
buttonText: '*Reply Below Number 🔢*',
sections
}
await conn.listMessage(from, listMessage,mek)
} catch (e) {
    console.log(e)
  await conn.sendMessage(from, { text: '🚩 *Error !!*' }, { quoted: mek } )
}
})

cmd({
    pattern: "phinfo",	
    react: '🔞',
     //desc: "moive downloader",
    filename: __filename
},
async (conn, m, mek, { from, q, isMe, prefix, reply }) => {
try{

let res = await fetchJson(`https://ph-slow-dl.vercel.app/api/analyze?q=${q}`)
let msg = `*\`🔞 𝙉𝙀𝙓𝙐𝙎 𝙋𝙊𝙍𝙉𝙃𝙐𝘽 𝘿𝙊𝙒𝙉𝙇𝙊𝘼𝘿𝙀𝙍 🔞\`*

*┌──────────────────*
*├ \`❄️ Title\` :* ${res.video_title}
*├ \`⏱️ Time\` :* ${res.analyze_time}
*├ \`🧐 Uploder\` :* ${res.video_uploader}
*├ \`🔗 Url\` :* ${q}
*└──────────────────*`

 
var rows = [];  


  res.format.map((v) => {
	rows.push({
        buttonId: prefix + `phdl ${res.video_cover}±${v.download_url}±${res.video_title}`,
        buttonText: { displayText: `${v.resolution}` },
        type: 1
          }
		 
		  //{buttonId: prefix + 'cdetails ' + q, buttonText: {displayText: 'Details send'}, type: 1}
		 
		 
		 );
        })




  
const buttonMessage = {
 
image: {url: res.video_cover },	
  caption: msg,
  footer: config.FOOTER,
  buttons: rows,
  headerType: 4
}
return await conn.buttonMessage(from, buttonMessage, mek)
} catch (e) {
    console.log(e)
  await conn.sendMessage(from, { text: '🚩 *Error !!*' }, { quoted: mek } )
}
})



  cmd({
    pattern: "phdl",
    react: "⬇️",
    dontAddCommandList: true,
    filename: __filename
},
    async (conn, mek, m, { from, q, reply }) => {
try {
           if (!q) return await reply('*Need a youtube url!*')
	
           const datae = q.split("±")[0]
const datas = q.split("±")[1]
	const title = q.split("±")[2]

	
 

	await conn.sendMessage(from, { react: { text: '⬆️', key: mek.key } });
	
           
	await conn.sendMessage(from, { document:{ url: datas }, caption: config.FOOTER , mimetype: 'video/mp4' , caption: wm, fileName: `${title}` }, { quoted: mek });
	await conn.sendMessage(from, { react: { text: '✔️', key: mek.key } });
} catch (e) {
	       console.log(e)
        }
    })


cmd({
    pattern: "spotify",	
    react: '🎶',
    category: "download",
    desc: "spotify search",
    use: ".spotify lelena",
    
    filename: __filename
},
async (conn, m, mek, { from, q, isSudo, isOwner, prefix, isMe, reply }) => {
try{


if (!q) return reply('🚩 *Please give me words to search*')
let res = await fetchJson(`https://darksadasyt-spotify-search.vercel.app/search?query=${q}`)


var srh = [];  
for (var i = 0; i < res.length; i++) {
srh.push({
title: res[i].song_name,
description: '',
rowId: prefix + `spotifydl ${res[i].track_url}`
});
}

const sections = [{
title: "open.spotify.com",
rows: srh
}	  
]
const listMessage = {
text: `*SPOTIFY SEARCH RESULT 🎶*

*\`Input :\`* ${q}`,
	
footer: config.FOOTER,
title: 'open.spotify.com',
buttonText: '*Reply Below Number 🔢*',
sections
}
await conn.listMessage(from, listMessage,mek)
} catch (e) {
    console.log(e)
  await conn.sendMessage(from, { text: '🚩 *Error !!*' }, { quoted: mek } )
}
})

cmd({
    pattern: "spotifydl",
    alias: ["ytsong"],
    use: '.song lelena',
    react: "🎧",
    desc: "Download songs",
    filename: __filename
},

async (conn, mek, m, { from, prefix, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        if (!q) return await reply('*Please enter a query or a URL!*');

        const response = await axios.get(`https://phinfo.vercel.app/download?songId=${encodeURIComponent(q)}`);
        const data = response.data.data;

        if (!data || !data.downloadLink) {
            return await reply("❌ Could not retrieve the song. Please check your query.");
        }

        let caption = `*\`🎼 🄽🄴🅇🅄🅂 🅂🄿🄾🅃🄸🄵🅈 🄳🄾🅆🄽🄻🄾🄰🄳🄴🅁 🎼\`*
*┌──────────────────╮*
*├ \`🎶 Title:\`* ${data.title}
*├ \`🧑‍🎤 Artist:\`* ${data.artist}
*├ \`💽 Album:\`* ${data.album}
*├ \`📅 Date:\`* ${data.releaseDate}
*├ \`🔗 URL:\`* ${q}
*└──────────────────╯*`;

        const buttons = [
            {
                buttonId: prefix + 'spa ' + data.downloadLink,
                buttonText: { displayText: 'Audio Type 🎶' },
                type: 1
            },
            {
                buttonId: prefix + `spad ${data.downloadLink}&${data.cover}&${data.title}`,
                buttonText: { displayText: 'Document Type 📂' },
                type: 1
            }
        ];

        const buttonMessage = {
            image: { url: data.cover },
            caption: caption,
            footer: config.FOOTER,
            buttons: buttons,
            headerType: 4
        };

        await conn.buttonMessage(from, buttonMessage, mek);

    } catch (e) {
        console.error('Error occurred:', e);
        await reply('❌ An error occurred while processing your request. Please try again later.');
    }
});



cmd({
    pattern: "spa",
    react: "⬇️",
    dontAddCommandList: true,
    filename: __filename
},
    async (conn, mek, m, { from, q, reply }) => {
        if (!q) return await reply('*Need a youtube url!*');

          try {

		

await conn.sendMessage(from, { react: { text: '⬆️', key: mek.key } });
		    
		        
                await conn.sendMessage(from, { audio: { url: q }, mimetype: 'audio/mpeg' }, { quoted: mek });
               
                await conn.sendMessage(from, { react: { text: '✔️', key: mek.key } });
           } catch (e) {
  
  console.log(e)
}
})

 cmd({
    pattern: "spad",
    react: "⬇️",
    dontAddCommandList: true,
    filename: __filename
},
    async (conn, mek, m, { from, q, reply }) => {
try {
           if (!q) return await reply('*Need a youtube url!*')
	
           const datae = q.split("&")[0]
const datas = q.split("&")[1]
	const title = q.split("&")[2]
  const botimgUrl = datas;
        const botimgResponse = await fetch(botimgUrl);
        const botimgBuffer = await botimgResponse.buffer();
        
        // Resize image to 200x200 before sending
        const resizedBotImg = await resizeImage(botimgBuffer, 200, 200);
	
     


	
	await conn.sendMessage(from, { react: { text: '⬆️', key: mek.key } });
	
           
	await conn.sendMessage(from, { document:{ url: datae }, jpegThumbnail: resizedBotImg, caption: config.FOOTER , mimetype: 'audio/mpeg' , caption: wm, fileName: `${title}` }, { quoted: mek });
	await conn.sendMessage(from, { react: { text: '✔️', key: mek.key } });
} catch (e) {
	       console.log(e)
        }
    })
cmd({
    pattern: "soundcloud",	
    react: '🎶',
    category: "download",
    desc: "soundcloud search",
    use: ".soundcloud lelena",
    
    filename: __filename
},
async (conn, m, mek, { from, q, isSudo, isOwner, prefix, isMe, reply }) => {
try{


if (!q) return reply('🚩 *Please give me words to search*')
let res = await fetchJson(`https://api.fgmods.xyz/api/search/soundcloud?text=${q}&apikey=fg_NHnzSf6e`)


var srh = [];  
for (var i = 0; i < res.result.length; i++) {
srh.push({
title: res.result[i].title,
description: '',
rowId: prefix + `sounddl ${res.result[i].url}`
});
}

const sections = [{
title: "soundcloud.com results",
rows: srh
}	  
]
const listMessage = {
text: `*_SOUNDCLOUD SEARCH RESULT 🎶_*

*\`Input :\`* ${q}`,
	
footer: config.FOOTER,
title: 'soundcloud.com results',
buttonText: '*Reply Below Number 🔢*',
sections
}
await conn.listMessage(from, listMessage,mek)
} catch (e) {
    console.log(e)
  await conn.sendMessage(from, { text: '🚩 *Error !!*' }, { quoted: mek } )
}
})


cmd({
    pattern: "sounddl",
    alias: ["ytsong"],
    use: '.song <query>',
    react: "🎧",
    desc: "Download songs",
    filename: __filename
}, 
async (conn, mek, m, { from, prefix, q, reply }) => {
    try {
        if (!q) return await reply('*❌ Please enter a song name or SoundCloud URL!*');

        // Make the API request
        const apiUrl = `https://darksadasyt-soundcloud-dl.vercel.app/api/fetch-track?q=${encodeURIComponent(q)}`;
        let response;

        try {
            response = await axios.get(apiUrl);
        } catch (apiError) {
            console.error('API request failed:', apiError.message);
            return await reply('❌ The song download server is currently unavailable or returned an error (500). Please try again later.');
        }

        const data = response.data;

        if (!data || !data.url || !data.title || !data.imageURL) {
            return await reply('⚠️ Failed to retrieve valid song data. Please check your query or try again later.');
        }

        const caption = `*\`🎼 NEXUS SOUNDCLOUD DOWNLOADER 🎼\`*\n\n*🎶 Title:* ${data.title}\n*🔗 URL:* ${q}`;

        const buttons = [
            {
                buttonId: prefix + 'spa ' + data.url,
                buttonText: { displayText: 'Audio Type 🎶' },
                type: 1
            },
            {
                buttonId: prefix + `spad ${data.url}&${data.imageURL}&${data.title}`,
                buttonText: { displayText: 'Document Type 📂' },
                type: 1
            }
        ];

        const buttonMessage = {
            image: { url: data.imageURL },
            caption: caption,
            footer: config.FOOTER || 'NEXUS BOT',
            buttons: buttons,
            headerType: 4
        };


if (config.BUTTON === 'true') {
conn.sendMessage(from, {
    image: { url: data.imageURL },
    caption: caption,
    footer: config.FOOTER,
    buttons: [
        {
            buttonId: prefix + 'spa ' + data.url,
            buttonText: { displayText: "Audio Type 🎶" },
            type: 1
        },
        {
            buttonId: prefix + `spad ${data.url}&${data.imageURL}&${data.title}`,
            buttonText: { displayText: "Document Type 📂" },
            type: 1
        }
    ],
    headerType: 4 ,
   
}, { quoted: mek });


} else if (config.BUTTON === 'false') {
	    
        await conn.buttonMessage(from, buttonMessage, mek);
}

    } catch (e) {
        console.error('Unexpected error:', e);
        await reply('❌ An unexpected error occurred. Please try again later.');
    }
});




