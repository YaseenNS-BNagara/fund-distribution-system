const bcrypt = require('bcryptjs');
const hash = '$2b$12$q/5K9YRrIKW.GvmLhKOg6uhzqSBi9ry4KTSF3k/8mlv9NJE/q/f1K';
console.log(bcrypt.compareSync('1234abcd', hash));