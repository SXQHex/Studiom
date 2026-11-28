# Uygulama planı: Studiom frontend çizimi

## Genel bakış

Studiom, dans, yoga ve pilates için çok kiracılı bir platform. Bu planın amacı, platformun frontend'ini herhangi bir backend işinden önce eksiksiz çizmek. Çizim, tutarlı mock veri üzerinde çalışan statik bir SPA olacak ve şunları kapsayacak:

- oturum açılmış üç kabuk (Platform, Stüdyo, Ben) ve oturumsuz açık yüzey
- kabul edilen menüler
- her sayfanın dört durumu
- uçtan uca tıklanabilir akışlar
- tr ve en dil desteği
- koyu, açık ve yüksek kontrast temalar
- RTL hazırlığı
- dört Playwright profili

`docs/reference/prototype-v2/` altındaki taslak görsel ve içerik referansıdır (`docs/reference/prototype-map.md`).

## Onaylanan niyet

- **Sonuç:** Tüm kabuklar ve kabul edilen menüler mock veri üzerinde uçtan uca çizilmiş ve test edilmiş olur. Taslak sadece başlangıç noktasıdır.
- **Kullanıcı:**
  - platform, organizasyon ve merkez rolleri
  - eğitmen ve asistan
  - stüdyo kullanıcısı
  - ziyaretçi

  Tek hesap, çok bağ.

- **Başarı:** aşağıdaki "bitti" tanımı.
- **Kısıtlar:**
  - Backend yok.
  - Arayüz react-aria üzerinde shadcn.
  - oxlint, oxfmt, knip ve dependency-cruiser esnetilmez.
  - TypeScript tam strict, `any` yok.
  - Kod İngilizce, md belgeleri Türkçe.
- **Kapsam dışı:**
  - gerçek API ve kimlik doğrulama
  - online ödeme
  - açık sayfa SEO ve SSR
  - tr ve en dışındaki diller
  - indirim eşiği onayı

## Mimari kararlar

Tüm kararlar ADR'lerde tutulur. Dizin [`docs/README.md`](../docs/README.md) içinde.

## "Bitti" tanımı (proje geneli)

- Kabul edilen menülerdeki her sayfa var ve dolu, boş, yükleniyor ve hata durumlarıyla çizilmiş. Gerektiği yerde yetkisiz ve plan dışı durumları da var.
- Ana akışlar uçtan uca tıklanabilir. Mock değişiklikleri oturum boyunca kalır, sayfa yenilenince sıfırlanır.
- Mock veri ADR-007'ye uyar.
- i18n tr ve en ile çalışır.
- Koyu, açık ve yüksek kontrast temalar çalışır. Tüm uygulama klavyeyle kullanılabilir. Uygulama RTL'e hazırdır.
- e2e takımı elle tetiklenebilen tüm sayfa ve eylem senaryolarını dört profilde kapsar.
- visual, a11y ve smoke takımları ADR-009'daki gibi geçer.
- Her sayfa WCAG 2.2 AA'yı karşılar ve `modern-web-guidance` kapanış kontrolünden geçer (ADR-013).
- oxlint, oxfmt, knip, dependency-cruiser, `tsc` strict, i18next-cli, RTL sınıf denetimi ve boyut bütçesi temizdir.

## Fazlar ve görev dizini

Kabul ölçütleri ve doğrulamalarıyla ayrıntılı görevler `tasks/todo.md` içindedir.

| Faz                               | Hedef                                                                                                                     | Görevler |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1. Temel                          | Depo, araçlar ve CI kapıları; ui ve tokenlar; i18n; MSW ve seed; bağlar ve yetenekler; kabuk iskeletleri; giriş ve seçici | T01–T14  |
| 2. Günlük çekirdek                | Stüdyo › Merkez (Bugün, Program, Kişiler, Satış) ve Ben kabuğu                                                            | T15–T29  |
| 3. Yönetim                        | Stüdyo › Organizasyon; ekip ve yetkiler; açık sayfa ve aday akışı; istisnalar ve gözetim                                  | T30–T42  |
| 4. Platform                       | Kiracılar, planlar ve fiyatlar, destek kipi, platform ekibi                                                               | T43–T48  |
| 5. Ağır ve az kullanılan modüller | Mutabakat, otomasyon ve segment kurucusu, etkinlikler, platform faturaları ve iadeler; sürüm kontrolleri                  | T49–T55  |

Her faz bir kontrol noktasıyla biter. Kontrol noktasında tüm kapılar yeşil olmalı, fazın e2e ve visual takımları geçmeli ve sonraki faza başlamadan önce insan incelemesi yapılmalıdır.

## Paralel çalışma

- Faz 1 büyük ölçüde sıralıdır, çünkü T01–T05 diğer tüm işlerin önünü açar.
- Faz 2–4'te sadece `domain/*` paylaşan modüller, ilgili domain varlığı hazır olduktan sonra paralel yürüyebilir. Örneğin T17'den sonra Satış ve Kişiler.
- Domain varlıkları (`domain/*`), onları kullanan modüllerden önce bitmelidir.

## Riskler ve önlemler

| Risk                                                                                          | Etki   | Önlem                                                                                                             |
| --------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------- |
| react-aria + shadcn bileşen boşlukları (örneğin haftalık takvimde sürükleme ve boyutlandırma) | Yüksek | T06'da keşif çalışması yapılır. Takvim react-aria hook'ları üzerine kurulur, taslaktaki etkileşim tarifi korunur. |
| `@mswjs/data` bakım durumu                                                                    | Orta   | T08'de doğrulanır. Gerekirse küçük bir tipli depo yazılır.                                                        |
| Üretilen rota ağacı ve i18n tipleriyle oxlint, knip ve dependency-cruiser sürtünmesi          | Orta   | Sadece üretilen dosyalar için istisna tanımlanır. Kurallar asla esnetilmez.                                       |
| WebKit görsel yanlış alarmları                                                                | Orta   | Tabanlar sadece CI Docker'ında üretilir. Yazı tipleri kendi sunucumuzdan gelir. Animasyonlar kapatılır.           |
| Kapsam büyüklüğü (~80 sayfa × 4 durum)                                                        | Yüksek | Kabuklar arası ortak domain görünümleri kullanılır. Durumlar senaryo ile üretilir. Faz kontrol noktaları konur.   |
| Çalışma anında düzenlenebilen plan verisinin kapı mantığını karmaşıklaştırması                | Orta   | Tek yetenek kaydı kullanılır ve her kapı ondan geçer. Her plan için e2e kapı testleri yazılır.                    |

## Açık sorular

- Şu an yok.

## Kapanan sorular

- 2026-11-28: Önizleme ve yayın Cloudflare'de, adres `studiom.fethiyetango.com` (ADR-011).
- 2026-11-28: Google ile giriş şimdi çizilecek (ADR-004).
- 2026-11-28: Taslak T01'de `docs/reference/prototype-v2/` altına taşınacak.
