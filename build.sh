#!/bin/bash

# From the root, run npm install
npm install

# Navigate to the frontend directory and build the frontend
cd frontend || exit
npm install
npm run build

# Navigate to the backend directory and build the backend
cd ../backend || exit
npm install
npm run build

# Navigate back to root
cd ../ || exit

# Do not run npm start during the build process
# npm start