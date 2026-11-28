# ADR-014: Görsel taban onay akışı

## Durum

Kabul edildi. "PR'ı birleştirmek onaydır" maddesi [ADR-016](ADR-016-merge-and-release-gates.md) ile geçersiz. ADR-009'daki "visual birleşmede ve her gece koşar" maddesinin yerine geçer.

## Tarih

2026-11-28

## Bağlam

Projenin asıl işi görsel frontend. Eksik tabanları CI'ın sessizce yazması hiçbir şeyi korumuyor. Her görsel değişikliği bir insan görmeden `main`'e girmemeli.

## Karar

- **visual takımı her PR'da koşar** (Desktop Chromium + iPhone 15). Eksik ya da farklı taban koşuyu kırar. Beklenen, gerçekleşen ve fark görüntüleri `playwright-report` çıktısındadır.
- **Tabanları sadece "Update Visual Baselines" iş akışı yazar.** PR'a `update-visual-baselines` etiketi eklenerek tetiklenir. `main`'e birleştikten sonra bir dal üzerinde elle de çalıştırılabilir.
- **Onay:** İş akışı görüntüleri PR dalına commit eder. İnceleyen kişi "Files changed" sekmesinde eski ve yeni görüntüyü karşılaştırır. PR'ı birleştirmek onaydır. Beğenilmeyen görüntüde kod düzeltilir ve etiket yeniden eklenir.
- **Güvenlik:** Dal kodunu çalıştıran işin yazma yetkisi yoktur. Ayrı bir iş sadece PNG dosyalarını commit eder. Fork'lardan gelen PR'larda ve varsayılan dalda çalışmaz.
- **Depolama:** Tabanlar `apps/web/e2e/__screenshots__/` altında düz git ile tutulur. Depo belirgin biçimde büyürse Git LFS yeni bir ADR ile değerlendirilir.

## Sonuçlar

- Görsel değişiklik yapan her PR'da bir etiket adımı ve görüntü incelemesi vardır.
- İş akışı token'ıyla yapılan push CI'ı normal yoldan başlatmaz; GitHub o commit'in PR koşusunu "onay bekliyor" durumunda bırakır. İş akışı CI'ı kendisi tetikler.
