# No Sync website

Static website for GitHub Pages. No build step or paid hosting is required.

## First upload

Upload index.html, styles.css, script.js, content.json, pages-config.yml and the media folder to the repository root. Keep the media folder intact. Upload the extracted files, not the ZIP or its parent folder.

## Pages CMS

Rename pages-config.yml to .pages.yml on GitHub (open file, Edit, change filename, Commit). If .pages.yml was already uploaded, remove pages-config.yml instead. The configuration must be at the repository root.

Connect this repository at https://app.pagescms.org/ . The CMS edits content.json. Save changes to the main branch; GitHub Pages updates automatically. Upload media through the CMS.

To feature a different release, turn off Featured for the old release and turn it on for the new release. Non-featured cards show Spotify and Apple Music; the featured release shows every platform.

Shows use YYYY-MM-DD and past shows are hidden automatically in Europe/Amsterdam time. The existing Amsterdam listing is TBA; add its confirmed event name and ticket link when available.

The initial data and owned images were migrated from the public No Sync Komi page. No Komi requests or assets are needed by the new site. The latest-release card links directly to music platforms.

## Local preview

Run python3 -m http.server 8000 in this folder and open http://localhost:8000 . Double-clicking index.html is insufficient because browsers block the content.json request for file URLs.

## Domain

Configure the custom domain only after reviewing the GitHub Pages preview. No domain/CNAME change is included in this initial version.

## Layout

Responsive desktop and mobile layouts; no analytics, cookies, embeds, database or automatic playback. Fonts are stored locally with the site. Website content is English and CMS labels are Dutch.
