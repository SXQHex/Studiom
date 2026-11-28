# ADR-006: Kod mimarisi ve sınırlar

## Durum
Kabul edildi

## Tarih
2026-11-28

## Bağlam
Aynı veri birden çok kabukta görünüyor. Merkez sayfaları ile organizasyon gözetimindeki salt okunur kopyaları buna örnek. Seans listesi de hem Stüdyo'da, hem Ben'de, hem de açık sayfada kullanılıyor. Modüller bağımsız kalmalı. Ama testleri ve çevirileri modül başına bölmek bakımı zorlaştırıyor.

## Karar
- **Katmanlar** (Feature-Sliced Design'ın sadeleştirilmiş hâli): `packages/*` → `apps/web/src/domain/<varlık>` → `apps/web/src/shells/<kabuk>/<modül>`.
  - `packages/ui`: shadcn + react-aria ilkel bileşenleri, tokenlar, durum bileşenleri (boş, hata, yükleniyor, yetkisiz, bulunamadı).
  - `packages/mocks`: seed, depo ve MSW işleyicileri.
  - `domain/<varlık>`: people, sessions, bookings, packages, finance… Her varlık şunları içerir: Zod şemaları ve tipler, `queryOptions`, `readOnly` gibi kipleri olan ortak görünümler, ortak eylemler (yoklama, iptal).
  - `shells/`: `platform`, `studio/{center,organization}`, `me/{home,program,requests,wallet,account}`, `public`. Bir modül sayfaları ve o modüle özgü formları ve akışları taşır.
- **Modül klasöründe sadece kod bulunur.**
  - Çeviriler merkezdedir: `apps/web/locales/{tr,en}/<kabuk>-<modül>.json`. Her modül bir i18next ad alanıdır.
  - E2E testleri merkezdedir: `apps/web/e2e/<kabuk>/<modül>.spec.ts`.
  - Mock veri `packages/mocks` içinde kalır.
  - Dosya adları modül adlarını yansıtır.
- Kodda tanımlayıcılar ve yollar **İngilizcedir**, örneğin `shells/studio/center`, `merkez` değil. Markdown belgeleri Türkçedir.
- **Sınırları CI'da dependency-cruiser zorlar:**
  - domain ↛ shells
  - bir kabuk ↛ başka bir kabuk (`studio/center` ↔ `studio/organization` dahil)
  - modül ↛ kardeş modül
  - döngü yok
  - packages ↛ apps

  Bu denetim oxlint, oxfmt ve knip ile aynı "esnetilmez" sınıftadır.

## Değerlendirilen alternatifler
- **Test ve çevirileri modülün yanında tutmak:** Bakım nedeniyle reddedildi. Çevirmen ve Playwright yapılandırması tek yerde çalışıyor.
- **Sadece oxlint `no-restricted-imports`:** Katman ve kardeş modül kurallarını genel olarak ifade edemiyor.
- **Her kabuk için ayrı workspace paketi:** Sadece paket düzeyinde çalışıyor ve ağır.
- **`me/{user,instructor}` ayrımı:** Reddedildi, Ben kabuğunun sayfaları iki rolü birlikte taşıyor.

## Sonuçlar
- Bir modülü kaldırmak üç yerde aynı adı silmek demektir: kod, locales ve e2e.
- Domain görünümleri sayesinde tahminen 15-20 ekranlık çift iş önlenir.
