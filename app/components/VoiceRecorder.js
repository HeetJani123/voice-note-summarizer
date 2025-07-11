'use client'

import { useState, useRef, useEffect } from 'react'

export default function VoiceRecorder({ isRecording, setIsRecording, onRecordingComplete, onStartRecording }) {
  const [isSupported, setIsSupported] = useState(true)
  const [recordingTime, setRecordingTime] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [recordingError, setRecordingError] = useState('')
  const [debugMode, setDebugMode] = useState(false)
  const [debugInfo, setDebugInfo] = useState({})
  
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

  const updateDebugInfo = (info) => {
    if (debugMode) {
      setDebugInfo(prev => ({ ...prev, ...info }))
    }
  }

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

        setTranscript(finalTranscript + interimTranscript)
        latestTranscriptRef.current = finalTranscript + interimTranscript

        updateDebugInfo({
          finalTranscript,
          interimTranscript,
          isFinal,
          resultIndex: event.resultIndex,
          resultsLength: event.results.length
        })

        // If we are waiting for completion and this is the final result, call onRecordingComplete
        if (pendingCompleteRef.current && isFinal) {
          updateDebugInfo({ status: 'Completing recording with final transcript' })
          completeRecording(finalTranscript + interimTranscript)
        }
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setRecordingError(`Speech recognition error: ${event.error}`)
        updateDebugInfo({ status: 'Speech recognition error', error: event.error })
        
        // If speech recognition fails but we have audio, still complete the recording
        if (pendingCompleteRef.current && audioChunksRef.current.length > 0) {
          updateDebugInfo({ status: 'Completing recording despite speech recognition error' })
          completeRecording(latestTranscriptRef.current)
        }
      }

      recognitionRef.current.onend = () => {
        setIsRecognitionStopped(true)
        updateDebugInfo({ status: 'Speech recognition ended' })
        
        // If recognition ended unexpectedly but we have audio, complete the recording
        if (pendingCompleteRef.current && audioChunksRef.current.length > 0) {
          updateDebugInfo({ status: 'Completing recording after recognition ended' })
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
    updateDebugInfo({ 
      status: 'Completing recording',
      audioChunksCount: audioChunksRef.current.length,
      transcriptLength: finalTranscript?.length || 0
    })
    
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
      onRecordingComplete(audioBlob, finalTranscript || '')
      updateDebugInfo({ status: 'Recording completed successfully' })
    } else {
      updateDebugInfo({ status: 'No audio chunks available' })
    }
    pendingCompleteRef.current = false
    hasFinalTranscriptRef.current = false
  }

  const startRecording = async () => {
    if (onStartRecording) onStartRecording();
    
    setRecordingError('')
    setTranscript('')
    hasFinalTranscriptRef.current = false
    updateDebugInfo({ status: 'Starting recording...' })
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      
      streamRef.current = stream
      updateDebugInfo({ 
        status: 'Stream obtained',
        streamTracks: stream.getTracks().length,
        audioChunks: 0
      })
      
      // Start MediaRecorder for audio recording
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
          updateDebugInfo({ 
            audioChunks: audioChunksRef.current.length,
            lastChunkSize: event.data.size
          })
        }
      }

      mediaRecorderRef.current.onstop = () => {
        setIsAudioStopped(true)
        updateDebugInfo({ 
          status: 'Audio stopped',
          totalAudioChunks: audioChunksRef.current.length,
          pendingComplete: pendingCompleteRef.current
        })
        
        // If speech recognition didn't produce a final result, complete with current transcript
        if (pendingCompleteRef.current) {
          setTimeout(() => {
            if (pendingCompleteRef.current) {
              updateDebugInfo({ status: 'Completing recording with timeout' })
              completeRecording(latestTranscriptRef.current)
            }
          }, 1000) // Wait 1 second for any pending recognition results
        }
      }

      mediaRecorderRef.current.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        setRecordingError('Audio recording failed. Please try again.')
        updateDebugInfo({ status: 'MediaRecorder error', error: event.error })
      }

      // Start recording
      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)
      updateDebugInfo({ status: 'Recording started' })

      // Start speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start()
          updateDebugInfo({ status: 'Speech recognition started' })
        } catch (error) {
          console.error('Failed to start speech recognition:', error)
          setRecordingError('Speech recognition failed to start, but audio recording will continue.')
          updateDebugInfo({ status: 'Speech recognition failed to start', error: error.message })
        }
      } else {
        updateDebugInfo({ status: 'Speech recognition not available' })
      }

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Error starting recording:', error)
      setRecordingError('Unable to access microphone. Please check permissions and try again.')
      updateDebugInfo({ status: 'Failed to start recording', error: error.message })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      setIsAudioStopped(false)
      setIsRecognitionStopped(false)
      pendingCompleteRef.current = true
      updateDebugInfo({ status: 'Stopping recording...' })
      
      // Stop audio recording
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      // Stop speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
          updateDebugInfo({ status: 'Speech recognition stopped' })
        } catch (error) {
          console.error('Error stopping speech recognition:', error)
          updateDebugInfo({ status: 'Error stopping speech recognition', error: error.message })
        }
      }

      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      // Clean up stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        updateDebugInfo({ status: 'Stream cleaned up' })
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

      {/* Debug Mode Toggle */}
      <div className="mb-4 text-center">
        <button
          onClick={() => setDebugMode(!debugMode)}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          {debugMode ? 'Hide Debug Info' : 'Show Debug Info'}
        </button>
      </div>

      {/* Debug Information */}
      {debugMode && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-left">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Debug Info:</h4>
          <pre className="text-xs text-gray-600 whitespace-pre-wrap">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
      
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