'use client'

import { useState, useRef, useEffect } from 'react'
import VoiceRecorder from './components/VoiceRecorder'
import TranscriptionDisplay from './components/TranscriptionDisplay'
import SummaryDisplay from './components/SummaryDisplay'
import AudioPlayer from './components/AudioPlayer'

export default function Home() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [summary, setSummary] = useState('')
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showTranscript, setShowTranscript] = useState(false)

  const handleRecordingComplete = (blob, transcript) => {
    setAudioBlob(blob)
    setTranscription(transcript)
    const url = URL.createObjectURL(blob)
    setAudioUrl(url)
    setShowTranscript(true) // Show transcript and summarize button immediately
  }

  const handleSummarize = async () => {
    if (!transcription.trim()) {
      setError('Please record some audio first')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: transcription }),
      })

      if (!response.ok) {
        throw new Error('Failed to summarize text')
      }

      const data = await response.json()
      setSummary(data.summary)
    } catch (err) {
      setError('Failed to generate summary. Please try again.')
      console.error('Summarization error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setTranscription('')
    setSummary('')
    setAudioBlob(null)
    setAudioUrl('')
    setError('')
    setShowTranscript(false)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
  }

  const handleStartRecording = () => {
    setTranscription('')
    setSummary('')
    setAudioBlob(null)
    setAudioUrl('')
    setError('')
    setShowTranscript(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Voice Note Summarizer
          </h1>
          <p className="text-lg text-gray-600">
            Record, transcribe, and summarize your voice notes with AI
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Voice Recorder */}
          <div className="card">
            <VoiceRecorder
              isRecording={isRecording}
              setIsRecording={setIsRecording}
              onRecordingComplete={handleRecordingComplete}
              onStartRecording={handleStartRecording}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Audio Player */}
          {audioUrl && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Original Audio
              </h2>
              <AudioPlayer audioUrl={audioUrl} />
            </div>
          )}

          {/* Transcription */}
          {showTranscript && transcription && (
            <div className="card">
              <TranscriptionDisplay 
                transcription={transcription}
                onSummarize={handleSummarize}
                isLoading={isLoading}
              />
            </div>
          )}

          {/* Summary */}
          {summary && (
            <div className="card">
              <SummaryDisplay summary={summary} />
            </div>
          )}

          {/* Clear Button */}
          {(transcription || summary) && (
            <div className="text-center">
              <button
                onClick={handleClear}
                className="btn-secondary"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 