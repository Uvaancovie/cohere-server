# API Test Script for PowerShell
Write-Host "🧪 Testing Cohere API Server" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Test 1: Health Check
Write-Host "`n1️⃣ Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method GET
    Write-Host "✅ Health Check: SUCCESS" -ForegroundColor Green
    Write-Host "   Status: $($health.status)"
    Write-Host "   Documents Found: $($health.documentsFound)"
    Write-Host "   API Key Configured: $($health.apiKeyConfigured)"
} catch {
    Write-Host "❌ Health Check: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)"
    exit 1
}

# Test 2: Chat Endpoint
Write-Host "`n2️⃣ Testing Chat Endpoint..." -ForegroundColor Yellow
try {
    $chatBody = @{
        message = "What services do you offer?"
    } | ConvertTo-Json
    
    $chatResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/chat" -Method POST -ContentType "application/json" -Body $chatBody
    
    Write-Host "✅ Chat Test: SUCCESS" -ForegroundColor Green
    Write-Host "   Success: $($chatResponse.success)"
    Write-Host "   Model: $($chatResponse.meta.model)"
    Write-Host "   Documents Used: $($chatResponse.meta.documentsUsed)"
    Write-Host "   Reply Length: $($chatResponse.reply.Length) characters"
    Write-Host "`n📝 AI Response:" -ForegroundColor Cyan
    Write-Host $chatResponse.reply -ForegroundColor White
    
} catch {
    Write-Host "❌ Chat Test: FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)"
}

# Test 3: Different Questions
Write-Host "`n3️⃣ Testing Different Questions..." -ForegroundColor Yellow

$testQuestions = @(
    "What are your pricing options?",
    "How long does it take to build a website?",
    "What is your company location?"
)

foreach ($question in $testQuestions) {
    try {
        Write-Host "`n   Testing: '$question'" -ForegroundColor Gray
        $questionBody = @{ message = $question } | ConvertTo-Json
        $questionResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/chat" -Method POST -ContentType "application/json" -Body $questionBody
        Write-Host "   ✅ Response received ($(($questionResponse.reply).Length) chars)" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n🎉 API Testing Complete!" -ForegroundColor Green
