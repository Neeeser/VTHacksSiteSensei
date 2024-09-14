// api/edit-content/route.js
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

function extractHtml(content) {
  const htmlRegex = /\[START_HTML\]([\s\S]*?)\[END_HTML\]/;
  const match = content.match(htmlRegex);
  return match ? match[1].trim() : null;
}

function separateJavaScript(html) {
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let javascript = '';
  let htmlWithoutScripts = html.replace(scriptRegex, (match, script) => {
    javascript += script + '\n';
    return '';
  });
  // Remove any remaining script tags
  htmlWithoutScripts = htmlWithoutScripts.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  return {
    html: htmlWithoutScripts.trim(),
    javascript: javascript.trim()
  };
}

export async function POST(request) {
  try {
    const { editPrompt, currentHtml, currentJavascript, model } = await request.json();
    if (!editPrompt || !currentHtml || !currentJavascript) {
      return NextResponse.json({ error: 'Edit prompt, current HTML, and current JavaScript are required' }, { status: 400 });
    }

    const model_name = getApiKey(model);
    console.log('Using model:', model_name);

    const completion = await openai.chat.completions.create({
      model: model_name,
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that edits HTML and JavaScript content for a dynamic web application.
          Follow these guidelines:
          1. Modify the existing HTML and JavaScript based on the edit prompt.
          2. Maintain the overall structure of the HTML document.
          3. Keep all CSS within the <style> tag in the <head> section.
          4. Keep all JavaScript within <script> tags at the end of the <body> section.
          5. Ensure content works with flexible dimensions using viewport units or percentages.
          6. Avoid adding external resources unless absolutely necessary.
          7. Use modern JavaScript (ES6+) syntax and best practices.
          8. Implement the changes described in the edit prompt.
          9. Format your response exactly as follows:
             [START_HTML]
             <!DOCTYPE html>
             <html>
             ...your complete modified HTML code here, including CSS and JavaScript...
             </html>
             [END_HTML]
          10. Do not include any explanation or additional text outside of these tags.
          11. Make sure to use [END_HTML] (not [/END_HTML]) as the closing tag.`
        },
        {
          role: "user",
          content: `Current HTML:\n${currentHtml}\n\nCurrent JavaScript:\n${currentJavascript}\n\nEdit prompt: ${editPrompt}`
        }
      ],
      temperature: 0.3,
    });

    const generatedContent = completion.choices[0].message.content;
    console.log('Generated content:', generatedContent);

    const html = extractHtml(generatedContent);
    if (!html) {
      throw new Error('Failed to extract valid HTML from the generated content');
    }

    const { html: htmlWithoutScripts, javascript } = separateJavaScript(html);

    return NextResponse.json({
      message: 'HTML and JavaScript edited successfully',
      html: htmlWithoutScripts,
      javascript: javascript
    });
  } catch (error) {
    console.error('Error editing content:', error);
    return NextResponse.json({ error: 'Error editing content' }, { status: 500 });
  }
}