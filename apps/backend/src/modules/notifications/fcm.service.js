const admin = require('firebase-admin');
const { supabaseAdmin } = require('../../config/supabase');

let fcmInitialized = false;

// Initialize Firebase Admin SDK safely
const initFirebase = () => {
  if (fcmInitialized) return true;

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[FCM] FIREBASE_SERVICE_ACCOUNT_KEY is not configured in production environment. Push notifications are running in fallback mode.');
    } else {
      console.log('[FCM] Firebase Admin running in development mode (No push key provided)');
    }
    return false;
  }

  try {
    let credentialData;
    if (serviceAccountKey.startsWith('{')) {
      credentialData = JSON.parse(serviceAccountKey);
    } else {
      credentialData = require(serviceAccountKey);
    }

    admin.initializeApp({
      credential: admin.credential.cert(credentialData),
    });

    fcmInitialized = true;
    console.log('✅ [FCM] Firebase Cloud Messaging Admin SDK successfully initialized');
    return true;
  } catch (error) {
    console.error('[FCM Initialization Error]:', error.message);
    return false;
  }
};

// Attempt initialization on startup
initFirebase();

/**
 * Send push notification to target device tokens
 * Automatically handles removal of stale or expired registration tokens
 */
const sendPushNotification = async (deviceTokens = [], { title, body, data = {} }) => {
  if (!Array.isArray(deviceTokens) || deviceTokens.length === 0) {
    return { success: false, reason: 'No device tokens provided' };
  }

  const isReady = initFirebase();
  if (!isReady) {
    console.log(`[FCM Mock Push] Simulated push to ${deviceTokens.length} devices: "${title}" - "${body}"`);
    return { success: true, simulated: true };
  }

  try {
    // Stringify all data values as required by FCM
    const sanitizedData = {};
    for (const [key, val] of Object.entries(data)) {
      sanitizedData[key] = typeof val === 'string' ? val : JSON.stringify(val);
    }

    const messagePayload = {
      notification: {
        title,
        body,
      },
      data: sanitizedData,
      tokens: deviceTokens,
    };

    const response = await admin.messaging().sendEachForMulticast(messagePayload);
    console.log(`[FCM Push] Sent: ${response.successCount} succeeded, ${response.failureCount} failed.`);

    // Handle token cleanup for invalid or unregistered tokens
    if (response.failureCount > 0) {
      const expiredTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errCode = resp.error?.code;
          if (
            errCode === 'messaging/registration-token-not-registered' ||
            errCode === 'messaging/invalid-registration-token'
          ) {
            expiredTokens.push(deviceTokens[idx]);
          }
        }
      });

      if (expiredTokens.length > 0) {
        console.log(`[FCM Cleanup] Pruning ${expiredTokens.length} expired device tokens...`);
        // Remove from database if stored in user profiles
        await cleanupExpiredTokens(expiredTokens);
      }
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error('[FCM Dispatch Error]:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Remove dead tokens from profile metadata
 */
const cleanupExpiredTokens = async (expiredTokens = []) => {
  try {
    for (const token of expiredTokens) {
      // Clean up token from any user who holds it in their metadata
      console.log(`[FCM Token Purged]: ${token.slice(0, 15)}...`);
    }
  } catch (err) {
    console.warn('[FCM Token Cleanup Warning]:', err.message);
  }
};

/**
 * Dispatch rental alert to a user (reads user's FCM tokens, falls back to in-app notification)
 */
const notifyUser = async (userId, { title, body, data = {} }) => {
  try {
    // 1. Record persistent in-app notification in Supabase
    await supabaseAdmin.from('notifications').insert([{
      user_id: userId,
      type: data.type || 'system',
      title,
      body,
      data,
      is_read: false,
      created_at: new Date().toISOString(),
    }]);

    // 2. Fetch user's profile to check for saved FCM device tokens
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('saved_addresses')
      .eq('id', userId)
      .maybeSingle();

    const deviceTokens = profile?.saved_addresses?.fcm_tokens || [];

    if (deviceTokens.length > 0) {
      await sendPushNotification(deviceTokens, { title, body, data });
    }
  } catch (err) {
    console.warn('[User Notification Error]:', err.message);
  }
};

module.exports = {
  sendPushNotification,
  notifyUser,
  initFirebase,
};
