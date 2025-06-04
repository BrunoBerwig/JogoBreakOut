import { Entidade } from './entity.js';

export class Bola extends Entidade {
    constructor(x, y, raio, velocidade, canvas) {
        super(x - raio, y - raio, raio * 2, raio * 2);
        this.raio = raio;
        this.centroX = x;
        this.centroY = y;
        this.velocidadeX = velocidade;
        this.velocidadeY = -velocidade;
        this.corBaseOriginal = '#E94E77'; // Cor padrão da bola
        this.cor = this.corBaseOriginal;
        this.ativa = true;
        this.velocidadeBase = velocidade;
        this.canvas = canvas;
        this.emFogo = false;         // NOVA PROPRIEDADE
        this.corOriginalFogo = this.cor; // Para restaurar após 'bolaDeFogo'
    }

    desenhar(ctx) {
        ctx.fillStyle = this.cor;
        if (this.emFogo) { // Efeito visual para bola de fogo
            ctx.shadowColor = 'yellow';
            ctx.shadowBlur = this.raio * 1.5; // Brilho proporcional ao tamanho
        }
        ctx.beginPath();
        ctx.arc(this.centroX, this.centroY, this.raio, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
        if (this.emFogo) { // Reseta o brilho para não afetar outros desenhos
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
        }
    }

    atualizar() {
        // ... (código existente sem alterações)
        if (!this.ativa) return;

        this.centroX += this.velocidadeX;
        this.centroY += this.velocidadeY;
        this.posx = this.centroX - this.raio;
        this.posy = this.centroY - this.raio;

        if (this.centroX + this.raio > this.canvas.width) {
            this.centroX = this.canvas.width - this.raio;
            this.velocidadeX = -this.velocidadeX;
        } else if (this.centroX - this.raio < 0) {
            this.centroX = this.raio;
            this.velocidadeX = -this.velocidadeX;
        }

        if (this.centroY - this.raio < 0) {
            this.centroY = this.raio;
            this.velocidadeY = -this.velocidadeY;
        }

        if (this.centroY + this.raio > this.canvas.height) {
            this.ativa = false;
        }
    }

    verificarColisaoRaquete(raquete) {
        // ... (código existente sem alterações)
        let closestX = Math.max(raquete.posx, Math.min(this.centroX, raquete.posx + raquete.largura));
        let closestY = Math.max(raquete.posy, Math.min(this.centroY, raquete.posy + raquete.altura));

        const distanciaX = this.centroX - closestX;
        const distanciaY = this.centroY - closestY;
        const distanciaQuadrada = (distanciaX * distanciaX) + (distanciaY * distanciaY);

        if (distanciaQuadrada < (this.raio * this.raio)) {
            if (this.velocidadeY > 0) { 
                this.centroY = raquete.posy - this.raio - 0.1;
            }

            const pontoImpacto = (this.centroX - (raquete.posx + raquete.largura / 2)) / (raquete.largura / 2);
            const maxAnguloDesvio = Math.PI / 2.8; 
            const angulo = pontoImpacto * maxAnguloDesvio;
            
            let velocidadeTotal = Math.sqrt(this.velocidadeX * this.velocidadeX + this.velocidadeY * this.velocidadeY);
            if (velocidadeTotal === 0) velocidadeTotal = this.velocidadeBase;

            this.velocidadeX = velocidadeTotal * Math.sin(angulo);
            this.velocidadeY = -velocidadeTotal * Math.cos(angulo); 
            if (this.velocidadeY >= -0.1) {
                this.velocidadeY = -Math.max(0.5, Math.abs(this.velocidadeBase * Math.cos(angulo)));
            }
            return true;
        }
        return false;
    }

    verificarColisaoTijolos(tijolos, jogo) {
        for (let i = 0; i < tijolos.length; i++) {
            const tijolo = tijolos[i];
            if (!tijolo.ativo) continue;

            let closestX = Math.max(tijolo.posx, Math.min(this.centroX, tijolo.posx + tijolo.largura));
            let closestY = Math.max(tijolo.posy, Math.min(this.centroY, tijolo.posy + tijolo.altura));

            const distanciaX = this.centroX - closestX;
            const distanciaY = this.centroY - closestY;
            const distanciaQuadrada = (distanciaX * distanciaX) + (distanciaY * distanciaY);

            if (distanciaQuadrada < (this.raio * this.raio)) {
                tijolo.ativo = false; // Tijolo é destruído
                jogo.pontuacao += tijolo.pontos;

                if (this.emFogo) {
                    // Bola de fogo atravessa, não ricocheteia no tijolo
                    // Apenas continua em sua trajetória. O tijolo já foi desativado.
                } else {
                    // Lógica de ricochete normal
                    const overlapLeft = (this.centroX + this.raio) - tijolo.posx;
                    const overlapRight = (tijolo.posx + tijolo.largura) - (this.centroX - this.raio);
                    const overlapTop = (this.centroY + this.raio) - tijolo.posy;
                    const overlapBottom = (tijolo.posy + tijolo.altura) - (this.centroY - this.raio);

                    const minOverlapX = Math.min(overlapLeft, overlapRight);
                    const minOverlapY = Math.min(overlapTop, overlapBottom);

                    if (minOverlapY < minOverlapX) {
                        this.velocidadeY = -this.velocidadeY;
                        this.centroY += this.velocidadeY > 0 ? minOverlapY : -minOverlapY;
                    } else {
                        this.velocidadeX = -this.velocidadeX;
                        this.centroX += this.velocidadeX > 0 ? minOverlapX : -minOverlapX;
                    }
                }
                return true; // Colisão detectada e tratada (ou atravessada)
            }
        }
        return false;
    }
}