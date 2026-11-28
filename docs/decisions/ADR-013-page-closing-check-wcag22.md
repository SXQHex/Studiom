# ADR-013: Sayfa kapanış kontrolü ve WCAG 2.2 AA

## Durum

Kabul edildi. ADR-009'u tamamlar.

## Tarih

2026-11-28

## Bağlam

ADR-009 her sayfayı axe ile tarar ama hedef erişilebilirlik seviyesini adıyla koymaz. Otomatik tarama WCAG ölçütlerinin ancak bir kısmını yakalar. Web platformu da hızla değişiyor ve eğitim verisindeki kalıplar eskiyebiliyor.

## Karar

- **Hedef seviye: WCAG 2.2 AA.** axe taraması `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` etiketleriyle çalışır ve ihlal sıfır olmalıdır.
- **Sayfa kapanış kontrolü:** Bir sayfa "bitti" sayılmadan önce `modern-web-guidance` (mwg) becerisiyle son kontrolden geçer. Bu kontrol, otomatik taramanın yakalayamadığı WCAG 2.2 AA ölçütlerini de kapsar:
  - odak görünürlüğü ve odağın gizlenmemesi
  - en az 24×24 px hedef boyutu
  - sürükleme hareketlerine alternatif (özellikle takvimde)
  - tutarlı yardım
  - gereksiz yeniden giriş istenmemesi
  - erişilebilir kimlik doğrulama
- **Yöntem ve kanıt:** [`.agents/skills/README.md`](../../.agents/skills/README.md), "Sayfa kapanış kontrolü" bölümü. PR açıklamasında sayfa başına bir "mwg kontrolü" bölümü bulunur.
- mwg, react-aria ve shadcn'in yerine geçmez. Onların bıraktığı boşlukları ve yanlış kullanımı denetler.

## Sonuçlar

- `tasks/plan.md` içindeki "bitti" tanımına "WCAG 2.2 AA ve mwg kapanış kontrolü" maddesi eklenir.
- Takvimdeki sürükle-bırak için klavye ve tek dokunuşla alternatif zaten planda (T19). Bu ADR onu zorunlu kılar.
