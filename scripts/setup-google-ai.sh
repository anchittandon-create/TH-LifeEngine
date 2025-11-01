#!/bin/bash

# 🚀 TH_LifeEngine - Google AI Setup Assistant
# This script helps automate the setup process

echo "🩵 TH_LIFEENGINE - Google AI Setup Assistant"
echo "============================================="
echo ""

# Function to test API key
test_api_key() {
    local api_key=$1
    echo "Testing API key: ${api_key:0:10}..."
    
    response=$(curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=$api_key")
    
    if echo "$response" | grep -q "models"; then
        echo "✅ API Key is valid!"
        return 0
    else
        echo "❌ API Key is invalid or has quota issues"
        echo "Response: $response"
        return 1
    fi
}

# Function to update local .env
update_local_env() {
    local new_key=$1
    echo "📝 Updating local .env file..."
    
    if [ -f ".env" ]; then
        # Backup existing .env
        cp .env .env.backup
        echo "📋 Backed up existing .env to .env.backup"
        
        # Update or add GOOGLE_API_KEY
        if grep -q "GOOGLE_API_KEY=" .env; then
            sed -i '' "s/GOOGLE_API_KEY=.*/GOOGLE_API_KEY=$new_key/" .env
        else
            echo "GOOGLE_API_KEY=$new_key" >> .env
        fi
        
        echo "✅ Updated .env file"
    else
        echo "GOOGLE_API_KEY=$new_key" > .env
        echo "✅ Created new .env file"
    fi
}

# Main menu
show_menu() {
    echo "Choose your upgrade path:"
    echo ""
    echo "1) 🚀 I have a new API key - test and update"
    echo "2) 💳 Help me upgrade my current account"
    echo "3) 📊 Show cost estimates and monitoring info"
    echo "4) 🧪 Test current API key status"
    echo "5) 🔗 Open useful links"
    echo "6) ❌ Exit"
    echo ""
}

# Option handlers
handle_new_api_key() {
    echo "📝 Enter your new Google API key:"
    read -r new_key
    
    if [ ${#new_key} -lt 30 ]; then
        echo "❌ API key seems too short. Please check and try again."
        return 1
    fi
    
    echo "🧪 Testing new API key..."
    if test_api_key "$new_key"; then
        update_local_env "$new_key"
        echo ""
        echo "🎉 Success! Next steps:"
        echo "1. Update the key in Vercel: https://vercel.com/dashboard"
        echo "2. Go to: Settings → Environment Variables"
        echo "3. Update GOOGLE_API_KEY with: $new_key"
        echo "4. Wait 2-3 minutes for deployment"
        echo "5. Test: curl https://th-life-engine.vercel.app/api/quota-test"
    fi
}

handle_upgrade_help() {
    echo "💳 Upgrade Current Account - Step by Step:"
    echo ""
    echo "1. 🌐 Open Google Cloud Console:"
    echo "   https://console.cloud.google.com/"
    echo ""
    echo "2. 💰 Enable Billing:"
    echo "   → Billing → Link billing account → Add payment method"
    echo ""
    echo "3. 🔌 Enable API:"
    echo "   → APIs & Services → Library → Search 'Generative Language API' → Enable"
    echo ""
    echo "4. 📊 Request Quota Increase:"
    echo "   → APIs & Services → Quotas → Filter 'Generative Language API'"
    echo "   → Edit 'Requests per minute' → Set to 60+"
    echo ""
    echo "🕐 Quota increases usually approved within 2-4 hours"
    echo ""
    echo "Press any key to continue..."
    read -r
}

handle_cost_info() {
    echo "📊 Starting local server to get cost estimates..."
    
    # Check if server is running
    if curl -s "http://localhost:3000/api/cost-estimates" > /dev/null 2>&1; then
        echo "📈 Cost Estimates:"
        curl -s "http://localhost:3000/api/cost-estimates" | jq .
    else
        echo "ℹ️  Local server not running. Cost estimates:"
        echo ""
        echo "💰 Monthly Cost Estimates:"
        echo "   Light usage (10-20 plans/day):    $0.50 - $1.00"
        echo "   Moderate usage (25-50 plans/day): $1.00 - $3.00"
        echo "   Heavy usage (50-100 plans/day):   $3.00 - $6.00"
        echo ""
        echo "📊 Current TH_LifeEngine optimizations:"
        echo "   ✅ 24-hour caching (reduces duplicate requests)"
        echo "   ✅ 3 requests per user per day limit"
        echo "   ✅ 1024 token output limit"
        echo "   ✅ Request throttling and error handling"
    fi
}

handle_test_current() {
    echo "🧪 Testing current API key..."
    
    if [ -f ".env" ] && grep -q "GOOGLE_API_KEY=" .env; then
        current_key=$(grep "GOOGLE_API_KEY=" .env | cut -d'=' -f2)
        test_api_key "$current_key"
    else
        echo "❌ No GOOGLE_API_KEY found in .env file"
    fi
}

handle_open_links() {
    echo "🔗 Opening useful links..."
    echo ""
    echo "Opening in your default browser:"
    echo "1. Google AI Studio (get API key)"
    echo "2. Google Cloud Console (billing & quotas)"
    echo "3. Vercel Dashboard (update environment)"
    echo "4. AI Usage Monitoring"
    echo ""
    
    open "https://ai.google.dev/"
    sleep 1
    open "https://console.cloud.google.com/"
    sleep 1
    open "https://vercel.com/dashboard"
    sleep 1
    open "https://ai.dev/usage"
}

# Main script loop
main() {
    while true; do
        show_menu
        echo "Enter your choice (1-6):"
        read -r choice
        
        case $choice in
            1) handle_new_api_key ;;
            2) handle_upgrade_help ;;
            3) handle_cost_info ;;
            4) handle_test_current ;;
            5) handle_open_links ;;
            6) echo "👋 Goodbye! Your TH_LifeEngine will be amazing!"; exit 0 ;;
            *) echo "❌ Invalid choice. Please enter 1-6." ;;
        esac
        
        echo ""
        echo "Press any key to return to menu..."
        read -r
        clear
    done
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || ! grep -q "th-lifeengine" package.json; then
    echo "❌ Please run this script from the TH-LifeEngine directory"
    exit 1
fi

# Check dependencies
if ! command -v jq &> /dev/null; then
    echo "📦 Installing jq for JSON parsing..."
    if command -v brew &> /dev/null; then
        brew install jq
    else
        echo "⚠️  Please install jq manually: https://stedolan.github.io/jq/"
    fi
fi

clear
main