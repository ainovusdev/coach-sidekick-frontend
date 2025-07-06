# Real-time Transcription Setup Guide

This guide explains how to configure and use the real-time transcription feature with Recall.ai.

## Features

✅ **Real-time transcription** using Assembly AI streaming  
✅ **Partial results** for immediate feedback  
✅ **Final results** with high accuracy  
✅ **Live transcript viewer** with participant identification  
✅ **Automatic webhook handling** for seamless updates

## Configuration

### Environment Variables

Create a `.env.local` file in your project root:

```env
# Recall.ai API Configuration
RECALL_API_KEY=your_recall_api_key_here
RECALL_API_URL=https://us-west-2.recall.ai/api/v1

# Webhook Configuration
# For local development with ngrok:
NEXT_PUBLIC_WEBHOOK_BASE_URL=https://your-ngrok-url.ngrok.io

# For production (Vercel automatically sets this):
# NEXT_PUBLIC_WEBHOOK_BASE_URL=https://your-app.vercel.app
```

### Local Development Setup

1. **Install ngrok** (for webhook testing):

   ```bash
   npm install -g ngrok
   # or
   brew install ngrok
   ```

2. **Start your development server**:

   ```bash
   npm run dev
   ```

3. **In another terminal, expose your local server**:

   ```bash
   ngrok http 3000
   ```

4. **Update your .env.local** with the ngrok URL:

   ```env
   NEXT_PUBLIC_WEBHOOK_BASE_URL=https://abc123.ngrok.io
   ```

5. **Restart your development server** to load the new environment variables.

## How It Works

### 1. Bot Creation

When you create a bot, the system automatically configures:

- **Transcription provider**: `assembly_ai_streaming` for real-time processing
- **Webhook endpoint**: `${BASE_URL}/api/recall/webhook`
- **Events**: `transcript.data` and `transcript.partial_data`

### 2. Real-time Events

The webhook receives two types of events:

**Partial Results** (`transcript.partial_data`):

- Immediate, low-latency results
- May be incomplete or less accurate
- Displayed with "live" badge in UI

**Final Results** (`transcript.data`):

- High accuracy, complete transcriptions
- Replace partial results when available
- Displayed as normal transcript entries

### 3. Data Flow

```
Meeting Audio → Assembly AI → Recall.ai → Your Webhook → Live UI
```

## Usage

1. **Start a meeting** by entering a Google Meet URL
2. **Wait for bot to join** (status will show "in_call_recording")
3. **Speak clearly** - transcription starts automatically
4. **Watch live updates** in the transcript viewer
5. **Stop the bot** when done

## Troubleshooting

### No Transcripts Appearing

1. **Check webhook URL**: Ensure your ngrok URL is accessible
2. **Verify bot status**: Bot should be "in_call_recording"
3. **Check console logs**: Look for webhook events in server logs
4. **Audio quality**: Ensure participants are speaking clearly

### Webhook Issues

1. **ngrok tunnel down**: Restart ngrok and update environment variables
2. **Firewall blocking**: Ensure port 3000 is accessible
3. **HTTPS required**: Recall.ai webhooks require HTTPS URLs

### Environment Issues

1. **Missing API key**: Verify RECALL_API_KEY is set correctly
2. **Wrong base URL**: Check NEXT_PUBLIC_WEBHOOK_BASE_URL format
3. **Environment not loaded**: Restart development server after changes

## Production Deployment

### Vercel Deployment

1. **Set environment variables** in Vercel dashboard:

   - `RECALL_API_KEY`: Your Recall.ai API key
   - `RECALL_API_URL`: https://us-west-2.recall.ai/api/v1

2. **Deploy your app** - webhook URL will be automatically configured

### Other Platforms

Ensure your webhook endpoint is:

- **Publicly accessible** via HTTPS
- **Responds to POST requests** at `/api/recall/webhook`
- **Returns 200 status** for successful processing

## API Reference

### Webhook Events

**transcript.data** (Final Results):

```json
{
  "event": "transcript.data",
  "data": {
    "data": {
      "words": [{ "text": "Hello", "start_timestamp": { "relative": 0.5 } }],
      "participant": { "name": "John Doe", "id": 1 }
    },
    "bot": { "id": "bot-123" }
  }
}
```

**transcript.partial_data** (Partial Results):

```json
{
  "event": "transcript.partial_data",
  "data": {
    "data": {
      "words": [{ "text": "Hell", "start_timestamp": { "relative": 0.5 } }],
      "participant": { "name": "John Doe", "id": 1 }
    },
    "bot": { "id": "bot-123" }
  }
}
```

## Best Practices

1. **Handle partial results**: Display them immediately but replace with final results
2. **Error handling**: Implement proper error handling for webhook failures
3. **Rate limiting**: Be aware of transcription provider rate limits
4. **Participant identification**: Use participant names when available
5. **Cleanup**: Clean up old sessions to prevent memory leaks

## Support

For issues with:

- **Recall.ai API**: Check [Recall.ai documentation](https://docs.recall.ai)
- **Assembly AI**: Check [Assembly AI documentation](https://www.assemblyai.com/docs)
- **This implementation**: Check console logs and webhook events
