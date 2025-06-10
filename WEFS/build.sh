#!/bin/bash

# Install backend dependencies
npm install

# Install frontend dependencies and build
cd frontend
npm install
npm run build
cd ..

echo "Build completed successfully"
