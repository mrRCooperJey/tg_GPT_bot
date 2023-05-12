import { openai } from './openai.js'

export const INITIAL_SESSION = {
  messages: [],
}

// время неактивности (в миллисекундах), после которого сессия сбросится
const INACTIVITY_TIMEOUT = 2 * 60 * 1000 // 5 минут

export async function initCommand(ctx) {
  ctx.session = INITIAL_SESSION
  startInactivityTimer(ctx)
  await ctx.reply('Жду вашего голосового или текстового сообщения')
}

export async function processTextToChat(ctx, content) {
  try {
    clearTimeout(ctx.session.timerId) // сбросить таймер при каждом взаимодействии
    ctx.session.messages.push({ role: openai.roles.USER, content })

    const response = await openai.chat(ctx.session.messages)

    ctx.session.messages.push({
      role: openai.roles.ASSISTANT,
      content: response.content,
    })

    await ctx.reply(response.content)

    startInactivityTimer(ctx) // установить новый таймер после взаимодействия
  } catch (e) {
    console.log('Error while proccesing text to gpt', e.message)
  }
}

function startInactivityTimer(ctx) {
  // установить таймер, который вызовет функцию clearSession через INACTIVITY_TIMEOUT
  ctx.session.timerId = setTimeout(() => {
    // предупредить пользователя об очистке сессии за 1 минуту до сброса
    ctx.reply('Ваша сессия будет очищена через 1 минуту неактивности')
    ctx.session.timerId = setTimeout(clearSession, 60 * 1000, ctx)
  }, INACTIVITY_TIMEOUT)
}

function clearSession(ctx) {
  ctx.session = INITIAL_SESSION
  ctx.reply('Сессия очищена из-за неактивности')
}
