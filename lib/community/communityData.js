const roleLabels = {
  facilitator: "Facilitator",
  participant: "Participant",
  coach: "Coach invitat",
  specialist: "Specialist",
};

const buildDialogue = (stamp, messages) => ({
  id: `${stamp.replace(/\s+/g, "-").toLowerCase()}-${messages.length}`,
  stamp,
  messages,
});

const buildMessage = ({ sender, role = "participant", time = "08:00", text, replyTo }) => ({
  sender,
  role,
  time,
  text,
  ...(replyTo ? { replyTo } : null),
});

const communityGroupsTemplate = [
  {
    id: 1,
    slug: "cercul-zilnic-de-sprijin",
    name: "Cercul zilnic de sprijin",
    description:
      "Spatiu moderat in care ne verificam starea, impartasim mici victorii si ne sustinem in momentele mai grele.",
    schedule: "In fiecare dimineata, 08:30 - 09:00 (Zoom, link fix)",
    facilitator: "Iulia Petris (psiholog, facilitator certificat)",
    focusAreas: ["Stare emotionala", "Rutine de bine", "Suport reciproc", "Mindfulness scurt"],
    safetyNote:
      "Discutiile raman confidentiale. Te rugam sa eviti detalii care implica alte persoane fara acordul lor.",
    isPrivate: true,
    members: 428,
    lastActive: "5 ore",
    dialogues: [
      buildDialogue("Luni, 3 februarie 2025", [
        buildMessage({
          sender: "Iulia (facilitator)",
          role: "facilitator",
          time: "08:30",
          text: "Buna dimineata tuturor! Incepem cu un check-in scurt: intr-un cuvant, cum sunteti azi?",
        }),
        buildMessage({
          sender: "Mihai",
          time: "08:31",
          text: "Pentru mine cuvantul de azi e 'curios'.",
        }),
        buildMessage({
          sender: "Iulia (facilitator)",
          role: "facilitator",
          time: "08:32",
          replyTo: "Mihai",
          text: "Multumesc, Mihai. Curiozitatea poate sa ne ofere energie, o notam.",
        }),
      ]),
      buildDialogue("Marti, 4 februarie 2025", [
        buildMessage({
          sender: "Iulia (facilitator)",
          role: "facilitator",
          time: "08:30",
          text: "Ce reusita mica ati avut ieri si vreti sa o consemnati aici?",
        }),
        buildMessage({
          sender: "Lavinia",
          time: "08:31",
          text: "Am iesit la o plimbare scurta dupa pranz. M-a ajutat sa respir mai lin.",
        }),
        buildMessage({
          sender: "Ruxandra",
          time: "08:32",
          replyTo: "Lavinia",
          text: "Bravo! Mi-ai dat ideea sa imi pun si eu o alarma pentru pauza de mers.",
        }),
      ]),
      buildDialogue("Miercuri, 5 februarie 2025", [
        buildMessage({
          sender: "Iulia (facilitator)",
          role: "facilitator",
          time: "08:30",
          text: "Azi avem invitat un coach de somn. Pregatiti o intrebare?",
        }),
        buildMessage({
          sender: "Bogdan",
          time: "08:31",
          text: "As vrea sa stiu ce rutina rapida recomanda pentru serile aglomerate.",
        }),
        buildMessage({
          sender: "Coach invitat",
          role: "coach",
          time: "08:32",
          replyTo: "Bogdan",
          text: "Un protocol de 3 minute: respiratie 4-4-4-4, intindere de brate si nota de recunostinta.",
        }),
      ]),
    ],
  },
  {
    id: 2,
    slug: "mindfulness-si-autoingrijire",
    name: "Mindfulness si autoingrijire",
    description: "Micro-sesiuni ghidate pentru a aseza respiratia si grija personala in pauza de pranz.",
    schedule: "Luni, miercuri si vineri, 12:30 - 12:40 (Zoom drop-in)",
    facilitator: "Radu Iancu (coach mindfulness)",
    focusAreas: ["Respiratie constienta", "Reset mental", "Pauze active", "Ritualuri de grija"],
    safetyNote:
      "Exercitiile pot fi adaptate la nivelul tau de confort. Poti participa cu camera oprita si poti intrerupe oricand.",
    isPrivate: true,
    members: 189,
    lastActive: "1 ora",
    dialogues: [
      buildDialogue("Marti, 4 februarie 2025", [
        buildMessage({
          sender: "Radu (facilitator)",
          role: "facilitator",
          time: "12:30",
          text: "Bine ati venit! Lucram azi cu un scan corporal ghidat. Alegeti o postura comoda.",
        }),
        buildMessage({
          sender: "Irina",
          time: "12:31",
          text: "Simt umerii ridicati. Cand ii observ, coboara singuri.",
        }),
        buildMessage({
          sender: "Radu (facilitator)",
          role: "facilitator",
          time: "12:32",
          replyTo: "Irina",
          text: "Excelent, continua sa observi respiratia si lasa umerii sa se aseze.",
        }),
      ]),
      buildDialogue("Miercuri, 5 februarie 2025", [
        buildMessage({
          sender: "Radu (facilitator)",
          role: "facilitator",
          time: "12:30",
          text: "Astazi incercam respiratia 4-7-8. Inspiram pe 4, mentinem pe 7, expiram pe 8.",
        }),
        buildMessage({
          sender: "Daniel",
          time: "12:31",
          text: "Dupa al doilea ciclu simt ca mintea se limpezeste.",
        }),
      ]),
      buildDialogue("Joi, 6 februarie 2025", [
        buildMessage({
          sender: "Radu (facilitator)",
          role: "facilitator",
          time: "12:30",
          text: "Intentie pentru azi: un gest mic de autoingrijire dupa aceasta sesiune.",
        }),
        buildMessage({
          sender: "Mara",
          time: "12:31",
          text: "Imi propun sa ies afara 5 minute, chiar daca e frig.",
        }),
      ]),
    ],
  },
  {
    id: 3,
    slug: "gestionarea-stresului",
    name: "Gestionarea stresului",
    description: "Spatiu de invatare si suport pentru a transforma stresul zilnic in strategii constiente.",
    schedule: "Marti si joi, 18:30 - 19:00 (Zoom, grup restrans)",
    facilitator: "Ana Luca (psiholog organizational)",
    focusAreas: ["Tehnici de reglare", "Planificare pragmatica", "Sprijin reciproc", "Resurse personale"],
    safetyNote:
      "Discutiile sunt confidentiale. Te incurajam sa imparti doar atat cat te simti confortabil si sa ceri pauza cand ai nevoie.",
    isPrivate: true,
    members: 156,
    lastActive: "15 minute",
    dialogues: [
      buildDialogue("Luni, 3 februarie 2025", [
        buildMessage({
          sender: "Ana (facilitator)",
          role: "facilitator",
          time: "18:30",
          text: "Incepem cu un inventar scurt: ce factor de stres simtiti cel mai acut azi?",
        }),
        buildMessage({
          sender: "Sorina",
          time: "18:31",
          text: "Mi-e greu sa trasez limite in calendar si ma simt coplesita.",
        }),
        buildMessage({
          sender: "Ana (facilitator)",
          role: "facilitator",
          time: "18:32",
          replyTo: "Sorina",
          text: "Multumesc, Sorina. Notam si revenim cu o tehnica de negociere a limitelor.",
        }),
      ]),
      buildDialogue("Marti, 4 februarie 2025", [
        buildMessage({
          sender: "Ana (facilitator)",
          role: "facilitator",
          time: "18:30",
          text: "Tema de astazi: micro-pauze constiente. Ce functioneaza pentru voi?",
        }),
        buildMessage({
          sender: "Vlad",
          time: "18:31",
          text: "Setez un cronometru pentru 90 de minute, apoi ma ridic si beau apa. Il tratez ca pe un meeting cu mine.",
        }),
      ]),
      buildDialogue("Miercuri, 5 februarie 2025", [
        buildMessage({
          sender: "Ana (facilitator)",
          role: "facilitator",
          time: "18:30",
          text: "Pentru sesiunea individuala de joi, noteaza in chat ce subiect vrei sa discutam.",
        }),
        buildMessage({
          sender: "Raluca",
          time: "18:31",
          text: "As vrea sa lucram pe obiceiul de a spune 'da' din reflex.",
        }),
      ]),
    ],
  },
  {
    id: 4,
    slug: "resurse-pentru-parinti",
    name: "Resurse pentru parinti",
    description:
      "Cerc de sprijin pentru parinti care cauta strategii blande si resurse pentru echilibru emotional in familie.",
    schedule: "Joi, 17:30 - 18:15 (Zoom, acces deschis cu cont)",
    facilitator: "Ioana Matei (psihoterapeut familial)",
    focusAreas: ["Ritualuri de familie", "Emotii la copii", "Limite sanatoase", "Sprijin reciproc"],
    safetyNote:
      "Ne asiguram ca experientele impartasite raman in comunitate. Protejam identitatea copiilor si punem accent pe responsabilitate comuna.",
    isPrivate: false,
    members: 98,
    lastActive: "3 ore",
    dialogues: [
      buildDialogue("Marti, 4 februarie 2025", [
        buildMessage({
          sender: "Ioana (facilitator)",
          role: "facilitator",
          time: "17:30",
          text: "Buna tuturor! Azi discutam despre ritualurile de seara. Ce a functionat pentru voi in ultima saptamana?",
        }),
        buildMessage({
          sender: "Anca",
          time: "17:31",
          text: "Am introdus 5 minute de poveste audio. Ajuta la tranzitia catre somn.",
        }),
      ]),
      buildDialogue("Miercuri, 5 februarie 2025", [
        buildMessage({
          sender: "Ioana (facilitator)",
          role: "facilitator",
          time: "17:30",
          text: "Cum gestionati descarcarea de emotii dupa gradinita?",
        }),
        buildMessage({
          sender: "Dan",
          time: "17:31",
          text: "Ne asezam la masa si fiecare spune cate un lucru dificil si unul bun din zi.",
        }),
        buildMessage({
          sender: "Ioana (facilitator)",
          role: "facilitator",
          time: "17:32",
          replyTo: "Dan",
          text: "Excelenta structura, Dan. Normalizarea emotiilor sprijina autoreglarea copiilor.",
        }),
      ]),
      buildDialogue("Joi, 6 februarie 2025", [
        buildMessage({
          sender: "Ioana (facilitator)",
          role: "facilitator",
          time: "17:30",
          text: "Va rog sa notati in chat resursele promise (carti, podcast-uri). Le vom centraliza pentru newsletter.",
        }),
        buildMessage({
          sender: "Mara",
          time: "17:31",
          text: "Recomand 'Cum sa vorbim copiilor...' - capitolul despre emotii a fost un game changer.",
        }),
      ]),
    ],
  },
];

const groupIndexBySlug = communityGroupsTemplate.reduce((acc, group) => {
  acc[group.slug] = group;
  return acc;
}, {});

const groupIndexByName = communityGroupsTemplate.reduce((acc, group) => {
  acc[group.name.toLowerCase()] = group;
  return acc;
}, {});

const slugify = (value) =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const cloneGroup = (group) => {
  if (!group) {
    return null;
  }
  return {
    ...group,
    focusAreas: [...group.focusAreas],
    dialogues: group.dialogues.map((dialogue) => ({
      ...dialogue,
      messages: dialogue.messages.map((message) => ({ ...message })),
    })),
  };
};

export function getCommunityGroupBySlug(slug) {
  const record = groupIndexBySlug[slug];
  return cloneGroup(record);
}

export function getCommunityGroupByName(name) {
  if (!name) {
    return null;
  }
  return cloneGroup(groupIndexByName[String(name).toLowerCase()]);
}

export function getCommunityGroupSlugs() {
  return communityGroupsTemplate.map((group) => group.slug);
}

export function getCommunityGroupSlugByName(name) {
  if (!name) {
    return null;
  }
  const match = getCommunityGroupByName(name);
  if (match) {
    return match.slug;
  }
  return slugify(name);
}

export function getCommunityGroupSummaries() {
  return communityGroupsTemplate.map((group) => ({
    id: group.id,
    slug: group.slug,
    name: group.name,
    members: group.members,
    last_active: group.lastActive,
    is_private: group.isPrivate,
  }));
}

export function prepareGroupForClient(group) {
  if (!group) {
    return null;
  }
  return {
    ...group,
    isPrivate: group.isPrivate,
    is_private: group.isPrivate,
    members: group.members,
    last_active: group.lastActive,
    lastActive: group.lastActive,
  };
}

export { roleLabels };
export const communityGroupsData = communityGroupsTemplate;
