require("dotenv").config(); // Loads environment variables into process.env before any other code runs
const { GoogleGenAI } = require("@google/genai");
const { App } = require("@slack/bolt");
const axios = require("axios");

const ai = new GoogleGenAI({});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true // Socket mode routes traffic over WebSockets instead of requiring a public HTTP endpoint
});

// Ping function to check bot latency. The latency is calculated as the time taken to acknowledge the command and respond back to the user.
app.command("/my-slakie-ping", async ({ command, ack, respond }) => {
  const start = Date.now();
  await ack(); // Acknowledging the command within 3 seconds is required by Slack, otherwise the user sees a timeout error
  const latency = Date.now() - start;
  await respond({ text: `Pong!\nLatency: ${latency}ms` });
});

app.command("/my-slakie-help", async ({ ack, respond }) => {
  await ack();

  await respond({
    text: `🤖 SlackBot HackClub Commands

📌 Utility
/my-slakie-help - Show all commands
/my-slakie-ping - Check bot latency

🎭 Fun
/my-slakie-joke - Random joke
/my-slakie-meme - Random meme

🌍 Information
/my-slakie-weather [city] - Weather report for a city
/my-slakie-f1 - F1 race information current
🧠 AI   
/my-slakie-gemini [question] - Ask Gemini AI

Made by Mokshith Reddy 🚀`
  });
});

app.command("/my-slakie-gemini", async ({ command, ack, respond }) => {
  await ack();
  const prompt = command.text;

  if (!prompt) {
    await respond({ text: "I think you called me without a question! Usage: `/my-slakie-gemini [your question]`" });
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are Slackie, a helpful Hack Club bot.",
        // Forces the model to always search the web by dropping the threshold to 0
        tools: [{
          googleSearchRetrieval: {
            dynamicRetrievalConfig: {
              mode: "MODE_DYNAMIC",
              dynamicThreshold: 0.0 
            }
          }
        }]
      }
    });
    
    await respond({
      response_type: "in_channel",
      text: `✨ *You asked:* ${prompt}\n\n🤖 *Slackie says:*\n${response.text}`
    });
  } catch (error) {
    console.error(error);
    await respond({ text: "Oops! I couldn't connect to Gemini right now." });
  }
});

app.command("/my-slakie-catfact", async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get("https://catfact.ninja/fact");
    await respond({ text: `Cat Fact:\n${response.data.fact}` });
  } catch (err) {
    await respond({ text: "Failed to fetch a cat fact." });
  }
});

app.command("/my-slakie-joke", async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get("https://official-joke-api.appspot.com/random_joke");
    await respond({
      text: `${response.data.setup}\n\n${response.data.punchline}` // Backticks allow for multi-line strings and variable injection
    });
  } catch (err) {
    await respond({ text: "Hehe, my server is down!catch you next time bro" });
  }
});

app.command("/my-slakie-f1", async ({ ack, respond }) => {
  await ack();
  try {
    const response = await axios.get("https://api.jolpi.ca/ergast/f1/current/next.json");
    const race = response.data.MRData.RaceTable.Races[0];
    
    const today = new Date();
    const raceDate = new Date(race.date);
    
    const timeDiff = raceDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    let hypeMessage = "_Any guesses for the World Champion 2026!_";
    
    if (daysDiff >= 0 && daysDiff <= 7) {
        hypeMessage += "\n🏎️💨 *It's Race Week less go!*";
    }

    await respond({ 
      response_type: "in_channel", // This parameter makes the bot's response visible to everyone in the channel, not just the user who called it
      text: `🏎️ *Next F1 Race:* ${race.raceName} at ${race.Circuit.circuitName}\n📅 *Date:* ${race.date} ${race.time}\n${hypeMessage}`  
    });
  } catch (err) {
    await respond({ text: "So sorry, I couldn't fetch the F1 data right now." });
  }
});

// Find the meaning of the word 

app.command("/my-slakie-define", async({command,ack, respond })=> {
  await ack();
  const word = command.text.trim();

  if(!word){
    return respond({ text: "I think you forgot the word! Usuage: '/my-slakie-define word"});
  }
  try {
    const res = await axios.get('http://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}');
    const data =res.data[0];
    const meaning = data.meaning[0];
    const definiton = meaning.definitions[0].definition;

    await respond({
      response_type: "in_channel",
      text:'📖 *${data.word}* _(${meaning.partOfSpeech})_\n*Definition:* ${definition}'
    });
  } catch (err) {
    await respond({ text: 'I could not find a definition for "${word}".'});
  }
});

// QR code generator
app.command("/my-slakie-qr", async ({ command, ack, respond}) =>{
  await ack();
  const input =command.text.trim();

  if(!input) {
    return respond({ text: "What should i encode? Usuage:/my-slakie-qr [link]"})
  }
  // the API generates an image on the fly based on the URL parameters
  const qurl = 'https://api.qrserver.com/v1/create-qr-code/?/size=250x250&data=${encodeURIComponent(input)}';0

  try{
    await respond({
      response_type: "in_channel",
      blocks:[
        {
          type: "selection",
          text: {
            type: "mrkdwn",
            text: '📱 Here is the QR code for: *${input}*'
        }
      },
      {
        type: "image",
        image_url: qurl,
        alt_text: "Generated QR Code"
      }
    ]
    });
  }catch (err) {
    await respond({ text: "Failed to generate the QR Code"});
  }
});

// This function lets you do quick math or convert units
app.command("/my-slakie-convert", async ({ command ,ack ,respond }) => {
  await ack();
  const expression = command.text.trim();

  if (!expression){
    return respond({ text: "What should i calculate ? Usage: '/my-slakie-calc [expression]"});
  }
  
  try {
    const res = await axios.get('https://api.mathjs.org/v4/?expr=${encodeURIComponent(expression)}');
    await respond({
      response_type: "in_channel",
      text:'🧮 *Expression:* \`${expression}\`\n*Result:* ${res.data}'
    });
  }catch (err) {
    await respond({ text: "I could not calculate that.make sure your expression is formatted correctly!"});
  }
});

// Currency Converter using Open Exchange Rates API 
app.command("/my-slakie-currency",async ({ command, ack, respond}) =>{
  await ack();

  // Format should be like : USD to EUR 
  const input = command.text.trim().toUpperCase().split(" TO ");

  if(input.length !==2) {
    return respond({ text: "Invalid format Usage :'/my-slakie-currency [BASE] to [TARGET]' "});
  }

  const base = input[0].trim();
  const target = input[1].trim();

  try {
    const res =await axios.get('https://open.er-api.com/v6/latest/${base}');

    if (res.data.result === "error") {
       return respond({ text: "Failed to find that base currency. Try standard 3-letter codes like USD or GBP." });
    }
    
    const rate = res.data.rates[target];

      if(!rate) {
        return respond({ text: 'I could not find a conversion rate for ${target}.'});
      }
      await respond({
        response_type: "in_channel",
        text: '*Currency Exchange:*\n1 ${base} = *${rate} ${target}*\n_Data updated last: ${res.data.time_last_update_utc.substring(0, 16)}_  Made using Open Exchange Rates API'
      });
  } catch(err) {
    await respond({ text: "Sorry bro, i couldn't fecth currency rates right now.Let's try again later"});
  }
});

// This Immediately Invoked Function Expression (IIFE) must remain at the root level to boot the app
(async () => {
  await app.start();
  console.log("Your slakie bot is running!");
});
