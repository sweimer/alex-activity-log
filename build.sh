#!/bin/sh

# Check if npm is installed
if ! command -v npm &> /dev/null
then
    echo "npm is not installed. Installing npm..."
    # Install npm (this assumes you have Node.js installed)
    curl -L https://www.npmjs.com/install.sh | sh
fi

# Run the build script
npm run build