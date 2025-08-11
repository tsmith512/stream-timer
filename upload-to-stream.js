require('dotenv').config();
const fs = require('fs');
const path = require('path');

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const DEFAULT_VIDEO_URL = 'https://pub-8613b7f94d6146408add8fefb52c52e8.r2.dev/aus-mobile-demo.mp4';

// Get video URL from command line argument or use default
const VIDEO_URL = process.argv[2] || DEFAULT_VIDEO_URL;

// Set up logging
const OUTPUT_DIR = path.join(__dirname, 'output');
const EXECUTION_START_TIME = new Date();
const LOG_FILENAME = `stream-timer-${EXECUTION_START_TIME.toISOString().replace(/[:.]/g, '-')}.txt`;
const LOG_FILE_PATH = path.join(OUTPUT_DIR, LOG_FILENAME);

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Create log function that writes to both console and file
function log(message) {
  console.log(message);
  fs.appendFileSync(LOG_FILE_PATH, message + '\n');
}

async function pollVideoStatus(videoId, startTime) {
  let previousState = null;
  let previousReadyToStream = null;
  
  log('\n--- Starting status polling ---');
  
  while (true) {
    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${videoId}`, {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        const currentTime = new Date();
        const currentState = result.result.status.state;
        const currentReadyToStream = result.result.readyToStream;
        
        // Report state changes
        if (previousState !== null && previousState !== currentState) {
          const elapsedTime = ((currentTime - startTime) / 1000).toFixed(2);
          log(`[${currentTime.toISOString()}] Status changed: ${previousState} → ${currentState} (${elapsedTime}s elapsed)`);
        }
        
        // Report readyToStream changes
        if (previousReadyToStream !== null && previousReadyToStream !== currentReadyToStream && currentReadyToStream === true) {
          const elapsedTime = ((currentTime - startTime) / 1000).toFixed(2);
          log(`[${currentTime.toISOString()}] Ready to stream: ${currentReadyToStream} (${elapsedTime}s elapsed)`);
        }
        
        // Report on pctComplete reaching 100
        const pctComplete = parseFloat(result.result.status.pctComplete);
        if (pctComplete === 100 && currentState === 'ready') {
          const totalTime = ((currentTime - startTime) / 1000).toFixed(2);
          log(`[${currentTime.toISOString()}] Processing complete: ${pctComplete}% (${totalTime}s elapsed)`);
          log(`\n--- Processing complete ---`);
          log(`Final state: ${currentState}`);
          log(`Total processing time: ${totalTime} seconds`);
          break;
        }
        
        // Stop polling if there's an error
        if (currentState === 'error') {
          const totalTime = ((currentTime - startTime) / 1000).toFixed(2);
          log(`\n--- Processing failed ---`);
          log(`Final state: ${currentState}`);
          log(`Total processing time: ${totalTime} seconds`);
          break;
        }
        
        previousState = currentState;
        previousReadyToStream = currentReadyToStream;
      } else {
        console.error('Failed to fetch video status:', await response.text());
      }
      
      // Wait 2 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Error polling video status:', error);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

async function uploadVideoToStream() {
  try {
    const uploadStartTime = new Date();
    log(`Uploading video from: ${VIDEO_URL}`);
    log(`Upload request started at: ${uploadStartTime.toISOString()}`);
    
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/copy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: VIDEO_URL,
        meta: {
          name: 'aus-mobile-demo'
        },
        scheduledDeletion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      const uploadCompleteTime = new Date();
      log(`Upload request completed at: ${uploadCompleteTime.toISOString()}`);
      log('Upload successful!');
      log('Video ID:', result.result.uid);
      log('Initial Status:', result.result.status.state);
      log('Preview URL:', `https://watch.cloudflarestream.com/${result.result.uid}`);
      
      // Start polling for status updates
      await pollVideoStatus(result.result.uid, uploadCompleteTime);
    } else {
      console.error('Upload failed:', result);
    }
  } catch (error) {
    console.error('Error uploading video:', error);
  }
}

uploadVideoToStream();