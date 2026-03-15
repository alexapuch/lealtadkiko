-- ============================================================
-- Kiko Coffee - Loyalty Program Database Schema
-- Execute this SQL in Supabase SQL Editor
-- ============================================================

-- 0. Required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Custom type for user roles
CREATE TYPE user_role AS ENUM ('admin', 'customer');

-- 2. Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  stamps_count INT NOT NULL DEFAULT 0 CHECK (stamps_count >= 0 AND stamps_count <= 10),
  role user_role NOT NULL DEFAULT 'customer',
  qr_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. History / audit table
CREATE TABLE history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('stamp_added', 'reward_redeemed')),
  stamps_before INT NOT NULL,
  stamps_after INT NOT NULL,
  performed_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Indexes
CREATE INDEX idx_profiles_qr_token ON profiles(qr_token);
CREATE INDEX idx_history_profile_id ON history(profile_id);
CREATE INDEX idx_history_created_at ON history(created_at DESC);

-- 5. Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 7. Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Profiles: admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Profiles: users can update their own non-stamp fields
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Profiles: admins can update any profile (for stamps)
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- History: users can view their own history
CREATE POLICY "Users can view own history"
  ON history FOR SELECT
  USING (profile_id = auth.uid());

-- History: admins can view all history
CREATE POLICY "Admins can view all history"
  ON history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- History: admins can insert history records
CREATE POLICY "Admins can insert history"
  ON history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 8. Secure RPC function to add a stamp (only admins)
CREATE OR REPLACE FUNCTION add_stamp(customer_qr_token TEXT)
RETURNS JSON AS $$
DECLARE
  v_customer profiles%ROWTYPE;
  v_admin_id UUID := auth.uid();
  v_is_admin BOOLEAN;
BEGIN
  -- Verify caller is admin
  SELECT (role = 'admin') INTO v_is_admin FROM profiles WHERE id = v_admin_id;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Unauthorized: only admins can add stamps';
  END IF;

  -- Find customer by qr_token
  SELECT * INTO v_customer FROM profiles WHERE qr_token = customer_qr_token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;

  -- Check if already at max
  IF v_customer.stamps_count >= 10 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'El cliente ya tiene 10 sellos. Canjea el premio primero.'
    );
  END IF;

  -- Update stamps
  UPDATE profiles
    SET stamps_count = stamps_count + 1
    WHERE id = v_customer.id;

  -- Record history
  INSERT INTO history (profile_id, action, stamps_before, stamps_after, performed_by)
  VALUES (v_customer.id, 'stamp_added', v_customer.stamps_count, v_customer.stamps_count + 1, v_admin_id);

  RETURN json_build_object(
    'success', true,
    'customer_name', v_customer.full_name,
    'stamps_before', v_customer.stamps_count,
    'stamps_after', v_customer.stamps_count + 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Secure RPC function to redeem reward (only admins)
CREATE OR REPLACE FUNCTION redeem_reward(customer_qr_token TEXT)
RETURNS JSON AS $$
DECLARE
  v_customer profiles%ROWTYPE;
  v_admin_id UUID := auth.uid();
  v_is_admin BOOLEAN;
BEGIN
  -- Verify caller is admin
  SELECT (role = 'admin') INTO v_is_admin FROM profiles WHERE id = v_admin_id;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Unauthorized: only admins can redeem rewards';
  END IF;

  -- Find customer by qr_token
  SELECT * INTO v_customer FROM profiles WHERE qr_token = customer_qr_token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;

  -- Check if they have enough stamps
  IF v_customer.stamps_count < 10 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'El cliente no tiene suficientes sellos para canjear.'
    );
  END IF;

  -- Reset stamps to 0
  UPDATE profiles SET stamps_count = 0 WHERE id = v_customer.id;

  -- Record history
  INSERT INTO history (profile_id, action, stamps_before, stamps_after, performed_by)
  VALUES (v_customer.id, 'reward_redeemed', v_customer.stamps_count, 0, v_admin_id);

  RETURN json_build_object(
    'success', true,
    'customer_name', v_customer.full_name,
    'stamps_before', v_customer.stamps_count,
    'stamps_after', 0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. RPC to look up customer by QR token (admin only)
CREATE OR REPLACE FUNCTION lookup_customer(customer_qr_token TEXT)
RETURNS JSON AS $$
DECLARE
  v_customer profiles%ROWTYPE;
  v_is_admin BOOLEAN;
BEGIN
  SELECT (role = 'admin') INTO v_is_admin FROM profiles WHERE id = auth.uid();
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_customer FROM profiles WHERE qr_token = customer_qr_token;
  IF NOT FOUND THEN
    RETURN json_build_object('found', false);
  END IF;

  RETURN json_build_object(
    'found', true,
    'id', v_customer.id,
    'full_name', v_customer.full_name,
    'email', v_customer.email,
    'stamps_count', v_customer.stamps_count,
    'qr_token', v_customer.qr_token
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
