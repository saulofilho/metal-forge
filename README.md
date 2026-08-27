# ⚡ DropC MetalForge

> **High-Performance Drop C Metal Workstation, Amp Rig Simulator, DSP Audio Engine, Strobe Tuner & Multitrack DAW in the Browser.**

![React 19](https://img.shields.io/badge/React-19-black?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS_v4-38B2AC?style=flat-square&logo=tailwind-css)
![Web Audio API](https://img.shields.io/badge/Audio-Web_Audio_DSP-CCFF00?style=flat-square&labelColor=0A0A0B&color=CCFF00)
![Web MIDI](https://img.shields.io/badge/MIDI-Web_MIDI_API-00C7FF?style=flat-square&labelColor=0A0A0B)
![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub_Pages-22C55E?style=flat-square&logo=github)

---

## 🎸 Overview / Visão Geral

**DropC MetalForge** é uma estação de trabalho completa e ultra-otimizada voltada para guitarristas de **Metal, Metalcore, Djent e Post-Hardcore**. Desenvolvida com arquitetura de design **Bento Grid** (`#0A0A0B`, `#141416`, `#222226` e acentos elétricos `#CCFF00`), ela reúne ferramentas profissionais de áudio em tempo real sem latência perceptível diretamente no navegador:

1. **Drop C Riff Transposer & Voicing Engine**: Transpõe instantaneamente progressões de acordes de qualquer tom/afinação (Standard E, D Standard, Drop D) para riffs pesados em Drop C com tablaturas interativas (0-0-0 chugs, one-finger power chords, drop minor thirds, djent intervals).
2. **DSP High-Gain Amp Modeler & Preset Audition Studio**: Modelagem física de amplificadores valvulados (Mesa Dual Rectifier, Peavey 5150 / 6505+, ENGL Fireball, Marshall JCM800, Fender Clean), TS9 Tube Screamer Overdrive, Noise Gate cirúrgico, EQ paramétrico de 5 bandas, Stereo Chorus, Ping-Pong Delay e Reverb de Convolução. Inclui **filtragem categórica (High-Gain, Clean, Experimental, Custom)** e **audition em tempo real ao passar o mouse (Hover Sample Preview)** com frases de riffs sintetizadas e visualizadores de equalizador.
3. **Precision Drop C Strobe Tuner**: Afinador estroboscópico de sub-centavos com detecção contínua de pitch por autocorrelação, agulha de desvio dinâmico, gerador de tons de referência para as 6 cordas e guia de tensão de encordoamentos (10-52, 11-56, 12-60).
4. **Live Performance HUD & MIDI Foot Controller**: Modo de palco de alto contraste com suporte plug-and-play a pedaleiras MIDI (Behringer FCB1010, Morningstar, Line 6, MeloAudio, USB) com MIDI Learn, troca instantânea de cenas (PC 0-5), stomps de boost/delay/mute (CC 64-66) e tap tempo.
5. **Multitrack Audio DAW & Clip Editor**: Gravador e arranjador de áudio multitrack com desenho de formas de onda em tempo real, bateria de metal integrada (Breakdown, Blast Beat, Thrash D-Beat), corte de clipes no playhead, normalização a 0dB, duplicação estéreo com Haas effect e exportação em formato WAV master.
6. **Amplitude-Reactive VU Meter**: Telemetria em tempo real no rodapé com animações CSS sutis que pulsam e respondem à intensidade dinâmica do áudio de entrada e saída.

---

## ⚡ Drop C Tuning Reference

A afinação **Drop C** consiste em abaixar todas as cordas em 1 tom inteiro em relação à afinação padrão, e a 6ª corda em 2 tons inteiros:

| Corda | Afinação Padrão | Drop C Note | Frequência (Hz) |
| :---: | :---: | :---: | :---: |
| **1ª (High)** | E4 | **D4** | **293.66 Hz** |
| **2ª** | B3 | **A3** | **220.00 Hz** |
| **3ª** | G3 | **F3** | **174.61 Hz** |
| **4ª** | D3 | **C3** | **130.81 Hz** |
| **5ª** | A2 | **G2** | **98.00 Hz** |
| **6ª (Low)** | E2 | **C2** | **65.41 Hz** |

---

## 🚀 Quick Start / Executando Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18 ou superior
- Gerenciador de pacotes `npm` ou `yarn`

### 1. Clonar o repositório
```bash
git clone https://github.com/seu-usuario/drop-c-metalforge.git
cd drop-c-metalforge
```

### 2. Instalar as dependências
```bash
npm install
```

### 3. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no seu navegador. Conecte sua interface de áudio (Focusrite, Behringer, Universal Audio, etc.) ou guitarra para começar a tocar!

---

## 🌐 Deploy no GitHub Pages

O projeto já está 100% configurado para rodar no **GitHub Pages** com caminhos relativos de assets (`base: './'`) e workflow automático de CI/CD.

### Opção 1: Deploy Automático via GitHub Actions (Recomendado)
1. Faça o push do código para o repositório no GitHub (`main` ou `master`).
2. Acesse a aba **Settings** > **Pages** do seu repositório.
3. Em **Source**, selecione **GitHub Actions**.
4. O workflow configurado em `.github/workflows/deploy.yml` fará o build e publicação automáticos a cada push!

### Opção 2: Build Manual
Execute o comando de build configurado para páginas estáticas:
```bash
npm run build:gh-pages
```
A pasta gerada `dist/` conterá todo o Single Page Application estático pronto para ser hospedado no GitHub Pages, Vercel, Netlify ou Cloudflare Pages.

---

## 🎹 Hotkeys & Mapeamentos MIDI

### Atalhos de Teclado no Live HUD:
- **`1` a `6`**: Seleciona os presets de palco (Modern Djent, 5150 Metalcore, Dual Recto, etc.)
- **`B`**: Alterna o pedal TS9 Tube Screamer Boost
- **`D`**: Alterna o Delay estéreo
- **`M`**: Silencia o sinal (Mute / Tuner Mode)
- **`Espaço (Spacebar)`**: Tap Tempo para sincronização da bateria e delays

### Mapeamento MIDI Padrão:
- **Program Change (PC 0 a 5)**: Troca imediata de cena / preset
- **Control Change (CC 64)**: Boost Toggle
- **Control Change (CC 65)**: Delay Toggle
- **Control Change (CC 66)**: Mute / Tuner Toggle

---

## 🛠️ Tecnologias Utilizadas

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/) com Bento Grid Architecture
- **Processamento de Áudio**: Web Audio API nativa com AudioContext, WaveShaper, BiquadFilter, ConvolverNode & AnalyserNode
- **Hardware & Periféricos**: Web MIDI API nativa com compatibilidade universal
- **Ícones**: [Lucide React](https://lucide.dev/)

---

## 📄 Licença

Distribuído sob a licença MIT. Sinta-se livre para usar, modificar e criar seus próprios timbres pesados! 🤘🔥
