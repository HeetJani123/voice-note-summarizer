'use client'

import { useState, useRef } from 'react'

export default function AudioPlayer({ audioUrl }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef(null)

  const handlePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime)
  }

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration)
  }

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width
    const percentage = x / width
    // Only seek if duration is a finite number
    if (isFinite(duration) && duration > 0) {
      const newTime = percentage * duration
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
  }

  return (
    <div className="space-y-4">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
      
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={handlePlayPause}
          className="w-12 h-12 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center transition-colors duration-200"
        >
          {isPlaying ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>
        
        <div className="flex-1">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          
          <div 
            className="w-full bg-gray-200 rounded-full h-2 cursor-pointer"
            onClick={handleSeek}
          >
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-100"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>
      
      <div className="text-center text-sm text-gray-600">
        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
        Click to replay your original recording
      </div>
    </div>
  )
} 