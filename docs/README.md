# Belge haritası

Bu dosya, depodaki belgelerin tek girişidir. Her bilgi **tek bir yerde** yaşar, diğer yerler oraya bağlantı verir.

## Hangi bilgi nerede (SSoT)

| Konu                                                         | Tek kaynak                                                      | Sahip olduğu şey                       |
| ------------------------------------------------------------ | --------------------------------------------------------------- | -------------------------------------- |
| Hak ve kullanım bildirimi                                    | [`README.md`](../README.md)                                     | Telif ve otomatik erişim yasağı        |
| Niyet, kapsam, "bitti" tanımı, fazlar, riskler, açık sorular | [`tasks/plan.md`](../tasks/plan.md)                             | Neyi neden yaptığımız                  |
| Görevler, kabul ölçütleri, kontrol noktaları                 | [`tasks/todo.md`](../tasks/todo.md)                             | Sıradaki iş                            |
| Mimari ve ürün kararları                                     | [`docs/decisions/`](decisions/) (ADR)                           | Bir karar, gerekçesi ve alternatifleri |
| Taslak ekran → yeni yer eşlemesi                             | [`docs/reference/prototype-map.md`](reference/prototype-map.md) | Taslaktan neyin nereye gittiği         |
| Taslağın kendisi                                             | `docs/reference/prototype-v2/`                                  | Görsel ve metin referansı, salt okunur |
| Ajan becerileri ve sayfa kapanış kontrolü                    | [`.agents/skills/README.md`](../.agents/skills/README.md)       | Hangi beceri ne zaman kullanılır       |

## ADR dizini

| No                                                         | Konu                                              |
| ---------------------------------------------------------- | ------------------------------------------------- |
| [001](decisions/ADR-001-shell-and-binding-model.md)        | Oturum açılmış üç kabuk ve bağ modeli             |
| [002](decisions/ADR-002-navigation-rules.md)               | Gezinme kuralları ve kabul edilen menüler         |
| [003](decisions/ADR-003-permission-model.md)               | Yetki modeli                                      |
| [004](decisions/ADR-004-domain-model-decisions.md)         | Alan modeli: seans, paket, aday, giriş ve kurulum |
| [005](decisions/ADR-005-frontend-stack-and-hosting.md)     | Frontend yığını ve yayın                          |
| [006](decisions/ADR-006-code-architecture.md)              | Kod mimarisi ve sınırlar                          |
| [007](decisions/ADR-007-mock-layer.md)                     | Mock katmanı ve örnek veri                        |
| [008](decisions/ADR-008-i18n-time-and-rtl.md)              | i18n, saat dilimi ve RTL                          |
| [009](decisions/ADR-009-testing-and-quality-gates.md)      | Test stratejisi ve kalite kapıları                |
| [010](decisions/ADR-010-plan-capabilities-as-data.md)      | Veri olarak plan yetenekleri                      |
| [011](decisions/ADR-011-preview-and-hosting-cloudflare.md) | Önizleme ve yayın için Cloudflare                 |
| [012](decisions/ADR-012-version-policy.md)                 | Sürüm politikası                                  |
| [013](decisions/ADR-013-page-closing-check-wcag22.md)      | Sayfa kapanış kontrolü ve WCAG 2.2 AA             |
| [014](decisions/ADR-014-visual-baseline-approval.md)       | Görsel taban onay akışı                           |
| [015](decisions/ADR-015-workflow-security-tooling.md)      | İş akışı güvenliği ve denetim araçları            |

## Belge kuralları

1. **Tekrar yok, bağlantı var.** Bir bilgi başka bir belgede gerekiyorsa kopyalanmaz, kaynağına bağlantı verilir. Bağlam için tek cümlelik bir özet serbesttir.
2. **Yeni dosya sadece yeni bir konu için açılır.** Önce yukarıdaki tabloya bakılır. Konunun bir sahibi varsa o dosyaya yazılır. Yeni bir konuysa tabloya bir satır eklenir.
3. **Boyut sınırı:**
   - Bir belge ~300 satırı geçmez.
   - Geçecekse konuya göre bölünür ve bu tabloya eklenir. Bölümlere göre bölünmez.
   - ADR'ler tek karar taşır ve kısa kalır.
4. **ADR'ler değiştirilmez.** Bir karar değişirse yeni bir ADR yazılır, eskisinin durumu "X ile geçersiz" yapılır. Yazım düzeltmesi serbesttir.
5. **`tasks/todo.md` sadece etkin işleri taşır.** Biten bir fazın görevleri tek satıra indirilir: faz adı, tamamlanma tarihi, PR bağlantısı. Ayrıntı git geçmişinde ve PR'da kalır. Böylece dosya büyümez. Başlangıçta tüm fazları taşıdığı için 300 satır sınırını biraz aşar, ama Faz 1 bitince sınırın altına iner.
6. **Dil:** Belgeler Türkçe yazılır. Kod, tanımlayıcılar ve yollar İngilizce yazılır.
