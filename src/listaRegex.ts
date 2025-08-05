const userSeguro = "558587636157@s.whatsapp.net"
const mandaCartela = "Mande as cartelas de hoje"
const apagaCartela = "Apague as cartelas de hoje"
const listaDeTime = "Lista de times no grupo"
const retiraTimeGrupo = "Retirar time do grupo"
const cadastraTime = "Add times ao grupo"
const corteCodigo = "Corte suporte codigo"
const apagaCodigo = "Apagar codigo de suporte"
const informacoesSuperUser = `UserSeguro = ${userSeguro}\nMandaCartela = ${mandaCartela}\nApagaCartela = ${apagaCartela}\nRetiraTimeGrupo = ${retiraTimeGrupo}\nCadastraTime = ${cadastraTime}\nListaDeTime = ${listaDeTime}\nCorte Codigo Suporte = ${corteCodigo}\nApagar codigo de suporte = ${apagaCodigo}`
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

const rgxNomeEPalpite = /[A-Za-zÀ-ÿ]+.+\s+(\d-\d\/)+(\d-\d)|[A-Za-zÀ-ÿ]+.+(\d-\d\/)+(\d-\d)/g
const rgxPalpite = /(\d-\d\/)+(\d-\d)/g
const rgxPalpite2 = /\d|-\s+(\d-\d\/)+(\d-\d)|:|\*/gmi
const rgxBarraMaisHifen = /\||\/|-/gim



export { 
    userSeguro,
    mandaCartela, 
    apagaCartela, 
    listaDeTime, 
    retiraTimeGrupo, 
    cadastraTime, 
    corteCodigo,
    apagaCodigo,
    informacoesSuperUser,
    rgxCorteCodigoSuporte,
    rgxClube,
    rgxCapturaClube,
    regexEmoji,
    rgxAsterisco,
    rgxBenfica,
    rgxNome,
    rgxCapturaTudo,
    rgxLimpeza,
    rgxNomeEPalpite,
    rgxPalpite,
    rgxPalpite2,
    rgxBarraMaisHifen
}

