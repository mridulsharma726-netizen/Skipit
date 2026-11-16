const { supabaseAdmin } = require('./apps/backend/src/config/supabase');

async function seed() {
  const listings = [
    {
      title: 'Sony Alpha 7 IV Mirrorless Camera + 24-70mm GM II',
      description: 'Pro 33MP full-frame hybrid camera with 4K 60p 10-bit recording. Includes 2 batteries, 128GB V90 card and protective carry bag.',
      price_per_day: 1499,
      deposit_amount: 5000,
      category: 'Cameras & Photography',
      condition: 'like-new',
      location_name: 'Indiranagar, Bengaluru',
      images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80'],
      is_active: true,
      is_available: true,
      views_count: 42,
      owner_id: '6bb91b34-e522-4647-880f-ca9ef97da8f4'
    },
    {
      title: 'DJI Mini 4 Pro Drone Fly More Combo',
      description: 'Sub-249g ultra-compact drone with omnidirectional obstacle sensing, 4K/60fps HDR video, and 34-min flight time per battery. RC 2 included.',
      price_per_day: 1899,
      deposit_amount: 6000,
      category: 'Cameras & Photography',
      condition: 'like-new',
      location_name: 'Koramangala, Bengaluru',
      images: ['https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=800&q=80'],
      is_active: true,
      is_available: true,
      views_count: 88,
      owner_id: '6bb91b34-e522-4647-880f-ca9ef97da8f4'
    },
    {
      title: 'Sony PlayStation 5 Disc Edition + 2 Controllers',
      description: 'PS5 console with ultra-high speed SSD, ray tracing, and 4K gaming. Preloaded with Spider-Man 2, God of War Ragnarok and FC 24.',
      price_per_day: 799,
      deposit_amount: 3000,
      category: 'Gaming & Consoles',
      condition: 'good',
      location_name: 'HSR Layout, Bengaluru',
      images: ['https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80'],
      is_active: true,
      is_available: true,
      views_count: 120,
      owner_id: '6bb91b34-e522-4647-880f-ca9ef97da8f4'
    },
    {
      title: 'Apple MacBook Pro 16 M3 Max (36GB / 1TB)',
      description: 'Beast machine for video editing, 3D rendering, and dev work. 16-inch Liquid Retina XDR display with 140W fast charger.',
      price_per_day: 2499,
      deposit_amount: 10000,
      category: 'Electronics',
      condition: 'like-new',
      location_name: 'Whitefield, Bengaluru',
      images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80'],
      is_active: true,
      is_available: true,
      views_count: 95,
      owner_id: '6bb91b34-e522-4647-880f-ca9ef97da8f4'
    },
    {
      title: 'Quechua 4-Person Waterproof Camping Tent',
      description: 'Easy pop-up 4-person tent with blackout technology, 2 sleeping bags, solar lantern, and ground mat. Perfect for weekend getaways.',
      price_per_day: 599,
      deposit_amount: 1500,
      category: 'Outdoor & Camping',
      condition: 'good',
      location_name: 'Jayanagar, Bengaluru',
      images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80'],
      is_active: true,
      is_available: true,
      views_count: 36,
      owner_id: '6bb91b34-e522-4647-880f-ca9ef97da8f4'
    },
    {
      title: 'JBL PartyBox 310 Portable Bluetooth Party Speaker',
      description: '240W colossal JBL sound with dynamic light show, dual mic and guitar inputs, splashproof IPX4, and 18-hour battery.',
      price_per_day: 999,
      deposit_amount: 3500,
      category: 'Party & Events',
      condition: 'like-new',
      location_name: 'MG Road, Bengaluru',
      images: ['https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80'],
      is_active: true,
      is_available: true,
      views_count: 64,
      owner_id: '6bb91b34-e522-4647-880f-ca9ef97da8f4'
    }
  ];

  const { data, error } = await supabaseAdmin.from('listings').insert(listings).select('id, title');
  if (error) {
    console.error('Insert error:', error);
  } else {
    console.log('Successfully inserted listings:', data.length);
  }
}

seed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
