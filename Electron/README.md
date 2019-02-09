# RW-PNet EDITOR

### Priority

**FUNKCIONALITA > VZHLED > OPTIMALIZACE**
  - Používání a aktualizace poznámek
  - Základní funkcionalita
  - Pøeètení knížky
  - Prùbìžná dokumentace
  - Text obhajoba

## TODO

  - Odebrat vygenerované *.JS soubory jednotlivì z gitu
  - Taby pro jednotlivé sítì
  - Vytvoøit stavový JSON který bude urèovat pøechody mezi módy a jejich chování(pro myš klávesnici atd.)
bude uložený pøímo v editoru jako default settings (definice enumù které budou dùležité pro fungování budou zvláš v ts nebo d.ts souboru)
  - Blackbox
    - Univerzal IN/OUT/SCAN(scan = pøeètení jestli hodnota splòuje poèet bez odebrání) (pro sítì které budou mít jen tyto transformace a žádné další speciální se bude dát použít zobrazení podobné transformaci pokud bude mít speciální(pojmenované) pak budou vaznaèené labely nebo znaèkami)
    - Pravidla pro vytváøení subsítí, co musí subsítí splòovat
    - Pravidla pro vstupy a výstupy(nemusí být vùbec sub-sí pouze má definované chovaní)
  - Distributed run
  - Rùzné možnosti ukládání
    - Pouze pomocí transitions
    - Se subsítìmi ve stejném souboru/v rùzných souborech
  - Možnost editování textovì (stromu/JSON/vlastní formát ...) bìhem zobrazovaní zmìn do editoru

##### Generování sítí

  - Práce se sekvencemi(streamy)
  - Definují se rùzné sekvence vstupù a výstupù pøi zadaných vstupech a automaticky se vygeneruje sí co splòuje tyto parametry
  - Implementace a simulace turingova stroje pomocí Petri net

### Algoritmy

**všechny algoritmy(analýzy/úpravy/generování) budou funcionální** (pøedá se jim kopie sítì nebo èásti a vrátí hodnotu se kterou se pak dál pracuje)
Použít javascript-workery/[node child process](https://medium.freecodecamp.org/node-js-child-processes-everything-you-need-to-know-e69498fe970a)
  - všechny algoritmy budou spouštì hlavní univerzální algoritmus který bude mít pøístup ke všem možnostem úprav a analýz sítì který následnì vybere podle definice algoritmu které data se mají pøedat algoritmu a jak se pak pracuje s výsledkem
  - Jednoduché propojování více algoritmù dohromady(napø vytvoøení postupù )
  - Rozdìlení algoritmù:
    - Pouze Analitické(ne-editující)
    - Editující
  - Možnost výpoètu CPU-synchronì/CPU-parallelnì/GPU-na GPU.js
    - Výbìr GPU/CPU puštìním benchmarku
  - Možnost vykreslení výstupu algoritmu pomocí [Dot lang](https://en.wikipedia.org/wiki/DOT_(graph_description_language))
  - Determinizace sítì - vynucení priority operací(uživatelské zadání priority jednotlivých transition)
  - Determinizace sítì - (analýza jetli je to možné) vytvoøení deterministické sítì která simuluje nedeterministickou (vyhledávání nìjakého cílového parametru / ohodnocení)
  - Speciální reachibility (rozdìlení sítì na èásti, oznaèení stavu invariatních èástí, pøidání promìnných které umožní redukci nìkterých nekoneèných grafù)
  - Koncepty síe používající logická a synchronizaèní primitiva(flip-flop,And,or ... Simulace logických obvodù?)
  - Invalidace analýz pøi zmìnì sítì (opìtovné pøepoèítání invariant)
  - možnost pracovat s rekurzivním algoritmem - vyhledávání idempotentní operace = konec rekurze

#### Výstupy

 - Tisk (png/html/svg/pdf ...) - rùzné nastavení (zobrazit výsledky analýz / zvýraznit povolené transitions)
 - Do [Dot lang](http://thegarywilson.com/blog/2011/drawing-petri-nets/)
 - Do LateXu

#### Ukázky

  - [Oriented graph creator](https://bl.ocks.org/cjrd/6863459)
  - [Force graph](http://jsfiddle.net/689Qj/)

### Optimalizace

  - NATIVE (C++ dodatek pro javascript používá se pøes import)
  - Komunikace s jiným programem pøes stdin/stdout/stderr -> [node child process](https://medium.freecodecamp.org/node-js-child-processes-everything-you-need-to-know-e69498fe970a)
  - [SVG animace pomocí rAF](http://bl.ocks.org/pjanik/5169968)
  - -trace-opt -trace-deopt

### Vzhled

  - Zobrazování pohybu sítì animace
  - Featury pro GUI
    - Stromové zobrazování subsítí

### Vìci navíc

  - Propojování s I/O (klávesnice, displej pro vykreslování pixelù)
  - Generování kódu ze sítì - Vlastnosti sítí které se musí splnit aby šlo ze sítì generovat kód

### Poznámky k obhajobì

  - Nepsat zadání, psát pouze obsah hotového, pøedstírat že zadání není
  - Známe technologie zmínit ale nepøibírá detailnì
  - Nakonec zhodnocení co aplikace umí, co bych do budoucna dodìlal
  - Srovnání s existujícími programy (co mùj program umí lépe, co pøináší nového)

[JS variable validator](https://mothereff.in/js-variables)
New Features at [Keep](https://keep.google.com/).