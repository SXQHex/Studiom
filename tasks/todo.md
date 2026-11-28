# Studiom frontend: görev listesi

Bu dosya sadece etkin işleri taşır. Biten fazlar tek satıra iner (bkz. [`docs/README.md`](../docs/README.md), kural 5).

**Standart doğrulama.** Aksi yazılmadıkça her görev için geçerlidir:

- `pnpm check`: oxlint + oxfmt --check + knip + dependency-cruiser + `tsc --noEmit` + i18next-cli + RTL sınıf denetimi
- `pnpm build`
- dokunulan modüller için `pnpm e2e --project=desktop-chromium --project=iphone-15`

**Boyut:** S = 1–2 dosya · M = 3–5 dosya. Daha büyük görevler bölünür.

---

## Faz 1: Temel

**Temel kurulum yenilendi (2026-11-28, [ADR-018](../docs/decisions/ADR-018-tech-stack.md) sırası).** T01–T05 aşağıdaki ölçütlerle yeni iskelet üzerinde yeniden sağlandı. Kullanılmayan bağımlılık knip'i kırdığı için şu paketler ilk kullanıldıkları görevde resmî komutla eklenir: Vitest (T09), `@msw/data` ve Faker (T08), Geist (T06), TanStack Form (ilk form), FullCalendar (ilk takvim görevi).

### T01: Monorepo iskeleti; taslağın referans klasörüne taşınması

- [x] pnpm workspaces + Turborepo; `apps/web`. `packages/contracts`, `packages/ui` ve `packages/mocks` boş yer tutucu bırakılmaz, ilk kullanıldıkları görevde açılır (T10, T06, T08). `.nvmrc` ve kök komutları: `dev`, `build`, `check`, `e2e` (T05'te eklendi).
- [x] Taslak `docs/reference/prototype-v2/` altına taşınır, lint, format ve knip dışında tutulur.
- [x] `pnpm build` boş bir Vite + React uygulaması üretir. Cloudflare yapılandırması `apps/web/wrangler.jsonc` dosyasındadır.

**Bağımlılık:** yok · **Boyut:** M

### T02: Strict TypeScript; lint ve format kapıları

- [x] Temel `tsconfig` tam strict olur: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`. oxlint `any`, `as any` ve örtülü any'yi yasaklar.
- [x] oxlint ve oxfmt en az FtkSaaS sıkılığında olur. knip'te sadece üretilen dosyalar için istisna tanımlanır.
- [x] `pnpm check`, bilerek eklenen bir `any` ile kırılır ve kaldırılınca geçer.

**Bağımlılık:** T01 · **Boyut:** M

### T03: dependency-cruiser katman kuralları

- [x] ADR-006'daki kurallar uygulanır: domain ↛ shells, kabuk ↛ kabuk, modül ↛ kardeş modül, döngü yok, packages ↛ apps, paketler arası yön (`mocks` → `contracts`, `contracts` bağımsız, `ui` ↛ `contracts`).
- [x] Örnek bir ihlal `pnpm check`'i kırar. Kabuk ve modül kuralları örnek dosyalarla doğrulandı. Paket kuralları, paketler açıldığında (T06, T08, T10) aynı yöntemle doğrulanır.

**Bağımlılık:** T01 · **Boyut:** S

### T04: CI hattı

- [x] GitHub Actions: kurulum → `check` → `build` → PR'da e2e (Desktop Chromium + iPhone 15). `main` ve gece çalışmalarında Playwright Docker imajıyla 4 profil + visual.
- [x] Boyut bütçesi denetimi: ilk JS ≤ 150 KB gzip.

**Bağımlılık:** T02, T03 · **Boyut:** M

### T05: Playwright altyapısı

- [x] Dört proje: `desktop-chromium`, `pixel-7`, `desktop-webkit`, `iphone-15`. Varsayılan renk şeması koyu. iPhone 15 farklı bir `timezoneId` ile koşar.
- [x] Ayrı `e2e`, `e2e-smoke`, `visual` ve `a11y` yapılandırmaları. visual saati dondurur ve sadece mock ile koşar. a11y `@axe-core/playwright` kullanır.
- [x] Her takımda bir yer tutucu test yeşil.

**Bağımlılık:** T01 · **Boyut:** M

### T06: `packages/ui` temeli, tokenlar ve keşif çalışması

- [x] Taslağın renkleri `packages/ui/src/styles/globals.css` dosyasındadır: açık, koyu, yüksek kontrast, `--success` ve `--now`. Açık temada `--destructive`, 4,5:1 için koyulaştırıldı. Yazı tipi Geist'tir.
- [x] İlkel bileşenler `shadcn add` ile eklendi: Button, Badge, Card, Input, Textarea, InputGroup, Select, Toggle, ToggleGroup, Dialog, Sheet, Table, Sonner, Tooltip, Empty. Uygulamada `toast` kullanan ilk görev `sonner` paketini `apps/web`'e ekler.
- [x] Takvim ön denemesi (2026-11-28): `@fullcalendar` shadcn kaydı React Aria tabanıyla uyumsuz (`onClick`, `disabled`, farklı `Tabs` API'si, `as any`). ADR-018 gereği FullCalendar'ın kendi teması kullanılır. Salon sütunu sonuçları T19'dadır. Tailwind'de yalnız mantıksal yardımcılar kuralını T09'daki denetim zorlar.

**Bağımlılık:** T02 · **Boyut:** M (gerekirse bölünür)

### T07: Durum bileşenleri

- [x] `StateView` (boş, hata, yetkisiz, plan dışı, bulunamadı) ve `LoadingState` (400 ms altında görünmez) `packages/ui` içindedir. Yönlendiricinin hata, bekleme ve bulunamadı ekranları bunları kullanır.
- [ ] Yetkisiz ve plan dışı metinleri, ilk kullanıldıkları görevde (T11, T12) taslaktaki "durumlar" ekranından eklenir. Kullanılmayan çeviri anahtarı `pnpm check`'i kırar.

**Bağımlılık:** T06, T09 · **Boyut:** S

### T08: Mock çekirdeği

- [ ] MSW çalışanı kuruludur (`packages/mocks`). `@msw/data` eklenir ve doğrulanır. `packages/contracts` şemalarını kabul eden genel ve tipli bir depo kurulur (varlık şemaları T10'da eklenir): seed'li faker, "şimdi"ye göre seed, yenilemede sıfırlama.
- [ ] Geliştirmede ve Playwright'ta MSW çalışanı. `?scenario=empty|error|slow|forbidden` ara katmanı.

**Bağımlılık:** T01 · **Boyut:** M

### T09: i18n temeli

- [x] i18next + react-i18next, tr ve en. Tipli kaynaklar; bilinmeyen anahtar `tsc`'yi kırar. i18next-cli ile anahtar çıkarma ve eksik anahtar kapısı.
- [ ] Tembel ad alanları.
- [ ] `dir` ve `lang` i18n'den gelir. react-aria `I18nProvider` kurulur. `formatSessionTime(utc, tz)` yardımcısı ve birim testleri yazılır (İstanbul ve Berlin yaz saati geçişi).
- [ ] RTL sınıf denetim betiği: `ml-/mr-/left-/right-` yasak.

**Bağımlılık:** T01 · **Boyut:** M

### T10: Domain tabanı ve seed veri kümesi

- [ ] `packages/contracts` içinde Zod şemaları ve uç nokta tanımları: organization, center, room, discipline, person, binding, session, booking, package-template, package, payment, debt; plan özellik adları ve limit anahtarları. `domain/` bunları içe aktarır, şema tanımlamaz.
- [ ] ADR-007'ye göre seed: Starter 97/100, Pro 150/250, Business 3 merkezde (biri Berlin) 300/1.250. Dört bağlı kişi ve adaylar dahil.
- [ ] Ekranlar arası tutarlılık testi: varlıklar arasında sayılar birbirini tutar.

**Bağımlılık:** T08 · **Boyut:** M (gerekirse varlık gruplarına bölünür)

### T11: Bağlar ve yetenek kaydı

- [ ] `domain/bindings`: mevcut kişi, bağları, son kullanılan bağ. `domain/capabilities`: MSW'den plan verisi, özellik adları, limit anahtarları. Yardımcılar: `can(feature)`, `limit(key)`, `visibleModules(binding)`.
- [ ] Starter, Pro ve Business görünürlüğü için birim testleri.

**Bağımlılık:** T10 · **Boyut:** M

### T12: Uygulama kabuk çerçevesi

- [ ] TanStack Router dosya rotaları: `platform`, `studio`, `me`, `public`, `auth`. Kabuk ve modül başına tembel yükleme, niyetle ön yükleme.
- [ ] Yerleşim: masaüstünde ikon şeridi ve modül paneli, mobilde alt çubuk ve üstte sayfa listesi. Daraltılabilir. Tema düğmesi ve bildirim zili.

**Bağımlılık:** T06, T09, T11 · **Boyut:** M

### T13: Çalışma alanı seçici

- [ ] Bağlardan Platform · Stüdyolar (merkezleriyle) · Ben listelenir. Tek bağı olan kişiye gizlenir. Son bağ hatırlanır. Platform seçilince yeniden doğrulama ekranından geçilir.

**Bağımlılık:** T12 · **Boyut:** S

### T14: Giriş yüzeyi

- [ ] Ekranlar: giriş (e-posta + parola, "Google ile devam et" ve mock "Örnek kullanıcılar" hızlı girişi), parolamı unuttum ve yeni parola, MFA, yeniden doğrulama, davet, süresi dolmuş davet, hesap silindi. Metinler taslaktan alınır.
- [ ] e2e: her örnek kullanıcı giriş yapar ve doğru kabuğa düşer.

**Bağımlılık:** T13 · **Boyut:** M

### Kontrol noktası: Faz 1

- [ ] CI'da tüm kapılar yeşil. Dört profil giriş e2e'sini koşar.
- [ ] Faz 2'ye geçmeden önce insan incelemesi: kabuk çerçevesi, seçici ve tokenlar koyu ve açık temada.

---

## Faz 2: Günlük çekirdek (Stüdyo › Merkez + Ben)

### T15: `domain/sessions`: görünümler ve sorgular

- [ ] Seans sorguları: merkeze, kişiye ve eğitmene göre.
- [ ] Görünümler: `SessionCard`, `SessionList` ve role göre eylem yuvaları olan seans detayı.
- [ ] Düzenleme kapsamlı tekrar modeli: yalnız bu / bu ve sonrakiler / tümü.

**Bağımlılık:** T10 · **Boyut:** M

### T16: `domain/bookings`: rezervasyon, iptal ve yoklama

- [ ] Rezervasyon, iptal, bekleme listesine girme (yetenekle açılır), "Kura katıl", yer seçimi, rol dengesi.
- [ ] "X aldı" kaydını tutan yoklama bileşeni.

**Bağımlılık:** T15 · **Boyut:** M

### T17: `domain/people`: liste, profil ve arama

- [ ] Arama öncelikli ve sayfalı `PersonTable`. `readOnly` kipi olan `PersonProfile`. Davet durumu.

**Bağımlılık:** T10 · **Boyut:** M

### T18: Merkez › Bugün

- [ ] Pano: şimdi çizgili zaman akışı, sıradaki seans paneli, bekleyen işler listesi. Dört durum.

**Bağımlılık:** T12, T15 · **Boyut:** M

### T19: Merkez › Program › Takvim

- [ ] Hafta ve gün takvimi; salon ve eğitmen filtreleri. Sürükleme ve boyutlandırma; klavyeyle taşıma yerine seans düzenleme formu (ADR-018). Taslak ve kaydet çubuğu.
- [ ] Koşullu seçenekleri olan seans oluşturma ve düzenleme formu (TanStack Form + Zod).
- Ön deneme bulguları (2026-11-28, Mac, salon başına 8 seans):
  - İlk çizim 3 / 6 / 10 salonda Chromium'da 123 / 146 / 158 ms, 4 kat yavaş işlemcide 393 / 469 / 545 ms, WebKit'te 189 / 179 / 203 ms. Gün değişimi 105 ms altında.
  - Salonlar arası sürükleme Chromium ve WebKit'te çalıştı. Fazla saat ekseni `slotHeaderInnerClass: "invisible !w-0 !min-w-0 !px-0 overflow-hidden"` ile gizlenir. Koyu tema `colorScheme` seçeneğiyle verilir; tema değişkenleri tokenlara bağlanmalıdır.
  - Sütunlar ekrana sığmayınca sürükleme yatayda kendiliğinden kaymıyor. Görünen salonlar çiplerle sınırlanır.
  - Ek paket yükü yaklaşık 83 KB JS + 4 KB CSS (sayfa parçası, gzip).

**Bağımlılık:** T06 keşfi, T15 · **Boyut:** M (gerekirse form T19b olarak ayrılır)

### T20: Merkez › Program › Seans detayı

- [ ] Katılımcılar, yoklama, bekleme listesi, kapasite, gerekçeli iptal.

**Bağımlılık:** T16, T19 · **Boyut:** M

### T21: Merkez › Program › Özel ders talepleri ve Bekleme listeleri

- [ ] Talep listesi: kabul et, öner, reddet.
- [ ] Bekleme listesi sayfası (Pro ve üzeri) ve süreli yer teklifi.

**Bağımlılık:** T16 · **Boyut:** M

### T22: Merkez › Kişiler › Üyeler ve üye profili

- [ ] Davet eylemleri ve filtresi olan üye listesi.
- [ ] Profil: haklar, rezervasyon ve yoklama geçmişi, borç, belgeler.

**Bağımlılık:** T17 · **Boyut:** M

### T23: Merkez › Kişiler › Gelen kutusu

- [ ] İleti listesi, detay ve arşiv. Taslaktaki boş durumlar kullanılır.

**Bağımlılık:** T12 · **Boyut:** S

### T24: `domain/packages` ve `domain/finance`

- [ ] Paket (satılmış hak) modeli: satış, yenileme, dondurma ve değişiklik (yetenekle açılır), telafi sayısı.
- [ ] Finans: ödemeler, kısmi ödeme, iade, borç düzeltme.
- [ ] İstisna sınıfındaki her işlem gerekçe ister ve bir istisna olayı üretir.

**Bağımlılık:** T10 · **Boyut:** M

### T25: Merkez › Satış › Paket fiyatları

- [ ] Bu merkezde kullanılabilen organizasyon şablonları listelenir. Satış fiyatı girilir. %15'ten fazla sapmada "istisna olarak kaydedilecek" uyarısı gösterilir.

**Bağımlılık:** T24 · **Boyut:** S

### T26: Merkez › Satış › Satışlar ve tahsilat, Borçlar

- [ ] Satış akışı (taslaktaki yan panellerden).
- [ ] Nakit, kart ve havale ile tahsilat. Kısmi ödeme. Gerekçeli iade.
- [ ] Düzeltme işlemli borç listesi.

**Bağımlılık:** T24 · **Boyut:** M

### T27: Ben › Ana sayfa

- [ ] Role göre hitap: i18next context ve günün saati.
- [ ] Sıradaki seans kartı.
- [ ] Bekleyenler: bitecek haklar, borç, belgeler, davetler. Eğitmen için ayrıca yoklama ve talepler.
- [ ] Organizasyona göre gruplu "Bu hafta" şeridi.

**Bağımlılık:** T15, T16, T24 · **Boyut:** M

### T28: Ben › Program

- [ ] Organizasyonlar arası Benimkiler / Verdiklerim / Tümü filtreleri. Stüdyo etiketleri ve filtre çipleri.
- [ ] Rezervasyon sadece o organizasyonun haklarıyla yapılır. Özel ders talebi.
- [ ] Eğitmen seans detayı: yoklama ve not. Asistanda kısıtlı.

**Bağımlılık:** T16 · **Boyut:** M

### T29: Ben › Cüzdan ve Ben › Hesabım

- [ ] Organizasyona göre gruplu cüzdan: paketler, telafi, dondurma talebi, borçlar, ödemeler ve eğitmen hakediş bölümü.
- [ ] Hesap: profil, uygunluk (eğitmen), bildirimler, Üyeliklerim (belgeler, onaylar, ayrılma).

**Bağımlılık:** T24 · **Boyut:** M

### Kontrol noktası: Faz 2

- [ ] Dört profilde akış e2e'leri:
  - Üye rezervasyon yapar → eğitmen yoklama alır → üye hakkının düştüğünü görür.
  - Satış → tahsilat → borç kapanır.
- [ ] Faz 2 sayfalarının görsel tabanları alınır. a11y koyu ve açık temada temiz.
- [ ] İnsan incelemesi.

---

## Faz 3: Yönetim (Stüdyo › Organizasyon, ekip, açık sayfa, adaylar)

### T30: Org › Tanımlar › Disiplinler, Çalışma takvimi, Şablonlar ve hatırlatmalar

- [ ] Ekleme, düzenleme ve silme sayfaları. Disiplin, seans seçeneklerinin varsayılanlarını belirler (örneğin reformer → yer seçimi açık).

**Bağımlılık:** T12 · **Boyut:** M

### T31: Org › Tanımlar › Paketler (şablonlar)

- [ ] Şablon formu: ADR-004'teki alanlar, telafi N, merkezler, önerilen fiyat, kur paketi türü.
- [ ] Sürümleme notu: değişiklikler sadece yeni satışlara uygulanır.

**Bağımlılık:** T24 · **Boyut:** M

### T32: Org › Tanımlar › Belgeler ve Politikalar

- [ ] Belge sürümleri ve yayımlama. Politikalar ve varsayılanlar. Güvenlik kuralları burada değil, T37'de.

**Bağımlılık:** T12 · **Boyut:** M

### T33: Org › Gözetim › İstisnalar

- [ ] Filtreli istisna akışı: tür, merkez, kişi, tarih. Her kayıtta kim, ne ve neden görünür.

**Bağımlılık:** T24 · **Boyut:** S

### T34: Org › Gözetim › Kişiler, Takvim, Rezervasyonlar, Finans (salt okunur)

- [ ] Domain görünümleri `readOnly` kipinde ve tek merkez filtresiyle açılır, "Tüm merkezler" yok.
- [ ] Bir kişiyi açmak erişim kaydına yazılır.

**Bağımlılık:** T17, T15, T24 · **Boyut:** M

### T35: Org › Gözetim › Raporlar ve Denetim; Merkez › Merkez › Raporlar ve Denetim

- [ ] Plana göre kademeli raporlar: temel, gelişmiş, birleşik.
- [ ] Erişim kaydı ve kullanılan bağ dahil denetim kaydı.

**Bağımlılık:** T11 · **Boyut:** M

### T36: Org › Organizasyon › Genel bakış, Profil ve marka, Merkezler

- [ ] "Kurulumu tamamla" düğmesi olan genel bakış ve kurulum sihirbazı modalı.
- [ ] Marka ve açık sayfa ayarları.
- [ ] Arşivliler dahil merkez listesi. Kota içinde yeni merkez açma ve limit diyaloğu.

**Bağımlılık:** T11 · **Boyut:** M

### T37: Org › Organizasyon › Güvenlik, Abonelik ve faturalar, Sahiplik ve kapatma

- [ ] Güvenlik (sadece sahip): MFA zorunluluğu, oturum süresi, izinli giriş yöntemleri (e-posta + parola, Google).
- [ ] Abonelik: kullanım ve limitler (org. yöneticisine salt okunur), "yükseltince neler açılır", faturalar.
- [ ] Sahiplik devrini başlatma. Önizlemeli organizasyon kapatma.

**Bağımlılık:** T11 · **Boyut:** M

### T38: Org › Organizasyon › Ekip ve atama talepleri

- [ ] Org. yöneticileri ve merkez yöneticileri. Önizleme ve devirle atama ve kaldırma.
- [ ] Org. yöneticisinin kendini ataması sahibe giden bir talebe dönüşür.

**Bağımlılık:** T11 · **Boyut:** M

### T39: Merkez › Merkez › Ekip, Salonlar, Kapanışlar, Ayarlar

- [ ] Ekip: modül anahtarları ve hazır kalıplarla eğitmen, asistan ve personel.
- [ ] Salonlar: yer seçimi için alet tanımlı.
- [ ] Kapanışlar.
- [ ] Ayarlar: IANA saat dilimi dahil.

**Bağımlılık:** T11 · **Boyut:** M

### T40: Merkez › Kişiler › Adaylar, Başvurular ve kişi birleştirme

- [ ] Organizasyondan yönlendirilen başvurular.
- [ ] Adaylar:
  - Starter'da temel takip: elle aday, not, takip tarihi.
  - Pro ve üzerinde: deneme teklifi → deneme hakkı + ayrılmış yer + davet → gerekçeli dönüştü veya kaybedildi.
- [ ] Kişi birleştirme akışı.

**Bağımlılık:** T17, T16 · **Boyut:** M

### T41: Org › Başvurular (yönlendirme)

- [ ] Başvuruyu görme, merkeze yönlendirme, kapatma. Seans seçildiyse otomatik yönlendirme.

**Bağımlılık:** T40 · **Boyut:** S

### T42: Açık yüzey

- [ ] `/s/$slug` sayfasında şunlar bulunur:
  - program
  - paketler (merkez bazında satış fiyatlarıyla)
  - hakkında
  - merkez filtresi
  - onay alanlı "Deneme dersi iste" / "Bilgi al" formu ve başarı durumu
  - yayında değil durumu
  - "Giriş yap" bağlantısı

  Rezervasyon düğmesi yoktur.

- [ ] e2e: ziyaretçi başvurur → organizasyon yönlendirir → merkez deneme teklif eder → davet kabul edilir → seans Ben kabuğunda görünür.

**Bağımlılık:** T41 · **Boyut:** M

### Kontrol noktası: Faz 3

- [ ] Aday akışı e2e'si dört profilde geçer.
- [ ] Her plan için plan kapısı e2e'si geçer.
- [ ] visual ve a11y geçer.
- [ ] İnsan incelemesi.

---

## Faz 4: Platform

### T43: Platform › Genel bakış ve Kiracılar

- [ ] Genel bakış göstergeleri.
- [ ] Organizasyon listesi ve detayı: merkezler, plan, kullanım, notlar. Denemeler. Askıdakiler.
- [ ] "Organizasyon oluştur ve sahibini davet et" akışı.

**Bağımlılık:** T11 · **Boyut:** M

### T44: Platform › Abonelik › Planlar ve fiyatlar

- [ ] Limit, fiyat ve özellik anahtarlarını düzenleme (sadece Sahip). Etki önizlemeli sürümleme.

**Bağımlılık:** T11 · **Boyut:** M

### T45: Platform › Abonelik › Abonelikler

- [ ] Liste ve detay. Plan değişikliği (sadece Sahip). Deneme süresini uzatma.

**Bağımlılık:** T44 · **Boyut:** S

### T46: Destek kipi

- [ ] Platform › Destek › Talepler ve Destek oturumları kaydı.
- [ ] Gerekçeyle "destek olarak aç" → üst şeritli salt okunur Stüdyo kabuğu. Şeritte ad, geri sayım ve çıkış bulunur.
- [ ] Yazma yetkisine yükseltme (Sahip). Giriş kiracının denetim kaydında görünür.

**Bağımlılık:** T43, T35 · **Boyut:** M

### T47: Platform › Destek › Duyurular; Sistem › Platform ekibi, Denetim, Ayarlar

- [ ] Duyurular. Platform ekibi (sadece Sahip). Platform denetim kaydı. Ayarlar.

**Bağımlılık:** T43 · **Boyut:** M

### T48: Yardım sayfası

- [ ] Her kabuğun alt bağlantısından açılan ortak yardım sayfası.

**Bağımlılık:** T12 · **Boyut:** S

### Kontrol noktası: Faz 4

- [ ] Destek kipi ve plan düzenleme e2e'leri geçer.
- [ ] visual ve a11y geçer.
- [ ] İnsan incelemesi.

---

## Faz 5: Ağır ve az kullanılan modüller, sürüm hazırlığı

### T49: Merkez › Program › Etkinlikler

- [ ] Etkinlik ve atölye yaşam döngüsü (Pro ve üzeri). Açık etkinlik akışı.

**Bağımlılık:** T42 · **Boyut:** M

### T50: Merkez › Satış › Hakediş ve Ben hakediş detayı

- [ ] Eğitmen anlaşmaları, dönem hesabı, ödemeler. Ben cüzdanında hakediş.

**Bağımlılık:** T24 · **Boyut:** M

### T51: Merkez › Satış › Mutabakat (Business)

- [ ] Merkezler arası kullanım hareketleri, talepler, kararlar. Yetki devrinin gösterimi.

**Bağımlılık:** T24, T38 · **Boyut:** M

### T52: Org › Tanımlar › Otomasyon ve segmentler (Pro ve üzeri)

- [ ] Segment kurucusu, otomasyon tanımları, kampanya ve indirim tanımları.

**Bağımlılık:** T40 · **Boyut:** M

### T53: Platform › Abonelik › Faturalar ve iadeler

- [ ] Fatura yükleme ve yayımlama. Ödeme doğrulama. Ek süre. İadeler (sadece Sahip).

**Bağımlılık:** T45 · **Boyut:** M

### T54: Tam matris sağlamlaştırma

- [ ] Her senaryo için dört profil yeşil.
- [ ] en, açık tema ve RTL'de smoke testleri.
- [ ] Her sayfa × 4 durum için görsel kapsam.
- [ ] Koyu ve açık temada a11y.
- [ ] Boyut bütçesi.

**Bağımlılık:** T49–T53 · **Boyut:** M

### T55: Elle sürüm kontrol listesi

- [ ] Ana akışlar gerçek Safari'de (macOS) ve iOS Simulator'da baştan sona elle denenir. Bulgular düzeltilir ya da kayda geçirilir.

**Bağımlılık:** T54 · **Boyut:** S

### Kontrol noktası: Tamamlandı

- [ ] `tasks/plan.md` içindeki "bitti" tanımı karşılandı. İnsan onayı alındı.
