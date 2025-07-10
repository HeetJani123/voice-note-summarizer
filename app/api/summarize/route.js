export async function POST(request) {
  try {
    console.log('API route hit');
    const { text } = await request.json();
    console.log('Received text:', text);

    if (!text || text.trim().length === 0) {
      console.log('No text provided');
      return new Response(JSON.stringify({ error: 'No text provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!process.env.COHERE_API_KEY) {
      console.log('Cohere API key not configured');
      return new Response(JSON.stringify({ error: 'Cohere API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Pad or repeat the input if it's less than 250 characters (Cohere API minimum)
    let textToSend = text;
    if (textToSend.length < 250) {
      textToSend = textToSend.repeat(Math.ceil(250 / textToSend.length)).slice(0, 250);
    }

    const cohereRes = await fetch('https://api.cohere.ai/v1/summarize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
        'Content-Type': 'application/json',
        'Cohere-Version': '2022-12-06',
      },
      body: JSON.stringify({
        text: textToSend,
        length: 'short', // Request a short summary
        format: 'paragraph',
        model: 'summarize-xlarge',
        additional_command: 'Summarize the main points in just a few sentences. Be concise and do not add extra information.'
      }),
    });

    console.log('Cohere response status:', cohereRes.status);
    const cohereText = await cohereRes.text();
    console.log('Cohere response body:', cohereText);

    if (!cohereRes.ok) {
      return new Response(JSON.stringify({ error: 'Failed to summarize text', details: cohereText }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let data;
    try {
      data = JSON.parse(cohereText);
    } catch (parseError) {
      console.log('Failed to parse Cohere response:', parseError);
      return new Response(JSON.stringify({ error: 'Failed to parse Cohere response', details: cohereText }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const summary = data.summary || 'No summary generated.';

    return new Response(JSON.stringify({ summary }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.log('Summarization error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate summary. Please try again.', details: error.message || error.toString() }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 