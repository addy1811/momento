import { io } from "socket.io-client";

const API = import.meta.env.VITE_API_URL;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API;

const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false,
  auth: (cb) => {
    fetch(`${API}/api/socket-token`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => cb({ token: d.token }))
      .catch(() => cb({}));
  },
});

export default socket;