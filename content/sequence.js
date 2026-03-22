/**
 * Sekwencja poziomów musarowych
 * 
 * Ten plik zawiera definicje poziomów trudności dla ćwiczeń musarowych.
 * Możesz edytować opisy, etykiety i przypisania zadań bez zmiany kodu aplikacji.
 * 
 * Każdy poziom ma:
 *   id       — numer porządkowy (0–5)
 *   label    — krótka etykieta wyświetlana na przycisku
 *   title    — nazwa poziomu
 *   desc     — opis pedagogiczny
 *   axes     — lista trzech osi: ekspozycja, kontrola, intencja
 *   tasks    — lista ID zadań z tasks.json przypisanych do tego poziomu
 *   warn     — (opcjonalne) true jeśli poziom wymaga ostrzeżenia
 */

// eslint-disable-next-line no-unused-vars
const LEVELS = [
  {
    id: 0,
    label: 'Poziom 0',
    title: 'Praca wewnętrzna',
    desc: 'Zanim student wychodzi w teren — uwidocznienie mechanizmu autocenzury w bezpiecznej przestrzeni sali.',
    axes: [
      'ekspozycja: zero',
      'kontrola: pełna',
      'intencja: prywatna'
    ],
    tasks: [],
    /* Zadanie wbudowane — wyświetlane bezpośrednio, bez tasks.json */
    inlineTask: {
      title: 'Zadanie przed wyjściem w teren',
      badgeLabel: 'sala',
      body: 'Pomyśl o jednej rzeczy, którą chciałeś powiedzieć komuś bliskiemu w ostatnim miesiącu, ale nie powiedziałeś. Napisz to zdanie na kartce. Nie musisz jej nikomu pokazywać.',
      reflect: 'Co powstrzymało cię od powiedzenia tego?',
      note_instructor: 'Cel: uwidocznić mechanizm autocenzury zanim student stanie w obliczu zewnętrznego świata. Wielu odkryje, że ich wewnętrzna cenzura jest surowsza niż jakakolwiek zewnętrzna reakcja, której się boją.'
    }
  },
  {
    id: 1,
    label: 'Poziom 1',
    title: 'Krótka ekspozycja',
    desc: 'Krótka ekspozycja, wysoka kontrola, intencja niewidoczna. Apteka Nowardoku — chwila dyskomfortu bez tłumaczenia.',
    axes: [
      'ekspozycja: chwila',
      'kontrola: wysoka',
      'intencja: niewidoczna'
    ],
    tasks: ['M1']
  },
  {
    id: 2,
    label: 'Poziom 2',
    title: 'Przedłużona ekspozycja',
    desc: 'Przedłużona ekspozycja, wysoka kontrola, intencja niewidoczna. Oś czasu — dyskomfort trwa.',
    axes: [
      'ekspozycja: godziny',
      'kontrola: wysoka',
      'intencja: niewidoczna'
    ],
    tasks: ['M2']
  },
  {
    id: 3,
    label: 'Poziom 3',
    title: 'Intencja widoczna',
    desc: 'Krótka ekspozycja, wysoka kontrola, intencja częściowo widoczna. Dziwność jest oczywista — ale student nie tłumaczy.',
    axes: [
      'ekspozycja: chwila',
      'kontrola: wysoka',
      'intencja: częściowa'
    ],
    tasks: ['M3']
  },
  {
    id: 4,
    label: 'Poziom 4',
    title: 'Widoczny znak',
    desc: 'Przedłużona ekspozycja, średnia kontrola, intencja widoczna. Znak trwa przez cały dzień i wymaga wyjaśniania.',
    axes: [
      'ekspozycja: cały dzień',
      'kontrola: średnia',
      'intencja: widoczna'
    ],
    tasks: ['M4']
  },
  {
    id: 5,
    label: 'Poziom 5',
    title: 'Bez siatki',
    desc: 'Przedłużona ekspozycja, niska kontrola, zdanie się na okoliczności. Tylko po zbudowaniu zaufania w grupie.',
    axes: [
      'ekspozycja: godziny',
      'kontrola: niska',
      'intencja: pełna'
    ],
    tasks: ['M5'],
    warn: true
  }
];
