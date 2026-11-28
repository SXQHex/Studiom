# Studiom ajan becerileri

Bu klasör, Studiom'da kullanılan ajan becerilerinin tek kaynağıdır. 37 becerilik kişisel koleksiyondan sadece bu projede kullanılan ve birbirinin muadili olmayan 14 tanesi tutuldu (karar 2026-11-28). Çıkarılan 23 beceri silinmedi, `~/.agents-archive/studiom-skills/` altında duruyor ve gerekirse geri getirilebilir.

## Öncelik

Beceriler genel çalışma rehberidir. Kullanıcının açık kararları, ADR'ler (`docs/decisions/`) ve plan (`tasks/plan.md`) her zaman önce gelir. Bir becerinin genel önerisi kalite kapılarını esnetme yetkisi vermez: `any` yok, oxlint, oxfmt, knip ve dependency-cruiser kuralları aynen kalır.

## Tutulan beceriler

| Beceri | Ne zaman |
|---|---|
| `interview-me` | İstek belirsizken, plan yazılmadan önce |
| `planning-and-task-breakdown` | İşi görevlere bölerken (`tasks/todo.md`) |
| `documentation-and-adrs` | Kalıcı bir karar alındığında (ADR) |
| `incremental-implementation` | Her görevi ince, doğrulanabilir dilimlerle yaparken |
| `git-workflow-and-versioning` | Dal, commit ve PR düzeni |
| `frontend-ui-engineering` | Sayfa ve bileşen yazarken |
| `shadcn` | shadcn bileşen ekleme, arama, düzenleme (resmî, `shadcn-ui/ui`) |
| `api-and-interface-design` | `packages/contracts` şemaları ve uç noktaları |
| `source-driven-development` | Çerçeve kararlarını resmî belgeyle doğrulama (React, TanStack, react-aria, i18next…) |
| `modern-web-guidance` | **Sayfa kapanış kontrolü** (aşağıda), resmî (`GoogleChrome/modern-web-guidance`) |
| `test-driven-development` | Mantık yazarken ve hata düzeltirken |
| `debugging-and-error-recovery` | Test ya da build kırıldığında |
| `performance-optimization` | Boyut bütçesi ve açılış hızı |
| `github-actions-workflow-pro` | CI hattı (T04) ve iş akışı denetimi |

### `github-actions-workflow-pro` için proje kuralı

Araç seçimi [ADR-015](../../docs/decisions/ADR-015-workflow-security-tooling.md)'tedir ve becerinin önerilerinden önce gelir: eylemler SHA yorumu yerine `actions.lock` ile sabitlenir (pinact kullanılmaz), poutine kullanılmaz. `validate.sh` bu ikisini "absent" diye bildirir, bu beklenen durumdur.

Kod incelemesi, sadeleştirme ve güvenlik incelemesi için Claude'un yerleşik `/code-review`, `/simplify` ve `/security-review` komutları kullanılır. Cloudflare becerileri `cloudflare@cloudflare` eklentisinden gelir.

## Sayfa kapanış kontrolü (mwg + WCAG 2.2 AA)

Bir sayfa "bitti" denmeden önce `modern-web-guidance` ile son kontrolden geçer. Bu kontrol aynı zamanda WCAG 2.2 AA denetimidir (ADR-013).

- **Ne zaman:** Sayfa yazıldıktan sonra, PR açılmadan önce. Sayfa yazılırken önce react-aria ve shadcn kullanılır. mwg bunların yerine geçmez, onları denetler.
- **Ne kontrol edilir:** Sayfanın kullandığı her platform özelliği için mwg araması yapılır: dialog/popover, form ve doğrulama, tablo, koyu tema, RTL ve mantıksal CSS, tarih ve saat dilimi, Core Web Vitals. Bulgular sayfaya uygulanır ya da gerekçesiyle PR'a yazılır.
- **Kanıt:** PR açıklamasında sayfa başına "mwg kontrolü" bölümü bulunur: aranan konular, uygulanan bulgular, kalan uyarılar.

## Kaynak ve lisanslar

- **`shadcn`:** `shadcn-ui/ui` deposu, revizyon `e62c9435fff729a175f38983dee73b2cb4f6a069`, MIT (`shadcn/LICENSE.md`).
- **`modern-web-guidance`:** `GoogleChrome/modern-web-guidance` deposu, revizyon `4dd968349e54ca45a05dd5c818fb035c9054b022`, Apache-2.0. CLI ve arama verisi depoya kopyalanmadı. Komutlar gerektiğinde `npx` ile çalışır, ağ erişimi ister.
- **Diğerleri:** kişisel koleksiyon, kaynak revizyonu `4d9dfe36ffbf4872dbc8a191fa5f5378a3213d8f`. Lisanslar her klasörde korunur.

Her beceri klasörü (`SKILL.md`, `agents`, `assets`, `references`, `scripts`, `LICENSE`) bir bütündür. Güncellemede sadece `SKILL.md`'yi kopyalamak yetmez.
