import {SOCKET_SERVER} from "./config";

const io = window.io;
const socket = io(SOCKET_SERVER, { autoConnect: false });
localStorage.setItem('debug', 'socket.io-client:socket');

socket.onAny((event, ...args) => {
    console.log(event, args);
});

export default socket;
