# ADR-020: Görsel onay birleştirmedir

## Durum

Kabul edildi. [ADR-016](ADR-016-merge-and-release-gates.md)'nın "Görsel onay" maddesinin yerine geçer.

## Tarih

2026-11-28

## Bağlam

`Visual Approval` işi, görüntü değiştiren her commit'te CI'ı durdurup ayrı bir onay istiyordu. Depo sahibi bu kesintiyi istemedi (2026-11-28).

## Karar

- CI onay beklemeden tamamlanır. `Visual Approval` işi kaldırıldı.
- **Görsel onay PR'ı birleştirmektir.** Depo sahibi görüntüleri birleştirmeden önce "Files changed" sekmesinde inceler ([ADR-014](ADR-014-visual-baseline-approval.md)).
- **Ajanlar PR birleştirmez ve otomatik birleştirmeyi açmaz.**
- `CI Gate`, dal kuralı ve yayın engelleri ADR-016'daki gibi kalır. `CI Gate` iş akışı denetimi, kontrol ve build ile e2e başarısını ister.

## Değerlendirilen alternatifler

- **Ortam onayı (önceki yöntem):** Görüntülere bakılmadan birleştirmeyi engeller, ama her görsel commit'inde bekletir.

## Sonuçlar

- Görüntülere bakmadan birleştirmeyi durduran teknik bir adım yoktur.
- `dorny/paths-filter` yalnız bu onay için kullanılıyordu; [ADR-018](ADR-018-tech-stack.md) CI satırındaki bu araç kaldırıldı.
- GitHub'daki `visual-approval` ortamı kullanılmaz.
