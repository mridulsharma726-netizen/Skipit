const { supabaseAdmin } = require('../../config/supabase');

const INITIAL_CATEGORIES = [
  { name: 'Electronics', slug: 'electronics', icon: 'devices' },
  { name: 'Laptops and Computers', slug: 'laptops-and-computers', icon: 'laptop' },
  { name: 'Cameras and Photography', slug: 'cameras-and-photography', icon: 'camera_alt' },
  { name: 'Furniture', slug: 'furniture', icon: 'chair' },
  { name: 'Vehicles and Mobility', slug: 'vehicles-and-mobility', icon: 'directions_car' },
  { name: 'Home Appliances', slug: 'home-appliances', icon: 'kitchen' },
  { name: 'Sports and Fitness', slug: 'sports-and-fitness', icon: 'fitness_center' },
  { name: 'Tools and Equipment', slug: 'tools-and-equipment', icon: 'handyman' },
  { name: 'Clothing and Accessories', slug: 'clothing-and-accessories', icon: 'checkroom' },
  { name: 'Events and Party Equipment', slug: 'events-and-party-equipment', icon: 'celebration' },
  { name: 'Books and Education', slug: 'books-and-education', icon: 'menu_book' },
  { name: 'Other', slug: 'other', icon: 'more_horiz' },
];

const getCategories = async (req, res, next) => {
  try {
    const { data: dbCategories, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error || !dbCategories || dbCategories.length === 0) {
      return res.json({
        success: true,
        categories: INITIAL_CATEGORIES.map((c, idx) => ({ id: `cat-${idx + 1}`, ...c })),
      });
    }

    res.json({
      success: true,
      categories: dbCategories,
    });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, slug, icon, parent_id } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ success: false, error: 'Category name and slug are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert([{ name, slug, icon: icon || 'category', parent_id: parent_id || null }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.status(201).json({ success: true, category: data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  INITIAL_CATEGORIES,
};
