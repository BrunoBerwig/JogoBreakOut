// js/paddle.js
import { Entidade } from './entity.js';

export class Raquete extends Entidade {
    constructor(x, y, largura, altura, canvas) { // Adicionado canvas para limites
        super(x, y, largura, altura);
        this.velocidade = 30;
        this.cor = '#4A90E2';
        this.canvas = canvas; // Armazena a referência do canvas
    }

    mover(direcao) {
        if (direcao === 'esquerda' && this.posx > 0) {
            this.posx -= this.velocidade;
        } else if (direcao === 'direita' && this.posx + this.largura < this.canvas.width) {
            this.posx += this.velocidade;
        }
        // Garante que a raquete não saia dos limites após o movimento
        this.posx = Math.max(0, Math.min(this.posx, this.canvas.width - this.largura));
    }
}