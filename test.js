const { exec } = require("child_process");
exec("pwd", (error, stdout, stderr) => {
  console.log(stdout);
  console.log(stderr);
});
