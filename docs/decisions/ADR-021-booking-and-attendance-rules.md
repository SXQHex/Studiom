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
  - Sonrasında yalnız merkez yöneticisi, **gerekçe yazarak** değiştirir. Her değişiklik istisna kaydı olur.
- **Seans düzenleme ve iptal** merkez bağı ister: yönetici ya da Program modülü. Eğitmen yapamaz.
- **Borç ve hak:** Açık borç rezervasyonu engellemez, uyarı gösterilir. Hakkı biten paketle rezervasyon yapılamaz.

## Sonuçlar

- Geliş durumu seans içinde de "gelmedi" olarak işaretlenebilir; bitişten sonra eğitmenin bu imkânı yoktur.
- Disiplin yalnız rol dengesinin açık olup olmadığını önerir; sayılar seansta durur.
