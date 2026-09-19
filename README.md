# <img width="100" height="100" alt="Black and Blue Minimalist Ai tech Logo" src="https://github.com/user-attachments/assets/af0f1937-bc86-4c85-9f13-d873601d612e" /> Slakie_bot

## This project was built during the [Hack Club Stardance](https://stardance.hackclub.com/home) challenge.


## I created project to learn:

- Slack Bot Development
- JavaScript

---

## What I learned during the process :

- I learned how to build a fully functional Slack bot which is hosted live on my own hardware 24x7 which fetches live Formula 1 data, generates memes, jokes, generates QR code, solves math expressions and uses the Google Gemini SDK to answer questions directly in Slack.

- I used Google GenAI SDK for gemini integration,Jolpica API for the F1 details,Joke API for jokes,Reddit meme API to output memesa nd many more.

- When it was time to deploy, instead of using the HackClub Nest server I used my own Raspberry Pi 5 to host my Slack Bot live 24x7 which itself needed lot of learning.

- I faced a lot of challenges with integrating Gemini, it used to always output old and outdated information until i realized that it needed a separate seraching function.Overall it was a great learning experience.

## 📋 Available Commands

| Command | Category | Description |
| :--- | :--- | :--- |
| `/my-slakie help` |  Utility | Shows all available commands |
| `/my-slakie ping` |  Utility | Check bot latency |
| `/my-slakie joke` |  Fun | Get a random joke |
| `/my-slakie meme` |  Fun | Get a random meme |
| `/my-slakie f1` | 🏎 Information | Next F1 race info |
| `/my-slakie define [word]` |  Information | Define a word |
| `/my-slakie math [expression]` | Tools | Math & unit calculation without variables |
| `/my-slakie currency [amount] [BASE] to [TARGET]` | Tools | Currency conversion using Offical Currency codes |
| `/my-slakie qr [link]` |  Tools | Generate a QR code by attaching a link |
| `/my-slakie gemini [question]` | 🤖 AI | Ask Slakie a question using Gemini |


### How to test it?

- Join the Slack HackClub workspace.
- use commands in any channel.
- Use slakie in a dedicated channel [**#slakie-bot**](https://hackclub.enterprise.slack.com/archives/C0C16D3SXCK)
- First use **/my-slakie help** to know all the commands available with slakie


### Notes

- Gemini commands may take a few seconds to respond.
- ## Since I'm using free APIs, some features might occasionally be unavailable.

## Have fun trying out Slakie! 

## Installation 

 ### Method 1: 

Install Slakie-bot directly in slack 

-  Install in any workspace -[Install](https://slack.com/oauth/v2/authorize?client_id=2210535565.12011020333188&scope=chat:write,commands,app_mentions:read,channels:history&user_scope=)

 
 ### Method 2 

#### 1. Make sure you have [Node.js](https://nodejs.org/) and [Git](https://git-scm.com/) installed in your selected device 

#### 2. Clone the repository in your device 

```bash
git clone https://github.com/reddymokshith548-hash/slakie_bot.git
cd slackie_bot
```

### 3. Install dependencies

```bash
npm install
```

### 4. add environment variables

Create a `.env` file:
Fetch your slack app token which starts with 'xapp' and bot token which starts with 'xoxb' from Slack API after creating your app and also your Gemini API key to use Gemini Features

```env
SLACK_BOT_TOKEN=your_bot_token
SLACK_APP_TOKEN=your_app_token
GEMINI_API_TOKEN=your_gemini_api_token
```

### 5. Start the bot

```bash
node index.js
```

---

## 🛠 Built With

- Node.js
- Slack Bolt
- Google Gemini API
- Axios
- Reddit meme API
- Official Joke API
- Jolpica API for the F1 details
- QR Code API to generate QR codes
- Math.js API for evaluating math expressions
- Exchange Rate API for currency converter
