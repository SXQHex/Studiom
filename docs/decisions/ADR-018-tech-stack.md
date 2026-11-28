# ADR-018: Teknoloji yığını

## Durum

Kısmen onaylandı. TypeScript 7, FullCalendar 7 ve temel kurulum yöntemi onaylı (2026-11-28; yöntemi ajanın seçmesi istendi). Mock verisi katmanı onay bekliyor. Tamamı onaylanmadan kurulum yapılmaz.

## Tarih

2026-11-28

## Bağlam

[ADR-017](ADR-017-use-proven-solutions.md) her işte hazır ve kanıtlanmış çözümü ve resmî kurulum yolunu ister. Bu belge büyük kütüphaneleri bir kez seçer. [ADR-005](ADR-005-frontend-stack-and-hosting.md) yığınını tamamlar. Sürümler 2026-11-28'deki son kararlı sürümlerdir; güncel sürümün kaynağı `package.json`'dır. "İndirme" npm'in haftalık sayısıdır.

## Temel kurulum

Depo kökü `/Users/erkinkunbuk/projeler/Studiom`. İskelet resmî komuttan gelir:

```bash
pnpm dlx shadcn@latest init --base aria --preset rhea --template vite --monorepo --rtl --name studiom
```

Komut dolu bir depo köküne kuramıyor (2026-11-28 denemesi). Bu yüzden geçici bir klasörde çalıştırılır, ham çıktısı ayrı bir commit olarak köke alınır. `docs/`, `tasks/`, `.agents/`, `.github/`, `README.md` ve git geçmişi korunur. Sonraki her uyarlama ayrı commit'tir. İskeletin getirdiği ESLint ve Prettier, oxlint ve oxfmt ile; TypeScript 6 ve pnpm 11 güncel sürümlerle değiştirilir ([ADR-012](ADR-012-version-policy.md)).

### Kurulum sırası

Her adım ayrı commit'tir; araçlar kendi resmî komutuyla eklenir.

1. `shadcn init` (yukarıdaki komut): monorepo iskeleti, ham çıktı.
2. pnpm 12 ve TypeScript 7'ye geçiş.
3. `oxlint --init`, `oxfmt --migrate prettier`; ESLint ve Prettier kaldırılır.
4. `pnpm create @knip/config`, `depcruise --init`, size-limit.
5. `pnpm create playwright`, Vitest.
6. TanStack Router, Query, Form ve Zod.
7. i18next paketleri ve `i18next-cli init`.
8. `msw init`, mock veri katmanı.
9. FullCalendar'ın shadcn kaydı.
10. `@cloudflare/vite-plugin` ve wrangler; mevcut CI, dal kuralı ve yayın korumaları yeni yapıya bağlanır.

## Uygulama

| İş                          | Seçim (sürüm)                                                                                         | İndirme       | Resmî kurulum                                                            | Alternatif                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Monorepo                    | pnpm 12.23.0, Turborepo 2.11.13                                                                       | 46 Mn (turbo) | iskeletle gelir                                                          | Nx                                                                                    |
| Derleme                     | Vite 8.4.0, React 19.3.1, TypeScript 7.0.2                                                            | 275 Mn (vite) | iskeletle gelir                                                          | Next.js (ADR-005'te elendi)                                                           |
| Bileşenler                  | shadcn 4.23.1 (React Aria), react-aria-components 1.22.1                                              | 8 Mn (RAC)    | `shadcn add <ad> -c apps/web`                                            | Radix ya da Base UI tabanı                                                            |
| Stil ve ikon                | Tailwind 4.3.5, lucide-react 1.82.0, Geist (`@fontsource-variable/geist`)                             | 179 Mn        | iskelet; `pnpm add`                                                      | –                                                                                     |
| Tema                        | next-themes 0.4.6 (shadcn Sonner ile gelir)                                                           | 33 Mn         | `pnpm add next-themes`                                                   | shadcn belgesindeki ThemeProvider kopyası                                             |
| Bildirim, boş ve yükleniyor | shadcn `sonner`, `empty`, `skeleton`                                                                  | –             | `shadcn add`                                                             | –                                                                                     |
| Yönlendirme                 | TanStack Router 1.170.46                                                                              | 28 Mn         | `pnpm add @tanstack/react-router`, `pnpm add -D @tanstack/router-plugin` | React Router                                                                          |
| Sunucu durumu               | TanStack Query 5.108.4                                                                                | 87 Mn         | `pnpm add @tanstack/react-query`                                         | SWR                                                                                   |
| Form ve şema                | TanStack Form 1.33.6, Zod 4.6.7, shadcn `field`                                                       | 6 Mn / 450 Mn | `pnpm add @tanstack/react-form zod`                                      | React Hook Form                                                                       |
| Tablo                       | shadcn `table` (React Aria); gerektiğinde TanStack Table 9.3.1                                        | 36 Mn         | `shadcn add table`                                                       | AG Grid                                                                               |
| Haftalık takvim             | **FullCalendar 7.1.5** (MIT)                                                                          | 2,8 Mn        | `shadcn add @fullcalendar/monarch-event-calendar` (resmî kayıt)          | react-big-calendar (1,5 Mn), EventCalendar (0,12 Mn); Schedule-X'te sürükleme ücretli |
| Sürükle bırak               | React Aria içindeki DnD                                                                               | –             | ek paket yok                                                             | dnd-kit                                                                               |
| Grafik                      | shadcn `chart` (Recharts 3.11.2)                                                                      | 66 Mn         | `shadcn add chart`                                                       | ECharts                                                                               |
| Tarih                       | `@internationalized/date`, `Intl`; FullCalendar için `temporal-polyfill`                              | 25 Mn         | bileşenlerle gelir                                                       | date-fns                                                                              |
| i18n                        | i18next 27.2.10, react-i18next 18.0.3, i18next-cli 1.95.7, dil algılama ve tembel yükleme eklentileri | 36 Mn         | `pnpm add i18next react-i18next`, `i18next-cli init`                     | Lingui, Paraglide                                                                     |
| Mock                        | MSW 3.0.8, `@msw/data` 1.1.9, Faker 10.6.0                                                            | 34 Mn (msw)   | `msw init public --save`                                                 | Mirage                                                                                |

## Kalite, test ve yayın

| İş                     | Seçim (sürüm)                                                                                        | Resmî kurulum                                  | Not                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------ |
| E2E ve erişilebilirlik | Playwright 1.65.1, `@axe-core/playwright`                                                            | `pnpm create playwright`                       | ADR-009                                          |
| Birim testi            | Vitest 5.1.2, Testing Library                                                                        | `pnpm add -D vitest`                           | –                                                |
| Lint ve biçim          | oxlint 1.95.0 (+tsgolint), oxfmt 0.80.0                                                              | `oxlint --init`, `oxfmt --init`                | –                                                |
| Kullanılmayan kod      | knip 6.49.0                                                                                          | `pnpm create @knip/config`                     | –                                                |
| Katman sınırları       | dependency-cruiser 18.9.0                                                                            | `depcruise --init`                             | ADR-006                                          |
| RTL sınıf denetimi     | eslint-plugin-better-tailwindcss (oxlint eklentisi olarak)                                           | kurulumda doğrulanacak                         | uymazsa yeniden konuşulur                        |
| Boyut bütçesi          | size-limit 14.3.0                                                                                    | `pnpm add -D size-limit @size-limit/file`      | elle yazılan betiğin yerine                      |
| CI                     | GitHub Actions; `re-actors/alls-green`, `dorny/paths-filter`, `stefanzweifel/git-auto-commit-action` | `gh actions-lock`                              | elle yazılan adımların yerine; ADR-014, 015, 016 |
| Güvenlik               | actionlint, zizmor, CodeQL, secret scanning, Dependabot                                              | kurulu                                         | ADR-015                                          |
| Yayın                  | Cloudflare Workers Builds, wrangler, `@cloudflare/vite-plugin`                                       | `pnpm add -D @cloudflare/vite-plugin wrangler` | ADR-011                                          |

## Mock verisi seçenekleri

Ağ katmanı MSW'dir. Veri deposu için bakılanlar:

| Seçenek              | Haftalık indirme    | Durum                                                     |
| -------------------- | ------------------- | --------------------------------------------------------- |
| `@msw/data` (öneri)  | 132 bin             | MSW ekibinden; Zod şeması, ilişki, sorgu, sayfalama       |
| Mirage JS            | 386 bin             | MSW'nin yerine geçer; son sürüm Ekim 2023                 |
| json-server          | 416 bin             | Ayrı sunucu süreci ister; 1.x beta                        |
| TanStack DB          | 1,7 Mn (`react-db`) | 1.0 aday sürüm; mock değil, uygulama veri mimarisi        |
| Dexie (IndexedDB)    | 3,6 Mn              | Genel tarayıcı veritabanı; sorgu ve ilişkiyi biz bağlarız |
| Prism, `@msw/source` | 292 bin / 34 bin    | OpenAPI belgesi ister; henüz yok                          |

Veri üretimi: Faker (24,9 Mn, tohumlanabilir). `zod-schema-faker` (90 bin) şemadan rastgele veri üretir; ekranlar arası tutarlı senaryo için yetmez.

## Bilinen sınırlar

- Fareyle taşıma, boyutlandırma ve boş alanda sürükleyerek oluşturma FullCalendar'ın ücretsiz sürümünde vardır.
- **FullCalendar klavyeyle sürüklemeyi desteklemiyor** ([açık talep](https://github.com/fullcalendar/fullcalendar/issues/2535)). Erişilebilir yol seans düzenleme formudur (saat ve gün değiştirme); taslaktaki Shift+ok taşıma yapılmaz. Salonların yan yana sütun olduğu görünüm ücretli eklentidedir; kullanılmaz, salon filtreyle seçilir. Adlandırılmış saat dilimi ve RTL kurulumda doğrulanacak.
- **FullCalendar'ın shadcn kaydı React Aria tabanından söz etmiyor.** `components.json`'a kayıt adresi eklenir; kurulumda getirdiği bileşenlerin React Aria ile uyumu doğrulanır, uymazsa FullCalendar'ın kendi temasıyla kullanılır.
- **react-big-calendar** (MIT) gün ve hafta görünümünde salon, eğitmen ya da kişi sütunlarını ücretsiz destekler (2026-11-28 kaynak kodu incelemesi: `resources`, `resourceGroupingLayout`; sürükleyince hedef kaynak bildirilir). Ay ve ajanda görünümünde kaynak sütunu yoktur. React'in üstüne yaklaşık 74 KB JS + 3 KB CSS (date-fns ve Türkçe ile). Son sürümü Haziran 2026.
- **Syncfusion Scheduler** (depo sahibinde lisans var) değerlendirildi. 2026-11-28 ölçümü, React'in üstüne eklenen gzip boyutu: FullCalendar yaklaşık 79 KB JS + 4 KB CSS; Syncfusion yaklaşık 428 KB JS + 205 KB CSS (hafif tema). Resmî Tailwind 4 ve shadcn teması yok; lisans anahtarı gerekir. Güçlü yanı, lisans kapsamında salonları yan yana sütunlayan kaynak görünümüdür.
- **`@mswjs/data` kullanımdan kalktı;** yerini `@msw/data` aldı ([ADR-007](ADR-007-mock-layer.md)'deki ad bununla güncellenir). Kullanımı daha düşüktür.
- **TypeScript 7** iskeletin sürümünden yenidir. Uyumsuz araç çıkarsa ADR-012'deki istisna yolu işler.
- Ek durum kütüphanesi (Redux, Zustand) yok; sunucu durumu Query'de, adres durumu Router'dadır.
