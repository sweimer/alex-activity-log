#!/bin/bash

# Navigate to the frontend directory and start the frontend
cd ./frontend || exit
npm start &

# Navigate to the backend directory and start the backend
cd ../backend || exit
npm start &

# Wait for all background processes to finish
wait