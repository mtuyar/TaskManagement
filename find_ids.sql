-- ===========================================================================
-- ID'LERİ BULMAK İÇİN YARDIMCI SORGULAR
-- ===========================================================================

-- 1. KULLANICI ID'NİZİ BULUN
-- Email adresinizi aşağıya yazın:
SELECT 
    id as user_id,
    email,
    created_at
FROM auth.users 
WHERE email = 'your-email@example.com';

-- 2. GRUP ID'NİZİ BULUN
-- Grup adınızı aşağıya yazın:
SELECT 
    g.id as group_id,
    g.name as group_name,
    g.description,
    gm.role as your_role
FROM cus.groups g
JOIN cus.group_members gm ON g.id = gm.group_id
WHERE g.name = 'Your Group Name'
AND gm.user_id = 'your-user-id-from-step-1';

-- 3. GÖREV ID'LERİNİZİ BULUN
-- Grup ID'nizi aşağıya yazın:
SELECT 
    t.id as task_id,
    t.title as task_title,
    t.frequency,
    t.category,
    t.created_at
FROM cus.tasks t
WHERE t.group_id = 'your-group-id-from-step-2'
AND t.is_active = true
ORDER BY t.created_at DESC;

-- ===========================================================================
-- ÖRNEK ÇIKTI FORMATI
-- ===========================================================================

/*
Örnek çıktı:

1. USER_ID: 12345678-1234-1234-1234-123456789abc
2. GROUP_ID: 87654321-4321-4321-4321-cba987654321
3. TASK_ID'ler:
   - TASK1_ID: 11111111-1111-1111-1111-111111111111 (Sabah Koşusu)
   - TASK2_ID: 22222222-2222-2222-2222-222222222222 (Kitap Okuma)
   - TASK3_ID: 33333333-3333-3333-3333-333333333333 (Meditasyon)
   - TASK4_ID: 44444444-4444-4444-4444-444444444444 (Su İçmek)
   - TASK5_ID: 55555555-5555-5555-5555-555555555555 (Vitamin Almak)

Bu ID'leri test_data_insert.sql dosyasındaki değişkenlere kopyalayın.
*/

-- ===========================================================================
-- MEVCUT TAMAMLAMA VERİLERİNİ KONTROL EDİN
-- ===========================================================================

-- Kullanıcınızın mevcut tamamlama verilerini görün:
SELECT 
    tc.completion_date,
    t.title,
    t.frequency
FROM cus.task_completions tc
JOIN cus.tasks t ON tc.task_id = t.id
WHERE tc.user_id = 'your-user-id-from-step-1'
ORDER BY tc.completion_date DESC
LIMIT 20;

-- ===========================================================================
-- HIZLI TEST İÇİN SADECE BUGÜN VERİSİ
-- ===========================================================================

-- Sadece bugün için test verisi eklemek istiyorsanız:
/*
INSERT INTO cus.task_completions (task_id, user_id, completion_date)
SELECT 
    t.id,
    'your-user-id-here',
    CURRENT_DATE
FROM cus.tasks t
WHERE t.group_id = 'your-group-id-here'
AND t.is_active = true
LIMIT 3
ON CONFLICT (task_id, user_id, completion_date) DO NOTHING;
*/ 