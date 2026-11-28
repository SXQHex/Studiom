# Studiom

> **© 2026 Studiom. All rights reserved.**
> This repository and all of its contents (source code, designs, documents, data and assets) are proprietary and confidential. No license is granted. You may not copy, reproduce, modify, distribute, publish, sublicense, sell, or use any part of it, in whole or in part, for any purpose, without the prior written permission of the copyright holder.
> **Automated access is prohibited.** Scraping, crawling, indexing, mirroring, and using any content of this repository to train, fine-tune, evaluate, or prompt machine-learning or artificial-intelligence models, agents, or datasets are expressly forbidden.
>
> **© 2026 Studiom. Tüm hakları saklıdır.**
> Bu depo ve içindeki her şey (kaynak kod, tasarımlar, belgeler, veriler ve varlıklar) mülkiyete tabidir ve gizlidir. Hiçbir lisans verilmemiştir. Hak sahibinin önceden yazılı izni olmadan, herhangi bir amaçla, tamamen ya da kısmen kopyalanamaz, çoğaltılamaz, değiştirilemez, dağıtılamaz, yayımlanamaz, alt lisanslanamaz, satılamaz ve kullanılamaz.
> **Otomatik erişim yasaktır.** İçeriğin kazınması, taranması, dizine eklenmesi, aynalanması; yapay zekâ veya makine öğrenmesi modellerinin, ajanlarının ya da veri kümelerinin eğitiminde, ince ayarında, değerlendirilmesinde veya istemlerinde kullanılması açıkça yasaktır.

Dans, yoga ve pilates stüdyoları için çok kiracılı yönetim platformunun frontend'i.

Belgeler için başlangıç noktası: [`docs/README.md`](docs/README.md).

## Yayın

Karar [ADR-011](docs/decisions/ADR-011-preview-and-hosting-cloudflare.md)'dedir. `main`, Cloudflare Workers Builds ile `studiom.fethiyetango.com` adresine yayınlanır. Diğer dallar önizleme adresi alır.

Panel ayarları (Workers & Pages → `studiom` → Settings → Builds):

| Alan                           | Değer                     |
| ------------------------------ | ------------------------- |
| Production branch              | `main`                    |
| Build command                  | `pnpm build`              |
| Deploy command                 | `pnpm run deploy`         |
| Preview command (diğer dallar) | `pnpm run deploy:preview` |
| Root directory                 | boş (depo kökü)           |

Node ve pnpm sürümü `.nvmrc` ve `packageManager` alanından okunur. Elle yayın gerekirse: `pnpm build && pnpm run deploy`.
