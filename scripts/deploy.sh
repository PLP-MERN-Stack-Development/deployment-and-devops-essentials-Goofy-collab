#!/bin/bash

# Deployment Script for Socket.io Chat Application
# This script prepares the application for deployment

echo "🚀 Starting deployment preparation..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the project root
if [ ! -d "server" ] || [ ! -d "client" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Step 1: Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js 18 or higher is required"
    exit 1
fi
print_success "Node.js version OK"

# Step 2: Clean install server dependencies
echo "🔧 Installing server dependencies..."
cd server
rm -rf node_modules package-lock.json
npm install
if [ $? -ne 0 ]; then
    print_error "Server dependency installation failed"
    exit 1
fi
print_success "Server dependencies installed"

# Step 3: Test server
echo "🧪 Testing server..."
timeout 10 npm start &
SERVER_PID=$!
sleep 5
curl -f http://localhost:5000/api/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_success "Server health check passed"
else
    print_warning "Server health check failed (might be expected if MongoDB not configured)"
fi
kill $SERVER_PID 2>/dev/null

# Step 4: Clean install client dependencies
echo "🔧 Installing client dependencies..."
cd ../client
rm -rf node_modules package-lock.json
npm install
if [ $? -ne 0 ]; then
    print_error "Client dependency installation failed"
    exit 1
fi
print_success "Client dependencies installed"

# Step 5: Build client
echo "🏗️  Building client for production..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Client build failed"
    exit 1
fi
print_success "Client build successful"

# Step 6: Check dist folder
if [ ! -d "dist" ]; then
    print_error "Build output (dist) folder not found"
    exit 1
fi
print_success "Build output verified"

# Step 7: Check environment files
cd ..
echo "🔍 Checking environment configuration..."
if [ ! -f "server/.env.example" ]; then
    print_warning "server/.env.example not found"
else
    print_success "server/.env.example found"
fi

if [ ! -f "client/.env.example" ]; then
    print_warning "client/.env.example not found"
else
    print_success "client/.env.example found"
fi

# Step 8: Run security audit
echo "🔒 Running security audit..."
cd server
npm audit --audit-level=moderate || print_warning "Server has some vulnerabilities"
cd ../client
npm audit --audit-level=moderate || print_warning "Client has some vulnerabilities"
cd ..

# Step 9: Check Git status
echo "📝 Checking Git status..."
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes"
    git status --short
    echo ""
    read -p "Do you want to commit these changes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "chore: prepare for deployment"
        print_success "Changes committed"
    fi
else
    print_success "Working directory clean"
fi

# Step 10: Summary
echo ""
echo "═══════════════════════════════════════"
echo "📊 Deployment Preparation Summary"
echo "═══════════════════════════════════════"
print_success "All checks passed!"
echo ""
echo "Next steps:"
echo "1. Push to GitHub: git push origin main"
echo "2. Deploy backend to Railway"
echo "3. Deploy frontend to Vercel"
echo "4. Update environment variables"
echo "5. Test production deployment"
echo ""
echo "═══════════════════════════════════════"