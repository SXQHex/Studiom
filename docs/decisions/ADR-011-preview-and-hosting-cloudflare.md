# ADR-011: Önizleme ve yayın için Cloudflare

## Durum
Kabul edildi. ADR-005'teki "sağlayıcı sürümde seçilir" maddesini netleştirir.

## Tarih
2026-11-28

## Bağlam
ADR-005 statik bir SPA'yı CDN'den yayınlamaya karar verdi ama sağlayıcıyı açık bıraktı. Çizim boyunca her dal ve PR için bir inceleme adresine ihtiyaç var. Studiom ticari bir ürün.

## Karar
- **Cloudflare Workers statik varlıkları.** Yapılandırma `wrangler.jsonc` dosyasında, SPA yönlendirmesi `not_found_handling: single-page-application` ile yapılır.
- **Adres:** `studiom.fethiyetango.com`, Cloudflare özel alan adı olarak bağlanır.
- **Önizleme:** Her dal ve PR için `workers.dev` önizleme adresleri. GitHub bağlantısı Cloudflare Workers Builds ile kurulur.
- **Arama motoru ve bot engeli:** Tüm yanıtlarda `X-Robots-Tag: noindex, nofollow, noai…` başlığı gönderilir (`_headers`), `robots.txt` her şeyi engeller. Bu, README'deki hak bildirimiyle tutarlıdır. Gerçek erişim kısıtı istenirse Cloudflare Access ile e-posta bazlı koruma eklenebilir.
- T01'e kadar `site/` altında yer tutucu bir sayfa yayınlanır. T01'de `assets.directory`, Vite çıktısına (`apps/web/dist`) çevrilir.

## Değerlendirilen alternatifler
### Vercel
- Artısı: önizleme sayfalarında yorum araç çubuğu.
- Reddedildi: ücretsiz Hobby planı ticari kullanıma açık değil, Pro planı kullanıcı başına ücretli. İnceleme zaten thread ve PR üzerinden yapılıyor.

## Sonuçlar
- Statik trafik için maliyet sıfıra yakın. Önizleme ve üretim aynı sağlayıcıda.
- Cloudflare oturumu ve GitHub bağlantısı hesap sahibince bir kez yetkilendirilir.
