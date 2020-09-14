
# Possible concepts/structure

  - [ ] cílová architktura editoru
    - Model
      - obsahuje data
      - stará se o serializaci
      - modely na sebe můžou navzájem odkazovat a měnit se podle Action
      - model obsahuje VŠECHNY data(vč. vybraných objektů)
    - Actions 
      - obslužná třída pro modely
      - umožňuje spouštění analýz a všechny editace modelů
    - DRAW
      - vykreslování modelů
    - Service
      - obsluhuje Taby
      - ukládá/načítá modely
      - zpracovává vzájemné referencování modelů

  - [ ] Playground pro testování vykreslování komponent a jejich jednodušší vývoj
  - [ ] Historie změn
    - [x] Undo/Redo
    - [ ] Výpis všech změn
      - [ ] Diference (změny v síti)
      - [ ] Barevné zobrazení změn v síti
    - [ ] Grupování změn stejného charakteru -> změna kolečkem = jedna změna
    - [X] Tlačítka + Zkratky
    - [ ] Možnost uložit síť s historií změn
  - [ ] Property bar
  - [ ] [Context menu](#Context-menu)
    - [ ] Analýza
    - [ ] Round menu
  - [ ] Grid
    - [ ] Combobox (velikosti gridu/zapínání vypínání)
  - [ ] Labeled places (zobrazování písmen v places místo počtu a vedle zobrazení markings)
  - [ ] [Multiple selection](#Selections)
    - [ ] Kopírování
    - [ ] Mazání
    - [ ] Pohyb
  - [ ] Taby pro jednotlivé sítě
    - [x] Implementace
    - [ ] Zavření posledního tabu
    - [ ] Modal s upozorněním na uložení změn
    - [ ] Zkratky (ctrl+tab/ctrl+shift+tab/ctrl+n/ctrl+w...)
    - [ ] Scroll/zobrazení listu dolů tlačítkem (při zaplnění obrazovky)
    - [ ] Prohazování tabů tažením(drag)
    - [ ] Křížek pro zavření přímo na tabu
      - [ ] možnost skrytí všech křížků
    - [ ] Delší najetí zobrazí property sítě
  - [ ] Barevné schémata
    - [ ] vybrat tři různé barevné schémata
    - [ ] nastavitelné barvy
  - [ ] hitboxy pro elementy sítě (stejně jako jsou pro arc), 
      každý element sítě tvořený pomocí g - uniformní přístup(v kaźdém g bude tvar který bude hitbox vždy bude navrchu a průhledný ale klikatelný)
  - [ ] Ovládání pouze klávesnicí
    - [ ] Analýza
    - [ ] Implementace zkratek / focus / add / move ...(rozepsat)
  - [ ] Možnost editování textově (stromu/JSON/vlastní formát ...)
        během editování zobrazovaní změn do editoru(**vyžaduje [Automatické pozice](#autopos)**)
  - [ ] multiwindow editor ?
  - [ ] Projektové soubory



### Algoritmy

**všechny algoritmy(analýzy/úpravy/generování) jsou bezestavové** 
Použít javascript-workery/[node child process](https://medium.freecodecamp.org/node-js-child-processes-everything-you-need-to-know-e69498fe970a)
  
  - [ ] Automatické přepočítávání algoritmů
  
  - [ ] Zobrazovaní invariantu vybarvováním obvodu (place/transition/arc)
  - [ ] Koncepty síťe používající logická a synchronizační primitiva(flip-flop,And,or ... Simulace logických obvodů?)
    
  - [ ] Invalidace analýz při změně sítě (opětovné přepočítání invariant)
  - [ ] Algoritmy 
    - [X] Reachability graf (lazy vykreslování pro nekonečné)
    - [ ] 1-bounded net
    - [ ] pokud síť 1-bounded -> umožnit reachability aby byl formou zápisu názvů places

  - [ ] Možnost vykreslení výstupu algoritmu pomocí [Dot lang](https://en.wikipedia.org/wiki/DOT_(graph_description_language))

  - [ ] Implementace a simulace turingova stroje pomocí Petri net

### Výstupy

 - [ ] Tisk (png/html/svg/pdf ...) - různé nastavení (zobrazit výsledky analýz / zvýraznit povolené transitions)
 - [ ] Do [Dot lang](http://thegarywilson.com/blog/2011/drawing-petri-nets/)

### Ukázky

  - [Oriented graph creator](https://bl.ocks.org/cjrd/6863459)
  - [Force graph](http://jsfiddle.net/689Qj/)

### Optimalizace

  - NATIVE (C++ dodatek pro javascript používá se přes import)
  - [x] [SVG animace pomocí rAF](http://bl.ocks.org/pjanik/5169968)

### Vzhled

  - [ ] Automatické pozice elementů tak aby se nepřekrívali (problematika planárního grafu)
  - [ ] možnost zapnout/vypnout force (odpuzovaní elementů)
  - [ ] Opravit křížení arc(algoritmus rozplétání)
  - [ ] Zobrazování pohybu sítě animace
  - Featury pro GUI
    - [ ] Stromové zobrazování subsítí
  - [ ] Context menu circle selector

### Věci navíc

  - [ ] Propojování s I/O
    - [ ] přiřazení QWERT... kláves jednotlivým transitions a ovladání pomocí QWERT
  - [ ] Generování kódu ze sítě - Vlastnosti sítí které se musí splnit aby šlo ze sítě generovat kód


### Poznámky k obhajobě

  - Nepsat zadání, psát pouze obsah hotového, předstírat že zadání není
  - Známe technologie zmínit ale nepřibírá detailně
  - Nakonec zhodnocení co aplikace umí, co bych do budoucna dodělal
  - Srovnání s existujícími programy (co můj program umí lépe, co přináší nového)

[JS variable validator](https://mothereff.in/js-variables)


## Ovládání

## Definice - PNet

editor state defined by finite state machine

### Events

  - Click, RightClick, DoubleClick
  - Drag
  - Scroll
  - Keyboard, KeyPressed, key shortcuts
  - (Dropdown file / paste from clipboard)

### Actions
Applies changes on models
  - souvysející s elementy modelu
    - Přidání
    - Odebrání
    - Úprava
      - Vyžaduje definovat editovací okno s množinou možných vstupů
    - Přesun
      - Implementován pomocí spleci
    - Akce na elementu


## Context menu

  - Delete