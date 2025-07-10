'use client'

export default function TranscriptionDisplay({ transcription, onSummarize, isLoading }) {
  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transcription)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Transcription
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={handleCopyToClipboard}
            className="btn-secondary text-sm"
          >
            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy
          </button>
          <button
            onClick={onSummarize}
            disabled={isLoading}
            className={`btn-primary text-sm flex items-center ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Summarizing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Summarize
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
          {transcription || 'No transcription available'}
        </p>
      </div>
      
      <div className="mt-3 text-sm text-gray-500">
        <span className="font-medium">Word count:</span> {transcription.split(/\s+/).filter(word => word.length > 0).length} words
      </div>
    </div>
  )
} 