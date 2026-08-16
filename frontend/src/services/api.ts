import axios from "axios";

const api = axios.create({
  // Before vite config modification: baseURL: "http://localhost:3000"
  // Now due to vite config modification, we can use empty baseURL and the proxy will handle the rest.
  baseURL: "",
  // withCredentials: true is required for cross-origin (CORS) requests to send/receive cookies.
  //
  // Same-Origin vs. Cross-Origin (CORS) Cookie Behavior:
  // 1. Same-Origin (e.g., frontend and backend run on the exact same domain and port):
  //    The browser automatically attaches cookies to all outgoing requests without any extra code.
  // 2. Cross-Origin / CORS (e.g., frontend on localhost:5173 and backend on localhost:3000):
  //    By default, the browser blocks cookies on cross-origin requests.
  //    - Client-side: Must set `withCredentials: true` (e.g., on Axios globally or per request options like `axios.get('/tasks', { withCredentials: true })`).
  //    - Server-side: The backend must allow credentials (`Access-Control-Allow-Credentials: true`) and specify the explicit frontend origin (wildcard "*" is not allowed when credentials are enabled).
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
