// @ts-nocheck
import { rgxClube, rgxCapturaClube, regexEmoji, rgxAsterisco, rgxBenfica, rgxNome, rgxCapturaTudo, rgxLimpeza, informacoesSuperUser, rgxNomeEPalpite, rgxPalpite, rgxPalpite2, rgxBarraMaisHifen } from "./listaRegex.ts";

function viraString(grupo) {
  if (!grupo) {
    grupo = []
  }
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
  if (!time) return
  const listaDeTimes = time.match(rgxCapturaClube) || ["clube: "]
  const timesCortados = []
  for (let i = 0; i < listaDeTimes.length; i++) {
    timesCortados.push(nomeClube(listaDeTimes[i]).join())
  }
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

function preparaCartela(cartela, valor1, valor2, valor3) {
  const clube = nomeClube(cartela)

  const nomePalpite = cartela.replace(rgxLimpeza, '').match(valor1)
  if (!nomePalpite) return

  const palpites = []
  const nomes = []

  for (let i = 0; i < nomePalpite.length; i++) {
    palpites.push(nomePalpite[i].match(valor2))
    let jogador = nomePalpite[i].match(rgxNome).length > 1 ? nomePalpite[i].replace(valor3, '').replace(rgxBarraMaisHifen, '').trim().split() : nomePalpite[i].match(rgxNome)
    nomes.push(padronizaNome(jogador.join()))
  }

  return { nomes, palpites, clube };
}

function cadastramento(lugarSalvamento, times) {
  if (lugarSalvamento.length <= 0) {
    lugarSalvamento.push(cortaTimes(times));
  } else {
    const novosTimes = cortaTimes(times);
    for (let i = 0; i < novosTimes.length; i++) {
      lugarSalvamento[0].push(novosTimes[i]);
    }
  }
  let listaTimes = viraString(lugarSalvamento[0]);
  return listaTimes
}

function descadastramento(lugarRetirada, times) {
  const timeParaRemover = cortaTimes(times);
  const listaDeTimeCadastrado = lugarRetirada[0];

  const timesAtualizados = []
  for (let i = 0; i < listaDeTimeCadastrado.length; i++) {
    if (!timeParaRemover.includes(listaDeTimeCadastrado[i])) {
      timesAtualizados.push(listaDeTimeCadastrado[i])
    }
  }
  lugarRetirada[0] = timesAtualizados;
  let listaTimes = viraString(timesAtualizados);
  return listaTimes
}



export { viraString, horaAtual, cortaTimes, nomeClube, padronizaNome, preparaCartela, cadastramento, descadastramento }