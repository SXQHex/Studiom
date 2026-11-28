# ADR-008: Uluslararasılaştırma, saat dilimi ve RTL

## Durum

Kabul edildi

## Tarih

2026-11-28

## Bağlam

Arayüz şimdiden tr ve en ile çıkmalı, yeni diller sadece locale dosyası eklenerek gelebilmeli. Merkezler farklı saat dilimlerinde olabilir. RTL belki hiç gerekmeyecek, ama ani bir ihtiyaçta tüm ekranları yeniden elden geçirmek istemiyoruz.

## Karar

- **i18next + react-i18next** kullanılır.
  - Kaynaklar tiplidir (`CustomTypeOptions`), bilinmeyen anahtar tip denetiminde hata verir.
  - Anahtar çıkarma ve eksik anahtar denetimi **i18next-cli** ile yapılır ve CI kapısıdır.
  - Her modül tembel yüklenen bir ad alanıdır.
  - Diller **tr** ve **en**.
- Role göre değişen metinler i18next **context** ile çözülür. Örneğin `greeting_morning_instructor` → "Günaydın {{name}} Hocam". en'de düz metin tekrarlanabilir.
- **Yerel ayar ≠ saat dilimi.**
  - Biçimlendirme `Intl` ve react-aria ile yapılır (`I18nProvider`, `@internationalized/date`, `DateFormatter`).
  - Hangi saatin gösterileceği bir ürün kuralıdır. Seans saatleri UTC tutulur ve tek bir yardımcıyla **merkezin IANA diliminde** gösterilir: `formatSessionTime(utc, center.timeZone)`.
  - Cihaz dilimi farklıysa Ben kabuğunda kısa bir dilim etiketi gösterilir.
  - Sabit ofset (`+3`) asla kullanılmaz.
- **Baştan RTL'e hazır:**
  - `<html dir lang>` değerleri `i18n.dir(lng)`'den gelir.
  - react-aria klavyeyi ve açılır katmanları aynalar.
  - **Sadece mantıksal CSS** kullanılır (`ms-/me-/ps-/pe-/start-/end-`). `ml-/mr-/left-/right-` sınıflarını yasaklayan bir CI denetimi vardır.
  - Yönlü ikonlar aynalanır.
  - Şimdilik RTL dil çıkmaz.

## Değerlendirilen alternatifler

- **Paraglide JS:** Derleme anında güçlü tip güvenliği sunuyor. Kullanıcı ekosistem genişliği için, tip güvenliği ve yerelleştirme modülleriyle birlikte i18next'i seçti.
- **Lingui:** Makro ve çıkarma kurulum maliyeti var.

## Sonuçlar

- Yeni dil eklemek `locales/<dil>/` eklemek demektir.
- RTL örnekleri görsel ve duman testleriyle kapsanır (ADR-009).
