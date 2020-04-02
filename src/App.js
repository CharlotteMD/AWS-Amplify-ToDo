import React, { useEffect, useReducer, useState } from "react";

import API, { graphqlOperation } from "@aws-amplify/api";
import PubSub from "@aws-amplify/pubsub";

import { createTodo, deleteTodo } from "./graphql/mutations";
import { listTodos } from "./graphql/queries";
import { onCreateTodo } from "./graphql/subscriptions";

import awsconfig from "./aws-exports";
import "./App.css";

API.configure(awsconfig);
PubSub.configure(awsconfig);

// Action Types
const QUERY = "QUERY";
const SUBSCRIPTION = "SUBSCRIPTION";

const initialState = {
  todos: []
};

const reducer = (state, action) => {
  switch (action.type) {
    case QUERY:
      return { ...state, todos: action.todos };
    case SUBSCRIPTION:
      return { ...state, todos: [...state.todos, action.todo] };
    default:
      return state;
  }
};

async function createNewTodo(values) {
  await API.graphql(graphqlOperation(createTodo, { input: values }));
}

async function deleteThisTodo({ todo }) {
  delete todo.name;
  delete todo.description;
  await API.graphql(graphqlOperation(deleteTodo, { input: todo }));
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [values, setValues] = useState({ name: "", description: "" });

  useEffect(() => {
    async function getData() {
      const todoData = await API.graphql(graphqlOperation(listTodos));
      dispatch({ type: QUERY, todos: todoData.data.listTodos.items });
    }
    getData();

    const subscription = API.graphql(graphqlOperation(onCreateTodo)).subscribe({
      next: eventData => {
        const todo = eventData.value.data.onCreateTodo;
        dispatch({ type: SUBSCRIPTION, todo });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setValues({ ...values, [name]: value });
    console.log("Value: ", values);
  };

  const submitToDo = () => {
    const { name, description } = values;
    if (!name || !description) return;
    console.log("here");
    createNewTodo(values);
    console.log("done");
  };

  return (
    <div className="App">
      <form>
        <label>
          Title:
          <input
            type="text"
            name="name"
            value={values.name}
            onChange={handleInputChange}
          />
        </label>
        <label>
          Description:
          <input
            type="text"
            name="description"
            value={values.description}
            onChange={handleInputChange}
          />
        </label>
        <input type="submit" value="Submit" onClick={submitToDo} />
      </form>

      <button onClick={createNewTodo}>Add Todo</button>
      <div className="todoContainer">
        {state.todos.length > 0 ? (
          state.todos.map(todo => (
            <div className="todos">
              <p key={todo.id}>
                {todo.name} : {todo.description}
              </p>
              <button onClick={() => deleteThisTodo({ todo })}>X</button>
            </div>
          ))
        ) : (
          <p>Add some todos!</p>
        )}
      </div>
    </div>
  );
}

export default App;
