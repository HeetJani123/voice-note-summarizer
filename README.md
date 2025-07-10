# Voice Note Summarizer

A modern web application that allows you to record voice notes, transcribe them using the Web Speech API, and generate AI-powered summaries using Cohere AI.

## Features

- 🎤 **Voice Recording**: Record audio using your microphone with real-time transcription
- 📝 **Live Transcription**: See your speech converted to text in real-time
- 🤖 **AI Summarization**: Generate concise summaries using Cohere AI
- 🔊 **Audio Playback**: Replay your original recordings with a custom audio player
- 📋 **Copy & Download**: Copy transcriptions and summaries to clipboard or download them
- 🎨 **Modern UI**: Clean, responsive design with Tailwind CSS
- 📱 **Mobile Friendly**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **APIs**: Web Speech API, MediaRecorder API, Cohere AI API
- **Styling**: Tailwind CSS with custom components
- **Deployment**: Vercel-ready

## Prerequisites

- Node.js 18+ 
- A Cohere AI API key (free tier available)

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd voicenote
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   COHERE_API_KEY=your_cohere_api_key_here
   ```
   
   Get your free API key from [Cohere AI](https://cohere.ai/)

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## How to Use

1. **Start Recording**: Click the "Start Recording" button and allow microphone access
2. **Speak**: Talk into your microphone - you'll see live transcription
3. **Stop Recording**: Click "Stop Recording" when finished
4. **Review**: Listen to your original audio and review the transcription
5. **Summarize**: Click "Summarize" to generate an AI summary
6. **Export**: Copy or download the transcription and summary

## Browser Compatibility

This application requires modern browsers that support:
- Web Speech API (`webkitSpeechRecognition`)
- MediaRecorder API
- getUserMedia API

**Supported browsers:**
- Chrome 66+
- Edge 79+
- Safari 14.1+
- Firefox 75+

## API Configuration

### Cohere AI Setup

1. Sign up at [cohere.ai](https://cohere.ai/)
2. Get your API key from the dashboard
3. Add it to your `.env.local` file

The app uses Cohere's `summarize-xlarge` model for high-quality summaries.

## Project Structure

```
voicenote/
├── app/
│   ├── components/
│   │   ├── VoiceRecorder.js      # Voice recording component
│   │   ├── TranscriptionDisplay.js # Transcription display
│   │   ├── SummaryDisplay.js     # Summary display
│   │   └── AudioPlayer.js        # Custom audio player
│   ├── api/
│   │   └── summarize/
│   │       └── route.js          # Cohere AI API endpoint
│   ├── globals.css               # Global styles
│   ├── layout.js                 # Root layout
│   └── page.js                   # Main page component
├── public/                       # Static assets
├── package.json                  # Dependencies
├── tailwind.config.js           # Tailwind configuration
└── README.md                    # This file
```

## Customization

### Styling
- Modify `tailwind.config.js` to change colors and theme
- Update `app/globals.css` for custom component styles

### API Configuration
- Change the Cohere model in `app/api/summarize/route.js`
- Adjust summary length and format parameters

### Features
- Add more export formats in the components
- Implement user authentication
- Add voice note history and storage

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your `COHERE_API_KEY` to Vercel environment variables
4. Deploy!

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform

## Troubleshooting

### Microphone Access Issues
- Ensure your browser has permission to access the microphone
- Try refreshing the page and allowing permissions again
- Check that your microphone is working in other applications

### API Errors
- Verify your Cohere API key is correct
- Check that you have sufficient API credits
- Ensure the API key is properly set in environment variables

### Browser Compatibility
- Use Chrome, Edge, or Safari for best compatibility
- Firefox may have limited Web Speech API support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify your API key is correct
3. Ensure you're using a supported browser
4. Open an issue on GitHub with details

---

**Note**: This application requires an active internet connection for the Cohere AI summarization feature. 