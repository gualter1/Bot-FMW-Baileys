// @ts-nocheck
import { rgxClube, rgxCapturaClube, regexEmoji, rgxAsterisco, rgxBenfica, rgxNome, rgxCapturaTudo, rgxLimpeza, informacoesSuperUser, rgxNomeEPalpite, rgxPalpite, rgxPalpite2, rgxBarraMaisHifen } from "./listaRegex.ts";



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

// const rgxNomeEPalpite = /[A-Za-zÀ-ÿ]+.+\s+(\d-\d\/)+(\d-\d)|[A-Za-zÀ-ÿ]+.+(\d-\d\/)+(\d-\d)/g
// const rgxPalpite = /(\d-\d\/)+(\d-\d)/g
// const rgxPalpite2 = /\d|-\s+(\d-\d\/)+(\d-\d)|:|\*/gmi
// const rgxBarraMaisHifen = /\||\/|-/gim


function preparaCartela(cartela, valor1, valor2, valor3) {
    const clube = nomeClube(cartela)
    
    const nomePalpite = cartela.replace(rgxLimpeza, '').match(valor1)
    if (!nomePalpite) return
    
    const palpites = []
    const nomes = []
    
    for (let i = 0; i < nomePalpite.length; i++) {
        palpites.push(nomePalpite[i].match(valor2))
        let jogador = nomePalpite[i].match(rgxNome).length > 1 ? nomePalpite[i].replace(valor3, '').replace(rgxBarraMaisHifen, '').trim().split() : nomePalpite[i].match(rgxNome)
        //console.log(jogador)
        nomes.push(padronizaNome(jogador.join()))      
    }
    
    return { nomes, palpites, clube };
}



export {viraString, horaAtual, cortaTimes, nomeClube, padronizaNome, preparaCartela}