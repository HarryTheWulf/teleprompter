# Teleprompter

A minimal web application built with **Astro**, **React**, and **Tailwind CSS** that helps you practice your reading pace and delivery using a live teleprompter.

## Features

- **Script Input**: Paste or type your script directly into the app.
- **Speed Measurement**: Read your text while timing yourself to calculate your natural Words Per Minute (WPM) speed.
- **Teleprompter**: Play back your script at your calculated WPM. The teleprompter highlights the active word and automatically scrolls. It also smartly adds small pauses for punctuation!
- **Time Target estimation**: See an estimated read time based on your text length and WPM to ensure you meet target time constraints. If you set a time target, it will also calculate the exact WPM required to finish the passage in that time limit.

## Getting Started

First, ensure you have Node.js installed, then clone the repository and run the commands below:

```sh
# Install dependencies
npm install

# Start the development server
npm run dev
```

Your app should now be running at `http://localhost:4321`.

## Commands

All commands are run from the root of the project:

| Command           | Action                                  |
|-------------------|-----------------------------------------|
| `npm install`     | Installs dependencies                   |
| `npm run dev`     | Starts local dev server                 |
| `npm run build`   | Build your production site to `./dist/` |
| `npm run preview` | Preview your build locally              |

## TODO

- [ ] Add a feature to save scripts to local storage
- [ ] Scroll the prompter so that the current active line is centred.
