const exec = require('child_process').exec;
const child = exec('npm start',
    (error, stdout, stderr) =>
    {
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
        if (error !== null) {
            console.log(`exec error: ${error}`);
        }
    });

child.on("close", (_c, _s) =>
{
    process.exit();
});