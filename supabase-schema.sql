-- QuoteFlow Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_name text DEFAULT 'Ashok Vidyut',
  company_logo text DEFAULT '',
  company_address text DEFAULT 'Ashok Chowk, Opp WIT Boys Hostel, Old WIT College Road, SOLAPUR-413005',
  company_phone text DEFAULT '8411022244',
  validity_days integer DEFAULT 7,
  default_unit text DEFAULT 'Pcs',
  currency text DEFAULT 'Rs.',
  tax_rate numeric DEFAULT 18,
  tax_label text DEFAULT 'GST',
  accent_color text DEFAULT '#6366f1',
  dark_mode boolean DEFAULT false,
  terms text DEFAULT 'ALL RATES ARE INCLUSIVE OF GST.
Goods once sold will not be taken back.
Warranty as per company policy.
Advance Payment Only.',
  shapes jsonb DEFAULT '[{"key":"R","value":"Round"},{"key":"S","value":"Square"},{"key":"RE","value":"Rectangle"},{"key":"OV","value":"Oval"}]',
  colors jsonb DEFAULT '[{"key":"W","value":"White"},{"key":"NW","value":"Natural White"},{"key":"WW","value":"Warm White"},{"key":"3","value":"3 in 1"},{"key":"5","value":"5000K"},{"key":"RGB","value":"RGB"}]',
  body_colors jsonb DEFAULT '[{"key":"B","value":"Black Body"},{"key":"W","value":"White Body"},{"key":"GB","value":"Gun Black"},{"key":"RG","value":"Rose Gold"},{"key":"SS","value":"Silver"}]',
  warranties jsonb DEFAULT '[{"key":"NW","value":"No Warranty"},{"key":"1","value":"1 Year"},{"key":"2","value":"2 Year"},{"key":"3","value":"3 Year"},{"key":"5","value":"5 Year"},{"key":"10","value":"10 Year"}]',
  columns_visible jsonb DEFAULT '{"sr_no":true,"product_image":true,"product_name":true,"shape":true,"color":true,"body_color":true,"warranty":true,"quantity":true,"unit":true,"rate":true,"discount":true,"amount":true}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own settings" ON settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text DEFAULT '',
  rate numeric DEFAULT 0,
  unit text DEFAULT 'Pcs',
  image text DEFAULT '',
  mrp numeric,
  category text DEFAULT '',
  stock integer DEFAULT 0,
  min_stock integer DEFAULT 5,
  track_stock boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own products" ON products FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own products" ON products FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own products" ON products FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own products" ON products FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- Quotations table
CREATE TABLE IF NOT EXISTS quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_number text NOT NULL,
  company_name text DEFAULT '',
  company_logo text DEFAULT '',
  customer_name text DEFAULT '',
  customer_mobile text DEFAULT '',
  customer_address text DEFAULT '',
  date date DEFAULT CURRENT_DATE,
  validity_days integer DEFAULT 30,
  subtotal numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  tax_rate numeric DEFAULT 0,
  total numeric DEFAULT 0,
  notes text DEFAULT '',
  terms text DEFAULT '',
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own quotations" ON quotations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quotations" ON quotations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quotations" ON quotations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own quotations" ON quotations FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_quotations_user_id ON quotations(user_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON quotations(created_at DESC);

-- Quotation items table
CREATE TABLE IF NOT EXISTS quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sr_no integer DEFAULT 1,
  product_id uuid,
  product_name text DEFAULT '',
  product_image text DEFAULT '',
  shape text DEFAULT '',
  color text DEFAULT '',
  body_color text DEFAULT '',
  warranty text DEFAULT '',
  quantity numeric DEFAULT 1,
  unit text DEFAULT 'Pcs',
  rate numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  amount numeric DEFAULT 0,
  bill_after_warranty boolean DEFAULT false,
  warranty_end_date date
);
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own quotation items" ON quotation_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quotation items" ON quotation_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quotation items" ON quotation_items FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own quotation items" ON quotation_items FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON quotation_items(quotation_id);

-- Auto-create profile + settings on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'admin'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
