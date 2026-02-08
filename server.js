// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Porta definida pelo Railway ou padrão 8080
const PORT = process.env.PORT || 8080;

// Servir arquivos estáticos da pasta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal e health check
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'caixa.html'));
});
app.get('/health', (req, res) => res.status(200).send('OK'));

// Fila de clientes
let fila = [];

// Conexão Socket.IO
io.on('connection', (socket) => {
  console.log('Novo cliente conectado');

  // Envia fila atual
  socket.emit('fila-atualizada', fila);

  // Adicionar cliente
  socket.on('adicionar-cliente', (cliente) => {
    fila.push(cliente);
    io.emit('fila-atualizada', fila);
  });

  // Atualizar observação do estoque
  socket.on('atualizar-estoque', ({ index, obsEstoque }) => {
    if (fila[index]) {
      fila[index].obsEstoque = obsEstoque;
      io.emit('fila-atualizada', fila);
    }
  });

  // Remover cliente (entregue)
  socket.on('remover-cliente', (index) => {
    if (fila[index]) {
      fila.splice(index, 1);
      io.emit('fila-atualizada', fila);
    }
  });

  // Pedido entregue → dispara som/notification no Caixa
  socket.on('pedido-entregue', () => {
    io.emit('pedido-entregue');
  });
});

// 🚨 Escutar no PORT definido
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});