module.exports = async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    const response = await fetch(
      `${supabaseUrl}/rest/v1/products?select=id,category,name,description,price,is_combo&order=category.asc,sort_order.asc`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );

    if (!response.ok) {
      res.status(502).json({ error: 'No se pudieron leer los productos' });
      return;
    }

    const products = await response.json();
    res.status(200).json(products);
  } catch (err) {
    console.error('Products error:', err);
    res.status(500).json({ error: 'Error interno' });
  }
};
