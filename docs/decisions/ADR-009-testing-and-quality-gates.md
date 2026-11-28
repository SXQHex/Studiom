# ADR-009: Test stratejisi ve kalite kapıları

## Durum
Kabul edildi

## Tarih
2026-11-28

## Bağlam
"Bitti" tanımına göre elle tetiklenebilen tüm sayfa ve eylem senaryoları dört Playwright profilinde test edilmeli: Desktop Chromium, Pixel 7, Desktop WebKit, iPhone 15. Kullanıcıların anlamlı bir bölümü koyu tema kullanıyor. Tam bir görsel matris 5.000'den fazla ekran görüntüsü üretir ve WebKit yazı tipi farkları yanlış alarm yaratır.

## Karar
| Takım | Ne | Profil | Dil / tema |
|---|---|---|---|
| **e2e** (davranış) | Tüm sayfa ve eylem senaryoları; `?scenario=` ile 4 durum; yetki ve plan kapıları. Göreli doğrulama, saat dondurulmaz. | 4 profil | tr, **koyu** |
| **e2e-smoke** | Kabuk başına 1 akış | Desktop Chromium | en; açık tema; RTL klavye |
| **visual** (sadece mock, saat dondurulur) | Her sayfa × 4 durum | Desktop Chromium + iPhone 15 | tr, koyu; temsilci sayfalar açık ve RTL |
| **a11y** | Her sayfada `@axe-core/playwright` | Desktop Chromium | tr, koyu **ve** açık |

- **Görsel tabanlar:** Sadece CI'da, resmi Playwright Docker imajında üretilir. Yazı tipleri kendi sunucumuzdan gelir, animasyonlar kapalıdır, küçük bir piksel toleransı uygulanır.
- **PR ve gece ayrımı:** PR'larda e2e Desktop Chromium ve iPhone 15'te, değişen modüllerle birlikte koşar. 4 profilin tamamı ve visual, birleşmede ve her gece koşar.
- **CI kapıları (esnetilmez):**
  - oxlint, oxfmt, knip, dependency-cruiser
  - `tsc --noEmit` (tam strict)
  - i18next-cli eksik anahtar denetimi
  - RTL sınıf denetimi
  - boyut bütçesi
  - yukarıdaki test takımları
- Sürümden önce gerçek Safari (macOS) ve iOS Simulator üzerinde elle bir kontrol listesi çalıştırılır.

## Değerlendirilen alternatifler
- **iPhone 15 yerine Pixel 7'de görsel test:** Reddedildi. Chromium ve Pixel 7'nin ikisi de Blink. iPhone 15, iOS hatalarının yaşadığı WebKit'i ekliyor.
- **Açık temayı ana tema yapmak:** Bunun teknik bir sebebi yok. Kullanıcı tabanı nedeniyle koyu tema ana tema.

## Sonuçlar
- 5.000'den fazla yerine yaklaşık 700 görsel taban olur.
- e2e takımları ileride gerçek backend üzerinde de kullanılabilir (ADR-007).
