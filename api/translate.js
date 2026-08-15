const Anthropic = require('@anthropic-ai/sdk');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text, targetLang } = req.body;
  if (!text || !targetLang) return res.status(400).json({ error: 'Missing text or targetLang' });
  if (targetLang === 'ko') return res.status(200).json({ translated: text });

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_KEY });
    const langName = targetLang === 'en' ? 'English' : 'Nepali (नेपाली)';
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: 'Translate the following Korean text to ' + langName + '. Return only the translated text, nothing else:\n\n' + text
      }]
    });
    const translated = message.content[0].text.trim();
    res.status(200).json({ translated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
