const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../../config/supabase');
const config = require('../../config/env');
const { uploadToSupabaseStorage } = require('../../middleware/upload');
const { generateAndStoreOtp, verifyStoredOtp } = require('./otp.service');

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email || '',
      phone: user.phone || user.phone_number || '',
      role: user.role || 'user',
    },
    config.jwtSecret,
    { expiresIn: '30d' }
  );
};

// 0. Google Authentication (100% Free, Zero-SMS Gateway Cost)
const googleAuth = async (req, res, next) => {
  try {
    const { credential, id_token, email: directEmail, full_name: directName, avatar_url: directAvatar } = req.body;

    let email = directEmail;
    let full_name = directName;
    let avatar_url = directAvatar;

    // Decode Google JWT if credential or id_token is provided
    const tokenToDecode = credential || id_token;
    if (tokenToDecode && typeof tokenToDecode === 'string') {
      try {
        const decoded = jwt.decode(tokenToDecode);
        if (decoded && decoded.email) {
          email = decoded.email;
          full_name = decoded.name || decoded.full_name || full_name;
          avatar_url = decoded.picture || decoded.avatar_url || avatar_url;
        }
      } catch (e) {
        console.warn('[Google Auth] Could not decode Google JWT token:', e.message);
      }
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required for Google Sign-In',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    console.log(`[Google Auth] Processing sign-in request for: ${cleanEmail}`);

    // Check if user already exists in Supabase Auth
    let userId = null;
    try {
      const { data: listData, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
      if (!listErr && listData?.users) {
        const existingUser = listData.users.find((u) => u.email?.toLowerCase() === cleanEmail);
        if (existingUser) {
          userId = existingUser.id;
        }
      }
    } catch (e) {
      console.warn('[Google Auth List Users]', e.message);
    }

    // Provision in Supabase Auth if not found
    if (!userId) {
      const randomPassword = `SkipIt_Google_${Math.random().toString(36).substring(2, 12)}!`;
      const { data: newAuthUser, error: createAuthErr } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          full_name: full_name || cleanEmail.split('@')[0],
          avatar_url: avatar_url || null,
          email_verified: true,
          provider: 'google',
        },
      });

      if (createAuthErr) {
        console.warn('[Google Auth Create User Warning]:', createAuthErr.message);
        const { data: listAgain } = await supabaseAdmin.auth.admin.listUsers();
        const found = listAgain?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);
        userId = found ? found.id : null;
      } else {
        userId = newAuthUser?.user?.id;
      }
    }

    if (!userId) {
      return res.status(500).json({ success: false, error: 'Could not provision Google user account' });
    }

    // Retrieve or create profile entry
    let { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      const { data: newProfile, error: pErr } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          full_name: full_name || cleanEmail.split('@')[0],
          avatar_url: avatar_url || null,
          location: 'Bengaluru, India',
          role: 'user',
          rating: 5.0,
          trust_score: 75,
          is_verified: true,
          kyc_status: 'none',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (pErr) {
        console.error('[Google Auth Profile Upsert Error]:', pErr);
      }
      profile = newProfile;
    } else {
      // Sync avatar or verified status if improved
      const updates = {};
      if (!profile.avatar_url && avatar_url) updates.avatar_url = avatar_url;
      if ((!profile.full_name || profile.full_name === 'SkipIt Member') && full_name) updates.full_name = full_name;
      if (!profile.is_verified) updates.is_verified = true;
      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString();
        const { data: updatedProfile } = await supabaseAdmin
          .from('profiles')
          .update(updates)
          .eq('id', userId)
          .select()
          .single();
        if (updatedProfile) profile = updatedProfile;
      }
    }

    if (profile?.is_banned) {
      return res.status(403).json({
        success: false,
        error: 'Your account has been suspended by administration',
      });
    }

    const token = generateToken({
      id: userId,
      email: cleanEmail,
      role: profile?.role || 'user',
    });

    console.log(`[Google Auth Success]: Authenticated ${cleanEmail} (ID: ${userId})`);

    res.json({
      success: true,
      message: 'Signed in with Google successfully',
      token,
      user: {
        ...(profile || {}),
        id: userId,
        email: cleanEmail,
        full_name: profile?.full_name || full_name || cleanEmail.split('@')[0],
      },
    });
  } catch (error) {
    console.error('[Google Auth Unhandled Error]:', error);
    next(error);
  }
};

// 1. Mobile or Email Registration
const register = async (req, res, next) => {
  try {
    const { email, password, phone, full_name, location } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        error: 'Either email or phone number is required',
      });
    }

    const userEmail = email || `${phone.replace(/\D/g, '')}@skipit.local`;
    const userPassword = password || `SkipIt_${Math.random().toString(36).substring(2, 10)}`;

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userEmail,
      password: userPassword,
      email_confirm: true,
      user_metadata: { full_name, phone },
    });

    if (authError) {
      // If user already exists, find existing profile
      if (authError.message.includes('already registered') || authError.code === 'user_already_exists') {
        return res.status(409).json({
          success: false,
          error: 'An account with this email or phone already exists',
        });
      }
      return res.status(400).json({ success: false, error: authError.message });
    }

    const userId = authData.user.id;

    // Create profile entry
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        full_name: full_name || 'SkipIt Member',
        email: userEmail,
        phone: phone || '',
        phone_number: phone || '',
        location: location || 'Bengaluru, India',
        role: 'user',
        rating: 5.0,
        trust_score: 50,
        is_verified: false,
        kyc_status: 'unverified',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) {
      console.error('[Register Profile Error]:', profileError);
    }

    const token = generateToken({ id: userId, email: userEmail, phone, role: 'user' });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: profile || { id: userId, full_name, email: userEmail, phone },
    });
  } catch (error) {
    next(error);
  }
};

// 2. Login with Password or Mobile
const login = async (req, res, next) => {
  try {
    const { email, phone, password } = req.body;

    let targetEmail = email;

    if (!targetEmail && phone) {
      // Find user by phone in profiles
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .or(`phone.eq.${phone},phone_number.eq.${phone}`)
        .maybeSingle();

      if (profile) {
        targetEmail = profile.email || `${phone.replace(/\D/g, '')}@skipit.local`;
      } else {
        targetEmail = `${phone.replace(/\D/g, '')}@skipit.local`;
      }
    }

    if (!targetEmail) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email or phone number to sign in',
      });
    }

    // Try Supabase auth sign-in
    let { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: targetEmail,
      password,
    });

    if (authError || !authData.user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Please verify your email/phone and password.',
      });
    }

    const userId = authData.user.id;

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profile && profile.is_banned) {
      return res.status(403).json({
        success: false,
        error: 'Your account has been suspended by administration',
      });
    }

    const token = generateToken(profile || { id: userId, email: targetEmail });

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: profile || { id: userId, email: targetEmail },
    });
  } catch (error) {
    next(error);
  }
};

// 3. Send Mobile OTP (Multi-Provider SMS + Cryptographic Expiry Engine)
const sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }

    const cleanPhone = phone.trim();
    if (cleanPhone.replace(/\D/g, '').length < 10) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit phone number' });
    }

    const { expiresInSeconds, devOtp } = await generateAndStoreOtp(cleanPhone);

    res.json({
      success: true,
      message: `Verification code sent to ${cleanPhone}`,
      expires_in: expiresInSeconds,
      ...(devOtp ? { devOtp, devNote: `Development code: ${devOtp}` } : {}),
    });
  } catch (error) {
    next(error);
  }
};

// 4. Verify OTP with Attempt Throttling & Replay Defense
const verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp, full_name } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, error: 'Phone number and verification code are required' });
    }

    const cleanPhone = phone.trim();
    const verificationResult = await verifyStoredOtp(cleanPhone, otp.trim());

    if (!verificationResult.valid) {
      return res.status(400).json({
        success: false,
        error: verificationResult.error || 'Invalid or expired verification code',
      });
    }

    // Check if user exists with this phone
    let { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .or(`phone.eq.${cleanPhone},phone_number.eq.${cleanPhone}`)
      .maybeSingle();

    let userId = profile ? profile.id : null;

    if (!profile) {
      // Auto-provision user account
      const cleanPhone = phone.replace(/\D/g, '');
      const syntheticEmail = `${cleanPhone}@skipit.local`;
      const randomPassword = `SkipIt_${Math.random().toString(36).substring(2, 12)}!`;

      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: syntheticEmail,
        password: randomPassword,
        email_confirm: true,
        phone: cleanPhone,
      });

      if (createErr || !newUser?.user) {
        // Find existing user if auth created but profile missing
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const found = listData?.users?.find(u => u.email === syntheticEmail || u.phone === cleanPhone);
        userId = found ? found.id : null;
      } else {
        userId = newUser.user.id;
      }

      if (userId) {
        const { data: createdProfile } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: userId,
            full_name: full_name || `Member ${cleanPhone.slice(-4)}`,
            phone: cleanPhone,
            phone_number: cleanPhone,
            email: syntheticEmail,
            location: 'Bengaluru, India',
            is_verified: true, // Phone verified
            trust_score: 60,
            role: 'user',
          })
          .select()
          .single();

        profile = createdProfile;
      }
    }

    const token = generateToken(profile || { id: userId, phone });

    res.json({
      success: true,
      message: 'Phone verified successfully',
      token,
      user: profile || { id: userId, phone },
    });
  } catch (error) {
    next(error);
  }
};

// 5. Get current profile
const getMe = async (req, res, next) => {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ success: false, error: 'User profile not found' });
    }

    res.json({
      success: true,
      user: profile,
    });
  } catch (error) {
    next(error);
  }
};

// 6. Update Profile
const updateProfile = async (req, res, next) => {
  try {
    const { full_name, bio, location, phone, phone_number } = req.body;

    const updates = {
      updated_at: new Date().toISOString(),
    };
    if (full_name !== undefined) updates.full_name = full_name;
    if (bio !== undefined) updates.bio = bio;
    if (location !== undefined) updates.location = location;
    if (phone !== undefined) {
      updates.phone = phone;
      updates.phone_number = phone;
    }

    const { data: updatedProfile, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

// 7. Upload Avatar
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file uploaded' });
    }

    const publicUrl = await uploadToSupabaseStorage(req.file, 'avatars', req.user.id);

    const { data: updatedProfile, error } = await supabaseAdmin
      .from('profiles')
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      avatar_url: publicUrl,
      user: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

// 8. Submit KYC verification documents
const submitKyc = async (req, res, next) => {
  try {
    const { document_type } = req.body;
    let documentUrl = null;
    let selfieUrl = null;

    if (req.files && req.files.document && req.files.document[0]) {
      documentUrl = await uploadToSupabaseStorage(req.files.document[0], 'kyc-documents', `${req.user.id}/doc`);
    }

    if (req.files && req.files.selfie && req.files.selfie[0]) {
      selfieUrl = await uploadToSupabaseStorage(req.files.selfie[0], 'kyc-documents', `${req.user.id}/selfie`);
    }

    const { data: updatedProfile, error } = await supabaseAdmin
      .from('profiles')
      .update({
        kyc_status: 'pending',
        kyc_document_type: document_type || 'Aadhaar / National ID',
        kyc_document_url: documentUrl,
        kyc_selfie_url: selfieUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({
      success: true,
      message: 'Verification documents submitted. Our team will review them within 24 hours.',
      user: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

// 9. Delete Account
const deleteAccount = async (req, res, next) => {
  try {
    // Soft ban or delete
    await supabaseAdmin
      .from('listings')
      .update({ is_active: false, is_available: false })
      .eq('owner_id', req.user.id);

    await supabaseAdmin
      .from('profiles')
      .update({ is_banned: true, full_name: 'Deleted User', bio: 'Account closed' })
      .eq('id', req.user.id);

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  googleAuth,
  register,
  login,
  sendOtp,
  verifyOtp,
  getMe,
  updateProfile,
  uploadAvatar,
  submitKyc,
  deleteAccount,
};
