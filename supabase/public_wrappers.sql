-- ===========================================================================
-- PUBLIC WRAPPER FONKSİYONLARI - CUS ŞEMASI İÇİN
-- ===========================================================================
-- Bu fonksiyonlar client-side'dan erişilebilir ve cus şemasındaki 
-- fonksiyonları güvenli şekilde çağırır.

-- Username ile kullanıcı arama (wrapper)
CREATE OR REPLACE FUNCTION public.search_users_by_username(search_term TEXT)
RETURNS TABLE (
    id UUID,
    username VARCHAR(50),
    display_name VARCHAR(100),
    avatar_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM cus.search_users_by_username(search_term);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kullanıcının grup listesi (wrapper)
CREATE OR REPLACE FUNCTION public.get_user_groups(user_uuid UUID)
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
        g.id as group_id,
        g.name as group_name,
        g.description,
        gm.role,
        (SELECT COUNT(*) FROM cus.group_members gm2 WHERE gm2.group_id = g.id) as member_count,
        (SELECT COUNT(*) FROM cus.tasks t WHERE t.group_id = g.id AND t.is_active = true) as pending_tasks
    FROM cus.groups g
    JOIN cus.group_members gm ON g.id = gm.group_id
    WHERE gm.user_id = user_uuid
    ORDER BY gm.joined_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kullanıcı profili güncelleme (wrapper)
CREATE OR REPLACE FUNCTION public.update_user_profile(
    p_user_id UUID, 
    p_profile_updates JSONB
)
RETURNS TABLE (
    id UUID,
    username VARCHAR(50),
    display_name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Güvenlik kontrolü: sadece kendi profilini güncelleyebilir
    IF auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized: Cannot update another user''s profile';
    END IF;
    
    -- Profil güncelle
    UPDATE cus.user_profiles 
    SET 
        username = COALESCE((p_profile_updates->>'username')::VARCHAR(50), username),
        display_name = COALESCE((p_profile_updates->>'display_name')::VARCHAR(100), display_name),
        avatar_url = COALESCE((p_profile_updates->>'avatar_url')::TEXT, avatar_url),
        updated_at = NOW()
    WHERE cus.user_profiles.id = p_user_id;
    
    -- Güncellenmiş profili döndür
    RETURN QUERY
    SELECT 
        up.id,
        up.username,
        up.display_name,
        up.avatar_url,
        up.created_at,
        up.updated_at
    FROM cus.user_profiles up
    WHERE up.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grup oluştur (wrapper)
CREATE OR REPLACE FUNCTION public.create_group(
    p_group_name VARCHAR(100),
    p_group_description TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name VARCHAR(100),
    description TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    new_group_id UUID;
BEGIN
    -- Grup oluştur
    INSERT INTO cus.groups (name, description, created_by)
    VALUES (p_group_name, p_group_description, auth.uid())
    RETURNING cus.groups.id INTO new_group_id;
    
    -- Oluşturulan grubu döndür
    RETURN QUERY
    SELECT 
        g.id,
        g.name,
        g.description,
        g.created_by,
        g.created_at,
        g.updated_at
    FROM cus.groups g
    WHERE g.id = new_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grup daveti gönder (wrapper)
CREATE OR REPLACE FUNCTION public.invite_user_to_group(
    p_group_id UUID,
    p_invited_user_id UUID
)
RETURNS TABLE (
    id UUID,
    group_id UUID,
    invited_by UUID,
    invited_user_id UUID,
    status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Admin yetkisi kontrolü
    IF NOT EXISTS (
        SELECT 1 FROM cus.group_members 
        WHERE cus.group_members.group_id = p_group_id 
        AND user_id = auth.uid() 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only group admins can invite users';
    END IF;
    
    -- Davet oluştur
    INSERT INTO cus.group_invitations (group_id, invited_user_id, invited_by)
    VALUES (p_group_id, p_invited_user_id, auth.uid());
    
    -- Oluşturulan daveti döndür
    RETURN QUERY
    SELECT 
        gi.id,
        gi.group_id,
        gi.invited_by,
        gi.invited_user_id,
        gi.status,
        gi.created_at,
        gi.responded_at
    FROM cus.group_invitations gi
    WHERE gi.group_id = p_group_id 
    AND gi.invited_user_id = p_invited_user_id
    ORDER BY gi.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Görev oluştur (wrapper)
CREATE OR REPLACE FUNCTION public.create_task(
    p_group_id UUID,
    p_task_title VARCHAR(200),
    p_task_description TEXT DEFAULT NULL,
    p_task_category VARCHAR(50) DEFAULT 'Günlük',
    p_task_frequency VARCHAR(20) DEFAULT 'Günlük'
)
RETURNS TABLE (
    id UUID,
    group_id UUID,
    title VARCHAR(200),
    description TEXT,
    category VARCHAR(50),
    frequency VARCHAR(20),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN
) AS $$
BEGIN
    -- Grup üyesi olma kontrolü
    IF NOT EXISTS (
        SELECT 1 FROM cus.group_members 
        WHERE cus.group_members.group_id = p_group_id 
        AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only group members can create tasks';
    END IF;
    
    -- Görev oluştur
    INSERT INTO cus.tasks (group_id, title, description, category, frequency, created_by)
    VALUES (p_group_id, p_task_title, p_task_description, p_task_category, p_task_frequency, auth.uid());
    
    -- Oluşturulan görevi döndür
    RETURN QUERY
    SELECT 
        t.id,
        t.group_id,
        t.title,
        t.description,
        t.category,
        t.frequency,
        t.created_by,
        t.created_at,
        t.updated_at,
        t.is_active
    FROM cus.tasks t
    WHERE t.group_id = p_group_id 
    AND t.created_by = auth.uid()
    ORDER BY t.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kullanıcı profili al (wrapper)
CREATE OR REPLACE FUNCTION public.get_user_profile(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    username VARCHAR(50),
    display_name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Güvenlik kontrolü: sadece kendi profilini veya grup arkadaşlarının profilini görebilir
    IF NOT (auth.uid() = p_user_id OR 
            EXISTS (
                SELECT 1 FROM cus.group_members gm1
                JOIN cus.group_members gm2 ON gm1.group_id = gm2.group_id
                WHERE gm1.user_id = auth.uid() AND gm2.user_id = p_user_id
            )) THEN
        RAISE EXCEPTION 'Unauthorized: Cannot access this user profile';
    END IF;
    
    RETURN QUERY
    SELECT 
        up.id,
        up.username,
        up.display_name,
        up.avatar_url,
        up.created_at,
        up.updated_at
    FROM cus.user_profiles up
    WHERE up.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kullanıcının davetlerini al (wrapper)
CREATE OR REPLACE FUNCTION public.get_user_invitations(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    group_id UUID,
    invited_by UUID,
    invited_user_id UUID,
    status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    group_name VARCHAR(100),
    inviter_username VARCHAR(50)
) AS $$
BEGIN
    -- Güvenlik kontrolü: sadece kendi davetlerini görebilir
    IF auth.uid() != p_user_id THEN
        RAISE EXCEPTION 'Unauthorized: Cannot access another user''s invitations';
    END IF;
    
    RETURN QUERY
    SELECT 
        gi.id,
        gi.group_id,
        gi.invited_by,
        gi.invited_user_id,
        gi.status,
        gi.created_at,
        gi.responded_at,
        g.name as group_name,
        up.username as inviter_username
    FROM cus.group_invitations gi
    JOIN cus.groups g ON gi.group_id = g.id
    JOIN cus.user_profiles up ON gi.invited_by = up.id
    WHERE gi.invited_user_id = p_user_id
    AND gi.status = 'pending'
    ORDER BY gi.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Daveti yanıtla (wrapper) - önce mevcut fonksiyonu sil
DROP FUNCTION IF EXISTS public.respond_to_invitation(UUID, VARCHAR);

CREATE OR REPLACE FUNCTION public.respond_to_invitation(
    p_invitation_id UUID,
    p_status VARCHAR(20)
)
RETURNS TABLE (
    invitation_id UUID,
    group_id UUID,
    invited_by UUID,
    invited_user_id UUID,
    status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Güvenlik kontrolü: sadece davet edilen kişi yanıtlayabilir
    IF NOT EXISTS (
        SELECT 1 FROM cus.group_invitations gi
        WHERE gi.id = p_invitation_id 
        AND gi.invited_user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Cannot respond to this invitation';
    END IF;
    
    -- Davet durumunu güncelle
    UPDATE cus.group_invitations 
    SET 
        status = p_status,
        responded_at = NOW()
    WHERE id = p_invitation_id;
    
    -- Güncellenmiş daveti döndür
    RETURN QUERY
    SELECT 
        gi.id as invitation_id,
        gi.group_id,
        gi.invited_by,
        gi.invited_user_id,
        gi.status,
        gi.created_at,
        gi.responded_at
    FROM cus.group_invitations gi
    WHERE gi.id = p_invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grup görevlerini al (wrapper) - PERİYOT SİSTEMİ İLE
DROP FUNCTION IF EXISTS public.get_group_tasks(UUID);

CREATE OR REPLACE FUNCTION public.get_group_tasks(p_group_id UUID)
RETURNS TABLE (
    id UUID,
    group_id UUID,
    title VARCHAR(200),
    description TEXT,
    category VARCHAR(50),
    frequency VARCHAR(20),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN,
    creator_username VARCHAR(50),
    is_completed_by_user BOOLEAN
) AS $$
DECLARE
    current_period_start DATE;
BEGIN
    -- Güvenlik kontrolü: kullanıcı grup üyesi mi?
    IF NOT EXISTS (
        SELECT 1 FROM cus.group_members gm
        WHERE gm.group_id = p_group_id AND gm.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only group members can view tasks';
    END IF;
    
    RETURN QUERY
    SELECT 
        t.id,
        t.group_id,
        t.title,
        t.description,
        t.category,
        t.frequency,
        t.created_by,
        t.created_at,
        t.updated_at,
        t.is_active,
        up.username as creator_username,
        CASE WHEN tc.id IS NOT NULL THEN true ELSE false END as is_completed_by_user
    FROM cus.tasks t
    JOIN cus.user_profiles up ON t.created_by = up.id
    LEFT JOIN LATERAL (
        SELECT tc.id
        FROM cus.task_completions tc
        WHERE tc.task_id = t.id 
        AND tc.user_id = auth.uid()
        AND tc.completion_date >= (
            CASE t.frequency
                WHEN 'Günlük' THEN CURRENT_DATE
                WHEN 'Haftalık' THEN CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE) - 1) * INTERVAL '1 day'
                WHEN 'Aylık' THEN DATE_TRUNC('month', CURRENT_DATE)::DATE
                ELSE CURRENT_DATE
            END
        )
        LIMIT 1
    ) tc ON true
    WHERE t.group_id = p_group_id 
    AND t.is_active = true
    ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Görev tamamlama durumunu kontrol et (wrapper) - PERİYOT SİSTEMİ İLE
CREATE OR REPLACE FUNCTION public.toggle_task_completion(
    p_task_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    completed BOOLEAN,
    completion_id UUID
) AS $$
DECLARE
    existing_completion_id UUID;
    task_group_id UUID;
    task_frequency VARCHAR(20);
    last_completion_date DATE;
    next_completion_date DATE;
    current_period_start DATE;
BEGIN
    -- Güvenlik kontrolü: görevin grup üyesi mi?
    SELECT t.group_id, t.frequency INTO task_group_id, task_frequency
    FROM cus.tasks t
    WHERE t.id = p_task_id;
    
    IF NOT EXISTS (
        SELECT 1 FROM cus.group_members gm
        WHERE gm.group_id = task_group_id AND gm.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only group members can complete tasks';
    END IF;
    
    -- Mevcut periyodun başlangıç tarihini hesapla
    CASE task_frequency
        WHEN 'Günlük' THEN
            current_period_start := CURRENT_DATE;
        WHEN 'Haftalık' THEN
            -- Haftanın başlangıcı (Pazartesi)
            current_period_start := CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE) - 1) * INTERVAL '1 day';
        WHEN 'Aylık' THEN
            -- Ayın başlangıcı
            current_period_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
        ELSE
            current_period_start := CURRENT_DATE;
    END CASE;
    
    -- Bu periyotta tamamlanmış mı kontrol et
    SELECT tc.id INTO existing_completion_id
    FROM cus.task_completions tc
    WHERE tc.task_id = p_task_id 
    AND tc.user_id = p_user_id
    AND tc.completion_date >= current_period_start;
    
    IF existing_completion_id IS NOT NULL THEN
        -- Bu periyottaki tamamlamayı geri al
        DELETE FROM cus.task_completions 
        WHERE id = existing_completion_id;
        
        RETURN QUERY
        SELECT false as completed, NULL::UUID as completion_id;
    ELSE
        -- Bu periyotta tamamla
        INSERT INTO cus.task_completions (task_id, user_id, completion_date)
        VALUES (p_task_id, p_user_id, CURRENT_DATE)
        RETURNING cus.task_completions.id INTO existing_completion_id;
        
        RETURN QUERY
        SELECT true as completed, existing_completion_id as completion_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================================================
-- TRİGGER'I PUBLIC'E TAŞI (auth.users public şemada olduğu için)
-- ===========================================================================

-- Eski trigger'ları sil (farklı isimlerle deneme)
DROP TRIGGER IF EXISTS cus_on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS cus_auth_user_profile_trigger ON auth.users;

-- Yeni trigger fonksiyonu public şemada
CREATE OR REPLACE FUNCTION public.handle_new_user() 
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

-- Benzersiz isimle yeni trigger oluştur
CREATE TRIGGER cus_auth_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grup üyelerini getir (wrapper)
CREATE OR REPLACE FUNCTION public.get_group_members(p_group_id UUID)
RETURNS TABLE (
    user_id UUID,
    username VARCHAR(50),
    display_name VARCHAR(100),
    role VARCHAR(20),
    joined_at TIMESTAMP WITH TIME ZONE,
    avatar_url TEXT
) AS $$
BEGIN
    -- Güvenlik kontrolü: kullanıcı grup üyesi mi?
    IF NOT EXISTS (
        SELECT 1 FROM cus.group_members gm
        WHERE gm.group_id = p_group_id AND gm.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only group members can view members';
    END IF;
    
    RETURN QUERY
    SELECT 
        gm.user_id,
        up.username,
        up.display_name,
        gm.role,
        gm.joined_at,
        up.avatar_url
    FROM cus.group_members gm
    JOIN cus.user_profiles up ON gm.user_id = up.id
    WHERE gm.group_id = p_group_id
    ORDER BY gm.role DESC, gm.joined_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grup üyelerinin görev tamamlama skorlarını getir - TÜM ZAMANLAR
CREATE OR REPLACE FUNCTION public.get_group_member_scores(p_group_id UUID)
RETURNS TABLE (
    user_id UUID,
    username VARCHAR(50),
    display_name VARCHAR(100),
    total_tasks BIGINT,
    completed_tasks BIGINT,
    completion_rate NUMERIC
) AS $$
BEGIN
    -- Güvenlik kontrolü: kullanıcı grup üyesi mi?
    IF NOT EXISTS (
        SELECT 1 FROM cus.group_members gm
        WHERE gm.group_id = p_group_id AND gm.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only group members can view scores';
    END IF;
    
    RETURN QUERY
    SELECT 
        gm.user_id,
        up.username,
        up.display_name,
        COUNT(t.id) as total_tasks,
        COUNT(tc.id) as completed_tasks,
        CASE 
            WHEN COUNT(t.id) = 0 THEN 0
            ELSE ROUND((COUNT(tc.id)::NUMERIC / COUNT(t.id)::NUMERIC) * 100, 1)
        END as completion_rate
    FROM cus.group_members gm
    JOIN cus.user_profiles up ON gm.user_id = up.id
    LEFT JOIN cus.tasks t ON t.group_id = p_group_id AND t.is_active = true
    LEFT JOIN cus.task_completions tc ON tc.task_id = t.id AND tc.user_id = gm.user_id
    WHERE gm.group_id = p_group_id
    GROUP BY gm.user_id, up.username, up.display_name
    ORDER BY completed_tasks DESC, completion_rate DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Önce eski fonksiyonu sil
DROP FUNCTION IF EXISTS public.get_user_group_stats(UUID, UUID);

-- Kullanıcının kişisel istatistiklerini getir (belirli grup için) - YENİ TASARIM
CREATE OR REPLACE FUNCTION public.get_user_group_stats(
    p_group_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    total_tasks BIGINT,
    completed_tasks BIGINT,
    pending_tasks BIGINT,
    completion_rate NUMERIC,
    daily_stats JSONB,
    weekly_stats JSONB,
    monthly_stats JSONB
) AS $$
DECLARE
    user_join_date DATE;
    week_start DATE;
    month_start DATE;
    daily_completed BIGINT;
    daily_total BIGINT;
    weekly_completed BIGINT;
    weekly_total BIGINT;
    monthly_completed BIGINT;
    monthly_total BIGINT;
BEGIN
    -- Güvenlik kontrolü: kullanıcı grup üyesi mi?
    IF NOT EXISTS (
        SELECT 1 FROM cus.group_members gm
        WHERE gm.group_id = p_group_id AND gm.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only group members can view stats';
    END IF;
    
    -- Kullanıcının gruba katılma tarihini al
    SELECT gm.joined_at::DATE INTO user_join_date
    FROM cus.group_members gm
    WHERE gm.group_id = p_group_id AND gm.user_id = p_user_id;
    
    -- Bu haftanın başlangıcı (Pazartesi)
    week_start := CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE) - 1) * INTERVAL '1 day';
    
    -- Bu ayın başlangıcı
    month_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    
    -- Bugünkü istatistikler
    SELECT 
        COUNT(t.id),
        COUNT(tc.id)
    INTO daily_total, daily_completed
    FROM cus.tasks t
    LEFT JOIN cus.task_completions tc ON tc.task_id = t.id 
                                      AND tc.user_id = p_user_id
                                      AND tc.completion_date = CURRENT_DATE
    WHERE t.group_id = p_group_id AND t.is_active = true;
    
    -- Bu hafta istatistikleri (geçmiş günler)
    SELECT 
        COUNT(t.id),
        COUNT(tc.id)
    INTO weekly_total, weekly_completed
    FROM cus.tasks t
    LEFT JOIN cus.task_completions tc ON tc.task_id = t.id 
                                      AND tc.user_id = p_user_id
                                      AND tc.completion_date >= week_start
                                      AND tc.completion_date <= CURRENT_DATE
    WHERE t.group_id = p_group_id AND t.is_active = true;
    
    -- Bu ay istatistikleri (geçmiş günler)
    SELECT 
        COUNT(t.id),
        COUNT(tc.id)
    INTO monthly_total, monthly_completed
    FROM cus.tasks t
    LEFT JOIN cus.task_completions tc ON tc.task_id = t.id 
                                      AND tc.user_id = p_user_id
                                      AND tc.completion_date >= month_start
                                      AND tc.completion_date <= CURRENT_DATE
    WHERE t.group_id = p_group_id AND t.is_active = true;
    
    RETURN QUERY
    SELECT 
        COUNT(t.id) as total_tasks,
        COUNT(tc.id) as completed_tasks,
        COUNT(t.id) - COUNT(tc.id) as pending_tasks,
        CASE 
            WHEN COUNT(t.id) = 0 THEN 0
            ELSE ROUND((COUNT(tc.id)::NUMERIC / COUNT(t.id)::NUMERIC) * 100, 1)
        END as completion_rate,
        -- Günlük istatistikler
        jsonb_build_object(
            'completed', daily_completed,
            'total', daily_total,
            'rate', CASE WHEN daily_total = 0 THEN 0 ELSE ROUND((daily_completed::NUMERIC / daily_total::NUMERIC) * 100, 1) END
        ) as daily_stats,
        -- Haftalık istatistikler
        jsonb_build_object(
            'completed', weekly_completed,
            'total', weekly_total,
            'rate', CASE WHEN weekly_total = 0 THEN 0 ELSE ROUND((weekly_completed::NUMERIC / weekly_total::NUMERIC) * 100, 1) END
        ) as weekly_stats,
        -- Aylık istatistikler
        jsonb_build_object(
            'completed', monthly_completed,
            'total', monthly_total,
            'rate', CASE WHEN monthly_total = 0 THEN 0 ELSE ROUND((monthly_completed::NUMERIC / monthly_total::NUMERIC) * 100, 1) END
        ) as monthly_stats
    FROM cus.tasks t
    LEFT JOIN cus.task_completions tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    WHERE t.group_id = p_group_id AND t.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- Önce eski fonksiyonu sil
DROP FUNCTION IF EXISTS public.delete_task(UUID);

-- Görev sil (wrapper) - sadece görevi oluşturan veya admin silebilir
CREATE OR REPLACE FUNCTION public.delete_task(p_task_id UUID)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    task_group_id UUID;
    task_created_by UUID;
BEGIN
    -- Görev bilgilerini al
    SELECT t.group_id, t.created_by INTO task_group_id, task_created_by
    FROM cus.tasks t
    WHERE t.id = p_task_id;
    
    -- Güvenlik kontrolü: kullanıcı görevi oluşturan kişi mi veya grup admin'i mi?
    IF NOT (auth.uid() = task_created_by OR 
            EXISTS (
                SELECT 1 FROM cus.group_members gm
                WHERE gm.group_id = task_group_id 
                AND gm.user_id = auth.uid()
                AND gm.role = 'admin'
            )) THEN
        RETURN QUERY SELECT false as success, 'Unauthorized: Only task creator or group admin can delete the task' as message;
        RETURN;
    END IF;
    
    -- Görevi sil (CASCADE ile completions da silinir)
    DELETE FROM cus.tasks WHERE id = p_task_id;
    
    RETURN QUERY SELECT true as success, 'Task deleted successfully' as message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Günlük aktivite analizi (son 7 gün) - BASİT VERSİYON
CREATE OR REPLACE FUNCTION public.get_daily_activity(
    p_group_id UUID,
    p_user_id UUID,
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    activity_date DATE,
    total_tasks BIGINT,
    completed_tasks BIGINT,
    completion_rate NUMERIC,
    is_active BOOLEAN
) AS $$
DECLARE
    start_date DATE;
    loop_date DATE;
    day_counter INTEGER;
BEGIN
    -- Güvenlik kontrolü: kullanıcı grup üyesi mi?
    IF NOT EXISTS (
        SELECT 1 FROM cus.group_members gm
        WHERE gm.group_id = p_group_id AND gm.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only group members can view activity';
    END IF;
    
    -- Bu haftanın başlangıcı (Pazartesi)
    start_date := CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE) - 1) * INTERVAL '1 day';
    
    -- Her gün için aktivite hesapla (Pazartesi'den Pazar'a)
    FOR day_counter IN 0..6 LOOP
        loop_date := start_date + (day_counter * INTERVAL '1 day');
        
        RETURN QUERY
        SELECT 
            loop_date as activity_date,
            COUNT(t.id) as total_tasks,
            COUNT(tc.id) as completed_tasks,
            CASE 
                WHEN COUNT(t.id) = 0 THEN 0
                ELSE ROUND((COUNT(tc.id)::NUMERIC / COUNT(t.id)::NUMERIC) * 100, 1)
            END as completion_rate,
            CASE WHEN COUNT(tc.id) > 0 THEN true ELSE false END as is_active
        FROM cus.tasks t
        LEFT JOIN cus.task_completions tc ON tc.task_id = t.id 
                                          AND tc.user_id = p_user_id
                                          AND tc.completion_date = loop_date
        WHERE t.group_id = p_group_id 
        AND t.is_active = true;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kullanıcının en iyi ve en kötü görevlerini getir
CREATE OR REPLACE FUNCTION public.get_user_task_performance(
    p_group_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    best_task JSONB,
    worst_task JSONB
) AS $$
DECLARE
    best_task_data JSONB;
    worst_task_data JSONB;
BEGIN
    -- Güvenlik kontrolü: kullanıcı grup üyesi mi?
    IF NOT EXISTS (
        SELECT 1 FROM cus.group_members gm
        WHERE gm.group_id = p_group_id AND gm.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only group members can view performance';
    END IF;
    
    -- En iyi görev (en yüksek tamamlama oranı)
    SELECT jsonb_build_object(
        'title', t.title,
        'completion_rate', ROUND((COUNT(tc.id)::NUMERIC / COUNT(t.id)::NUMERIC) * 100, 1),
        'completed_count', COUNT(tc.id),
        'total_count', COUNT(t.id),
        'last_completed', MAX(tc.completion_date)
    ) INTO best_task_data
    FROM cus.tasks t
    LEFT JOIN cus.task_completions tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    WHERE t.group_id = p_group_id AND t.is_active = true
    GROUP BY t.id, t.title
    HAVING COUNT(t.id) > 0
    ORDER BY (COUNT(tc.id)::NUMERIC / COUNT(t.id)::NUMERIC) DESC, COUNT(tc.id) DESC
    LIMIT 1;
    
    -- En kötü görev (en düşük tamamlama oranı)
    SELECT jsonb_build_object(
        'title', t.title,
        'completion_rate', ROUND((COUNT(tc.id)::NUMERIC / COUNT(t.id)::NUMERIC) * 100, 1),
        'completed_count', COUNT(tc.id),
        'total_count', COUNT(t.id),
        'last_completed', MAX(tc.completion_date)
    ) INTO worst_task_data
    FROM cus.tasks t
    LEFT JOIN cus.task_completions tc ON tc.task_id = t.id AND tc.user_id = p_user_id
    WHERE t.group_id = p_group_id AND t.is_active = true
    GROUP BY t.id, t.title
    HAVING COUNT(t.id) > 0
    ORDER BY (COUNT(tc.id)::NUMERIC / COUNT(t.id)::NUMERIC) ASC, COUNT(tc.id) ASC
    LIMIT 1;
    
    RETURN QUERY SELECT best_task_data, worst_task_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grup sil (wrapper) - sadece admin silebilir
CREATE OR REPLACE FUNCTION public.delete_group(p_group_id UUID)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
) AS $$
BEGIN
    -- Güvenlik kontrolü: kullanıcı grup admin'i mi?
    IF NOT EXISTS (
        SELECT 1 FROM cus.group_members gm
        WHERE gm.group_id = p_group_id 
        AND gm.user_id = auth.uid()
        AND gm.role = 'admin'
    ) THEN
        RETURN QUERY SELECT false as success, 'Unauthorized: Only group admins can delete the group' as message;
        RETURN;
    END IF;
    
    -- Grubu sil (CASCADE ile related veriler de silinir)
    DELETE FROM cus.groups WHERE id = p_group_id;
    
    RETURN QUERY SELECT true as success, 'Group deleted successfully' as message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 