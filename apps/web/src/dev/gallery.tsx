import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Cell,
  Column,
  Dialog,
  DialogClose,
  DialogTrigger,
  EmptyState,
  ErrorState,
  ForbiddenState,
  LoadingState,
  NotFoundState,
  OutOfPlanState,
  Row,
  Segment,
  SegmentItem,
  Select,
  SelectItem,
  Sheet,
  Table,
  TableBody,
  TableHeader,
  TextField,
  ToastHost,
  Tooltip,
  TooltipTrigger,
  WeekCalendar,
  toast,
  type CalendarEvent,
} from "@studiom/ui";
import { useState } from "react";
import { I18nProvider } from "react-aria-components";

const days = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;
const dayLong = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
] as const;

function setAttr(name: string, value: string | null) {
  if (value === null) document.documentElement.removeAttribute(name);
  else document.documentElement.setAttribute(name, value);
}

const hhmm = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

const initialEvents: CalendarEvent[] = [
  { id: "e1", title: "Salsa orta", day: 0, start: 18 * 60, duration: 60 },
  { id: "e2", title: "Reformer pilates", day: 2, start: 9 * 60, duration: 45 },
  { id: "e3", title: "Yin yoga", day: 4, start: 19 * 60, duration: 75 },
];

export default function Gallery() {
  const [locale, setLocale] = useState("tr-TR");
  const [events, setEvents] = useState(initialEvents);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <I18nProvider locale={locale}>
      <div className="mx-auto grid max-w-5xl gap-8 p-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Studiom UI galerisi</h1>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onPress={() => setAttr("data-theme", "light")}>
              Açık
            </Button>
            <Button variant="outline" size="sm" onPress={() => setAttr("data-theme", "dark")}>
              Koyu
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() =>
                setAttr(
                  "data-contrast",
                  document.documentElement.dataset["contrast"] ? null : "high",
                )
              }
            >
              Yüksek kontrast
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => {
                const rtl = document.documentElement.dir !== "rtl";
                document.documentElement.dir = rtl ? "rtl" : "ltr";
                setLocale(rtl ? "ar-EG" : "tr-TR");
              }}
            >
              RTL
            </Button>
          </div>
        </header>

        <section aria-labelledby="g-basic" className="grid gap-4">
          <h2 id="g-basic" className="text-lg font-semibold">
            Temel bileşenler
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Button>Kaydet</Button>
            <Button variant="secondary">İkincil</Button>
            <Button variant="outline">Çerçeveli</Button>
            <Button variant="ghost">Hayalet</Button>
            <Button variant="destructive">Sil</Button>
            <Button variant="link">Bağlantı</Button>
            <Button isDisabled>Kapalı</Button>
            <Badge>Aktif</Badge>
            <Badge variant="secondary">Beklemede</Badge>
            <Badge variant="outline">Taslak</Badge>
            <Badge variant="success">Ödendi</Badge>
            <Badge variant="destructive">Borç</Badge>
            <TooltipTrigger>
              <Button variant="outline" size="icon" aria-label="Bilgi">
                i
              </Button>
              <Tooltip>Kapasite 12 kişi</Tooltip>
            </TooltipTrigger>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Ad soyad"
              description="Üye kartında görünür."
              placeholder="Elif Kara"
            />
            <TextField
              label="E-posta"
              type="email"
              isInvalid
              errorMessage="Geçerli bir e-posta gir."
            />
            <Select label="Salon" placeholder="Salon seç">
              <SelectItem id="a">Salon A</SelectItem>
              <SelectItem id="b">Salon B</SelectItem>
              <SelectItem id="r">Reformer odası</SelectItem>
            </Select>
            <div className="grid content-start gap-2">
              <span className="text-sm font-medium" id="seg-l">
                Görünüm
              </span>
              <Segment aria-labelledby="seg-l" defaultSelectedKeys={["week"]}>
                <SegmentItem id="day">Gün</SegmentItem>
                <SegmentItem id="week">Hafta</SegmentItem>
              </Segment>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Bugünkü seanslar</CardTitle>
              <CardDescription>3 seans, 28 katılımcı</CardDescription>
            </CardHeader>
            <CardContent>
              <Table aria-label="Üyeler" selectionMode="single">
                <TableHeader>
                  <Column isRowHeader>Üye</Column>
                  <Column>Hak</Column>
                  <Column>Durum</Column>
                </TableHeader>
                <TableBody>
                  <Row id="1">
                    <Cell>Elif Kara</Cell>
                    <Cell className="tabular-nums">6 / 10</Cell>
                    <Cell>
                      <Badge variant="success">Aktif</Badge>
                    </Cell>
                  </Row>
                  <Row id="2">
                    <Cell>Mert Aydın</Cell>
                    <Cell className="tabular-nums">0 / 8</Cell>
                    <Cell>
                      <Badge variant="destructive">Borç</Badge>
                    </Cell>
                  </Row>
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="gap-2">
              <DialogTrigger>
                <Button variant="outline">Diyalog aç</Button>
                <Dialog
                  title="Seansı iptal et"
                  description="12 üyeye e-posta gider."
                  closeLabel="Kapat"
                  footer={
                    <>
                      <DialogClose variant="outline">Vazgeç</DialogClose>
                      <DialogClose variant="destructive">İptal et</DialogClose>
                    </>
                  }
                >
                  İptal nedeni kayda geçer.
                </Dialog>
              </DialogTrigger>
              <Button variant="outline" onPress={() => setSheetOpen(true)}>
                Yan panel aç
              </Button>
              <DialogTrigger isOpen={sheetOpen} onOpenChange={setSheetOpen}>
                <span />
                <Sheet title="Üye ayrıntısı" closeLabel="Kapat">
                  Elif Kara, 6 hak kaldı.
                </Sheet>
              </DialogTrigger>
              <Button
                onPress={() => toast({ title: "Kaydedildi", description: "Değişiklik uygulandı." })}
              >
                Toast göster
              </Button>
              <Button
                variant="destructive"
                onPress={() => toast({ title: "Kaydedilemedi", tone: "error" })}
              >
                Hata toast
              </Button>
            </CardFooter>
          </Card>
        </section>

        <section aria-labelledby="g-states" className="grid gap-4">
          <h2 id="g-states" className="text-lg font-semibold">
            Durum bileşenleri
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <LoadingState label="Yükleniyor" />
            </Card>
            <Card>
              <EmptyState
                headingLevel={3}
                title="Henüz üye yok"
                description="İlk üyeni davet et ya da üye listeni CSV ile içe aktar."
                actions={<Button size="sm">Üye davet et</Button>}
              />
            </Card>
            <Card>
              <EmptyState
                filtered
                headingLevel={3}
                title="Bu filtreye uyan kayıt yok"
                description="Filtreleri değiştir ya da temizle."
                actions={
                  <Button size="sm" variant="outline">
                    Filtreleri temizle
                  </Button>
                }
              />
            </Card>
            <Card>
              <ErrorState
                headingLevel={3}
                title="Liste yüklenemedi"
                description="Sunucuya ulaşılamadı. Girdiğin hiçbir şey kaybolmadı."
                code="İşlem kimliği OP-7F3A-21"
                actions={
                  <Button size="sm" variant="outline">
                    Tekrar dene
                  </Button>
                }
              />
            </Card>
            <Card>
              <ForbiddenState
                headingLevel={3}
                title="Bu sayfaya erişimin yok"
                description="Eğitmen rolünde Finans sayfası yok."
                actions={<Button size="sm">Bugünkü derslerime dön</Button>}
              />
            </Card>
            <Card>
              <OutOfPlanState
                headingLevel={3}
                title="Bekleme listeleri mevcut planında yok"
                description="Bu özellik Pro planından itibaren açılır."
                actions={<Button size="sm">Planı yükselt</Button>}
              />
            </Card>
            <Card>
              <NotFoundState
                headingLevel={3}
                title="Sayfa bulunamadı"
                description="Bağlantı eski ya da yanlış olabilir."
                actions={<Button size="sm">Genel bakışa dön</Button>}
              />
            </Card>
          </div>
        </section>

        <section aria-labelledby="g-cal" className="grid gap-4">
          <h2 id="g-cal" className="text-lg font-semibold">
            Haftalık takvim (spike)
          </h2>
          <Card className="p-2">
            <WeekCalendar
              events={events}
              dayLabels={days}
              label="Haftalık program"
              hint="Taşımak için Shift ile ok tuşlarına, süreyi değiştirmek için Alt, Shift ve yukarı ya da aşağı oka bas. Ayrıntı için Enter."
              describeDay={(e) => dayLong[e.day] ?? ""}
              describeChange={(e, n) =>
                `${e.title}: ${dayLong[n.day] ?? ""} ${hhmm(n.start)} - ${hhmm(n.start + n.duration)}`
              }
              onSlotChange={(id, slot) =>
                setEvents((list) => list.map((e) => (e.id === id ? { ...e, ...slot } : e)))
              }
              onOpen={(id) => toast({ title: "Seans formu", description: `Düzenle: ${id}` })}
            />
          </Card>
        </section>
      </div>
      <ToastHost closeLabel="Kapat" regionLabel="Bildirimler" />
    </I18nProvider>
  );
}
