# Slackie_bot

## This project was built during the [Hack Club Stardance](https://stardance.hackclub.com/home) challenge.


## Why I created this project?

I created project to learn:

- Slack Bot Development
- AI Integration in slack using live web searching 
- JavaScript
- Deploying and hosting applications 

---

## Developed as part of the **StarDance Hack Club** challenge.

What I learned during the process :

I learned how to build a fully functional Slack bot which is hosted live on my own hardware 24x7.I developed many commands which use Open-source API to fetch data and output in a slack channel.I used Google GenAI SDK for gemini integration,Jolpica API for the F1 details,Joke API for jokes,Reddit meme API to output memesa nd many more.When it was time to deploy, instead of using the HackClub Nest server I used my own Raspberry Pi 5 to host my Slack Bot live 24x7 which itself needed lot of learning.Overall it was a great learning experience 

## 📋 Available Commands

<img width="1713" height="495" alt="final devlog slakie_bot commands" src="https://github.com/user-attachments/assets/308fbf43-090d-4a64-8c00-6e32f96fae06" />


### How to test it?

- Join the Slack HackClub workspace.
- use commands in any channel.
- Use slakie in a dedicated channel **#slakie-bot**.
- First use **/my-slakie help** to know all the commands available with slakie


### Notes

- Most commands reply only to the person who runs them.
- Gemini commands may take a few seconds to respond.
- Since I'm using free APIs, some features might occasionally be unavailable.

Have fun trying out Slackie! 

## Installation 

 ### Method 1: 

Install Slakie-bot directly in slack 

-  Install in any workspace -[Install](https://slack.com/oauth/v2/authorize?client_id=2210535565.12011020333188&scope=chat:write,commands,app_mentions:read,channels:history&user_scope=)

 
 ### Method 2 

#### 1. If Node.js,npm and git aren't installed use these commands to install them 
        apt install -y git curl ca-certificates nano
        curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
        apt install -y nodejs
 
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
Fetch your slack app token which starts with 'xapp' and bot token which starts with 'xoxb' from Slack API after creating your app

```env
SLACK_BOT_TOKEN=your_bot_token
SLACK_APP_TOKEN=your_app_token
GEMINI_API_TOKEN=your_gemini_api_token
```

### 4. Start the bot

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
