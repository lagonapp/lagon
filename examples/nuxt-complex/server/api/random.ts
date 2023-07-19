const users = ['tom', 'daniel', 'sebastien'];

const getRandomUser = () => {
  const index = Math.floor(Math.random() * users.length);
  return users[index];
};

export default defineEventHandler(() => {
  return {
    name: getRandomUser(),
  };
});
