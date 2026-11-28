# ADR-005: Frontend yığını ve yayın

## Durum
Kabul edildi

## Tarih
2026-11-28

## Bağlam
Bu aşama sadece frontend kapsıyor ve tutarlı mock veriyle çalışıyor, backend sonra gelecek. Gereksinimler şunlar: react-aria bileşenleri üzerinde shadcn görünümü, iyi uygulamaya uygun ve tam modüler bir yapı, tekerleği yeniden icat etmeyen bir altyapı, hızlı ve ucuz işletim.

## Karar
- **Monorepo:** pnpm workspaces + Turborepo.
- **Uygulama:** `apps/web`, şunlardan oluşur:
  - Vite + React
  - **TanStack Router**: tip güvenli; kabuk ve modül başına tembel rotalar; niyetle ön yükleme
  - **TanStack Query**: sunucu durumu; sorgu anahtarları ADR-002'ye uyar
  - **TanStack Form** + **Zod**: şemalar formlar, mock veri ve ileride API sözleşmesi tarafından ortak kullanılır
- **Arayüz:** `packages/ui`. **react-aria-components** üzerine kurulu shadcn kalıplarıdır. Taslaktaki `tokens.css` buraya taşınır.
- **Yayın:** **CDN'den statik SPA.** Sağlayıcı sürümde seçilir, çizim boyunca önizleme yayını kullanılır.
- **Performans kuralları:**
  - kabuk ve modül başına kod bölme
  - niyetle ön yükleme
  - modül başına i18n ad alanı
  - hash'li dosyalar `immutable`, `index.html` her zaman taze
  - kendi sunucumuzdan Geist `woff2` alt kümesi
  - CI'da boyut bütçesi: ilk JS yaklaşık 150 KB gzip
- **TypeScript tam strict:** `any`, `as any` ve örtülü `any` yok.

## Değerlendirilen alternatifler
- **Next.js:** Reddedildi. Backend yokken SSR'ın getirisi az. Açık sayfalar ileride sunucu gerekmeden ön-render edilebilir (`/s/*`).
- **React Hook Form:** Uygulanabilirdi. Router ve Query ile aynı ekosistemde kalmak, bağımlılıkları ve knip yüzeyini küçük tutmak için reddedildi.
- **Kendi router, form ya da durum çözümümüz:** Reddedildi, tekerleği yeniden icat etmiyoruz.

## Sonuçlar
- Yayın maliyeti sıfıra yakın. Açık sayfaların SEO'su ertelendi, ön-render yolu açık.
- Backend gelince sadece ağ katmanı değişir (ADR-007).
