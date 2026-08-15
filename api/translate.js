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
    const langName = targetLang === 'en' ? 'English' : 'Nepali (नेपाली)';
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: 'Translate the following Korean text to ' + langName + '. Return only the translated text, nothing else:\n\n' + text
        }]
      })
    });
    const data = await response.json();
    
    // 응답 전체를 로그로 확인
    console.log('Anthropic response:', JSON.stringify(data));
    
    if (!data.content || !data.content[0]) {
      return res.status(500).json({ error: 'Invalid response', data: data });
    }
    
    const translated = data.content[0].text.trim();
    res.status(200).json({ translated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
