# 🚀 Supabase Kurulum Rehberi

Bu proje Supabase ile çalışmaktadır. Aşağıdaki adımları takip ederek projeyi çalışır hale getirebilirsiniz.

## 📋 Gereksinimler

- [Supabase](https://supabase.com/) hesabı
- Node.js (v16 veya üzeri)
- React Native geliştirme ortamı

## 🔧 Kurulum Adımları

### 1. Supabase Projesi Oluşturun

1. [Supabase Dashboard](https://app.supabase.com/)'a gidin
2. "New Project" butonuna tıklayın
3. Proje adını ve şifresini belirleyin
4. Bölgeyi seçin ve projeyi oluşturun

### 2. Veritabanı Şemasını Kurun

**Adım 2a: Ana Şema**
1. Supabase Dashboard'da **SQL Editor**'e gidin
2. `supabase/schema.sql` dosyasının içeriğini kopyalayın
3. SQL Editor'e yapıştırın ve **RUN** butonuna tıklayın

**Adım 2b: Public Wrapper Fonksiyonları**
1. Aynı SQL Editor'de **New Query** oluşturun
2. `supabase/public_wrappers.sql` dosyasının içeriğini kopyalayın
3. SQL Editor'e yapıştırın ve **RUN** butonuna tıklayın

> ⚠️ **Önemli:** Bu proje `cus` adında özel bir şema kullanır. Tüm tablolar `public` yerine `cus` şeması altında oluşturulur. Client-side erişim için `public` şemasında wrapper fonksiyonlar bulunur.

### 3. Supabase Konfigürasyonunu Güncelleyin

1. `src/config/supabase.js` dosyasını açın
2. Aşağıdaki değerleri değiştirin:

```javascript
// BURAYI DEĞİŞTİRİN
const supabaseUrl = 'YOUR_SUPABASE_URL'; // https://xyz.supabase.co
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // public anon key
```

**Supabase URL ve Key'i nasıl bulacağınız:**

1. Supabase Dashboard'da projenize gidin
2. **Settings** > **API** sekmesine tıklayın
3. **Project URL**'i kopyalayın ve `supabaseUrl` yerine yapıştırın
4. **Project API keys** bölümünde **anon public** key'i kopyalayın ve `supabaseAnonKey` yerine yapıştırın

### 4. Auth Ayarlarını Yapılandırın

1. Supabase Dashboard'da **Authentication** > **Settings**'e gidin
2. **Site URL** bölümüne geliştirme için:
   ```
   http://localhost:19000
   ```
3. **Email Templates** bölümünde e-posta şablonlarını özelleştirebilirsiniz

### 5. Row Level Security (RLS) Kontrol Edin

Şema dosyası otomatik olarak RLS politikalarını oluşturur, ancak kontrol etmek için:

1. **Authentication** > **Policies** sekmesine gidin
2. Tüm tablolar için politikaların aktif olduğunu kontrol edin

## 📱 Uygulama Özellikleri

### 🔐 Kimlik Doğrulama
- E-posta/şifre ile kayıt
- E-posta/şifre ile giriş
- Şifre sıfırlama
- Otomatik oturum yönetimi

### 👥 Grup Yönetimi
- Grup oluşturma
- Kullanıcı davet etme (username ile)
- Davet kabul/reddetme
- Çoklu grup üyeliği

### ✅ Görev Yönetimi
- Grup bazlı görevler
- Günlük/haftalık görevler
- Görev tamamlama takibi
- Gerçek zamanlı senkronizasyon

## 🧪 Test Verisi

Geliştirme sırasında test verisi eklemek için:

```sql
-- Test kullanıcı profili (auth.users'dan otomatik oluşturulur)
-- Manual ekleme gerekirse:
INSERT INTO cus.user_profiles (id, username, display_name)
VALUES ('USER_UUID', 'testuser', 'Test Kullanıcı');

-- Test grubu (public wrapper kullanarak)
SELECT public.create_group('Test Grubu', 'Bu bir test grubudur');

-- Test parametreli çağrı
SELECT public.create_group(
    p_group_name := 'Test Grubu 2',
    p_group_description := 'Parametreli test grubu'
);

-- Veya direkt:
INSERT INTO cus.groups (name, description, created_by)
VALUES ('Test Grubu', 'Bu bir test grubudur', 'USER_UUID');
```

## 🚨 Güvenlik Notları

1. **Asla** production anahtarlarını kod deposuna eklemeyin
2. Environment variables kullanın (`.env` dosyası):
   ```bash
   # .env dosyası oluşturun
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   ```
3. Supabase **Service Role** key'ini client-side kod'da kullanmayın
4. RLS politikalarını dikkatlice test edin
5. `.env` dosyasını `.gitignore`'a ekleyin

## 🛠️ Geliştirme Komutları

```bash
# Bağımlılıkları yükle
npm install

# Expo development server'ı başlat
npm start

# iOS simulator
npm run ios

# Android emulator
npm run android
```

## 📚 Veritabanı Şeması

### Tablolar (cus şeması altında):
- `cus.user_profiles` - Kullanıcı profil bilgileri
- `cus.groups` - Gruplar
- `cus.group_members` - Grup üyelikleri
- `cus.group_invitations` - Grup davetleri
- `cus.tasks` - Görevler
- `cus.task_completions` - Görev tamamlamaları

### Önemli Fonksiyonlar:

**CUS Şeması (Backend):**
- `cus.search_users_by_username()` - Kullanıcı arama
- `cus.get_user_groups()` - Kullanıcının grupları

**Public Wrapper'lar (Client-side erişim):**
- `public.search_users_by_username(search_term)` - Kullanıcı arama wrapper
- `public.get_user_groups(user_uuid)` - Grup listesi wrapper  
- `public.update_user_profile(p_user_id, p_profile_updates)` - Profil güncelleme
- `public.create_group(p_group_name, p_group_description)` - Grup oluşturma
- `public.invite_user_to_group(p_group_id, p_invited_user_id)` - Davet gönderme
- `public.create_task(p_group_id, p_task_title, ...)` - Görev oluşturma

### Trigger'lar:
- `cus_auth_user_profile_trigger` - Yeni kullanıcı profili oluşturma (public.handle_new_user)
- `on_group_created` - Grup admin'i otomatik ekleme
- `on_invitation_status_change` - Davet kabul/red işlemleri

### Public View'lar (Güvenli erişim):
- `public.user_profiles` - Kullanıcı profilleri
- `public.groups` - Gruplar
- `public.group_invitations` - Davetler
- `public.tasks` - Görevler
- `public.task_completions` - Tamamlamalar

## 🆘 Sorun Giderme

### "Invalid API Key" Hatası
- Supabase URL ve anon key'in doğru olduğunu kontrol edin
- Key'lerde boşluk olmadığından emin olun

### "RLS Policy" Hatası
- Schema'nın tamamen çalıştırıldığını kontrol edin
- Supabase Dashboard'da politikaların aktif olduğunu doğrulayın

### "User Not Found" Hatası
- `cus_auth_user_profile_trigger` trigger'ının çalıştığını kontrol edin
- `cus.user_profiles` tablosunda kullanıcının oluşturulduğunu doğrulayın
- Supabase Dashboard'da **Database** > **Functions** bölümünde trigger'ların aktif olduğunu kontrol edin

### "Function Not Found" Hatası
- `supabase/public_wrappers.sql` dosyasının çalıştırıldığını kontrol edin
- **Database** > **Functions** bölümünde public fonksiyonların görünür olduğunu doğrulayın
- Client-side kodun public fonksiyonları çağırdığından emin olun

### "Parameter Name Conflict" Hatası
- PostgreSQL'de parametre adları `p_` prefix'i ile başlar (örn: `p_group_id`)
- Tablo kolon adları ile parametre adları arasında çakışma olmamalı
- Fonksiyon güncellenirse RPC çağrıları da güncellenmeli

### "Schema Access" Hatası
- Client-side kod asla `cus.` prefix'i kullanmamalı
- Sadece `public` şemasındaki view'lar ve fonksiyonlar kullanılmalı
- RPC çağrıları `.schema('cus')` kullanmamalı

### "Trigger Already Exists" Hatası
- Mevcut trigger'lar ile çakışma oluyor
- Eski trigger'ları önce silin: `DROP TRIGGER IF EXISTS trigger_name ON auth.users;`
- Benzersiz trigger isimleri kullanın (örn: `cus_auth_user_profile_trigger`)
- **Database** > **Triggers** bölümünde mevcut trigger'ları kontrol edin

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Supabase Dashboard'da **Logs** bölümünü kontrol edin
2. React Native Debugger'da console logları inceleyin
3. Supabase [dokümantasyonunu](https://supabase.com/docs) inceleyin

---

🎉 **Kurulum tamamlandıktan sonra uygulamayı başlatabilirsiniz!** 