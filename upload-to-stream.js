require('dotenv').config();

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const VIDEO_URL = 'https://pub-8613b7f94d6146408add8fefb52c52e8.r2.dev/aus-mobile-demo.mp4';

async function uploadVideoToStream() {
  try {
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
        }
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('Upload successful!');
      console.log('Video ID:', result.result.uid);
      console.log('Status:', result.result.status.state);
      console.log('Preview URL:', `https://watch.cloudflarestream.com/${result.result.uid}`);
    } else {
      console.error('Upload failed:', result);
    }
  } catch (error) {
    console.error('Error uploading video:', error);
  }
}

uploadVideoToStream();