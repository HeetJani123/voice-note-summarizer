'use client'

import { useState, useRef, useEffect } from 'react'

export default function VoiceRecorder({ isRecording, setIsRecording, onRecordingComplete, onStartRecording }) {
  const [isSupported, setIsSupported] = useState(true)
  const [recordingTime, setRecordingTime] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [recordingError, setRecordingError] = useState('')
  
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recognitionRef = useRef(null)
  const timerRef = useRef(null)
  const streamRef = useRef(null)
  const [isAudioStopped, setIsAudioStopped] = useState(false)
  const [isRecognitionStopped, setIsRecognitionStopped] = useState(false)
  const latestTranscriptRef = useRef('')
  const pendingCompleteRef = useRef(false)
  const hasFinalTranscriptRef = useRef(false)
  const fullTranscriptRef = useRef('') // NEW: accumulate transcript

  useEffect(() => {
    // Check for browser support
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setIsSupported(false)
      return
    }

    // Initialize speech recognition if available
    if (window.webkitSpeechRecognition) {
      recognitionRef.current = new window.webkitSpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = ''
        let interimTranscript = ''
        let isFinal = false

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
            isFinal = true
            hasFinalTranscriptRef.current = true
          } else {
            interimTranscript += transcript
          }
        }

        // Accumulate final transcript
        if (finalTranscript) {
          fullTranscriptRef.current += finalTranscript
        }
        setTranscript(fullTranscriptRef.current + interimTranscript)
        latestTranscriptRef.current = fullTranscriptRef.current + interimTranscript

        // If we are waiting for completion and this is the final result, call onRecordingComplete
        if (pendingCompleteRef.current && isFinal) {
          completeRecording(fullTranscriptRef.current + interimTranscript)
        }
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setRecordingError(`Speech recognition error: ${event.error}`)
        
        // If speech recognition fails but we have audio, still complete the recording
        if (pendingCompleteRef.current && audioChunksRef.current.length > 0) {
          completeRecording(latestTranscriptRef.current)
        }
      }

      recognitionRef.current.onend = () => {
        setIsRecognitionStopped(true)
        
        // If user is still recording, restart recognition (handles pauses)
        if (isRecording && !pendingCompleteRef.current) {
          try {
            recognitionRef.current.start()
          } catch (e) {
            // Sometimes throws if already started, ignore
          }
          return
        }
        // If recognition ended unexpectedly but we have audio, complete the recording
        if (pendingCompleteRef.current && audioChunksRef.current.length > 0) {
          completeRecording(latestTranscriptRef.current)
        }
      }
    }

    return () => {
      cleanup()
    }
  }, [onRecordingComplete]);

  useEffect(() => {
    latestTranscriptRef.current = transcript
  }, [transcript])

  const cleanup = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
  }

  const completeRecording = (finalTranscript) => {
    
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
      onRecordingComplete(audioBlob, finalTranscript || '')
    } else {
      onRecordingComplete(null, finalTranscript || '') // No audio, but transcript
    }
    pendingCompleteRef.current = false
    hasFinalTranscriptRef.current = false
  }

  const startRecording = async () => {
    if (onStartRecording) onStartRecording();
    
    setRecordingError('')
    setTranscript('')
    hasFinalTranscriptRef.current = false
    fullTranscriptRef.current = '' // NEW: reset accumulated transcript
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      
      streamRef.current = stream
      
      // Start MediaRecorder for audio recording
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        setIsAudioStopped(true)
        
        // If speech recognition didn't produce a final result, complete with current transcript
        if (pendingCompleteRef.current) {
          setTimeout(() => {
            if (pendingCompleteRef.current) {
              completeRecording(latestTranscriptRef.current)
            }
          }, 1000) // Wait 1 second for any pending recognition results
        }
      }

      mediaRecorderRef.current.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        setRecordingError('Audio recording failed. Please try again.')
      }

      // Start recording
      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start()
        } catch (error) {
          console.error('Failed to start speech recognition:', error)
          setRecordingError('Speech recognition failed to start, but audio recording will continue.')
        }
      }

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Error starting recording:', error)
      setRecordingError('Unable to access microphone. Please check permissions and try again.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      setIsAudioStopped(false)
      setIsRecognitionStopped(false)
      pendingCompleteRef.current = true
      
      // Stop audio recording
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      // Stop speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (error) {
          console.error('Error stopping speech recognition:', error)
        }
      }

      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      // Clean up stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!isSupported) {
    return (
      <div className="text-center p-6">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Browser Not Supported
        </h3>
        <p className="text-gray-600">
          Your browser doesn&apos;t support the required APIs. Please use Chrome, Edge, or Safari.
        </p>
      </div>
    )
  }

  return (
    <div className="text-center">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Voice Recorder
      </h2>
      
      {/* Error Display */}
      {recordingError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{recordingError}</p>
        </div>
      )}
      
      {/* Debug Mode Toggle and Debug Info removed */}
      
      <div className="mb-6">
        {isRecording ? (
          <div className="flex items-center justify-center space-x-4">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse-slow"></div>
            <span className="text-lg font-medium text-gray-700">
              Recording... {formatTime(recordingTime)}
            </span>
          </div>
        ) : (
          <p className="text-gray-600">
            Click the button below to start recording your voice note
          </p>
        )}
      </div>

      <div className="flex justify-center space-x-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="btn-primary flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <span>Start Recording</span>
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            <span>Stop Recording</span>
          </button>
        )}
      </div>

      {isRecording && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Live Transcription:</strong> {transcript || 'Listening...'}
          </p>
        </div>
      )}
    </div>
  )
} 