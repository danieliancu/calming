# Audit Prelaunch Public: Calming

Data auditului: 2026-03-17  
Standard folosit: `prelaunch public`  
Stare evaluata: raportata la implementarea reala din repo dupa unificarea centrului de notificari, milestones/repere extinse si hardening-ul deja aplicat pe fluxul specialistilor

## 1. Rezumat executiv

Auditul anterior este acum partial depasit. Concluzia corecta pentru stadiul actual este:

- produsul este credibil si utilizabil pentru demo solid, QA intern si beta public controlat;
- `Notifications` nu mai este zona legacy sau pur demonstrativa; exista centru unificat pentru `user` si `guest`, cu feed server-side + local, citite/necitite, template-uri, CTA-uri si cooldown backend pentru tipurile repetitive;
- `Profile / Repere` nu mai este placeholder; exista milestones reale pentru user si guests, dar catalogul de reguli si acoperirea pe toate actiunile relevante sunt inca partiale;
- exista teste automate vizibile in repo pentru auth, profile, notifications si validarea specialistilor; problema reala nu mai este absenta testelor, ci acoperirea incompleta a fluxurilor cele mai riscante;
- produsul nu este inca pregatit pentru lansare publica larga, in principal din cauza documentelor profesionale expuse pe storage public, a maturitatii insuficiente din `Assistant`, a hardening-ului incomplet pe signin-ul specialistilor si a limitarilor reale din `Appointments`.

Verdict recomandat:

- `beta public controlat`: aproape fezabil dupa inchiderea punctelor P0;
- `lansare publica larga`: inca prematura.

## 2. Frontend / produs

### Ce este solid in acest moment

Aplicatia are o suprafata de produs credibila pentru un MVP serios:

- `Home`, `Learn`, `LearnCategory`, `Article`
- `Community`, `CommunityGroup`, `CommunityConversations`
- `Notifications`, `Profile`, `Journal`, `Settings`
- `Appointments`, `Assistant`, `Psychologists`
- flux separat pentru `Psychologists/Signup`, `Psychologists/Signin`, `Psychologists/MfaChallenge`, `Psychologists/Dashboard`
- flux operational pentru `Superadmin/Dashboard`

Exista UI real, layout coerent, modale, toasts, search local, navigatie Inertia consistenta si conectare rezonabila intre frontend si backend.

### Ce functioneaza end-to-end

- `Learn`, `LearnCategory`, `Article` citesc date reale din DB si afiseaza continut editorial real.
- `Community`, `CommunityGroup` si `CommunityConversations` citesc grupuri reale si aplica restrictii reale de acces.
- mesajele din conversatiile comunitatii se citesc si se scriu prin endpoint-uri active.
- `Journal` functioneaza real pentru user autentificat:
  - quick check-in;
  - intrare completa;
  - listare;
  - stergere.
- `Profile` are fetch/update real pentru profilul extins.
- `Notifications` foloseste un sistem nou, unificat:
  - feed pentru `user` si `guest`;
  - status `read/unread`;
  - sectiune `Citite`;
  - `mark all read`;
  - toggle read/unread;
  - CTA-uri si deep-links;
  - save/reminder pe articole;
  - guest local state;
  - cooldown backend pentru template-urile repetitive.
- `Repere` exista si sunt afisate pentru user si guest.
- `Psychologists` listeaza specialisti reali din DB.
- `Appointments` scrie programari reale in DB si genereaza notificari.
- dashboard-ul de specialist permite:
  - autentificare;
  - verificare email;
  - autentificare in doi pasi;
  - completare formular validare;
  - upload documente;
  - creare/editare/stergere articole;
  - creare/editare/stergere grupuri.
- dashboard-ul de superadmin permite:
  - review validari specialisti;
  - mesaje catre specialist;
  - aprobare articole;
  - administrare categorii;
  - tab dedicat pentru `Notificari`, inclusiv template-uri si overview operational.

### Ce este inca partial, placeholder sau insuficient matur

- `Assistant` este in continuare demo:
  - mesajele nu sunt persistate;
  - submit-ul foloseste inca `window.alert`;
  - interfata exista, dar feature-ul nu trebuie comunicat ca asistent de productie complet.
- `Settings` este in continuare majoritar local-only:
  - tema si toggle-ul de notificari sunt tinute in `localStorage`;
  - pagina nu este conectata real la backend-ul de preferinte;
  - confidentialitate, date si suport raman UI fara workflow real.
- `Appointments` are workflow incomplet pentru productie:
  - nu exista conflict checking intre sloturi;
  - nu exista lock real pe slot;
  - nu exista anulare/reprogramare/confirmare completa;
  - timezone handling nu este tratat serios.
- tratamentul de eroare ramane neuniform intre pagini.

### Verdict frontend

- produsul este credibil pentru demo, QA intern si beta public controlat;
- continutul, jurnalul, profilul, notificarile si comunitatea sunt zonele cele mai mature;
- `Assistant`, `Settings` si `Appointments` raman sub pragul de maturitate necesar pentru lansare publica larga fara restrictii.

## 3. Notifications, profile si repere

### Ce este rezolvat fata de auditul anterior

Zona de notificari nu mai trebuie descrisa ca legacy sau incompleta conceptual:

- modelul vechi bazat pe `notification_templates + user_notifications` nu mai descrie corect starea sistemului;
- exista `notifications` unificat pentru instanta livrata;
- exista template-uri extinse, cu categorie, icon, culoare, CTA si actor target;
- exista feed server-side pentru user si feed local/public combinat pentru guest;
- exista `read`, `read all`, `read/unread toggle`, `Citite` si deduplicare;
- exista reminder-e pe articole, save article si integrare cu milestones;
- exista cooldown backend pentru template-urile repetitive.

Si zona de `Repere` este acum reala:

- userii au milestones persistate in backend;
- guests au milestones locale;
- profilul afiseaza repere reale cu icon, culoare si categorie;
- exista baza functionala pentru sincronizare intre milestones si notifications.

### Ce ramane incomplet

- catalogul de repere nu acopera inca toate cazurile din planul de produs;
- lipsesc unele milestone rules compuse:
  - articole terminate;
  - reveniri lunare;
  - activitate comunitara mai bogata;
  - usage mai matur in `Assistant`.
- guest flows raman locale si limitate:
  - fara sincronizare cross-device;
  - fara analytics/backoffice real;
  - cu acoperire QA inca redusa pe edge cases.

### Verdict notifications / profile

- `Notifications` este deja o suprafata reala de produs;
- `Repere` este functional si vizibil;
- ambele zone mai cer extindere si rafinare, dar nu mai trebuie descrise ca placeholder sau infrastructura lipsa.

## 4. Specialisti, securitate si publicare

### Ce este solid fata de auditul anterior

Zona specialistilor este semnificativ mai buna decat in versiunea initial auditata:

- autentificarea specialistilor foloseste guard Laravel separat (`psychologist`);
- verificarea emailului profesional exista;
- autentificarea in doi pasi exista la login;
- sesiunea specialistului expira daca MFA nu mai este valid;
- publicarea de continut este blocata pana la validarea profesionala aprobata;
- articolele noi sau editate reintra in review;
- grupurile si articolele sunt restrictionate de statusul `approved`.

### Ce riscuri critice raman

#### P0. Documentele profesionale sunt inca pe storage public

Documentele de validare sunt inca uploadate pe `public` disk si salvate cu `disk = public`. Pentru documente profesionale sau identitare, asta ramane blocant pentru lansare publica.

#### P0. Hardening-ul pe signin specialist este incomplet

Fluxul custom de signin specialist nu are inca:

- rate limiting dedicat;
- lockout progresiv;
- audit de tentative esuate;
- observabilitate operationala suficienta.

#### P1. Autorizarea fina ramane ad-hoc

- guard-ul exista si este corect;
- dar regulile de autorizare raman in controllers;
- nu exista set clar de policies/middleware dedicate pentru majoritatea actiunilor specialistului si adminului.

#### P1. Lipseste audit trail operational

Nu exista inca jurnal operational coerent pentru actiuni sensibile, de exemplu:

- login specialist;
- MFA challenge / retry;
- upload documente;
- aprobare/reject in validare;
- publicare sau editare de continut;
- actiuni administrative sensibile.

### Verdict specialisti

Zona specialistilor a facut un pas real spre productie, dar nu este inca gata pentru lansare publica larga atata timp cat:

- documentele profesionale sunt publice;
- hardening-ul de signin este incomplet;
- lipsesc policies clare;
- lipseste audit trail serios.

## 5. Baza de date si arhitectura

### Ce s-a imbunatatit

Schema DB este mai coerenta decat in auditul anterior:

- structurile legacy evidente au fost reduse;
- modelul de notificari este acum coerent si nu mai trebuie descris drept „eventual legacy”;
- milestones, save article si reminder-ele sunt modelate consecvent cu produsul actual;
- cleanup-ul incremental din zona specialistilor si community a redus o parte din dublurile istorice.

### Ce ramane inca mixt sau incomplet aliniat

#### Modele, schema si business logic nu sunt complet aliniate

Mai exista zone unde codul activ si structura aplicatiei merita rationalizare:

- urme de naming istoric in jurul articolelor si jurnalului;
- zone de community cu campuri denormalizate;
- structuri care functioneaza, dar nu sunt inca suficient curatate pentru scaling.

#### Logica critica este inca prea aproape de controller + query builder

- aplicatia functioneaza;
- dar business logic-ul important ramane raspandit in controllers mari;
- asta mareste riscul de inconsistente si face testarea si extinderea mai dificile.

### Verdict DB / arhitectura

- schema DB este functionala si mult mai curata decat in auditul initial;
- problema principala nu mai este reconstructia bazei, ci alinierea, hardening-ul si extragerea logicii din controller-e.

## 6. Teste automate

### Ce exista deja

Nu mai este corect sa se spuna ca „lipsesc teste automate vizibile”. Repo-ul are deja teste feature vizibile pentru:

- auth;
- profile;
- notifications;
- validation / specialisti.

### Ce lipseste inca

Acoperirea este totusi incompleta exact pe fluxurile cu risc mai mare:

- `Appointments`:
  - conflict checking;
  - invalid slot;
  - reschedule/cancel;
  - timezone normalization.
- `Notifications`:
  - guest/local behavior;
  - feed combinat guest/user;
  - cooldown pe template-uri repetitive;
  - edge cases pe read/unread.
- `Community conversations`:
  - restrictii pe grupuri private;
  - acces diferit user vs specialist;
  - posting flows in situatii limita.
- `Specialist hardening`:
  - signin rate limiting;
  - expirare MFA;
  - acces blocat la resurse sensibile fara revalidare;
  - documente indisponibile public.
- `Settings`:
  - persistență backend reala;
  - sincronizare cross-device pentru user.
- `Assistant`:
  - fie persistenta si istoric real;
  - fie acoperire pentru fallback clar `beta/demo`.

### Verdict teste

- baza de testing exista;
- problema reala este lipsa acoperirii pe zonele de lansare publica, nu lipsa absoluta a testelor.

## 7. Prioritizare actuala

### P0 blocante reale de lansare publica

- mutarea documentelor de validare specialist pe storage privat cu access control;
- clarificare publica a statusului `Assistant` sau limitare explicita a expunerii publice;
- hardening real pentru signin-ul specialistilor;
- decizie explicita despre `Appointments`:
  - fie se matureaza la nivel minim de productie;
  - fie se comunica limitat / se reduce expunerea publica.

### P1 importante imediat dupa

- conectarea reala a `Settings` la backend-ul de preferinte;
- policies/middleware dedicate pentru specialisti si superadmin;
- audit trail pentru actiuni profesionale si administrative;
- extinderea reala a catalogului de milestone / notification rules.

### P2 maturizare structurala

- extragerea business logic-ului din controllers in servicii/policies dedicate;
- curatarea modelelor si naming-ului legacy ramase;
- consolidarea guest flows;
- uniformizarea error handling-ului si a feedback-ului UI intre pagini.

## 8. Concluzie executiva

Calming este acum intr-o stare mai buna decat in auditul anterior, iar unele concluzii vechi nu mai sunt factuale:

- `Notifications` este deja o suprafata reala de produs;
- `Repere` exista si functioneaza;
- exista teste automate vizibile;
- DB-ul este mai coerent si mai putin legacy decat in auditul vechi.

Concluzia actualizata de prelaunch public este:

- frontend-ul este avansat si convingator pentru un MVP serios;
- continutul, jurnalul, profilul, notificarile si comunitatea au fluxuri reale si utilizabile;
- zona specialistilor a facut un pas important spre productie prin guard separat, verificare email, MFA de baza si blocarea publicarii pana la aprobare;
- produsul nu este inca complet gata pentru lansare publica larga cat timp documentele profesionale sunt publice, hardening-ul pe signin-ul specialistilor este insuficient, `Assistant` ramane demo si `Appointments` nu are inca workflow de productie complet;
- munca ramasa este in principal de hardening, aliniere si maturizare, nu de reconstructie de baza.
