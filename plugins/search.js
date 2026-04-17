const { cmd, commands } = require('../command')
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('../lib/functions')
const config = require('../config')
const axios = require('axios')


//BODY CREATED BY PATHUM RAJAPAKSHE
//BY VISPER-MD TEAM
cmd({
    pattern: "gagana",
    react: "📰",
    desc: "Get the latest news from Gagana",
    category: "search",
    use: ".gagana news",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const newsUrl = "https://saviya-kolla-api.koyeb.app/news/gagana"
        console.log(`Fetching news from: ${newsUrl}`)
        const response = await axios.get(newsUrl)
        const newsData = response.data
        console.log("API Response:", JSON.stringify(newsData, null, 2))
        if (!newsData || !newsData.status || !newsData.result) {
            throw new Error("Invalid API response or no news data available")
        }
        const article = newsData.result
        const imageUrl = article.image || "https://via.placeholder.com/300x200.png?text=No+Image+Available" // Default placeholder if no image
        let newsMessage = "⚕️ *𝙉𝙀𝙓𝙐𝙎 𝙈𝘿 𝙉𝙀𝙒𝙎*\n\n"
        newsMessage += `↗️ *${article.title || "ᴜɴᴛɪᴛʟᴇᴅ ɴᴇᴡs"}*\n\n`
        newsMessage += `↗️ *ᴅᴀᴛᴇ:* ${article.date || "ɴᴏ ᴅᴀᴛᴇ ᴀᴠᴀɪʟʙʟᴇ"}\n\n`
        newsMessage += `↗️ *ᴅᴇsᴄʀɪᴘᴛɪᴏɴ:*\n${article.desc || "No description available"}\n\n`
        newsMessage += `🔗 *ʀᴇᴀᴅ ᴍᴏʀᴇ:* ${article.url || "No link available"}`
        await conn.sendMessage(from, {
            image: { url: imageUrl },
            caption: `${newsMessage}\n\n *•ɴᴇxᴜꜱ ᴍᴅ ɴᴇᴡs•* `
        }, { quoted: mek })
    } catch (error) {
        console.error("News API Error:", error.response?.data || error.message)
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } })
        await reply("❌ *Error fetching news. Please try again later.*")
    }
})

//SIRASA NEWS PLUGIN
cmd({
    pattern: "sirasa",
    react: "📰",
    desc: "Get the latest news from Sirasa",
    category: "search",
    use: "news",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const newsUrl = "https://saviya-kolla-api.koyeb.app/news/sirasa"
        console.log(`Fetching news from: ${newsUrl}`)
        const response = await axios.get(newsUrl)
        const newsData = response.data
        console.log("API Response:", JSON.stringify(newsData, null, 2))
        if (!newsData || !newsData.status || !newsData.result) {
            throw new Error("Invalid API response or no news data available")
        }
        const article = newsData.result
        const imageUrl = article.image || "https://via.placeholder.com/300x200.png?text=No+Image+Available" // Default placeholder if no image
        let newsMessage = "⚕️ *�𝙉𝙀𝙓𝙐𝙎 𝙈𝘿 𝙉𝙀𝙒𝙎*\n\n"
        newsMessage += `↗️ *${article.title || "ᴜɴᴛɪᴛʟᴇᴅ ɴᴇᴡs"}*\n\n`
        newsMessage += `↗️ *ᴅᴀᴛᴇ:* ${article.date || "ɴᴏ ᴅᴀᴛᴇ ᴀᴠᴀɪʟʙʟᴇ"}\n\n`
        newsMessage += `↗️ *ᴅᴇsᴄʀɪᴘᴛɪᴏɴ:*\n${article.desc || "No description available"}\n\n`
        newsMessage += `🔗 *ʀᴇᴀᴅ ᴍᴏʀᴇ:* ${article.url || "No link available"}`
        await conn.sendMessage(from, {
            image: { url: imageUrl },
            caption: `${newsMessage}\n\n *•ɴᴇxᴜꜱ ᴍᴅ ɴᴇᴡs•* `
        }, { quoted: mek })
    } catch (error) {
        console.error("News API Error:", error.response?.data || error.message)
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } })
        await reply("❌ *Error fetching news. Please try again later.*")
    }
})

//DASATHALANKAN NEWS
cmd({
    pattern: "dasathalankan",
    react: "📰",
    desc: "Get the latest news from Dasathalanka News",
    category: "search",
    use: "news",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const newsUrl = "https://nadeen-api.vercel.app/news/dasathalankanews"
        console.log(`Fetching news from: ${newsUrl}`)
        const response = await axios.get(newsUrl)
        const newsData = response.data
        console.log("API Response:", JSON.stringify(newsData, null, 2))
        if (!newsData || !newsData.status || !newsData.result) {
            throw new Error("Invalid API response or no news data available")
        }
        const article = newsData.result
        const imageUrl = article.image || "https://via.placeholder.com/300x200.png?text=No+Image+Available" // Default placeholder if no image
        let newsMessage = "⚕️ *𝙉𝙀𝙓𝙐𝙎 𝙈𝘿 𝙉𝙀𝙒𝙎�*\n\n"
        newsMessage += `↗️ *${article.title || "ᴜɴᴛɪᴛʟᴇᴅ ɴᴇᴡs"}*\n\n`
        newsMessage += `↗️ *ᴅᴀᴛᴇ:* ${article.date || "ɴᴏ ᴅᴀᴛᴇ ᴀᴠᴀɪʟʙʟᴇ"}\n\n`
        newsMessage += `↗️ *ᴅᴇsᴄʀɪᴘᴛɪᴏɴ:*\n${article.desc || "No description available"}\n\n`
        newsMessage += `🔗 *ʀᴇᴀᴅ ᴍᴏʀᴇ:* ${article.url || "No link available"}`
        await conn.sendMessage(from, {
            image: { url: imageUrl },
            caption: `${newsMessage}\n\n *•ɴᴇxᴜꜱ ᴍᴅ ɴᴇᴡs•* `
        }, { quoted: mek })
    } catch (error) {
        console.error("News API Error:", error.response?.data || error.message)
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } })
        await reply("❌ *Error fetching news. Please try again later.*")
    }
})

//LANKADEEPA NEWS PLUGIN
cmd({
    pattern: "lankadeepa",
    react: "📰",
    desc: "Get the latest news from Lankadeepa",
    category: "search",
    use: "lankadeepa",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const newsUrl = "https://saviya-kolla-api.koyeb.app/news/lankadeepa"
        console.log(`Fetching news from: ${newsUrl}`)
        const response = await axios.get(newsUrl)
        const newsData = response.data
        console.log("API Response:", JSON.stringify(newsData, null, 2))
        if (!newsData || !newsData.status || !newsData.result) {
            throw new Error("Invalid API response or no news data available")
        }
        const article = newsData.result
        const imageUrl = article.image || "https://via.placeholder.com/300x200.png?text=No+Image+Available" // Default placeholder if no image
        let newsMessage = "⚕️ *𝙉𝙀𝙓𝙐𝙎 𝙈𝘿 𝙉𝙀𝙒𝙎*\n\n"
        newsMessage += `↗️ *${article.title || "ᴜɴᴛɪᴛʟᴇᴅ ɴᴇᴡs"}*\n\n`
        newsMessage += `↗️ *ᴅᴀᴛᴇ:* ${article.date || "ɴᴏ ᴅᴀᴛᴇ ᴀᴠᴀɪʟʙʟᴇ"}\n\n`
        newsMessage += `↗️ *ᴅᴇsᴄʀɪᴘᴛɪᴏɴ:*\n${article.desc || "No description available"}\n\n`
        newsMessage += `🔗 *ʀᴇᴀᴅ ᴍᴏʀᴇ:* ${article.url || "No link available"}`
        await conn.sendMessage(from, {
            image: { url: imageUrl },
            caption: `${newsMessage}\n\n *•ɴᴇxᴜꜱ ᴍᴅ ɴᴇᴡs•* `
        }, { quoted: mek })
    } catch (error) {
        console.error("News API Error:", error.response?.data || error.message)
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } })
        await reply("❌ *Error fetching news. Please try again later.*")
    }
})

cmd({
    pattern: "wastalk",
    desc: "Fetch WhatsApp channel info using a given URL",
    category: "search",
    react: "🪀",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        const url = q || (quoted?.text ?? "").trim();

        if (!url || !url.includes("whatsapp.com/channel/")) {
            return reply(`Please provide a valid WhatsApp Channel URL.\n\n*Example:* .wastalk https://whatsapp.com/channel/0029VagN2qW3gvWUBhsjcn3I`);
        }

        const res = await axios.get(`https://apis-keith.vercel.app/stalker/wachannel?url=${encodeURIComponent(url)}`);
        const data = res.data;

        if (!data.status) {
            return reply("Failed to fetch channel data. Please try again later.");
        }

        const result = data.result;

        const caption = `🔍 *WhatsApp Channel Info*\n\n` +
                        `*📛 Title:* ${result.title}\n` +
                        `*🧑‍🤝‍🧑 Followers:* ${result.followers}\n\n` +
                        `*📝 Description:*\n${result.description}\n\n${config.FOOTER}`;

        await conn.sendMessage(from, {
            image: { url: result.img },
            caption,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363425542933159@newsletter',
                    newsletterName: 'NEXUS-MD',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (err) {
        console.error("WAStalk Error:", err);
        reply("Something went wrong while fetching the channel info.");
    }
});

cmd(
  {
    pattern: 'fancy',
    react: '\uD83E\uDE84',
    category: 'convert',
    desc: 'fancy',
    filename: __filename,
  },
  async (
    _0x530458,
    _0x7f43a6,
    _0x3ed39f,
    {
      from: _0xba1cf2,
      q: _0x3d99ac,
      prefix: _0x505100,
      isMe: _0x256161,
      reply: _0x1537a7,
    }
  ) => {
    try {
      if (!_0x3d99ac) {
        return await _0x1537a7('*please give me text !..*')
      }
      let _0x1b418b = await fetchJson(
        'https://www.dark-yasiya-api.site/other/font?text=' + _0x3d99ac
      )
      if (_0x1b418b.length < 1) {
        return await _0x530458.sendMessage(
          _0xba1cf2,
          { text: 'erro !' },
          { quoted: _0x3ed39f }
        )
      }
      var _0x3d1897 = []
      _0x1b418b.result.map((_0x2d1779) => {
        _0x3d1897.push({
          buttonId: _0x505100 + ('fandl ' + _0x2d1779.result),
          buttonText: { displayText: '' + _0x2d1779.result },
          type: 1,
        })
      })
      const _0x5e3b0f = {
        image: { url: config.LOGO },
        caption: '*`\uD83E\uDDE7NEXUS MD FANCY TEXT \uD83E\uDDE7`*',
        footer: config.FOOTER,
        buttons: _0x3d1897,
        headerType: 4,
      }
      return await _0x530458.buttonMessage(_0xba1cf2, _0x5e3b0f, _0x3ed39f)
    } catch (_0x4ef43e) {
      console.log(_0x4ef43e)
      await _0x530458.sendMessage(
        _0xba1cf2,
        { text: '\uD83D\uDEA9 *Error !!*' },
        { quoted: _0x3ed39f }
      )
    }
  }
)
cmd(
  {
    pattern: 'fandl',
    react: '\uD83E\uDE84',
    desc: 'fancy',
    filename: __filename,
  },
  async (
    _0x24d8f9,
    _0x13f6e,
    _0x77d751,
    {
      from: _0x13e386,
      q: _0x378d85,
      prefix: _0x762c66,
      isMe: _0x962b6b,
      reply: _0x27848b,
    }
  ) => {
    try {
      if (!_0x378d85) {
        return await _0x27848b('*please give me text !..*')
      }
      await _0x27848b(_0x378d85)
    } catch (_0xeb190c) {
      console.log(_0xeb190c)
      await _0x24d8f9.sendMessage(
        _0x13e386,
        { text: '\uD83D\uDEA9 *Error !!*' },
        { quoted: _0x77d751 }
      )
    }
  }
)
cmd({
  pattern: "srepo",
  desc: "Fetch information about a GitHub repository.",
  category: "search",
  react: "🍃",
  filename: __filename
}, async (conn, m, store, { from, args, reply }) => {
  try {
    const repoName = args.join(" ");
    if (!repoName) {
      return reply("❌ Please provide a GitHub repository in the format 📌 `owner/repo`.");
    }

    const apiUrl = `https://api.github.com/repos/${repoName}`;
    const { data } = await axios.get(apiUrl);

    let responseMsg = `📁 *GitHub Repository Info* 📁\n\n`;
    responseMsg += `📌 *Name*: ${data.name}\n`;
    responseMsg += `🔗 *URL*: ${data.html_url}\n`;
    responseMsg += `📝 *Description*: ${data.description || "No description"}\n`;
    responseMsg += `⭐ *Stars*: ${data.stargazers_count}\n`;
    responseMsg += `🍴 *Forks*: ${data.forks_count}\n`;
    responseMsg += `👤 *Owner*: ${data.owner.login}\n`;
    responseMsg += `📅 *Created At*: ${new Date(data.created_at).toLocaleDateString()}\n`;
    responseMsg += `\n> ${config.FOOTER}`;

    await conn.sendMessage(from, { text: responseMsg }, { quoted: m });
  } catch (error) {
    console.error("GitHub API Error:", error);
    reply(`❌ Error fetching repository data: ${error.response?.data?.message || error.message}`);
  }
});
