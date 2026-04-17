const config = require('../config')
const { cmd, commands } = require('../command')
const axios = require('axios'); 
const sharp = require('sharp');
const fg = require('api-dylux');
const fetch = require('node-fetch');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson} = require('../lib/functions')

let isUploadingTv = false;
const API_KEY = '82406ca340409d44';

async function getResizedThumb(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        return await sharp(buffer)
            .resize(200, 200, { fit: 'cover' }) 
            .jpeg({ quality: 80 }) 
            .toBuffer();
    } catch (e) {
        console.error("Sharp Error:", e.message);
        return null;
    }
}

// ==================== 1. TV SERIES SEARCH ====================
cmd({
    pattern: "ctztv",
    react: '🔎',
    category: "tv",
    filename: __filename
},
async (conn, m, mek, { from, q, prefix, reply }) => {
    try {
        if (!q) return await reply('*Please enter a TV series name! 📺*');


        const { data } = await axios.get(`https://api-dark-shan-yt.koyeb.app/movie/cinesubz-search?q=${encodeURIComponent(q)}&apikey=${API_KEY}`);

        if (!data.data || !Array.isArray(data.data) || data.data.length === 0) return await reply('*No results found ❌*');

        const results = data.data.filter(item => item.type === "tvshows");
        let srh = results.map(v => ({
            title: v.title.replace(/Sinhala Subtitles\s*\|?\s*සිංහල උපසිරසි.*/gi, "").trim(),
            rowId: `${prefix}tvinfo ${v.link}`
        }));

        await conn.listMessage(from, {
            text: `_CINESUBZ TV SERIES SEARCH RESULTS 📺_\n\n*🔎 Input:* ${q}\n\n*Select a series from the list below to view episodes.*`,
            footer: config.FOOTER || "Cinesubz Downloader",
            title: '', 
            buttonText: 'Click to View Results 🎬',
            sections: [{ title: "Available TV Series", rows: srh }]
        }, mek);
    } catch (e) { 
        console.error(e);
        reply('🚩 *Error during search!*'); 
    }
});

// ==================== 2. TV INFO & EPISODES ====================
cmd({
    pattern: "tvinfo",
    react: "📺",
    filename: __filename
},
async (conn, m, mek, { from, q, prefix, reply }) => {
    try {

        const { data } = await axios.get(`https://api-dark-shan-yt.koyeb.app/tv/cinesubz-info?url=${encodeURIComponent(q)}&apikey=${API_KEY}`);


        const series = data.data;
        if (!series) return await reply("*Couldn't find TV series info!*");

        const posterUrl = series.image || config.LOGO; 

        for (let i = 0; i < series.seasons.length; i++) {
            const season = series.seasons[i];
            let rows = [];


            rows.push({
                buttonId: `${prefix}tvallquality ${q}±${posterUrl}±${series.title}±${season.s_no}`,
                buttonText: { displayText: `📥 Download All S${season.s_no}` },
                type: 1
            });

            if (i === 0) {
                rows.push({
                    buttonId: `${prefix}ctvdetails ${q}`,
                    buttonText: { displayText: 'View Details Card 📋' },
                    type: 1
                });
            }

            season.episodes.forEach(ep => {

                const epTitle = `S${String(season.s_no).padStart(2, '0')} E${String(ep.e_no).padStart(2, '0')}`;


                rows.push({
                    buttonId: `${prefix}tvquality ${ep.link}±${posterUrl}±${series.title} ${epTitle}±${q}`,
                    buttonText: { displayText: epTitle },
                    type: 1
                });
            });

            const captionText = i === 0 
                ? `*🍿 𝗧ɪᴛ𝗹𝗲 ➮* *_${series.title}_*\n*📅 𝗬ᴇᴀʀ ➮* _${series.year}_\n\n*Select an Episode from Season ${season.s_no} below:*`
                : `*📂 Season ${season.s_no} Episodes - ${series.title}*`;

            await conn.buttonMessage(from, {
                image: { url: posterUrl },
                caption: captionText,
                footer: config.FOOTER || "Cinesubz Downloader",
                buttons: rows,
                headerType: 4
            }, mek);

            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } catch (e) { 
        console.error(e);
        reply('🚩 *Error fetching episodes!*'); 
    }
});

// ==================== 3. DETAILS CARD ====================
cmd({
    pattern: "ctvdetails",
    react: '📋',
    desc: "Rich TV info card",
    filename: __filename
},
async (conn, m, mek, { from, q, reply }) => {
    try {
        const { data } = await axios.get(`https://api-dark-shan-yt.koyeb.app/tv/cinesubz-info?url=${encodeURIComponent(q)}&apikey=${API_KEY}`);

        const movie = data.data;
        let details = { mvchlink: "https://whatsapp.com/channel/yourchannel" }; 
        try {
            details = (await axios.get('https://nexus-full-db.vercel.app/Main/main_var.json')).data;
        } catch(e){}

        let msg = `*✨ 𝐓ᴠ 𝐒ᴇʀɪᴇส์ 𝐃ᴇᴛᴀɪʟส์ ✨*\n\n` +
                  `*🍿 𝐓ɪ𝐓ʟ𝐄 ➮* *_${movie.title || 'N/A'}_*\n` +
                  `*📅 𝐑ᴇ𝐋ᴇᴀ𝐒ᴇ𝐃 ➮* _${movie.year || 'N/A'}_\n` +
                  `*💃 𝐑ᴀ𝐓ɪＮＧ ➮* _⭐ ${movie.rating || 'N/A'}_\n` +
                  `*💁 𝐒ᴜʙᴛɪᴛʟᴇ ʙʏ ➮* _CineSubz.co_\n\n` +
                  `✨ *Follow us:* ${details.mvchlink}`;

        await conn.sendMessage(from, { 
            image: { url: movie.image }, 
            caption: msg 
        }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✔️', key: mek.key } });
    } catch (e) { 
        console.error("Error in ctvdetails command:", e); 
        reply('🚩 *Error fetching details card!*'); 
    }
});

// ==================== 4. QUALITY SELECTION ====================
cmd({
    pattern: "tvquality",
    react: "🎥",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, m, mek, { from, q, prefix, reply }) => {
    try {
        const [epUrl, imgLink, title, mainUrl] = q.split("±");


        const { data: convData } = await axios.get(`https://api-dark-shan-yt.koyeb.app/episode/cinesubz-info?url=${encodeURIComponent(epUrl)}&apikey=${API_KEY}`);

        let rows = convData.data.download.map(dl => ({
            buttonId: `${prefix}tvdl ${dl.link}±${imgLink}±${title}±${mainUrl}±${dl.quality}`, 
            buttonText: { displayText: `${dl.quality} (${dl.size})` },
            type: 1
        }));

        await conn.buttonMessage(from, {
            image: { url: imgLink },
            caption: `*🎥 Select Quality for:* \n_${title}_`,
            footer: config.FOOTER || "Cinesubz Downloader",
            buttons: rows,
            headerType: 4
        }, mek);
    } catch (e) { 
        console.error(e);
        reply('🚩 *Error fetching qualities!*'); 
    }
});

// ==================== 5. ALL EPISODES QUALITY SELECTION ====================
cmd({
    pattern: "tvallquality",
    react: "📑",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, m, mek, { from, q, prefix, reply }) => {
    try {
        const [mainUrl, imgLink, title, seasonNum] = q.split("±");

        const { data: seriesData } = await axios.get(`https://api-dark-shan-yt.koyeb.app/tv/cinesubz-info?url=${encodeURIComponent(mainUrl)}&apikey=${API_KEY}`);

        const targetSeason = seriesData.data.seasons.find(s => s.s_no.toString() === seasonNum.toString());
        const firstEpUrl = targetSeason.episodes[0].link; 


        const { data: convData } = await axios.get(`https://api-dark-shan-yt.koyeb.app/episode/cinesubz-info?url=${encodeURIComponent(firstEpUrl)}&apikey=${API_KEY}`);

        let rows = convData.data.download.map(dl => ({
            buttonId: `${prefix}tvdlall ${mainUrl}±${imgLink}±${title}±${dl.quality}±${seasonNum}`,
            buttonText: { displayText: dl.quality },
            type: 1
        }));

        await conn.buttonMessage(from, {
            image: { url: imgLink },
            caption: `*📥 DOWNLOAD ALL - SEASON ${seasonNum}*\n\n*Series:* ${title}\n*Select the quality for all episodes in Season ${seasonNum}:*`,
            footer: config.FOOTER || "Cinesubz Downloader",
            buttons: rows,
            headerType: 4
        }, mek);
    } catch (e) { 
        console.error(e);
        reply('🚩 *Error fetching quality list!*'); 
    }
});

// ==================== 6. DOWNLOAD ALL EXECUTION ====================
cmd({
    pattern: "tvdlall",
    react: "⏳",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, m, mek, { from, q, reply }) => {
    if (isUploadingTv) return await reply('*Another process is running. Please wait ⏳*');
    try {
        const [mainUrl, imgLink, title, selectedQuality, seasonNum] = q.split("±");
        isUploadingTv = true;
        await reply(`*🚀 Starting download all episodes of Season ${seasonNum} in ${selectedQuality}...*`);

        const { data: seriesData } = await axios.get(`https://api-dark-shan-yt.koyeb.app/tv/cinesubz-info?url=${encodeURIComponent(mainUrl)}&apikey=${API_KEY}`);
        const seasons = seriesData.data.seasons.filter(s => s.s_no.toString() === seasonNum.toString());

        for (const season of seasons) {
            for (const ep of season.episodes) {
                try {
                    const epTitle = `${title} S${String(season.s_no).padStart(2, '0')}E${String(ep.e_no).padStart(2, '0')}`;

                    const { data: qData } = await axios.get(`https://api-dark-shan-yt.koyeb.app/episode/cinesubz-info?url=${encodeURIComponent(ep.link)}&apikey=${API_KEY}`);

                    const matchingDl = qData.data.download.find(d => d.quality.trim() === selectedQuality.trim()) || qData.data.download[0]; 

                    const { data: apiRes } = await axios.get(`https://api-dark-shan-yt.koyeb.app/movie/cinesubz-download?url=${encodeURIComponent(matchingDl.link)}&apikey=${API_KEY}`);

                    const downloadLinks = apiRes.data.download;
                    let downloadUrl = null;
                    let fileName = apiRes.data.title || epTitle;


                    const directEntry = downloadLinks.find(dl => 
                        dl.name.toLowerCase() === "unknown" || 
                        dl.url.includes("/dl/") || 
                        dl.url.includes("csplayer") || 
                        dl.name.toLowerCase().includes("direct")
                    );
                    if (directEntry) downloadUrl = directEntry.url;

                    if (!downloadUrl) {
                        const gdriveEntry = downloadLinks.find(dl => dl.name.toLowerCase() === "gdrive");
                        if (gdriveEntry) {
                            try {
                                const res = await fg.GDriveDl(gdriveEntry.url.replace('https://drive.usercontent.google.com/download?id=', 'https://drive.google.com/file/d/').replace('&export=download', '/view'));
                                if (res && res.downloadUrl) {
                                    downloadUrl = res.downloadUrl;
                                    fileName = res.fileName;
                                }
                            } catch (e) { }
                        }
                    }

                    if (!downloadUrl) {
                        const pixelEntry = downloadLinks.find(dl => dl.name.toLowerCase().includes("pixeldrain") || dl.name.toLowerCase() === "pix" || dl.url.includes("pixeldrain.com"));
                        if (pixelEntry) downloadUrl = pixelEntry.url.replace('/u/', '/api/file/') + "?download";
                    }

                    if (!downloadUrl) {
                        const fallbackEntry = downloadLinks.find(dl => dl.name.toLowerCase() !== "telegram");
                        if (fallbackEntry) downloadUrl = fallbackEntry.url;
                    }

                    if (downloadUrl) {
                        const resizedThumb = await getResizedThumb(imgLink);
                        const caption = `🎬 *𝗡𝗮𝗺𝗲 :* ${epTitle}\n\n\`[${selectedQuality.trim()}]\` \n\n${config.NAME || 'Bot'}`;

                        const targetJid = config.JID || from;
                        await conn.sendMessage(targetJid, { 
                            document: { url: downloadUrl }, 
                            fileName: "🎥 " + fileName.trim() + ".mp4", 
                            mimetype: "video/mp4",
                            jpegThumbnail: resizedThumb,
                            caption: caption
                        });
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                } catch (err) { console.error(`Error:`, err); }
            }
        }
        await reply(`*✅ All episodes of Season ${seasonNum} have been sent!*`);
    } catch (e) { 
        console.error(e);
        reply('*Critical error in Download All!*'); 
    }
    finally { isUploadingTv = false; }
});

// ==================== 7. FINAL INDIVIDUAL DOWNLOAD ====================
cmd({
    pattern: "tvdl",
    react: "⬇️",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, m, mek, { from, q, reply }) => {
    if (isUploadingTv) return await reply('*Another episode is uploading. Please wait ⏳*');
    try {
        const [processedUrl, imgLink, title, mainUrl, quality] = q.split("±");

        const { data: apiRes } = await axios.get(`https://api-dark-shan-yt.koyeb.app/movie/cinesubz-download?url=${encodeURIComponent(processedUrl)}&apikey=${API_KEY}`);

        const downloadLinks = apiRes.data.download;
        let downloadUrl = null;
        let fileName = apiRes.data.title || title; 

        const directEntry = downloadLinks.find(dl => 
            dl.name.toLowerCase() === "unknown" || 
            dl.url.includes("/dl/") || 
            dl.url.includes("csplayer") || 
            dl.name.toLowerCase().includes("direct")
        );
        if (directEntry) downloadUrl = directEntry.url;

        if (!downloadUrl) {
            const gdriveEntry = downloadLinks.find(dl => dl.name.toLowerCase() === "gdrive");
            if (gdriveEntry) {
                try {
                    const res = await fg.GDriveDl(gdriveEntry.url.replace('https://drive.usercontent.google.com/download?id=', 'https://drive.google.com/file/d/').replace('&export=download', '/view'));
                    if (res && res.downloadUrl) {
                        downloadUrl = res.downloadUrl;
                        fileName = res.fileName;
                    }
                } catch (e) { /* skip */ }
            }
        }

        if (!downloadUrl) {
            const pixelEntry = downloadLinks.find(dl => dl.name.toLowerCase().includes("pixeldrain") || dl.name.toLowerCase() === "pix" || dl.url.includes("pixeldrain.com"));
            if (pixelEntry) {
                downloadUrl = pixelEntry.url.replace('/u/', '/api/file/') + "?download";
            }
        }

        if (!downloadUrl) {
            const fallbackEntry = downloadLinks.find(dl => dl.name.toLowerCase() !== "telegram");
            if (fallbackEntry) downloadUrl = fallbackEntry.url;
        }

        if (!downloadUrl) return await reply("⚠️ No working link found.");

        isUploadingTv = true;
        await conn.sendMessage(from, { react: { text: '⬆️', key: mek.key } });

        const resizedThumb = await getResizedThumb(imgLink);
        const qText = quality ? quality.trim() : 'Unknown';
        const caption = `🎬 *𝗡𝗮𝗺𝗲 :* ${title}\n\n\`[ ${qText} ]\`\n\n${config.NAME || 'Bot'}`;

        const targetJid = config.JID || from;
        await conn.sendMessage(targetJid, { 
            document: { url: downloadUrl }, 
            fileName: "🎥" + fileName.trim() + ".mp4", 
            mimetype: "video/mp4",
            jpegThumbnail: resizedThumb,
            caption: caption
        });
        await conn.sendMessage(from, { react: { text: '✔️', key: mek.key } });
    } catch (e) { 
        console.error(e);
        reply('*Download Error !!*'); 
    }
    finally { isUploadingTv = false; }
});