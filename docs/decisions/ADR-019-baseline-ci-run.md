# ADR-019: Görsel taban commit'inden sonra tek CI koşusu

## Durum

Kabul edildi. [ADR-014](ADR-014-visual-baseline-approval.md)'ün "İş akışı CI'ı kendisi tetikler" maddesinin yerine geçer.

## Tarih

2026-11-28

## Bağlam

Taban görüntülerini iş akışı token'ıyla commit eder. GitHub o commit'in PR koşusunu "onay bekliyor" durumunda bırakır. İş akışının elle tetiklediği ikinci koşu dal kuralındaki `CI Gate` denetimine sayılmadı ([#12](https://github.com/SXQHex/Studiom/pull/12), 2026-11-28). Aynı görüntüler için iki kez onay gerekti.

## Karar

İş akışı CI tetiklemez. Taban commit'inden sonra depo sahibi PR sayfasında **Approve and run workflows** düğmesine basar. Birleştirme kuralları [ADR-016](ADR-016-merge-and-release-gates.md)'daki gibidir.

## Değerlendirilen alternatifler

- **GitHub App ya da kişisel erişim anahtarıyla push:** PR koşusu kendiliğinden başlar ve tıklama kalkar. Depoda gizli anahtar tutmayı gerektirir; istenirse yeni bir ADR ile yapılır.

## Sonuçlar

- Görsel değiştiren PR'da tek CI koşusu ve tek `Visual Approval` vardır.
- İş akışının `actions: write` yetkisi kalktı.
