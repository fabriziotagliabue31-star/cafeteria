module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { items, total, item_count } = req.body || {};

  if (!items || !Array.isArray(items) || typeof total !== 'number') {
    res.status(400).json({ error: 'Datos de pedido inválidos' });
    return;
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    const response = await fetch(`${supabaseUrl}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        items,
        total,
        item_count: item_count || items.reduce((sum, i) => sum + (i.qty || 1), 0)
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Supabase insert error:', errText);
      res.status(502).json({ error: 'No se pudo guardar el pedido' });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Order log error:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};
