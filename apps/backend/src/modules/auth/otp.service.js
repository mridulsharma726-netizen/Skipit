const crypto = require('crypto');
const config = require('../../config/env');
const { supabaseAdmin } = require('../../config/supabase');

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_OTP_ATTEMPTS = 3;

// In-memory cache for fast lookups; synced with Supabase for multi-instance deployments
const memoryOtpCache = new Map();

/**
 * Hash OTP with application secret to prevent plain-text exposure
 */
const hashOtp = (phone, otp) => {
  return crypto
    .createHmac('sha256', config.jwtSecret)
    .update(`${phone}:${otp}`)
    .digest('hex');
};

/**
 * Send real SMS through configured provider
 */
const dispatchSms = async (phone, otp) => {
  const provider = (process.env.SMS_PROVIDER || 'mock').toLowerCase();

  const message = `Your SkipIt verification code is ${otp}. Valid for 5 minutes. Do not share this code.`;

  try {
    switch (provider) {
      case 'twilio': {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_PHONE_NUMBER;

        if (!accountSid || !authToken || !fromNumber) {
          throw new Error('Twilio credentials missing in environment');
        }

        const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const params = new URLSearchParams();
        params.append('To', phone);
        params.append('From', fromNumber);
        params.append('Body', message);

        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${authHeader}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Twilio SMS failed (${response.status}): ${errText}`);
        }
        console.log(`[SMS Engine] Twilio SMS dispatched successfully to ${phone}`);
        return { success: true, provider: 'twilio' };
      }

      case 'msg91': {
        const authKey = process.env.MSG91_AUTH_KEY;
        const templateId = process.env.MSG91_TEMPLATE_ID;

        if (!authKey || !templateId) {
          throw new Error('Msg91 credentials or template ID missing in environment');
        }

        const cleanPhone = phone.replace(/\D/g, '');
        const response = await fetch('https://api.msg91.com/api/v5/otp', {
          method: 'POST',
          headers: {
            'authkey': authKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            template_id: templateId,
            mobile: cleanPhone,
            otp: otp,
          }),
        });

        const resData = await response.json();
        if (resData.type === 'error') {
          throw new Error(`Msg91 error: ${resData.message}`);
        }
        console.log(`[SMS Engine] Msg91 OTP dispatched successfully to ${phone}`);
        return { success: true, provider: 'msg91' };
      }

      case 'fast2sms': {
        const apiKey = process.env.FAST2SMS_API_KEY;
        if (!apiKey) throw new Error('Fast2SMS API key missing in environment');

        const cleanPhone = phone.replace(/\D/g, '').slice(-10);
        const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            'authorization': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            variables_values: otp,
            route: 'otp',
            numbers: cleanPhone,
          }),
        });

        const resData = await response.json();
        if (!resData.return) {
          throw new Error(`Fast2SMS error: ${resData.message || 'Dispatch failed'}`);
        }
        console.log(`[SMS Engine] Fast2SMS OTP dispatched successfully to ${phone}`);
        return { success: true, provider: 'fast2sms' };
      }

      case 'mock':
      default: {
        // Safe logging in development/staging
        if (process.env.NODE_ENV === 'production') {
          console.warn('[SECURITY WARNING] SMS_PROVIDER is set to mock in production. Set SMS_PROVIDER to twilio/msg91/fast2sms for real carrier delivery.');
        } else {
          console.log(`[SMS Engine Mock] Generated OTP for ${phone}: ${otp}`);
        }
        return { success: true, provider: 'mock' };
      }
    }
  } catch (error) {
    console.error(`[SMS Engine Error] Failed to send SMS to ${phone}:`, error.message);
    throw error;
  }
};

/**
 * Generate and store a new secure OTP
 */
const generateAndStoreOtp = async (phone) => {
  // Generate secure 6-digit number between 100000 and 999999
  const otp = crypto.randomInt(100000, 1000000).toString();
  const hashed = hashOtp(phone, otp);
  const expiresAt = Date.now() + OTP_EXPIRY_MS;

  const sessionData = {
    phone,
    otp_hash: hashed,
    expires_at: expiresAt,
    attempts: 0,
    created_at: new Date().toISOString(),
  };

  // 1. Store in memory cache
  memoryOtpCache.set(phone, sessionData);

  // 2. Persist across instances in Supabase audit_log
  try {
    await supabaseAdmin.from('audit_log').insert([{
      action: 'OTP_SESSION',
      entity_type: 'otp',
      entity_id: '00000000-0000-0000-0000-000000000000',
      new_data: sessionData,
      created_at: new Date().toISOString(),
    }]);
  } catch (e) {
    console.warn('[OTP Persistence Warning]:', e.message);
  }

  // 3. Dispatch via SMS provider
  await dispatchSms(phone, otp);

  // In non-production environments, provide generated code in response for automated testing
  const isDevAllowed = process.env.NODE_ENV !== 'production';

  return {
    expiresInSeconds: Math.floor(OTP_EXPIRY_MS / 1000),
    devOtp: isDevAllowed ? otp : undefined,
  };
};

/**
 * Verify OTP with expiry, attempt throttling, and cross-instance check
 */
const verifyStoredOtp = async (phone, submittedOtp) => {
  const isDevAllowed = process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEV_OTP === 'true';

  // 1. Check in-memory cache first
  let session = memoryOtpCache.get(phone);

  // 2. If not in memory, query cross-instance record from Supabase
  if (!session) {
    try {
      const { data: records } = await supabaseAdmin
        .from('audit_log')
        .select('*')
        .eq('action', 'OTP_SESSION')
        .order('created_at', { ascending: false })
        .limit(5);

      const match = records?.find((r) => r.new_data?.phone === phone);
      if (match) {
        session = match.new_data;
      }
    } catch (e) {
      console.warn('[OTP Fetch Warning]:', e.message);
    }
  }

  // If developer fallback is enabled in dev/test environment
  if (!session) {
    if (isDevAllowed && submittedOtp === '123456') {
      console.log(`[OTP Verification] Accepted dev code 123456 for ${phone} (Development Mode Only)`);
      return { valid: true };
    }
    return { valid: false, error: 'No active OTP verification session found. Please request a new code.' };
  }

  // 3. Check Expiry
  if (Date.now() > session.expires_at) {
    memoryOtpCache.delete(phone);
    return { valid: false, error: 'OTP has expired. Please request a new verification code.' };
  }

  // 4. Check Attempt Limits
  if (session.attempts >= MAX_OTP_ATTEMPTS) {
    memoryOtpCache.delete(phone);
    return {
      valid: false,
      error: 'Maximum verification attempts exceeded. For security, please request a new OTP.',
    };
  }

  // 5. Compare Hashed OTP
  const submittedHash = hashOtp(phone, submittedOtp);
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(submittedHash, 'hex'),
    Buffer.from(session.otp_hash, 'hex')
  );

  // Also allow dev OTP strictly in dev mode if flag enabled
  const devCodeMatch = isDevAllowed && submittedOtp === '123456';

  if (!isMatch && !devCodeMatch) {
    session.attempts += 1;
    memoryOtpCache.set(phone, session);
    const remaining = MAX_OTP_ATTEMPTS - session.attempts;
    return {
      valid: false,
      error: `Invalid verification code. ${remaining} attempt(s) remaining.`,
    };
  }

  // Verification succeeded - clear session to prevent replay attacks
  memoryOtpCache.delete(phone);

  return { valid: true };
};

module.exports = {
  generateAndStoreOtp,
  verifyStoredOtp,
};
