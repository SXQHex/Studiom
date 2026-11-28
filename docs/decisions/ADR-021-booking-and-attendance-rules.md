# ADR-021: Rezervasyon ve yoklama kuralları

## Durum

Kabul edildi. [ADR-004](ADR-004-domain-model-decisions.md) ve [ADR-003](ADR-003-permission-model.md) kararlarını tamamlar.

## Tarih

2026-11-28

## Bağlam

ADR-004 seans seçeneklerini ve paketleri tanımlar. Rezervasyon, iptal ve yoklama sırasında hangi kuralın işleyeceği yazılı değildi. Depo sahibi aşağıdaki noktaları belirledi.

## Karar

- **Geç iptal:** Paket şablonundaki ücretsiz iptal süresi geçtikten sonra yapılan iptalde hak düşer.
- **Rol dengesi:** Her rolün (lider, takipçi) kontenjanı seansta **elle girilir**. Bir rolün kontenjanı seans kapasitesini aşamaz ve o rolde alınmış yer sayısının altına inemez. Toplam kapasite ayrıca geçerlidir. Telafi rol kontenjanına sayılmaz.
- **Yoklama:** Seans başlangıcından bitişine kadar eğitmen, atanmış asistan ve Program yetkisi olan merkez ekibi işaretler.
  - Seans bittikten sonra eğitmen ve asistan **hiçbir değişiklik yapamaz**.
  - Sonrasında yalnız merkez yöneticisi yoklamayı **onaylar** ya da **gerekçe yazarak** değiştirir.
  - Onay da gerekçeli değişiklik de **denetim kaydına** kişi ve bağ ile yazılır. Gerekçeli değişiklik ayrıca istisna kaydı olur.
- **Kur kaydı ("Kura katıl")** dönemlik derstir ve **öncelikli kayıt hakkı** verir: serinin gelecekteki tüm seanslarına tek paketle yazar.
  - Dolu seanslar (kontenjan ya da rol kontenjanı) uyarı olarak listelenir. Merkez yöneticisi yine de onaylarsa kayıt yazılır; onay denetim kaydına düşer. Üye ve personel onaylayamaz. Diğer kurallar (hak, paket, koltuk) onayla aşılmaz.
  - Kontenjanı aşan seansta ayrı bir **kapasite aşımı uyarısı** durur. Öncelikli olmayan bir katılımcı iptal ederse ya da yönetici salonu veya kapasiteyi değiştirirse uyarı kendiliğinden kalkar. Aşımı olan seans taşınabilir; kapasite alınmış yerlerin altına daha fazla indirilemez.
- **Para bilgisi** (fiyat, ödeme, borç): üyenin kendisi, merkez yöneticisi, o merkezde Satış yetkisi olan personel ve organizasyon sahibi ile yöneticisi (yalnız okur) görür. Merkez yalnız kendi üyelerini ve kendi kayıtlarını görür.
- **Seans düzenleme ve iptal** merkez bağı ister: yönetici ya da Program modülü. Eğitmen yapamaz.
- **Borç ve hak:** Açık borç rezervasyonu engellemez, uyarı gösterilir. Hakkı biten paketle rezervasyon yapılamaz.

## Sonuçlar

- Geliş durumu seans içinde de "gelmedi" olarak işaretlenebilir; bitişten sonra eğitmenin bu imkânı yoktur.
- Disiplin yalnız rol dengesinin açık olup olmadığını önerir; sayılar seansta durur.
