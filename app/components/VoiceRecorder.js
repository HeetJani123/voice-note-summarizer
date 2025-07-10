'use client'

import { useState, useRef, useEffect } from 'react'

export default function VoiceRecorder({ isRecording, setIsRecording, onRecordingComplete, onStartRecording }) {
  const [isSupported, setIsSupported] = useState(true)
  const [recordingTime, setRecordingTime] = useState(0)
  const [transcript, setTranscript] = useState('')
  
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recognitionRef = useRef(null)
  const timerRef = useRef(null)
  const [isAudioStopped, setIsAudioStopped] = useState(false)
  const [isRecognitionStopped, setIsRecognitionStopped] = useState(false)
  const latestTranscriptRef = useRef('')
  const pendingCompleteRef = useRef(false)

  useEffect(() => {
    // Check for browser support
    if (!navigator.mediaDevices || !window.MediaRecorder || !window.webkitSpeechRecognition) {
      setIsSupported(false)
      return
    }

    // Initialize speech recognition
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
          } else {
            interimTranscript += transcript
          }
        }

        setTranscript(finalTranscript + interimTranscript)
        latestTranscriptRef.current = finalTranscript + interimTranscript

        // If we are waiting for completion and this is the final result, call onRecordingComplete
        if (pendingCompleteRef.current && isFinal) {
          if (audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
            onRecordingComplete(audioBlob, finalTranscript + interimTranscript)
          }
          pendingCompleteRef.current = false
        }
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
      }

      recognitionRef.current.onend = () => {
        setIsRecognitionStopped(true)
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    latestTranscriptRef.current = transcript
  }, [transcript])

  const startRecording = async () => {
    if (onStartRecording) onStartRecording();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Start MediaRecorder for audio recording
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = () => {
        setIsAudioStopped(true)
        // The onRecordingComplete will be called from recognition.onresult
      }

      // Start recording
      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)
      setTranscript('')

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start()
      }

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Unable to access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      setIsAudioStopped(false)
      setIsRecognitionStopped(false)
      pendingCompleteRef.current = true
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }

      if (timerRef.current) {
        clearInterval(timerRef.current)
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
          Your browser doesn't support the required APIs. Please use Chrome, Edge, or Safari.
        </p>
      </div>
    )
  }

  return (
    <div className="text-center">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">
        Voice Recorder
      </h2>
      
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