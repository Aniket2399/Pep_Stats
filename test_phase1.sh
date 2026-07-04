#!/bin/bash

# Test script for Live Pitch Phase 1
# Verifies all components are working correctly

set -e  # Exit on error

echo "=================================================="
echo "🧪 LIVE PITCH - PHASE 1 TEST SUITE"
echo "=================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function for tests
test_command() {
    local test_name=$1
    local command=$2
    
    echo -n "Testing: $test_name... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}"
        ((TESTS_FAILED++))
    fi
}

# Test 1: Docker is installed
test_command "Docker installation" "docker --version"

# Test 2: Docker Compose is installed
test_command "Docker Compose installation" "docker-compose --version"

# Test 3: Python is installed
test_command "Python installation" "python --version"

# Test 4: Python version is 3.9+
test_command "Python version >= 3.9" "python -c 'import sys; assert sys.version_info >= (3, 9)'"

echo ""
echo "=================================================="
echo "🐳 DOCKER SERVICES"
echo "=================================================="
echo ""

# Test 5: Docker containers are running
test_command "Docker containers running" "docker-compose ps | grep -q 'Up'"

# Test 6: Kafka is accessible
test_command "Kafka is accessible" "docker-compose exec -T kafka kafka-broker-api-versions --bootstrap-server localhost:9092"

# Test 7: TimescaleDB is accessible
test_command "TimescaleDB is accessible" "docker-compose exec -T timescaledb pg_isready -U live_pitch"

# Test 8: Redis is accessible
test_command "Redis is accessible" "docker-compose exec -T redis redis-cli ping | grep -q PONG"

# Test 9: MongoDB is accessible
test_command "MongoDB is accessible" "docker-compose exec -T mongodb mongosh --eval 'db.adminCommand(\"ping\")' --quiet"

echo ""
echo "=================================================="
echo "🐍 PYTHON ENVIRONMENT"
echo "=================================================="
echo ""

# Test 10: Virtual environment exists
test_command "Virtual environment" "[ -d venv ]"

# Test 11: Kafka Python library
test_command "kafka-python installed" "python -c 'import kafka'"

# Test 12: PySpark installed
test_command "pyspark installed" "python -c 'import pyspark'"

# Test 13: FastAPI installed
test_command "fastapi installed" "python -c 'import fastapi'"

# Test 14: Pandas installed
test_command "pandas installed" "python -c 'import pandas'"

echo ""
echo "=================================================="
echo "📡 KAFKA TOPICS"
echo "=================================================="
echo ""

# Test 15: Kafka topics exist
test_command "match-events topic" "docker-compose exec -T kafka kafka-topics --list --bootstrap-server localhost:9092 | grep -q match-events"

test_command "possession-stats topic" "docker-compose exec -T kafka kafka-topics --list --bootstrap-server localhost:9092 | grep -q possession-stats"

test_command "social-sentiment topic" "docker-compose exec -T kafka kafka-topics --list --bootstrap-server localhost:9092 | grep -q social-sentiment"

echo ""
echo "=================================================="
echo "💾 DATABASE CONNECTIONS"
echo "=================================================="
echo ""

# Test 16: Database.py runs without error
test_command "Database initialization" "timeout 30 python database.py"

echo ""
echo "=================================================="
echo "📊 API ENDPOINTS"
echo "=================================================="
echo ""

# Start FastAPI in background
echo "Starting FastAPI server (this may take a few seconds)..."
timeout 10 python main.py > /dev/null 2>&1 &
API_PID=$!
sleep 5

# Test 17: Health endpoint
test_command "GET /health" "curl -s http://localhost:8000/health | grep -q 'ok'"

# Test 18: Matches endpoint
test_command "GET /matches" "curl -s http://localhost:8000/matches | grep -q 'matches'"

# Test 19: Status endpoint
test_command "GET /status" "curl -s http://localhost:8000/status | grep -q 'running'"

# Kill FastAPI
kill $API_PID 2>/dev/null || true

echo ""
echo "=================================================="
echo "📝 CONFIGURATION FILES"
echo "=================================================="
echo ""

# Test 20: Required files exist
test_command "docker-compose.yml exists" "[ -f docker-compose.yml ]"

test_command "requirements.txt exists" "[ -f requirements.txt ]"

test_command "database.py exists" "[ -f database.py ]"

test_command "main.py exists" "[ -f main.py ]"

test_command "kafka_producer.py exists" "[ -f kafka_producer.py ]"

test_command "mock_data.py exists" "[ -f mock_data.py ]"

test_command "spark_job.py exists" "[ -f spark_job.py ]"

echo ""
echo "=================================================="
echo "📊 TEST RESULTS"
echo "=================================================="
echo ""

TOTAL=$((TESTS_PASSED + TESTS_FAILED))

echo "Total tests: $TOTAL"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"

echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo ""
    echo "🎉 Phase 1 is ready to go!"
    echo ""
    echo "Next steps:"
    echo "1. Terminal 1: python mock_data.py"
    echo "2. Terminal 2: python spark_job.py"
    echo "3. Terminal 3: python main.py"
    echo "4. Terminal 4: curl http://localhost:8000/docs"
    echo ""
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo ""
    echo "Please check:"
    echo "1. Docker is running: docker-compose up -d"
    echo "2. All services are healthy: docker-compose ps"
    echo "3. Python environment is activated: source venv/bin/activate"
    echo "4. Dependencies are installed: pip install -r requirements.txt"
    echo ""
    exit 1
fi