require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");
const { App } = require("@slack/bolt");
const axios = require("axios");

const ai = new GoogleGenAI({});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});


const todaysDate = new Date().toLocaleDateString('en-US', { dateStyle: 'long' });


function getSources(response) {
  try {
    let chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (!chunks || chunks.length === 0) return "";
    
    let links = [];
    for (let i = 0; i < chunks.length; i++) {
      if (chunks[i].web && chunks[i].web.uri) {
        links.push(`• <${chunks[i].web.uri}|${chunks[i].web.title}>`);
      }
    }
    
    if (links.length > 0) {
      return `\n\n🔎 *Sources*\n${links.join("\n")}`;
    }
  } catch (err) {
    console.log("failed to parse sources:", err.message);
    return "";
  }
}

// help command
app.command("/my-slakie-help", async ({ ack, respond }) => {
  await ack();
  await respond({
    text: `🤖 *Slackie — Hack Club Bot*
    📌 *Utility*
    /my-slakie-help - Show all commands
    /my-slakie-ping - Check bot latency

    🎭 *Fun*
    /my-slakie-joke - Random joke
    /my-slakie-meme - Random meme

    🌍 *Information*
    /my-slakie-f1 - Next F1 race info
    /my-slakie-define [word] - Define a word

    🧮 *Tools*
    /my-slakie-math [expression] - Math & unit calc
    /my-slakie-currency [amount] [BASE] to [TARGET] - Currency conversion
    /my-slakie-qr [link] - Generate a QR code

    🧠 *AI*
    /my-slakie-gemini [question] - Ask Slackie a question

    Made by Pondugula Mokshith Reddy`,
  
  });
});

// ping command

app.command("/my-slakie-ping", async ({ command, ack, respond }) => {
  const start = Date.now();
  await ack();
  const latency = Date.now() - start;
  await respond({ text: `Pong!\nLatency: ${latency}ms` });
});


app.command("/my-slakie-gemini", async ({ command, ack, respond }) => {
  await ack();
  let question = command.text.trim();

  if (!question) {
      return respond(`I Think You Just Call Me! Without Any Question :) 😭`);
    }

  try {
    
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: question,
      
      config: {
        systemInstruction: `You are Slackie, a bot for Hack Club.Use Google Search for anything current, recent, or changing like sports, tech news, and prices. Be friendly, keep it short, and explain things simply.`,
        
        tools: [{ googleSearch: {} }],
      },
    });

    let answer = response.text || "I couldn't generate an answer.";
    let sources = getSources(response);

    await respond({
      response_type: "in_channel",
      text: `✨ *You asked:*\n${question}\n\n🤖 *Slackie says:*\n${answer}${sources}`,
    });

  } catch (err) {
    console.error("gemini error:", err);
    if (err.message && err.message.includes("429")) {
      await respond({ text: "⚠️ Gemini rate limit reached. Try again later." });
    } else {
      await respond({ text: "😭 Oops! Couldn't connect to Gemini. Check the console." });
    }
  }
});

// F1 command
app.command("/my-slakie-f1", async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get("https://api.jolpi.ca/ergast/f1/current/next.json");
    let races = response.data?.MRData?.RaceTable?.Races;

    if (!races || races.length === 0) {
      return respond({ text: "🏎️ No upcoming races found right now." });
    }

    let race = races[0];
    let raceDate = new Date(`${race.date}T${race.time || "00:00:00"}Z`);
    let daysDiff = Math.ceil((raceDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    let msg = "_Any guesses for the World Champ?_";
    if (daysDiff >= 0 && daysDiff <= 7) {
      msg += "\n🏎️💨 *It's Race Week! LESS GOOO!*";
    }

    await respond({
      response_type: "in_channel",
      text: `🏎️ *Next F1 Race*\n🏁 *Race:* ${race.raceName}\n📍 *Circuit:* ${race.Circuit.circuitName}\n🌍 *Location:* ${race.Circuit.Location.locality}\n📅 *todaysDate:* ${race.todaysDate}\n⏰ *Time:* ${race.time || "TBD"}\n\n${msg}`,
    });
  } catch (err) {
    console.error(err);
    await respond({ text: "🏎️ Failed to fetch F1 data." });
  }
});

// Define command
app.command("/my-slakie-define", async ({ command, ack, respond }) => {
  await ack();
  let word = command.text.trim();
  if (!word) return respond({ text: "Usage: `/my-slakie-define [word]`" });

  try {
    
    const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    let meaning = response.data[0]?.meanings[0];
    let def = meaning?.definitions[0]?.definition;
    let ex = meaning?.definitions[0]?.example;

    if (!def) return respond({ text: `Couldn't find a definition for ${word}` });

    let txt = `📖 *${res.data[0].word}* _(${meaning.partOfSpeech})_\n*Definition:*\n${def}`;
    if (ex) txt += `\n*Example:*\n_${ex}_`;

    await respond({ response_type: "in_channel", text: txt });
  } catch (err) {
    await respond({ text: `📖 Couldn't find a definition for "${word}".` });
  }
});
 
// QR code command
app.command("/my-slakie-qr", async ({ command, ack, respond }) => {
  await ack();
  let input = command.text.trim();
  if (!input) return respond({ text: "Usage: `/my-slakie-qr [link]`" });

  let qurl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(input)}`;
  
  await respond({
    response_type: "in_channel",
    blocks: [
      { type: "section", text: { type: "mrkdwn", text: `📱 *QR Code for:*\n\`${input}\`` } },
      { type: "image", image_url: qurl, alt_text: "QR code" }
    ]
  });
});

// Math command
app.command("/my-slakie-math", async ({ command, ack, respond }) => {
  await ack();
  let exp = command.text.trim();
  if (!exp) return respond({ text: "Usage: `/my-slakie-math [expression]`" });

  try {
    const response = await axios.get(`https://api.mathjs.org/v4/?expr=${encodeURIComponent(exp)}`);
    await respond({
      response_type: "in_channel",
      text: `🧮 *Math:*\n\`${exp}\` = \`${response.data}\``
    });
  } catch (err) {
    await respond({ text: "🧮 Formatting error. Check your math expression." });
  }
});

// meme command 
app.command("/my-slakie-meme", async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get("https://meme-api.com/gimme");
    await respond({
      response_type: "in_channel",
      blocks: [
        { type: "section", text: { type: "mrkdwn", text: `😂 *${response.data.title}*` } },
        { type: "image", image_url: response.data.url, alt_text: "Meme" }
      ]
    });
  } catch (err) {
    await respond({ text: "🖼️ Couldn't fetch a meme right now." });
  }
});

// joke command
app.command("/my-slakie-joke", async ({ ack, respond }) => {
  await ack();

  try {
    const response = await axios.get("https://official-joke-api.appspot.com/random_joke");
    await respond({text:`${response.data.setup}${response.data.punchline}`});
  } catch (err) {
    await respond({ text: "Failed to fetch a joke." });
  }
});


// currency command
app.command("/my-slakie-currency", async ({ command, ack, respond }) => {
  await ack();
  let text = command.text.trim().toLowerCase();
  let parts = text.split(/\s+/);
  
  let amount = 1;
  let base = "";
  let target = "";

  
  if (parts.length === 3 && parts[1] === "to") {
    base = parts[0].toUpperCase();
    target = parts[2].toUpperCase();
  } else if (parts.length === 4 && parts[2] === "to") {
    amount = parseFloat(parts[0]) || 1;
    base = parts[1].toUpperCase();
    target = parts[3].toUpperCase();
  } else {
    return respond({ text: "💱 Invalid format. Usage: `/my-slakie-currency [amount] [BASE] to [TARGET]`" });
  }

  try {
    const response = await axios.get(`https://open.er-api.com/v6/latest/${base}`);
    if (response.data.result === "error") {
      return respond({ text: `Couldn't find currency ${base}` });
    }

    let rate = response.data.rates[target];
    if (!rate) return respond({ text: `Couldn't find rate for ${target}` });

    let converted = (amount * rate).toFixed(2);
    
    await respond({
      response_type: "in_channel",
      text: `💱 *Currency Conversion*\n💵 *${amount} ${base}* = *${converted} ${target}*\n📊 _Rate: 1 ${base} = ${rate} ${target}_`
    });
  } catch (err) {
    console.error("currency error:", err);
    await respond({ text: "💱 API is down, try again later." });
  }
});

(async () => {
    await app.start();
    console.log("🤖 Slackie is running!");
    console.log(`📅 todaysDate: ${todaysDate}`);
})();
