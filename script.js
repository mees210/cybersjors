/* =================================================================
   CYBER-SJORS — script.js
   Vanilla JS, geen frameworks. Inhoud, state-management en alle
   render-logica staan hier samen zodat het overzichtelijk blijft.

   Wil je later echte video's toevoegen? Zoek naar VIDEOLIBRARY
   hieronder: daar staat één centrale plek om video-URL's te
   koppelen aan de placeholders in de pop-ups.
   ================================================================= */

/* ---------------------------------------------------------------
   STATE
   --------------------------------------------------------------- */
const STORAGE_KEY = 'cyberSjorsState_v1';

const defaultState = {
  username: '',
  avatar: '',
  score: 0,
  completedLevels: [],
  malvertisingShown: false,
};

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return Object.assign({}, defaultState);
    const parsed = JSON.parse(raw);
    return Object.assign({}, defaultState, parsed);
  }catch(e){
    return Object.assign({}, defaultState);
  }
}
function saveState(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch(e){ /* opslag niet beschikbaar (bv. privémodus) — gewoon negeren */ }
}

let state = loadState();
let runtime = {};            // tijdelijke schermstate per level, NIET opgeslagen
let selectedAvatar = null;
let sjorsTipIndex = -1;
let sjorsHideTimer = null;

/* ---------------------------------------------------------------
   VIDEOLIBRARY — vul hier later de echte video's in
   ---------------------------------------------------------------
   Voorbeeld: 'l1-uitleg': { src: 'https://jouwserver.nl/videos/l1.mp4' }
   Een lege of ontbrekende sleutel toont automatisch de
   "volgt nog binnenkort"-tekst in de pop-up.
   --------------------------------------------------------------- */
const videoLibrary = {
  // 'l1-uitleg': { src: '' },
};

/* ---------------------------------------------------------------
   AVATARS & SJORS-TIPS
   --------------------------------------------------------------- */
const avatars = ['🦊','🐼','🐧','🦉','🐢','🐬','🦁','🐝','🐙','🦄'];

const sjorsTips = [
  'Twijfel je over een link? Typ het adres dan zelf maar in de browser, in plaats van te klikken.',
  'Een bank, de Belastingdienst of een webshop vraagt je nooit om via een e-mail in te loggen.',
  'Hoe langer en gekker je wachtwoord, hoe langer een computer erover doet om het te raden.',
  'Onbekend nummer, een dringend verhaal, snel geld nodig? Altijd even apart checken voor je iets doet.',
  'Geen idee waar een QR-code naartoe leidt? Niet scannen.',
  'Eén wachtwoord op meerdere plekken gebruiken voelt handig — tot het op één plek lekt en alles openligt.',
  'Een onverwachte pop-up over een "kritieke update"? Dat is bijna altijd nep.',
  'Bij twijfel: even wachten en navragen kost niets. Een verkeerde klik kost soms alles.',
];

/* ---------------------------------------------------------------
   INHOUD — hoofdstukken en levels
   --------------------------------------------------------------- */
const chapters = [
  {
    id: 'h1',
    title: 'Mensen hacken',
    description: 'De makkelijkste weg naar binnen loopt niet via de computer, maar via jou.',
    levelIds: ['l1', 'l2', 't1', 'l3'],
  },
  {
    id: 'h2',
    title: 'Slimme trucs & kwaadaardige bestanden',
    description: 'Een foute klik is zo gemaakt — en daar rekenen criminelen precies op.',
    levelIds: ['l4', 'l5', 'l6', 'l7', 't2'],
  },
  {
    id: 'h3',
    title: 'Geheimschrift door de eeuwen',
    description: 'Voor versleutelde apps bestonden, deden mensen het al eeuwenlang met pen en koppie.',
    levelIds: ['t3', 't4', 't5'],
  },
  {
    id: 'h4',
    title: 'Wachtwoorden veilig bewaren',
    description: 'Hoe een bedrijf jouw wachtwoord zou moeten opslaan — en wat er misgaat als dat niet gebeurt.',
    levelIds: ['t6'],
  },
];

const levels = {

  /* ============================ H1 ============================ */

  l1: {
    id: 'l1', chapterId: 'h1', kind: 'interactive', icon: 'fa-comment-dots',
    nodeTitle: "Bericht van 'Tom'",
    sjorsIntro: 'Dit is een live chatgesprek. Lees rustig mee en kies onderaan wat jij zou doen — er staat geen klok mee te tikken.',
    scenario: {
      type: 'chat',
      eyebrow: 'WhatsApp-gesprek',
      headline: "Een spoedje van 'Tom'",
      lede: 'Je krijgt onderstaand bericht binnen op WhatsApp, van een nummer dat niet in je contacten staat.',
      contact: { name: 'Tom', sub: 'Nieuw, onbekend nummer' },
      messages: [
        { text: 'Hoi, dit is mijn nieuwe nummer — mijn telefoon is net kapot gegaan.' },
        { text: 'Ik moet via een vriend snel €850 overmaken voor een rekening, kun je dat voorschieten? Ik betaal het je morgen meteen terug.' },
        { text: 'Het is nu wel even spannend, zou je het binnen het uur kunnen doen? Sorry voor de haast.' },
      ],
      choices: [
        { label: 'Meteen €850 overmaken naar het rekeningnummer dat je krijgt', outcome: 'wrong',
          feedbackText: 'Dit nummer is niet van Tom — het is iemand die met honderden mensen tegelijk precies dit trucje speelt. Zodra je betaalt, is het geld binnen seconden weg en bijna onmogelijk terug te halen.' },
        { label: 'Het nummer meteen blokkeren, klaar', outcome: 'risky',
          feedbackTitle: 'Niet de slechtste zet, maar...',
          feedbackText: 'Blokkeren voorkomt dat jij erin trapt — knap. Maar je laat zo ook in het midden of er nu écht iets met Tom aan de hand is. Veiliger is om altijd even apart contact te zoeken via een kanaal dat je al kende.' },
        { label: 'Tom bellen op zijn gewone, vertrouwde nummer', outcome: 'correct',
          feedbackTitle: 'Precies goed.',
          feedbackText: 'Door te bellen op het nummer dat je al had, weet je binnen tien seconden of dit klopt. Een echt familielid of vriend neemt op of belt terug; een crimineel verdwijnt.' },
      ],
    },
    theory: {
      accordion: [
        { icon: 'fa-comment-dots', title: 'Waarom dit trucje zo vaak werkt', paragraphs: [
          "Criminelen spelen bewust in op haast en bezorgdheid: een berichtje met 'spoed' en 'familie' zet het verstand even op de achtergrond.",
          'Ze sturen dit bericht naar duizenden nummers tegelijk — het kost ze bijna niets, en het is al genoeg als slechts een paar mensen erin trappen.',
        ], video: { key: 'l1-theory-v1', title: 'Hoe herken je een vriend-in-noodfraude?' } },
        { icon: 'fa-circle-check', title: 'Wat je voortaan altijd doet', paragraphs: [
          'Bel of app op een nummer dat je al had — nooit op het nieuwe nummer dat in het verdachte bericht zelf staat.',
          'Geen tijd om te bellen? Wacht dan liever een paar uur dan dat je blind geld overmaakt. Een echt familielid begrijpt die voorzichtigheid.',
        ] },
      ],
      quiz: {
        question: "Je 'dochter' appt vanaf een nieuw nummer dat ze dringend geld nodig heeft. Wat is de veiligste eerste stap?",
        options: [
          'Het bedrag meteen overmaken, voor de zekerheid',
          'Bellen op het oude, vertrouwde nummer van je dochter',
          'Het gevraagde bedrag verdubbelen om indruk te maken',
          'Het bericht doorsturen naar vrienden om te vragen wat zij ervan vinden',
        ],
        correctIndex: 1,
        feedbackCorrect: 'Precies — even apart verifiëren via een kanaal dat je al vertrouwde, kost een paar seconden en voorkomt heel veel schade.',
        feedbackWrong: 'Toch niet de veiligste route. Bel liever eerst op het oude, bekende nummer van je dochter.',
      },
    },
  },

  l2: {
    id: 'l2', chapterId: 'h1', kind: 'interactive', icon: 'fa-key',
    nodeTitle: 'De wachtwoord-check',
    sjorsIntro: 'Op deze pagina kun je testen hoe sterk een wachtwoord is. Vul gerust iets in en kijk wat er gebeurt.',
    scenario: {
      type: 'password-trap',
      eyebrow: 'Wachtwoord-check',
      headline: 'Test hier de sterkte van je wachtwoord',
      lede: 'Welkom bij WachtwoordCheck.nl. Typ een wachtwoord in het vak en wij laten precies zien hoe sterk het is.',
      inputPlaceholder: 'Typ hier een wachtwoord...',
      questionHeadline: 'Wacht eens even...',
      question: 'Is dit toevallig je échte wachtwoord — hetzelfde dat je ook voor je e-mail of bank gebruikt?',
      choices: [
        { label: 'Ja, dat is mijn echte wachtwoord', outcome: 'wrong',
          feedbackText: "Dit 'check je wachtwoord'-trucje is een klassieke manier om wachtwoorden te verzamelen. Sommige van deze sites slaan precies op wat je intikt — zo lekt je wachtwoord naar de verkeerde mensen, zonder dat er ooit iemand iets heeft 'gehackt' in de echte zin van het woord." },
        { label: 'Nee, ik verzon gewoon iets', outcome: 'correct',
          feedbackTitle: 'Goed gezien.',
          feedbackText: "Een wachtwoordchecker heeft jouw échte wachtwoord helemaal niet nodig om te laten zien hoe sterk wachtwoorden in het algemeen zijn. Verzin voor zo'n test altijd iets los, of gebruik zo'n site gewoon niet." },
      ],
    },
    theory: {
      accordion: [
        { icon: 'fa-globe', title: "Waarom 'wachtwoord checken'-sites link kunnen zijn", paragraphs: [
          'Een wachtwoordchecker heeft geen idee hoe sterk jouw échte wachtwoord is zonder dat jij het intikt — en dat is precies het probleem.',
          'Niet elke site die dit aanbiedt is kwaadaardig, maar je hebt op dat moment geen manier om dat te controleren. Het risico is simpelweg niet nodig.',
        ], video: { key: 'l2-theory-v1', title: 'Wachtwoordcheckers: handig of riskant?' } },
        { icon: 'fa-shield-halved', title: 'Een sterk wachtwoord in drie vuistregels', paragraphs: [
          'Lengte telt zwaarder dan ingewikkeldheid: een lange, makkelijk te onthouden zin is vaak sterker dan een kort en krampachtig wachtwoord.',
          'Gebruik nooit hetzelfde wachtwoord op meerdere plekken — lekt er één, dan liggen ze allebei open.',
          'Een wachtwoordmanager onthoudt het voor je, zodat je het zelf niet meer hoeft te onthouden of te hergebruiken.',
        ] },
      ],
      quiz: {
        question: 'Wat maakt een wachtwoord vooral lastig te raden voor een computer die het systematisch probeert?',
        options: [
          'Een hoofdletter aan het begin',
          'Vooral de lengte van het wachtwoord',
          'Een uitroepteken aan het eind',
          'Het wachtwoord twee keer typen bij het instellen',
        ],
        correctIndex: 1,
        feedbackCorrect: 'Klopt — elke extra letter of teken vermenigvuldigt het aantal mogelijkheden dat geraden moet worden.',
        feedbackWrong: 'Niet de belangrijkste factor. Vooral de lengte van een wachtwoord maakt het raadwerk exponentieel zwaarder.',
      },
    },
  },

  t1: {
    id: 't1', chapterId: 'h1', kind: 'theory', icon: 'fa-user-secret',
    nodeTitle: 'Phishing & social engineering',
    sjorsIntro: 'Dit is een theoriehoofdstuk: geen scenario om in te trappen, maar wel de kennis die je bij elke volgende situatie gaat gebruiken. Klap de onderdelen open in je eigen tempo.',
    theory: {
      accordion: [
        { icon: 'fa-user-secret', title: 'Wat is social engineering?', paragraphs: [
          'Social engineering is het psychologisch bespelen van mensen, in plaats van het technisch kraken van systemen.',
          'De meeste beveiligingsincidenten beginnen niet met slimme code, maar met iemand die overgehaald wordt om toegang of informatie weg te geven.',
        ], video: { key: 't1-v1', title: 'Wat is social engineering?' } },
        { icon: 'fa-envelope-open-text', title: 'De vaste kenmerken van een phishingmail', paragraphs: [
          'Een afzenderadres dat net niet klopt met het echte bedrijf, vaak met een kleine afwijking of een vreemde extensie.',
          'Kunstmatige tijdsdruk of een dreigement: een deadline van een paar uur, of de belofte dat een account anders geblokkeerd wordt.',
          'Een verzoek om via een link in te loggen of te betalen, vaak met een onpersoonlijke aanhef en net iets andere opmaak dan je gewend bent.',
        ] },
        { icon: 'fa-circle-check', title: 'Wat je wel — en nooit — doet', paragraphs: [
          'Log nooit in via een link in een mail of sms. Ga altijd zelf naar de site of app van het bedrijf.',
          'Twijfel je toch? Verifieer het verzoek via een kanaal dat je al vertrouwde, zoals een telefoonnummer dat je al had.',
          'Meld verdachte mail liever dan hem alleen te verwijderen — daarmee help je ook anderen.',
        ] },
      ],
      quiz: {
        question: 'Je krijgt een mail van je bank: "Log binnen 2 uur in via deze link, anders blokkeren we je rekening." Wat doe je?',
        options: [
          'Snel inloggen via de link, voor de zekerheid',
          'De link negeren en zelf inloggen via de site of app van de bank',
          'Wachten en hopen dat het wel meevalt',
          'Antwoorden op de mail om te vragen of het klopt',
        ],
        correctIndex: 1,
        feedbackCorrect: 'Klopt — altijd zelf naar de officiële plek navigeren, nooit via een link in een mail.',
        feedbackWrong: 'Niet de veiligste keuze. Ga in plaats daarvan altijd zelf, los van de mail, naar de site of app van je bank.',
      },
    },
  },

  l3: {
    id: 'l3', chapterId: 'h1', kind: 'interactive', icon: 'fa-envelope-open-text',
    nodeTitle: 'De e-mail van "de Belastingdienst"',
    sjorsIntro: 'Hieronder staat een verdachte mail nagebouwd. Lees hem goed door — klik op alles wat jou niet klopt. Geen aanwijzingen over hoeveel dingen er fout zijn: dat bedenk jij zelf.',
    scenario: {
      type: 'inbox-investigate',
      headline: 'Een herinnering van "de Belastingdienst"',
      lede: 'Klik op elk onderdeel van de mail dat jou verdacht lijkt. Je kunt zoveel of zo weinig onderdelen aanklikken als je wil.',
      zones: [
        { id: 'from',     area: 'meta', label: 'Van',       value: 'belastingdienst-teruggave@bd-overheid-nl.ru',   suspicious: true,  hint: 'Goed gezien! Het domein eindigt op ".ru" — dat is Rusland. De Belastingdienst stuurt altijd mail vanuit @belastingdienst.nl.' },
        { id: 'to',       area: 'meta', label: 'Aan',       value: 'jij@email.nl',                                   suspicious: false, hint: 'Dit is gewoon jouw e-mailadres — hier valt niets op.' },
        { id: 'subject',  area: 'meta', label: 'Onderwerp', value: 'Laatste herinnering: teruggave van €438,29 vervalt', suspicious: false, hint: 'Het klinkt urgent, maar een onderwerp alleen is geen bewijs van fraude. Let ook op de andere onderdelen.' },
        { id: 'greeting', area: 'body', value: 'Geachte heer/mevrouw,',                                               suspicious: false, hint: '"Geachte heer/mevrouw" is onpersoonlijk — een kleine aanwijzing, maar niet genoeg op zichzelf.' },
        { id: 'body1',    area: 'body', value: 'Bij controle van uw belastingaangifte 2025 is gebleken dat u recht heeft op een teruggave van €438,29.',  suspicious: false, hint: 'Een specifiek bedrag wekt vertrouwen — maar dat is precies de truc. Dit onderdeel zelf is niet het probleem.' },
        { id: 'urgency',  area: 'body', value: 'Reageert u niet binnen 2 uur, dan vervalt deze teruggave automatisch en wordt uw dossier opnieuw in behandeling genomen.', suspicious: true, hint: 'Goed gezien! Dit is valse tijdsdruk. Een echte overheidsinstantie geeft je altijd weken de tijd — nooit twee uur. Haast is een klassiek trucje om je snel te laten klikken.' },
        { id: 'body2',    area: 'body', value: 'Bevestig uw gegevens binnen de gestelde termijn via onderstaande link:', suspicious: false, hint: 'Dit verzoek op zich zegt nog niet alles — de link hieronder is het echte probleem.' },
        { id: 'link',     area: 'link', value: 'belastingdienst-mijnaccount.ru/teruggave',                           suspicious: true,  hint: 'Goed gezien! Dit domein eindigt op ".ru" — Rusland, niet Nederland. De officiële Belastingdienst gebruikt altijd belastingdienst.nl.' },
      ],
      suspiciousIds: ['from', 'urgency', 'link'],
      cta: { text: 'Bevestig mijn gegevens' },
      wrongFeedback: 'Dit was een valstrik — deze knop stuurt je naar een nepsite die er professioneel uitziet, maar bedoeld is om je inlog- of bankgegevens te stelen. Zoek eerst de verdachte onderdelen in de mail zelf.',
      correctFeedback: 'Goed speurwerk! De drie valstrikken: een afzenderadres met ".ru" in plaats van ".nl", valse tijdsdruk van twee uur, en een link naar een nepdomein. Door te melden in plaats van te klikken, bescherm je ook anderen.',
    },
    theory: {
      accordion: [
        { icon: 'fa-flag', title: 'Wat je net hebt gedaan', paragraphs: [
          'Je hebt drie klassieke kenmerken van een phishingmail blootgelegd: een afzender die niet klopt, kunstmatige tijdsdruk en een link naar een nepdomein.',
          'Officiële instanties zoals de Belastingdienst communiceren nooit op deze manier — geen dreigende deadlines, geen verzoek om snel via een link in te loggen.',
        ], video: { key: 'l3-theory-v1', title: 'Phishingmail melden: zo doe je dat' } },
        { icon: 'fa-flag-checkered', title: 'Waarom melden net zo belangrijk is als verwijderen', paragraphs: [
          "Door verdachte mails te melden, bijvoorbeeld bij de Fraudehelpdesk of via de 'phishing melden'-knop van je mailprogramma, help je voorkomen dat anderen er wél intrappen.",
        ] },
      ],
      quiz: {
        question: 'Welk van deze kenmerken hoort NIET bij een typische phishingmail?',
        options: [
          'Een afzenderadres dat net niet klopt',
          'Een persoonlijke, rustige toon zonder enige haast',
          'Een dreigende deadline van een paar uur',
          'Een link naar een onbekend of verkeerd gespeld domein',
        ],
        correctIndex: 1,
        feedbackCorrect: 'Klopt — juist een rustige, geduldige toon past niet bij phishing. Criminelen hebben haast nodig om je te laten klikken.',
        feedbackWrong: 'Toch niet. Phishingmails missen juist een rustige, geduldige toon — ze hebben haast nodig om je tot klikken te verleiden.',
      },
    },
  },

  /* ============================ H2 ============================ */

  l4: {
    id: 'l4', chapterId: 'h2', kind: 'interactive', icon: 'fa-qrcode',
    nodeTitle: 'QR-code op de parkeerautomaat',
    sjorsIntro: 'Je staat bij een parkeerautomaat. Lees de situatie en kies wat jij zou doen.',
    scenario: {
      type: 'choice',
      eyebrow: 'Bij de parkeerautomaat',
      headline: 'Sneller betalen? Scan hier!',
      lede: 'Naast het normale betaalscherm van de automaat hangt een los stickertje met een QR-code en de tekst "Sneller betalen? Scan hier!".',
      choices: [
        { label: 'De QR-code scannen en direct je kaartgegevens invullen', outcome: 'wrong',
          feedbackText: 'Dit stickertje is los op de automaat geplakt door een crimineel en leidt naar een nepbetaalpagina. Je parkeergeld gaat zo rechtstreeks naar een vreemde — en je kaartgegevens erbij.' },
        { label: 'Scannen, maar wel eerst de link goed bekijken voor je iets invult', outcome: 'risky',
          feedbackTitle: 'Beter, maar nog niet ideaal.',
          feedbackText: 'Een nepdomein kan verrassend overtuigend ogen, en onder tijdsdruk bij een automaat mis je een typfoutje zo. Veiliger is om losse stickertjes sowieso te negeren.' },
        { label: 'De officiële parkeer-app gebruiken, of gewoon bij de automaat zelf betalen', outcome: 'correct',
          feedbackTitle: 'Precies.',
          feedbackText: 'Officiële betaalmethodes scan je niet via een los geplakt stickertje. Geen automaat of app beschikbaar? Dan is een telefoontje naar de gemeente veiliger dan scannen.' },
      ],
    },
    theory: {
      accordion: [
        { icon: 'fa-qrcode', title: 'Waarom QR-codes zo handig én zo riskant zijn', paragraphs: [
          'Een QR-code laat vooraf niets van de bestemming zien — je scant hem en vertrouwt erop dat het wel goed zal zijn.',
          "Criminelen plakken eigen stickers over of naast officiële codes, op parkeerautomaten, terrasjes en zelfs pakketbonnen. 'Quishing' wordt dit genoemd: phishing via een QR-code.",
        ], video: { key: 'l4-theory-v1', title: 'Quishing: phishing via een QR-code' } },
      ],
      quiz: {
        question: 'Wat is het veiligste om te doen bij een los, opvallend QR-stickertje op een parkeerautomaat?',
        options: [
          'Scannen en zo snel mogelijk betalen',
          'Scannen, en alleen de link goed nalezen voor je iets invult',
          'Niet scannen — de officiële app of de automaat zelf gebruiken',
          'Een foto maken en delen op social media',
        ],
        correctIndex: 2,
        feedbackCorrect: 'Goed — een los geplakt stickertje vermijd je sowieso liever helemaal.',
        feedbackWrong: 'Veiliger is om het stickertje gewoon te negeren en de officiële app of automaat te gebruiken.',
      },
    },
  },

  l5: {
    id: 'l5', chapterId: 'h2', kind: 'interactive', icon: 'fa-file-invoice',
    nodeTitle: 'De factuur-val',
    sjorsIntro: 'Je krijgt een mailtje met een bijlage. Bekijk de situatie rustig en bepaal wat jij zou doen.',
    scenario: {
      type: 'choice',
      eyebrow: 'Je inbox',
      headline: 'Bijlage: Factuur.pdf.exe',
      lede: 'Je krijgt een mail binnen met als onderwerp "Openstaande factuur" en één bijlage: Factuur.pdf.exe.',
      choices: [
        { label: 'De bijlage direct openen om te kijken wat het is', outcome: 'wrong',
          feedbackText: "Achter '.pdf.exe' gaat geen document schuil, maar een uitvoerbaar programma. Eenmaal geopend installeert het zichzelf gewoon — vaak gevolgd door een scherm dat losgeld eist, of stille spionagesoftware op de achtergrond." },
        { label: 'De bijlage doorsturen naar een collega, met de vraag of die hem herkent', outcome: 'risky',
          feedbackTitle: 'Begrijpelijk, maar...',
          feedbackText: 'Zo verspreid je het risico alleen maar verder: opent jouw collega hem, dan is die net zo kwetsbaar. Meld een verdachte bijlage liever bij IT, of verwijder hem gewoon.' },
        { label: 'De bestandsnaam goed bekijken, niets openen, en de mail verwijderen of melden', outcome: 'correct',
          feedbackTitle: 'Goed gezien.',
          feedbackText: "Een extensie als '.exe' na '.pdf' is een rode vlag: het bestand doet zich voor als een onschuldig document, maar is in werkelijkheid een programma." },
      ],
    },
    theory: {
      accordion: [
        { icon: 'fa-file-shield', title: 'Een extensie als verklikker', paragraphs: [
          "Een bestand als 'Factuur.pdf.exe' lijkt een pdf, maar de laatste extensie ('.exe') bepaalt wat het écht is: een uitvoerbaar programma.",
          'Sommige systemen verbergen bekende extensies standaard, waardoor zo\u2019n bestand er nog onschuldiger uitziet dan het is.',
        ], video: { key: 'l5-theory-v1', title: 'Verdachte bijlagen herkennen' } },
      ],
      quiz: {
        question: 'Welk bestandstype zou je het meest moeten laten afgaan bij een onverwachte "factuur" in je mail?',
        options: ['.pdf', '.jpg', '.exe', '.txt'],
        correctIndex: 2,
        feedbackCorrect: "Klopt — '.exe' is een uitvoerbaar programma, geen document.",
        feedbackWrong: "Let vooral op '.exe': dat is een uitvoerbaar programma, geen onschuldig document.",
      },
    },
  },

  t2: {
    id: 't2', chapterId: 'h2', kind: 'theory', icon: 'fa-bug',
    nodeTitle: 'Virussen, Trojans & wormen',
    sjorsIntro: 'Drie soorten kwaadaardige software die nogal eens door elkaar worden gehaald. Hier het verschil — handig voor de volgende keer dat je twijfelt over een bijlage.',
    theory: {
      accordion: [
        { icon: 'fa-bug', title: 'Het verschil tussen een virus, een Trojaans paard en een worm', paragraphs: [
          'Een virus heeft een gastbestand en een actie van de gebruiker nodig om zich te verspreiden — denk aan het openen van een besmette bijlage.',
          'Een Trojaans paard doet zich voor als iets nuttigs of begeerlijks, terwijl het op de achtergrond stiekem schade aanricht.',
          'Een worm verspreidt zichzelf automatisch over een netwerk, zonder dat een gebruiker er iets voor moet doen.',
        ], video: { key: 't2-v1', title: 'Virus, Trojan of worm: het verschil' } },
        { icon: 'fa-network-wired', title: 'Wat een botnet is', paragraphs: [
          'Een botnet is een groot netwerk van besmette apparaten — vaak zonder dat de eigenaren het weten — die op afstand samen worden aangestuurd, bijvoorbeeld om een grote aanval uit te voeren.',
        ] },
        { icon: 'fa-shield-halved', title: 'Hoe je besmetting voorkomt', paragraphs: [
          'Wees voorzichtig met onverwachte bijlagen en links, controleer bestandsextensies, en houd software up-to-date.',
          'Schakel beveiligingswaarschuwingen niet zomaar uit om "even snel" iets te kunnen openen.',
        ] },
      ],
      quiz: {
        question: 'Welke van deze drie verspreidt zichzelf automatisch over een netwerk, zonder dat iemand er iets voor moet doen?',
        options: ['Virus', 'Trojaans paard', 'Worm', 'Phishingmail'],
        correctIndex: 2,
        feedbackCorrect: 'Klopt — een worm heeft geen menselijke actie nodig om zich te verspreiden.',
        feedbackWrong: 'Niet helemaal. Een worm is degene die zichzelf automatisch verspreidt, zonder hulp van een gebruiker.',
      },
    },
  },

  /* ============================ H3 ============================ */

  t3: {
    id: 't3', chapterId: 'h3', kind: 'theory', icon: 'fa-feather-pointer',
    nodeTitle: 'Verstoppen & verschuiven',
    sjorsIntro: 'Voor het internet bestond, versleutelden mensen al eeuwenlang berichten — met inkt, rasters en een beetje rekenwerk. Puur theorie, lekker rustig doorlezen.',
    theory: {
      accordion: [
        { icon: 'fa-droplet', title: 'Steganografie: een boodschap verstoppen', paragraphs: [
          'Steganografie verstopt niet de inhoud van een bericht, maar het bestaan ervan: alleen wie weet waar te kijken, vindt het.',
          'Een klassiek voorbeeld is onzichtbare inkt (zoals citroensap), die alleen leesbaar wordt als de brief wordt verhit. De moderne variant verstopt data binnen een gewoon ogend bestand, zoals een afbeelding.',
        ], video: { key: 't3-v1', title: 'Steganografie: berichten verstoppen' } },
        { icon: 'fa-shuffle', title: 'Transpositie: dezelfde letters, andere volgorde', paragraphs: [
          'Bij transpositie verander je niets aan de letters zelf, maar wel aan hun volgorde.',
          'Een eenvoudig voorbeeld: splits een zin in de letters op even posities en de letters op oneven posities, en schrijf die als twee losse reeksen op. Wie het trucje kent, kan het zo weer omdraaien.',
        ] },
        { icon: 'fa-shapes', title: 'Substitutie: de Pigpen-cipher en het cijfer van Caesar', paragraphs: [
          'Substitutie vervangt elke letter door een ander teken volgens een vaste regel die afzender en ontvanger samen kennen.',
          'De Pigpen-cipher gebruikt een raster waarin elke letter een eigen meetkundig symbool krijgt.',
          'Het cijfer van Caesar schuift het hele alfabet een vast aantal plekken op: bij een verschuiving van 3 wordt de A bijvoorbeeld een D.',
        ] },
      ],
      quiz: {
        question: 'Bij het cijfer van Caesar verschuif je het hele alfabet met een vast aantal plekken. Als de verschuiving "2" is, waar wordt de letter A dan?',
        options: ['B', 'C', 'Z', 'D'],
        correctIndex: 1,
        feedbackCorrect: 'Klopt — twee plekken opschuiven vanaf de A geeft de C.',
        feedbackWrong: 'Tel het nog eens na: twee plekken vanaf de A in het alfabet komt uit op de C.',
      },
    },
  },

  t4: {
    id: 't4', chapterId: 'h3', kind: 'theory', icon: 'fa-puzzle-piece',
    nodeTitle: 'Code kraken',
    sjorsIntro: 'Hoe kraak je een geheimschrift zonder de sleutel te kennen? Met geduld, statistiek — en uiteindelijk de eerste computer ooit.',
    theory: {
      accordion: [
        { icon: 'fa-chart-column', title: 'Eén vaste vervanging is te kraken: frequentieanalyse', paragraphs: [
          'Bij een monoalfabetische substitutie staat altijd vast welke letter een andere letter wordt. Daardoor blijft de natuurlijke frequentie van letters in een taal zichtbaar.',
          "In het Nederlands is de 'e' bijvoorbeeld veruit de meest voorkomende letter. Door te tellen hoe vaak elk symbool in een versleuteld bericht voorkomt en dat te vergelijken met die bekende frequenties, kun je de vervangingen langzaam achterhalen.",
        ], video: { key: 't4-v1', title: 'Frequentieanalyse: een geheimschrift kraken' } },
        { icon: 'fa-table-cells', title: 'Polyalfabetische verwarring: het cijfer van Vigenère', paragraphs: [
          'In plaats van één vaste verschuiving gebruikt het cijfer van Vigenère een herhaald sleutelwoord, waardoor de verschuiving per letter verschilt.',
          'Hierdoor kan dezelfde letter uit de oorspronkelijke tekst telkens als een ander symbool verschijnen, wat eenvoudige frequentieanalyse onbruikbaar maakt.',
        ] },
        { icon: 'fa-gears', title: 'De Enigma-machine en de Bombe van Turing', paragraphs: [
          'De Enigma was een mechanisch-elektrische versleutelmachine die door het Duitse leger in de Tweede Wereldoorlog werd gebruikt, met meerdere rotoren en een stekkerbord die samen een enorm aantal mogelijke instellingen opleverden.',
          'De Brit Alan Turing ontwikkelde een machine, de "Bombe", die misbruik maakte van een voorspelbare gewoonte van Duitse operators: berichten altijd op dezelfde manier afsluiten. Daardoor kon de dagelijkse instelling vaak binnen ongeveer twintig minuten gevonden worden.',
          'Historici schatten dat dit de oorlog met zo\u2019n twee jaar heeft verkort. De Bombe wordt vaak gezien als een van de eerste computers ooit.',
        ] },
      ],
      quiz: {
        question: 'Wat maakte het cijfer van Vigenère lastiger te kraken dan een simpel cijfer van Caesar?',
        options: [
          'Het gebruikte cijfers in plaats van letters',
          'Dezelfde letter in de oorspronkelijke tekst kon door een herhaald sleutelwoord telkens anders verschijnen',
          'Het werd alleen mondeling doorgegeven',
          'Er was geen sleutel voor nodig',
        ],
        correctIndex: 1,
        feedbackCorrect: 'Klopt — daardoor werkte een simpele frequentieanalyse niet meer.',
        feedbackWrong: 'Niet helemaal. De kracht zat in het herhaalde sleutelwoord, waardoor dezelfde letter telkens anders versleuteld kon worden.',
      },
    },
  },

  t5: {
    id: 't5', chapterId: 'h3', kind: 'theory', icon: 'fa-lock',
    nodeTitle: 'Digitale sloten',
    sjorsIntro: 'Dit is de stap van potlood-en-papier naar bits. Hoe vergrendel je iets digitaal — en wie heeft daar straks de sleutel toe nodig?',
    theory: {
      accordion: [
        { icon: 'fa-code-compare', title: 'XOR: de digitale basisbewerking', paragraphs: [
          'XOR is een bewerking die twee bits vergelijkt en alleen een 1 oplevert wanneer ze van elkaar verschillen.',
          'Een handige eigenschap van XOR is dat hij zichzelf ongedaan maakt: pas je dezelfde sleutel twee keer toe, dan krijg je het origineel terug. Dat maakt XOR een eenvoudige bouwsteen voor digitale versleuteling.',
        ], video: { key: 't5-v1', title: 'XOR-versleuteling uitgelegd' } },
        { icon: 'fa-key', title: 'Symmetrisch versus asymmetrisch versleutelen', paragraphs: [
          'Bij symmetrische encryptie vergrendelt en ontgrendelt één gedeelde sleutel het bericht — eenvoudig, maar riskant: onderschept iemand de sleutel, dan ligt alles open.',
          'Bij asymmetrische encryptie gebruik je een wiskundig gekoppeld sleutelpaar: de publieke sleutel versleutelt, en alleen de bijbehorende privésleutel kan ontsleutelen. De publieke sleutel mag vrij gedeeld worden, zonder dat dit de beveiliging in gevaar brengt.',
        ] },
        { icon: 'fa-square-root-variable', title: 'RSA: een digitale weg met maar één richting', paragraphs: [
          'RSA steunt op wiskundige eenrichtingsfuncties: in de ene richting makkelijk te berekenen, maar in de andere richting — zonder de juiste sleutel — extreem lastig om terug te draaien.',
          'De methode is genoemd naar de drie uitvinders: Rivest, Shamir en Adleman.',
        ] },
        { icon: 'fa-certificate', title: 'Certificaten, man-in-the-middle en quantum computing', paragraphs: [
          'Een certificaat, uitgegeven door een vertrouwde autoriteit, bewijst dat de publieke sleutel van een website daadwerkelijk bij die website hoort. Dit beschermt tegen een man-in-the-middle-aanvaller die ongezien het verkeer tussen twee partijen onderschept of aanpast.',
          'Quantumcomputers vormen op de langere termijn een bedreiging: door hun fundamenteel andere manier van rekenen (met qubits) zouden ze in theorie veel sneller door huidige versleuteling heen kunnen breken, wat onderzoek naar nieuwe, quantumbestendige methodes nu al aanjaagt.',
        ] },
      ],
      quiz: {
        question: 'Wat is het grote voordeel van asymmetrische encryptie ten opzichte van symmetrische?',
        options: [
          'Het is altijd sneller',
          'Je kunt de publieke sleutel vrij delen zonder dat dit de beveiliging in gevaar brengt',
          'Er is geen sleutel nodig',
          'Het werkt alleen offline',
        ],
        correctIndex: 1,
        feedbackCorrect: 'Klopt — de publieke sleutel mag iedereen weten, alleen de privésleutel moet geheim blijven.',
        feedbackWrong: 'Niet helemaal. Het grote voordeel is dat je de publieke sleutel vrij mag delen, zonder dat dit de beveiliging schaadt.',
      },
    },
  },

  /* ============================ H4 ============================ */

  t6: {
    id: 't6', chapterId: 'h4', kind: 'theory', icon: 'fa-fingerprint',
    nodeTitle: 'Hashing, salt & pepper',
    sjorsIntro: 'Hoe zou jouw wachtwoord eigenlijk opgeslagen moeten worden door een bedrijf waar je een account hebt? Niet zoals jij het intypt, in elk geval.',
    theory: {
      accordion: [
        { icon: 'fa-fingerprint', title: 'Wat hashing is', paragraphs: [
          'Hashing is een eenrichtings-wiskundige functie die een wachtwoord omzet in een vaste, onleesbare reeks tekens.',
          'Dezelfde invoer levert altijd dezelfde hash op, maar een hash is niet terug te rekenen naar het oorspronkelijke wachtwoord. Een zorgvuldig ingericht systeem slaat daarom nooit het wachtwoord zelf op, alleen de hash.',
        ], video: { key: 't6-v1', title: 'Hashing, salt en pepper uitgelegd' } },
        { icon: 'fa-table-list', title: 'Rainbow tables: de zwakte van platte hashing', paragraphs: [
          'Aanvallers berekenen vooraf enorme tabellen met veelgebruikte wachtwoorden en hun bijbehorende hashes, een "rainbow table".',
          'Daarmee kunnen ze een gestolen hash direct opzoeken in plaats van hem te moeten kraken — met als gevolg dat populaire wachtwoorden overal dezelfde, voorspelbare hash opleveren.',
        ] },
        { icon: 'fa-mortar-pestle', title: 'Salt: een snufje toeval per wachtwoord', paragraphs: [
          'Salt is een unieke, willekeurige waarde die voor elk wachtwoord apart wordt toegevoegd, vóór het hashen.',
          'Twee mensen met exact hetzelfde wachtwoord krijgen daardoor toch twee volledig verschillende hashes — waardoor een vooraf berekende rainbow table niets meer oplevert.',
        ] },
        { icon: 'fa-pepper-hot', title: 'Pepper, keyloggers, IP-adressen en poorten', paragraphs: [
          'Pepper is net als salt een extra waarde, maar dan over de hele database heen toegepast en apart van elk wachtwoord opgeslagen — een gestolen database alleen is dan niet genoeg om er iets mee te doen.',
          'Een keylogger is software die in het geheim elke toetsaanslag vastlegt — precies waarom een sterk opgeslagen wachtwoord geen verdediging is tegen een al besmet apparaat.',
          'IP-adressen en poorten zijn de technische "adressen" waarmee computers elkaar online vinden; poort 80 is bijvoorbeeld de standaard voor normaal websiteverkeer.',
        ] },
      ],
      quiz: {
        question: 'Waarom helpt "salt" tegen een rainbow table-aanval?',
        options: [
          'Salt maakt het wachtwoord langer',
          'Salt zorgt dat twee identieke wachtwoorden toch een andere hash krijgen, waardoor een vooraf berekende tabel niet meer werkt',
          'Salt verstuurt het wachtwoord versleuteld',
          'Salt is een ander woord voor wachtwoord',
        ],
        correctIndex: 1,
        feedbackCorrect: 'Klopt — daardoor heeft een aanvaller geen bruikbare vooraf berekende tabel meer.',
        feedbackWrong: 'Niet helemaal. Salt zorgt er vooral voor dat identieke wachtwoorden tóch verschillende hashes krijgen.',
      },
    },
  },

  l6: {
    id: 'l6', chapterId: 'h2', kind: 'interactive', icon: 'fa-heart-crack',
    nodeTitle: 'Datingfraude',
    sjorsIntro: 'Je hebt een nieuw profiel gevonden op een datingapp. Lees het gesprek dat zich ontvouwt — en let op wanneer er iets niet klopt.',
    scenario: {
      type: 'dating-sim',
      profile: {
        emoji: '👩',
        name: 'Lisa',
        age: 36,
        location: 'Utrecht (nu tijdelijk in Abu Dhabi)',
        job: 'Verpleegkundige',
        bio: 'Avontuurlijk, eerlijk en op zoek naar een echte connectie. Ik werk nu tijdelijk in het buitenland, maar mijn hart ligt in Nederland. Hou van reizen, koken en goede gesprekken.',
        interests: ['Reizen ✈️', 'Koken 🍳', 'Fotografie 📷', 'Yoga 🧘'],
      },
      stages: [
        {
          id: 'week1',
          label: '📱 Dag 1 — jij stuurt het eerste berichtje',
          messages: [
            { from: 'lisa', text: 'Hee! Wat leuk dat je reageert 😊 Hoe is jouw dag?' },
            { from: 'lisa', text: 'Ik moet zeggen — jouw profiel springt er echt uit. Je lijkt iemand met diepgang.' },
            { from: 'lisa', text: 'Ik ben nu in Abu Dhabi voor een tijdelijk contract als verpleegkundige. Ik mis Nederland zo. Heb jij ook weleens in het buitenland gewoond?' },
          ],
          userReply: 'Leuk! Nee, ik ben altijd in Nederland gebleven. Maar ik hoor wel graag hoe dat is!',
          ctaText: 'Twee weken verder →',
        },
        {
          id: 'week2',
          label: '📱 Twee weken later — jullie chatten elke dag',
          messages: [
            { from: 'lisa', text: 'Goedemorgen! Ik dacht meteen aan jou toen ik wakker werd 😊' },
            { from: 'lisa', text: 'Eerlijk gezegd voel ik me hier zo eenzaam. Mijn collega\'s hier zijn niet echt vriendelijk. Jij bent de enige met wie ik echt kan praten ❤️' },
            { from: 'lisa', text: 'Ik word zo gelukkig van onze gesprekken. Is dat raar na zo\'n korte tijd?' },
            { from: 'lisa', text: 'Mag ik je WhatsApp-nummer? Ik wil liever niet op de datingapp chatten. Ik wil je stem zo graag horen 🙏' },
          ],
          userReply: 'Dat gevoel heb ik ook. Hier is mijn nummer...',
          ctaText: 'Nog een week later →',
        },
        {
          id: 'ask',
          label: '📱 Drie weken later — jullie spreken elkaar elke dag',
          messages: [
            { from: 'lisa', text: 'Lieverd... Ik moet je iets heel moeilijks vragen en ik schaam me er zo voor...' },
            { from: 'lisa', text: 'Mijn bankpas is hier geblokkeerd. Ik kan niet betalen voor eten, laat staan voor mijn vliegticket terug. Ik zit hier echt vast.' },
            { from: 'lisa', text: 'Zou jij me €500 kunnen overmaken? Ik betaal je zodra ik terug ben dubbel terug — dat beloof ik op mijn leven. Ik wil je zo graag zien 🙏❤️' },
          ],
          choices: [
            { label: '€500 overmaken — ze heeft je nog nooit iets misdaan', outcome: 'wrong',
              feedbackText: 'Dit is datingfraude. "Lisa" bestaat niet — het is een oplichter die tegelijk met honderden mensen exact dit gesprek heeft gevoerd. Zodra je betaalt, verdwijnen ze. De gevoelens leken echt, maar de persoon niet.' },
            { label: 'Voorstellen eerst even te videobellen voor je een beslissing maakt', outcome: 'correct',
              feedbackTitle: 'Slim en voorzichtig.',
              feedbackText: 'Een echte persoon kan altijd videobellen. Iemand die echt om je geeft, begrijpt dat je dit wil checken. De oplichter zal zeggen dat de camera kapot is of het internet te slecht — en dan weet je genoeg.' },
            { label: 'Zeggen dat je het geld helaas niet hebt', outcome: 'risky',
              feedbackTitle: 'Begrijpelijk, maar niet veilig.',
              feedbackText: 'Een doorgewinterde oplichter geeft niet zo snel op. Ze vragen een kleiner bedrag of bedenken een nieuw verhaal. Videobellen is de échte test — niemand die echt in nood zit, weigert dat consequent.' },
          ],
        },
      ],
    },
    theory: {
      accordion: [
        { icon: 'fa-heart-crack', title: 'Waarom datingfraude werkt', paragraphs: [
          'Criminelen spelen niet op paniek, maar op gevoelens. Ze nemen weken de tijd, bouwen vertrouwen op, en vragen dan om hulp — op het moment dat je het minst argwaan hebt.',
          'Ze gebruiken gestolen profielfoto\'s of AI-gegenereerde beelden. Soms voeren ze tegelijk gesprekken met honderden mensen via scripts.',
        ], video: { key: 'l6-theory-v1', title: 'Datingfraude herkennen' } },
        { icon: 'fa-video', title: 'De videobel-test', paragraphs: [
          'Een oplichter kan niet live op beeld komen als ze gestolen of AI-gegenereerde foto\'s gebruiken. Stel ALTIJD voor te videobellen — vóór je ook maar een euro geeft.',
          'Excuses zoals "mijn camera is kapot" of "het internet is hier te slecht" zijn bijna altijd een teken dat er iets niet klopt.',
        ] },
        { icon: 'fa-circle-check', title: 'Signalen die je herkent', paragraphs: [
          'Iemand die zegt verliefd te zijn na een paar weken, die nooit kan videobellen, en die plotseling geld nodig heeft: dat is het patroon.',
          'Vertrouw je gevoel als iets te mooi voelt om waar te zijn — en bespreek het altijd met iemand die je vertrouwt.',
        ] },
      ],
      quiz: {
        question: 'Wat is de beste manier om snel te controleren of iemand op een datingapp echt is wie ze zeggen te zijn?',
        options: [
          'Meer foto\'s vragen',
          'Een videogesprek voorstellen voor je geld geeft',
          'Hun adres opvragen',
          'Wachten tot ze zelf om geld vragen',
        ],
        correctIndex: 1,
        feedbackCorrect: 'Klopt — een echte persoon kan altijd videobellen. Iemand die dat consequent weigert, is vrijwel zeker een oplichter.',
        feedbackWrong: 'Videobellen is de enige echte check — foto\'s en adressen zijn makkelijk te vervalsen.',
      },
    },
  },

  l7: {
    id: 'l7', chapterId: 'h2', kind: 'interactive', icon: 'fa-phone-slash',
    nodeTitle: 'Bankhelpdeskfraude',
    sjorsIntro: 'Je telefoon gaat. Kijk wie er belt en beslis wat je doet — luister dan naar het gesprek.',
    scenario: {
      type: 'phone-sim',
      ringing: {
        caller: 'ING Bank',
        number: '020 228 9800',
      },
      call: {
        transcript: [
          { who: 'Beller', text: 'Goedemiddag, u spreekt met Bas Vermeer van de afdeling Veiligheidszaken van ING Bank. Wij hebben zojuist ongebruikelijke activiteiten gedetecteerd op uw rekening — dit is dringend.' },
          { who: 'Beller', highlight: true, text: '"Om uw account direct te beveiligen moeten we uw identiteit bevestigen. Kunt u uw pincode drie keer na elkaar inspreken? Dit is onze standaard verificatieprocedure."' },
        ],
        choices: [
          { label: 'Je pincode geven — het klinkt officieel en dringend', outcome: 'wrong',
            feedbackText: 'Je bank vraagt je nooit om je pincode — niet via telefoon, chat of e-mail. Dit is bankhelpdeskfraude: criminelen doen zich voor als de bank om je pincode en gegevens te stelen. Zodra ze die hebben, plunderen ze je rekening.' },
          { label: 'Het gesprek beëindigen en zelf de bank bellen via het nummer op je bankpas of banksite', outcome: 'correct',
            feedbackTitle: 'Precies goed.',
            feedbackText: 'Een echte bank vraagt nooit om je pincode. Door zelf te bellen — op het nummer dat jij al kende — verifieer je of er echt iets aan de hand is, zonder dat jij je gegevens blootgeeft.' },
          { label: 'Vragen naar zijn naam en medewerkersnummer, dan pas meegaan', outcome: 'risky',
            feedbackTitle: 'Alert, maar niet veilig.',
            feedbackText: 'Criminelen hebben goede verhalen klaar, inclusief verzonnen namen en nummers. Geen enkele echte bankmedewerker vraagt ooit om je pincode — ongeacht hoe overtuigend ze klinken.' },
        ],
      },
    },
    theory: {
      accordion: [
        { icon: 'fa-phone-slash', title: 'Bankhelpdeskfraude / Skimming', paragraphs: [
          'Criminelen bellen je op en stellen zich voor als je bank, vaak met een voorprogrammeerde robot die je nam noemt en alarmeert over "onveilige activiteiten".',
          'Doel: je PIN, rekeningnummer of twee-factor-verificatiecodes uit je mond krijgen. Zodra ze die hebben, hebben ze toegang.',
        ], video: { key: 'l7-theory-v1', title: 'Bankfraude via telefoontjes' } },
        { icon: 'fa-shield-halved', title: 'Gouden regel', paragraphs: [
          'Je bank vraagt je nooit om je PIN, pincode of OTP (eenmalige codes) per telefoon, chat of e-mail.',
          'Hang op en bel zelf je bank via het nummer op je bankpas of website — niet via het nummer dat jij net hebt ontvangen.',
        ] },
      ],
      quiz: {
        question: 'Wat zal een echt bankedewerker jou NOOIT via telefoon vragen?',
        options: [
          'Je rekeningnummer',
          'Je PIN',
          'Je inlognaam',
          'Je adres ter verificatie',
        ],
        correctIndex: 1,
        feedbackCorrect: 'Klopt — je PIN blijft altijd privé.',
        feedbackWrong: 'Je PIN zal een echte bankmedewerker nooit vragen via de telefoon.',
      },
    },
  }
};

const levelOrder = chapters.reduce((acc, c) => acc.concat(c.levelIds), []);

/* ---------------------------------------------------------------
   AUDIO — Web Audio API, geen externe bestanden
   --------------------------------------------------------------- */
const Sfx = (() => {
  let ctx;
  function getCtx(){
    if(!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if(ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, start, duration, type, peakGain){
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, c.currentTime + start);
    gain.gain.setValueAtTime(0.0001, c.currentTime + start);
    gain.gain.linearRampToValueAtTime(peakGain || 0.16, c.currentTime + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + duration);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(c.currentTime + start);
    osc.stop(c.currentTime + start + duration + 0.05);
  }
  return {
    click(){ try{ tone(740, 0, 0.07, 'square', 0.07); }catch(e){} },
    success(){ try{ tone(523.25,0,0.12,'sine',0.16); tone(659.25,0.1,0.16,'sine',0.16); tone(783.99,0.22,0.22,'sine',0.18); }catch(e){} },
    fail(){ try{ tone(330,0,0.16,'sawtooth',0.11); tone(220,0.14,0.22,'sawtooth',0.11); }catch(e){} },
    hacked(){ try{ tone(180,0,0.2,'sawtooth',0.16); tone(140,0.16,0.22,'sawtooth',0.17); tone(90,0.34,0.32,'sawtooth',0.19); }catch(e){} },
  };
})();

/* ---------------------------------------------------------------
   KLEINE HELPERS
   --------------------------------------------------------------- */
function esc(str){
  return String(str).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function escAttr(str){ return String(str).replace(/"/g, '&quot;'); }
function sjorsLine(text){
  return `<div class="sjors-line"><span class="sjors-line-icon"><i class="fa-solid fa-shield-halved"></i></span><p>${text}</p></div>`;
}
function chapterNumberOf(chapterId){ return chapters.findIndex(c => c.id === chapterId) + 1; }
function headerEyebrowFor(level){
  if(level.kind === 'theory') return `Theorie — hoofdstuk ${chapterNumberOf(level.chapterId)}`;
  const n = levelOrder.filter(id => levels[id].kind === 'interactive').indexOf(level.id) + 1;
  return `Level ${n} — in de praktijk`;
}
function isLevelUnlocked(id){
  const idx = levelOrder.indexOf(id);
  if(idx <= 0) return true;
  return state.completedLevels.includes(levelOrder[idx - 1]);
}
function showToast(text, icon){
  const root = document.getElementById('toast-root');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<i class="fa-solid ${icon || 'fa-circle-info'}"></i><span>${text}</span>`;
  root.appendChild(el);
  setTimeout(() => { el.remove(); }, 3400);
}
function closeOverlay(){
  document.getElementById('popup-root').innerHTML = '';
}

/* ---------------------------------------------------------------
   SCHERM-NAVIGATIE
   --------------------------------------------------------------- */
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('is-active'));
  document.getElementById(id).classList.add('is-active');
  window.scrollTo({ top: 0 });
}
function goToDashboard(){
  showScreen('screen-dashboard');
  renderDashboard();
}
function goToLevel(id){
  if(!isLevelUnlocked(id) && !state.completedLevels.includes(id)){
    Sfx.click();
    showToast('Rond eerst de vorige onderdelen af.', 'fa-lock');
    return;
  }
  const level = levels[id];
  state.currentLevelId = id;
  runtime = { stage: level.kind === 'theory' ? 'theory' : 'scenario' };
  document.getElementById('level-eyebrow').textContent = headerEyebrowFor(level);
  document.getElementById('level-title').textContent = level.nodeTitle;
  showScreen('screen-level');
  renderLevelMain();
}
function goToCertificate(){
  document.getElementById('cert-avatar').textContent = state.avatar;
  document.getElementById('cert-name').textContent = state.username;
  document.getElementById('cert-date').textContent = new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  showScreen('screen-certificate');
}

/* ---------------------------------------------------------------
   AANMELDSCHERM
   --------------------------------------------------------------- */
function renderAvatarGrid(){
  const grid = document.getElementById('avatar-grid');
  grid.innerHTML = avatars.map(a => `<button type="button" class="avatar-option" data-avatar="${a}" role="radio" aria-checked="false">${a}</button>`).join('');
  grid.querySelectorAll('.avatar-option').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedAvatar = btn.getAttribute('data-avatar');
      grid.querySelectorAll('.avatar-option').forEach(b => { b.classList.remove('is-selected'); b.setAttribute('aria-checked', 'false'); });
      btn.classList.add('is-selected');
      btn.setAttribute('aria-checked', 'true');
      Sfx.click();
      updateLoginSubmitState();
    });
  });
}
function updateLoginSubmitState(){
  const nameVal = document.getElementById('name-input').value.trim();
  document.getElementById('login-submit').disabled = !(nameVal.length > 0 && selectedAvatar);
}
function resetLoginForm(){
  selectedAvatar = null;
  document.getElementById('name-input').value = '';
  document.querySelectorAll('.avatar-option').forEach(b => { b.classList.remove('is-selected'); b.setAttribute('aria-checked', 'false'); });
  updateLoginSubmitState();
}
function wireLogin(){
  const form = document.getElementById('login-form');
  document.getElementById('name-input').addEventListener('input', updateLoginSubmitState);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    state.username = document.getElementById('name-input').value.trim();
    state.avatar = selectedAvatar;
    saveState();
    Sfx.click();
    showScreen('screen-dashboard');
    renderDashboard();
    showSjorsTip(`Welkom, ${state.username}. Onder elkaar zie je de route met alle onderdelen — werk ze van boven naar onder af, ik spring overal tussendoor met een tip.`);
  });
}

/* ---------------------------------------------------------------
   DASHBOARD / ROUTEKAART
   --------------------------------------------------------------- */
function updateHeaderProgress(){
  const total = levelOrder.length;
  const done = state.completedLevels.length;
  document.getElementById('progress-fill').style.width = (total ? (done / total * 100) : 0) + '%';
  document.getElementById('progress-label').textContent = `${done} / ${total} voltooid`;
}
function dashboardIntroHtml(){
  const done = state.completedLevels.length;
  const total = levelOrder.length;
  let text;
  if(done === 0){
    text = `Welkom, ${esc(state.username)}. Hieronder zie je de route: elk bolletje is een situatie of een stukje uitleg. Werk ze van boven naar onder af — een volgend onderdeel gaat pas open zodra het vorige is afgerond.`;
  } else if(done === total){
    text = 'Je hebt alle onderdelen doorlopen. Onderaan de route wacht je Cyber-Rijbewijs.';
  } else {
    text = `Goed bezig — ${done} van de ${total} onderdelen staan al op groen. Ga verder waar je gebleven was.`;
  }
  return sjorsLine(text);
}
function renderRoadmap(){
  let html = '';
  chapters.forEach((chapter, ci) => {
    html += `<div class="chapter-divider">
      <p class="chapter-divider-eyebrow">Hoofdstuk ${ci + 1}</p>
      <h2>${chapter.title}</h2>
      <p>${chapter.description}</p>
    </div>`;
    chapter.levelIds.forEach(id => {
      const level = levels[id];
      const completed = state.completedLevels.includes(id);
      const unlocked = completed || isLevelUnlocked(id);
      const classes = ['level-node'];
      if(level.kind === 'theory') classes.push('is-theory');
      if(!unlocked) classes.push('is-locked');
      if(completed) classes.push('is-completed');
      const statusIcon = completed ? 'fa-circle-check' : (!unlocked ? 'fa-lock' : 'fa-chevron-right');
      html += `<div class="${classes.join(' ')}" data-level-id="${id}">
        <span class="node-icon"><i class="fa-solid ${level.icon}"></i></span>
        <span class="node-text">
          <span class="node-kind">${level.kind === 'theory' ? 'Theorie' : 'Praktijk'}</span>
          <span class="node-title">${level.nodeTitle}</span>
        </span>
        <span class="node-status"><i class="fa-solid ${statusIcon}"></i></span>
      </div>`;
    });
  });
  const allDone = state.completedLevels.length === levelOrder.length;
  html += `<div class="chapter-divider">
      <p class="chapter-divider-eyebrow">Tot slot</p>
      <h2>Cyber-Rijbewijs</h2>
      <p>Rond alle onderdelen af om je persoonlijke rijbewijs te ontvangen.</p>
    </div>
    <div class="level-node is-theory ${allDone ? 'is-completed' : 'is-locked'}" data-certificate="1">
      <span class="node-icon"><i class="fa-solid fa-id-card"></i></span>
      <span class="node-text">
        <span class="node-kind">Diploma</span>
        <span class="node-title">Cyber-Rijbewijs</span>
      </span>
      <span class="node-status"><i class="fa-solid ${allDone ? 'fa-circle-check' : 'fa-lock'}"></i></span>
    </div>`;
  return html;
}
function wireRoadmapEvents(){
  document.querySelectorAll('[data-level-id]').forEach(el => {
    el.addEventListener('click', () => goToLevel(el.getAttribute('data-level-id')));
  });
  const certNode = document.querySelector('[data-certificate]');
  if(certNode){
    certNode.addEventListener('click', () => {
      const allDone = state.completedLevels.length === levelOrder.length;
      if(!allDone){ Sfx.click(); showToast('Rond eerst alle onderdelen af.', 'fa-lock'); return; }
      Sfx.success();
      goToCertificate();
    });
  }
}
function renderDashboard(){
  updateHeaderProgress();
  document.getElementById('user-avatar').textContent = state.avatar;
  document.getElementById('user-name').textContent = state.username;
  document.getElementById('dashboard-intro').innerHTML = dashboardIntroHtml();
  document.getElementById('roadmap').innerHTML = renderRoadmap();
  wireRoadmapEvents();
}

/* ---------------------------------------------------------------
   LEVEL — algemene dispatch
   --------------------------------------------------------------- */
function isScenarioStage(level){
  return level.kind === 'interactive' && runtime.stage !== 'theory';
}
function renderLevelMain(){
  const level = levels[state.currentLevelId];
  const main = document.getElementById('level-main');
  main.innerHTML = sjorsLine(level.sjorsIntro) + (isScenarioStage(level) ? renderScenario(level) : renderTheory(level));
  if(isScenarioStage(level)) wireScenarioEvents(level); else wireTheoryEvents(level);
}
function retryScenario(){
  runtime = { stage: 'scenario' };
  renderLevelMain();
}

/* ---------------------------------------------------------------
   SCENARIO-RENDERERS
   --------------------------------------------------------------- */
function renderChoiceList(choices){
  const resolved = !!runtime.feedback;
  const letters = ['A', 'B', 'C', 'D'];
  return `<div class="choice-list ${resolved ? 'is-resolved' : ''}">${choices.map((c, i) => `
    <button class="choice-btn" type="button" data-choice-index="${i}" ${resolved ? 'disabled' : ''}>
      <span class="choice-letter">${letters[i]}</span><span>${c.label}</span>
    </button>`).join('')}</div>`;
}
function renderFeedbackPanel(feedback){
  const isSuccess = feedback.kind === 'correct' || feedback.kind === 'success';
  const icon = isSuccess ? 'fa-circle-check' : 'fa-triangle-exclamation';
  const cls = isSuccess ? 'is-success' : 'is-risky';
  const nextBtn = isSuccess
    ? `<button class="btn btn-primary" id="feedback-next-btn" type="button">Verder naar de theorie <i class="fa-solid fa-arrow-right"></i></button>`
    : `<button class="btn btn-ghost" id="feedback-retry-btn" type="button">Probeer het opnieuw</button>`;
  return `<div class="feedback-panel ${cls}"><i class="fa-solid ${icon}"></i><div><p>${feedback.title ? `<strong>${feedback.title}</strong>` : ''}${feedback.text}</p><div class="feedback-actions">${nextBtn}</div></div></div>`;
}
function renderChatScenario(level, sc){
  return `<div class="scenario-card">
    <p class="eyebrow">${sc.eyebrow}</p>
    <h3>${sc.headline}</h3>
    <p class="scenario-lede">${sc.lede}</p>
    <div class="chat-window">
      <div class="chat-sender"><i class="fa-solid fa-circle-user"></i> ${sc.contact.name} — ${sc.contact.sub}</div>
      ${sc.messages.map(m => `<div class="chat-bubble">${m.text}</div>`).join('')}
    </div>
    ${renderChoiceList(sc.choices)}
    ${runtime.feedback ? renderFeedbackPanel(runtime.feedback) : ''}
  </div>`;
}
function renderChoiceScenario(level, sc){
  return `<div class="scenario-card">
    <p class="eyebrow">${sc.eyebrow}</p>
    <h3>${sc.headline}</h3>
    <p class="scenario-lede">${sc.lede}</p>
    ${renderChoiceList(sc.choices)}
    ${runtime.feedback ? renderFeedbackPanel(runtime.feedback) : ''}
  </div>`;
}
function renderPasswordTrap(level, sc){
  if(runtime.pwStage !== 'question'){
    return `<div class="scenario-card">
      <p class="eyebrow">${sc.eyebrow}</p>
      <h3>${sc.headline}</h3>
      <p class="scenario-lede">${sc.lede}</p>
      <div class="pw-field-row">
        <input type="text" id="pw-input" placeholder="${sc.inputPlaceholder}" autocomplete="off">
        <button class="btn btn-primary" id="pw-check-btn" type="button">Check mijn wachtwoord</button>
      </div>
      <div class="pw-strength-track"><div class="pw-strength-fill" id="pw-strength-fill"></div></div>
    </div>`;
  }
  return `<div class="scenario-card">
    <p class="eyebrow">${sc.eyebrow}</p>
    <h3>${sc.questionHeadline}</h3>
    <p class="scenario-lede">${sc.question}</p>
    ${renderChoiceList(sc.choices)}
    ${runtime.feedback ? renderFeedbackPanel(runtime.feedback) : ''}
  </div>`;
}
function renderInboxFlags(level, sc){
  const found = runtime.foundFlags || new Set();
  const allFound = sc.flags.every(f => found.has(f.id));
  function flagSpan(f, displayText){
    return `<span class="flag-hotspot ${found.has(f.id) ? 'is-found' : ''}" data-flag-id="${f.id}">${displayText}${found.has(f.id) ? `<span class="flag-pin"><i class="fa-solid fa-check"></i></span>` : ''}</span>`;
  }
  return `<div class="scenario-card">
    <p class="eyebrow">Onderzoek de mail</p>
    <h3>${sc.headline}</h3>
    <p class="scenario-lede">${sc.lede}</p>
    <div class="inbox-window">
      <div class="inbox-meta">
        <div class="inbox-meta-row"><b>Van</b> ${flagSpan(sc.flags[0], sc.from)}</div>
        <div class="inbox-meta-row"><b>Aan</b> ${sc.to}</div>
        <div class="inbox-meta-row"><b>Onderwerp</b> ${sc.subject}</div>
      </div>
      <div class="inbox-body">
        <p>${sc.bodyIntro}</p>
        <p>${sc.bodyText1}</p>
        <p>${flagSpan(sc.flags[1], sc.flags[1].text)}</p>
        <p>${sc.bodyText2} ${flagSpan(sc.flags[2], sc.flags[2].text)}</p>
        <span class="inbox-cta" id="inbox-cta">${sc.ctaText}</span>
      </div>
      <div class="flag-progress">
        ${sc.flags.map(f => `<span class="flag-dot ${found.has(f.id) ? 'is-on' : ''}"></span>`).join('')}
        <span>${found.size} van de ${sc.flags.length} verdachte onderdelen gevonden</span>
      </div>
    </div>
    ${allFound && !runtime.feedback ? `<div class="level-complete-bar"><button class="btn btn-accent btn-lg" id="report-btn" type="button"><i class="fa-solid fa-flag"></i> Melden als phishing</button></div>` : ''}
    ${runtime.feedback ? renderFeedbackPanel(runtime.feedback) : ''}
  </div>`;
}
/* ---------------------------------------------------------------
   INBOX-INVESTIGATE (l3) — harder email investigation
   --------------------------------------------------------------- */
function renderInboxInvestigate(level, sc){
  const found = runtime.foundFlags || new Set();
  const suspIds = sc.suspiciousIds;
  const allFound = suspIds.every(id => found.has(id));
  const foundCount = suspIds.filter(id => found.has(id)).length;

  function zoneEl(zone){
    let cls = 'email-zone';
    if(found.has(zone.id)) cls += ' is-flagged';
    if(zone.area === 'link') cls += ' email-zone-link';
    const badge = found.has(zone.id) ? `<span class="zone-badge"><i class="fa-solid fa-flag"></i></span>` : '';
    return `<span class="${cls}" data-zone-id="${zone.id}">${esc(zone.value)}${badge}</span>`;
  }

  const metaZones = sc.zones.filter(z => z.area === 'meta');
  const bodyZones = sc.zones.filter(z => z.area === 'body');
  const linkZone  = sc.zones.find(z => z.area === 'link');

  const metaHtml = metaZones.map(z => `<div class="inbox-meta-row"><b>${z.label}</b> ${zoneEl(z)}</div>`).join('');
  const bodyHtml  = bodyZones.map(z => `<p>${zoneEl(z)}</p>`).join('');
  const linkHtml  = linkZone ? `<p style="margin-top:.5rem">${zoneEl(linkZone)}</p>` : '';

  const noteHtml = runtime.lastNote
    ? `<div class="zone-note ${runtime.lastNoteSuspicious ? 'is-suspicious' : 'is-safe'}">
        <i class="fa-solid ${runtime.lastNoteSuspicious ? 'fa-flag' : 'fa-circle-info'}"></i>
        <p>${runtime.lastNote}</p>
       </div>`
    : '';

  let progressHtml;
  if(found.size === 0){
    progressHtml = `<div class="flag-progress"><span class="flag-progress-hint">Klik op een onderdeel dat je verdacht vindt</span></div>`;
  } else {
    progressHtml = `<div class="flag-progress">
      ${suspIds.map((_, i) => `<span class="flag-dot ${i < foundCount ? 'is-on' : ''}"></span>`).join('')}
      <span>${foundCount} verdacht${foundCount === 1 ? '' : 'e'} onderdeel${foundCount === 1 ? '' : 'en'} gemarkeerd</span>
    </div>`;
  }

  return `<div class="scenario-card">
    <p class="eyebrow">Onderzoek de mail</p>
    <h3>${esc(sc.headline)}</h3>
    <p class="scenario-lede">${sc.lede}</p>
    <div class="inbox-window inbox-investigate">
      <div class="inbox-meta">${metaHtml}</div>
      <div class="inbox-body">
        ${bodyHtml}
        ${linkHtml}
        <div class="inbox-cta-wrap" style="margin-top:.9rem">
          <span class="inbox-cta" id="inbox-cta">${esc(sc.cta.text)}</span>
        </div>
      </div>
      ${progressHtml}
    </div>
    ${noteHtml}
    ${allFound && !runtime.feedback ? `<div class="level-complete-bar"><button class="btn btn-accent btn-lg" id="report-btn" type="button"><i class="fa-solid fa-flag"></i> Melden als phishing</button></div>` : ''}
    ${runtime.feedback ? renderFeedbackPanel(runtime.feedback) : ''}
  </div>`;
}
function wireInboxInvestigate(level, sc){
  document.querySelectorAll('[data-zone-id]').forEach(el => {
    el.addEventListener('click', () => {
      if(runtime.feedback) return;
      const id = el.getAttribute('data-zone-id');
      const zone = sc.zones.find(z => z.id === id);
      if(!zone) return;
      if(!runtime.foundFlags) runtime.foundFlags = new Set();
      if(zone.suspicious){
        if(!runtime.foundFlags.has(id)){ runtime.foundFlags.add(id); Sfx.click(); }
        runtime.lastNote = zone.hint;
        runtime.lastNoteSuspicious = true;
        renderLevelMain();
      } else {
        runtime.noteGen = (runtime.noteGen || 0) + 1;
        const gen = runtime.noteGen;
        runtime.lastNote = zone.hint;
        runtime.lastNoteSuspicious = false;
        Sfx.click();
        renderLevelMain();
        setTimeout(() => {
          if(runtime.noteGen === gen){ runtime.lastNote = null; renderLevelMain(); }
        }, 2800);
      }
    });
  });
  const cta = document.getElementById('inbox-cta');
  if(cta) cta.addEventListener('click', () => {
    if(runtime.feedback) return;
    resolveOutcome(level, { outcome: 'wrong', feedbackText: sc.wrongFeedback });
  });
  const reportBtn = document.getElementById('report-btn');
  if(reportBtn) reportBtn.addEventListener('click', () => {
    resolveOutcome(level, { outcome: 'correct', feedbackTitle: 'Goed speurwerk!', feedbackText: sc.correctFeedback });
  });
  wireFeedbackButtons(level);
}

/* ---------------------------------------------------------------
   DATING-SIM (l6) — step-by-step dating app experience
   --------------------------------------------------------------- */
function renderDatingSim(level, sc){
  if(!runtime.datingStarted) return renderDatingProfile(sc);
  const stageIdx = runtime.datingStage || 0;
  const stage = sc.stages[stageIdx];
  if(stage.choices) return renderDatingAsk(sc, stage);
  return renderDatingChatStage(sc, stage);
}
function renderDatingProfile(sc){
  const p = sc.profile;
  return `<div class="dating-app-shell">
    <div class="dating-app-bar"><i class="fa-solid fa-heart"></i> ConnectNu</div>
    <div class="dating-profile-card">
      <div class="dating-avatar">${p.emoji}</div>
      <div class="dating-profile-info">
        <h3>${esc(p.name)}, ${p.age} <span class="dating-verified"><i class="fa-solid fa-circle-check"></i></span></h3>
        <p class="dating-sub"><i class="fa-solid fa-location-dot"></i> ${esc(p.location)}</p>
        <p class="dating-sub"><i class="fa-solid fa-briefcase"></i> ${esc(p.job)}</p>
      </div>
      <p class="dating-bio">${esc(p.bio)}</p>
      <div class="dating-interests">${p.interests.map(i => `<span class="dating-tag">${esc(i)}</span>`).join('')}</div>
      <button class="btn btn-block dating-start-btn" id="dating-start" type="button">
        <i class="fa-solid fa-comment"></i> Stuur een berichtje
      </button>
    </div>
  </div>`;
}
function renderDatingChatStage(sc, stage){
  const msgs = stage.messages || [];
  return `<div class="dating-app-shell">
    <div class="dating-app-bar">
      <span>${sc.profile.emoji} ${esc(sc.profile.name)}</span>
      <span class="dating-online-dot"></span>
    </div>
    <div class="dating-stage-label">${stage.label}</div>
    <div class="dating-chat-window">
      ${msgs.map(m => `<div class="dating-msg dating-msg-other">${esc(m.text)}</div>`).join('')}
      ${stage.userReply ? `<div class="dating-msg dating-msg-self">${esc(stage.userReply)}</div>` : ''}
    </div>
    <div class="dating-chat-footer">
      <button class="btn btn-primary" id="dating-next" type="button">${stage.ctaText || 'Volgende →'} <i class="fa-solid fa-arrow-right"></i></button>
    </div>
  </div>`;
}
function renderDatingAsk(sc, stage){
  return `<div class="dating-app-shell">
    <div class="dating-app-bar">
      <span>${sc.profile.emoji} ${esc(sc.profile.name)}</span>
      <span class="dating-online-dot"></span>
    </div>
    <div class="dating-stage-label">${stage.label}</div>
    <div class="dating-chat-window">
      ${stage.messages.map(m => `<div class="dating-msg dating-msg-other">${esc(m.text)}</div>`).join('')}
    </div>
    <div class="dating-choice-section">
      <p class="dating-choice-prompt">Wat doe jij?</p>
      ${renderChoiceList(stage.choices)}
      ${runtime.feedback ? renderFeedbackPanel(runtime.feedback) : ''}
    </div>
  </div>`;
}
function wireDatingSim(level, sc){
  const startBtn = document.getElementById('dating-start');
  if(startBtn) startBtn.addEventListener('click', () => {
    runtime.datingStarted = true;
    runtime.datingStage = 0;
    Sfx.click();
    renderLevelMain();
  });
  const nextBtn = document.getElementById('dating-next');
  if(nextBtn) nextBtn.addEventListener('click', () => {
    runtime.datingStage = (runtime.datingStage || 0) + 1;
    Sfx.click();
    renderLevelMain();
  });
  document.querySelectorAll('[data-choice-index]').forEach(btn => {
    btn.addEventListener('click', () => {
      if(runtime.feedback) return;
      const idx = parseInt(btn.getAttribute('data-choice-index'), 10);
      const stageIdx = runtime.datingStage || 0;
      const stage = sc.stages[stageIdx];
      if(stage.choices) resolveOutcome(level, stage.choices[idx]);
    });
  });
  wireFeedbackButtons(level);
}

/* ---------------------------------------------------------------
   PHONE-SIM (l7) — ringing phone → call transcript
   --------------------------------------------------------------- */
function renderPhoneSim(level, sc){
  if(runtime.phoneDeclined) return renderPhoneDeclined(level, sc);
  if(runtime.phoneStage === 'answered') return renderPhoneCall(level, sc);
  return renderPhoneRinging(sc);
}
function renderPhoneRinging(sc){
  return `<div class="scenario-card">
    <p class="eyebrow">Inkomend gesprek</p>
    <h3>Je telefoon gaat</h3>
    <p class="scenario-lede">Jij krijgt een telefoontje. Wat doe je?</p>
    <div class="phone-shell">
      <div class="phone-screen">
        <div class="phone-incoming-label">Inkomend gesprek</div>
        <div class="phone-caller-icon"><i class="fa-solid fa-building-columns"></i></div>
        <div class="phone-caller-name">${esc(sc.ringing.caller)}</div>
        <div class="phone-caller-number">${esc(sc.ringing.number)}</div>
        <div class="phone-actions">
          <div class="phone-action-wrap">
            <button class="phone-btn phone-decline" id="phone-decline" type="button" aria-label="Weigeren"><i class="fa-solid fa-phone-slash"></i></button>
            <span>Weigeren</span>
          </div>
          <div class="phone-action-wrap">
            <button class="phone-btn phone-answer" id="phone-answer" type="button" aria-label="Opnemen"><i class="fa-solid fa-phone"></i></button>
            <span>Opnemen</span>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}
function renderPhoneCall(level, sc){
  return `<div class="scenario-card">
    <p class="eyebrow">Aan de telefoon</p>
    <h3>${esc(sc.ringing.caller)}</h3>
    <p class="scenario-lede">Je hebt opgenomen. Luister naar wat de beller zegt.</p>
    <div class="phone-transcript-card">
      ${sc.call.transcript.map(line => `
        <div class="phone-transcript-line ${line.highlight ? 'phone-transcript-highlight' : ''}">
          <span class="phone-transcript-who">${esc(line.who)}:</span>
          <span>${esc(line.text)}</span>
        </div>`).join('')}
    </div>
    <p class="dating-choice-prompt" style="margin-top:1.2rem">Wat doe jij?</p>
    ${renderChoiceList(sc.call.choices)}
    ${runtime.feedback ? renderFeedbackPanel(runtime.feedback) : ''}
  </div>`;
}
function renderPhoneDeclined(level, sc){
  return `<div class="scenario-card">
    <p class="eyebrow">Telefoongesprek</p>
    <h3>Je hebt het gesprek geweigerd</h3>
    <div class="phone-shell">
      <div class="phone-screen phone-screen-ended">
        <div class="phone-caller-icon" style="animation:none;opacity:.6"><i class="fa-solid fa-phone-slash"></i></div>
        <div class="phone-caller-name">${esc(sc.ringing.caller)}</div>
        <div class="phone-caller-number" style="color:rgba(255,255,255,.5)">Geweigerd</div>
      </div>
    </div>
    ${runtime.feedback ? renderFeedbackPanel(runtime.feedback) : ''}
  </div>`;
}
function wirePhoneSim(level, sc){
  const declineBtn = document.getElementById('phone-decline');
  if(declineBtn) declineBtn.addEventListener('click', () => {
    if(!state.completedLevels.includes(level.id)){
      state.completedLevels.push(level.id);
      state.score += 10;
      saveState();
      updateHeaderProgress();
    }
    runtime.phoneDeclined = true;
    runtime.feedback = { kind: 'correct', title: 'Goed instinct!', text: 'Je hoeft nooit in te gaan op zo\'n telefoontje. Bel je bank altijd zelf terug via het nummer op je bankpas of banksite — nooit via een nummer dat iemand jou geeft. Dan weet je zeker wie je aan de lijn hebt.' };
    Sfx.success();
    renderLevelMain();
  });
  const answerBtn = document.getElementById('phone-answer');
  if(answerBtn) answerBtn.addEventListener('click', () => {
    runtime.phoneStage = 'answered';
    Sfx.click();
    renderLevelMain();
  });
  document.querySelectorAll('[data-choice-index]').forEach(btn => {
    btn.addEventListener('click', () => {
      if(runtime.feedback) return;
      const idx = parseInt(btn.getAttribute('data-choice-index'), 10);
      resolveOutcome(level, sc.call.choices[idx]);
    });
  });
  wireFeedbackButtons(level);
}

/* --------------------------------------------------------------- */

function renderScenario(level){
  const sc = level.scenario;
  if(sc.type === 'chat') return renderChatScenario(level, sc);
  if(sc.type === 'password-trap') return renderPasswordTrap(level, sc);
  if(sc.type === 'inbox-flags') return renderInboxFlags(level, sc);
  if(sc.type === 'inbox-investigate') return renderInboxInvestigate(level, sc);
  if(sc.type === 'dating-sim') return renderDatingSim(level, sc);
  if(sc.type === 'phone-sim') return renderPhoneSim(level, sc);
  return renderChoiceScenario(level, sc);
}

/* ---------------------------------------------------------------
   SCENARIO — wiring & afhandelen van een keuze
   --------------------------------------------------------------- */
function resolveOutcome(level, choiceLike){
  if(choiceLike.outcome === 'wrong'){
    Sfx.hacked();
    openHackedOverlay(level, choiceLike);
    return;
  }
  // Bij een correcte keuze markeren we het level direct als voltooid
  if(choiceLike.outcome === 'correct'){
    if(!state.completedLevels.includes(level.id)){
      state.completedLevels.push(level.id);
      state.score += 10;
      saveState();
      updateHeaderProgress();
    }
  }
  runtime.feedback = { kind: choiceLike.outcome, title: choiceLike.feedbackTitle, text: choiceLike.feedbackText };
  Sfx[choiceLike.outcome === 'risky' ? 'fail' : 'success']();
  renderLevelMain();
}
function wirePasswordInputStage(){
  const btn = document.getElementById('pw-check-btn');
  const input = document.getElementById('pw-input');
  const fill = document.getElementById('pw-strength-fill');
  btn.addEventListener('click', () => {
    const val = input.value || '';
    const pct = Math.max(15, Math.min(96, val.length * 9));
    fill.style.width = pct + '%';
    fill.style.background = pct > 70 ? 'var(--success)' : (pct > 40 ? 'var(--warning)' : 'var(--danger)');
    Sfx.click();
    btn.disabled = true;
    setTimeout(() => {
      runtime.pwStage = 'question';
      renderLevelMain();
    }, 850);
  });
}
function wireInboxFlags(level, sc){
  document.querySelectorAll('[data-flag-id]').forEach(el => {
    el.addEventListener('click', () => {
      if(runtime.feedback) return;
      const id = el.getAttribute('data-flag-id');
      if(!runtime.foundFlags) runtime.foundFlags = new Set();
      if(!runtime.foundFlags.has(id)){
        runtime.foundFlags.add(id);
        Sfx.click();
        renderLevelMain();
      }
    });
  });
  const cta = document.getElementById('inbox-cta');
  if(cta) cta.addEventListener('click', () => {
    if(runtime.feedback) return;
    resolveOutcome(level, { outcome: 'wrong', feedbackText: sc.wrongFeedback });
  });
  const reportBtn = document.getElementById('report-btn');
  if(reportBtn) reportBtn.addEventListener('click', () => {
    resolveOutcome(level, { outcome: 'correct', feedbackTitle: 'Goed speurwerk.', feedbackText: sc.correctFeedback });
  });
}
function wireFeedbackButtons(level){
  const nextBtn = document.getElementById('feedback-next-btn');
  if(nextBtn) nextBtn.addEventListener('click', () => { runtime.stage = 'theory'; runtime.feedback = null; renderLevelMain(); });
  const retryBtn = document.getElementById('feedback-retry-btn');
  if(retryBtn) retryBtn.addEventListener('click', () => retryScenario());
}
function wireScenarioEvents(level){
  const sc = level.scenario;
  if(sc.type === 'inbox-flags'){
    wireInboxFlags(level, sc);
    wireFeedbackButtons(level);
    return;
  }
  if(sc.type === 'inbox-investigate'){
    wireInboxInvestigate(level, sc);
    return;
  }
  if(sc.type === 'dating-sim'){
    wireDatingSim(level, sc);
    return;
  }
  if(sc.type === 'phone-sim'){
    wirePhoneSim(level, sc);
    return;
  }
  if(sc.type === 'password-trap' && runtime.pwStage !== 'question'){
    wirePasswordInputStage();
    return;
  }
  document.querySelectorAll('[data-choice-index]').forEach(btn => {
    btn.addEventListener('click', () => {
      if(runtime.feedback) return;
      const idx = parseInt(btn.getAttribute('data-choice-index'), 10);
      resolveOutcome(level, sc.choices[idx]);
    });
  });
  wireFeedbackButtons(level);
}

/* ---------------------------------------------------------------
   THEORIE — accordion + quiz
   --------------------------------------------------------------- */
function renderAccordionItem(item, index){
  const isOpen = runtime.openAccordion === index;
  let inner = item.paragraphs.map(p => `<p>${p}</p>`).join('');
  if(item.video){
    inner += `<div class="video-card" data-video-key="${item.video.key}" data-video-title="${escAttr(item.video.title)}">
      <span class="video-card-thumb"><i class="fa-solid fa-play"></i></span>
      <span class="video-card-text"><b>${item.video.title}</b><span>Uitlegvideo</span></span>
    </div>`;
  }
  return `<div class="accordion-item ${isOpen ? 'is-open' : ''}">
    <button class="accordion-trigger" type="button" data-accordion-toggle="${index}">
      <span class="accordion-icon"><i class="fa-solid ${item.icon}"></i></span>
      <span>${item.title}</span>
      <i class="fa-solid fa-chevron-down chev"></i>
    </button>
    <div class="accordion-panel" ${isOpen ? 'style="max-height:1400px"' : ''}>
      <div class="accordion-panel-inner">${inner}</div>
    </div>
  </div>`;
}
function renderQuiz(quiz){
  const answered = runtime.quizAnswered;
  const locked = answered && answered.correct;
  const optionsHtml = quiz.options.map((opt, i) => {
    let cls = '';
    if(answered){
      if(i === quiz.correctIndex) cls = 'is-correct';
      else if(i === answered.index && !answered.correct) cls = 'is-wrong';
    }
    return `<button class="quiz-option ${cls}" type="button" data-quiz-index="${i}" ${locked ? 'disabled' : ''}>${opt}</button>`;
  }).join('');
  const feedback = answered ? `<p class="quiz-feedback ${answered.correct ? 'is-correct' : 'is-wrong'}">${answered.correct ? quiz.feedbackCorrect : quiz.feedbackWrong}</p>` : '';
  return `<div class="quiz-box">
    <p class="quiz-question">${quiz.question}</p>
    <div class="quiz-options">${optionsHtml}</div>
    ${feedback}
    <div class="level-complete-bar"><button class="btn btn-accent btn-lg" id="complete-level-btn" type="button" ${locked ? '' : 'disabled'}>Niveau voltooien <i class="fa-solid fa-circle-check"></i></button></div>
  </div>`;
}
function renderTheory(level){
  const t = level.theory;
  return `<div class="theory-block">
    <div class="theory-block-head"><p class="eyebrow">Theorie</p><h3>${level.nodeTitle}</h3></div>
    <div class="accordion">${t.accordion.map((item, i) => renderAccordionItem(item, i)).join('')}</div>
    ${renderQuiz(t.quiz)}
  </div>`;
}
function selectQuizOption(quiz, i){
  if(runtime.quizAnswered && runtime.quizAnswered.correct) return;
  const correct = i === quiz.correctIndex;
  runtime.quizAnswered = { index: i, correct };
  Sfx[correct ? 'success' : 'fail']();
  renderLevelMain();
}
function wireTheoryEvents(level){
  document.querySelectorAll('[data-accordion-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-accordion-toggle'), 10);
      runtime.openAccordion = (runtime.openAccordion === idx) ? null : idx;
      Sfx.click();
      renderLevelMain();
    });
  });
  document.querySelectorAll('[data-video-key]').forEach(card => {
    card.addEventListener('click', () => {
      openVideoModal(card.getAttribute('data-video-key'), card.getAttribute('data-video-title'));
    });
  });
  document.querySelectorAll('[data-quiz-index]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-quiz-index'), 10);
      selectQuizOption(level.theory.quiz, idx);
    });
  });
  const completeBtn = document.getElementById('complete-level-btn');
  if(completeBtn) completeBtn.addEventListener('click', () => completeLevel(level));
}

/* ---------------------------------------------------------------
   LEVEL VOLTOOIEN
   --------------------------------------------------------------- */
function completeLevel(level){
  const firstTime = !state.completedLevels.includes(level.id);
  if(firstTime){
    state.completedLevels.push(level.id);
    state.score += 10;
    saveState();
  }
  Sfx.success();
  goToDashboard();
  const allDone = state.completedLevels.length === levelOrder.length;
  if(allDone){
    showSjorsTip('Dat was de laatste! Onderaan de route wacht je Cyber-Rijbewijs.');
  } else if(firstTime){
    const nextId = levelOrder[levelOrder.indexOf(level.id) + 1];
    const nextTitle = nextId ? levels[nextId].nodeTitle : '';
    showSjorsTip(`Mooi gedaan. ${nextTitle ? `Hierna staat "${nextTitle}" voor je open.` : ''}`);
  }
  if(firstTime) scheduleMalvertising();
}

/* ---------------------------------------------------------------
   VIDEO-POP-UP (witte pop-up met play-knop)
   --------------------------------------------------------------- */
function openVideoModal(key, title){
  const entry = videoLibrary[key] || {};
  const root = document.getElementById('popup-root');
  root.innerHTML = `
    <div class="overlay" id="video-overlay">
      <div class="video-modal">
        <button class="video-modal-close" id="video-modal-close" type="button" aria-label="Sluiten"><i class="fa-solid fa-xmark"></i></button>
        <p class="eyebrow">Uitlegvideo</p>
        <h3>${title}</h3>
        <div class="video-stage" id="video-stage">
          <button class="video-play-btn" id="video-play-btn" type="button" aria-label="Afspelen"><i class="fa-solid fa-play"></i></button>
          <span class="video-pending-text">Video volgt binnenkort</span>
        </div>
      </div>
    </div>`;
  document.getElementById('video-modal-close').addEventListener('click', closeOverlay);
  document.getElementById('video-overlay').addEventListener('click', (e) => {
    if(e.target.id === 'video-overlay') closeOverlay();
  });
  document.getElementById('video-play-btn').addEventListener('click', () => {
    if(entry.src){
      document.getElementById('video-stage').innerHTML = `<video src="${entry.src}" controls autoplay playsinline></video>`;
    } else {
      showToast('Deze video volgt nog — Sjors is hem aan het inspreken.', 'fa-clapperboard');
    }
  });
}

/* ---------------------------------------------------------------
   "HELAAS, GEHACKT!"-OVERLAY
   --------------------------------------------------------------- */
function openHackedOverlay(level, choiceLike){
  const root = document.getElementById('popup-root');
  root.innerHTML = `
    <div class="overlay">
      <div class="hacked-card">
        <div class="hacked-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <h2>Helaas, gehackt!</h2>
        <div class="sjors-says"><b>Sjors legt uit</b>${choiceLike.feedbackText}</div>
        <div class="hacked-actions">
          <button class="btn btn-primary btn-lg" id="hacked-video-btn" type="button"><i class="fa-solid fa-circle-play"></i> Bekijk de uitleg</button>
          <button class="btn btn-ghost btn-lg" id="hacked-retry-btn" type="button">Probeer opnieuw</button>
        </div>
      </div>
    </div>`;
  document.getElementById('hacked-video-btn').addEventListener('click', () => {
    closeOverlay();
    openVideoModal(`${level.id}-uitleg`, level.nodeTitle);
  });
  document.getElementById('hacked-retry-btn').addEventListener('click', () => {
    closeOverlay();
    retryScenario();
  });
}

/* ---------------------------------------------------------------
   RESET-BEVESTIGING (geen confirm(), eigen overlay)
   --------------------------------------------------------------- */
function openResetConfirm(){
  const root = document.getElementById('popup-root');
  root.innerHTML = `
    <div class="overlay">
      <div class="hacked-card">
        <div class="hacked-icon"><i class="fa-solid fa-arrow-rotate-left"></i></div>
        <h2>Voortgang wissen?</h2>
        <p>Je naam, avatar en alle voltooide onderdelen worden teruggezet. Dit kan niet ongedaan worden gemaakt.</p>
        <div class="hacked-actions">
          <button class="btn btn-danger btn-lg" id="reset-confirm-btn" type="button">Ja, opnieuw beginnen</button>
          <button class="btn btn-ghost btn-lg" id="reset-cancel-btn" type="button">Annuleren</button>
        </div>
      </div>
    </div>`;
  document.getElementById('reset-confirm-btn').addEventListener('click', () => {
    try{ localStorage.removeItem(STORAGE_KEY); }catch(e){}
    state = Object.assign({}, defaultState);
    closeOverlay();
    showScreen('screen-login');
    resetLoginForm();
  });
  document.getElementById('reset-cancel-btn').addEventListener('click', closeOverlay);
}

/* ---------------------------------------------------------------
   MALVERTISING — onverwachte "update vereist"-pop-up
   --------------------------------------------------------------- */
function scheduleMalvertising(){
  if(state.malvertisingShown) return;
  setTimeout(() => {
    if(state.malvertisingShown) return;
    const dash = document.getElementById('screen-dashboard');
    if(!dash || !dash.classList.contains('is-active')) return;
    showMalvertisingCard();
  }, 3600);
}
function showMalvertisingCard(){
  const root = document.getElementById('malvertising-root');
  root.innerHTML = `
    <div class="malvertising-card">
      <button class="malvertising-x" id="malvertising-x" type="button" aria-label="Sluiten"><i class="fa-solid fa-xmark"></i></button>
      <div class="malvertising-bar"></div>
      <p class="malvertising-title"><i class="fa-solid fa-triangle-exclamation"></i> KRITIEKE UPDATE VEREIST!</p>
      <p class="malvertising-text">Uw systeem loopt risico. Installeer onmiddellijk de beveiligingsupdate om verdere schade te voorkomen.</p>
      <div class="malvertising-actions">
        <button class="btn btn-danger" id="malvertising-update-btn" type="button">Nu updaten</button>
      </div>
    </div>`;
  document.getElementById('malvertising-x').addEventListener('click', dismissMalvertising);
  document.getElementById('malvertising-update-btn').addEventListener('click', triggerMalvertisingTrap);
}
function dismissMalvertising(){
  state.malvertisingShown = true; saveState();
  document.getElementById('malvertising-root').innerHTML = '';
  Sfx.success();
  showToast('Slim — onverwachte pop-ups negeren is precies de juiste reflex.', 'fa-shield-halved');
}
function triggerMalvertisingTrap(){
  state.malvertisingShown = true; saveState();
  document.getElementById('malvertising-root').innerHTML = '';
  Sfx.hacked();
  const root = document.getElementById('popup-root');
  root.innerHTML = `
    <div class="flash-red">
      <div class="flash-red-card">
        <i class="fa-solid fa-skull-crossbones"></i>
        <h2>Helaas, ook dit was nep.</h2>
        <div class="sjors-says">
          <b>Sjors legt uit</b>
          Dit soort schermen duikt vaak op via advertenties op heel gewone websites — "malvertising" genoemd.
          Een knop als "Nu updaten" installeert geen update, maar besmet juist je apparaat.
          Een echte systeemupdate vraag je nooit aan via een pop-up op een website.
        </div>
        <button class="btn btn-primary btn-lg" id="flash-close-btn" type="button">Begrepen</button>
      </div>
    </div>`;
  document.getElementById('flash-close-btn').addEventListener('click', closeOverlay);
}

/* ---------------------------------------------------------------
   SJORS — mascotte-widget
   --------------------------------------------------------------- */
function showSjorsTip(text){
  const bubble = document.getElementById('sjors-bubble');
  bubble.innerHTML = `<b>Sjors zegt</b><p>${text}</p>`;
  bubble.classList.add('is-visible');
  clearTimeout(sjorsHideTimer);
  sjorsHideTimer = setTimeout(hideSjorsBubble, 8000);
}
function hideSjorsBubble(){
  document.getElementById('sjors-bubble').classList.remove('is-visible');
}
function wireSjorsWidget(){
  document.getElementById('sjors-avatar-btn').addEventListener('click', () => {
    const bubble = document.getElementById('sjors-bubble');
    if(bubble.classList.contains('is-visible')){
      hideSjorsBubble();
      return;
    }
    let idx = Math.floor(Math.random() * sjorsTips.length);
    if(idx === sjorsTipIndex) idx = (idx + 1) % sjorsTips.length;
    sjorsTipIndex = idx;
    showSjorsTip(sjorsTips[idx]);
  });
}

/* ---------------------------------------------------------------
   GLOBALE NAVIGATIE & INIT
   --------------------------------------------------------------- */
function wireGlobalNav(){
  document.getElementById('level-back').addEventListener('click', () => { Sfx.click(); goToDashboard(); });
  document.getElementById('reset-progress').addEventListener('click', openResetConfirm);
  document.getElementById('cert-print').addEventListener('click', () => window.print());
  document.getElementById('cert-back').addEventListener('click', goToDashboard);
}
function init(){
  renderAvatarGrid();
  wireLogin();
  wireGlobalNav();
  wireSjorsWidget();
  if(state.username && state.avatar){
    showScreen('screen-dashboard');
    renderDashboard();
  } else {
    showScreen('screen-login');
  }
}
document.addEventListener('DOMContentLoaded', init);