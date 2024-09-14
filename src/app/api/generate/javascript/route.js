import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://yourwebsite.com", // Replace with your actual website URL
    "X-Title": "Your App Name", // Replace with your app name
  }
});


// Function to get the appropriate API key based on the model
function getApiKey(model) {
  switch (model) {
    case 'FREE_MODEL':
      return process.env.FREE_MODEL;
    case 'PRO_MODEL':
      return process.env.PRO_MODEL;
    case 'ADVANCED_MODEL':
      return process.env.ADVANCED_MODEL;
    default:
      return "meta-llama/llama-3-8b-instruct:free"; // Fallback to a default key if needed
  }
}


const systemMessage = {
  role: "system",
  content: `You are a helpful assistant that generates JavaScript code to enhance HTML content for a dynamic web application.
  Follow these guidelines:
  1. Carefully analyze the provided HTML structure, including element IDs, classes, and existing event handlers.
  2. Generate JavaScript that is fully compatible with the given HTML structure.
  3. If the HTML uses inline event handlers (like onclick), use those in your JavaScript instead of adding new event listeners.
  4. Use modern JavaScript (ES6+) syntax and best practices.
  5. Ensure the code is compatible with modern browsers.
  6. Avoid using external libraries unless specifically requested.
  7. Create self-contained, well-commented JavaScript code.
  8. Implement the functionality described in the prompt while adhering to the existing HTML structure.
  9. Format your response exactly as follows:
     [START_JS]
     // Your JavaScript code here
     [END_JS]
  10. Do not include any explanation or additional text outside of these tags.
  11. Ensure the code can be placed at the end of the <body> section of the HTML.`
};

function extractJavaScript(content) {
  const regex = /\[START_JS\]([\s\S]*?)\[END_JS\]/;
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}


export async function POST(request) {
  try {
    const { prompt, html, model } = await request.json();
    if (!prompt || !html) {
      return NextResponse.json({ error: 'Prompt and HTML are required' }, { status: 400 });
    }
    const model_name = getApiKey(model);
    console.log('Using model:', model_name);
    const completion = await openai.chat.completions.create({
      model: model_name,
      messages: [
        systemMessage,
        {
          role: "user",
          content: `HTML: ${html}\n\nPrompt: ${prompt}\n\nGenerate JavaScript code to enhance this HTML based on the prompt, ensuring compatibility with the existing HTML structure.`
        }
      ],
      temperature: 0.3,
    });
    const generatedContent = completion.choices[0].message.content;
    console.log('Generated content:', generatedContent);
    
    const javascript = extractJavaScript(generatedContent);
    if (!javascript) {
      throw new Error('Failed to extract valid JavaScript from the generated content');
    }
    return NextResponse.json({
      message: 'JavaScript generated successfully',
      javascript: javascript
    });
  } catch (error) {
    console.error('Error generating JavaScript:', error);
    return NextResponse.json({ error: 'Error generating JavaScript' }, { status: 500 });
  }
}