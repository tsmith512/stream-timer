# Stream Timer

A Node.js tool for uploading videos to Cloudflare Stream and measuring processing times with detailed status reporting.

## Project Overview

This project was created to analyze Cloudflare Stream's video processing pipeline by tracking timing metrics throughout the upload and encoding process.

## Development Steps Taken

1. **Initial Setup**
   - Created basic JavaScript script for uploading videos to Cloudflare Stream using the "fetch from URL" method
   - Implemented environment variable configuration with `.env` support
   - Created `package.json` with necessary dependencies (dotenv)
   - Set up `.gitignore` for security and cleanliness

2. **Scheduled Deletion Feature**
   - Added automatic video deletion after 3 days using the `scheduledDeletion` parameter
   - Configured deletion date calculation using ISO 8601 format

3. **Processing Time Tracking**
   - Implemented comprehensive timing reporting system
   - Added timestamps for upload request start/completion
   - Created polling mechanism that checks video status every 2 seconds
   - Reports on status transitions with elapsed time calculations
   - Tracks when `readyToStream` becomes true
   - Continues polling until `pctComplete` reaches 100%

4. **Command Line Interface**
   - Added support for video URL as command line argument
   - Maintains default URL fallback for convenience
   - Enhanced logging to show which URL is being processed

5. **File Logging System**
   - Added automatic logging of all execution output to timestamped files
   - Creates `output/` directory automatically if it doesn't exist
   - Generates unique log files named `stream-timer-YYYY-MM-DDTHH-MM-SS-sssZ.txt`
   - Custom `log()` function writes to both console and file simultaneously
   - Handles multiple arguments and object serialization for complete output capture
   - Fixed bug where multiple arguments to log function weren't being captured in files

## Usage

```bash
# Install dependencies
npm install

# Create .env file with your credentials
cp .env.example .env
# Edit .env with your CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN

# Run with default video
npm start

# Run with custom video URL
npm start https://example.com/your-video.mp4

# Or use node directly
node upload-to-stream.js https://example.com/your-video.mp4
```

## Features

- **Video Upload**: Uploads videos to Cloudflare Stream from URLs
- **Automatic Deletion**: Videos are automatically deleted after 3 days
- **Processing Metrics**: Detailed timing analysis including:
  - Upload request timing
  - Status state transitions
  - Ready-to-stream notifications
  - Processing completion (100%)
  - Total processing time
- **Flexible Input**: Command line argument support with sensible defaults
- **Error Handling**: Graceful error handling and continued polling on transient failures
- **File Logging**: Automatic logging to timestamped files in `output/` directory for historical analysis

## API Endpoints Used

- `POST /stream/copy` - Upload video from URL
- `GET /stream/{id}` - Poll video status and processing progress

## Environment Variables

- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
- `CLOUDFLARE_API_TOKEN` - API token with Stream permissions

## Status Tracking

The tool monitors these key metrics:
- `status.state` - Current processing state (pending, downloading, encoding, ready, error)
- `status.pctComplete` - Processing percentage (0-100)
- `readyToStream` - Boolean indicating if video is ready for streaming

## Output Format

The tool provides timestamped logs showing:
- When upload request starts/completes
- Status transitions with elapsed time
- When video becomes ready to stream
- Final processing completion with total time

### Log Files

Each execution creates a timestamped log file in the `output/` directory:
- File naming: `stream-timer-YYYY-MM-DDTHH-MM-SS-sssZ.txt`
- Contains identical output to console for permanent record keeping
- Automatically created directory structure
- Useful for batch analysis and historical comparison of processing times