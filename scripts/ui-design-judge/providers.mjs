// @ts-check

async function callOpenAiProvider(systemPrompt, userMessage) {
  const selectedModel = process.env.LLM_JUDGE_MODEL ?? 'gpt-4o-mini';
  const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: selectedModel,
      max_tokens: 2048,
      temperature: 0,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!apiResponse.ok) {
    const errorBody = await apiResponse.text();
    throw new Error(`OpenAI API returned ${apiResponse.status}: ${errorBody}`);
  }

  const responsePayload = await apiResponse.json();
  return responsePayload.choices[0].message.content;
}

async function callAnthropicProvider(systemPrompt, userMessage) {
  const selectedModel = process.env.LLM_JUDGE_MODEL ?? 'claude-3-5-haiku-latest';
  const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: selectedModel,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!apiResponse.ok) {
    const errorBody = await apiResponse.text();
    throw new Error(`Anthropic API returned ${apiResponse.status}: ${errorBody}`);
  }

  const responsePayload = await apiResponse.json();
  return responsePayload.content[0].text;
}

async function callGeminiProvider(systemPrompt, userMessage) {
  const selectedModel = process.env.LLM_JUDGE_MODEL ?? 'gemini-2.0-flash';
  const apiKey = process.env.GEMINI_API_KEY ?? '';
  const endpointUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

  const apiResponse = await fetch(endpointUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 2048 },
    }),
  });

  if (!apiResponse.ok) {
    const errorBody = await apiResponse.text();
    throw new Error(`Gemini API returned ${apiResponse.status}: ${errorBody}`);
  }

  const responsePayload = await apiResponse.json();
  return responsePayload.candidates[0].content.parts[0].text;
}

export function selectAvailableProvider() {
  if (process.env.UI_DESIGN_JUDGE_MOCK_RESPONSE) {
    return {
      providerName: 'mock',
      invokeProvider: async () => process.env.UI_DESIGN_JUDGE_MOCK_RESPONSE,
    };
  }

  if (process.env.OPENAI_API_KEY) {
    return { providerName: 'openai', invokeProvider: callOpenAiProvider };
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return { providerName: 'anthropic', invokeProvider: callAnthropicProvider };
  }

  if (process.env.GEMINI_API_KEY) {
    return { providerName: 'gemini', invokeProvider: callGeminiProvider };
  }

  return null;
}
