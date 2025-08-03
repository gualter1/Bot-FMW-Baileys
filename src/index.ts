// @ts-nocheck
import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
// @ts-ignore
import qrcode from 'qrcode'
import pino from 'pino'

const userSeguro = "558587636157@s.whatsapp.net"
const mandaCartela = "Mande as cartelas de hoje"
const apagaCartela = "Apague as cartelas de hoje"
const listaDeTime = "Lista de times no grupo"
const retiraTimeGrupo = "Retirar time do grupo"
const cadastraTime = "Add times ao grupo"
const corteCodigo = "Corte suporte codigo"
const apagaCodigo = "Apagar codigo de suporte"
// const sim = "Sim, quero cadastrar"
// const nao = "Não"
// const criaMensagem = "Cadastrar mensagem de suporte"
// const apagaMensagem = "Apagar mensagem de suporte"

const rgxCorteCodigoSuporte = /Corte suporte codigo/gmi

const rgxClube = /clube:|time:/gmi
const rgxCapturaClube = /clube:.+|time:.+/gmi
const regexEmoji = /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]|[\u200B-\u200D\uFEFF]|[\r])|[~_+()]|⬜/g
const rgxAsterisco = /_|\*|,/gmi
const rgxBenfica = /[¹²³⁴⁵⁶⁷⁸⁹⁰]/gm
const rgxNome = /([A-Za-zÀ-ÿ.]+\s{1,2}){1,5}[A-Za-zÀ-ÿ.]+|[A-Za-zÀ-ÿ.]+/gmi
const rgxCapturaTudo = /.*/s
const rgxLimpeza = new RegExp(`${regexEmoji.source}|${rgxAsterisco.source}|${rgxBenfica.source}`, 'gmi')
const informacoesSuperUser = `UserSeguro = ${userSeguro}\nMandaCartela = ${mandaCartela}\nApagaCartela = ${apagaCartela}\nRetiraTimeGrupo = ${retiraTimeGrupo}
CadastraTime = ${cadastraTime}\nListaDeTime = ${listaDeTime}\nCorte Codigo Suporte = ${corteCodigo}\nApagar codigo de suporte = ${apagaCodigo}`

const timesCadastradosPorGrupo = {};
const timesPorGrupo = {};
const cartelaPorGrupo = {};
const timesEnviadoGrupo = {};
const timesNaoListados = {}
const informacoes = { dados: [] }

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' })
  })

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.clear()
      console.log('📲 Escaneie o QR Code abaixo para conectar:')
      console.log(await qrcode.toString(qr, { type: 'terminal', small: true }))
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
      console.log('Conexão encerrada. Reconectando:', shouldReconnect)
      if (shouldReconnect) {
        startBot()
      }
    } else
      if (connection === 'open') {
        console.log('✅ Conectado ao WhatsApp')
      }
  })
  // Salva as credenciais quando forem atualizadas
  sock.ev.on('creds.update', saveCreds)

  // Mensagens recebidas

  
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
      timesPorGrupo[grupoId] = [];
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
    if (!cadastro && grupo && timesCadastradosPorGrupo[grupoId].length !== 0 && texto !== mandaCartela) {
      let chamada = timesCadastradosPorGrupo[grupoId][0].map(x => `clube: ${x}`);
      let listaAtualizada = timesCadastradosPorGrupo[grupoId][0].map(x => `⚪ ${x}`);
      if (pegaClube) {

        timesEnviadoGrupo[grupoId].push(timeAnalisado);
        cartelaPorGrupo[grupoId].push(`${horaAtual()}\n${texto}\n\n`);
      }

      const timesEnviadosHoje = timesEnviadoGrupo[grupoId].filter(x => x);
      
      if (pegaClube && timesCadastradosPorGrupo[grupoId][0].includes(timeAnalisado)) {
        for (let i = 0; i < chamada.length; i++) {
          for (let j = 0; j < timesEnviadoGrupo[grupoId].length; j++) {
            if (nomeClube(chamada[i]).join() === timesEnviadoGrupo[grupoId][j]) {
              listaAtualizada.splice(i, 1, `✅ ${timesEnviadoGrupo[grupoId][j]} - ${horaAtual()}`);
            }
          }
        }
      } else if (pegaClube && !timesCadastradosPorGrupo[grupoId][0].includes(timeAnalisado) && !cadastro && !remocao) {  
        timesNaoListados[grupoId].push(`✅ ${timeAnalisado} - ${horaAtual()}`)
      }

      if (pegaClube && timesNaoListados[grupoId].length === 0) {
        listaEnvio = ""
        for (let i = 0; i < listaAtualizada.length; i++) {
          listaEnvio += `${listaAtualizada[i]}\n`
        }
        await sock.sendMessage(grupoId, { text: `*Lista de cartelas enviadas hoje*\n\n${listaEnvio}\n*Boa sorte a TODES e que perca o pior.*` });
      } else if (pegaClube && timesNaoListados[grupoId].length > 0){
        listaEnvio = ""
       
        for (let i = 0; i < chamada.length; i++) {
          for (let j = 0; j < timesEnviadoGrupo[grupoId].length; j++) {
            if (nomeClube(chamada[i]).join() === timesEnviadoGrupo[grupoId][j]) {
              listaAtualizada.splice(i, 1, `✅ ${timesEnviadoGrupo[grupoId][j]} - ${horaAtual()}`);
            }
          }
        }
      
        for (let k = 0; k < listaAtualizada.length; k++) {
          listaEnvio += `${listaAtualizada[k]}\n`
        }
        
        listaEnvio += "\n\n*Não estão na lista dos cadastrados por algum motivo, fala com o adilço*\n\n"
        for (let j = 0; j < timesNaoListados[grupoId].length; j++) {
          listaEnvio += `${timesNaoListados[grupoId][j]}\n`
          
        }
        await sock.sendMessage(grupoId, { text: `*Lista de cartelas enviadas hoje*\n\n${listaEnvio}\n*Boa sorte a TODES e que perca o pior.*` });
      }

      if (zeraLista && autorizado) {
        cartelaPorGrupo[grupoId] = [];
        timesEnviadoGrupo[grupoId] = [];
        timesNaoListados[grupoId] = [];
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


function viraString(grupo) {
  let listaTimes = ''
  for (let i = 0; i < grupo.length; i++) {
    listaTimes += `${grupo[i]}\n`
  }
  return listaTimes
}

function horaAtual() {
  const dataHora = new Date();
  const horaExata = dataHora.toLocaleTimeString("pt-BR", { timeZone: "America/Fortaleza", hour: "2-digit", minute: "2-digit" })
  return horaExata
}

function cortaTimes(time) {
  const listaDeTimes = time.match(rgxCapturaClube) || ["clube: "]
  const timesCortados = []
  for (let i = 0; i < listaDeTimes.length; i++) {
    //console.log(listaDeTimes.length)
    timesCortados.push(nomeClube(listaDeTimes[i]).join())
  }
  //console.log(timesCortados)
  return timesCortados
}

function nomeClube(cartela) {
  let clube = cartela.replace(rgxLimpeza, '').match(rgxCapturaClube) || ['clube: Nome do time']
  clube = clube.join().replace(rgxClube, '').replace(rgxAsterisco, '').match(rgxNome)

  !clube ? clube = ['Nome do time'] : clube
  clube.length > 1 ? clube = clube.join().replace(',', ' ').split() : clube

  clube = padronizaNome(clube.join())
  return clube
}

function padronizaNome(nomes) {
  let nomePadronizado = []
  let nomesMinusculo = nomes.toLowerCase()
  nomesMinusculo = nomesMinusculo.length < 2 ? nomesMinusculo + nomesMinusculo : nomesMinusculo
  const dividiNome = nomesMinusculo.split('') // armazena o array do nome

  const letraInicio = dividiNome[0].toUpperCase()
  dividiNome.splice(0, 1, letraInicio)
  nomePadronizado.push(dividiNome.join('').trim())

  return nomePadronizado
}


startBot()
