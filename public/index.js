'use strict';

// IMPORTS
// import spielfeldStruktur from './raster.js';
// const raster = spielfeldStruktur.raster;

// VARIABLEN
const body = document.querySelector('body');
const socket = io.connect();

// FUNKTIONEN

const erzeugeZahl = (min, max) => ~~(Math.random()*(max + 1 - min)) + min;

// EVENT-LISTENERS

// SOCKET-EVENTS

// INIT

document.addEventListener("DOMContentLoaded", evt => {

    // Würfelkontrolle
    let wuerfel, wuerfelCounter, versuche;

    // Klickkontrolle
    let firstClickData = false;

    // Spielfeld
    const spielFeld = document.querySelector('#spielFeld');
    const ctx = spielFeld.getContext('2d');
    spielFeld.width = 1000;
    spielFeld.height = 1000;

    // Intermediates
    let w = spielFeld.width, h = spielFeld.height;
    let radius = 0.02*w, dx = 3*radius, dy = 2.5*radius;

    // Buttons
    const neuesSpiel = document.querySelector('#neuesSpiel');
    const seiteNeuLaden = document.querySelector('#seiteNeuLaden');
    const dice = document.querySelector('#diceBtn');

    // Header
    const myColorDiv = document.querySelector('#myColor');
    const whichTurnDiv = document.querySelector('#whichTurn');
    const diceValue = document.querySelector('#diceValue');

    // FUNKTIONEN

    const zeichneKreis = (i,j,r,fillStyle) => {
        ctx.beginPath();
        let x = dx*i, y = dy*j;
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.stroke();
        if (fillStyle) {
            ctx.fillStyle = fillStyle;
            ctx.fill();
        }
    }

    const zeichneSpielStand = spiel => {
        myColorDiv.style.backgroundColor = spielerFarbe();
        whichTurnDiv.style.backgroundColor = zugFarbe();
        diceValue.textContent = '';
        diceValue.style.border = `2px solid ${zugFarbe()}`;
        dice.disabled = !(spielerFarbe() == zugFarbe());
        ctx.clearRect(0, 0, w, h);
        for (let i=0;i<spiel.ncols;i++){
            for (let j=0;j<spiel.nrows;j++){
                let feldWert = spiel.spielData[spiel.ncols*j + i];
                if (feldWert) {
                    zeichneKreis(i,j,radius,spiel.farben[feldWert]);
//                    zeichneKreis(i,j,radius);
                }
            }
        }
    }

    const berechneKoordinaten = (event) => {
        let posX = (event.pageX - spielFeld.offsetLeft);
        let posY = (event.pageY - spielFeld.offsetTop);
        let i = posX/dx, j = posY/dy;
        let roundI = Math.round(i), roundJ = Math.round(j);
        let roundX = roundI*dx, roundY = roundJ*dy;
//        console.clear();
        let dr = Math.sqrt((posX - roundX)**2 + (posY - roundY)**2);
        if (dr <= radius) {
            return {isField: true, i: roundI, j: roundJ}
        } else {
            return {isField: false}
        }
    }

    const alleAmStart = () => {
        let spielJSON = localStorage.getItem('spiel');
        if (!spielJSON) return false;
        let spiel = JSON.parse(spielJSON).spiel;
        let zug = spiel.zug, amStart = spiel.alleAmStart;
        console.log(zug);
        console.log(amStart);
        return amStart[zug+2];
    }

    const steinFarbe = (i,j) => {
        let spielJSON = localStorage.getItem('spiel');
        if (!spielJSON) return false;
        let spiel = JSON.parse(spielJSON).spiel;
        let feldWert = spiel.spielData[spiel.ncols*j+i];
        return {
            farbIndex: feldWert,
            farbe: spiel.farben[feldWert]
        };
    }

    const spielerFarbe = () => {
        let spielJSON = localStorage.getItem('spiel');
        if (!spielJSON) return false;
        return JSON.parse(spielJSON).farbe;
    }

    const zugFarbe = () => {
        let spielJSON = localStorage.getItem('spiel');
        if (!spielJSON) return false;
        let spiel = JSON.parse(spielJSON).spiel;
        let zug = spiel.zug, farben = spiel.farben;
        return farben[zug+2];
    }

    const zweiterKlick = evt => {
        let clickResult = berechneKoordinaten(evt);
        if (clickResult.isField) {
            let i = clickResult.i, j = clickResult.j;
            let meineFarbe = spielerFarbe();
            let zweiteSteinFarbe = steinFarbe(i,j).farbe;
            let zweiteSteinFarbIndex = steinFarbe(i,j).farbIndex;
            if (zweiteSteinFarbIndex >0 && zweiteSteinFarbe != meineFarbe) {
                zeichneKreis(i,j,radius,meineFarbe);
                // let secondClickData = {color: zweiteSteinFarbe, i: i, j: j};
                let secondClickData = {colorIndex: zweiteSteinFarbIndex, i: i, j: j};
                let zugInfo = [{...wuerfel},{...firstClickData},secondClickData];
                firstClickData = false;
                wuerfel = false;
                socket.emit('neuerZugUpdateServer', zugInfo);
            }
        }

    }

    const ersterKlick = evt => {
        let clickResult = berechneKoordinaten(evt);
        console.log(clickResult);
        if (clickResult.isField) {
            let i = clickResult.i, j = clickResult.j;

            let meineFarbe = spielerFarbe();
            let ersteSteinFarbe = steinFarbe(i,j).farbe;
            let ersteSteinFarbIndex = steinFarbe(i,j).farbIndex;
            // if (steinFarbe(i,j).farbe == meineFarbe) {
            if (ersteSteinFarbe == meineFarbe) {
                zeichneKreis(i,j,radius,'gray');
                // firstClickData = {color: meineFarbe, i: i, j: j};
                firstClickData = {colorIndex: ersteSteinFarbIndex, i: i, j: j};
//                dice.disabled = true;
            }
        }

    }

    const naechsterZug = event => {
        if (zugFarbe() != spielerFarbe()) return;
        if (wuerfel){
          if (!firstClickData) ersterKlick(event)
          else zweiterKlick(event)
        }
    }

    const throwDice = () => {
        let rnd16 = erzeugeZahl(1,6);
        dice.disabled = true;
        socket.emit('wuerfelUpdateServer', {wert: rnd16});
    }

    const starteNeuesSpiel = () => {
        socket.emit('neuesSpiel');
    }

    const ladeSeiteNeu = () => {
        let spielJSON = localStorage.getItem('spiel');
        if (!spielJSON) return false;
        let spiel = JSON.parse(spielJSON).spiel;
        zeichneSpielStand(spiel);
    }

    const init = () => {
        wuerfel = false;
        wuerfelCounter = 0;
        versuche = alleAmStart()? 3: 1;
    }

    // EVENT-LISTENERS
    spielFeld.addEventListener('click', naechsterZug);
    neuesSpiel.addEventListener('click', starteNeuesSpiel);
    seiteNeuLaden.addEventListener('click',ladeSeiteNeu);
    dice.addEventListener('click', throwDice);

    // SOCKET-EVENTS
    socket.on('neuesSpielUpdateSpieler', spielData => {
        localStorage.removeItem('spiel');
        localStorage.setItem('spiel',JSON.stringify({
            farbe:spielData.farbe,
            spiel:spielData.spiel
        }));
        diceValue.textContent = '';
        zeichneSpielStand(spielData.spiel);
    });

    socket.on('neuerZugUpdateSpieler', spielData => {
        let spielerFarbe = JSON.parse(localStorage.getItem('spiel')).farbe;
        localStorage.setItem('spiel',JSON.stringify({
            farbe:spielerFarbe,
            spiel:spielData
        }));
        diceValue.textContent = '';
        zeichneSpielStand(spielData);
    });

    socket.on('wuerfelUpdateSpieler', turnInfo => {
        diceValue.textContent += ` ${turnInfo.value}`;
        if (turnInfo.nextTurn) {
          wuerfel = {dice: turnInfo.value};
        } else {
          wuerfel = false;
          dice.disabled = !(spielerFarbe() == zugFarbe());
        }
        console.log(wuerfel);
    });

    // INIT
    init();

});
