const multer = require('multer');
const { supabaseAdmin } = require('../config/supabase');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only JPEG, PNG, and WebP are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter,
});

/**
 * Helper to upload buffer to Supabase Storage and get public URL
 */
const uploadToSupabaseStorage = async (file, bucketName = 'listing-images', folder = '') => {
  const extension = file.mimetype.split('/')[1] || 'jpg';
  const fileName = `${folder ? folder + '/' : ''}${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`;

  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
};

module.exports = {
  upload,
  uploadToSupabaseStorage,
};
