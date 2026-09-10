module.exports = async (req, res) => {
  const key = req.query.key || (req.body && req.body.key);

  if (!key || key !== process.env.ADMIN_SECRET) {
    res.status(403).json({ error: 'Acceso denegado' });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (req.method === 'POST') {
    const { id, price } = req.body || {};

    if (!id || typeof price !== 'number' || isNaN(price) || price < 0) {
      res.status(400).json({ error: 'Datos inválidos' });
      return;
    }

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/products?id=eq.${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ price })
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error('Supabase update error:', errText);
        res.status(502).json({ error: 'No se pudo actualizar el precio' });
        return;
      }

      res.status(200).json({ ok: true });
    } catch (err) {
      console.error('Admin products update error:', err);
      res.status(500).json({ error: 'Error interno' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
