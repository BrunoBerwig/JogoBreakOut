// js/brick.js
import { Entidade } from './entity.js';

export class Tijolo extends Entidade {
    constructor(x, y, largura, altura, cor) {
        super(x, y, largura, altura);
        this.corBase = cor; // Guardar a cor original se necessário
        this.cor = cor;
        this.ativo = true;
        this.pontos = 10; // Pode variar por cor ou tipo de tijolo no futuro
    }

    desenhar(ctx) {
        if (!this.ativo) return; // Não desenha tijolos inativos

        ctx.fillStyle = this.cor;
        ctx.fillRect(this.posx, this.posy, this.largura, this.altura);
        // Adiciona uma borda para melhor visualização
        ctx.strokeStyle = '#222'; // Borda um pouco mais escura para contraste
        ctx.lineWidth = 1;
        ctx.strokeRect(this.posx, this.posy, this.largura, this.altura);
    }
}