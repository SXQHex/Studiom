# ADR-010: Veri olarak plan yetenekleri

## Durum
Kabul edildi

## Tarih
2026-11-28

## Bağlam
Starter, Pro ve Business limitlerde ve özelliklerde ayrışıyor. Platform Sahibi bunları düzenleyebilmeli. Her modül plan kontrolünü kendi içine sabit yazarsa davranış tutarsızlaşır.

## Karar
- API'den (şimdilik MSW'den) okunan tek bir **yetenek kaydı** vardır: `domain/capabilities`. Kodda sadece iki şey sabittir:
  - özellik **adları**: `waitlist`, `freeze`, `payroll`, `events`, `advancedCrm`, `automation`, `emailNotifications`, `reminders`, `advancedReports`, `settlement`, `staffPermissions`, …
  - limit **anahtarları**: `centers`, `rooms`, `disciplines`, `instructors`, `activeStudents`
- Menüler, düğmeler ve limit diyalogları "bağlar × yetenekler"den türetilir. Plan dışı modüller gizlenir (ADR-002).
- Platform › Abonelik › Planlar ve fiyatlar sayfasında şunlar düzenlenir:
  - limitler. "Ticari kota yok" açık bir değerdir, asla 0 ya da sihirli bir büyük sayı değildir.
  - aylık ve yıllık fiyatlar
  - özellik anahtarları
- Değişiklikler **sürümlüdür**. Yeni aboneliklere ve yenilemelere uygulanır, düzenleme ekranında etki önizlemesi gösterilir ("yenilemede N organizasyonu etkiler").

### Varsayılan plan verisi (2026-11-28)
| | Starter | Pro | Business |
|---|---:|---:|---:|
| Aktif merkez | 1 | 1 | En fazla 5 |
| Aktif ders odası | 1 | Ticari kota yok | Ticari kota yok |
| Aktif disiplin | 1 | Birden fazla | Birden fazla |
| Aktif eğitmen | 1 | Ticari kota yok | Ticari kota yok |
| Aktif öğrenci | 100 | 250 | Organizasyon genelinde 1.250 |
| Aylık | 3.000 TL | 10.000 TL | 20.000 TL |
| Yıllık | 30.000 TL | 100.000 TL | 200.000 TL |

**Özellikler:**
- **Pro ve Business'ta eklenenler:**
  - bekleme listesi ve süreli yer teklifi
  - dondurma ve paket değişikliği
  - gelişmiş CRM: deneme teklifi, indirim, kampanya, segment, otomasyon
  - personel yetkileri, eğitmen anlaşması ve hakediş
  - açık etkinlik akışları; atölye ve etkinlik yönetimi
  - e-posta ve otomatik hatırlatmalar
  - gelişmiş raporlar
- **Starter'da olanlar:** elle aday takibi, temel açık takvim ve ders başvurusu, uygulama içi bildirimler, temel raporlar.
- **Sadece Business'ta olanlar:** merkez bazında ve organizasyon genelinde birleşik raporlar, merkezler arası paket kullanımı ve hesaplaşma.

## Sonuçlar
- Starter mock organizasyonu, limit durumlarını çalıştırmak için 97/100 öğrenciyle kurulur.
- Plan değişiklikleri mevcut satışları ya da dönem ortasındaki abonelikleri asla bozmaz.
