# Webscocket client and server with HMAC signed messages on both sides

# Install 

1. Download [Node.js](https://nodejs.org/en/download/) 
2. Goto root folder of repo (where packages.json file is present) and install required NPM packages

```bash
npm install
```

##  Start server

Open shell in root folder and start server

```bash
node upgradeServer.js
```

# Debugging

1. Install extension for debugging in chrome browser

Node.js V8 --inspector Manager (NiM]

2. Start NiM extension in Chrome:

Open <about://inspect> in a new tab 

3. Start node script with inspect enabled. 

```bash
node --inspect-brk upgradeServer.js
```

4. After a few seconds you should see Target upgradeServer.js on your chrome tab. Click on inspect link and new DevTools window will appear with source code.

# Literature

## Node.js Websocket NPM package

[node ws ](https://github.com/websockets/ws/)

[node ws test](https://github.com/websockets/ws/blob/master/test/websocket.test.js)
