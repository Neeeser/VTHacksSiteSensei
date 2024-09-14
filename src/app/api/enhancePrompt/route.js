import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize the OpenAI client with OpenRouter configuration
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://yourwebsite.com", // Replace with your actual website URL
    "X-Title": "Your App Name", // Replace with your app name
  }
});

export async function POST(request) {
  try {
    const { prompt } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const systemPrompt = `
You are a prompt enhancer focused on expanding simple user queries into basic specifications for single-page HTML documents with integrated CSS and JavaScript. Your goal is to provide a straightforward, minimal expansion of the user's idea. Follow these guidelines:

- Expand the user's query into a basic description of the desired web page or application.
- Focus only on essential structure, simple styling, and core functionality.
- Ensure all content, styles, and scripts are contained within a single HTML file.
- Avoid mentioning complex features, cross-browser compatibility, or accessibility concerns.
- Do not include any actual code, bullet points, numbered lists, or section headers.
- Present the enhanced prompt as a short, continuous paragraph.
- Keep the expansion simple and avoid adding features not directly related to the user's query.
- Do not include an opening remark just the expanded prompt.
Provide a basic expansion of the following user query for a single-page web application:

${prompt}
`

    const completion = await openai.chat.completions.create({
      model: process.env.FREE_MODEL,
      messages: [
        {
          role: "system",
          content: systemPrompt
        }
      ],
      temperature: 0.3,
    });

    const enhancedPrompt = completion.choices[0].message.content.trim();
    
    
    return NextResponse.json({
      message: 'Prompt enhanced successfully',
      enhancedPrompt
    });
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    return NextResponse.json({ error: 'Error enhancing prompt' }, { status: 500 });
  }
}