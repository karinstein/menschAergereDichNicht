'use strict';

// IMPORTS
const initStruktur = require('./raster_init');
const initRaster = initStruktur.raster;
const ncols = initStruktur.ncols;
const nrows = initStruktur.nrows;

const spiel = require('./spiel');

// Express
const express = require('express');
const expressServer = express();
expressServer.use(express.static('public'));

// HTTP
const http = require('http');
const httpServer = http.Server(expressServer);

// Websocket
const socketIo = require('socket.io');
const io = socketIo(httpServer);


// VARIABLEN
const socketpool = {};
let aktuellerSpielStatus;
let diceCounter = 0;

// const farben = ['green','black','red','yellow'];

// Klassen

// FUNKTIONEN

const alleAmStart = () => {
    let fIndex = aktuellerSpielStatus.zug + 2;
    return aktuellerSpielStatus.startPunkte[fIndex].every(elem => {
        return aktuellerSpielStatus.getSpielData(elem.i,elem.j) == fIndex;
    });
}

const darfZiehen = (wuerfel) => {
  return ((!alleAmStart()) || wuerfel==6);
}

const updateSpiel = (zugInfo) => {
    if (!zugInfo) {
        aktuellerSpielStatus.inkrementZug();
        return;
    }
    let f1 = zugInfo[1].colorIndex, i1 = zugInfo[1].i, j1 = zugInfo[1].j;
    let f2 = zugInfo[2].colorIndex, i2 = zugInfo[2].i, j2 = zugInfo[2].j;
//    aktuellerSpielStatus.setSpielData(i0,j0,'');
    aktuellerSpielStatus.setSpielData(i1,j1,1);
    aktuellerSpielStatus.setSpielData(i2,j2,f1);

//    if (f2 && f2.length>0) {
    if (f2>1) {
        let emptySlot = aktuellerSpielStatus.startPunkte[f2].find(elem => {
            return aktuellerSpielStatus.getSpielData(elem.i,elem.j) == 1;
        });
        aktuellerSpielStatus.setSpielData(emptySlot.i,emptySlot.j,f2);
    }
    if (zugInfo[0].dice<6) aktuellerSpielStatus.inkrementZug();
}

const erzeugeZahl = (min, max) => ~~(Math.random() * (max - min) + min);

// Socket-Eventlistener

io.on('connect', socket => {

    socketpool[socket.id] = socket;

    socket.on('neuesSpiel', () => {
        let neuesSpiel = new spiel.Spiel(socket.id,2,[...initRaster],ncols,nrows);
        // let neuesSpiel = new Spiel(socket.id,2,[...initRaster],ncols,nrows);
        aktuellerSpielStatus = neuesSpiel;
        neuesSpiel.speichereStartPunkte();

        // An die ersten spielerAnzahl sockets Farben verteilen
        let counter = 0;
        Object.values(socketpool).forEach(sock => {
            if (counter<neuesSpiel.spielerAnzahl){
                sock.emit('neuesSpielUpdateSpieler',{
                    farbe: neuesSpiel.farben[counter+2],
                    spiel: neuesSpiel
                });
            }
            counter++;
        })
    })


    socket.on('neuerZugUpdateServer', zugInfo => {
        updateSpiel(zugInfo);
        io.emit('neuerZugUpdateSpieler',aktuellerSpielStatus);
    });


    socket.on('wuerfelUpdateServer', wuerfel => {
        let finishTurn = darfZiehen(wuerfel.wert);
        // console.log('wuerfel: ', wuerfel);
        // console.log('diceCounter: ',diceCounter);
        // console.log('darfZiehen: ',finishTurn);
        io.emit('wuerfelUpdateSpieler', {
            nextTurn: finishTurn,
            value:    wuerfel.wert
        });
        if (!finishTurn) {
            diceCounter++;
            if (diceCounter>2){
                diceCounter = 0;
                updateSpiel(false);
                setTimeout(() => { io.emit('neuerZugUpdateSpieler',aktuellerSpielStatus)}, 500);
            }
        }
    })

    socket.on('disconnect', () => {
       delete socketpool[socket.id]
    });
})

// INIT
httpServer.listen(80, err => console.log(err || 'Läuft'));
