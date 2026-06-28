export default class SaveManager {

    static getCoins() {
        return Number(localStorage.getItem("coins")) || 0;
    }

    static setCoins(value) {
        localStorage.setItem("coins", value);
    }

    static getBestScore() {
        return Number(localStorage.getItem("bestScore")) || 0;
    }

    static setBestScore(score) {

        const best = this.getBestScore();

        if (score > best) {

            localStorage.setItem("bestScore", score);

        }

    }

}