const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

webpush.setVapidDetails(
  'mailto:admin@handover.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, body, excludeUserId } = req.body;

  try {
    // 모든 구독자 가져오기 (알림 보낸 사람 제외)
    let query = supabase.from('push_subscriptions').select('*');
    if (excludeUserId) query = query.neq('user_id', excludeUserId);
    const { data: subs, error } = await query;

    if (error) throw error;
    if (!subs || subs.length === 0) return res.status(200).json({ sent: 0 });

    const payload = JSON.stringify({ title, body });
    const results = await Promise.allSettled(
      subs.map(sub => webpush.sendNotification(sub.subscription, payload))
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    // 만료된 구독 삭제
    const expiredIds = subs
      .filter((_, i) => results[i].status === 'rejected')
      .map(s => s.id);
    if (expiredIds.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', expiredIds);
    }

    res.status(200).json({ sent, failed });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
