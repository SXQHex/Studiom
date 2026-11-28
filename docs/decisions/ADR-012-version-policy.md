# ADR-012: Sürüm politikası

## Durum

Kabul edildi

## Tarih

2026-11-28

## Bağlam

Araç ve paket sürümleri dağınık seçilirse güvenlik yamaları gecikir ve ortamlar arası farklar doğar.

## Karar

- **Node:** en güncel LTS hattı. Şu an 26.13.1 (Lithium). `.nvmrc` ve `engines` (`>=26.13.1 <27`) bu sürümü gösterir.
- **pnpm:** en güncel kararlı sürüm, `packageManager` alanında sabitlenir.
- **npm paketleri:** her paketin `latest` etiketindeki son kararlı sürümü kullanılır. Beta, rc ve next sürümleri kullanılmaz.
- **Sabitleme:** sürümler tam olarak yazılır, `^` ya da `~` kullanılmaz. Birden çok pakette kullanılanlar `pnpm-workspace.yaml` içindeki catalog'da tek yerde tutulur.
- **Güncelleme:** `pnpm outdated -r` her faz kontrol noktasında boş olmalıdır.
- **İstisna:** Bir araç son sürümle uyumsuzsa ona özel bir sürüm verilir, gerekçesi yapılandırmada yazılır. Uygulama sürümü bundan etkilenmez. Şu anki tek istisna: dependency-cruiser'a `packageExtensions` ile verilen TypeScript 6.0.3, çünkü araç TypeScript 7.0 kaynaklarını henüz okuyamıyor. Aracın SSS'ine göre destek TypeScript 7.1 ile geliyor. 7.1 kararlı (`latest`) olduğunda bu istisna kaldırılır.

## Sonuçlar

- Yeni bir LTS hattı çıktığında `.nvmrc`, `engines` ve CI aynı PR'da güncellenir.
