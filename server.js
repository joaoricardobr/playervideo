// server.js
const express = require('express');
const cors = require('cors');
const request = require('request');
const path = require('path');

// Inicializa o servidor Express
const app = express();
app.use(cors());

// Rota para o proxy CORS
app.get('/proxy', (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).send("URL não fornecida.");
  }
  request(url).pipe(res);
});

// Servir arquivos estáticos diretamente da raiz
app.use(express.static(__dirname));

// Rota padrão para servir o index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Porta do servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
