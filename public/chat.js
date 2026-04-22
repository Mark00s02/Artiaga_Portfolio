// ============================================================
// chat.js — Mark00s AI Chatbot
// ============================================================

let chatOpen = false;
let chatHistory = []; // { role: 'user'|'assistant', content: string }
let chatNotified = false;

// Show a little notification badge after 4 seconds to invite visitors
setTimeout(() => {
  if (!chatOpen && !chatNotified) {
    const notif = document.getElementById('chatNotif');
    if (notif) { notif.textContent = '1'; notif.style.display = 'flex'; }
    chatNotified = true;
  }
}, 4000);

function toggleChat() {
  chatOpen = !chatOpen;
  const win   = document.getElementById('chatWindow');
  const icon  = document.getElementById('chatFabIcon');
  const close = document.getElementById('chatFabClose');
  const notif = document.getElementById('chatNotif');

  win.classList.toggle('open', chatOpen);
  icon.style.display  = chatOpen ? 'none'  : 'flex';
  close.style.display = chatOpen ? 'flex'  : 'none';

  if (chatOpen) {
    if (notif) notif.style.display = 'none';
    setTimeout(() => document.getElementById('chatInput')?.focus(), 300);
    scrollChatToBottom();
  }
}

function scrollChatToBottom() {
  const msgs = document.getElementById('chatMessages');
  if (msgs) msgs.scrollTop = msgs.scrollHeight;
}

function appendMessage(role, text) {
  const msgs = document.getElementById('chatMessages');
  if (!msgs) return;

  // Hide suggestions after first user message
  if (role === 'user') {
    const sugg = document.getElementById('chatSuggestions');
    if (sugg) sugg.style.display = 'none';
  }

  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.textContent = text;

  div.appendChild(bubble);
  msgs.appendChild(div);
  scrollChatToBottom();
  return bubble;
}

function appendTypingIndicator() {
  const msgs = document.getElementById('chatMessages');
  if (!msgs) return null;
  const div = document.createElement('div');
  div.className = 'chat-msg bot typing-indicator-wrap';
  div.id = 'typingIndicator';
  div.innerHTML = `<div class="chat-bubble typing-indicator"><span></span><span></span><span></span></div>`;
  msgs.appendChild(div);
  scrollChatToBottom();
  return div;
}

async function sendChat() {
  const input = document.getElementById('chatInput');
  const btn   = document.getElementById('chatSendBtn');
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  input.disabled = true;
  btn.disabled   = true;

  appendMessage('user', text);
  chatHistory.push({ role: 'user', content: text });

  const typing = appendTypingIndicator();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory }),
    });

    const data = await res.json();
    if (typing) typing.remove();

    const reply = data.reply || data.error || 'Something went wrong. Try again!';
    appendMessage('bot', reply);
    chatHistory.push({ role: 'assistant', content: reply });

  } catch (e) {
    if (typing) typing.remove();
    appendMessage('bot', 'Connection error. Make sure the server is running!');
  }

  input.disabled = false;
  btn.disabled   = false;
  input.focus();
}

function sendSuggestion(text) {
  const input = document.getElementById('chatInput');
  if (input) { input.value = text; sendChat(); }
}

function clearChat() {
  chatHistory = [];
  const msgs = document.getElementById('chatMessages');
  if (msgs) msgs.innerHTML = `
    <div class="chat-msg bot">
      <div class="chat-bubble">Chat cleared! Ask me anything about Mark's work or skills 👾</div>
    </div>`;
  const sugg = document.getElementById('chatSuggestions');
  if (sugg) sugg.style.display = 'flex';
}
