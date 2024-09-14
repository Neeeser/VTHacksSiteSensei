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

// Improved function to extract HTML from the generated content
function extractHTML(content) {
  // This regex will match [START_HTML] ... [END_HTML] or [START_HTML] ... [/END_HTML]
  const regex = /\[START_HTML\]([\s\S]*?)\[(?:\/)?END_HTML\]/;
  const match = content.match(regex);
  if (match) {
    return match[1].trim();
  } else {
    // Fallback: try to extract the entire HTML document
    const htmlMatch = content.match(/<html[^>]*>[\s\S]*<\/html>/i);
    return htmlMatch ? htmlMatch[0].trim() : null;
  }
}

export async function POST(request) {
  try {
    const { prompt, model } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }
   
    const model_name = getApiKey(model);
    console.log('Using model:', model_name);
    const completion = await openai.chat.completions.create({
      model: model_name,
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that generates HTML content for a dynamic web application.
          Follow these guidelines:
          1. Provide a complete HTML document with <!DOCTYPE html>, <html>, <head>, and <body> tags.
          2. Include all CSS within a <style> tag in the <head> section.
          3. Ensure content works with flexible dimensions using viewport units or percentages.
          4. Avoid external resources unless absolutely necessary.
          5. Write code compatible with modern browsers.
          6. Do not include any <script> tags or JavaScript code.
          7. For interactive elements, use appropriate attributes (like onclick) without including actual JavaScript code.
          8. Format your response exactly as follows:
             [START_HTML]
             <!DOCTYPE html>
             <html>
             ...your complete HTML code here...
             </html>
             [END_HTML]
          9. Do not include any explanation or additional text outside of these tags.
          10. Make sure to use [END_HTML] (not [/END_HTML]) as the closing tag.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
    });

    const generatedContent = completion.choices[0].message.content;
    console.log('Generated content:', generatedContent);

    const html = extractHTML(generatedContent);
    if (!html) {
      throw new Error('Failed to extract valid HTML from the generated content');
    }

    return NextResponse.json({
      message: 'HTML generated successfully',
      html: html
    });
  } catch (error) {
    console.error('Error generating HTML:', error);
    return NextResponse.json({ error: 'Error generating HTML' }, { status: 500 });
  }
}