export const roleLabels = {
  facilitator: "Facilitator",
  participant: "Participant",
  coach: "Coach invitat",
  moderator: "Moderator",
  specialist: "Specialist",
};

const dailyCircleDialogues = [
  {
    id: "dlg-01",
    stamp: "Luni, 3 februarie 2025",
    messages: [
      {
        sender: "Iulia (facilitator)",
        role: "facilitator",
        time: "08:30",
        text: "Buna dimineata tuturor! Va invit sa impartasiti intr-un cuvant cum va simtiti astazi.",
      },
      {
        sender: "Mihai R.",
        role: "participant",
        time: "08:31",
        text: "Salut! Pentru mine cuvantul este 'incert'. Simt ca ziua de ieri nu s-a incheiat.",
      },
      {
        sender: "Iulia (facilitator)",
        role: "facilitator",
        time: "08:32",
        replyTo: "Mihai R.",
        text: "Multumesc, Mihai. Notez incertitudinea si revinem la ea dupa turul initial.",
      },
    ],
  },
  {
    id: "dlg-02",
    stamp: "Luni, 3 februarie 2025",
    messages: [
      {
        sender: "Oana T.",
        role: "participant",
        time: "08:33",
        text: "Eu aleg cuvantul 'luminos'. M-am trezit devreme si am reusit sa citesc cateva pagini.",
      },
      {
        sender: "Andrei L.",
        role: "participant",
        time: "08:34",
        replyTo: "Oana T.",
        text: "Sunetul acesta de dimineata mi se pare tare fain. Oana, ce ai citit?",
      },
      {
        sender: "Oana T.",
        role: "participant",
        time: "08:35",
        replyTo: "Andrei L.",
        text: "O carte scurta despre micro-obiceiuri. Pot lasa titlul la final daca mai vrea cineva.",
      },
    ],
  },
  {
    id: "dlg-03",
    stamp: "Luni, 3 februarie 2025",
    messages: [
      {
        sender: "Lavinia B.",
        role: "participant",
        time: "08:36",
        text: "Cuvantul meu este 'obosita'. Am dormit agitat si simt tensiune in umeri.",
      },
      {
        sender: "Iulia (facilitator)",
        role: "facilitator",
        time: "08:37",
        replyTo: "Lavinia B.",
        text: "Te aud, Lavinia. Ramanem cu tine dupa check-in pentru un exercitiu scurt de respiratie.",
      },
    ],
  },
  {
    id: "dlg-04",
    stamp: "Luni, 3 februarie 2025",
    messages: [
      {
        sender: "Iulia (facilitator)",
        role: "facilitator",
        time: "08:38",
        text: "Va multumesc tuturor. Mihai, revenim la ce spuneai despre incertitudine. Ce gand se tot intoarce la tine?",
      },
      {
        sender: "Mihai R.",
        role: "participant",
        time: "08:39",
        text: "Ca lucrurile scap de sub control la birou si ca nu voi putea raspunde tuturor cerintelor azi.",
      },
      {
        sender: "Ruxandra S.",
        role: "participant",
        time: "08:40",
        replyTo: "Mihai R.",
        text: "Si eu am zile in care simt exact la fel. M-a ajutat sa imi stabilesc doua sarcini esentiale si restul sa le numesc bonus.",
      },
      {
        sender: "Mihai R.",
        role: "participant",
        time: "08:41",
        replyTo: "Ruxandra S.",
        text: "Imi place ideea de bonus. Suna mai lejer. Multumesc!",
      },
    ],
  },
  {
    id: "dlg-05",
    stamp: "Luni, 3 februarie 2025",
    messages: [
      {
        sender: "Iulia (facilitator)",
        role: "facilitator",
        time: "08:42",
        text: "Propun un minut de respiratie 4-4-4-4. Daca puteti, inchideti ochii si urmariti ghidajul audio pe care il trimit in chat.",
      },
      {
        sender: "Bogdan C.",
        role: "participant",
        time: "08:43",
        text: "Multumesc, Iulia. Imi place ca ne reamintesti cat de simple pot fi pauzele astea.",
      },
      {
        sender: "Lavinia B.",
        role: "participant",
        time: "08:44",
        text: "Deja umerii mi se simt mai usori.",
      },
    ],
  },
  {
    id: "dlg-06",
    stamp: "Marti, 4 februarie 2025",
    messages: [
      {
        sender: "Iulia (facilitator)",
        role: "facilitator",
        time: "08:31",
        text: "Buna dimineata! Ce reusita mica ati avut ieri si vreti sa o notati aici?",
      },
      {
        sender: "Ruxandra S.",
        role: "participant",
        time: "08:32",
        text: "Mi-am planificat pauzele in calendar. Doua dintre ele chiar au ramas acolo.",
      },
      {
        sender: "Iulia (facilitator)",
        role: "facilitator",
        time: "08:33",
        replyTo: "Ruxandra S.",
        text: "Felicitari, Ruxandra! Calendarul poate fi un aliat bun cand il folosim si pentru pauze.",
      },
    ],
  },
  {
    id: "dlg-07",
    stamp: "Marti, 4 februarie 2025",
    messages: [
      {
        sender: "Andrei L.",
        role: "participant",
        time: "08:34",
        text: "Pentru mine reusita a fost ca, in loc sa verific emailul la 23:00, am inchis laptopul si am citit 10 minute.",
      },
      {
        sender: "Oana T.",
        role: "participant",
        time: "08:35",
        replyTo: "Andrei L.",
        text: "Ce fain! Ce ai citit de data asta?",
      },
      {
        sender: "Andrei L.",
        role: "participant",
        time: "08:36",
        replyTo: "Oana T.",
        text: "Tot cartea recomandata de tine ieri. S-a potrivit perfect seara.",
      },
    ],
  },
  {
    id: "dlg-08",
    stamp: "Marti, 4 februarie 2025",
    messages: [
      {
        sender: "Lavinia B.",
        role: "participant",
        time: "08:37",
        text: "Reusita mea este ca am dormit 7 ore legate. Am folosit exercitiul de respiratie de aici.",
      },
      {
        sender: "Mihai R.",
        role: "participant",
        time: "08:38",
        replyTo: "Lavinia B.",
        text: "Felicitari! Ce te-a ajutat cel mai mult sa il aplici?",
      },
      {
        sender: "Lavinia B.",
        role: "participant",
        time: "08:38",
        replyTo: "Mihai R.",
        text: "Mi-am pus un reminder mic pe telefon cu 'Respira 4-4-4-4'.",
      },
    ],
  },
  {
    id: "dlg-09",
    stamp: "Marti, 4 februarie 2025",
    messages: [
      {
        sender: "Iulia (facilitator)",
        role: "facilitator",
        time: "08:39",
        text: "Va multumesc. Incheiem cu o invitatie: notati in jurnalul personal ce ati observat la voi ieri.",
      },
      {
        sender: "Bogdan C.",
        role: "participant",
        time: "08:40",
        text: "Notat! Ms pentru reminder, Iulia.",
      },
    ],
  },
  {
    id: "dlg-10",
    stamp: "Marti, 4 februarie 2025",
    messages: [
      {
        sender: "Iulia (facilitator)",
        role: "facilitator",
        time: "08:45",
        text: "Maine dimineata avem invitat un coach de somn. Daca aveti intrebari, le puteti adauga in documentul comun.",
      },
      {
        sender: "Ruxandra S.",
        role: "participant",
        time: "08:45",
        text: "Perfect, tocmai completam formularul. Multumesc!",
      },
    ],
  },
  {
    id: "dlg-11",
    stamp: "Miercuri, 5 februarie 2025",
    messages: [
      {
        sender: "Iulia (facilitator)",
        role: "facilitator",
        time: "08:30",
        text: "Buna dimineata! Azi discutam despre cum ne pregatim pentru intalniri intense. Ce faceti cu 15 minute inainte?",
      },
      {
        sender: "Bogdan C.",
        role: "participant",
        time: "08:31",
        text: "Eu inchid tab-urile care nu au legatura. Daca nu o fac, ma trezesc cu notificari peste notificari.",
      },
      {
        sender: "Iulia (facilitator)",
        role: "facilitator",
        time: "08:32",
        replyTo: "Bogdan C.",
        text: "Foarte bun punctul. Curatenia digitala chiar pregateste mintea.",
      },
    ],
  },
  {
    id: "dlg-12",
    stamp: "Miercuri, 5 februarie 2025",
    messages: [
      {
        sender: "Oana T.",
        role: "participant",
        time: "08:33",
        text: "Eu imi pun telefonul pe modul avion si scriu 3 puncte pe care vreau sa le livrez.",
      },
      {
        sender: "Andrei L.",
        role: "participant",
        time: "08:34",
        replyTo: "Oana T.",
        text: "Sa incerc si eu lista asta. Cateodata uit de ce am intrat in intalnire :D",
      },
    ],
  },
  {
    id: "dlg-13",
    stamp: "Miercuri, 5 februarie 2025",
    messages: [
      {
        sender: "Lavinia B.",
        role: "participant",
        time: "08:35",
        text: "Inainte de sedinte, fac 5 minute de stretching pentru gat si umeri. Ajuta sa nu intru rigid.",
      },
      {
        sender: "Iulia (facilitator)",
        role: "facilitator",
        time: "08:36",
        replyTo: "Lavinia B.",
        text: "Excelent, Lavinia. Corpul pregatit transmite creierului ca poate colabora.",
      },
    ],
  },
  {
    id: "dlg-14",
    stamp: "Miercuri, 5 februarie 2025",
    messages: [
      {
        sender: "Iulia (facilitator)",
        role: "facilitator",
        time: "08:37",
        text: "Va propun sa notati in chat una dintre actiunile voastre preferate pentru a intra prezent in intalniri.",
      },
      {
        sender: "Andrei L.",
        role: "participant",
        time: "08:38",
        text: "Eu imi setezi ecranul cu modul focus si luminozitate mai mica. Ma ajuta sa reduc stimulii.",
      },
      {
        sender: "Mihai R.",
        role: "participant",
        time: "08:39",
        text: "Mie imi place sa notez intrebarile esentiale pe hartie.",
      },
      {
        sender: "Iulia (facilitator)",
        role: "facilitator",
        time: "08:40",
        replyTo: "Andrei L.",
        text: "Super resursa, Andrei. Reducerea luminozitatii poate fi un semnal util corpului.",
      },
    ],
  },
  {
    id: "dlg-15",
    stamp: "Miercuri, 5 februarie 2025",
    messages: [
      {
        sender: "Iulia (facilitator)",
        role: "facilitator",
        time: "09:02",
        text: "Reminder: joi avem invitat pe Radu, coach de somn, pentru 15 minute. Puteti pregati intrebari in documentul comun.",
      },
      {
        sender: "Bogdan C.",
        role: "participant",
        time: "09:03",
        replyTo: "Iulia (facilitator)",
        text: "Super! Scriu acum o intrebare despre rutina de seara.",
      },
    ],
  },
  {
    id: "dlg-16",
    stamp: "Joi, 6 februarie 2025",
    messages: [
      {
        sender: "Iulia (facilitator)",
        role: "facilitator",
        time: "09:03",
        text: "In chat gasiti link-ul catre documentul comun si resursa mentionata de Oana mai devreme.",
      },
      {
        sender: "Oana T.",
        role: "participant",
        time: "09:03",
        text: "Am adaugat titlul: 'Atomic Habits' de James Clear.",
      },
    ],
  },
  {
    id: "dlg-17",
    stamp: "Joi, 6 februarie 2025",
    messages: [
      {
        sender: "Iulia (facilitator)",
        role: "facilitator",
        time: "09:04",
        text: "Ultima runda: ce mesaj scurt iti spui tie cand apar presiuni azi?",
      },
      {
        sender: "Mihai R.",
        role: "participant",
        time: "09:04",
        text: '"Respir si aleg urmatorul pas".',
      },
      {
        sender: "Lavinia B.",
        role: "participant",
        time: "09:05",
        text: '"Corpul meu merita pauze scurte".',
      },
    ],
  },
  {
    id: "dlg-18",
    stamp: "Joi, 6 februarie 2025",
    messages: [
      {
        sender: "Ruxandra S.",
        role: "participant",
        time: "09:05",
        text: '"Pot cere clarificari fara sa par nepregatita".',
      },
      {
        sender: "Andrei L.",
        role: "participant",
        time: "09:05",
        text: '"Sa fac loc curiozitatii, nu presupunerilor".',
      },
    ],
  },
  {
    id: "dlg-19",
    stamp: "Joi, 6 februarie 2025",
    messages: [
      {
        sender: "Iulia (facilitator)",
        role: "facilitator",
        time: "09:06",
        text: "Va multumesc pentru energie si prezenta. Daca aveti feedback despre sesiunea de azi, il astept in formularul din chat.",
      },
      {
        sender: "Bogdan C.",
        role: "participant",
        time: "09:06",
        replyTo: "Iulia (facilitator)",
        text: "Completat deja. M-a ajutat mult ritmul bland.",
      },
    ],
  },
  {
    id: "dlg-20",
    stamp: "Joi, 6 februarie 2025",
    messages: [
      {
        sender: "Iulia (facilitator)",
        role: "facilitator",
        time: "09:07",
        text: "Ne revedem maine dimineata la aceeasi ora. Sa aveti o zi blanda!",
      },
      {
        sender: "Intreg grupul",
        role: "participant",
        time: "09:07",
        text: "Zi cu liniste!",
      },
    ],
  },
];

const mindfulnessDialogues = [
  {
    id: "mind-01",
    stamp: "Marti, 4 februarie 2025",
    messages: [
      {
        sender: "Radu (facilitator)",
        role: "facilitator",
        time: "12:30",
        text: "Buna! Azi facem un scan corporal ghidat de 3 minute. Va invit sa gasiti o postura comoda.",
      },
      {
        sender: "Irina",
        role: "participant",
        time: "12:31",
        text: "Gata, castile puse. Astept ghidajul.",
      },
      {
        sender: "Radu (facilitator)",
        role: "facilitator",
        time: "12:32",
        replyTo: "Irina",
        text: "Perfect, Irina. Incepem prin a observa respiratia in zona abdomenului.",
      },
    ],
  },
  {
    id: "mind-02",
    stamp: "Marti, 4 februarie 2025",
    messages: [
      {
        sender: "Radu (facilitator)",
        role: "facilitator",
        time: "12:35",
        text: "Ce ati remarcat in corp in timpul scanarii?",
      },
      {
        sender: "Daniel",
        role: "participant",
        time: "12:36",
        text: "Am simtit umeri foarte incordati. Cand am observat asta, au coborat un pic.",
      },
      {
        sender: "Roxana",
        role: "participant",
        time: "12:36",
        text: "La mine picioarele erau nelinistite. Cand le-am recunoscut agitatia, s-au linistit.",
      },
    ],
  },
  {
    id: "mind-03",
    stamp: "Miercuri, 5 februarie 2025",
    messages: [
      {
        sender: "Radu (facilitator)",
        role: "facilitator",
        time: "12:30",
        text: "Astazi lucram cu respiratia 4-7-8. Inspiram pe 4, tinem 7, expiram pe 8.",
      },
      {
        sender: "Irina",
        role: "participant",
        time: "12:31",
        text: "Ce fac daca ametesc putin?",
      },
      {
        sender: "Radu (facilitator)",
        role: "facilitator",
        time: "12:31",
        replyTo: "Irina",
        text: "Reia respiratia naturala cateva secunde si intoarce-te cand te simti stabila. E normal la inceput.",
      },
    ],
  },
  {
    id: "mind-04",
    stamp: "Joi, 6 februarie 2025",
    messages: [
      {
        sender: "Radu (facilitator)",
        role: "facilitator",
        time: "12:30",
        text: "Check-in rapid: ce intentie aveti pentru aceste 10 minute?",
      },
      {
        sender: "Mara",
        role: "participant",
        time: "12:30",
        text: "Sa imi odihnesc ochii de la monitor.",
      },
      {
        sender: "Daniel",
        role: "participant",
        time: "12:31",
        text: "Sa las grijile legate de sedinta de dupa-amiaza.",
      },
    ],
  },
  {
    id: "mind-05",
    stamp: "Joi, 6 februarie 2025",
    messages: [
      {
        sender: "Radu (facilitator)",
        role: "facilitator",
        time: "12:35",
        text: "Multumesc! Terminam cu o intrebare: ce luati cu voi in restul zilei?",
      },
      {
        sender: "Roxana",
        role: "participant",
        time: "12:36",
        text: "Ca pot reveni la respiratie chiar si intre emailuri.",
      },
      {
        sender: "Daniel",
        role: "participant",
        time: "12:36",
        text: "Senzatia de umeri relaxati. Chiar se simte diferenta.",
      },
    ],
  },
];

const parentingDialogues = [
  {
    id: "parent-01",
    stamp: "Marti, 4 februarie 2025",
    messages: [
      {
        sender: "Ioana (moderator)",
        role: "moderator",
        time: "18:00",
        text: "Buna tuturor! Azi discutam despre ritualurile de seara. Ce a mers bine in ultima saptamana?",
      },
      {
        sender: "Claudiu",
        role: "participant",
        time: "18:01",
        text: "Am introdus un joc de carti de 5 minute si culcatul a mers mai lin.",
      },
      {
        sender: "Ioana (moderator)",
        role: "moderator",
        time: "18:02",
        replyTo: "Claudiu",
        text: "Ce frumos! Ce joc ati ales?",
      },
      {
        sender: "Claudiu",
        role: "participant",
        time: "18:02",
        replyTo: "Ioana (moderator)",
        text: "Un joc cu perechi de emotii. Ii place sa ghiceasca reactii.",
      },
    ],
  },
  {
    id: "parent-02",
    stamp: "Marti, 4 februarie 2025",
    messages: [
      {
        sender: "Andreea",
        role: "participant",
        time: "18:03",
        text: "Eu am reusit sa scurtez negocierile cu 'inca o poveste' printr-un playlist audio de 10 minute.",
      },
      {
        sender: "Ioana (moderator)",
        role: "moderator",
        time: "18:04",
        replyTo: "Andreea",
        text: "Playlistul are teme diferite sau e acelasi? Poate fi util sa il impartasesti in resurse.",
      },
    ],
  },
  {
    id: "parent-03",
    stamp: "Miercuri, 5 februarie 2025",
    messages: [
      {
        sender: "Ioana (moderator)",
        role: "moderator",
        time: "18:00",
        text: "Tema de astazi: cum gestionam tantrumurile de dimineata. Ce a functionat pentru voi?",
      },
      {
        sender: "Radu",
        role: "participant",
        time: "18:01",
        text: "Un timer vizual. Cand il pornim, stie cat mai avem pentru imbracat.",
      },
      {
        sender: "Ana",
        role: "participant",
        time: "18:02",
        replyTo: "Radu",
        text: "Ce fel de timer folosesti? Aplicatie sau fizic?",
      },
      {
        sender: "Radu",
        role: "participant",
        time: "18:02",
        replyTo: "Ana",
        text: "Fizic, cu nisip. Il intoarce chiar el.",
      },
    ],
  },
  {
    id: "parent-04",
    stamp: "Joi, 6 februarie 2025",
    messages: [
      {
        sender: "Ioana (moderator)",
        role: "moderator",
        time: "18:00",
        text: "Haide sa notam intr-un cuvant cum intram azi in intalnire.",
      },
      {
        sender: "Andreea",
        role: "participant",
        time: "18:01",
        text: "Speranta.",
      },
      {
        sender: "Claudiu",
        role: "participant",
        time: "18:01",
        text: "Obosit, dar prezent.",
      },
    ],
  },
  {
    id: "parent-05",
    stamp: "Joi, 6 februarie 2025",
    messages: [
      {
        sender: "Ioana (moderator)",
        role: "moderator",
        time: "18:05",
        text: "Multumesc! Retinem ideile si le punem in rezumatul saptamanii. Daca vreti consultatii individuale, scrieti-mi privat.",
      },
      {
        sender: "Ana",
        role: "participant",
        time: "18:06",
        text: "Multumim, Ioana. Playlistul e deja in drive.",
      },
    ],
  },
];

const resilienceDialogues = [
  {
    id: "res-01",
    stamp: "Luni, 3 februarie 2025",
    messages: [
      {
        sender: "Matei (facilitator)",
        role: "facilitator",
        time: "19:00",
        text: "Bine ati venit! Azi lucram pe strategii de revenire dupa zile grele. Cu ce veniti in intalnire?",
      },
      {
        sender: "Sorina",
        role: "participant",
        time: "19:01",
        text: "Vin cu oboseala si putina frustrare.",
      },
      {
        sender: "Matei (facilitator)",
        role: "facilitator",
        time: "19:01",
        replyTo: "Sorina",
        text: "Multumesc pentru sinceritate. Ne oprim la final pe o tehnica de descarcare blanda.",
      },
    ],
  },
  {
    id: "res-02",
    stamp: "Luni, 3 februarie 2025",
    messages: [
      {
        sender: "Matei (facilitator)",
        role: "facilitator",
        time: "19:10",
        text: "Care a fost un lucru mic care v-a oferit energie saptamana trecuta?",
      },
      {
        sender: "Gabriel",
        role: "participant",
        time: "19:11",
        text: "O plimbare de 15 minute dupa pranz. Am mers fara telefon.",
      },
      {
        sender: "Sorina",
        role: "participant",
        time: "19:12",
        text: "Am scris 3 lucruri pentru care sunt recunoscatoare seara.",
      },
    ],
  },
  {
    id: "res-03",
    stamp: "Marti, 4 februarie 2025",
    messages: [
      {
        sender: "Matei (facilitator)",
        role: "facilitator",
        time: "19:00",
        text: "Astazi avem invitat pe Ana, specialist in trauma corporala.",
      },
      {
        sender: "Ana (specialist)",
        role: "specialist",
        time: "19:01",
        text: "Salut! Propun un exercitiu de grounding: enumerati 5 lucruri pe care le vedeti acum.",
      },
      {
        sender: "Elena",
        role: "participant",
        time: "19:02",
        text: "Eu vad cana de ceai, un tablou cu mare, monitorul, o planta si o lumina calda.",
      },
    ],
  },
  {
    id: "res-04",
    stamp: "Marti, 4 februarie 2025",
    messages: [
      {
        sender: "Ana (specialist)",
        role: "specialist",
        time: "19:05",
        text: "Ce simtiti in corp dupa exercitiu?",
      },
      {
        sender: "Gabriel",
        role: "participant",
        time: "19:06",
        text: "Respir mai profund si umerii s-au relaxat.",
      },
      {
        sender: "Sorina",
        role: "participant",
        time: "19:06",
        text: "Simt picioarele mai stabile pe podea.",
      },
    ],
  },
  {
    id: "res-05",
    stamp: "Miercuri, 5 februarie 2025",
    messages: [
      {
        sender: "Matei (facilitator)",
        role: "facilitator",
        time: "19:00",
        text: "Revenim la provocarile de saptamana aceasta. Ce conflict mic ati reusit sa traversati?",
      },
      {
        sender: "Elena",
        role: "participant",
        time: "19:01",
        text: "Am avut o discutie tensionata cu un coleg. Am cerut o pauza de 5 minute si am revenit.",
      },
      {
        sender: "Matei (facilitator)",
        role: "facilitator",
        time: "19:02",
        replyTo: "Elena",
        text: "Excelent. Pauzele scurte sunt o forma de reglare emotionala.",
      },
    ],
  },
  {
    id: "res-06",
    stamp: "Joi, 6 februarie 2025",
    messages: [
      {
        sender: "Matei (facilitator)",
        role: "facilitator",
        time: "19:00",
        text: "Sesiune scurta de vizualizare: care e imaginea unei zile reziliente pentru voi?",
      },
      {
        sender: "Gabriel",
        role: "participant",
        time: "19:01",
        text: "Sa incep cu 10 minute de stretching si sa inchei cu o baie fierbinte.",
      },
      {
        sender: "Sorina",
        role: "participant",
        time: "19:02",
        text: "Sa am spatii intre task-uri si sa le respect.",
      },
    ],
  },
  {
    id: "res-07",
    stamp: "Joi, 6 februarie 2025",
    messages: [
      {
        sender: "Matei (facilitator)",
        role: "facilitator",
        time: "19:06",
        text: "Va multumesc! Las in chat resursa promise despre autoreglare. Ne vedem saptamana viitoare.",
      },
      {
        sender: "Elena",
        role: "participant",
        time: "19:07",
        text: "Multumim! Link salvat.",
      },
    ],
  },
];

export const communityGroupsData = [
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
    dialogues: dailyCircleDialogues,
  },
  {
    id: 2,
    slug: "mindfulness-in-10-minute",
    name: "Mindfulness in 10 minute",
    description: "Micro-sesiuni ghidate pentru a reaseza respiratia si focusul in pauza de pranz.",
    schedule: "Luni, miercuri si vineri, 12:30 - 12:40 (Zoom drop-in)",
    facilitator: "Radu Iancu (coach mindfulness)",
    focusAreas: ["Mindfulness scurt", "Respiratie constienta", "Reset mental", "Revenire la corp"],
    safetyNote:
      "Poti avea camera oprita. Te rugam sa iti anunti limitele fizice si sa adaptezi exercitiile dupa nevoile tale.",
    isPrivate: false,
    members: 312,
    lastActive: "1 zi",
    dialogues: mindfulnessDialogues,
  },
  {
    id: 3,
    slug: "parinti-si-echilibru-emotional",
    name: "Parinti si echilibru emotional",
    description:
      "Cerc de sprijin pentru parinti care cauta strategii echilibrate intre nevoile copiilor si propriile resurse.",
    schedule: "Marti si joi, 18:00 - 18:45 (Zoom, grup restrans)",
    facilitator: "Ioana Matei (psihoterapeut familial)",
    focusAreas: ["Emotii in familie", "Ritualuri de conectare", "Limite sanatoase", "Sprijin reciproc"],
    safetyNote:
      "Se pastreaza anonimatul copiilor si discutiile nu parasesc grupul. Pentru situatii delicate oferim sesiuni individuale.",
    isPrivate: true,
    members: 289,
    lastActive: "2 zile",
    dialogues: parentingDialogues,
  },
  {
    id: 4,
    slug: "rezistenta-in-perioade-dificile",
    name: "Rezistenta in perioade dificile",
    description:
      "Program ghidat pentru a construi rezilienta emotionala si rutine de refacere in perioade solicitante.",
    schedule: "Luni - joi, 19:00 - 19:30 (Zoom, serie de 4 saptamani)",
    facilitator: "Matei Dima (psihoterapeut integrativ)",
    focusAreas: ["Resurse mentale", "Tehnici de grounding", "Sprijin in comunitate", "Plan personal de revenire"],
    safetyNote:
      "Discutiile sunt confidentiale. Ai oricand libertatea sa opresti camera sau sa iei pauza daca un subiect devine intens.",
    isPrivate: true,
    members: 201,
    lastActive: "3 zile",
    dialogues: resilienceDialogues,
  },
];

const slugByName = communityGroupsData.reduce((acc, group) => {
  acc[group.name] = group.slug;
  return acc;
}, {});

const slugSet = new Set(communityGroupsData.map((group) => group.slug));

const pickOverview = (group) => ({
  name: group.name,
  description: group.description,
  schedule: group.schedule,
  facilitator: group.facilitator,
  focusAreas: group.focusAreas,
  safetyNote: group.safetyNote,
});

export function getCommunityGroupBySlug(slug) {
  if (!slugSet.has(slug)) {
    return null;
  }
  return communityGroupsData.find((group) => group.slug === slug) ?? null;
}

export function getCommunityGroupSlugs() {
  return communityGroupsData.map((group) => group.slug);
}

export function getCommunityGroupSlugByName(name) {
  return slugByName[name] ?? null;
}

export const defaultDailyCircleGroup = communityGroupsData[0];
export const groupInfo = pickOverview(defaultDailyCircleGroup);
export const rawDialogues = defaultDailyCircleGroup.dialogues;
