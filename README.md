# Kyberbezpečnostní hra pro základní školy (Phaser 3)

Webová vzdělávací hra zaměřená na kybernetickou bezpečnost pro žáky základních škol, vytvořená v rámci bakalářské práce (*Kyberbezpečnostní hra pro základní školy vytvořená pomocí frameworku Phaser*).

## O projektu

Aplikace kombinuje webové rozhraní (HTML/CSS) pro hlavní menu, nápovědu a vyhodnocení s herními scénami postavenými na frameworku **Phaser 3**. Cílem je hravou formou procvičit rozpoznávání kybernetických hrozeb (např. phishing, podezřelé odkazy, síla hesel) a bezpečné chování v online prostředí.

- **Frontend / UI:** HTML5, CSS, JavaScript
- **Herní engine:** Phaser 3
- **Databáze a backend:** Supabase (s automatickým lokálním *fallback* režimem při výpadku připojení)
- **Ukládání průběhu:** `localStorage`

## Spuštění a dostupnost

- **Online verze:** `https://petr2323.github.io/Bakalarka/`

## Struktura projektu

- `index.html` – hlavní rozcestník a inicializace herní relace
- `tutorial.html` – nápověda a základní přehled pojmů z kybernetické bezpečnosti
- `results.html` – souhrn skóre, slovní hodnocení a zpětná vazba pro hráče
- Herní scény a logika v JavaScriptu (včetně integrace Supabase a záložních lokálních dat)

## Nahlášení chyb a kontakt

Pro nahlášení chyb mě kontaktujte na: `mattravencz@gmail.com`

Autor: **Petr Göckert**
