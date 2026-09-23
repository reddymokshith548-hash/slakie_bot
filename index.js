require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");
const { App } = require("@slack/bolt");
const axios = require("axios");

const ai = new GoogleGenAI({});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});





app.command("/my-slakie-ping", async ({ command, ack, respond }) => {
  const start = Date.now();
  await ack();
  const latency = Date.now() - start;
  await respond({ text: `Pong!\nLatency: ${latency}ms` });
});



function getSources(response) {
  try {
    let chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (!chunks || chunks.length === 0) return "";

    let links = [];
    for (let i = 0; i < chunks.length; i++) {
      let web = chunks[i].web;
      if (web && web.uri) {
        links.push(`• <${web.uri}|${web.title || "source"}>`);
      }
    }

    if (links.length === 0) return "";
    return `\n\n*Sources:*\n${links.join("\n")}`;
  } catch (err) {
    console.log("couldn't grab sources.");
    return "";
  }
}

app.command("/my-slakie-help", async ({ ack, respond }) => 
    {
  await ack();
  await respond({
     response_type: "in_channel",
    text: `🤖 *Slackie — Hack Club Bot*
     *Utility*
    /my-slakie-help - Show all commands
    /my-slakie-ping - Check bot latency

     *Fun*
    /my-slakie-joke - Random joke
    /my-slakie-meme - Random meme

    *Information*
    /my-slakie-f1 - Next F1 race info
    /my-slakie-define [word] - Define a word

     *Tools*
    /my-slakie-math [expression] - Math & unit calc
    /my-slakie-currency [amount] [BASE] to [TARGET] - Currency conversion
    /my-slakie-qr [link] - Generate a QR code

     *AI*
    /my-slakie-gemini [question] - Ask Slackie a question

    Made by Pondugula Mokshith Reddy`,
  
  });
});


app.command("/my-slakie-gemini", async ({ command, ack, respond }) => {
  await ack();
  let question = command.text.trim();

  if (!question) {
      return respond({ text: `What bro no question me today , huhh ` });
    }
    try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: question,
      
      config: {
        systemInstruction: "You're Slackie, a Hack Club bot. Search when it's something current — news, prices, sports. Keep answers short.",
        
        tools: [{ googleSearch: {} }],
      },
    });
    let answer = response.text || "I m sick.Catch me next time ";
    let sources = getSources(response);

    await respond({
      response_type: "in_channel",
      text: `✨ *You asked:*\n${question}\n\n🤖 *Slackie says:*\n${answer}${sources}`,
    });
}catch (err) {
  console.log(err.message);
  await respond({ text: "😭 I couldn't connect to gemini.The model is in High demand now, try again later"});
    }
});

// F1 command
app.command("/my-slakie-f1", async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get("https://api.jolpi.ca/ergast/f1/current/next.json");
    let races = response.data?.MRData?.RaceTable?.Races;

    if (!races || races.length === 0) {
      return respond({ text: "End of season my frd,why are you still here" });
    }

    let race = races[0];
    let raceDate = new Date(`${race.date}T${race.time || "00:00:00"}`);
    let daysDiff = Math.ceil((raceDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    let message = "_Any guesses for the World Champ?_";
    if (daysDiff >= 0 && daysDiff <= 7) {
      message += "\n🏎️ *It's Race Week! LESS GOOO!*";
    }
    await respond({
      response_type: "in_channel",
      text: `🏎️ *Next F1 Race*\n *Race:* ${race.raceName}\n *Circuit:* ${race.Circuit.circuitName}\n Location: ${race.Circuit.Location.locality}\n Race Date: ${new Date(race.date).toLocaleDateString('en-US', { dateStyle: 'long' })}\n Time: ${race.time || "TBD"}\n\n${message}`,
    });
  } catch (err) {

    await respond({ text: "🏎️ api is down" });
  }
});

app.command("/my-slakie-define", async ({ command, ack, respond }) => {
  await ack();
  const word = command.text.trim();
  if (!word) return respond({ text: "Usage: `/my-slakie-define [word]`" });

  try {
    const { data } = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    const meaning = data[0]?.meanings[0];
    const def = meaning?.definitions[0]?.definition;
    if (!def) return respond({ text: `Not in my database. ${word}` });

    const example = meaning.definitions[0]?.example;
    let txt = `*${data[0].word}* _(${meaning.partOfSpeech})_\n*Definition:*\n${def}`;
    if (example) txt += `\n*Example:*\n_${ex}_`;

    await respond({
      response_type: "in_channel",
      text: txt });
  } catch {
    await respond({ text: `hm, couldn't find anything for "${word}" — might be misspelled` });
  }
});
 

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


app.command("/my-slakie-math", async ({ command, ack, respond }) => {
  await ack();
  let exp = command.text.trim();
  if (!exp) return respond({ 
    text: "Usage: `/my-slakie-math [expression]`" });
  try {
    const response = await axios.get(`https://api.mathjs.org/v4/?expr=${encodeURIComponent(exp)}`);
    await respond({
      response_type: "in_channel",
      text: `🧮 *Math:*\n\`${exp}\` = \`${response.data}\``});
  } catch (err) {
    await respond({ 
      text: "i can only accept numbers no variables and check your format"});}
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
  } catch (err) {await respond({ text: "no memes available right now" });}
});

app.command("/my-slakie-joke", async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get("https://official-joke-api.appspot.com/random_joke");
    await respond({
      response_type: "in_channel",
      text:
      `${response.data.setup}
      
      ${response.data.punchline}`
    });
  } catch (err) {
    await respond({ text: "Couldn't find a joke right now." });
  }
});


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
  } 
  
  else if (parts.length === 4 && parts[2] === "to") {
    amount = parseFloat(parts[0]) || 1;
    base = parts[1].toUpperCase();
    target = parts[3].toUpperCase();
  } 
  
  else {
    return respond({ text: "Wrong format. Usage: `/my-slakie-currency [amount] [BASE] to [TARGET]`" });
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
      text:
      ` *Currency Conversion* \n *${amount} ${base}* = *${converted} ${target}*\n _Rate 1${base} =${rate} ${target}_`
    });
    }catch(err){
      await respond({ text:"Try again later.Service is down"});
    }
  });
    
    

(async () => {
  await app.start();
  console.log("bot is running!");
})();