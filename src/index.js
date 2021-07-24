const express = require('express');
const cors = require('cors');

const users = [];
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
    
  const user = users.find((user) => user.username === username); 
  if (!user){
      return response.status(404).json({ error: "User not found" })
  }

  request.user = user; 
  return next();
}

function checksExistsTodo(request, response, next) {
  const { user } = request;
  const { id } = request.params;

  const todoIndex = user.todos.findIndex((todo) => todo.id === id); //dessa forma os métodos poderão acessar o todo indicado pelo id através de sua posição
  if(todoIndex == -1){
      return response.status(404).json({ error: "Todo not found" })
  }
  
  request.todoIndex = todoIndex;
  return next();
}

app.post('/users', (request, response) => {
  const {name, username} = request.body;

  const userAlreadyExists = users.some((user) => user.username === username);
  if(userAlreadyExists){
      return response.status(400).json({error: "User already exists!"});        
  }
  
  const user = {
    id: uuidv4(), name, username,  todos: []
  }

  users.push(user); //adicionando o novo objeto do usuário ao final do array
  return response.status(201).json(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos); //acessando todos os todos existentes para este usuário
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const newTodo = {
    id: uuidv4(), title, done: false, deadline: new Date(deadline), created_at: new Date()        
  }

  user.todos.push(newTodo); //adicionando o novo objeto de todo ao final do array

  return response.status(201).json(newTodo);
});

app.put('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { user, todoIndex } = request;
  const { title, deadline } = request.body;

  //atualizando os dados a partir do que foi passado no body
  user.todos[todoIndex].title = title;
  user.todos[todoIndex].deadline = new Date(deadline);

  return response.json(user.todos[todoIndex]);
});

app.patch('/todos/:id/done', checksExistsUserAccount,  checksExistsTodo, (request, response) => {
  const { user, todoIndex } = request;

  user.todos[todoIndex].done = true;

  return response.status(200).send();
});

app.delete('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { user, todoIndex } = request;

  user.todos.splice(todoIndex, 1); //deletando o todo utilizando sua posição

  return response.status(204).send(); //status 204 que representa uma resposta sem conteúdo
});

module.exports = app;
