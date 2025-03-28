#!/bin/bash

# Navigate to the frontend directory and build the frontend
npm run build

# Navigate to the backend directory and build the backend
cd ../backend || exit
npm install

# Navigate back to root
cd ../ || exit

# Do not run npm start during the build process
# npm start