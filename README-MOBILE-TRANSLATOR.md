# Using the Real-Time Translator on Mobile Devices

This guide explains how to set up and use the real-time translator on mobile devices.

## Setup for Mobile Testing

### Step 1: Start the LibreTranslate Server

1. On your computer, run the LibreTranslate server:
   - Windows: Run `start-translator.bat`
   - macOS/Linux: Run `./start-translator.sh`
2. Wait for the server to finish downloading language models (first run only)
3. Verify the server is running by opening http://localhost:5000 in your browser

### Step 2: Find Your Computer's IP Address

1. **On Windows**:
   - Open Command Prompt
   - Type `ipconfig` and press Enter
   - Look for "IPv4 Address" under your active network connection (e.g., 192.168.1.X)

2. **On macOS**:
   - Open System Preferences > Network
   - Select your active connection
   - Your IP address will be displayed (e.g., 192.168.1.X)

3. **On Linux**:
   - Open Terminal
   - Type `hostname -I` and press Enter
   - The first address is usually your local IP (e.g., 192.168.1.X)

### Step 3: Update the Code with Your IP Address

1. Open these two files:
   - `Project-MWS-01/app/(tabs)/voice-translator.tsx`
   - `Project-MWS-01/components/TranslatorFooter.tsx`

2. In both files, update the `LIBRE_TRANSLATE_API_URL` constant:
   ```typescript
   // Comment out the existing line
   // const LIBRE_TRANSLATE_API_URL = 'http://10.0.2.2:5000'; // For Android emulator
   
   // Uncomment and update this line with your IP address
   const LIBRE_TRANSLATE_API_URL = 'http://YOUR_COMPUTER_IP:5000'; // For physical devices
   ```
   Replace `YOUR_COMPUTER_IP` with your actual IP address (e.g., 192.168.1.X)

### Step 4: Make Sure Your Mobile Device is on the Same Network

1. Connect your mobile device to the same Wi-Fi network as your computer
2. Ensure your computer's firewall allows connections on port 5000

## Using the Translator

1. **Start the App**:
   - Run your app on your mobile device
   - You should see the blue "Translator" button at the bottom of the screen
   - If the server is available, it will say "Translator"
   - If the server is unavailable, it will say "Translator (Offline)"

2. **Access the Translator**:
   - Tap the blue translator button to open the translator
   - Select your source and target languages
   - Use voice input or text input to translate

3. **Voice Translation**:
   - Press and hold the microphone button
   - Speak clearly in the source language
   - Release the button when finished
   - The app will translate your speech

4. **Text Translation**:
   - Type your text in the input field
   - Tap the send button
   - The app will translate your text

## Troubleshooting

### Server Connection Issues

If the translator shows "Offline Mode":

1. **Check Server Status**:
   - Make sure the LibreTranslate server is running on your computer
   - Verify you can access http://localhost:5000 on your computer

2. **Check Network Connection**:
   - Ensure your mobile device is on the same Wi-Fi network as your computer
   - Try pinging your computer from another device to verify connectivity

3. **Check IP Address**:
   - Verify you're using the correct IP address in the code
   - IP addresses can change, so check it each time you connect to a different network

4. **Check Firewall Settings**:
   - Make sure your computer's firewall allows incoming connections on port 5000
   - On Windows, you might need to add an exception in Windows Defender Firewall
   - On macOS, check System Preferences > Security & Privacy > Firewall

### Voice Recognition Issues

If voice recognition isn't working:

1. **Check Microphone Permissions**:
   - Make sure you've granted microphone permissions to the app
   - On Android: Settings > Apps > Your App > Permissions
   - On iOS: Settings > Your App > Microphone

2. **Speak Clearly**:
   - Speak at a moderate pace and volume
   - Minimize background noise

## Using on Different Networks

If you switch Wi-Fi networks:

1. **Get Your New IP Address**:
   - Your computer's IP address will change on different networks
   - Follow Step 2 above to find your new IP address

2. **Update the Code**:
   - Update the `LIBRE_TRANSLATE_API_URL` constant with your new IP address
   - Rebuild and reinstall the app

## Production Deployment

For a production app, consider:

1. **Hosting LibreTranslate on a Public Server**:
   - Set up LibreTranslate on a cloud server with a fixed IP or domain
   - Update the URL in your app to point to this server

2. **Using a Public LibreTranslate API**:
   - Some public instances are available, but may have rate limits
   - Example: `https://libretranslate.com`

3. **Implementing a Fallback Mechanism**:
   - The app already has offline mode with limited translations
   - You could enhance this with a larger offline dictionary 