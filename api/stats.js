module.exports = async (req, res) => {
  const { key } = req.query;

  if (!key || key !== process.env.ADMIN_SECRET) {
    res.status(403).json({ error: 'Acceso denegado' });
    return;
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    // Sin límite de fecha: trae todo el historial (hasta 5000 pedidos,
    // de sobra para años de una cafetería con este volumen).
    const response = await fetch(
      `${supabaseUrl}/rest/v1/orders?select=created_at,items,total,item_count&order=created_at.desc&limit=5000`,
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
    const byMonth = {};
    const productCount = {};
    let totalRevenue = 0;

    orders.forEach(order => {
      const day = order.created_at.slice(0, 10);
      const month = order.created_at.slice(0, 7);
      const total = Number(order.total);

      if (!byDay[day]) byDay[day] = { count: 0, total: 0 };
      byDay[day].count += 1;
      byDay[day].total += total;

      if (!byMonth[month]) byMonth[month] = { count: 0, total: 0 };
      byMonth[month].count += 1;
      byMonth[month].total += total;

      totalRevenue += total;

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

    const months = Object.keys(byMonth).sort().reverse().map(month => ({
      month,
      count: byMonth[month].count,
      total: byMonth[month].total
    }));

    const topProducts = Object.entries(productCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, qty]) => ({ name, qty }));

    const recentOrders = orders.slice(0, 50).map(o => ({
      created_at: o.created_at,
      items: o.items,
      total: Number(o.total)
    }));

    const today = new Date().toISOString().slice(0, 10);
    const todayStats = byDay[today] || { count: 0, total: 0 };

    res.status(200).json({
      today: todayStats,
      days,
      months,
      topProducts,
      recentOrders,
      totalOrders: orders.length,
      totalRevenue
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};
