export default class GVars {
    constructor(volStep, pH4, pH7) {
        this.volStep = volStep || null;
        this.pH4 = pH4 || null;
        this.pH7 = pH7 || null;
    }

    valuesComplete() {
        return (this.volStep !== null) &&
            (this.pH4 !== null) &&
            (this.pH7 !== null);
    }

    calcVol(heightVal) {
        return heightVal * this.volStep;
    }

    calcPH(analogVal) {
        const grad = 3 / (this.pH7 - this.pH4);
        return grad * (analogVal - this.pH4) + 4;
    }

    toJSON() {
        return {
            "volStep": this.volStep,
            "pH4": this.pH4,
            "pH7": this.pH7,
        }
    }

    static fromJSON(data) {
        return new GVars(data.volStep, data.pH4, data.pH7);
    }
}