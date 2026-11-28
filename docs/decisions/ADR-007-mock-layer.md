# ADR-007: Mock katmanı ve örnek veri

## Durum
Kabul edildi

## Tarih
2026-11-28

## Bağlam
Çizim, tutarlı mock veri ve tıklanabilir akışlarla bitmeli. Backend geldiğinde ekranlar ve sorgular değişmemeli, CI testleri gerçek backend üzerinde de geçmeye devam etmeli.

## Karar
- **MSW** tarayıcıda ve Playwright'ta çalışır. Uygulama gerçek `fetch` çağrıları yapar, işleyiciler bunları yanıtlar. İleride tek değişiklik MSW'yi kapatmak olur.
- **Tipli bellek içi depo** `packages/mocks` içinde durur.
  - Seed'li `@faker-js/faker` ile üretilir ve domain Zod şemalarıyla doğrulanır.
  - Değişiklikler oturum boyunca kalır, sayfa yenilenince seed'e dönülür.
  - Kurulumda güncelse `@mswjs/data` kullanılır, değilse küçük bir tipli depo yazılır.
- **Seed "şimdi"ye göre üretilir**, sabit bir tarihe bağlanmaz. Örnekler: "bugün 18:30 salsa", "3 gün sonra biten paket".
- **Senaryo parametresi:** `?scenario=empty|error|slow|forbidden`. Her sayfanın durumları özel kurgu gerekmeden açılır.
- **Hızlı kişi girişi:**
  - Mock kipinde giriş sayfası "Örnek kullanıcılar" listesini gösterir: platform sahibi, Pro sahibi, bir merkez yöneticisi, eğitmen, üye…
  - Aynı liste Playwright fixture'ı olarak kullanılır.
  - Ayrı bir geliştirici paneli yoktur.
- **Veri kümesi:**
  - 1 platform
  - **Starter** (yoga): 1 merkez, **97/100** öğrenci
  - **Pro** (dans + reformer): 1 merkez, 3 salon, **150/250** öğrenci
  - **Business** (dans, yoga, pilates): 3 merkez, biri `Europe/Berlin`; **300/1.250** öğrenci
  - Bunlara ek olarak eğitmenler, personel ve adaylar.
  - Dört bağlı bir kişi vardır: platform sahibi, org. sahibi, merkez yöneticisi, eğitmen.

## Değerlendirilen alternatifler
- **`queryFn` içinde async mock fonksiyonları:** Reddedildi. Backend'e geçiş her sorguya dokunmayı gerektirirdi.
- **Sabit tarihli seed ve her yerde dondurulmuş saat:** Reddedildi. Testler gerçek backend'de kırılırdı.
- **Kişi, senaryo ve zaman için geliştirici paneli:** Reddedildi. Hızlı kişi girişi ve URL senaryosu aynı işi daha düşük maliyetle görüyor.

## Sonuçlar
- Görsel testler saati sadece mock'a özel görsel takımda dondurur (ADR-009).
