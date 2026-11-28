# ADR-004: Alan modeli kararları (seans, paket, aday, kurulum)

## Durum

Kabul edildi

## Tarih

2026-11-28

## Bağlam

Dans, yoga ve pilates rezervasyon biçimlerinde farklılaşıyor: serbest katılım, aletli yer seçimi, lider/takipçi dengeli dönemlik kurlar. Paketlerin merkezler arasında tutarlı olması organizasyon için önemli. Hesabı ya da hakkı olmayan kişi rezervasyon yapamaz.

## Karar

### Seans

- Arayüzdeki tek kavram **Seans**'tır. Tekrar, seansın bir özelliğidir ve takvim alışkanlığıyla düzenlenir: "Yalnız bu / Bu ve sonrakiler / Tümü".
- Seansın seçenekleri:
  - **kayıt birimi:** seans seans ya da tekrarın tamamı ("Kura katıl")
  - **rol dengesi:** lider/takipçi
  - **seviye ön koşulu**
  - **yer seçimi:** salonda alet varsa, örneğin reformer

  Disiplinler varsayılanları önerir.

- Saatler UTC olarak tutulur, **merkezin IANA saat diliminde** gösterilir (ADR-008).

### Paketler

- **Şablonları organizasyon tanımlar.** Şablon şunları içerir:
  - ad ve disiplinler
  - hak sayısı ya da sınırsız
  - geçerlilik süresi
  - dondurma
  - ders türleri
  - iptal kuralı
  - satılabileceği merkezler
  - önerilen fiyat
  - **telafi: yok / var, en fazla N**
- **Merkez sadece satış fiyatını girer** ve satar. Önerilen fiyattan %15'ten fazla sapma İstisnalar'a düşer, onay gerekmez.
- **Kur paketi:**
  - Bir tekrara bağlanır.
  - Sonradan katılımda kıstelyevm fiyat otomatik önerilir.
  - Telafi kur tarihleri içinde, aynı disiplin ve seviyede yapılır. Telafi kapasiteyi doldurur ama rol dengesine sayılmaz.
  - Kurdan ayrılma ve iade, gerekçeli iade akışından geçer.
- Şablon değişikliği sadece yeni satışlara uygulanır.
- Business'ta bir paketin başka merkezde kullanılması bir mutabakat hareketi doğurur. Paket yine o merkezin paketi olarak kalır.

### Aday ve kurulum

- **Kendi kendine kayıt yoktur.** Hesap sadece **davetle** oluşur. Platform, satışı platform dışında yaptıktan sonra organizasyon sahibini davet eder. Merkez de üye ve personeli davet eder.
- **Açık sayfadan gelen aday akışı:**
  1. Ziyaretçi "Deneme dersi iste" ya da "Bilgi al" formunu doldurur. Hesap açılmaz, form onay alanları içerir.
  2. Başvuru organizasyonun **Başvurular** sayfasına düşer ve merkeze yönlendirilir.
  3. Merkez **Adaylar**'da başvuruyu eşleştirir ya da yeni aday oluşturur.
  4. Merkez deneme teklifi yapar.
  5. Deneme hakkı tanımlanır, yer ayrılır ve davet gönderilir.
  6. Kişi davetle hesabını açar.
  7. Aday "dönüştü" ya da gerekçeli "kaybedildi" olarak kapanır.
- **Giriş yöntemleri:** e-posta + parola ve **Google ile giriş**. Organizasyonun güvenlik ayarlarında izinli yöntemleri sadece sahip kısıtlayabilir (ADR-003). Google ile giriş de davetle oluşmuş bir hesaba bağlanır, yeni hesap açmaz.
- **Sahip kurulumu:** Sahip normal giriş yapar. Kurulum bitmemişse sihirbaz modal olarak açılır. Modal kapatılırsa kurulum bitene kadar organizasyonun genel bakışında "Kurulumu tamamla" düğmesi görünür.
- A stüdyosunun kullanıcısı B'ye başvurursa herkes gibi işlem görür. Organizasyonlar arası otomatik doldurma yapılmaz.

## Değerlendirilen alternatifler

- **Üç rezervasyon modeli (açık, aletli, kur):** Seçenekli tek kavram lehine reddedildi.
- **"Ders/sınıf" dizisi kavramı:** Reddedildi, takvimdeki tekrar mantığı zaten tanıdık.
- **Açık sayfadan kendi kendine kayıt:** Reddedildi, hakkı olmayan kişi zaten rezervasyon yapamıyor.

## Sonuçlar

- Tek seans formu, tek seans detayı ve tek rezervasyon akışı olur. Farklılıklar sadece koşullu alanlarla gelir.
- Starter'da sadece temel aday takibi vardır: elle aday kaydı, not ve takip tarihi. Deneme teklifi Pro ve üzerindedir.
