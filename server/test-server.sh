#!/bin/bash

# Simple test script for the server
# Make sure the server is running before executing this

echo "Testing NYC Danger Map Server..."
echo ""

# Test health endpoint
echo "1. Testing /health endpoint:"
curl -s http://localhost:3000/health | python3 -m json.tool || curl -s http://localhost:3000/health
echo ""
echo ""

# Test test endpoint
echo "2. Testing /test endpoint:"
curl -s http://localhost:3000/test | python3 -m json.tool || curl -s http://localhost:3000/test
echo ""
echo ""

# Test 404 handler
echo "3. Testing 404 handler:"
curl -s http://localhost:3000/nonexistent | python3 -m json.tool || curl -s http://localhost:3000/nonexistent
echo ""
echo ""

echo "Tests complete!"



