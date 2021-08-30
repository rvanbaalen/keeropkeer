import {SOCKET_SERVER} from "./config";

const io = window.io;
const socket = io(SOCKET_SERVER, { autoConnect: false });

socket.onAny((event, ...args) => {
    console.log(event, args);
});

console.log('Setup socket server ', SOCKET_SERVER);

export default socket;
