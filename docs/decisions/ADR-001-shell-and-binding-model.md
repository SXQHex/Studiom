# ADR-001: Oturum açılmış üç kabuk ve bağ modeli

## Durum

Kabul edildi

## Tarih

2026-11-28

## Bağlam

Taslakta platform, organizasyon ve merkez işleri tek bir yönetici kabuğunda toplanıyor. Eğitmen, üye, herkese açık sayfa ve giriş için ayrıca kabuklar var. Birden çok rolü olan kişiler karışık menüler görüyor ve öğrenme eğrisi yüksek kalıyor. Örneğin aynı kişi hem platform sahibi, hem organizasyon sahibi, hem merkez yöneticisi, hem de eğitmen olabiliyor. Birden çok stüdyoya üye olan kullanıcılar ve birden çok merkezde ders veren eğitmenler de tek bir kişisel görünüme ihtiyaç duyuyor.

## Karar

- **Bir kişi = bir hesap.** Her rol bir **bağ**dır: kapsam + rol. Kapsamlar şunlardır: platform, organizasyon, merkez, eğitmen/asistan, üye.
- **Oturum açılmış üç kabuk vardır:**
  - **Platform** (`shells/platform`): Platform Sahibi ve Platform Yöneticisi. Girişte yeniden MFA istenir. Görsel olarak diğer kabuklardan ayrışır.
  - **Stüdyo** (`shells/studio`): tek bir kiracının kabuğu. İki grup içerir:
    - **Merkez grubu:** merkez bağı ister.
    - **Organizasyon grubu:** sahip ya da org. yöneticisi bağı ister.

    Kişi sadece bağlarının açtığı grupları görür. Merkez seçici sadece Merkez grubunu etkiler.

  - **Ben** (`shells/me`): kullanıcı odaklı, tüm organizasyonları kapsayan kişisel kabuk. Katıldığım ve verdiğim (eğitmen/asistan) seanslar, haklarım, hakedişim ve hesabım burada durur.
- **Oturumsuz yüzey** bir kabuk değildir. Herkese açık stüdyo sayfası, başvuru formu, giriş, davet ve parola ekranlarından oluşur.
- **Çalışma alanı seçici** şu sırayla listeler: Platform · Stüdyolar (merkezleriyle) · Ben.
  - Son kullanılan bağ hatırlanır.
  - Tek bağı olan kişi seçiciyi görmez.
  - Girişten sonra "hangi stüdyo" ekranı yoktur.
- Bir modül içinde yetkiler asla birleşmez, her modül kendi bağına bakar. İlke "tek bağ = tek kabuk" değil, "tek kiracı = tek kabuk"tur.
- **Destek kipi:**
  - Platform ekibi, gerekçe yazarak bir kiracının Stüdyo kabuğunu 30 dakika salt okunur açabilir.
  - Yazma yetkisi için ikinci bir gerekçe gerekir ve bu yetkiyi sadece Sahip verebilir.
  - Oturum kiracının denetim kaydına yazılır.
  - Ben kabuğuna destek girişi yapılamaz.
  - O kiracıda zaten bağı olan kişi destek kipini kullanmaz.

## Değerlendirilen alternatifler

### Ayrı Organizasyon, Merkez ve Eğitmen kabukları

Reddedildi. Tek merkezli sahiplerin (Starter ve Pro müşterilerinin çoğu) paket tanımlamak ve fiyatlamak için kabuk değiştirmesi gerekiyordu. İki merkezde ders veren eğitmen seçicide birkaç satır görüyordu.

### Ayrı platform kimlikleri

Reddedildi. Platform sahibi aynı zamanda bir kiracı kullanıcısı. Tek kişiye iki hesap, yeniden MFA'ya göre bir güvenlik kazancı sağlamadan sürtünme ekliyor.

### Üye kabuğunda organizasyon seçici bandı

Reddedildi. Bir mod değişimi "yanlış stüdyodayım" hatalarına yol açıyor. Bunun yerine stüdyo bir etiket ve filtre olarak gösteriliyor.

## Sonuçlar

- Öğrenilecek kabuk sayısı azalır. Menüler bağlar ve plan yeteneklerinden (ADR-010) türetilir.
- Aynı veri birden çok kabukta göründüğü için ortak görünümler kabukların altında yaşamalıdır (ADR-006).
- Denetim kaydı her işlemi "kişi + bağ" olarak yazar.
