# ADR-002: Gezinme ve bilgi mimarisi kuralları

## Durum
Kabul edildi

## Tarih
2026-11-28

## Bağlam
Hedef, yetki kapsamı belli ve modüler bir yapı: basit bir kabuk → menü → alt menü → sayfa düzeni. Farklı veri kümelerini taşıyan sayfa içi sekmeler veri ve önbellek yönetimini zorlaştırır. Yan paneli bir merkez bağlamına geçirmek de önbelleği karmaşıklaştırır ve backend okumalarını katlar.

## Karar
1. **Modül = yetki birimi.** Bir modülü görebiliyorsan tüm sayfalarını da görürsün. İçerideki kısıtlar sayfa bazında değil, eylem (düğme) bazındadır.
2. **Bir sayfa = bir veri kümesi = bir adres.** Farklı veri kümeleri ayrı alt menü sayfalarıdır, veri sekmesi olmaz. Sekme ya da segment sadece aynı listeyi filtreleyebilir.
3. **Alt menü tek seviyedir.** Menü içinde menü olmaz.
4. **Organizasyon sayfalarında merkez bir bağlam değil, filtredir** (`?center=`). Önbellek anahtarı `org + sayfa + merkez` olur.
5. **Satır düzeyindeki sayfalarda "Tüm merkezler" seçeneği yoktur.** Bu sayfalar kişiler, takvim, rezervasyonlar ve finanstır. Tek merkez için açılırlar, varsayılan son seçilen merkezdir. "Tüm merkezler" sadece toplanmış ya da küçük veride kullanılır: genel bakış, raporlar, istisnalar, denetim.
6. **Klasör = menü öğesi; rol = yetenek kontrolü.** Ortak bir sayfanın role özgü parçaları, yeteneklerle açılan bileşenlerdir.
7. **Plan dışı modüller gizlenir**, kilitli gösterilmez. Yükseltme bilgisi iki yerde verilir: Organizasyon › Abonelik ve bağlamsal limit diyalogları.

### Kabul edilen menüler
- **Stüdyo › Merkez grubu:**
  - Bugün (pano)
  - Program: Takvim, Etkinlikler, Özel ders talepleri, Bekleme listeleri
  - Kişiler: Üyeler, Adaylar, Başvurular, Gelen kutusu
  - Satış: Paket fiyatları, Satışlar ve tahsilat, Borçlar, Hakediş; Business'ta ayrıca Mutabakat
  - Merkez: Ekip, Salonlar, Kapanışlar, Raporlar, Denetim, Ayarlar
- **Stüdyo › Organizasyon grubu:**
  - Tanımlar: Disiplinler, Paketler, Çalışma takvimi, Şablonlar ve hatırlatmalar, Belgeler, Politikalar, Otomasyon
  - Gözetim: İstisnalar, Kişiler, Takvim, Rezervasyonlar, Finans, Raporlar, Denetim. Hepsi salt okunur ve merkez filtrelidir. Tek merkezli organizasyonda, merkez bağı olan kişiye gizlenir.
  - Organizasyon: Genel bakış, Profil ve marka, Merkezler, Ekip, Güvenlik, Abonelik ve faturalar, Sahiplik ve kapatma
- **Ben:**
  - Ana sayfa: sıcak bir özet, role göre hitap.
  - Program: Benimkiler / Verdiklerim / Tümü
  - Talepler: sadece eğitmene görünür.
  - Cüzdan: organizasyona göre gruplu; haklar, telafi, borç, ödemeler, hakediş.
  - Hesabım: profil, uygunluk, bildirimler, Üyeliklerim.
- **Platform:**
  - Genel bakış
  - Kiracılar: Organizasyonlar, Denemeler, Askıdakiler. Burada "organizasyon oluştur ve sahibini davet et" akışı yer alır.
  - Abonelik: Planlar ve fiyatlar, Abonelikler, Faturalar ve iadeler
  - Destek: Talepler, Destek oturumları kaydı, Duyurular
  - Sistem: Platform ekibi, Platform denetim kaydı, Ayarlar
- **Masaüstünde** modüller için ikon şeridi ve modülün sayfaları için bir panel bulunur. **Mobilde** modüller alt çubukta, sayfalar üstte yatay bir listede yer alır.

## Değerlendirilen alternatifler
- **Merkez başına detay sekmeleri:** Reddedildi. Veri sekmelerini yönetmek zor, bağlam değişimi de önbelleği karmaşıklaştırıyor.
- **Yükseltme için kilitli menü öğeleri:** Reddedildi. Öğrenme eğrisini artırıyor.

## Sonuçlar
- Menüler daha az ve daha düz olur. Her adres tek bir sorgu anahtarı ailesine karşılık gelir.
- Bir modülün sayfa listesi büyüyebilir, ama asla iç içe büyümez.
