# No Sync — official website

De broncode van de officiële No Sync-website.

## Werkwijze

- **GitHub** is de broncode en versiegeschiedenis.
- **GitHub Pages** is de testomgeving.
- **Pages CMS** gebruik je voor dagelijkse contentwijzigingen.
- **Namecheap Stellar Plus** is de productiehosting.
- Normaal publiceren naar productie gebeurt via **Pages CMS → Publiceer naar Namecheap**.
- Als Pages CMS niet beschikbaar is, kan dezelfde beveiligde workflow handmatig in GitHub Actions met een exact commit-SHA worden gestart.

Preview: https://nosyncmusic.github.io/nosync-website/  
Productie: https://nosyncmusic.com/

## Pages CMS

### Design, teksten & kleuren

Hier beheer je onder andere:

- hero-tekst, genres, foto en logo;
- navigatie en sectieteksten;
- release- en pre-saveknoppen;
- shows- en contactteksten;
- huisstijlkleuren.

De ongebruikte oude hero-tagline is verborgen om dubbele tekst te voorkomen.

### Content, releases & contact

De editor is geordend als:

1. statistieken;
2. aankomende releases & pre-saves;
3. uitgebrachte releases;
4. Explore-links;
5. shows;
6. socials;
7. externe links;
8. contactadressen.

Herhaalbare items zijn inklapbaar en tonen herkenbare namen, bijvoorbeeld de releasetitel, het social-platform of de showdatum in plaats van `Item #1`.

## Statistieken

De homepage toont:

- **Total streams** — handmatig in Pages CMS;
- **Official releases** — automatisch uit de zichtbare releasecatalogus;
- **Countries streaming** — handmatig in Pages CMS.

Official releases wordt automatisch per vijf afgerond:

- 1–4 → exact aantal;
- 5–9 → `5+`;
- 10–14 → `10+`;
- enzovoort.

De cijfers starten pas nadat de page-curtain volledig klaar is, tellen rustig op en animeren één keer wanneer de statistieken in beeld komen. Bij `prefers-reduced-motion` wordt niet geanimeerd.

## Releases

### Uitgebrachte releases

Iedere release kan bevatten:

- titel;
- artiest(en);
- releasedatum;
- artwork;
- featured-status;
- streaminglinks.

Op de All releases-pagina kan de bezoeker wisselen tussen:

- **Grid** — standaard;
- **By year** — gegroepeerd op releasejaar.

De gekozen weergave wordt lokaal in de browser onthouden.

### Aankomende releases

Voeg een aankomende release één keer toe met:

- slug;
- titel;
- artiest;
- releasedatum;
- artwork;
- ISRC;
- eventuele smartlink/pre-saveprovider.

De statische pre-savepagina wordt automatisch aangemaakt onder:

`/presave/<slug>/`

Die pagina krijgt eigen Open Graph/Twitter metadata voor delen via WhatsApp, Discord, iMessage en sociale platforms.

## Spotify-automatisering

Workflow: `.github/workflows/sync-spotify.yml`

- draait iedere 6 uur en handmatig;
- zoekt aankomende releases op ISRC;
- controleert dat de gevonden track bij No Sync hoort;
- vult Spotify-data aan;
- zet een gevonden release automatisch op `released`;
- behoudt handmatige streaminglinks.

De automatisch gevulde Spotify-velden zijn in Pages CMS **readonly**.

Benodigde GitHub secrets:

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`

## Pre-save generator

Workflow: `.github/workflows/generate-presave-pages.yml`

De generator:

- maakt statische releasepagina's;
- verwijdert pagina's wanneer de bijbehorende upcoming release wordt verwijderd;
- genereert release-specifieke social metadata;
- bouwt automatisch de sitemap met actieve pre-save/releasepagina's;
- ververst de ingebedde homepage-snapshot uit `settings.json` en `content.json`;
- commit nieuwe en gewijzigde gegenereerde bestanden automatisch.

## Shows

Standaard worden shows geladen via Bandsintown.

Artiest-ID: `15598110`

Handmatige shows in `content.json` blijven beschikbaar als reserve of wanneer de showbron op `manual` wordt gezet.

## Browser- en configuratietests

Workflow: `.github/workflows/site-browser-smoke.yml`

Automatische checks omvatten:

- Chromium;
- Firefox;
- WebKit;
- touch/mobile;
- iPhone portrait, compact en landscape;
- horizontale overflow;
- streamingmodal en scroll-lock;
- Grid / By year-weergave;
- opgeslagen releaseweergave;
- homepage-statistieken;
- page-curtain navigatie;
- ernstige/critieke WCAG accessibility-regressies;
- JavaScriptfouten;
- geldige `.pages.yml`-YAML.

## Publiceren naar Namecheap

Normaal gebruik je:

**Pages CMS → Publiceer naar Namecheap**

De productie-workflow publiceert exact de gekozen commit en controleert vóór upload automatisch dat:
- de commit onderdeel is van `main`;
- de GitHub Pages-build voor die commit groen is;
- de volledige browser-smoketest voor die commit groen is.

Als Pages CMS tijdelijk niet beschikbaar is, open je **Actions → Publish to Namecheap → Run workflow** en vul je bij `commit_sha` een volledig, reeds getest commit-SHA in. Laat `payload` dan leeg.

Na upload controleert de workflow productie opnieuw en vergelijkt kritieke bestanden met de lokaal geteste commit. Een eerder getest commit-SHA kan op dezelfde manier als rollback worden gepubliceerd.

Workflow: `.github/workflows/deploy-namecheap.yml`

GitHub secrets:

- `NAMECHEAP_FTP_HOST`
- `NAMECHEAP_FTP_USER`
- `NAMECHEAP_FTP_PASSWORD`

De volgende beheerbestanden worden niet naar productie geüpload:

- `.git/`
- `.github/`
- `.pages.yml`
- `README.md`
- `scripts/`

## Voor livegang

1. Controleer de GitHub Pages-preview.
2. Wacht tot **Site browser smoke tests** groen zijn.
3. Controleer homepage, All releases en eventuele pre-savepagina.
4. Publiceer daarna via Pages CMS naar Namecheap.


## Gedeelde front-end core

`site-core.js` bevat gedeelde, browser-side utilities voor onder andere:

- veilige interne/externe URLs;
- release-artwork en streaminglinks;
- datumvalidatie en formattering;
- kleurcontrast en leesbare accentkleuren.

Home, All Releases en Pre-save gebruiken dezelfde core zodat deze logica niet op meerdere plekken uit elkaar kan groeien.
