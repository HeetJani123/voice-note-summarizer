# Setup Guide for Voice Note Summarizer

## Prerequisites Installation

### 1. Install Node.js

**Option A: Download from Official Website**
1. Go to [nodejs.org](https://nodejs.org/)
2. Download the LTS version (recommended)
3. Run the installer and follow the setup wizard
4. Restart your terminal/command prompt

**Option B: Using Chocolatey (Windows)**
```powershell
# Install Chocolatey first if you don't have it
# Then run:
choco install nodejs
```

**Option C: Using Winget (Windows 10/11)**
```powershell
winget install OpenJS.NodeJS
```

### 2. Verify Installation
After installation, restart your terminal and run:
```bash
node --version
npm --version
```

Both commands should return version numbers.

## Project Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create a `.env.local` file in the project root:
```env
COHERE_API_KEY=your_cohere_api_key_here
```

**Get your Cohere API key:**
1. Go to [cohere.ai](https://cohere.ai/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Replace `your_cohere_api_key_here` with your actual API key

### 3. Start Development Server
```bash
npm run dev
```

### 4. Open in Browser
Navigate to [http://localhost:3000](http://localhost:3000)

## Troubleshooting

### Node.js Installation Issues
- **"node is not recognized"**: Restart your terminal after installation
- **Permission errors**: Run terminal as administrator
- **Path issues**: Ensure Node.js is added to your system PATH

### npm Installation Issues
- **"npm is not recognized"**: Usually fixed by restarting terminal
- **Network errors**: Check your internet connection
- **Proxy issues**: Configure npm proxy settings if needed

### Project Issues
- **Port 3000 in use**: The app will automatically use the next available port
- **API key errors**: Ensure your `.env.local` file is in the project root
- **Browser compatibility**: Use Chrome, Edge, or Safari for best results

## Alternative Installation Methods

### Using Node Version Manager (nvm)
```bash
# Install nvm-windows first
# Then:
nvm install latest
nvm use latest
```

### Using Volta
```bash
# Install Volta first
# Then:
volta install node
volta install npm
```

## Next Steps

1. **Test the application**: Try recording a voice note
2. **Customize**: Modify colors in `tailwind.config.js`
3. **Deploy**: Push to GitHub and deploy on Vercel
4. **Extend**: Add more features like voice note history

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify Node.js and npm are properly installed
3. Ensure your API key is correct
4. Try using a different browser

---

**Note**: This application requires a modern browser with microphone access and an internet connection for the AI summarization feature. 