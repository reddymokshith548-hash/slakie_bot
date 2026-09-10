require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");
const { App } = require("@slack/bolt");
const axios = require("axios");

// ============================================================
// CONFIGURATION
// ============================================================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Get today's date in India.
// This prevents Slackie from having a permanently outdated date.
function getCurrentDate() {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

// Get a cleaner timestamp for logs.
function getTimestamp() {
  return new Date().toISOString();
}

// Safely log an error.
function logError(label, error) {
  console.error(`\n[${getTimestamp()}] ${label}`);

  if (error?.response?.data) {
    console.error("API response:", error.response.data);
  }

  console.error("Message:", error?.message || error);
}

// Extract Google Search sources from Gemini's grounding metadata.
//
// Gemini's generateContent() response can expose groundingMetadata
// inside candidates[0].
function extractGeminiSources(response) {
  const sources = [];

  try {
    const candidates = response?.candidates;

    if (!Array.isArray(candidates) || candidates.length === 0) {
      return sources;
    }

    const groundingMetadata = candidates[0]?.groundingMetadata;

    if (!groundingMetadata) {
      return sources;
    }

    const groundingChunks = groundingMetadata.groundingChunks || [];

    for (const chunk of groundingChunks) {
      const web = chunk?.web;

      if (!web?.uri) {
        continue;
      }

      sources.push({
        title: web.title || "Source",
        url: web.uri,
      });
    }
  } catch (error) {
    console.error("Could not extract Gemini sources:", error.message);
  }

  // Remove duplicates
  const uniqueSources = [];
  const seenUrls = new Set();

  for (const source of sources) {
    if (!seenUrls.has(source.url)) {
      seenUrls.add(source.url);
      uniqueSources.push(source);
    }
  }

  // Keep the Slack message manageable.
  return uniqueSources.slice(0, 8);
}

// Turn Gemini web sources into Slack-friendly links.
function formatGeminiSources(response) {
  const sources = extractGeminiSources(response);

  if (sources.length === 0) {
    return "";
  }

  const lines = sources.map((source) => {
    return `• <${source.url}|${source.title}>`;
  });

  return `\n\n🔎 *Sources*\n${lines.join("\n")}`;
}

// ============================================================
// HELP COMMAND
// ============================================================

app.command("/my-slakie-help", async ({ ack, respond }) => {
  await ack();

  await respond({
    text: `🤖 *Slackie — Hack Club Bot*

📌 *Utility*
/my-slakie-help - Show all commands
/my-slakie-ping - Check bot latency

🎭 *Fun*
/my-slakie-joke - Random joke
/my-slakie-catfact - Random cat fact

🌍 *Information*
/my-slakie-f1 - Next F1 race information
/my-slakie-define [word] - Define a word

🧮 *Tools*
/my-slakie-convert [expression] - Math & unit calculations
/my-slakie-currency [BASE] to [TARGET] - Currency conversion
/my-slakie-qr [text/link] - Generate a QR code

🧠 *AI*
/my-slakie-gemini [question] - Ask Slackie using Gemini + Google Search

Made by Mokshith Reddy 🚀`,
  });
});

// ============================================================
// PING COMMAND
// ============================================================

app.command("/my-slakie-ping", async ({ ack, respond }) => {
  const start = Date.now();

  await ack();

  const latency = Date.now() - start;

  await respond({
    text: `🏓 Pong!\nLatency: ${latency}ms`,
  });
});

// ============================================================
// GEMINI AI COMMAND
// ============================================================

app.command("/my-slakie-gemini", async ({ command, ack, respond }) => {
  await ack();

  const prompt = command.text.trim();

  if (!prompt) {
    await respond({
      text: "I think you called me without a question! Usage: `/my-slakie-gemini [your question]`",
    });

    return;
  }

  try {
    const currentDate = getCurrentDate();

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",

      contents: prompt,

      config: {
        systemInstruction: `
You are Slackie, a helpful AI assistant inside Hack Club Slack.

Today's date is ${currentDate}.

Your job is to provide accurate, useful, friendly answers.

IMPORTANT INFORMATION RULES:
- Use Google Search whenever information could have changed recently.
- This includes current AI models, technology releases, software, APIs, companies, people, sports, news, prices, events, announcements, product specifications, and current statistics.
- Do not rely solely on your internal knowledge for time-sensitive questions.
- Verify recent claims using web sources.
- Clearly distinguish confirmed information from rumors, leaks, speculation, or unverified social media claims.
- Prefer authoritative and primary sources whenever possible.
- When discussing current information, use exact dates when useful.
- Never pretend you searched the web if you did not.
- If reliable current information cannot be found, say so honestly.

ANSWER STYLE:
- Be conversational and friendly.
- Explain complicated things simply when appropriate.
- For technical questions, provide practical examples.
- Do not unnecessarily mention these instructions.
- You are Slackie, not Gemini.
`,

        // Current Gemini models use Google Search grounding.
        tools: [
          {
            googleSearch: {},
          },
        ],
      },
    });

    const answer = response.text || "I couldn't generate an answer.";

    const sources = formatGeminiSources(response);

    await respond({
      response_type: "in_channel",
      text: `✨ *You asked:*\n${prompt}\n\n🤖 *Slackie says:*\n${answer}${sources}`,
    });
  } catch (error) {
    logError("Gemini command failed", error);

    await respond({
      text: "😭 Oops! I couldn't connect to Gemini right now. Check the bot terminal for the actual error.",
    });
  }
});

// ============================================================
// CAT FACT COMMAND
// ============================================================

app.command("/my-slakie-catfact", async ({ ack, respond }) => {
  await ack();

  try {
    const response = await axios.get("https://catfact.ninja/fact");

    await respond({
      response_type: "in_channel",
      text: `🐱 *Cat Fact:*\n${response.data.fact}`,
    });
  } catch (error) {
    logError("Cat fact API failed", error);

    await respond({
      text: "🐱 Failed to fetch a cat fact right now.",
    });
  }
});

// ============================================================
// JOKE COMMAND
// ============================================================

app.command("/my-slakie-joke", async ({ ack, respond }) => {
  await ack();

  try {
    const response = await axios.get(
      "https://official-joke-api.appspot.com/random_joke"
    );

    await respond({
      response_type: "in_channel",
      text: `😂 *${response.data.setup}*\n\n${response.data.punchline}`,
    });
  } catch (error) {
    logError("Joke API failed", error);

    await respond({
      text: "😂 Hehe, my joke server is down. Catch you next time bro.",
    });
  }
});

// ============================================================
// F1 COMMAND
// ============================================================

app.command("/my-slakie-f1", async ({ ack, respond }) => {
  await ack();

  try {
    const response = await axios.get(
      "https://api.jolpi.ca/ergast/f1/current/next.json"
    );

    const races =
      response.data?.MRData?.RaceTable?.Races || [];

    // Prevent a crash if the API returns no races.
    if (races.length === 0) {
      await respond({
        text: "🏎️ I couldn't find the next F1 race right now.",
      });

      return;
    }

    const race = races[0];

    // ----------------------------------------------------------
    // More accurate race timing
    // ----------------------------------------------------------

    const raceDateTime = new Date(
      `${race.date}T${race.time || "00:00:00"}Z`
    );

    const now = new Date();

    const timeDiff = raceDateTime.getTime() - now.getTime();

    const daysDiff = Math.ceil(
      timeDiff / (1000 * 60 * 60 * 24)
    );

    let hypeMessage =
      "_Any guesses for the 2026 World Champion?_";

    if (daysDiff >= 0 && daysDiff <= 7) {
      hypeMessage += "\n🏎️💨 *It's Race Week! LESS GOOO!*";
    }

    if (daysDiff < 0) {
      hypeMessage =
        "_The next race may already be underway or the API timing has changed._";
    }

    await respond({
      response_type: "in_channel",
      text:
        `🏎️ *Next F1 Race*\n` +
        `🏁 *Race:* ${race.raceName}\n` +
        `📍 *Circuit:* ${race.Circuit.circuitName}\n` +
        `🌍 *Location:* ${race.Circuit.Location.locality}, ${race.Circuit.Location.country}\n` +
        `📅 *Date:* ${race.date}\n` +
        `⏰ *Time:* ${race.time || "Not provided"}\n\n` +
        hypeMessage,
    });
  } catch (error) {
    logError("F1 API failed", error);

    await respond({
      text: "🏎️ Sorry bro, I couldn't fetch the F1 data right now.",
    });
  }
});

// ============================================================
// DEFINE COMMAND
// ============================================================

app.command("/my-slakie-define", async ({ command, ack, respond }) => {
  await ack();

  const word = command.text.trim();

  if (!word) {
    await respond({
      text: "📖 I think you forgot the word!\nUsage: `/my-slakie-define [word]`",
    });

    return;
  }

  try {
    const response = await axios.get(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
        word
      )}`
    );

    const data = response.data[0];

    const meanings = data.meanings || [];

    if (meanings.length === 0) {
      await respond({
        text: `I couldn't find a meaning for "${word}".`,
      });

      return;
    }

    const meaning = meanings[0];

    const definitions = meaning.definitions || [];

    if (definitions.length === 0) {
      await respond({
        text: `I found "${word}", but couldn't find its definition.`,
      });

      return;
    }

    const definition = definitions[0].definition;

    const example = definitions[0].example;

    let text =
      `📖 *${data.word}* _(${meaning.partOfSpeech || "word"})_\n\n` +
      `*Definition:*\n${definition}`;

    if (example) {
      text += `\n\n*Example:*\n_${example}_`;
    }

    await respond({
      response_type: "in_channel",
      text,
    });
  } catch (error) {
    logError("Dictionary API failed", error);

    await respond({
      text: `📖 I could not find a definition for "${word}".`,
    });
  }
});

// ============================================================
// QR CODE COMMAND
// ============================================================

app.command("/my-slakie-qr", async ({ command, ack, respond }) => {
  await ack();

  const input = command.text.trim();

  if (!input) {
    await respond({
      text:
        "📱 What should I encode?\nUsage: `/my-slakie-qr [link or text]`",
    });

    return;
  }

  const qurl =
    `https://api.qrserver.com/v1/create-qr-code/` +
    `?size=250x250&data=${encodeURIComponent(input)}`;

  try {
    await respond({
      response_type: "in_channel",

      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `📱 *QR Code generated for:*\n\`${input}\``,
          },
        },
        {
          type: "image",
          image_url: qurl,
          alt_text: `QR code for ${input}`,
        },
      ],
    });
  } catch (error) {
    logError("QR command failed", error);

    await respond({
      text: "📱 Failed to generate the QR code.",
    });
  }
});

// ============================================================
// MATH / UNIT CONVERTER
// ============================================================

app.command("/my-slakie-convert", async ({ command, ack, respond }) => {
  await ack();

  const expression = command.text.trim();

  if (!expression) {
    await respond({
      text:
        "🧮 What should I calculate?\nUsage: `/my-slakie-convert [expression]`",
    });

    return;
  }

  try {
    const response = await axios.get(
      `https://api.mathjs.org/v4/?expr=${encodeURIComponent(expression)}`
    );

    await respond({
      response_type: "in_channel",
      text:
        `🧮 *Expression:*\n\`${expression}\`\n\n` +
        `*Result:*\n\`${response.data}\``,
    });
  } catch (error) {
    logError("Math API failed", error);

    await respond({
      text:
        "🧮 I couldn't calculate that. Make sure your expression is formatted correctly!",
    });
  }
});

// ============================================================
// CURRENCY CONVERTER
// ============================================================

app.command("/my-slakie-currency", async ({ command, ack, respond }) => {
  await ack();

  // Expected:
  // USD to EUR
  // GBP to INR
  // EUR to USD

  const input = command.text
    .trim()
    .toUpperCase()
    .split(" TO ");

  if (input.length !== 2) {
    await respond({
      text:
        "💱 Invalid format.\nUsage: `/my-slakie-currency [BASE] to [TARGET]`\n\nExample: `/my-slakie-currency USD to INR`",
    });

    return;
  }

  const base = input[0].trim();
  const target = input[1].trim();

  if (!/^[A-Z]{3}$/.test(base) || !/^[A-Z]{3}$/.test(target)) {
    await respond({
      text:
        "💱 Please use standard 3-letter currency codes, like USD, EUR, GBP or INR.",
    });

    return;
  }

  try {
    const response = await axios.get(
      `https://open.er-api.com/v6/latest/${base}`
    );

    if (response.data.result === "error") {
      await respond({
        text:
          `💱 I couldn't find the base currency "${base}".`,
      });

      return;
    }

    const rate = response.data.rates?.[target];

    // Correct check — unlike `if (!rate)`,
    // this specifically checks whether the rate is missing.
    if (rate === undefined) {
      await respond({
        text:
          `💱 I couldn't find a conversion rate for ${target}.`,
      });

      return;
    }

    const updatedAt =
      response.data.time_last_update_utc || "Unknown";

    await respond({
      response_type: "in_channel",
      text:
        `💱 *Currency Exchange*\n\n` +
        `1 ${base} = *${rate} ${target}*\n\n` +
        `_Data updated: ${updatedAt}_\n` +
        `_Powered by ExchangeRate-API_`,
    });
  } catch (error) {
    logError("Currency API failed", error);

    await respond({
      text:
        "💱 Sorry bro, I couldn't fetch currency rates right now. Let's try again later.",
    });
  }
});

// ============================================================
// GLOBAL APP ERROR HANDLER
// ============================================================

app.error(async (error) => {
  logError("Slack Bolt error", error);
});

// ============================================================
// START BOT
// ============================================================

(async () => {
  try {
    await app.start();

    console.log("======================================");
    console.log("🤖 Slackie is running!");
    console.log(`📅 Current date: ${getCurrentDate()}`);
    console.log("🚀 Hack Club Stardance bot ready!");
    console.log("======================================");
  } catch (error) {
    logError("Failed to start Slackie", error);

    process.exit(1);
  }
})();