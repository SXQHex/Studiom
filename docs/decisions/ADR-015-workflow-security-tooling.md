# ADR-015: İş akışı güvenliği ve denetim araçları

## Durum

Kabul edildi

## Tarih

2026-11-28

## Bağlam

İş akışları depo token'ıyla kod çalıştırır. Etikete göre çözülen eylemler sonradan değiştirilebilir. Birbiriyle örtüşen çok sayıda araç var; her iş için tek araç isteniyor.

## Karar

- **Sabitleme:** GitHub'ın iş akışı kilit dosyası (`.github/workflows/actions.lock`). `uses:` satırları tam sürüm etiketi taşır, commit'i ve alt bağımlılıkları kilit dosyası sabitler. Dosya elle düzenlenmez; `uses:` değişince `gh actions-lock` (`gh extension install github/gh-actions-lock`) çalıştırılır. Dependabot kendi güncellemelerinde dosyayı yeniler.
- **Sözdizimi ve ifade denetimi:** actionlint (shellcheck ile). CI'da digest ile sabitlenmiş resmî imaj.
- **Güvenlik denetimi:** zizmor. CI'da `zizmor-action`; zizmor sürümü eylem sürümünün içinde sabit.
- **Kod ve iş akışı taraması:** CodeQL "default setup" ve secret scanning, depo ayarlarından açılır. Depo özel yapılırsa ücretli eklenti gerekir ve karar yeniden ele alınır.
- **Yeni sürüm:** Yayımından 7 gün geçmemiş bir eylem sürümü alınmaz.
- **Yerel komutlar:** `actionlint`, `zizmor .github`, `gh actions-lock --no-fix`.

## Değerlendirilen alternatifler

- **pinact, Frizbee, ratchet:** Kilit dosyası aynı işi alt bağımlılıklarla birlikte yapıyor.
- **poutine, ghalint, octoscan:** zizmor ve CodeQL ile örtüşüyor.
- **jdx/jactionlint:** actionlint ve zizmor kurallarını tek araçta topladığını söylüyor ama Ekim 2026'da açıldı. Olgunlaşınca ikisinin yerine yeniden değerlendirilir.
- **harden-runner, OpenSSF Scorecard:** CI'a gizli anahtar girince yeniden bakılır.

## Sonuçlar

- Playwright konteyner imajı `@playwright/test` sürümünü izlediği için kilit dosyası onu denetleyemez; `gh actions-lock` bunu uyarı olarak yazar. İmaj Microsoft'un resmî imajıdır ve sürüm etiketiyle alınır.
- actionlint imajının digest'i elle güncellenir.
