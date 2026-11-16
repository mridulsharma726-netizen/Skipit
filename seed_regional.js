const { supabaseAdmin } = require('./apps/backend/src/config/supabase');

async function seedRegional() {
  const regionalListings = [
    {
      title: 'Canon EOS R6 Mark II Mirrorless Camera + 24-105mm F4 L',
      description: 'Superb 24.2MP full-frame hybrid camera with 40fps electronic shutter, 4K 60p oversampled video, dual SD slots. Perfect for weddings & events.',
      price_per_day: 1699,
      deposit_amount: 6000,
      category: 'Cameras & Photography',
      condition: 'like-new',
      location_name: 'Gurgaon (Cyber City), Haryana',
      images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80'],
      is_active: true,
      is_available: true,
      views_count: 55,
      owner_id: '6bb91b34-e522-4647-880f-ca9ef97da8f4'
    },
    {
      title: 'DJI RS 3 Pro Gimbal Stabilizer Combo',
      description: 'Professional 3-axis motorized gimbal for cinema & mirrorless rigs up to 4.5kg. Automated axis locks, LiDAR focusing support.',
      price_per_day: 1199,
      deposit_amount: 4000,
      category: 'Cameras & Photography',
      condition: 'like-new',
      location_name: 'Sohna Road, Gurgaon, Haryana',
      images: ['https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=800&q=80'],
      is_active: true,
      is_available: true,
      views_count: 72,
      owner_id: '6bb91b34-e522-4647-880f-ca9ef97da8f4'
    },
    {
      title: 'Apple iPad Pro 12.9 M2 (256GB WiFi) + Apple Pencil 2',
      description: 'Liquid Retina XDR display with ProMotion 120Hz, Apple Pencil 2 hover support, Paperlike screen guard applied. Ideal for digital art & presentations.',
      price_per_day: 899,
      deposit_amount: 4000,
      category: 'Electronics',
      condition: 'like-new',
      location_name: 'Connaught Place, New Delhi',
      images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80'],
      is_active: true,
      is_available: true,
      views_count: 81,
      owner_id: '6bb91b34-e522-4647-880f-ca9ef97da8f4'
    },
    {
      title: 'Meta Quest 3 512GB Mixed Reality VR Headset',
      description: 'Full-color passthrough mixed reality headset with 4K+ Infinite Display, 2 Touch Plus controllers with TruTouch haptics.',
      price_per_day: 1299,
      deposit_amount: 5000,
      category: 'Gaming & Consoles',
      condition: 'like-new',
      location_name: 'South Extension, New Delhi',
      images: ['https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?auto=format&fit=crop&w=800&q=80'],
      is_active: true,
      is_available: true,
      views_count: 110,
      owner_id: '6bb91b34-e522-4647-880f-ca9ef97da8f4'
    },
    {
      title: 'GoPro HERO 12 Black Creator Edition Bundle',
      description: '5.3K 60fps HDR action camera with Volta battery grip, Media Mod with directional mic, and Light Mod for pro vlogging.',
      price_per_day: 749,
      deposit_amount: 2500,
      category: 'Cameras & Photography',
      condition: 'like-new',
      location_name: 'Sector 29, Gurgaon, Haryana',
      images: ['https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80'],
      is_active: true,
      is_available: true,
      views_count: 67,
      owner_id: '6bb91b34-e522-4647-880f-ca9ef97da8f4'
    }
  ];

  const { data, error } = await supabaseAdmin.from('listings').insert(regionalListings).select('id, title, location_name');
  if (error) {
    console.error('Insert error:', error);
  } else {
    console.log('Successfully inserted NCR/Haryana listings:', data.length);
  }
}

seedRegional().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
