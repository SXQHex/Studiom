# ADR-003: Yetki modeli

## Durum

Kabul edildi

## Tarih

2026-11-28

## Bağlam

Roller platform, organizasyon ve merkez kapsamlarında tanımlı. Üye merkez yöneticisinin değil, **organizasyonun** müşterisidir. Organizasyonun, toplamların içinde gizlenebilecek kayırmaları görebilmesi gerekir. Business'ta merkezler arası izolasyon delinememelidir.

## Karar

### Platform

- **Platform Sahibi** her şeyi yapabilir. Şunları ise sadece o yapabilir:
  - plan kataloğu ve fiyatları yönetmek
  - iade yapmak
  - kiracıyı kalıcı olarak silmek
  - platform ekibini yönetmek
  - platform ayarlarını değiştirmek
  - kiracının planını değiştirmek
  - destek kipinde yazma yetkisi vermek
- **Platform Yöneticisi** şunları yapar: kiracıları görüntüleme, askıya alma ve geri açma, deneme süresini uzatma, destek kipi (salt okunur), destek talepleri, duyurular.

### Organizasyon (matris v2)

- **Sahip (`owner`)** tüm **org. yöneticisi (`org_manager`)** haklarını içerir. Org. yöneticisi yedek bir roldür.
- **Sadece sahibin yapabildikleri:**
  - organizasyonu kapatmak ve yeniden açmak
  - veri silme talebi açmak
  - abonelik ve faturalar, fatura profili
  - **güvenlik kuralları**: MFA, oturum süresi, giriş yöntemleri
  - org. yöneticisi atamak ve kaldırmak
  - **sahiplik devrini başlatmak**: sahip başlatır → devralan kabul eder → platform onaylar
  - başkasını merkez yöneticisi olarak atamak
- Org. yöneticisi **kendini bir merkeze atayamaz**, sahibe atama talebi açar. Sahibin kendini ataması denetimde "kendi ataması" olarak görünür.
- **İkisinin de yapabildikleri:**
  - profil ve marka
  - kota içinde yeni merkez açma
  - **kullanım ve limitleri görme** (org. yöneticisi için salt okunur)
  - politikalar ve varsayılanlar
  - disiplinler, takvim, şablonlar, belgeler
  - **paket şablonları**
  - CRM segment ve otomasyon (plan kapsamında)
  - web başvuruları: görme, merkeze yönlendirme, kapatma
- **Gözetim:**
  - İki rol de merkezlerin kişi düzeyindeki verilerini (kişiler, takvim, rezervasyonlar, finans) **salt okunur** görür.
  - Bir kişi kaydının her açılışı **erişim kaydına** yazılır.
  - **İstisnalar** akışı kimin yaptığı ve zorunlu gerekçesiyle şunları listeler: indirimler, ücretsiz haklar, elle hak/kredi düzeltmeleri, borç silme, iadeler, geriye dönük yoklama, önerilen fiyattan %15'ten fazla sapan satış fiyatları.
- Merkez içindeki her yazma işlemi **merkez bağı** ister.

### Merkez

- **Merkez yöneticisi:** tüm merkez modülleri.
- **Personel:** Yönetici, kişi başına **modülün tamamını** açar: Program, Kişiler, Satış, Merkez. Hazır kalıplar vardır, örneğin "Resepsiyon" ve "Satış danışmanı". Yönetici asistanı pozisyonu personeldir.
- **Eğitmen:** Ben kabuğunda çalışır. Katılımcıların adını ve kalan hakkını görür. Borç ya da ödeme bilgisini görmez.
- **Asistan (eğitmen asistanı):** yetkisi kısıtlanmış bir eğitmendir. Sadece atandığı seansları görür. Katılımcıları görebilir, yoklama alabilir, not yazabilir. Seansı iptal edemez, taşıyamaz, kapasiteyi değiştiremez. Hakediş sadece merkez ona ücret tanımladıysa görünür.
- Yoklama her zaman alanı kaydeder ("X aldı").

## Değerlendirilen alternatifler

- **Organizasyona sadece toplam göstermek:** Reddedildi. Kayırma toplamların içinde kaybolur.
- **Hücre hücre personel izin matrisi:** Reddedildi. "Modül = yetki birimi" kuralıyla çelişiyor ve öğrenmesi zor.

## Sonuçlar

- İstisna sınıfındaki her işlemde gerekçe alanı gerekir. Organizasyon okumaları için bir erişim kaydı yazıcısı ve bir atama talebi akışı gerekir.
- Eşikli onaylar kapsam dışıdır, örneğin "%20 üzeri indirim onay ister".
