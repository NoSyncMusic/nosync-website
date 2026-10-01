# No Sync — official website

De broncode van de officiële No Sync-website.

## Werkwijze

- **GitHub** is de broncode en versiegeschiedenis.
- **GitHub Pages** is de testomgeving.
- **Pages CMS** gebruik je voor dagelijkse contentwijzigingen.
- **Namecheap Stellar Plus** is de productiehosting.
- Publiceren naar productie gebeurt alleen via **Pages CMS → Publiceer naar Namecheap**.

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

De cijfers animeren één keer wanneer de statistieken in beeld komen. Bij `prefers-reduced-motion` wordt niet geanimeerd.

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
- commit nieuwe en gewijzigde pagina's automatisch.

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
- JavaScriptfouten;
- geldige `.pages.yml`-YAML.

## Publiceren naar Namecheap

Gebruik uitsluitend:

**Pages CMS → Publiceer naar Namecheap**

De productie-workflow accepteert alleen een Pages CMS-payload, valideert de repository en publiceert exact de gekozen commit.

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
