// js/game.js
import { Raquete } from './paddle.js';
import { Bola } from './ball.js';
import { Tijolo } from './brick.js';
import { PowerUp } from './powerup.js';
// Se você implementou partículas, mantenha o import:
// import { Particula } from './particle.js';

export class Jogo {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.estado = 'inicio'; 
        this.nivel = 1;
        this.maxNiveis = 3;
        this.pontuacao = 0;

        this.menuPausaOpcoes = ['Continuar', 'Reiniciar Nível', 'Sair para Menu'];
        this.menuPausaSelecionado = 0;
        this.menuInicialOpcoes = ['Iniciar Jogo', 'Como Jogar'];
        this.menuInicialSelecionado = 0;
        
        this.escudoAtivo = false; // Inicializa o estado do escudo
        // this.escudoQuebrou = false; // Para animação futura de quebra (opcional)
        
        // Se você implementou partículas:
        // this.particulas = []; 

        this.configurarNivel(); 

        this.iniciarEventos();
        this.loop();
    }

    configurarNivel() {
        // Raquete
        const raqueteLarguraBase = 100;
        const raqueteLargura = Math.max(60, Math.min(raqueteLarguraBase, this.canvas.width * 0.25));
        const raqueteAltura = 15;
        this.raquete = new Raquete(
            this.canvas.width / 2 - raqueteLargura / 2,
            this.canvas.height - 40,
            raqueteLargura,
            raqueteAltura,
            this.canvas
        );

        // Bola
        const raioBolaBase = 8;
        const raioBola = Math.max(6, Math.min(raioBolaBase, this.canvas.width / 90, 12));
        const velocidadeBolaBase = 3;
        const velocidadeBola = (velocidadeBolaBase + (this.nivel -1) * 0.5) * (this.canvas.width / 900);

        this.bolas = [new Bola(
            this.canvas.width / 2,
            this.canvas.height - 60 - raioBola,
            raioBola,
            velocidadeBola,
            this.canvas
        )];
        
        this.tijolos = [];
        this.powerUps = [];
        
        this.escudoAtivo = false; // Reseta o escudo ao (re)configurar o nível
        // this.escudoQuebrou = false; // Opcional
        
        // Se você implementou partículas:
        // if (this.particulas) this.particulas = [];

        if (this.estado === 'inicio' || this.nivel === 1) {
            this.pontuacao = 0;
        }
        this.vidas = 3; 
        this.criarTijolos();
    }

    criarTijolos() {
        this.tijolos = [];
        const linhasPorNivel = [3, 4, 5]; 
        const colunas = 10;

        const padding = 5 * (this.canvas.width / 900);
        const offsetTop = 30 * (this.canvas.height / 500);
        const offsetLeft = 20 * (this.canvas.width / 900);
        
        const larguraTotalDisponivel = this.canvas.width - 2 * offsetLeft - (colunas - 1) * padding;
        const larguraTijolo = larguraTotalDisponivel / colunas;
        const alturaTijolo = 20 * (this.canvas.height / 500);

        const coresNivel = [ 
            ['#FF4136', '#FF851B', '#FFDC00'], 
            ['#2ECC40', '#0074D9', '#B10DC9', '#FF851B'], 
            ['#F012BE', '#3D9970', '#777777', '#0074D9', '#FFDC00']
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
    
    // Se você implementou a função de criar partículas, ela deve estar aqui. Ex:
    /* criarParticulasExplosao(x, y, corTijolo, quantidade = 12) {
        if (!this.particulas) this.particulas = []; 
        const tamanhoParticulaBase = this.canvas.width / 200; 
        const velocidadeParticulaBase = this.canvas.width / 350; 
        const vidaUtilBase = 40; 

        for (let i = 0; i < quantidade; i++) {
            this.particulas.push(new Particula(
                x, 
                y, 
                corTijolo,
                tamanhoParticulaBase,
                velocidadeParticulaBase,
                vidaUtilBase
            ));
        }
    }
    */
    
    getTouchPos(canvasEl, evt) {
        const rect = canvasEl.getBoundingClientRect();
        const touch = evt.touches && evt.touches.length > 0 ? evt.touches[0] : (evt.changedTouches && evt.changedTouches.length > 0 ? evt.changedTouches[0] : null);
        
        if (!touch) return null; 

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
        } else if (tipoEvento === 'end') { 
            if (this.estado === 'inicio' || this.estado === 'pausado') {
                const opcoes = (this.estado === 'inicio') ? this.menuInicialOpcoes : this.menuPausaOpcoes;
                const fontSizeTitulo = this.canvas.height / 11; 
                const fontSizeOpcao = this.canvas.height / 20; 
                let yPrimeiraOpcao = this.canvas.height / 2 - fontSizeTitulo * 0.2; 
                if (this.estado === 'pausado') yPrimeiraOpcao = this.canvas.height * 0.5;

                const alturaLinhaOpcao = fontSizeOpcao * 1.8; 

                opcoes.forEach((opcao, i) => {
                    const textoMetrica = this.ctx.measureText(opcao); 
                    const larguraOpcaoToque = Math.max(textoMetrica.width * 1.2, this.canvas.width * 0.5); 
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
                        } else { 
                            this.menuPausaSelecionado = i;
                            this.executarAcaoMenuPausa();
                        }
                    }
                });
            } else if (this.estado === 'gameOver' || this.estado === 'vitoria' || this.estado === 'comoJogar') {
                this.estado = 'inicio';
                this.nivel = 1; 
                this.configurarNivel(); 
            }
        }
    }


    tratarKeyDown(e) {
        const key = e.code; 
        const keyChar = e.key.toLowerCase(); 

        if (this.estado === 'inicio') {
            if (key === 'ArrowUp' || key === 'KeyW') {
                this.menuInicialSelecionado = (this.menuInicialSelecionado - 1 + this.menuInicialOpcoes.length) % this.menuInicialOpcoes.length;
            } else if (key === 'ArrowDown' || key === 'KeyS') {
                this.menuInicialSelecionado = (this.menuInicialSelecionado + 1) % this.menuInicialOpcoes.length;
            } else if (key === 'Enter' || key === 'Space') {
                this.executarAcaoMenuInicial();
            }
        } else if (this.estado === 'jogando') {
            if (key === 'ArrowLeft' || key === 'KeyA') this.raquete.mover('esquerda');
            else if (key === 'ArrowRight' || key === 'KeyD') this.raquete.mover('direita');
            else if (key === 'Escape' || keyChar === 'p') {
                this.estado = 'pausado';
                this.menuPausaSelecionado = 0; 
            }
        } else if (this.estado === 'pausado') {
            if (key === 'ArrowUp' || key === 'KeyW') {
                this.menuPausaSelecionado = (this.menuPausaSelecionado - 1 + this.menuPausaOpcoes.length) % this.menuPausaOpcoes.length;
            } else if (key === 'ArrowDown' || key === 'KeyS') {
                this.menuPausaSelecionado = (this.menuPausaSelecionado + 1) % this.menuPausaOpcoes.length;
            } else if (key === 'Enter' || key === 'Space') {
                this.executarAcaoMenuPausa();
            } else if (key === 'Escape' || keyChar === 'p') {
                this.estado = 'jogando'; 
            }
        } else if (this.estado === 'gameOver' || this.estado === 'vitoria' || this.estado === 'comoJogar') {
            if (key && !e.ctrlKey && !e.altKey && !e.metaKey) {
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
            this.configurarNivel(); 
        } else if (opcao === 'Como Jogar') {
            this.estado = 'comoJogar';
        }
    }

    executarAcaoMenuPausa() {
        const opcao = this.menuPausaOpcoes[this.menuPausaSelecionado];
        if (opcao === 'Continuar') {
            this.estado = 'jogando';
        } else if (opcao === 'Reiniciar Nível') { // Mantém a correção de reiniciar nível
            this.estado = 'jogando';
            this.pontuacao = 0; 
            this.configurarNivel(); 
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
                // --- MODIFICADO: Passa a instância do jogo 'this' para o método atualizar da bola ---
                bola.atualizar(this); 
                // --- FIM DA MODIFICAÇÃO ---
                bola.verificarColisaoRaquete(this.raquete);
                if (bola.verificarColisaoTijolos(this.tijolos, this)) { 
                    if (Math.random() < 0.2) { 
                        const tijoloDestruido = this.tijolos.find(t => !t.ativo && t.cor !== 'transparent_placeholder');
                        if (tijoloDestruido) {
                            this.powerUps.push(new PowerUp(
                                tijoloDestruido.posx + tijoloDestruido.largura / 2,
                                tijoloDestruido.posy + tijoloDestruido.altura / 2,
                                this.canvas
                            ));
                            tijoloDestruido.cor = 'transparent_placeholder'; 
                        } else if (this.tijolos.length > 0 && this.tijolos.some(t => t.ativo)) {
                            let tijolosAtivos = this.tijolos.filter(t => t.ativo);
                            if(tijolosAtivos.length > 0){
                                let tijoloAleatorio = tijolosAtivos[Math.floor(Math.random() * tijolosAtivos.length)];
                                this.powerUps.push(new PowerUp(
                                    tijoloAleatorio.posx + tijoloAleatorio.largura / 2,
                                    tijoloAleatorio.posy + tijoloAleatorio.altura / 2,
                                    this.canvas
                                ));
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

        // Se você implementou partículas:
        /*
        if (this.particulas) {
            for (let i = this.particulas.length - 1; i >= 0; i--) {
                this.particulas[i].atualizar();
                if (this.particulas[i].opacidade <= 0) {
                    this.particulas.splice(i, 1);
                }
            }
        }
        */

        const bolasAtivas = this.bolas.filter(bola => bola.ativa);
        if (bolasAtivas.length === 0) {
            this.vidas--;
            if (this.vidas <= 0) {
                this.estado = 'gameOver';
            } else {
                this.raquete.posx = this.canvas.width / 2 - this.raquete.largura / 2;
                const raioBola = parseFloat(this.bolas[0]?.raio || this.canvas.width / 90); 
                const velocidadeBola = parseFloat(this.bolas[0]?.velocidadeBase || (3 * (this.canvas.width / 900)));
                this.bolas = [new Bola(
                    this.canvas.width / 2,
                    this.canvas.height - 60 - raioBola,
                    raioBola,
                    velocidadeBola,
                    this.canvas
                )];
            }
        }
        this.bolas = bolasAtivas.length > 0 ? bolasAtivas : this.bolas; 


        if (this.tijolos.length === 0 && this.estado === 'jogando') {
            this.nivel++;
            if (this.nivel > this.maxNiveis) {
                this.estado = 'vitoria';
            } else {
                const pontuacaoAtual = this.pontuacao;
                const vidasAtuais = this.vidas;
                this.configurarNivel(); 
                this.pontuacao = pontuacaoAtual; 
                this.vidas = vidasAtuais; 
                this.estado = 'pausado'; 
                this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
                this.ctx.fillRect(0,0, this.canvas.width, this.canvas.height);
                this.ctx.fillStyle = 'white';
                this.ctx.font = `${this.canvas.height / 15}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`Nível ${this.nivel}`, this.canvas.width / 2, this.canvas.height / 2);
                setTimeout(() => {
                    if(this.estado === 'pausado' || this.estado === 'jogando'){ 
                        this.estado = 'jogando';
                    }
                }, 1500); 
            }
        }
    }

    desenhar() {
        this.ctx.fillStyle = '#000000'; 
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const fontSizeBase = Math.min(this.canvas.width / 40, this.canvas.height / 25);

        if (this.estado === 'inicio') {
            this.desenharMenu(this.menuInicialOpcoes, this.menuInicialSelecionado, "BREAKOUT V2", "Toque ou Use Teclado", fontSizeBase);
        } else if (this.estado === 'comoJogar') {
            this.desenharTelaComoJogar(fontSizeBase);
        } else if (this.estado === 'jogando' || this.estado === 'pausado') {
            this.raquete.desenhar(this.ctx);
            this.bolas.forEach(bola => { if (bola.ativa) bola.desenhar(this.ctx); });
            this.tijolos.forEach(tijolo => tijolo.desenhar(this.ctx)); 
            this.powerUps.forEach(powerUp => powerUp.desenhar(this.ctx));
            
            // Se você implementou partículas:
            // if (this.particulas) this.particulas.forEach(particula => particula.desenhar(this.ctx));

            // --- ADICIONADO: DESENHAR O ESCUDO DA BASE ---
            if (this.escudoAtivo) {
                const alturaEscudo = 8; // Altura da barra do escudo
                const corEscudoPowerUp = '#00CED1'; // Cor base do power-up (DarkTurquoise)
                
                this.ctx.save();
                
                // Barra principal do escudo
                this.ctx.fillStyle = `rgba(0, 206, 209, 0.35)`; // Cor com boa transparência
                this.ctx.fillRect(0, this.canvas.height - alturaEscudo, this.canvas.width, alturaEscudo);
                
                // Linha de brilho sutil na parte superior do escudo para destaque
                this.ctx.shadowColor = corEscudoPowerUp;
                this.ctx.shadowBlur = 12; // Um brilho suave
                this.ctx.strokeStyle = `rgba(175, 238, 238, 0.7)`; // PaleTurquoise (mais claro que DarkTurquoise)
                this.ctx.lineWidth = 2.5; // Linha um pouco mais grossa para o brilho
                
                this.ctx.beginPath();
                this.ctx.moveTo(0, this.canvas.height - alturaEscudo + this.ctx.lineWidth / 2); // Ajusta para a linha ficar na borda
                this.ctx.lineTo(this.canvas.width, this.canvas.height - alturaEscudo + this.ctx.lineWidth / 2);
                this.ctx.stroke();
                
                this.ctx.restore(); // Restaura o contexto (remove shadowBlur, etc.)
            }
            // --- FIM DA ADIÇÃO DO DESENHO DO ESCUDO ---

            this.desenharHUD(fontSizeBase * 1.1); 

            if (this.estado === 'pausado') {
                this.desenharMenu(this.menuPausaOpcoes, this.menuPausaSelecionado, "PAUSADO", "Toque ou Use Teclado", fontSizeBase);
            }
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
