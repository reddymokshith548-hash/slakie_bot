require("dotenv").config(); // Loads environment variables into process.env before any other code runs
const { GoogleGenAI } = require("@google/genai");
const { App } = require("@slack/bolt");
const axios = require("axios");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
/my-slakie-f1 - F1 race information for a city

🧠 AI   
/my-slakie-gemini [question] - Ask Gemini AI

Made by Mokshith Reddy 🚀`
  });
});
app.command("/my-slakie-gemini", async ({ command, ack, respond }) => {
  await ack();
  const prompt = command.text;

  if (!prompt) {
    await respond({ text: "I Think You Just Call Me! Without Any Question : `/my-slakie-gemini [your question]`" });
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro", 
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }] // This line gives Slackie live internet access
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

app.command("/my-slakie-funfact", async ({ ack, respond }) => {
  await ack();
  console.log('Fetching A funcFact')
  try {
    const response = await axios.get("https://uselessfacts.jsph.pl/api/v2/facts/random");

    console.log(response.data);

    await respond(response.data.text)

  } catch (err) {

    await respond("Failed to fetch a Fun Fact (Partner Server Issue).");
    console.log("Something went wrong", err)

  }
})

// This Immediately Invoked Function Expression (IIFE) must remain at the root level to boot the app
(async () => {
  await app.start();
  console.log("bot is running!");
})();

