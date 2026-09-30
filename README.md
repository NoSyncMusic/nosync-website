# No Sync — websitecheck en uploadpakket

Beoordeling en export: 30 september 2026. Gebaseerd op de huidige website in NoSyncMusic/nosync-website, inclusief de CMS-wijziging van de showtitel naar TBA (commit 4f0f00d).

## Advies en uitgevoerde verbeteringen

De sterke basis is het donkere ontwerp, het herkenbare logo, de grote typografische artiestennaam en de huidige portretfoto. Mijn advies is die identiteit te behouden, met rood als accent. Gewone tekst hoort rustig lichtgrijs te zijn; koppen bijna wit. Een hele website met donkerrode tekst wordt minder leesbaar en oogt onrustiger.

| Onderdeel | Beoordeling en verbetering |
| --- | --- |
| Kleuren | Donkere achtergrond, bijna witte koppen en grijze ondersteunende tekst. Rood wordt gebruikt voor de luisterknop, kleine labels en showdatum. Geen gele interfaceaccenten. Kleuren in bestaande artwork blijven behouden. |
| Fonts | Barlow Condensed voor de grote titels en DM Sans voor gewone tekst passen bij een dance-artiest. Behouden, met duidelijkere groottes, regelafstanden en lokale WOFF2-bestanden. Fontlicenties blijven inbegrepen. |
| Foto’s en artwork | Je portret, logo, releasecovers en AFTERHOURS-cover blijven herkenbaar. De afbeeldingen zijn technisch geoptimaliseerd naar WebP. Het logo wordt op een passende resolutie geladen. Geen vervangende of verzonnen artiestenfoto’s. |
| Layout | Meer rust en een duidelijkere volgorde: artiest → releases → sets en playlists → shows → contact. De uitgelichte release krijgt drie directe platforms; andere releases twee. Alle overige links blijven bereikbaar via “More platforms”. |
| Mobiel | Groter, leesbaar menu met aanraakruimte. Foto boven de artiestennaam. Kaarten, contactgegevens en shows passen ook op een scherm van 320 pixels zonder horizontaal scrollen. |
| Teksten | De onbedoeld zichtbare `\n` is opgelost. Kortere sectiekoppen en duidelijkere linktitels: “Submit your track”, “Stookhoksessies #452” en “AFTERHOURS”. De genrekeuze Bass House · Tech House en alle bestaande contactadressen zijn behouden. |
| Shows | Geldige komende datums worden gesorteerd en vergeleken met de huidige datum in Nederland. Voor TBA worden neutrale teksten getoond. Er zijn geen evenementnamen, venues of ticketlinks verzonnen. |
| Toegankelijkheid | Duidelijke kopstructuur, toetsenbordfocus, een “Skip to content”-link, toegankelijke luisterlinks, grotere klikvlakken en ondersteuning voor minder beweging. Decoratieve covers hebben een lege alt-tekst binnen een duidelijk benoemde link. |
| CMS en kleurcodes | Homepage, koppen, knoppen, foto’s, kleuren en content blijven te beheren via Pages CMS. HEX-codes met 3 of 6 tekens werken met en zonder `#` en met spaties aan de uiteinden. Ongeldige kleuren vallen terug op de huidige huisstijl. |
| Snelheid | De 11 gebruikte bronafbeeldingen gaan van 5.857.744 naar 1.066.074 bytes: circa 82% kleiner. De vijf gebruikte WOFF2-fontbestanden nemen samen 123.564 bytes in, tegenover 407.772 bytes voor de oorspronkelijke zes TTF-bestanden: circa 70% minder bytes voor de fontbestanden. Een ongebruikt fontgewicht is weggelaten. Deze percentages betreffen de assets, niet een gegarandeerd percentage snellere laadtijd. |
| Vindbaarheid en delen | De huidige inhoud staat ook direct in HTML, met titel, omschrijving, canonical, deelmetadata, een favicon en een deelafbeelding met je echte portret en logo. Crawlers hoeven niet eerst JavaScript uit te voeren om je huidige releases en contactinformatie te vinden. |
| Code en betrouwbaarheid | Leesbare, gestructureerde broncode zonder externe JavaScriptbibliotheken. Nieuwe bestandsversies en verse JSON-verzoeken beperken het oude cacheprobleem. Bij ontbrekende of ongeldige JSON blijft de gepubliceerde versie bruikbaar. |
| Codebeveiliging | CMS-teksten worden als tekst verwerkt via `textContent`. Onveilige linkprotocollen en URL’s met inloggegevens worden geweigerd. Externe links gebruiken HTTPS en `noopener noreferrer`. Een Content Security Policy begrenst scripts, frames en andere bronnen. Geen trackers, formulieren of database toegevoegd. |

Bij een donkere achtergrond worden kleine rode accentteksten indien nodig iets lichter gemaakt voor voldoende contrast. De rode accentkleur zelf blijft behouden. Ook onleesbare tekst op de gekleurde knop krijgt automatisch donker of licht contrast. Je gekozen gewone tekstkleur en kopkleur worden exact gebruikt: die moet je zelf leesbaar houden na wijzigingen.

## Wat ik nog zou aanvullen

- De definitieve evenementnaam, venue en eventuele ticketlink voor 21 oktober 2026. De huidige datum en Amsterdam zijn overgenomen uit je CMS; controleer dat deze gegevens bevestigd zijn. Je kunt dit later invullen zonder opnieuw de hele website te uploaden.
- Op termijn een echte livefoto voor je presskit of een extra sectie. Je huidige portret werkt goed als hoofdfoto; een livefoto kan daarnaast je podiumenergie laten zien.
- Een korte, feitelijke artiestenbio wanneer je die wilt toevoegen. Daarvoor zijn jouw eigen verhaal en relevante feiten nodig; ik heb geen prestaties, optredens of samenwerkingen verzonnen.

## Getest

- Desktop 1440 px, tablet 768 px, mobiel 390 px en klein mobiel 320 px: geen horizontale overflow, alle huidige afbeeldingen geladen.
- Op alle vier schermformaten: één uitgelichte release, vier overige releases, zeven socials en vier overige links.
- Automatische axe-controle op WCAG 2 A/AA en WCAG 2.1 AA: geen gevonden overtredingen in de geteste pagina. Dit is geen volledige toegankelijkheidscertificering; de screenshots zijn ook visueel gecontroleerd.
- CMS-wijzigingen van titels, introductie, knoppen, omschrijving en kleuren, waaronder `#721E1E`, `#ddd` en codes zonder `#`.
- Alle negen luisterplatforms van de uitgelichte release blijven beschikbaar, ook zonder JavaScript.
- Ontbrekende JSON, ongeldige kleuren, ontbrekende velden en null-items laten de code niet vastlopen.
- HTML-achtige CMS-tekst blijft gewone tekst; `javascript:`, `data:`-afbeeldingen en URL’s met inloggegevens worden geweigerd.
- Ongeldige datums en afgelopen shows worden niet als komende shows getoond.
- In de geteste normale pagina geen JavaScriptfouten of CSP-blokkades van eigen onderdelen.
- 38 unieke externe links met een HTTP-verzoek gecontroleerd: 35 gaven status 200. TikTok, Beatport en Bandsintown gaven 403 en kunnen hiermee niet op bereikbaarheid worden beoordeeld. Hun bestaande links zijn behouden. Status 200 garandeert niet dat een platform nooit een login, regiobeperking of latere wijziging toont.

## In één upload doorvoeren

1. Pak de ZIP uit. De bestanden staan direct in de uitgepakte map.
2. Open de hoofdmap van https://github.com/NoSyncMusic/nosync-website.
3. Kies **Add file → Upload files**.
4. Upload alle bestanden uit de uitgepakte map én de complete map **media**. Upload de inhoud op hetzelfde niveau als de bestaande `index.html`; maak geen extra bovenliggende map.
5. Neem ook **.pages.yml** en **.nojekyll** mee. Deze bestanden zijn op een Mac verborgen: druk in Finder op **Command + Shift + .** om het zichtbaar te maken.
6. Klik één keer op **Commit changes**. Bestaande bestanden met dezelfde naam worden vervangen. De websitebestanden staan klaar; je hoeft geen build, installatie of andere hostingdienst in te stellen.
7. Wacht tot GitHub Pages klaar is met publiceren en bekijk https://nosyncmusic.github.io/nosync-website/.

De export verwijst alleen naar de geoptimaliseerde media. Oude, ongebruikte bestanden die al in GitHub staan worden door een upload niet verwijderd; ze worden door deze versie niet geladen.

Dit pakket is voorbereid en lokaal getest. Het is nog niet in jouw repository geüpload of live gepubliceerd.

## Later zelf aanpassen

Open je bestaande Pages CMS en kies:

- **Homepage & kleuren**: artiestennaam, paginatitel, omschrijving, grote titel, introductie, foto, logo, menu, sectiekoppen, knoppen, lege-showtekst en kleuren.
- **Muziek, links & contact**: socials, releases, luisterlinks, artwork, sets, playlists, shows, presskit en e-mailadressen.

Gebruik in de grote titel echte nieuwe regels. Een letterlijk geschreven `\n` wordt voor bestaande invoer ook ondersteund. Gebruik voor externe links de volledige `https://`-URL. Zet “Zichtbaar” uit om een release, link of show te verbergen. Als meerdere releases “Uitgelicht” zijn, wordt de eerste gekozen.

Na opslaan moet GitHub Pages de wijziging nog publiceren. Herlaad daarna de pagina. In Safari op een Mac kun je met **Option + Command + R** opnieuw laden; **Command + Shift + R** kan Reader openen. Versies van CSS en JavaScript in deze export en verse JSON-verzoeken helpen oude inhoud uit de browsercache te voorkomen.

## Grenzen en onderhoud

**Live CMS-inhoud en HTML-terugval:** bezoekers met JavaScript krijgen de nieuwste JSON uit het CMS. De HTML-terugval en de deelafbeelding zijn een momentopname van deze export. Een CMS-opslag bouwt die momentopname niet opnieuw. Voor actuele statische zoek-/deelmetadata, inhoud zonder JavaScript of een latere terugval is een nieuwe HTML-export of een automatische build nodig. De actuele showfiltering werkt met JavaScript; de HTML-momentopname bevat de showgegevens van de exportdatum.

**Domein:** de canonical en deel-URL’s verwijzen nu naar de bestaande GitHub Pages-adres omdat nosyncmusic.com nog niet aan deze hosting is gekoppeld. Bij een latere domeinwissel moeten die URL’s mee wijzigen. Dit pakket bevat geen CNAME en verandert geen DNS, Namecheap-instellingen of hostingprovider.

**Beveiliging:** dit is een beoordeling van de openbare websitebestanden en hun gedrag, geen volledige penetratietest. GitHub-/CMS-accounttoegang, tweestapsverificatie en serverheaders zijn niet vanuit deze ZIP aan te passen. Controleer in GitHub Pages dat HTTPS is ingeschakeld. De CSP staat in HTML; onder andere bescherming tegen insluiten via `frame-ancestors` vereist een echte serverheader. Inline CSS blijft toegestaan voor dynamische kleuren; inline uitvoerbare JavaScript is geblokkeerd. De site bevat geen formulier/backend, trackingcode of in deze beoordeling gevonden hardcoded API-sleutels. Publiceer toekomstige sleutels nooit in deze openbare repository.

Officiële documentatie voor de veiligheidsmaatregelen:

- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy
- https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html
- https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https
