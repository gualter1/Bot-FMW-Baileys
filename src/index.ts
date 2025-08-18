// @ts-nocheck
import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'

import { Boom } from '@hapi/boom'
import qrcode from 'qrcode'
import pino from 'pino'
import trataMsg from './processaMsg.ts';

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

    try {
      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut

        console.log('Conexão encerrada. Reconectando:', shouldReconnect)

        if (shouldReconnect){
          setTimeout(startBot, 1000)
        }
  
      } else if (connection === 'open') {
          console.log('✅ Conectado ao WhatsApp')
        }
    } catch (error) {
      console.error("O erro de conexao foi ", error)
    }

  })
  // Salva as credenciais quando forem atualizadas
  sock.ev.on('creds.update', async () => {
    try {
       await saveCreds ()
    } catch (error) {
      console.error("O erro de credenciais foi ", error)
  
    }

  }) 

  // Mensagens recebidas
  //  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    //  })

    trataMsg(sock)
}

startBot()
