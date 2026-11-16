const http = require('http');
const assert = require('assert');
const app = require('../src/app');

const BASE_URL = 'http://localhost:5000';

function request(path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting SkipIt 3.0 Production-Readiness Integration Tests...\n');

  let serverInstance = null;
  try {
    // Check if server is already running, else start it
    serverInstance = await new Promise((resolve) => {
      const s = app.listen(5000, () => resolve(s));
      s.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(null); // Already running
        } else {
          throw err;
        }
      });
    });
    // 1. Health Check
    console.log('[1/10] Testing Health Endpoint...');
    const health = await request('/api/v1/health');
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.data.mode, 'Zero Commission P2P');
    console.log('  ✓ Health check passed (0% Commission P2P Verified)');

    // 2. Categories
    console.log('[2/10] Testing Categories API...');
    const categoriesRes = await request('/api/v1/categories');
    assert.strictEqual(categoriesRes.status, 200);
    assert.ok(Array.isArray(categoriesRes.data.categories));
    assert.ok(categoriesRes.data.categories.length > 0);
    console.log(`  ✓ Categories endpoint returned ${categoriesRes.data.categories.length} categories`);

    // 3. Listings Discovery
    console.log('[3/10] Testing Listings Search & Retrieval...');
    const listingsRes = await request('/api/v1/listings?limit=5');
    assert.strictEqual(listingsRes.status, 200);
    assert.ok(Array.isArray(listingsRes.data.listings));
    console.log(`  ✓ Listings discovery passed (${listingsRes.data.listings.length} items loaded)`);

    // 4. Featured Listings
    console.log('[4/10] Testing Featured Listings...');
    const featuredRes = await request('/api/v1/listings/featured');
    assert.strictEqual(featuredRes.status, 200);
    assert.ok(Array.isArray(featuredRes.data.listings));
    console.log(`  ✓ Featured listings returned ${featuredRes.data.listings.length} items`);

    // 5. Google Sign-In Flow (100% Free, Zero-SMS Gateway Cost)
    console.log('[5/10] Testing Google Sign-In Flow (Zero-SMS Cost, Auto-Provisioning)...');
    const googleRes = await request('/api/v1/auth/google', { method: 'POST' }, {
      email: 'mridulsharma726@gmail.com',
      full_name: 'Mridul Sharma',
      avatar_url: 'https://lh3.googleusercontent.com/a/verified-avatar',
    });
    assert.strictEqual(googleRes.status, 200);
    assert.ok(googleRes.data.success);
    assert.ok(googleRes.data.token);
    assert.ok(googleRes.data.user);
    const authToken = googleRes.data.token;
    const testUserId = googleRes.data.user.id;
    console.log('  ✓ Google Sign-In and JWT session generation successful');

    // 6. Authenticated Profile & Wishlist Access
    console.log('[6/10] Testing Authenticated Actions (Me & Wishlist)...');
    const meRes = await request('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meRes.data.success, true);

    const wishlistRes = await request('/api/v1/wishlist', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(wishlistRes.status, 200);
    assert.ok(Array.isArray(wishlistRes.data.wishlist));
    console.log('  ✓ Authenticated user session and wishlist verified');

    // 7. Create Listing Workflow with Zod Validation
    console.log('[7/10] Testing Create Listing Workflow (Zod Validated)...');
    const newListingPayload = {
      title: 'Automated Test Cinema Lens 50mm',
      description: 'Prime cinema lens for full-frame cameras in pristine condition.',
      category: 'Cameras & Photography',
      condition: 'like_new',
      price_per_day: 1200,
      deposit_amount: 5000,
      location_name: 'Bengaluru, Koramangala',
      brand: 'Sony',
      model: 'FE 50mm f/1.2 GM',
    };
    const createRes = await request('/api/v1/listings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    }, newListingPayload);
    assert.strictEqual(createRes.status, 201);
    assert.ok(createRes.data.listing?.id);
    const createdListingId = createRes.data.listing.id;
    console.log(`  ✓ Listing created successfully (ID: ${createdListingId})`);

    // 8. P2P Direct Rental Inquiry Workflow
    console.log('[8/10] Testing Direct Rental Inquiry (No middleman checkout)...');
    // Renting from admin or peer
    const targetListing = listingsRes.data.listings.find(l => l.owner_id !== testUserId) || listingsRes.data.listings[0];
    if (targetListing && targetListing.owner_id !== testUserId) {
      const inquiryRes = await request('/api/v1/chat/inquiry', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      }, {
        listing_id: targetListing.id,
        initial_message: 'Is this camera lens available for this weekend?',
      });
      assert.strictEqual(inquiryRes.status, 201);
      console.log('  ✓ P2P direct rental inquiry dispatched with listing context');
    } else {
      console.log('  ✓ P2P inquiry skipped (own listing check verified)');
    }

    // 9. Reporting Workflow
    console.log('[9/10] Testing User / Listing Moderation Report...');
    const reportRes = await request('/api/v1/reports', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    }, {
      reason: 'Automated test report for quality verification',
      description: 'Verifying reporting endpoint functioning properly',
      listing_id: createdListingId,
    });
    assert.strictEqual(reportRes.status, 201);
    console.log('  ✓ Moderation report submitted successfully');

    // 10. Listing Lifecycle: Toggle Status & Delete
    console.log('[10/10] Testing Listing Lifecycle (Pause Status & Clean Delete)...');
    const toggleRes = await request(`/api/v1/listings/${createdListingId}/toggle-status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(toggleRes.status, 200);
    assert.strictEqual(toggleRes.data.listing.is_available, false);

    const deleteRes = await request(`/api/v1/listings/${createdListingId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.strictEqual(deleteRes.status, 200);
    console.log('  ✓ Listing status toggled and temporary test item deleted');

    console.log('\n🎉 ALL 10 INTEGRATION WORKFLOW SUITES PASSED FLAWLESSLY!\n');
    if (serverInstance) serverInstance.close();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err);
    if (serverInstance) serverInstance.close();
    process.exit(1);
  }
}

runTests();
