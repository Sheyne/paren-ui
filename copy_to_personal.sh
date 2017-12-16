cp *.js ../Sheyne.com/
sed \$d main.js > ../Sheyne.com/main.js
sed \$d worker.js > ../Sheyne.com/worker.js
cp index.html ../Sheyne.com/toy-lang.html
cp style.css ../Sheyne.com
cd ../Sheyne.com
git add .
git commit
git push