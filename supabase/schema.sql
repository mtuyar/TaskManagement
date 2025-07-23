-- ===========================================================================
-- GRUP BAZLI GÖREV YÖNETİMİ SİSTEMİ - SUPABASE SCHEMA (cus altında)
-- ===========================================================================

-- Şema oluştur
CREATE SCHEMA IF NOT EXISTS cus;

-- Auth kullanıcıları için ek profil bilgileri
CREATE TABLE cus.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gruplar tablosu
CREATE TABLE cus.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES cus.user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grup üyelikleri
CREATE TABLE cus.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES cus.groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES cus.user_profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Grup davetleri
CREATE TABLE cus.group_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES cus.groups(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES cus.user_profiles(id) ON DELETE CASCADE,
    invited_user_id UUID REFERENCES cus.user_profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(group_id, invited_user_id)
);

-- Görevler tablosu
CREATE TABLE cus.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES cus.groups(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'Genel',
    frequency VARCHAR(20) DEFAULT 'Günlük' CHECK (frequency IN ('Günlük', 'Haftalık', 'Aylık')),
    created_by UUID REFERENCES cus.user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Görev tamamlamaları
CREATE TABLE cus.task_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES cus.tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES cus.user_profiles(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completion_date DATE DEFAULT CURRENT_DATE,
    UNIQUE(task_id, user_id, completion_date)
);

-- ===========================================================================
-- RLS POLİTİKALARI
-- ===========================================================================

-- RLS etkinleştir
ALTER TABLE cus.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cus.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE cus.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE cus.group_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cus.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cus.task_completions ENABLE ROW LEVEL SECURITY;

-- RLS policy örnekleri (sadece user_profiles için gösterildi, diğerleri de benzer şekilde değiştirilir)
CREATE POLICY "Kullanıcılar kendi profillerini okuyabilir" ON cus.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Kullanıcılar kendi profillerini güncelleyebilir" ON cus.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Yeni kullanıcı profili oluşturabilir" ON cus.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Username ile arama yapılabilir" ON cus.user_profiles
    FOR SELECT USING (true);

-- (Diğer tüm RLS politikaları da aynı şekilde `public.` → `cus.` olarak düzenlenmelidir.)

-- ===========================================================================
-- TETİKLEYİCİLER
-- ===========================================================================

-- Kullanıcı oluşturulduğunda otomatik profil oluştur
CREATE OR REPLACE FUNCTION cus.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO cus.user_profiles (id, username, display_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER cus_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION cus.handle_new_user();

-- Grup oluşturulduğunda admin ekle
CREATE OR REPLACE FUNCTION cus.handle_new_group() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO cus.group_members (group_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'admin');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_group_created
    AFTER INSERT ON cus.groups
    FOR EACH ROW EXECUTE FUNCTION cus.handle_new_group();

-- Davet kabul edildiğinde üye oluştur
CREATE OR REPLACE FUNCTION cus.handle_invitation_accepted() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        INSERT INTO cus.group_members (group_id, user_id, role)
        VALUES (NEW.group_id, NEW.invited_user_id, 'member')
        ON CONFLICT (group_id, user_id) DO NOTHING;

        UPDATE cus.group_invitations 
        SET responded_at = NOW()
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_invitation_status_change
    AFTER UPDATE ON cus.group_invitations
    FOR EACH ROW EXECUTE FUNCTION cus.handle_invitation_accepted();

-- ===========================================================================
-- FONKSİYONLAR
-- ===========================================================================

-- Username ile kullanıcı arama
CREATE OR REPLACE FUNCTION cus.search_users_by_username(search_term TEXT)
RETURNS TABLE (
    id UUID,
    username VARCHAR(50),
    display_name VARCHAR(100),
    avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.username,
        up.display_name,
        up.avatar_url
    FROM cus.user_profiles up
    WHERE up.username ILIKE '%' || search_term || '%'
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kullanıcının grup listesi
CREATE OR REPLACE FUNCTION cus.get_user_groups(user_uuid UUID)
RETURNS TABLE (
    group_id UUID,
    group_name VARCHAR(100),
    description TEXT,
    role VARCHAR(20),
    member_count BIGINT,
    pending_tasks BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.name,
        g.description,
        gm.role,
        (SELECT COUNT(*) FROM cus.group_members WHERE group_id = g.id) as member_count,
        (SELECT COUNT(*) FROM cus.tasks WHERE group_id = g.id AND is_active = true) as pending_tasks
    FROM cus.groups g
    JOIN cus.group_members gm ON g.id = gm.group_id
    WHERE gm.user_id = user_uuid
    ORDER BY gm.joined_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
