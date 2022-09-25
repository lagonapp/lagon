try {
  const getBinary = require('./getBinary');
  getBinary().uninstall();
} catch (err) {
  console.log(error);
}
