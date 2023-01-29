import React from 'react';

function fetchProfileData() {
  const userPromise = fetchUser();
  return {
    user: wrapPromise(userPromise),
  };
}

function wrapPromise(promise) {
  let status = 'pending';
  let result;
  const suspender = promise.then(
    r => {
      status = 'success';
      result = r;
    },
    e => {
      status = 'error';
      result = e;
    },
  );
  return {
    read() {
      if (status === 'pending') {
        throw suspender;
      } else if (status === 'error') {
        throw result;
      } else if (status === 'success') {
        return result;
      }
    },
  };
}

async function fetchUser() {
  return new Promise(resolve => setTimeout(() => resolve({ name: 'Tim' }), 1000));
}

const resource = fetchProfileData();

export default function Hello() {
  const user = resource.user.read();

  return <pre>{JSON.stringify(user, null, 2)}</pre>;
}
