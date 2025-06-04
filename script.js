let canvas = document.getElementById('JogoCanvas');
let ctx = canvas.getContext('2d');

class Entidade {
    constructor(x, y, largura, altura) {
        this.posx = x;
        this.posy = y;
        this.largura = largura;
        this.altura = altura;
        this.cor = 'black';
    }

    desenhar(ctx) {
        ctx.fillStyle = this.cor;
        ctx.fillRect(this.posx, this.posy, this.largura, this.altura);
    }
}

class Raquete extends Entidade {
    constructor(x, y, largura, altura) {
        super(x, y, largura, altura);
        this.velocidade = 30; // Velocidade para teclado
        this.cor = '#4A90E2';
    }

    mover(direcao) {
        if (direcao === 'esquerda' && this.posx > 0) {
            this.posx -= this.velocidade;
        } else if (direcao === 'direita' && this.posx + this.largura < canvas.width) {
            this.posx += this.velocidade;
        }
        this.posx = Math.max(0, Math.min(this.posx, canvas.width - this.largura));
    }
}

class Bola extends Entidade {
    constructor(x, y, raio, velocidade) {
        super(x - raio, y - raio, raio * 2, raio * 2); // Ajusta posx, posy para serem o canto superior esquerdo da bounding box
        this.raio = raio;
        // Posição central da bola
        this.centroX = x;
        this.centroY = y;
        this.velocidadeX = velocidade;
        this.velocidadeY = -velocidade;
        this.cor = '#E94E77';
        this.ativa = true;
        this.velocidadeBase = velocidade;
    }

    desenhar(ctx) {
        ctx.fillStyle = this.cor;
        ctx.beginPath();
        ctx.arc(this.centroX, this.centroY, this.raio, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }

    atualizar() {
        if (!this.ativa) return;

        this.centroX += this.velocidadeX;
        this.centroY += this.velocidadeY;

        // Atualiza posx e posy da Entidade para manter consistência se necessário em outro lugar
        this.posx = this.centroX - this.raio;
        this.posy = this.centroY - this.raio;

        if (this.centroX + this.raio > canvas.width) {
            this.centroX = canvas.width - this.raio;
            this.velocidadeX = -this.velocidadeX;
        } else if (this.centroX - this.raio < 0) {
            this.centroX = this.raio;
            this.velocidadeX = -this.velocidadeX;
        }

        if (this.centroY - this.raio < 0) {
            this.centroY = this.raio;
            this.velocidadeY = -this.velocidadeY;
        }

        if (this.centroY + this.raio > canvas.height) { // Bola caiu
            this.ativa = false;
        }
    }

    verificarColisaoRaquete(raquete) {
        let closestX = Math.max(raquete.posx, Math.min(this.centroX, raquete.posx + raquete.largura));
        let closestY = Math.max(raquete.posy, Math.min(this.centroY, raquete.posy + raquete.altura));

        const distanciaX = this.centroX - closestX;
        const distanciaY = this.centroY - closestY;
        const distanciaQuadrada = (distanciaX * distanciaX) + (distanciaY * distanciaY);

        if (distanciaQuadrada < (this.raio * this.raio)) {
            if (this.velocidadeY > 0) { // Apenas se a bola estiver descendo
                 this.centroY = raquete.posy - this.raio - 0.1; // Ajusta para não prender
            }

            const pontoImpacto = (this.centroX - (raquete.posx + raquete.largura / 2)) / (raquete.largura / 2);
            const maxAnguloDesvio = Math.PI / 2.8; // Um pouco mais de 60 graus
            const angulo = pontoImpacto * maxAnguloDesvio;
            
            let velocidadeTotal = Math.sqrt(this.velocidadeX * this.velocidadeX + this.velocidadeY * this.velocidadeY);
            if (velocidadeTotal === 0) velocidadeTotal = this.velocidadeBase; // Evita divisão por zero

            this.velocidadeX = velocidadeTotal * Math.sin(angulo);
            this.velocidadeY = -velocidadeTotal * Math.cos(angulo); // Sempre para cima

            // Garante que a bola não tenha velocidade Y zero ou positiva após o rebote na raquete
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
                tijolo.ativo = false;
                jogo.pontuacao += tijolo.pontos;

                // Lógica de ricochete mais simples e eficaz:
                // Calcula a sobreposição da bola com o tijolo para determinar a direção da colisão.
                const overlapLeft = (this.centroX + this.raio) - tijolo.posx;
                const overlapRight = (tijolo.posx + tijolo.largura) - (this.centroX - this.raio);
                const overlapTop = (this.centroY + this.raio) - tijolo.posy;
                const overlapBottom = (tijolo.posy + tijolo.altura) - (this.centroY - this.raio);

                const minOverlapX = Math.min(overlapLeft, overlapRight);
                const minOverlapY = Math.min(overlapTop, overlapBottom);

                if (minOverlapY < minOverlapX) {
                    this.velocidadeY = -this.velocidadeY;
                    // Ajuste de posição para evitar que a bola fique presa
                    this.centroY += this.velocidadeY > 0 ? minOverlapY : -minOverlapY;
                } else {
                    this.velocidadeX = -this.velocidadeX;
                    this.centroX += this.velocidadeX > 0 ? minOverlapX : -minOverlapX;
                }
                return true;
            }
        }
        return false;
    }
}

class Tijolo extends Entidade {
    constructor(x, y, largura, altura, cor) {
        super(x, y, largura, altura);
        this.corBase = cor;
        this.cor = cor;
        this.ativo = true;
        this.pontos = 10;
    }

    desenhar(ctx) {
        if (!this.ativo) return;
        ctx.fillStyle = this.cor;
        ctx.fillRect(this.posx, this.posy, this.largura, this.altura);
        ctx.strokeStyle = '#222'; // Borda um pouco mais escura para contraste
        ctx.lineWidth = 1;
        ctx.strokeRect(this.posx, this.posy, this.largura, this.altura);
    }
}

class PowerUp extends Entidade {
    constructor(posx, posy) { // posx, posy são o centro do power-up
        const tamanhoBase = canvas.width / 45; // Tamanho responsivo
        super(posx - tamanhoBase / 2, posy - tamanhoBase / 2, tamanhoBase, tamanhoBase);
        this.tipo = this.gerarTipo();
        this.cor = this.definirCor();
        this.velocidadeY = canvas.height / 300; // Velocidade responsiva
        this.pulseAngle = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.06;
        this.pulseAmplitude = 0.2;
        this.glowRadius = tamanhoBase * 0.5;
        this.baseLargura = this.largura;
        this.baseAltura = this.altura;
    }

    gerarTipo() {
        const tipos = ['raqueteGrande', 'vidaExtra', 'bolaLenta', 'bolaExtra', 'multiBola'];
        return tipos[Math.floor(Math.random() * tipos.length)];
    }

    definirCor() {
        switch (this.tipo) {
            case 'raqueteGrande': return '#FFD700';
            case 'vidaExtra': return '#32CD32';
            case 'bolaLenta': return '#1E90FF';
            case 'bolaExtra': return '#BA55D3';
            case 'multiBola': return '#FF69B4';
            default: return '#FFFFFF';
        }
    }

    desenhar(ctx) {
        const scaleFactor = 1 + Math.sin(this.pulseAngle) * this.pulseAmplitude;
        const currentWidth = this.baseLargura * scaleFactor;
        const currentHeight = this.baseAltura * scaleFactor;
        const drawX = this.posx + (this.baseLargura - currentWidth) / 2;
        const drawY = this.posy + (this.baseAltura - currentHeight) / 2;

        ctx.save();
        ctx.shadowColor = this.cor;
        ctx.shadowBlur = this.glowRadius;
        ctx.fillStyle = this.cor;
        ctx.fillRect(drawX, drawY, currentWidth, currentHeight);

        const iconSize = Math.max(8, currentHeight * 0.55); // Tamanho mínimo para ícone
        ctx.font = `bold ${iconSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 0; // Sem sombra para o ícone
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        let icon = '?';
        switch (this.tipo) {
            case 'raqueteGrande': icon = '↔'; break;
            case 'vidaExtra': icon = '+♥'; break;
            case 'bolaLenta': icon = 'S'; break;
            case 'bolaExtra': icon = '●'; break; // Ícone mais simples
            case 'multiBola': icon = '⁂'; break;
        }
        ctx.fillText(icon, drawX + currentWidth / 2, drawY + currentHeight / 2 + 1); // Pequeno ajuste no Y
        ctx.restore();
    }

    atualizar() {
        this.posy += this.velocidadeY;
        this.pulseAngle = (this.pulseAngle + this.pulseSpeed) % (Math.PI * 2);
    }

    verificarColisaoRaquete(raquete) {
        return (
            this.posx < raquete.posx + raquete.largura &&
            this.posx + this.largura > raquete.posx &&
            this.posy < raquete.posy + raquete.altura &&
            this.posy + this.altura > raquete.posy
        );
    }

    aplicarEfeito(jogo) {
        switch (this.tipo) {
            case 'raqueteGrande':
                const larguraOriginalRaquete = jogo.raquete.largura;
                jogo.raquete.largura = Math.min(larguraOriginalRaquete * 1.5, canvas.width * 0.6);
                setTimeout(() => { jogo.raquete.largura = larguraOriginalRaquete; }, 10000);
                break;
            case 'vidaExtra':
                jogo.vidas++;
                break;
            case 'bolaLenta':
                jogo.bolas.forEach(bola => {
                    if (bola.ativa) {
                        bola.velocidadeX *= 0.6;
                        bola.velocidadeY *= 0.6;
                    }
                });
                setTimeout(() => {
                    jogo.bolas.forEach(bola => {
                        if (bola.ativa) {
                            const velMag = Math.sqrt(bola.velocidadeX**2 + bola.velocidadeY**2);
                            if (velMag > 0.1) {
                                bola.velocidadeX = (bola.velocidadeX / velMag) * bola.velocidadeBase;
                                bola.velocidadeY = (bola.velocidadeY / velMag) * bola.velocidadeBase;
                            } else { // Se a bola estiver quase parada
                                bola.velocidadeX = (Math.random() > 0.5 ? 1: -1) * bola.velocidadeBase * 0.707;
                                bola.velocidadeY = -bola.velocidadeBase * 0.707; // Garante que suba
                            }
                        }
                    });
                }, 8000);
                break;
            case 'bolaExtra':
            case 'multiBola':
                const maxBolas = 5;
                let bolasParaAdicionar = (this.tipo === 'multiBola' ? 2 : 1);
                const bolaReferencia = jogo.bolas.find(b => b.ativa) || jogo.bolas[0];
                if (bolaReferencia) {
                    for (let i = 0; i < bolasParaAdicionar && jogo.bolas.length < maxBolas; i++) {
                        const novaBola = new Bola(
                            bolaReferencia.centroX,
                            bolaReferencia.centroY,
                            bolaReferencia.raio,
                            bolaReferencia.velocidadeBase
                        );
                        // Direção ligeiramente aleatória para as novas bolas
                        const anguloAleatorio = (Math.random() - 0.5) * (Math.PI / 3); // Desvio de até 30 graus
                        novaBola.velocidadeX = bolaReferencia.velocidadeBase * Math.sin(anguloAleatorio);
                        novaBola.velocidadeY = -bolaReferencia.velocidadeBase * Math.cos(anguloAleatorio); // Garante que suba
                        jogo.bolas.push(novaBola);
                    }
                }
                break;
        }
    }
}

class Jogo {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.estado = 'inicio'; // 'inicio', 'jogando', 'pausado', 'gameOver', 'vitoria', 'comoJogar'
        this.nivel = 1;
        this.maxNiveis = 3;
        this.pontuacao = 0;

        this.configurarNivel(); // Configura raquete, bola inicial, etc.

        this.menuPausaOpcoes = ['Continuar', 'Reiniciar Nível', 'Sair para Menu'];
        this.menuPausaSelecionado = 0;
        this.menuInicialOpcoes = ['Iniciar Jogo', 'Como Jogar'];
        this.menuInicialSelecionado = 0;

        this.iniciarEventos();
        this.loop();
    }

    configurarNivel() {
        const raqueteLarguraBase = 100;
        const raqueteLargura = Math.min(raqueteLarguraBase, this.canvas.width * 0.25); // Não maior que 25% da largura da tela
        const raqueteAltura = 15;
        this.raquete = new Raquete(this.canvas.width / 2 - raqueteLargura / 2, this.canvas.height - 40, raqueteLargura, raqueteAltura);

        const raioBolaBase = 8;
        const raioBola = Math.max(6, Math.min(raioBolaBase, this.canvas.width / 90)); // Raio responsivo, com mínimo
        const velocidadeBolaBase = 3;
        const velocidadeBola = (velocidadeBolaBase + this.nivel * 0.5) * (this.canvas.width / 900); // Ajusta velocidade à escala do canvas original

        this.bolas = [new Bola(this.canvas.width / 2, this.canvas.height - 60 - raioBola, raioBola, velocidadeBola)];
        
        this.tijolos = [];
        this.powerUps = [];
        if (this.estado === 'inicio' || this.nivel === 1) { // Reseta pontuação no início ou se voltou ao nível 1
            this.pontuacao = 0;
        }
        this.vidas = 3;
        this.criarTijolos();
    }

    criarTijolos() {
        this.tijolos = [];
        const linhasPorNivel = [3, 4, 5];
        const colunas = 10;

        // Calcula dimensões e posições baseadas no tamanho do canvas (900x500 original)
        const padding = 5 * (this.canvas.width / 900);
        const offsetTop = 30 * (this.canvas.height / 500);
        const offsetLeft = 20 * (this.canvas.width / 900);
        
        const larguraTotalDisponivel = this.canvas.width - 2 * offsetLeft - (colunas - 1) * padding;
        const larguraTijolo = larguraTotalDisponivel / colunas;
        const alturaTijolo = 20 * (this.canvas.height / 500);

        const coresNivel = [
            ['#FF4136', '#FF851B', '#FFDC00'],
            ['#2ECC40', '#0074D9', '#B10DC9'],
            ['#F012BE', '#3D9970', '#777777']
        ];

        const linhas = linhasPorNivel[Math.min(this.nivel - 1, linhasPorNivel.length - 1)];
        const coresParaEsteNivel = coresNivel[Math.min(this.nivel - 1, coresNivel.length - 1)];

        for (let c = 0; c < colunas; c++) {
            for (let r = 0; r < linhas; r++) {
                const x = c * (larguraTijolo + padding) + offsetLeft;
                const y = r * (alturaTijolo + padding) + offsetTop;
                const corTijolo = coresParaEsteNivel[r % coresParaEsteNivel.length];
                this.tijolos.push(new Tijolo(x, y, larguraTijolo, alturaTijolo, corTijolo));
            }
        }
    }

    getTouchPos(canvasEl, evt) {
        const rect = canvasEl.getBoundingClientRect();
        const touch = evt.touches && evt.touches.length > 0 ? evt.touches[0] : (evt.changedTouches && evt.changedTouches.length > 0 ? evt.changedTouches[0] : null);
        if (!touch) return null; // Se não houver informação de toque (raro, mas para segurança)

        // Converte coordenadas da tela para coordenadas do canvas (que tem 900x500 de dimensão interna)
        const scaleX = canvasEl.width / rect.width;
        const scaleY = canvasEl.height / rect.height;
        return {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY
        };
    }

    iniciarEventos() {
        document.addEventListener('keydown', (e) => this.tratarKeyDown(e));
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.tratarToque(e, 'start');
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.tratarToque(e, 'move');
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.tratarToque(e, 'end');
        }, { passive: false });
    }
    
    tratarToque(e, tipoEvento) {
        const touchPos = this.getTouchPos(this.canvas, e);
        if (!touchPos) return;

        if (this.estado === 'jogando') {
            if (tipoEvento === 'start' || tipoEvento === 'move') {
                this.raquete.posx = touchPos.x - this.raquete.largura / 2;
                this.raquete.posx = Math.max(0, Math.min(this.raquete.posx, this.canvas.width - this.raquete.largura));
            }
        } else if (tipoEvento === 'end') { // Ações de menu e telas finais no 'touchend'
            if (this.estado === 'inicio' || this.estado === 'pausado') {
                const opcoes = (this.estado === 'inicio') ? this.menuInicialOpcoes : this.menuPausaOpcoes;
                const fontSizeTitulo = this.canvas.height / 11; // Ajustado para ser um pouco menor
                const fontSizeOpcao = this.canvas.height / 20; // Ajustado
                
                // Y base para o título (desenharMenu ajusta isso)
                // Posição Y da primeira opção do menu (aproximada)
                let yPrimeiraOpcao = this.canvas.height / 2 - fontSizeTitulo * 0.2; 
                const alturaLinhaOpcao = fontSizeOpcao * 1.8; // Altura visual de cada item do menu

                opcoes.forEach((opcao, i) => {
                    // Calcula a caixa de colisão para cada opção do menu
                    const textoMetrica = this.ctx.measureText(opcao); // Para largura, se necessário
                    const larguraOpcaoToque = Math.max(textoMetrica.width * 1.2, this.canvas.width * 0.5); // Área de toque generosa
                    const opcaoXMin = this.canvas.width / 2 - larguraOpcaoToque / 2;
                    const opcaoXMax = this.canvas.width / 2 + larguraOpcaoToque / 2;
                    
                    const opcaoYCentro = yPrimeiraOpcao + i * alturaLinhaOpcao;
                    const opcaoYMin = opcaoYCentro - alturaLinhaOpcao / 2;
                    const opcaoYMax = opcaoYCentro + alturaLinhaOpcao / 2;

                    if (touchPos.x >= opcaoXMin && touchPos.x <= opcaoXMax &&
                        touchPos.y >= opcaoYMin && touchPos.y <= opcaoYMax) {
                        if (this.estado === 'inicio') {
                            this.menuInicialSelecionado = i;
                            this.executarAcaoMenuInicial();
                        } else { // pausado
                            this.menuPausaSelecionado = i;
                            this.executarAcaoMenuPausa();
                        }
                    }
                });
            } else if (this.estado === 'gameOver' || this.estado === 'vitoria' || this.estado === 'comoJogar') {
                this.estado = 'inicio'; // Volta para o menu inicial
                this.nivel = 1; // Reseta o nível
                this.configurarNivel(); // Reconfigura o jogo
            }
        }
    }

    tratarKeyDown(e) {
        const key = e.code;
        if (this.estado === 'inicio') {
            if (key === 'ArrowUp' || key === 'ArrowDown') {
                this.menuInicialSelecionado = (this.menuInicialSelecionado + (key === 'ArrowDown' ? 1 : -1) + this.menuInicialOpcoes.length) % this.menuInicialOpcoes.length;
            } else if (key === 'Enter') this.executarAcaoMenuInicial();
        } else if (this.estado === 'jogando') {
            if (key === 'ArrowLeft') this.raquete.mover('esquerda');
            else if (key === 'ArrowRight') this.raquete.mover('direita');
            else if (key === 'Escape' || e.key.toLowerCase() === 'p') {
                this.estado = 'pausado';
                this.menuPausaSelecionado = 0;
            }
        } else if (this.estado === 'pausado') {
            if (key === 'ArrowUp') this.menuPausaSelecionado = (this.menuPausaSelecionado - 1 + this.menuPausaOpcoes.length) % this.menuPausaOpcoes.length;
            else if (key === 'ArrowDown') this.menuPausaSelecionado = (this.menuPausaSelecionado + 1) % this.menuPausaOpcoes.length;
            else if (key === 'Enter') this.executarAcaoMenuPausa();
            else if (key === 'Escape' || e.key.toLowerCase() === 'p') this.estado = 'jogando';
        } else if (this.estado === 'gameOver' || this.estado === 'vitoria' || this.estado === 'comoJogar') {
            if (key) { // Qualquer tecla
                this.estado = 'inicio';
                this.nivel = 1;
                this.configurarNivel();
            }
        }
    }

    executarAcaoMenuInicial() {
        const opcao = this.menuInicialOpcoes[this.menuInicialSelecionado];
        if (opcao === 'Iniciar Jogo') {
            this.estado = 'jogando';
            this.nivel = 1;
            this.configurarNivel(); // Reseta pontuação aqui também se necessário
        } else if (opcao === 'Como Jogar') {
            this.estado = 'comoJogar';
        }
    }

    executarAcaoMenuPausa() {
        const opcao = this.menuPausaOpcoes[this.menuPausaSelecionado];
        if (opcao === 'Continuar') this.estado = 'jogando';
        else if (opcao === 'Reiniciar Nível') {
            this.estado = 'jogando';
            // Mantém pontuação atual do jogador ao reiniciar o nível, mas reseta vidas e posições.
            const pontuacaoAtual = this.pontuacao;
            const vidasAtuais = this.vidas > 1 ? this.vidas -1 : 1; // Penaliza uma vida, mas não game over
            this.configurarNivel();
            this.pontuacao = pontuacaoAtual;
            this.vidas = vidasAtuais;

        } else if (opcao === 'Sair para Menu') {
            this.estado = 'inicio';
            this.nivel = 1;
            this.configurarNivel();
        }
    }

    atualizarLogica() {
        if (this.estado !== 'jogando') return;

        this.bolas.forEach(bola => {
            if (bola.ativa) {
                bola.atualizar();
                bola.verificarColisaoRaquete(this.raquete);
                if (bola.verificarColisaoTijolos(this.tijolos, this)) {
                    // Pontuação e chance de power-up
                    if (Math.random() < 0.2) { // Aumentei um pouco a chance
                        const tijoloDestruido = this.tijolos.find(t => !t.ativo && t.cor !== 'transparent_placeholder');
                        if (tijoloDestruido) {
                             this.powerUps.push(new PowerUp(tijoloDestruido.posx + tijoloDestruido.largura / 2, tijoloDestruido.posy + tijoloDestruido.altura / 2));
                             tijoloDestruido.cor = 'transparent_placeholder'; // Evita dropar múltiplos do mesmo
                        } else if (this.tijolos.length > 0 && this.tijolos.some(t => t.ativo)) { // Fallback se não achar o exato
                            let tijoloAtivoAleatorio = this.tijolos.filter(t => t.ativo)[0];
                            if(tijoloAtivoAleatorio) {
                                 this.powerUps.push(new PowerUp(tijoloAtivoAleatorio.posx + tijoloAtivoAleatorio.largura / 2, tijoloAtivoAleatorio.posy + tijoloAtivoAleatorio.altura / 2));
                            }
                        }
                    }
                }
            }
        });

        this.tijolos = this.tijolos.filter(tijolo => tijolo.ativo);

        this.powerUps.forEach((powerUp, index) => {
            powerUp.atualizar();
            if (powerUp.posy > this.canvas.height) {
                this.powerUps.splice(index, 1);
            } else if (powerUp.verificarColisaoRaquete(this.raquete)) {
                powerUp.aplicarEfeito(this);
                this.powerUps.splice(index, 1);
            }
        });

        const bolasAtivas = this.bolas.filter(bola => bola.ativa);
        if (bolasAtivas.length === 0) {
            this.vidas--;
            if (this.vidas <= 0) {
                this.estado = 'gameOver';
            } else { // Perdeu uma vida, continua o nível
                this.raquete.posx = this.canvas.width / 2 - this.raquete.largura / 2;
                const raioBola = parseFloat(this.bolas[0].raio); // Pega raio da bola anterior
                const velocidadeBola = parseFloat(this.bolas[0].velocidadeBase); // Pega velocidade base
                this.bolas = [new Bola(this.canvas.width / 2, this.canvas.height - 60 - raioBola, raioBola, velocidadeBola)];
            }
        }

        if (this.tijolos.length === 0 && this.estado === 'jogando') {
            this.nivel++;
            if (this.nivel > this.maxNiveis) {
                this.estado = 'vitoria';
            } else { // Próximo nível
                // this.estado = 'jogando'; // Já está
                this.configurarNivel(); // Configura para o próximo nível, reseta bola, etc.
                // Pontuação é mantida e acumulada.
            }
        }
    }

    desenhar() {
        this.ctx.fillStyle = '#000000'; // Fundo preto
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const fontSizeBase = Math.min(this.canvas.width / 40, this.canvas.height / 25); // Fonte base responsiva

        if (this.estado === 'inicio') {
            this.desenharMenu(this.menuInicialOpcoes, this.menuInicialSelecionado, "BREAKOUT V2", "Toque ou Use Teclado", fontSizeBase);
        } else if (this.estado === 'comoJogar') {
            this.desenharTelaComoJogar(fontSizeBase);
        } else if (this.estado === 'jogando') {
            this.raquete.desenhar(this.ctx);
            this.bolas.forEach(bola => { if (bola.ativa) bola.desenhar(this.ctx) });
            this.tijolos.forEach(tijolo => tijolo.desenhar(this.ctx));
            this.powerUps.forEach(powerUp => powerUp.desenhar(this.ctx));
            this.desenharHUD(fontSizeBase * 1.1); // HUD um pouco maior
        } else if (this.estado === 'pausado') {
            this.raquete.desenhar(this.ctx);
            this.bolas.forEach(bola => { if (bola.ativa) bola.desenhar(this.ctx) });
            this.tijolos.forEach(tijolo => tijolo.desenhar(this.ctx));
            this.powerUps.forEach(powerUp => powerUp.desenhar(this.ctx));
            this.desenharHUD(fontSizeBase * 1.1);
            this.desenharMenu(this.menuPausaOpcoes, this.menuPausaSelecionado, "PAUSADO", "Toque ou Use Teclado", fontSizeBase);
        } else if (this.estado === 'gameOver') {
            this.desenharTelaFinal("Game Over", `Pontuação: ${this.pontuacao}`, "Toque ou Tecla para Menu", fontSizeBase);
        } else if (this.estado === 'vitoria') {
            this.desenharTelaFinal("VITÓRIA!", `Pontuação Final: ${this.pontuacao}`, "Toque ou Tecla para Menu", fontSizeBase);
        }
    }
    
    desenharTelaComoJogar(fontSizeBase) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const fontSizeTitulo = fontSizeBase * 1.8;
        const fontSizeTexto = fontSizeBase * 1.0;
        const lineHeight = fontSizeTexto * 1.6;
        let currentY = this.canvas.height * 0.25;

        this.ctx.fillStyle = 'white';
        this.ctx.font = `bold ${fontSizeTitulo}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText("Como Jogar", this.canvas.width / 2, currentY);
        currentY += lineHeight * 2;

        this.ctx.font = `${fontSizeTexto}px Arial`;
        this.ctx.fillText("Mova a raquete para rebater a bola.", this.canvas.width / 2, currentY);
        currentY += lineHeight;
        this.ctx.fillText("Destrua todos os tijolos para avançar.", this.canvas.width / 2, currentY);
        currentY += lineHeight;
        this.ctx.fillText("Apanhe itens para bónus (ou não!).", this.canvas.width / 2, currentY);
        currentY += lineHeight * 1.5;
        
        this.ctx.font = `italic ${fontSizeTexto * 0.9}px Arial`;
        this.ctx.fillStyle = '#CCCCCC';
        this.ctx.fillText("Desktop: Setas para mover, P/Esc para pausar.", this.canvas.width / 2, currentY);
        currentY += lineHeight;
        this.ctx.fillText("Mobile: Arraste para mover, toque nos menus.", this.canvas.width / 2, currentY);
        currentY += lineHeight * 2;

        this.ctx.fillStyle = '#FFFF88';
        this.ctx.font = `bold ${fontSizeTexto * 1.1}px Arial`;
        this.ctx.fillText("Toque ou pressione qualquer tecla para voltar.", this.canvas.width / 2, currentY);
    }

    desenharHUD(fontSize) {
        this.ctx.fillStyle = 'white';
        this.ctx.font = `${fontSize}px Arial`;
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Pontuação: ${this.pontuacao}`, 10, fontSize * 1.1);
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Vidas: ${this.vidas}`, this.canvas.width - 10, fontSize * 1.1);
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Nível: ${this.nivel}`, this.canvas.width / 2, fontSize * 1.1);
    }

    desenharMenu(opcoes, selecionado, titulo, instrucao, fontSizeBase) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const fontSizeTitulo = fontSizeBase * 2.2;
        const fontSizeOpcao = fontSizeBase * 1.4;
        const fontSizeInstrucao = fontSizeBase * 0.9;

        this.ctx.fillStyle = 'white';
        this.ctx.font = `bold ${fontSizeTitulo}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(titulo, this.canvas.width / 2, this.canvas.height * 0.3);

        this.ctx.font = `${fontSizeOpcao}px Arial`;
        opcoes.forEach((opcao, i) => {
            const yPos = this.canvas.height * 0.5 + i * (fontSizeOpcao * 1.8);
            if (i === selecionado) {
                this.ctx.fillStyle = 'yellow';
                this.ctx.fillText(`> ${opcao} <`, this.canvas.width / 2, yPos);
            } else {
                this.ctx.fillStyle = 'white';
                this.ctx.fillText(opcao, this.canvas.width / 2, yPos);
            }
        });

        if (instrucao) {
            this.ctx.font = `${fontSizeInstrucao}px Arial`;
            this.ctx.fillStyle = 'lightgray';
            this.ctx.fillText(instrucao, this.canvas.width / 2, this.canvas.height * 0.85);
        }
    }

    desenharTelaFinal(mensagemPrincipal, mensagemSecundaria, instrucao, fontSizeBase) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const fontSizeMsgPrincipal = fontSizeBase * 2.5;
        const fontSizeMsgSecundaria = fontSizeBase * 1.4;
        const fontSizeInstrucao = fontSizeBase * 1.1;

        this.ctx.fillStyle = 'white';
        this.ctx.font = `bold ${fontSizeMsgPrincipal}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(mensagemPrincipal, this.canvas.width / 2, this.canvas.height * 0.4);

        this.ctx.font = `${fontSizeMsgSecundaria}px Arial`;
        this.ctx.fillText(mensagemSecundaria, this.canvas.width / 2, this.canvas.height * 0.55);

        this.ctx.font = `bold ${fontSizeInstrucao}px Arial`;
        this.ctx.fillStyle = '#FFFF99';
        this.ctx.fillText(instrucao, this.canvas.width / 2, this.canvas.height * 0.75);
    }

    loop() {
        this.atualizarLogica();
        this.desenhar();
        requestAnimationFrame(() => this.loop());
    }
}
document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('JogoCanvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
        const jogo = new Jogo(canvas);
    } else {
        console.error("Elemento Canvas 'JogoCanvas' não encontrado no DOM!");
        const body = document.body;
        if (body) {
            const errorMsg = document.createElement('p');
            errorMsg.textContent = "Erro: O elemento canvas do jogo não foi encontrado.";
            errorMsg.style.color = "red";
            errorMsg.style.textAlign = "center";
            errorMsg.style.marginTop = "50px";
            body.insertBefore(errorMsg, body.firstChild);
        }
    }
});
