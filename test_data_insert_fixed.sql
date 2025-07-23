-- ===========================================================================
-- TEST VERİLERİ INSERT SCRIPTİ - DÜZELTİLMİŞ
-- ===========================================================================
-- Bu script analiz sayfasını test etmek için geçmiş günlerde görev tamamlama verileri ekler

-- ÖNEMLİ: Bu scripti çalıştırmadan önce:
-- 1. Kendi USER_ID'nizi aşağıya yazın
-- 2. Kendi GROUP_ID'nizi aşağıya yazın  
-- 3. Kendi TASK_ID'lerinizi aşağıya yazın

-- USER_ID'nizi buraya yazın (auth.users tablosundan alabilirsiniz)
-- SELECT id FROM auth.users WHERE email = 'mtuyarr@gmail.com';

-- GROUP_ID'nizi buraya yazın
-- SELECT * FROM cus.groups WHERE name = 'Your Group Name';

-- TASK_ID'lerinizi buraya yazın
-- SELECT id, title FROM cus.tasks WHERE group_id = 'b4069162-72a2-4f2f-8f7c-9f67ab827467';

-- ===========================================================================
-- DEĞİŞKENLER - BUNLARI KENDİ DEĞERLERİNİZLE DEĞİŞTİRİN
-- ===========================================================================

-- Bu değerleri kendi değerlerinizle değiştirin:
\set USER_ID '43887a48-dd16-45ec-ad0a-fd5763852bf7'
\set GROUP_ID 'b4069162-72a2-4f2f-8f7c-9f67ab827467'
-- Mevcut görevleriniz için (görüntüdeki görevler):
\set TASK1_ID '30a5de95-ed42-4459-b272-51aea7dbe43f'  -- "Kişisel gelişim 1 saat"
\set TASK2_ID 'cfcb443d-ea3d-4310-a015-ff531b64e80d'  -- "4 Vakit Tesbihat" 
\set TASK3_ID '9ac74ae9-1157-44b5-b755-ad7d651b6a66'  -- "Günde 3 Sayfa Kur'an Okuma"
-- Eğer "Test" göreviniz varsa:
\set TASK4_ID '703f3351-2376-46e6-b42a-8f19541cc121'  -- "Test" (Haftalık)

-- ===========================================================================
-- TEST VERİLERİ - SON 7 GÜN İÇİN (MEVCUT GÖREVLERİNİZ İÇİN)
-- ===========================================================================

-- Bugün (CURRENT_DATE) - Hiçbiri yapılmadı (test için)
-- INSERT INTO cus.task_completions (task_id, user_id, completion_date)
-- VALUES 
--     (:TASK1_ID, :USER_ID, CURRENT_DATE),
--     (:TASK2_ID, :USER_ID, CURRENT_DATE),
--     (:TASK3_ID, :USER_ID, CURRENT_DATE)
-- ON CONFLICT (task_id, user_id, completion_date) DO NOTHING;

-- Dün (CURRENT_DATE - 1) - Sadece 1 tanesi yapıldı
INSERT INTO cus.task_completions (task_id, user_id, completion_date)
VALUES 
    (:TASK1_ID, :USER_ID, CURRENT_DATE - INTERVAL '1 day')
ON CONFLICT (task_id, user_id, completion_date) DO NOTHING;

-- 2 gün önce (CURRENT_DATE - 2) - 2 tanesi yapıldı
INSERT INTO cus.task_completions (task_id, user_id, completion_date)
VALUES 
    (:TASK1_ID, :USER_ID, CURRENT_DATE - INTERVAL '2 days'),
    (:TASK2_ID, :USER_ID, CURRENT_DATE - INTERVAL '2 days')
ON CONFLICT (task_id, user_id, completion_date) DO NOTHING;

-- 3 gün önce (CURRENT_DATE - 3) - Hiçbiri yapılmadı
-- INSERT INTO cus.task_completions (task_id, user_id, completion_date)
-- VALUES 
--     (:TASK1_ID, :USER_ID, CURRENT_DATE - INTERVAL '3 days'),
--     (:TASK2_ID, :USER_ID, CURRENT_DATE - INTERVAL '3 days'),
--     (:TASK3_ID, :USER_ID, CURRENT_DATE - INTERVAL '3 days')
-- ON CONFLICT (task_id, user_id, completion_date) DO NOTHING;

-- 4 gün önce (CURRENT_DATE - 4) - Hepsi yapıldı
INSERT INTO cus.task_completions (task_id, user_id, completion_date)
VALUES 
    (:TASK1_ID, :USER_ID, CURRENT_DATE - INTERVAL '4 days'),
    (:TASK2_ID, :USER_ID, CURRENT_DATE - INTERVAL '4 days'),
    (:TASK3_ID, :USER_ID, CURRENT_DATE - INTERVAL '4 days')
ON CONFLICT (task_id, user_id, completion_date) DO NOTHING;

-- 5 gün önce (CURRENT_DATE - 5) - Sadece 1 tanesi yapıldı
INSERT INTO cus.task_completions (task_id, user_id, completion_date)
VALUES 
    (:TASK3_ID, :USER_ID, CURRENT_DATE - INTERVAL '5 days')
ON CONFLICT (task_id, user_id, completion_date) DO NOTHING;

-- 6 gün önce (CURRENT_DATE - 6) - 2 tanesi yapıldı
INSERT INTO cus.task_completions (task_id, user_id, completion_date)
VALUES 
    (:TASK1_ID, :USER_ID, CURRENT_DATE - INTERVAL '6 days'),
    (:TASK3_ID, :USER_ID, CURRENT_DATE - INTERVAL '6 days')
ON CONFLICT (task_id, user_id, completion_date) DO NOTHING;

-- ===========================================================================
-- DAHA FAZLA TEST VERİSİ - SON 30 GÜN İÇİN (MEVCUT GÖREVLERİNİZ İÇİN)
-- ===========================================================================

-- 1 hafta önce (7 gün önce) - 2 tanesi yapıldı
INSERT INTO cus.task_completions (task_id, user_id, completion_date)
VALUES 
    (:TASK1_ID, :USER_ID, CURRENT_DATE - INTERVAL '7 days'),
    (:TASK2_ID, :USER_ID, CURRENT_DATE - INTERVAL '7 days')
ON CONFLICT (task_id, user_id, completion_date) DO NOTHING;

-- 2 hafta önce (14 gün önce) - Sadece 1 tanesi yapıldı
INSERT INTO cus.task_completions (task_id, user_id, completion_date)
VALUES 
    (:TASK3_ID, :USER_ID, CURRENT_DATE - INTERVAL '14 days')
ON CONFLICT (task_id, user_id, completion_date) DO NOTHING;

-- 3 hafta önce (21 gün önce) - Hiçbiri yapılmadı
-- INSERT INTO cus.task_completions (task_id, user_id, completion_date)
-- VALUES 
--     (:TASK1_ID, :USER_ID, CURRENT_DATE - INTERVAL '21 days'),
--     (:TASK2_ID, :USER_ID, CURRENT_DATE - INTERVAL '21 days'),
--     (:TASK3_ID, :USER_ID, CURRENT_DATE - INTERVAL '21 days')
-- ON CONFLICT (task_id, user_id, completion_date) DO NOTHING;

-- 4 hafta önce (28 gün önce) - Hepsi yapıldı
INSERT INTO cus.task_completions (task_id, user_id, completion_date)
VALUES 
    (:TASK1_ID, :USER_ID, CURRENT_DATE - INTERVAL '28 days'),
    (:TASK2_ID, :USER_ID, CURRENT_DATE - INTERVAL '28 days'),
    (:TASK3_ID, :USER_ID, CURRENT_DATE - INTERVAL '28 days')
ON CONFLICT (task_id, user_id, completion_date) DO NOTHING;

-- ===========================================================================
-- KONTROL SORGULARI
-- ===========================================================================

-- Eklenen verileri kontrol et
SELECT 
    tc.completion_date,
    COUNT(tc.id) as completed_tasks,
    t.title
FROM cus.task_completions tc
JOIN cus.tasks t ON tc.task_id = t.id
WHERE tc.user_id = :USER_ID
AND tc.completion_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY tc.completion_date, t.title
ORDER BY tc.completion_date DESC, t.title;

-- Haftalık aktivite özeti
SELECT 
    tc.completion_date,
    COUNT(DISTINCT tc.task_id) as unique_tasks_completed,
    COUNT(tc.id) as total_completions
FROM cus.task_completions tc
WHERE tc.user_id = :USER_ID
AND tc.completion_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY tc.completion_date
ORDER BY tc.completion_date DESC;

-- ===========================================================================
-- TEMİZLEME SCRIPTİ (GEREKİRSE)
-- ===========================================================================

-- Test verilerini silmek için (dikkatli kullanın!):
/*
DELETE FROM cus.task_completions 
WHERE user_id = :USER_ID 
AND completion_date >= CURRENT_DATE - INTERVAL '30 days';
*/

-- ===========================================================================
-- HIZLI TEMİZLEME - SADECE TEST VERİLERİNİ SİL
-- ===========================================================================

-- İşiniz bittiğinde bu satırları yorum satırından çıkarıp çalıştırın:
/*
-- Son 30 günün tüm test verilerini sil
DELETE FROM cus.task_completions 
WHERE user_id = :USER_ID 
AND completion_date >= CURRENT_DATE - INTERVAL '30 days';

-- Veya sadece belirli günleri silmek için:
DELETE FROM cus.task_completions 
WHERE user_id = :USER_ID 
AND completion_date IN (
    CURRENT_DATE - INTERVAL '1 day',
    CURRENT_DATE - INTERVAL '2 days', 
    CURRENT_DATE - INTERVAL '4 days',
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE - INTERVAL '6 days',
    CURRENT_DATE - INTERVAL '7 days',
    CURRENT_DATE - INTERVAL '14 days',
    CURRENT_DATE - INTERVAL '28 days'
);
*/ 