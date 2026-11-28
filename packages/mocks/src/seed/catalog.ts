import type { Plan } from "@workspace/contracts/plan"
import type { Currency } from "@workspace/contracts/primitives"
import type { StaffModule } from "@workspace/contracts/person"

/**
 * The fixed part of the mock world (ADR-007): plans, tenants, centers, rooms, disciplines,
 * templates, weekly schedules and the named people. Members, packages, sessions and
 * bookings are generated from it relative to "now" (see generate.ts).
 */

const tl = (lira: number) => ({
  amountMinor: lira * 100,
  currency: "TRY" as const,
})

export const plans: Plan[] = [
  {
    id: "starter",
    version: 1,
    name: "Starter",
    limits: {
      centers: { kind: "limited", max: 1 },
      rooms: { kind: "limited", max: 1 },
      disciplines: { kind: "limited", max: 1 },
      instructors: { kind: "limited", max: 1 },
      activeStudents: { kind: "limited", max: 100 },
    },
    features: [],
    priceMonthly: tl(3_000),
    priceYearly: tl(30_000),
  },
  {
    id: "pro",
    version: 1,
    name: "Pro",
    limits: {
      centers: { kind: "limited", max: 1 },
      rooms: { kind: "unlimited" },
      disciplines: { kind: "unlimited" },
      instructors: { kind: "unlimited" },
      activeStudents: { kind: "limited", max: 250 },
    },
    features: [
      "waitlist",
      "freeze",
      "payroll",
      "events",
      "advancedCrm",
      "automation",
      "emailNotifications",
      "reminders",
      "advancedReports",
      "staffPermissions",
    ],
    priceMonthly: tl(10_000),
    priceYearly: tl(100_000),
  },
  {
    id: "business",
    version: 1,
    name: "Business",
    limits: {
      centers: { kind: "limited", max: 5 },
      rooms: { kind: "unlimited" },
      disciplines: { kind: "unlimited" },
      instructors: { kind: "unlimited" },
      activeStudents: { kind: "limited", max: 1_250 },
    },
    features: [
      "waitlist",
      "freeze",
      "payroll",
      "events",
      "advancedCrm",
      "automation",
      "emailNotifications",
      "reminders",
      "advancedReports",
      "consolidatedReports",
      "settlement",
      "staffPermissions",
    ],
    priceMonthly: tl(20_000),
    priceYearly: tl(200_000),
  },
]

export interface NamedPerson {
  id: string
  firstName: string
  lastName: string
  locale: "tr" | "en"
}

/** People the screens and the sample sign-in list refer to by name. */
export const people = {
  deniz: {
    id: "per_deniz",
    firstName: "Deniz",
    lastName: "Aydın",
    locale: "tr",
  },
  selin: { id: "per_selin", firstName: "Selin", lastName: "Koç", locale: "tr" },
  ayse: { id: "per_ayse", firstName: "Ayşe", lastName: "Demir", locale: "tr" },
  mert: { id: "per_mert", firstName: "Mert", lastName: "Yılmaz", locale: "tr" },
  zeynep: {
    id: "per_zeynep",
    firstName: "Zeynep",
    lastName: "Arslan",
    locale: "tr",
  },
  can: { id: "per_can", firstName: "Can", lastName: "Öztürk", locale: "tr" },
  elif: { id: "per_elif", firstName: "Elif", lastName: "Kaya", locale: "tr" },
  burak: {
    id: "per_burak",
    firstName: "Burak",
    lastName: "Çelik",
    locale: "tr",
  },
  ipek: { id: "per_ipek", firstName: "İpek", lastName: "Şen", locale: "tr" },
  ozan: { id: "per_ozan", firstName: "Ozan", lastName: "Güneş", locale: "tr" },
  melis: {
    id: "per_melis",
    firstName: "Melis",
    lastName: "Aksoy",
    locale: "tr",
  },
  emre: { id: "per_emre", firstName: "Emre", lastName: "Doğan", locale: "tr" },
  gizem: {
    id: "per_gizem",
    firstName: "Gizem",
    lastName: "Polat",
    locale: "tr",
  },
  kerem: {
    id: "per_kerem",
    firstName: "Kerem",
    lastName: "Aydemir",
    locale: "tr",
  },
  nil: { id: "per_nil", firstName: "Nil", lastName: "Erdem", locale: "tr" },
  tolga: {
    id: "per_tolga",
    firstName: "Tolga",
    lastName: "Kurt",
    locale: "tr",
  },
  hande: {
    id: "per_hande",
    firstName: "Hande",
    lastName: "Yıldız",
    locale: "tr",
  },
  anna: {
    id: "per_anna",
    firstName: "Anna",
    lastName: "Schneider",
    locale: "en",
  },
  lukas: {
    id: "per_lukas",
    firstName: "Lukas",
    lastName: "Weber",
    locale: "en",
  },
  mia: { id: "per_mia", firstName: "Mia", lastName: "Hoffmann", locale: "en" },
  cem: { id: "per_cem", firstName: "Cem", lastName: "Tekin", locale: "tr" },
  sena: { id: "per_sena", firstName: "Sena", lastName: "Oral", locale: "tr" },
  ece: { id: "per_ece", firstName: "Ece", lastName: "Şahin", locale: "tr" },
} as const satisfies Record<string, NamedPerson>

export type PersonKey = keyof typeof people

interface DisciplineSeed {
  id: string
  name: string
  kind: "dance" | "yoga" | "pilates"
  enrollment: "session" | "series"
  roleBalance: boolean
  seatSelection: boolean
}

interface RoomSeed {
  id: string
  name: string
  capacity: number
  reformers?: number
}

/** One weekly slot. Weekdays are ISO numbers, 1 = Monday. */
interface SlotSeed {
  weekdays: number[]
  time: string
  minutes: number
  disciplineId: string
  roomId: string
  instructor: PersonKey
  assistant?: PersonKey
  level: "all" | "beginner" | "intermediate" | "advanced"
}

export interface TemplateSeed {
  id: string
  name: string
  kind: "standard" | "course" | "trial"
  disciplineIds: string[]
  /** null = unlimited */
  credits: number | null
  validityDays: number
  freezeDays: number
  cancelHours: number
  centerIds: string[]
  price: number
  currency: Currency
  makeupMax: number
}

export interface CenterSeed {
  id: string
  slug: string
  name: string
  city: string
  timeZone: string
  currency: Currency
  status: "active" | "archived"
  /** Active members whose home center this is. */
  members: number
  manager: PersonKey
  staff: { person: PersonKey; modules: StaffModule[] }[]
  instructors: PersonKey[]
  assistants: PersonKey[]
  rooms: RoomSeed[]
  schedule: SlotSeed[]
}

export interface OrganizationSeed {
  id: string
  slug: string
  name: string
  planId: Plan["id"]
  status: "active" | "trial" | "suspended"
  /** Days from now until the trial ends. */
  trialDays: number | null
  setupCompleted: boolean
  /** Days before now the tenant was created. */
  ageDays: number
  owner: PersonKey
  managers: PersonKey[]
  disciplines: DisciplineSeed[]
  templates: TemplateSeed[]
  centers: CenterSeed[]
  /** Prospects without an account (ADR-004). */
  leads: number
}

const weekdays = [1, 2, 3, 4, 5]
const everyDay = [1, 2, 3, 4, 5, 6, 7]

export const organizations: OrganizationSeed[] = [
  {
    id: "org_starter",
    slug: "nefes-yoga",
    name: "Nefes Yoga",
    planId: "starter",
    status: "active",
    trialDays: null,
    setupCompleted: true,
    ageDays: 410,
    owner: "ayse",
    managers: [],
    disciplines: [
      {
        id: "dis_starter_hatha",
        name: "Hatha yoga",
        kind: "yoga",
        enrollment: "session",
        roleBalance: false,
        seatSelection: false,
      },
    ],
    templates: [
      {
        id: "tpl_starter_8",
        name: "Aylık 8 ders",
        kind: "standard",
        disciplineIds: ["dis_starter_hatha"],
        credits: 8,
        validityDays: 30,
        freezeDays: 0,
        cancelHours: 6,
        centerIds: ["ctr_starter_moda"],
        price: 2_400,
        currency: "TRY",
        makeupMax: 0,
      },
      {
        id: "tpl_starter_unlimited",
        name: "Sınırsız aylık",
        kind: "standard",
        disciplineIds: ["dis_starter_hatha"],
        credits: null,
        validityDays: 30,
        freezeDays: 0,
        cancelHours: 6,
        centerIds: ["ctr_starter_moda"],
        price: 3_600,
        currency: "TRY",
        makeupMax: 0,
      },
    ],
    centers: [
      {
        id: "ctr_starter_moda",
        slug: "moda",
        name: "Nefes Yoga Moda",
        city: "İstanbul",
        timeZone: "Europe/Istanbul",
        currency: "TRY",
        status: "active",
        members: 97,
        manager: "ayse",
        staff: [],
        instructors: ["ayse"],
        assistants: [],
        rooms: [{ id: "room_starter_main", name: "Ana salon", capacity: 14 }],
        schedule: [
          {
            weekdays: everyDay,
            time: "09:00",
            minutes: 60,
            disciplineId: "dis_starter_hatha",
            roomId: "room_starter_main",
            instructor: "ayse",
            level: "all",
          },
          {
            weekdays,
            time: "19:30",
            minutes: 75,
            disciplineId: "dis_starter_hatha",
            roomId: "room_starter_main",
            instructor: "ayse",
            level: "intermediate",
          },
        ],
      },
    ],
    leads: 4,
  },
  {
    id: "org_pro",
    slug: "ritim",
    name: "Ritim Dans ve Reformer",
    planId: "pro",
    status: "active",
    trialDays: null,
    setupCompleted: true,
    ageDays: 260,
    owner: "mert",
    managers: [],
    disciplines: [
      {
        id: "dis_pro_salsa",
        name: "Salsa",
        kind: "dance",
        enrollment: "series",
        roleBalance: true,
        seatSelection: false,
      },
      {
        id: "dis_pro_bachata",
        name: "Bachata",
        kind: "dance",
        enrollment: "session",
        roleBalance: true,
        seatSelection: false,
      },
      {
        id: "dis_pro_tango",
        name: "Arjantin tangosu",
        kind: "dance",
        enrollment: "series",
        roleBalance: true,
        seatSelection: false,
      },
      {
        id: "dis_pro_reformer",
        name: "Reformer pilates",
        kind: "pilates",
        enrollment: "session",
        roleBalance: false,
        seatSelection: true,
      },
    ],
    templates: [
      {
        id: "tpl_pro_dance8",
        name: "Dans 8 ders",
        kind: "standard",
        disciplineIds: ["dis_pro_salsa", "dis_pro_bachata", "dis_pro_tango"],
        credits: 8,
        validityDays: 30,
        freezeDays: 14,
        cancelHours: 4,
        centerIds: ["ctr_pro_kadikoy"],
        price: 3_200,
        currency: "TRY",
        makeupMax: 2,
      },
      {
        id: "tpl_pro_salsa_course",
        name: "Salsa başlangıç kuru",
        kind: "course",
        disciplineIds: ["dis_pro_salsa"],
        credits: 16,
        validityDays: 56,
        freezeDays: 0,
        cancelHours: 4,
        centerIds: ["ctr_pro_kadikoy"],
        price: 5_600,
        currency: "TRY",
        makeupMax: 2,
      },
      {
        id: "tpl_pro_reformer10",
        name: "Reformer 10'lu",
        kind: "standard",
        disciplineIds: ["dis_pro_reformer"],
        credits: 10,
        validityDays: 45,
        freezeDays: 14,
        cancelHours: 12,
        centerIds: ["ctr_pro_kadikoy"],
        price: 7_500,
        currency: "TRY",
        makeupMax: 0,
      },
    ],
    centers: [
      {
        id: "ctr_pro_kadikoy",
        slug: "kadikoy",
        name: "Ritim Kadıköy",
        city: "İstanbul",
        timeZone: "Europe/Istanbul",
        currency: "TRY",
        status: "active",
        members: 150,
        manager: "mert",
        staff: [{ person: "zeynep", modules: ["program", "people", "sales"] }],
        instructors: ["deniz", "can", "elif", "burak"],
        assistants: ["ipek"],
        rooms: [
          { id: "room_pro_a", name: "Salon A", capacity: 24 },
          { id: "room_pro_b", name: "Salon B", capacity: 18 },
          {
            id: "room_pro_reformer",
            name: "Reformer odası",
            capacity: 8,
            reformers: 8,
          },
        ],
        schedule: [
          {
            weekdays: [1, 3, 5],
            time: "10:00",
            minutes: 50,
            disciplineId: "dis_pro_reformer",
            roomId: "room_pro_reformer",
            instructor: "burak",
            level: "all",
          },
          {
            weekdays,
            time: "12:30",
            minutes: 50,
            disciplineId: "dis_pro_reformer",
            roomId: "room_pro_reformer",
            instructor: "burak",
            level: "all",
          },
          {
            weekdays: [1, 2, 3, 4, 5, 6],
            time: "18:30",
            minutes: 60,
            disciplineId: "dis_pro_salsa",
            roomId: "room_pro_a",
            instructor: "can",
            assistant: "ipek",
            level: "beginner",
          },
          {
            weekdays: [1, 3],
            time: "19:30",
            minutes: 60,
            disciplineId: "dis_pro_bachata",
            roomId: "room_pro_b",
            instructor: "elif",
            level: "all",
          },
          {
            weekdays: [2, 4],
            time: "20:00",
            minutes: 90,
            disciplineId: "dis_pro_tango",
            roomId: "room_pro_a",
            instructor: "deniz",
            level: "intermediate",
          },
          {
            weekdays: [6],
            time: "13:00",
            minutes: 90,
            disciplineId: "dis_pro_salsa",
            roomId: "room_pro_a",
            instructor: "can",
            level: "advanced",
          },
        ],
      },
    ],
    leads: 6,
  },
  {
    id: "org_business",
    slug: "mavi-hareket",
    name: "Mavi Hareket",
    planId: "business",
    status: "active",
    trialDays: null,
    setupCompleted: true,
    ageDays: 540,
    owner: "deniz",
    managers: ["ozan"],
    disciplines: [
      {
        id: "dis_biz_salsa",
        name: "Salsa",
        kind: "dance",
        enrollment: "session",
        roleBalance: true,
        seatSelection: false,
      },
      {
        id: "dis_biz_vinyasa",
        name: "Vinyasa yoga",
        kind: "yoga",
        enrollment: "session",
        roleBalance: false,
        seatSelection: false,
      },
      {
        id: "dis_biz_reformer",
        name: "Reformer pilates",
        kind: "pilates",
        enrollment: "session",
        roleBalance: false,
        seatSelection: true,
      },
      {
        id: "dis_biz_mat",
        name: "Mat pilates",
        kind: "pilates",
        enrollment: "session",
        roleBalance: false,
        seatSelection: false,
      },
    ],
    templates: [
      {
        id: "tpl_biz_flex12",
        name: "Esnek 12 ders",
        kind: "standard",
        disciplineIds: ["dis_biz_salsa", "dis_biz_vinyasa", "dis_biz_mat"],
        credits: 12,
        validityDays: 45,
        freezeDays: 14,
        cancelHours: 6,
        centerIds: ["ctr_biz_besiktas", "ctr_biz_cankaya"],
        price: 4_800,
        currency: "TRY",
        makeupMax: 2,
      },
      {
        id: "tpl_biz_reformer8",
        name: "Reformer 8 ders",
        kind: "standard",
        disciplineIds: ["dis_biz_reformer"],
        credits: 8,
        validityDays: 30,
        freezeDays: 7,
        cancelHours: 12,
        centerIds: ["ctr_biz_besiktas"],
        price: 6_400,
        currency: "TRY",
        makeupMax: 0,
      },
      {
        id: "tpl_biz_unlimited",
        name: "Sınırsız aylık",
        kind: "standard",
        disciplineIds: ["dis_biz_salsa", "dis_biz_vinyasa", "dis_biz_mat"],
        credits: null,
        validityDays: 30,
        freezeDays: 7,
        cancelHours: 6,
        centerIds: ["ctr_biz_besiktas", "ctr_biz_cankaya"],
        price: 6_000,
        currency: "TRY",
        makeupMax: 0,
      },
      {
        id: "tpl_biz_berlin10",
        name: "10er-Karte",
        kind: "standard",
        disciplineIds: ["dis_biz_vinyasa", "dis_biz_reformer"],
        credits: 10,
        validityDays: 60,
        freezeDays: 14,
        cancelHours: 12,
        centerIds: ["ctr_biz_berlin"],
        price: 190,
        currency: "EUR",
        makeupMax: 1,
      },
    ],
    centers: [
      {
        id: "ctr_biz_besiktas",
        slug: "besiktas",
        name: "Mavi Hareket Beşiktaş",
        city: "İstanbul",
        timeZone: "Europe/Istanbul",
        currency: "TRY",
        status: "active",
        members: 150,
        manager: "deniz",
        staff: [{ person: "nil", modules: ["people", "sales"] }],
        instructors: ["melis", "emre", "gizem"],
        assistants: [],
        rooms: [
          { id: "room_biz_bes_big", name: "Büyük salon", capacity: 24 },
          { id: "room_biz_bes_yoga", name: "Yoga salonu", capacity: 16 },
          {
            id: "room_biz_bes_reformer",
            name: "Reformer odası",
            capacity: 6,
            reformers: 6,
          },
        ],
        schedule: [
          {
            weekdays,
            time: "07:30",
            minutes: 60,
            disciplineId: "dis_biz_vinyasa",
            roomId: "room_biz_bes_yoga",
            instructor: "melis",
            level: "all",
          },
          {
            weekdays: everyDay,
            time: "11:00",
            minutes: 50,
            disciplineId: "dis_biz_reformer",
            roomId: "room_biz_bes_reformer",
            instructor: "gizem",
            level: "all",
          },
          {
            weekdays: [2, 4],
            time: "18:00",
            minutes: 50,
            disciplineId: "dis_biz_mat",
            roomId: "room_biz_bes_yoga",
            instructor: "gizem",
            level: "beginner",
          },
          {
            weekdays,
            time: "19:30",
            minutes: 60,
            disciplineId: "dis_biz_salsa",
            roomId: "room_biz_bes_big",
            instructor: "emre",
            level: "all",
          },
        ],
      },
      {
        id: "ctr_biz_cankaya",
        slug: "cankaya",
        name: "Mavi Hareket Çankaya",
        city: "Ankara",
        timeZone: "Europe/Istanbul",
        currency: "TRY",
        status: "active",
        members: 100,
        manager: "kerem",
        staff: [],
        instructors: ["tolga", "hande"],
        assistants: [],
        rooms: [
          { id: "room_biz_can_1", name: "Salon 1", capacity: 20 },
          { id: "room_biz_can_2", name: "Salon 2", capacity: 14 },
        ],
        schedule: [
          {
            weekdays: [1, 3, 5],
            time: "09:30",
            minutes: 60,
            disciplineId: "dis_biz_vinyasa",
            roomId: "room_biz_can_2",
            instructor: "hande",
            level: "all",
          },
          {
            weekdays,
            time: "18:30",
            minutes: 50,
            disciplineId: "dis_biz_mat",
            roomId: "room_biz_can_2",
            instructor: "hande",
            level: "all",
          },
          {
            weekdays: [2, 4, 6],
            time: "20:00",
            minutes: 60,
            disciplineId: "dis_biz_salsa",
            roomId: "room_biz_can_1",
            instructor: "tolga",
            level: "intermediate",
          },
        ],
      },
      {
        id: "ctr_biz_berlin",
        slug: "berlin",
        name: "Mavi Hareket Berlin",
        city: "Berlin",
        timeZone: "Europe/Berlin",
        currency: "EUR",
        status: "active",
        members: 50,
        manager: "anna",
        staff: [],
        instructors: ["lukas", "mia"],
        assistants: [],
        rooms: [
          { id: "room_biz_ber_studio", name: "Studio 1", capacity: 18 },
          {
            id: "room_biz_ber_reformer",
            name: "Reformer-Raum",
            capacity: 6,
            reformers: 6,
          },
        ],
        schedule: [
          {
            weekdays: [1, 2, 3, 4, 5, 6],
            time: "08:00",
            minutes: 60,
            disciplineId: "dis_biz_vinyasa",
            roomId: "room_biz_ber_studio",
            instructor: "mia",
            level: "all",
          },
          {
            weekdays,
            time: "18:00",
            minutes: 50,
            disciplineId: "dis_biz_reformer",
            roomId: "room_biz_ber_reformer",
            instructor: "lukas",
            level: "all",
          },
        ],
      },
    ],
    leads: 8,
  },
  {
    id: "org_trial",
    slug: "akis-pilates",
    name: "Akış Pilates",
    planId: "pro",
    status: "trial",
    trialDays: 9,
    setupCompleted: false,
    ageDays: 5,
    owner: "cem",
    managers: [],
    disciplines: [],
    templates: [],
    centers: [
      {
        id: "ctr_trial_main",
        slug: "nisantasi",
        name: "Akış Pilates Nişantaşı",
        city: "İstanbul",
        timeZone: "Europe/Istanbul",
        currency: "TRY",
        status: "active",
        members: 0,
        manager: "cem",
        staff: [],
        instructors: [],
        assistants: [],
        rooms: [],
        schedule: [],
      },
    ],
    leads: 0,
  },
  {
    id: "org_suspended",
    slug: "salsa-sokagi",
    name: "Salsa Sokağı",
    planId: "starter",
    status: "suspended",
    trialDays: null,
    setupCompleted: true,
    ageDays: 300,
    owner: "sena",
    managers: [],
    disciplines: [],
    templates: [],
    centers: [
      {
        id: "ctr_suspended_main",
        slug: "alsancak",
        name: "Salsa Sokağı Alsancak",
        city: "İzmir",
        timeZone: "Europe/Istanbul",
        currency: "TRY",
        status: "active",
        members: 0,
        manager: "sena",
        staff: [],
        instructors: [],
        assistants: [],
        rooms: [],
        schedule: [],
      },
    ],
    leads: 0,
  },
]

/** Platform team (ADR-003). */
export const platformTeam: {
  person: PersonKey
  role: "platform_owner" | "platform_manager"
}[] = [
  { person: "deniz", role: "platform_owner" },
  { person: "selin", role: "platform_manager" },
]

/** Members who belong to more than one organization (the Ben shell groups by organization). */
export const crossMembers: { person: PersonKey; centerIds: string[] }[] = [
  { person: "ece", centerIds: ["ctr_pro_kadikoy", "ctr_biz_besiktas"] },
  { person: "emre", centerIds: ["ctr_pro_kadikoy"] },
]

/** The "Örnek kullanıcılar" quick sign-in list (ADR-007); also the Playwright fixture. */
export const sampleUsers: { person: PersonKey; label: string }[] = [
  {
    person: "deniz",
    label: "Platform sahibi, Mavi Hareket sahibi, merkez yöneticisi ve eğitmen",
  },
  { person: "selin", label: "Platform yöneticisi" },
  { person: "ayse", label: "Starter sahibi (Nefes Yoga)" },
  { person: "mert", label: "Pro sahibi (Ritim)" },
  { person: "ozan", label: "Business org. yöneticisi (Mavi Hareket)" },
  { person: "anna", label: "Merkez yöneticisi (Berlin)" },
  { person: "zeynep", label: "Personel, resepsiyon (Ritim)" },
  { person: "can", label: "Eğitmen (Ritim)" },
  { person: "ipek", label: "Eğitmen asistanı (Ritim)" },
  { person: "ece", label: "Üye, iki stüdyoda" },
  { person: "cem", label: "Deneme süresindeki organizasyonun sahibi" },
]
