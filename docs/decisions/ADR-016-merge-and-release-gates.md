# ADR-016: Birleştirme ve yayın engelleri

## Durum

Kabul edildi. "Görsel onay" maddesi ve `CI Gate` içindeki onay koşulu [ADR-020](ADR-020-merge-is-visual-approval.md) ile geçersiz.

## Tarih

2026-11-28

## Bağlam

Projenin asıl işi görsel frontend. Testten geçmemiş ya da görüntüsü onaylanmamış bir değişiklik `main`'e ve canlıya çıkmamalı.

## Karar

- **`main` dal kuralı:** Değişiklik sadece PR ile girer. `CI Gate` denetimi başarılı olmadan ve dal `main` ile güncel olmadan birleştirilemez. Zorla push ve silme yasak. Kuralı atlayabilen kimse yok.
- **`CI Gate`:** Tek zorunlu denetim. İş akışı denetimi, kontrol ve build, e2e (a11y ve visual dahil) başarılı olmalı; görsel taban değiştiyse onay da verilmiş olmalı.
- **Görsel onay:** PR taban görüntülerini değiştiriyorsa `Visual Approval` işi `visual-approval` ortamında bekler. Depo sahibi görüntüleri "Files changed" sekmesinde inceler ve koşu sayfasında "Review deployments" ile onaylar. Yeni commit yeni onay ister. **Ajanlar bu onayı asla vermez.**
- **Üretim yayını:** Sadece Cloudflare Workers Builds, sadece `main`. `scripts/deploy-guard.ts` başka her yerden `wrangler deploy` çağrısını reddeder. Diğer dallar önizleme sürümü yükler.

## Değerlendirilen alternatifler

- **Zorunlu PR onayı (review):** PR'lar depo sahibinin hesabıyla açılıyor ve GitHub kişinin kendi PR'ını onaylamasına izin vermiyor.
- **Etiketle onay:** Yeni commit'te etiketin ayrıca düşürülmesi gerekir. Ortam onayı koşuya, yani commit'e bağlıdır.

## Sonuçlar

- Koruma kazaya karşıdır. Cloudflare ya da GitHub yönetici erişimi olan biri ayarları değiştirebilir ya da `wrangler versions deploy` ile sürüm yükseltebilir. Mac'te Cloudflare oturumu açık tutulmaz.
- Dependabot ve diğer PR'lar da aynı kapıdan geçer.
