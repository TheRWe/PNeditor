# RW-PNet EDITOR

## Priority

  - ka�d� objekt vlasn� soubor
  - ka�d� z�lo�ka bude m�t vlastn� stav 
  - (n�kter� stavy budou reagovat na p�echod na jinou z�lo�ku n�kter� ne)
  - dokumentovat hotov� v�ci

**FUNKCIONALITA > VZHLED > OPTIMALIZACE**
  - Pou��v�n� a aktualizace pozn�mek -> P�ed ka�d�m commitem �pravy
  - Z�kladn� funkcionalita
  - P�e�ten� kn�ky
  - Pr�b�n� dokumentace
  - Text obhajoba
  - Buildov�n� pomoc� "build" v cmd

## TODO


  - [ ] c�lov� architktura editoru
    - Model
      - obsahuje data
      - star� se o serializaci
      - modely na sebe m��ou navz�jem odkazovat a m�nit se podle Action
      - model obsahuje V�ECHNY data(v�. vybran�ch objekt�)
    - Actions 
      - obslu�n� t��da pro modely
      - umo��uje spou�t�n� anal�z a v�echny editace model�
    - DRAW
      - vykresluje model v svg
    - Compound
      - zpracov�v� u�ivatelsk� vstup -> propojuje pomoc� callback� draw->actions
    - Service
      - obsluhuje Taby
      - ukl�d�/na��t� modely
      - zpracov�v� vz�jemn� referencov�n� model�

  - [ ] anal�za rozd�len� k�du do soubor�
  - [ ] show hitboxes
  - [ ] Vykreslov�n� abstrakce
    - [ ] [Definice API](#vykreslovani-modelu)
    - [ ] Implementace
  - [ ] Historie zm�n
    - [x] Undo/Redo
    - [ ] V�pis v�ech zm�n
      - [ ] Diference (zm�ny v s�ti)
      - [ ] PNet umo��uje serializaci a deserializaci diferenc�
      - [ ] Speci�ln� v�pis -> vyfiltruje postup tak �e bude pouze p�id�v�n� a n�zvy
    - [ ] Kole�ko grupov�n�
    - [ ] Tla��tka + Zkratky(controlbar-main)
    - [ ] Mo�nost ulo�it s� s histori� zm�n
  - [ ] Property bar
  - [ ] [Context menu](#Context-menu)
    - [ ] Anal�za
    - [ ] Round menu
  - [ ] Grid
    - [ ] Combobox (velikosti gridu/zap�n�n� vyp�n�n�)
  - [ ] Labeled places (zobrazov�n� p�smen v places m�sto po�tu a vedle zobrazen� markings)
  - [ ] 
  - [x] Drag
    - [x] Posouv�n� jednoliv�ch objekt�
    - [x] Z�vislost dragov�n� na mousemode
    - [x] Selekce v svg v�ce objekt�
    - [x] Posouv�n� v�ce vybran�ch objekt�
  - [ ] [Multiple selection](#Selections)
    - [ ] Integrace v property bar
    - [ ] Kop�rov�n� v�b�ru
    - [ ] Vlo�it v�b�r jako (norm�ln�/subs�/vlo�it bez vybran�ch vlastnost�/v�echny markings jin� ....)? 
  - [ ] Taby pro jednotliv� s�t�
    - [x] Implementace
    - [ ] Zav�en� posledn�ho tabu
    - [ ] Modal s upozorn�n�m na ulo�en� zm�n
    - [ ] Zkratky (ctrl+tab/ctrl+shift+tab/ctrl+n/ctrl+w...)
    - [ ] Scroll/zobrazen� listu dol� tla��tkem (p�i zapln�n� obrazovky)
    - [ ] Prohazov�n� tab� ta�en�m(drag)
    - [x] K��ek pro zav�en�
      - [ ] mo�nost skryt� v�ech k��k�
    - [ ] Del�� najet� zobraz� property s�t�
    - [ ] Vlo�en� s�t� z tabu do aktu�ln� otev�en�ho tabu jako subs�
  - [ ] Tranformace featury
    - [ ] Tla��tko(foreign) pro oto�en� arc
    - [ ] Obojsm�rn� transformace (GUI tla��tko umo�nuj�c� zobrazit druh� textbox)
    - [ ] Scan arcs
  - [ ] Barevn� sch�mata
    - [ ] vybrat t�i r�zn� barevn� sch�mata
    - [ ] nastaviteln� barvy
  - [ ] [Anal�za + soupis stav�](#nastaveni-stavy)(vhodn� pro budouc� vytvo�en� dokumentace)
    - [ ] Implementace
      - [X] Nejd��ve pouze checkboxy
      - [ ] Toggles [speci�ln�](https://proto.io/freebies/onoff/) (toggle button/switch CSS)
      - [ ] P�id�n� mo�nosti u�ivatelsk�ho nastaven� 
(skop�rov�n� defaultn�ho nastaven� - t�m vytvo�en� souboru pro u�ivatelskou editaci)
      - [ ] Mo�nost u�ivatelsk�ho nastaven� kde jsou 
        ulo�en� pouze diference s defaultn�m nastaven�m
  - [ ] hitboxy pro elementy s�t� (stejn� jako jsou pro arc), 
ka�d� element s�t� tvo�en� pomoc� g - uniformn� p��stup(v ka�d�m g bude tvar kter� bude hitbox v�dy bude navrchu a pr�hledn� ale klikateln�)
  - [ ] Blackbox
    - [ ] [Pravidla](#subsite-pravidla) pro vytv��en� subs�t�, co mus� subs�t� spl�ovat
    - [ ] z�kladn� Implementace subs�t� [IN/OUT/SCAN](#IOC) (funguje jako transformace - jeden vstup, jeden v�stup, jeden scan (scan = p�e�ten� jestli hodnota spl�uje po�et bez odebr�n�)) 
    - [ ] pokro��l� s�t� - "pojmenovan� IOS+Combined transformace" pak budou vazna�en� labely nebo zna�kami(oboj�?)
    - [ ] Pravidla pro vstupy a v�stupy(nemus� b�t v�bec sub-s� pouze m� definovan� chovan�)
  - [ ] Scoping (prom�nn� pro transition... - r�zn� re�imy jedn� s�t�)
    - [ ] Anal�za
  - [ ] Distributed run
  - [ ] Ovl�d�n� pouze kl�vesnic�
    - [ ] Anal�za
    - [ ] Implementace zkratek / focus / add / move ...(rozepsat)
  - R�zn� mo�nosti ukl�d�n�
    - Pouze pomoc� transitions
    - Se subs�t�mi ve stejn�m souboru/v r�zn�ch souborech
  - [ ] Mo�nost editov�n� textov� (stromu/JSON/vlastn� form�t ...)
b�hem zobrazovan� zm�n do editoru(**vy�aduje [Automatick� pozice](#autopos)**)
  - [ ] Spojov�n� places/Transitions dragem
  - [ ] sn�it citlivost dragu
  - [ ] multiwindow editor ?
  - [ ] Projektov� soubory



### Algoritmy

**v�echny algoritmy(anal�zy/�pravy/generov�n�) budou funcion�ln�** (p�ed� se jim kopie s�t� nebo ��sti a vr�t� hodnotu se kterou se pak d�l pracuje)
Pou��t javascript-workery/[node child process](https://medium.freecodecamp.org/node-js-child-processes-everything-you-need-to-know-e69498fe970a)
  
  - [ ] Zobrazovan� invariantu vybarvov�n�m obvodu (place/transition/arc)
  - [ ] Automatick� p�epo��t�v�n� algoritm�
  
  - [ ] Koncepty s�e pou��vaj�c� logick� a synchroniza�n� primitiva(flip-flop,And,or ... Simulace logick�ch obvod�?)
    
  - [ ] v p��pad� dlouh�ho v�po�tu algoritmu bude v�po�et lazy
    - [ ] Invalidace anal�z p�i zm�n� s�t� (op�tovn� p�epo��t�n� invariant)
  - [ ] Algoritmy 
    - [ ] Reachability graf (lazy vykreslov�n� pro nekone�n�)
    - [ ] 1-bounded net
    - [ ] pokud s� 1-bounded -> umo�nit reachability aby byl formou z�pisu n�zv� places
    - [ ] scenario-based

  - [ ] Mo�nost vykreslen� v�stupu algoritmu pomoc� [Dot lang](https://en.wikipedia.org/wiki/DOT_(graph_description_language))

#### Generov�n� s�t�

  - Pr�ce se sekvencemi(streamy)
  - Definuj� se r�zn� sekvence vstup� a v�stup� p�i zadan�ch vstupech a automaticky se vygeneruje s� co spl�uje tyto parametry
  - Implementace a simulace turingova stroje pomoc� Petri net

### V�stupy

 - [ ] Tisk (png/html/svg/pdf ...) - r�zn� nastaven� (zobrazit v�sledky anal�z / zv�raznit povolen� transitions)
 - [ ] Do [Dot lang](http://thegarywilson.com/blog/2011/drawing-petri-nets/)
 - [ ] Do LateXu

### Uk�zky

  - [Oriented graph creator](https://bl.ocks.org/cjrd/6863459)
  - [Force graph](http://jsfiddle.net/689Qj/)

### Optimalizace

  - [ ] dotahov�n� s�t� asynchron� (i subs�t�?)
  - NATIVE (C++ dodatek pro javascript pou��v� se p�es import)
  - Komunikace s jin�m programem p�es stdin/stdout/stderr -> [node child process](https://medium.freecodecamp.org/node-js-child-processes-everything-you-need-to-know-e69498fe970a)
  - [x] [SVG animace pomoc� rAF](http://bl.ocks.org/pjanik/5169968)
  - -trace-opt -trace-deopt

### Vzhled

  - [ ] [](#){#autopos} Automatick� pozice element� tak aby se nep�ekr�vali
  - [ ] p�i vkl�d�n� mo�nost zapnout force kter� odtla�� p�ekr�vaj�c� se elementy od sebe
  - [ ] Opravit k��en� arc(algoritmus rozpl�t�n�)
  - [ ] Zobrazov�n� pohybu s�t� animace
  - Featury pro GUI
    - [ ] Stromov� zobrazov�n� subs�t�
  - [ ] Context menu circle selector

### V�ci nav�c

  - [ ] Propojov�n� s I/O (kl�vesnice, displej pro vykreslov�n� pixel�)
  - [ ] Generov�n� k�du ze s�t� - Vlastnosti s�t� kter� se mus� splnit aby �lo ze s�t� generovat k�d
  
### Ostatn�

  - [x] Odebrat vygenerovan� *.JS soubory jednotliv� z gitu

### Pozn�mky k obhajob�

  - Nepsat zad�n�, ps�t pouze obsah hotov�ho, p�edst�rat �e zad�n� nen�
  - Zn�me technologie zm�nit ale nep�ib�r� detailn�
  - Nakonec zhodnocen� co aplikace um�, co bych do budoucna dod�lal
  - Srovn�n� s existuj�c�mi programy (co m�j program um� l�pe, co p�in�� nov�ho)

[JS variable validator](https://mothereff.in/js-variables)
New Features at [Keep](https://keep.google.com/).



# Dokumentace
[Architektura editoru](https://codepen.io/TheRW/pen/GzxxYV) (a� bude kompletn� tak zkop�rovat sem jako obr�zek)

## Ovl�d�n�

### V�b�ry (Selections){#Selections}
Elementy modelu mohou b�t vybran� bu� v re�imu single/multiple(/all)


## Definice - PNet

### Transformace{#IOC}

 - IN Transformace - Transformace kter� m� extern� vstup(m��e b�t implementovan� jako scan vstup)
 - OUT Transformace - Transformace kter� m� extern� v�stup 

### Arc

 - IN - z place do Transformace (z�porn� ��slo)
 - OUT - z Transformace do place (z�porn� ��slo)
 - Combined - kombinace IN i OUT arc (ob� mezi jednou transformac� a jend�m place)
   - Scan - speci�ln� combined kter� vrac� stejn� kolik bere (v�sledek neovlivn� place)


## Nastaven�
tor se nach�z� v�dy v n�jak� mno�in� stav� kter� je slo�ena min�maln� z hlavn�ho stavu.
Mno�ina stav� m��e obsahovat nav�c p�ep�nac� stavy. 
Mezi stavy se p�ech�z� ud�lostmi nebo zm�nou p�ep�na��. 

  - Hlavn� stav
    - Minim�ln� default, mo�nost p�ech�zen� mezi stavy akcemi
  - [V�b�r - Selections](#Selections)
  - P�ep�nac� stavy (��zen� p�ep�nac�mi tla��tky - p�epnut� tla��tka taky br�no jako ud�lost)
    - Toggle 

### Ud�losti
Ud�losti jsou vn�j�� vlivy(u�ivatelsk� vstup...) p�sob�c� na editor.
Zp�sobuj� p�echody mezi stavy

  - Click, RightClick, DoubleClick
  - Drag
  - Scroll
  - Keyboard, KeyPressed, kl�vesov� zkratky
  - (Dropdown soubor/vlo�en� ze schr�nky)

### Akce
Definuj� co se d�je p�i p�echody mezi stavy.
M��e se jednat o akce aplikovan� na jeden nebo v�b�r element�.
Mo�nost jednotliv�ch akc� omezena podle podle ud�lost�? 
(akce nem��e b�t p�i�azena ud�lestem pro kter� ned�v� smysl)

  - souvysej�c� s elementy modelu
    - P�id�n�
    - Odebr�n�
    - �prava
      - Vy�aduje definovat editovac� okno s mno�inou mo�n�ch vstup�
    - P�esun
      - Implementov�n pomoc� spleci
    - Akce na elementu

## Subs�t�

### Pravidla{#subsite-pravidla}


## Vykreslov�n�{#vykreslovani-modelu}
obsahuje definice jak se budou vykreslovat elementy dan�ho modelu. p�ed�v�n� nastaven�-re�im�?
sada funkc� do kter�ch se p�ed�vaj� callbacky a element modelu a vr�t� vykreslen� element(?)
Definice tla��tek v context menu v dan�m stavu(mode, selection...)

## Context menu

  - Delete