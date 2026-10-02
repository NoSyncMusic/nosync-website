# No Sync — Namecheap productie-publicatie

Deze repository gebruikt twee gescheiden omgevingen:

- **Preview/test:** GitHub Pages — https://nosyncmusic.github.io/nosync-website/
- **Productie:** Namecheap Shared Hosting — https://nosyncmusic.com

Normale wijzigingen worden via Pages CMS naar GitHub geschreven en verschijnen automatisch op de GitHub Pages-preview.

De productieversie verandert alleen via de beveiligde GitHub Actions-workflow **Publish to Namecheap**. Normaal start Pages CMS deze workflow; GitHub Actions biedt daarnaast een handmatige fallback als Pages CMS niet beschikbaar is.

## Eenmalige Namecheap-inrichting

Maak in cPanel een **apart FTP-account voor alleen deze website**.

Ga naar:

**cPanel → Files → FTP Accounts**

Gebruik bij het FTP-account als directory uitsluitend de document root van `nosyncmusic.com`.

Daardoor ziet het deployment-account geen andere websites op dezelfde Stellar Plus-hosting.

Gebruik voor GitHub als host bij voorkeur de **server hostname uit de Namecheap Welcome Email**, niet het domein zelf. Dat blijft ook werken voordat DNS naar de nieuwe hosting is omgezet.

De workflow gebruikt versleutelde FTP via expliciete TLS (FTPes), poort 21.

## GitHub Secrets

Ga naar:

**https://github.com/NoSyncMusic/nosync-website → Settings → Secrets and variables → Actions → New repository secret**

Maak exact deze drie secrets aan:

### NAMECHEAP_FTP_HOST

De server hostname van de Namecheap hosting.

Voorbeeldvorm:

`server123.web-hosting.com`

### NAMECHEAP_FTP_USER

De gebruikersnaam van het speciale FTP-account dat alleen toegang heeft tot deze site.

### NAMECHEAP_FTP_PASSWORD

Het wachtwoord van dat FTP-account.

Zet deze gegevens **nooit** in `content.json`, `.pages.yml`, README-bestanden of de workflowcode.

## Publiceren

### Normaal via Pages CMS

1. Pas de website aan in Pages CMS.
2. Sla de wijziging op.
3. Open de GitHub Pages-preview en controleer de website.
4. Wacht tot de Pages-build en Site browser smoke tests groen zijn.
5. Ga terug naar Pages CMS.
6. Klik **Publiceer naar Namecheap** en bevestig.

### Handmatige fallback als Pages CMS niet beschikbaar is

1. Open GitHub → Actions → **Publish to Namecheap**.
2. Kies **Run workflow**.
3. Laat `payload` leeg.
4. Vul bij `commit_sha` het volledige 40-teken SHA van de gecontroleerde commit in.
5. Start de workflow.

De workflow weigert een commit die niet op `main` staat of geen groene GitHub Pages-build én groene browser-smoketest heeft.

Na de upload worden productie-URLs gecontroleerd en worden `page-transitions.js` en `content.json` byte-voor-byte met de geselecteerde commit vergeleken.

## Wat wordt niet gepubliceerd?

De deployment slaat beheer- en ontwikkelbestanden over, waaronder:

- `.git/`
- `.github/`
- `.pages.yml`
- `README.md`
- `CMS-GUIDE.md`
- `NAMECHEAP-DEPLOY.md`
- `scripts/`

Websitebestanden zoals HTML, CSS, JavaScript, afbeeldingen en JSON-content worden wel gepubliceerd.

## Veilig gedrag

De deployment overschrijft en uploadt websitebestanden, maar verwijdert niet automatisch onbekende bestanden op de server. Zo worden bijvoorbeeld Namecheap- of SSL-bestanden niet per ongeluk verwijderd.

## Workflow

De productie-workflow staat in:

`.github/workflows/deploy-namecheap.yml`

De Pages CMS-knop staat in:

`.pages.yml`


## Rollback

Een rollback gebruikt dezelfde handmatige GitHub Actions-route. Vul het SHA in van een **eerder getest commit** dat nog onderdeel is van `main`. Dezelfde test-gates en productie-verificatie blijven gelden.

## Gegenereerde pre-savepagina's

De hoofddeploy verwijdert bewust geen onbekende bestanden uit de volledige hostingroot. Alleen de door deze website beheerde map `/presave/` wordt exact gesynchroniseerd, inclusief het gecontroleerd verwijderen van verouderde gegenereerde pagina's.
