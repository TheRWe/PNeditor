cd %~dp0PNetEditor\
call npm install
%~dp0PNetEditor\node_modules\.bin\electron-builder.cmd build
pause