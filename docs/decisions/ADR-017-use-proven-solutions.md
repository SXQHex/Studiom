# ADR-017: Hazır çözüm önceliği, tekrar icat yok

## Durum

Kabul edildi

## Tarih

2026-11-28

## Bağlam

Yaygın kullanılan ve kendini kanıtlamış kütüphaneler, bileşenler ve tek satırlık kurulum komutları varken aynı işi elle yazmak hata ve bakım yükü üretir. Depo sahibi bunu kabul etmiyor.

## Karar

Her iş için sırayla:

1. **Resmî kurulum ya da CLI yolu** (örneğin shadcn CLI). Üretilen çıktı elle taklit edilmez.
2. **Yaygın kullanılan, bakımı süren kütüphane, bileşen ya da CI eylemi.** Seçim güncel resmî belgeyle doğrulanır.
3. **Elle yazım sadece zorunluysa:** projeye özel CI ve iş akışları, kütüphanelerin birbirine doğru bağlanması ve ürüne özgü ekran ve iş mantığı. PR açıklaması hangi hazır çözümlere bakıldığını ve neden yetmediklerini belirtir. Tereddüt varsa önce depo sahibine sorulur.

**Bileşen elle yazılmaz.** Arayüz bileşeni shadcn ya da seçilen kütüphaneden gelir.

- Kural depo geneli için geçerlidir: uygulama kodu, arayüz, altyapı, araç yapılandırması, betikler ve CI.
- Büyük kütüphane seçimleri [ADR-018](ADR-018-tech-stack.md)'dedir. Listede olmayan büyük bir bağımlılık önce depo sahibiyle konuşulur.
- Hazır bileşeni projeye uyarlamak (tema, metin, erişilebilirlik düzeltmesi) elle yazma sayılmaz.
- Kalite kapıları ([ADR-009](ADR-009-testing-and-quality-gates.md)) bu kural için esnetilmez.

## Sonuçlar

- Mevcut elle yazılmış parçalar gözden geçirilir. Her biri için hazır karşılığı önerilir; değişiklik depo sahibinin onayıyla yapılır.
- Plandaki elle yazma varsayan işler (örneğin T06 haftalık takvim keşfi) önce hazır çözüm arar.
