'use strict';

class Spiel {
    constructor(socketId,spielerAnzahl=2,raster,ncols,nrows,zug=0) {
        this.spielId = socketId;
        this.spielerAnzahl = spielerAnzahl;
        this.farben = [false,'','green','black'];
        this.spielData = raster;
        this.ncols = ncols;
        this.nrows = nrows;
        this.zug = zug;
        this.startPunkte = [[],[],];
        this.alleAmStart = [false,false,true,true];
    }
    getSpielData(i,j){
        let num = this.ncols*j + i;
        return this.spielData[num];
    }
    setSpielData(i,j,wert){
        let num = this.ncols*j + i;
        this.spielData[num] = wert;
    }
    inkrementZug(){
        this.zug++;
        if (this.zug == this.spielerAnzahl) this.zug = 0;
    }
    speichereStartPunkte(){
        for (let i=0; i<this.ncols; i++){
            for (let j=0; j<this.nrows; j++){
                let value = this.getSpielData(i,j);
                if (value>1) {
                    let koordinaten = {i:i,j:j};
                    let vierPunkte = this.startPunkte[value];
                    if (vierPunkte) this.startPunkte[value].push(koordinaten)
                    else this.startPunkte[value] = [koordinaten];
                }
            }
        }
    }
}

exports.Spiel = Spiel;
