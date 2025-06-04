// js/main.js
import { Jogo } from './game.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('JogoCanvas');
    if (canvas) {
        // eslint-disable-next-line no-unused-vars
        const jogo = new Jogo(canvas); // A instância do jogo se auto-gerencia
    } else {
        console.error("Elemento Canvas 'JogoCanvas' não encontrado no DOM!");
        const body = document.body;
        if (body) {
            const errorMsg = document.createElement('p');
            errorMsg.textContent = "Erro: O elemento canvas do jogo não foi encontrado. Verifique o ID no HTML.";
            errorMsg.style.color = "red";
            errorMsg.style.textAlign = "center";
            errorMsg.style.marginTop = "50px";
            errorMsg.style.fontSize = "18px";
            body.insertBefore(errorMsg, body.firstChild);
        }
    }
});