require('dotenv').config();

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const VIDEO_URL = 'https://pub-8613b7f94d6146408add8fefb52c52e8.r2.dev/aus-mobile-demo.mp4';

async function pollVideoStatus(videoId, startTime) {
  let previousState = null;
  let previousReadyToStream = null;
  
  console.log('\n--- Starting status polling ---');
  
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
          console.log(`[${currentTime.toISOString()}] Status changed: ${previousState} → ${currentState} (${elapsedTime}s elapsed)`);
        }
        
        // Report readyToStream changes
        if (previousReadyToStream !== null && previousReadyToStream !== currentReadyToStream && currentReadyToStream === true) {
          const elapsedTime = ((currentTime - startTime) / 1000).toFixed(2);
          console.log(`[${currentTime.toISOString()}] Ready to stream: ${currentReadyToStream} (${elapsedTime}s elapsed)`);
        }
        
        // Stop polling if processing is complete
        if (currentState === 'ready' || currentState === 'error') {
          const totalTime = ((currentTime - startTime) / 1000).toFixed(2);
          console.log(`\n--- Processing complete ---`);
          console.log(`Final state: ${currentState}`);
          console.log(`Total processing time: ${totalTime} seconds`);
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
    console.log(`Upload request started at: ${uploadStartTime.toISOString()}`);
    
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
      console.log(`Upload request completed at: ${uploadCompleteTime.toISOString()}`);
      console.log('Upload successful!');
      console.log('Video ID:', result.result.uid);
      console.log('Initial Status:', result.result.status.state);
      console.log('Preview URL:', `https://watch.cloudflarestream.com/${result.result.uid}`);
      
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