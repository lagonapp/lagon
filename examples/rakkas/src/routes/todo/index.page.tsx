import { useState } from 'react';
import { Todo } from './Todo';
import css from './page.module.css';
import { runServerSideMutation, useMutation, useServerSideQuery } from 'rakkasjs';

import { createTodo, readAllTodos } from 'src/crud';

export default function TodoPage() {
  const { data, refetch } = useServerSideQuery(readAllTodos, {
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const [text, setText] = useState('');

  const { mutate: create } = useMutation(async () => {
    await runServerSideMutation(() => createTodo({ text, done: false }));
    refetch();
  });

  return (
    <main>
      <h1>Todo</h1>

      <p>This is a simple todo application that demonstrates data fetching.</p>

      <ul className={css.todoList}>
        {data.map(todo => (
          <Todo key={todo.id} todo={todo} refetch={refetch} />
        ))}
      </ul>

      <p className={css.p}>
        <input className={css.input} value={text} onChange={e => setText(e.target.value)} />

        <button type="button" className={css.addButton} disabled={!text} onClick={() => create()}>
          Add
        </button>
      </p>
    </main>
  );
}
