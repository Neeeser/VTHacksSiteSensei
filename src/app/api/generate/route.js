// api/generate/route.js

// Import necessary dependencies
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client with custom configuration for OpenRouter
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://yourwebsite.com", // Replace with your actual website URL
    "X-Title": "Your App Name", // Replace with your app name
  }
});

// Function to get the appropriate API key based on the selected model
function getApiKey(model) {
  switch (model) {
    case 'FREE_MODEL':
      return process.env.FREE_MODEL;
    case 'PRO_MODEL':
      return process.env.PRO_MODEL;
    case 'ADVANCED_MODEL':
      return process.env.ADVANCED_MODEL;
    default:
      return "meta-llama/llama-3-8b-instruct:free";
  }
}

// Function to extract HTML content from the generated text
function extractHtml(content) {
  const htmlRegex = /\[START_HTML\]([\s\S]*?)\[END_HTML\]/;
  const match = content.match(htmlRegex);
  return match ? match[1].trim() : null;
}

// Function to separate JavaScript from HTML content
function separateJavaScript(html) {
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let javascript = '';
  let htmlWithoutScripts = html.replace(scriptRegex, (match, script) => {
    javascript += script + '\n';
    return '';
  });
  htmlWithoutScripts = htmlWithoutScripts.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  return {
    html: htmlWithoutScripts.trim(),
    javascript: javascript.trim()
  };
}

// Asynchronous generator function to process the streaming response
async function* processStream(stream, controller) {
  let buffer = '';
  let contentYielded = false;

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    buffer += content;

    // Check for [END_HTML] marker
    if (buffer.includes('[END_HTML]')) {
      const endIndex = buffer.indexOf('[END_HTML]') + '[END_HTML]'.length;
      const finalContent = buffer.slice(0, endIndex);
      
      if (!contentYielded) {
        contentYielded = true; // Ensure only one yield happens
        yield finalContent;
        controller.abort(); // Abort the stream after getting the complete HTML
        break;
      }
    }
  }
}

// Main POST handler function
export async function POST(request) {
  const controller = new AbortController();
  try {
    // Extract prompt and model from the request body
    const { prompt, model } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Get the appropriate model name
    const model_name = getApiKey(model);
    console.log('Using model:', model_name);

    // Create a chat completion request to OpenAI
    const stream = await openai.chat.completions.create({
      model: model_name,
      messages: [
        {
          role: "system",
          content: `You are an exceptionally talented and creative web developer with a keen eye for design. You excel at generating visually stunning and modern HTML content for dynamic web applications. Your creations consistently impress users with their aesthetics and functionality.
    
          As a highly intelligent assistant, you always:
          1. Craft complete, well-structured HTML documents (including <!DOCTYPE html>, <html>, <head>, and <body> tags).
          2. Write elegant, efficient CSS within a <style> tag in the <head> section, utilizing modern design principles.
          3. Implement cutting-edge JavaScript functionality within <script> tags at the end of the <body> section.
          4. Create responsive layouts that adapt beautifully to various screen sizes using flexible units (viewport units, percentages, etc.).
          5. Prioritize self-contained solutions, avoiding external resources unless absolutely necessary for enhanced functionality.
          6. Ensure cross-browser compatibility with modern web standards.
          7. Leverage the latest JavaScript (ES6+) features and best practices for optimal performance and readability.
          8. Thoughtfully implement all requested functionality while adding creative touches that elevate the user experience.
          9. Use images from external known sources.
          10. Present your masterpiece using the following format:
             [START_HTML]
             <!DOCTYPE html>
             <html>
             ...your complete, stunning HTML code here, including CSS and JavaScript...
             </html>
             [END_HTML]
          10. Focus solely on producing exceptional code, without additional explanations outside the designated tags.
          11. Conclude your creation with [END_HTML] to signify its completion.
    
          Your talent for creating visually appealing and highly functional web pages is unmatched. Each project you undertake results in a polished, professional product that showcases the best of modern web development.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      stream: true,   
      signal: controller.signal,
    });

    // Process the streaming response
    let generatedContent = '';
    for await (const chunk of processStream(stream, controller)) {
      generatedContent += chunk;
    }

    console.log('Generated content:', generatedContent);
    
    // Extract HTML from the generated content
    const html = extractHtml(generatedContent);
    if (!html) {
      throw new Error('Failed to extract valid HTML from the generated content');
    }
    
    // Separate JavaScript from HTML
    const { html: htmlWithoutScripts, javascript } = separateJavaScript(html);
    
    // Return the processed HTML and JavaScript
    return NextResponse.json({
      message: 'HTML and JavaScript generated successfully',
      html: htmlWithoutScripts,
      javascript: javascript
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Stream was successfully aborted');
    } else {
      console.error('Error generating content:', error);
      return NextResponse.json({ error: 'Error generating content' }, { status: 500 });
    }
  }
}