module.exports = async (req, res) => {
  const { key } = req.query;

  if (!key || key !== process.env.ADMIN_SECRET) {
    res.status(403).json({ error: 'Acceso denegado' });
    return;
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const response = await fetch(
      `${supabaseUrl}/rest/v1/orders?created_at=gte.${since.toISOString()}&select=created_at,items,total,item_count&order=created_at.desc`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );

    if (!response.ok) {
      res.status(502).json({ error: 'No se pudieron leer los pedidos' });
      return;
    }

    const orders = await response.json();

    const byDay = {};
    const productCount = {};

    orders.forEach(order => {
      const day = order.created_at.slice(0, 10);
      if (!byDay[day]) byDay[day] = { count: 0, total: 0 };
      byDay[day].count += 1;
      byDay[day].total += Number(order.total);

      (order.items || []).forEach(item => {
        const name = item.name;
        productCount[name] = (productCount[name] || 0) + (item.qty || 1);
      });
    });

    const days = Object.keys(byDay).sort().reverse().map(day => ({
      day,
      count: byDay[day].count,
      total: byDay[day].total
    }));

    const topProducts = Object.entries(productCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, qty]) => ({ name, qty }));

    const today = new Date().toISOString().slice(0, 10);
    const todayStats = byDay[today] || { count: 0, total: 0 };

    res.status(200).json({
      today: todayStats,
      days,
      topProducts,
      totalOrders: orders.length
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};
