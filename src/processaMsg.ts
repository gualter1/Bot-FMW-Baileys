// @ts-nocheck
import { viraString, horaAtual, cortaTimes, nomeClube, padronizaNome, preparaCartela } from "./processamentoCartela.ts"

import { userSeguro, mandaCartela, apagaCartela, listaDeTime, retiraTimeGrupo, cadastraTime, corteCodigo, apagaCodigo, rgxCorteCodigoSuporte, rgxCapturaClube, informacoesSuperUser, rgxNomeEPalpite, rgxPalpite, rgxPalpite2 } from "./listaRegex.ts"

const timesCadastradosPorGrupo = {}; //times cadastrados
const timesEnviadoHora = {}; //Horario de envio das cartelas
const cartelaPorGrupo = {}; // Cartelas enviadas
const timesEnviadoGrupo = {}; //Times enviados 
const timesNaoListados = {} //Times enviados fora da lista
const informacoes = { dados: [] }
const cartelaFake = {clube:"teste", nomes: ["adilson o lindaum"], palpites: ["9-9/9-9/9-9/9-9/9-9/9-9/9-9/9-9/9-9/9-9"]}

function trataMsg(sock) {
    console.log("12345")
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
   
    const message = messages[0]
    const hasText = message?.message?.conversation || message?.message?.extendedTextMessage?.text

    if (!message || message.key.fromMe || !hasText) return

    const texto = message.message.conversation || message.message.extendedTextMessage.text  // Extrai o texto da mensagem
    const grupoId = message.key.remoteJid

    const timeAnalisado = nomeClube(texto).join()
    const pegaClube = texto.match(rgxCapturaClube)
    const cadastro = texto.match(cadastraTime)
    const zeraLista = texto.match(apagaCartela)
    const remocao = texto.match(retiraTimeGrupo)
    const cortaCodigoSuporte = texto.match(corteCodigo)
    const apagaCodigoSuporte = texto.match(apagaCodigo)
    const grupo = grupoId.includes('@g.us')
    const autorizado = message.key.participant === userSeguro

    // Inicializa grupos
    if (!timesCadastradosPorGrupo[grupoId]) {
        timesCadastradosPorGrupo[grupoId] = [];
        cartelaPorGrupo[grupoId] = [];
        timesEnviadoHora[grupoId] = [];
        timesEnviadoGrupo[grupoId] = [];
        timesNaoListados[grupoId] = []
    }

    // Cadastro e remoção de times
    if (autorizado && grupo) {
        if (cadastro) {
            if (timesCadastradosPorGrupo[grupoId].length <= 0) {
                timesCadastradosPorGrupo[grupoId].push(cortaTimes(texto));
            } else {
                const novosTimes = cortaTimes(texto);
                for (let i = 0; i < novosTimes.length; i++) {
                    timesCadastradosPorGrupo[grupoId][0].push(novosTimes[i]);
                }
            }
            let listaTimes = viraString(timesCadastradosPorGrupo[grupoId][0]);
            await sock.sendMessage(grupoId, { text: `Times cadastrados no grupo\n\n${listaTimes}` });
        }

        if (remocao) {
            const timeParaRemover = cortaTimes(texto);
            const listaDeTimeCadastrado = timesCadastradosPorGrupo[grupoId][0];

            const times = []
            for (let i = 0; i < listaDeTimeCadastrado.length; i++) {
                if (!timeParaRemover.includes(listaDeTimeCadastrado[i])) {
                    times.push(listaDeTimeCadastrado[i])
                }

            }
            timesCadastradosPorGrupo[grupoId][0] = times;
            let listaTimes = viraString(times);
            await sock.sendMessage(grupoId, { text: `Times cadastrados no grupo\n\n${listaTimes}` });
        }

        //Manda as cartelas enviadas
        if (texto === mandaCartela) {
            let listaTimes = viraString(cartelaPorGrupo[grupoId]);
            await sock.sendMessage(grupoId, { text: `Cartelas enviadas:\n\n${listaTimes}` });
        } else if (!autorizado && texto === mandaCartela && grupo) {
            await sock.sendMessage(grupoId, { text: 'Acesso negado, fala com o Adilço' });
        }
    }

    //listar os times cadastrados no grupo
    if (texto.match(listaDeTime) && grupo) {
        let listaTimes = viraString(timesCadastradosPorGrupo[grupoId][0]);
        await sock.sendMessage(grupoId, { text: `Times cadastrados nesse grupo\n\n${listaTimes}` });
    }

    let listaEnvio = ""
    //cartelas enviadas nos grupos e apaga as cartelas
    if (!cadastro && !remocao && grupo && timesCadastradosPorGrupo[grupoId].length !== 0 && texto !== mandaCartela) {
        let chamada = timesCadastradosPorGrupo[grupoId][0].map(x => `clube: ${x}`);
        let listaAtualizada = timesCadastradosPorGrupo[grupoId][0].map(x => `⚪ ${x}`);
        if (pegaClube) {

            timesEnviadoGrupo[grupoId].push(timeAnalisado);
            timesEnviadoHora[grupoId].push(horaAtual())
            const cartelaCortada = preparaCartela(texto, rgxNomeEPalpite, rgxPalpite, rgxPalpite2) || cartelaFake
            console.log(cartelaCortada)
            let cartela = `Clube: ${cartelaCortada.clube}\n`
            for (let i = 0; i < cartelaCortada.nomes.length; i++) {
                cartela += `${cartelaCortada.nomes[i]}\n`
                cartela += `${cartelaCortada.palpites[i]}\n`
                                
            }
            cartelaPorGrupo[grupoId].push(`${horaAtual()}\n${cartela}\n\n`);
        }

        const timesEnviadosHoje = timesEnviadoGrupo[grupoId].filter(x => x);

        if (pegaClube && timesCadastradosPorGrupo[grupoId][0].includes(timeAnalisado)) {
            for (let i = 0; i < chamada.length; i++) {
                for (let j = 0; j < timesEnviadoGrupo[grupoId].length; j++) {
                    if (nomeClube(chamada[i]).join() === timesEnviadoGrupo[grupoId][j]) {
                        listaAtualizada.splice(i, 1, `✅ ${timesEnviadoGrupo[grupoId][j]} - ${timesEnviadoHora[grupoId][j]}`);
                    }
                }
            }
        } else if (pegaClube && !timesCadastradosPorGrupo[grupoId][0].includes(timeAnalisado) && !cadastro && !remocao) {
            timesNaoListados[grupoId].push(`✅ ${timeAnalisado} - ${horaAtual()}`)

        }
        
        let totalEnvio = listaAtualizada.length - timesEnviadoHora[grupoId].length

        if (pegaClube && timesNaoListados[grupoId].length === 0) {
            listaEnvio = ""
            if (timesEnviadoHora[grupoId].length % 3 === 0 || totalEnvio < 5){

                for (let i = 0; i < listaAtualizada.length; i++) {
                    listaEnvio += `${listaAtualizada[i]}\n`
                }
                await sock.sendMessage(grupoId, { text: `*Lista de cartelas enviadas hoje*\n\n${listaEnvio}\n*Boa sorte a TODES e que perca o pior.*` });
            }
        } else if (pegaClube && timesNaoListados[grupoId].length > 0) {
            listaEnvio = ""

            for (let i = 0; i < chamada.length; i++) {
                for (let j = 0; j < timesEnviadoGrupo[grupoId].length; j++) {
                    if (nomeClube(chamada[i]).join() === timesEnviadoGrupo[grupoId][j]) {
                        listaAtualizada.splice(i, 1, `✅ ${timesEnviadoGrupo[grupoId][j]} - ${timesEnviadoHora[grupoId][j]}`);
                    }
                }
            }
            if (timesEnviadoHora[grupoId].length % 3 === 0 || totalEnvio - 5 < 0){
                console.log(totalEnvio)

                for (let k = 0; k < listaAtualizada.length; k++) {
                    listaEnvio += `${listaAtualizada[k]}\n`
                }
                
                listaEnvio += "\n\n*Não estão na lista dos cadastrados por algum motivo, fala com o adilço*\n\n"
                for (let j = 0; j < timesNaoListados[grupoId].length; j++) {
                    listaEnvio += `${timesNaoListados[grupoId][j]}\n`
                    
                }
                await sock.sendMessage(grupoId, { text: `*Lista de cartelas enviadas hoje*\n\n${listaEnvio}\n*Boa sorte a TODES e que perca o pior.*` });
            }
        }

        if (zeraLista && autorizado) {
            cartelaPorGrupo[grupoId] = [];
            timesEnviadoGrupo[grupoId] = [];
            timesNaoListados[grupoId] = [];
            timesEnviadoHora[grupoId] = [];
            chamada = timesCadastradosPorGrupo[grupoId][0].filter(x => x).map(x => `⚪ clube: ${x}`);
            listaAtualizada = timesCadastradosPorGrupo[grupoId][0].filter(x => x).map(x => `⚪ ${x}`);
            await sock.sendMessage(grupoId, { text: 'A lista foi reiniciada' });
        } else if (zeraLista && !autorizado) {
            await sock.sendMessage(grupoId, { text: 'Acesso negado, fala com o Adilço' });
        }


    }

    //Bot
    if (texto.toLowerCase().match("help bot")) {
        let codigos = `Lista de codigos disponiveis\n\n`

        for (let i = 0; i < informacoes.dados.length; i++) {
            codigos += `${informacoes.dados[i][0]}\n`
        }

        codigos += `\nPara escolher um codigo digite o comando *Bot fmw + comando*\n\nExemplo Bot fmw Regras`

        if (autorizado) {
            await sock.sendMessage(grupoId, { text: `${informacoesSuperUser}\n${codigos}` })
            //client.sendText(message.from, `${informacoesSuperUser}\n${codigos}`)
        } else if (!autorizado && grupo) {
            await sock.sendMessage(grupoId, { text: codigos })
            //client.sendText(message.from, codigos)
        }
    }

    //Envio de informaçoes
    if (texto.match(/bot fmw/gi) && grupo) {
        let codigo = texto.replace(/bot fmw/gi, "").trim()
        //console.log(codigo)
        //console.log(informacoes.dados[0])
        for (let i = 0; i < informacoes.dados.length; i++) {

            if (informacoes.dados[i][0].toLowerCase() === codigo.toLowerCase()) {
                await sock.sendMessage(grupoId, { text: informacoes.dados[i][1] })
                // client.sendText(message.from, informacoes.dados[i][1])
            }
        }
    }

    // Cadastrar informações
    if (autorizado) {
        if (cortaCodigoSuporte) {
            let mensagemBruta = texto.split(rgxCorteCodigoSuporte);
            let codigo = mensagemBruta[0].trim();
            let mensagem = mensagemBruta[1].trim();
            informacoes.dados.push([codigo, mensagem]);
        }

        if (apagaCodigoSuporte) {
            let codigo = texto.replace(apagaCodigo, '').trim();
            for (let i = 0; i < informacoes.dados.length; i++) {
                if (informacoes.dados[i][0].match(codigo)) {
                    informacoes.dados[i] = [
                        "mensagem deletada pelo adilço",
                        "> ⓘ _Este usuário foi temporariamente suspenso do WhatsApp por participação em grupos criminosos. Por ordem judiciária vigente, o WhatsApp Inc vê-se na obrigação legal de restringir mensagens encaminhadas a este contato e reserva-se o direito de fornecer informações ao Ministério da Segurança Pública. Todos os grupos que este usuario está presente estão sobre investigação._"
                    ];
                }
            }
        }
    }
    //}
    })
}

export default trataMsg