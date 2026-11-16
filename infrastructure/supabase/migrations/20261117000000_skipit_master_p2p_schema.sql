-- ============================================================================
-- SKIPIT 3.0: COMPLETE PRODUCTION MASTER P2P DATABASE SCHEMA & RLS POLICIES
-- Model: 0% Platform Commission Peer-to-Peer Rental Marketplace
-- Engine: Supabase / PostgreSQL 15+
-- ============================================================================

-- Enable Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. PROFILES TABLE (Users & User Profiles)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    phone_number TEXT,
    avatar_url TEXT,
    bio TEXT,
    location TEXT DEFAULT 'Delhi NCR, India',
    city TEXT DEFAULT 'New Delhi',
    state TEXT DEFAULT 'Delhi',
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
    rating NUMERIC(3, 2) DEFAULT 5.00 CHECK (rating >= 1.00 AND rating <= 5.00),
    trust_score INTEGER DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
    is_verified BOOLEAN DEFAULT FALSE,
    kyc_status TEXT DEFAULT 'unverified' CHECK (kyc_status IN ('unverified', 'pending', 'approved', 'rejected')),
    kyc_document_type TEXT,
    kyc_document_url TEXT,
    kyc_selfie_url TEXT,
    kyc_reviewed_at TIMESTAMPTZ,
    kyc_reviewer_notes TEXT,
    contact_preference TEXT DEFAULT 'chat_only' CHECK (contact_preference IN ('chat_only', 'chat_and_call')),
    is_banned BOOLEAN DEFAULT FALSE,
    saved_addresses JSONB DEFAULT '[]'::jsonb,
    total_rentals INTEGER DEFAULT 0,
    total_listings INTEGER DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 2. CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT NOT NULL,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 3. LISTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price_per_day NUMERIC(10, 2) NOT NULL CHECK (price_per_day >= 0),
    price_per_hour NUMERIC(10, 2),
    price_per_week NUMERIC(10, 2),
    price_per_month NUMERIC(10, 2),
    pricing_unit TEXT DEFAULT 'daily' CHECK (pricing_unit IN ('hourly', 'daily', 'weekly', 'monthly')),
    deposit_amount NUMERIC(10, 2) DEFAULT 0.00 CHECK (deposit_amount >= 0),
    deposit_details TEXT,
    category TEXT NOT NULL,
    subcategory TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    brand TEXT,
    model TEXT,
    condition TEXT DEFAULT 'good' CHECK (condition IN ('brand_new', 'like_new', 'good', 'fair')),
    images TEXT[] DEFAULT '{}',
    location_name TEXT NOT NULL,
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    pickup_options JSONB DEFAULT '{"pickup": true, "delivery": false}'::jsonb,
    delivery_options JSONB DEFAULT '{"pickup": true, "delivery": false}'::jsonb,
    rental_terms TEXT,
    contact_preference TEXT DEFAULT 'chat_only' CHECK (contact_preference IN ('chat_only', 'chat_and_call')),
    min_rental_days INTEGER DEFAULT 1 CHECK (min_rental_days >= 1),
    max_rental_days INTEGER DEFAULT 30 CHECK (max_rental_days >= min_rental_days),
    is_available BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    views_count INTEGER DEFAULT 0,
    saves_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 4. LISTING IMAGES TABLE (Normalized media gallery)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.listing_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    storage_path TEXT,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 5. RENTAL REQUESTS TABLE (P2P Rental Lifecycle: Pending -> Accepted/Rejected)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rental_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    renter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    rental_duration INTEGER NOT NULL CHECK (rental_duration >= 1),
    daily_rate NUMERIC(10, 2) NOT NULL,
    total_rental_amount NUMERIC(10, 2) NOT NULL,
    security_deposit NUMERIC(10, 2) DEFAULT 0.00,
    request_status TEXT DEFAULT 'pending' CHECK (request_status IN ('pending', 'accepted', 'rejected', 'cancelled', 'completed')),
    owner_response TEXT,
    handover_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT check_dates CHECK (end_date >= start_date)
);

-- ============================================================================
-- 6. CONVERSATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    rental_request_id UUID REFERENCES public.rental_requests(id) ON DELETE SET NULL,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    renter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    initial_inquiry TEXT,
    last_message_text TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_p2p_conversation UNIQUE (listing_id, renter_id)
);

-- ============================================================================
-- 7. MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    booking_id UUID,
    rental_request_id UUID REFERENCES public.rental_requests(id) ON DELETE SET NULL,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'inquiry', 'offer', 'system')),
    attachment_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 8. WISHLISTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_wishlist UNIQUE (user_id, listing_id)
);

-- ============================================================================
-- 9. REVIEWS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    rental_request_id UUID REFERENCES public.rental_requests(id) ON DELETE SET NULL,
    booking_id UUID,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    is_verified_rental BOOLEAN DEFAULT TRUE,
    response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 10. REPORTS TABLE (Moderation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
    rental_request_id UUID REFERENCES public.rental_requests(id) ON DELETE SET NULL,
    booking_id UUID,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 11. NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 12. SUPPORT TICKETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 13. USER BLOCKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_block UNIQUE (blocker_id, blocked_id)
);

-- ============================================================================
-- 14. AUDIT LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- INDEXES FOR HIGH-PERFORMANCE QUERIES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_listings_category ON public.listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_owner ON public.listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_listings_is_active ON public.listings(is_active);
CREATE INDEX IF NOT EXISTS idx_listings_location_name ON public.listings(location_name);
CREATE INDEX IF NOT EXISTS idx_listing_images_listing ON public.listing_images(listing_id, display_order);
CREATE INDEX IF NOT EXISTS idx_rental_requests_renter ON public.rental_requests(renter_id, request_status);
CREATE INDEX IF NOT EXISTS idx_rental_requests_owner ON public.rental_requests(owner_id, request_status);
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON public.conversations(owner_id, renter_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets(user_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON public.reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- ============================================================================
-- AUTOMATED UPDATED_AT TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_listings_updated_at ON public.listings;
CREATE TRIGGER trigger_listings_updated_at
    BEFORE UPDATE ON public.listings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_rental_requests_updated_at ON public.rental_requests;
CREATE TRIGGER trigger_rental_requests_updated_at
    BEFORE UPDATE ON public.rental_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_conversations_updated_at ON public.conversations;
CREATE TRIGGER trigger_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trigger_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- 1. Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.profiles FOR SELECT 
    USING (is_banned = FALSE OR auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 2. Categories RLS (Public read, admin write)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone" 
    ON public.categories FOR SELECT 
    USING (is_active = TRUE);

-- 3. Listings RLS
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active listings are viewable by everyone" 
    ON public.listings FOR SELECT 
    USING (is_active = TRUE OR auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create listings" 
    ON public.listings FOR INSERT 
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own listings" 
    ON public.listings FOR UPDATE 
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own listings" 
    ON public.listings FOR DELETE 
    USING (auth.uid() = owner_id);

-- 4. Listing Images RLS
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Listing images are viewable by everyone" 
    ON public.listing_images FOR SELECT 
    USING (TRUE);

CREATE POLICY "Listing owners can manage listing images" 
    ON public.listing_images FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.listings 
            WHERE listings.id = listing_images.listing_id 
            AND listings.owner_id = auth.uid()
        )
    );

-- 5. Rental Requests RLS
ALTER TABLE public.rental_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their rental requests" 
    ON public.rental_requests FOR SELECT 
    USING (auth.uid() = renter_id OR auth.uid() = owner_id);

CREATE POLICY "Authenticated users can submit rental requests" 
    ON public.rental_requests FOR INSERT 
    WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "Participants can update their rental requests" 
    ON public.rental_requests FOR UPDATE 
    USING (auth.uid() = renter_id OR auth.uid() = owner_id)
    WITH CHECK (auth.uid() = renter_id OR auth.uid() = owner_id);

-- 6. Conversations RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view conversations" 
    ON public.conversations FOR SELECT 
    USING (auth.uid() = owner_id OR auth.uid() = renter_id);

CREATE POLICY "Participants can create conversations" 
    ON public.conversations FOR INSERT 
    WITH CHECK (auth.uid() = renter_id OR auth.uid() = owner_id);

CREATE POLICY "Participants can update conversation timestamp" 
    ON public.conversations FOR UPDATE 
    USING (auth.uid() = owner_id OR auth.uid() = renter_id);

-- 7. Messages RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their messages" 
    ON public.messages FOR SELECT 
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Authenticated users can send messages to peers" 
    ON public.messages FOR INSERT 
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receivers can mark messages as read" 
    ON public.messages FOR UPDATE 
    USING (auth.uid() = receiver_id);

-- 8. Wishlists RLS
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wishlist" 
    ON public.wishlists FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own wishlist" 
    ON public.wishlists FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their own wishlist" 
    ON public.wishlists FOR DELETE 
    USING (auth.uid() = user_id);

-- 9. Reviews RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone" 
    ON public.reviews FOR SELECT 
    USING (TRUE);

CREATE POLICY "Verified renters can create reviews" 
    ON public.reviews FOR INSERT 
    WITH CHECK (auth.uid() = reviewer_id);

-- 10. Reports RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reporters can submit reports" 
    ON public.reports FOR INSERT 
    WITH CHECK (auth.uid() = reporter_id);

-- 11. Notifications RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" 
    ON public.notifications FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can mark their own notifications as read" 
    ON public.notifications FOR UPDATE 
    USING (auth.uid() = user_id);

-- 12. Support Tickets RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own support tickets" 
    ON public.support_tickets FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create support tickets" 
    ON public.support_tickets FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- 13. User Blocks RLS
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own blocks" 
    ON public.user_blocks FOR ALL 
    USING (auth.uid() = blocker_id);

-- ============================================================================
-- STORAGE BUCKETS & STORAGE RLS POLICIES
-- ============================================================================

-- Ensure storage schema buckets exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('avatars', 'avatars', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
    ('listing-images', 'listing-images', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/jpg']),
    ('chat-attachments', 'chat-attachments', false, 15728640, ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf']),
    ('kyc-documents', 'kyc-documents', false, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Objects RLS
CREATE POLICY "Public avatars can be viewed by all"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Public listing images can be viewed by all"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'listing-images');

CREATE POLICY "Authenticated users can upload listing images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'listing-images' AND auth.role() = 'authenticated');

CREATE POLICY "KYC documents viewable only by owner and admins"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'kyc-documents' AND (
            auth.uid()::text = (storage.foldername(name))[1]
            OR EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role IN ('admin', 'moderator')
            )
        )
    );
