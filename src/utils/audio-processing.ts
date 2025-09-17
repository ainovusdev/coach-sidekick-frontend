/**
 * Audio processing utilities for OpenAI Realtime API
 * Handles PCM16 audio encoding/decoding and streaming
 */

export class AudioProcessor {
  private audioContext: AudioContext | null = null
  private sampleRate = 24000 // OpenAI Realtime API expects 24kHz
  private audioQueue: Float32Array[] = []
  private isPlaying = false
  private currentSource: AudioBufferSourceNode | null = null

  constructor() {
    if (typeof window !== 'undefined' && window.AudioContext) {
      this.audioContext = new AudioContext({ sampleRate: this.sampleRate })
    }
  }

  /**
   * Convert Float32Array audio data to PCM16 (Int16) format
   */
  float32ToPCM16(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2)
    const view = new DataView(buffer)
    let offset = 0

    for (let i = 0; i < float32Array.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, float32Array[i]))
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    }

    return buffer
  }

  /**
   * Convert PCM16 (Int16) to Float32Array for playback
   */
  pcm16ToFloat32(pcm16Buffer: ArrayBuffer): Float32Array {
    const view = new DataView(pcm16Buffer)
    const float32Array = new Float32Array(pcm16Buffer.byteLength / 2)

    for (let i = 0; i < float32Array.length; i++) {
      const int16 = view.getInt16(i * 2, true)
      float32Array[i] = int16 < 0 ? int16 / 0x8000 : int16 / 0x7fff
    }

    return float32Array
  }

  /**
   * Encode audio data to base64 for transmission
   */
  encodeAudioToBase64(audioData: ArrayBuffer): string {
    const bytes = new Uint8Array(audioData)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  /**
   * Decode base64 audio data
   */
  decodeBase64ToAudio(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }

  /**
   * Play PCM16 audio data
   */
  async playPCM16Audio(base64Audio: string) {
    if (!this.audioContext) {
      console.error('AudioContext not available')
      return
    }

    try {
      // Decode base64 to PCM16
      const pcm16Buffer = this.decodeBase64ToAudio(base64Audio)

      // Convert to Float32
      const float32Data = this.pcm16ToFloat32(pcm16Buffer)

      // Add to queue
      this.audioQueue.push(float32Data)

      // Start playing if not already
      if (!this.isPlaying) {
        this.processAudioQueue()
      }
    } catch (error) {
      console.error('Error playing audio:', error)
    }
  }

  /**
   * Process queued audio chunks
   */
  private async processAudioQueue() {
    if (!this.audioContext || this.audioQueue.length === 0) {
      this.isPlaying = false
      return
    }

    this.isPlaying = true

    while (this.audioQueue.length > 0) {
      const audioData = this.audioQueue.shift()!

      // Create audio buffer
      const audioBuffer = this.audioContext.createBuffer(
        1, // mono
        audioData.length,
        this.sampleRate,
      )

      // Copy data to buffer
      audioBuffer.copyToChannel(audioData, 0)

      // Create and play source
      const source = this.audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(this.audioContext.destination)

      this.currentSource = source

      // Play and wait for completion
      await new Promise<void>(resolve => {
        source.onended = () => resolve()
        source.start()
      })
    }

    this.isPlaying = false
  }

  /**
   * Stop audio playback
   */
  stopPlayback() {
    if (this.currentSource) {
      this.currentSource.stop()
      this.currentSource = null
    }
    this.audioQueue = []
    this.isPlaying = false
  }

  /**
   * Get audio context state
   */
  getState() {
    return {
      isPlaying: this.isPlaying,
      queueLength: this.audioQueue.length,
      contextState: this.audioContext?.state,
    }
  }

  /**
   * Resume audio context if suspended (required for some browsers)
   */
  async resumeContext() {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume()
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stopPlayback()
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}

/**
 * Microphone audio capture for streaming
 */
export class MicrophoneCapture {
  private stream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private processor: ScriptProcessorNode | null = null
  private onAudioData: ((data: ArrayBuffer) => void) | null = null
  private audioProcessor: AudioProcessor

  constructor(onAudioData?: (data: ArrayBuffer) => void) {
    this.onAudioData = onAudioData || null
    this.audioProcessor = new AudioProcessor()
  }

  /**
   * Start capturing microphone audio
   */
  async start() {
    try {
      // Get microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      // Create audio context
      this.audioContext = new AudioContext({ sampleRate: 24000 })

      // Create source from stream
      this.source = this.audioContext.createMediaStreamSource(this.stream)

      // Create script processor for capturing audio
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1)

      this.processor.onaudioprocess = e => {
        const inputData = e.inputBuffer.getChannelData(0)

        // Convert to PCM16
        const pcm16 = this.audioProcessor.float32ToPCM16(inputData)

        // Send to callback
        if (this.onAudioData) {
          this.onAudioData(pcm16)
        }
      }

      // Connect nodes
      this.source.connect(this.processor)
      this.processor.connect(this.audioContext.destination)

      return true
    } catch (error) {
      console.error('Error starting microphone:', error)
      return false
    }
  }

  /**
   * Stop capturing audio
   */
  stop() {
    if (this.processor) {
      this.processor.disconnect()
      this.processor = null
    }

    if (this.source) {
      this.source.disconnect()
      this.source = null
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }

  /**
   * Check if capturing
   */
  isCapturing() {
    return this.stream !== null
  }

  /**
   * Set audio data callback
   */
  setAudioDataCallback(callback: (data: ArrayBuffer) => void) {
    this.onAudioData = callback
  }
}

/**
 * Realtime API audio format utilities
 */
export const RealtimeAudioFormat = {
  /**
   * Encode audio data to base64 (static helper)
   */
  encodeAudioToBase64(audioData: ArrayBuffer): string {
    const bytes = new Uint8Array(audioData)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  },

  /**
   * Create audio append message for Realtime API
   */
  createAudioAppendMessage(audioData: ArrayBuffer): object {
    const base64Audio = this.encodeAudioToBase64(audioData)

    return {
      type: 'input_audio_buffer.append',
      audio: base64Audio,
    }
  },

  /**
   * Create audio commit message to trigger processing
   */
  createAudioCommitMessage(): object {
    return {
      type: 'input_audio_buffer.commit',
    }
  },

  /**
   * Parse audio delta from Realtime API response
   */
  parseAudioDelta(message: any): string | null {
    if (message.type === 'response.audio.delta' && message.delta) {
      return message.delta
    }
    return null
  },

  /**
   * Parse audio transcript from Realtime API response
   */
  parseAudioTranscript(message: any): string | null {
    if (message.type === 'response.audio_transcript.delta' && message.delta) {
      return message.delta
    }
    if (
      message.type === 'response.audio_transcript.done' &&
      message.transcript
    ) {
      return message.transcript
    }
    return null
  },

  /**
   * Check if message is audio response done
   */
  isAudioDone(message: any): boolean {
    return message.type === 'response.audio.done'
  },

  /**
   * Check if conversation item created
   */
  isItemCreated(message: any): boolean {
    return message.type === 'conversation.item.created'
  },
}
