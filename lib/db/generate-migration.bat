@echo off
setlocal
for /f "tokens=1,2 delims==" %%a in (..\..\.env) do (
  set %%a=%%b
)
cd /d "%~dp0"
pnpm drizzle-kit generate
