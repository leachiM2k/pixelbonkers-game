# PIXEL BONKERS Relay-Server
`npm install && npm start` — laeuft auf `ws://localhost:8090` (ueberschreibbar via `PORT`-Env).
Protokoll: `{t:'host'}`->`{t:'hosted',room}` · `{t:'join',room}` · `{t:'msg',d}` · Binary 1:1 · `{t:'leave'}`.
