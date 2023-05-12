import { openai } from './openai.js';
import cron from 'node-cron';

export const INITIAL_SESSION = {
  messages: [],
};

const INACTIVITY_TIMEOUT = 5; // 5 минут
const WARNING_TIMEOUT = 1; // 4 минуты

export async function initCommand(ctx) {
  ctx.session = INITIAL_SESSION;
  startInactivityTimer(ctx);
  await ctx.reply('Жду вашего голосового или текстового сообщения');
}

export async function processTextToChat(ctx, content) {
  try {
    clearTimeout(ctx.session.timerId);
    ctx.session.messages.push({ role: openai.roles.USER, content });

    const response = await openai.chat(ctx.session.messages);

    ctx.session.messages.push({
      role: openai.roles.ASSISTANT,
      content: response.content,
    });

    await ctx.reply(response.content);

    startInactivityTimer(ctx);
  } catch (e) {
    console.log('Error while processing text to gpt', e.message);
  }
}

function startInactivityTimer(ctx) {
  if (ctx.session.timer) ctx.session.timer.stop();

  ctx.session.timer = cron.schedule(`0 */${INACTIVITY_TIMEOUT} * * * *`, () => {
    ctx.reply(`Ваша сессия будет очищена через ${WARNING_TIMEOUT} минут(у) неактивности`);
    ctx.session.warningTimer = setTimeout(() => {
      clearSession(ctx);
    }, WARNING_TIMEOUT * 60 * 1000);
  });
}

function clearSession(ctx) {
  if (ctx.session.timer) {
    ctx.session.timer.stop();
  }
  ctx.session = INITIAL_SESSION
  ctx.reply('Сессия очищена из-за неактивности')
}
