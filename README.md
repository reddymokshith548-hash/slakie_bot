# Slackie_bot

## This project was built during the Hack Club StarDance challenge.


## Why I created this project?

This project was created to learn:

- Slack Bot Development
- API Integration
- AI Integration
- Error Handling
- Async JavaScript
- Deploying and hosting applications using Hack Club Nest

---

## Developed as part of the **StarDance Hack Club** challenge.

What I learned during the process :

I learned how to build a fully functional Slack bot from the ground up using Node.js and the Slack Bolt framework. Throughout the process, I gained hands-on experience integrating modern AI using the Google GenAI SDK (Gemini) and handling asynchronous data fetching with Axios to connect multiple external REST APIs (like live currency exchange, dictionaries, and F1 schedules). I also learned how to parse complex user inputs using Regular Expressions. On the infrastructure side, I learned how to deploy and host my code on a Raspberry Pi over SSH.

## 📋 Available Commands

<img width="1713" height="495" alt="final devlog slakie_bot commands" src="https://github.com/user-attachments/assets/308fbf43-090d-4a64-8c00-6e32f96fae06" />

## Live Demo & Testing

- Go to hackclub and start trying commands

### How to test it?

- Join the Slack HackClub workspace.
- use commands in any channel.

### Notes

- Most commands reply only to the person who runs them.
- Gemini commands may take a few seconds to respond.
- Since I'm using free APIs, some features might occasionally be unavailable.

Have fun trying out Slackie! 

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/reddymokshith548-hash/slakie_bot.git
cd Slack-Bot
```

### 2. Install dependencies

```bash
npm install
```

### 3. add environment variables

Create a `.env` file:

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
