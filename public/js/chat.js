const socket = io();

const userInput = document.querySelector('#userInput');
const sendBtn = document.querySelector('#sendBtn');
const form = document.querySelector('form');
const shareLocationBtn = document.querySelector('#send-location');
const messages = document.querySelector('#messages');

// Template
const messageTemplate = document.querySelector('#message-template').innerHTML;
const linkTemplate = document.querySelector('#link-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoSroll = () => {
  const newMessage = messages.lastElementChild;

  const newMessageStyle = getComputedStyle(newMessage);
  const newMessageMargin = parseInt(newMessageStyle.marginBottom);
  const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

  const visibleHeight = messages.offsetHeight;
  const containerHeight = messages.scrollHeight;
  const srollOffset = messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= srollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
};

let newMessage = '';

socket.on('message', (data) => {
  console.log(data);

  const html = Mustache.render(messageTemplate, {
    username: data.username,
    message: data.message,
    createdAt: moment(data.createdAt).format('h:mm a'),
  });

  messages.insertAdjacentHTML('beforeend', html);
  autoSroll();
});

socket.on('locationMessage', (data) => {
  const html = Mustache.render(linkTemplate, {
    username: data.username,
    message: data.message,
    createdAt: moment(data.createdAt).format('h:mm a'),
  });

  messages.insertAdjacentHTML('beforeend', html);
  autoSroll();
});

sendBtn.addEventListener('click', () => {
  newMessage = userInput.value;
  userInput.value = '';
  userInput.focus();
});

form.addEventListener('submit', (e) => {
  e.preventDefault();

  sendBtn.setAttribute('disabled', 'disabled');

  socket.emit('sendMessage', newMessage, (error) => {
    sendBtn.removeAttribute('disabled');
    if (error) {
      return console.log(error);
    }
    console.log('Message Delivered!');
  });
});

shareLocationBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported on this browser');
  }
  shareLocationBtn.setAttribute('disabled', 'disabled');
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      'sendlocation',
      {
        longtitude: position.coords.longitude,
        latitude: position.coords.latitude,
      },
      (message) => {
        shareLocationBtn.removeAttribute('disabled');
      }
    );
  });
});

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});

socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.querySelector('#sidebar').innerHTML = html;
});
