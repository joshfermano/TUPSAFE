#!/bin/bash

# TUPSAFE AI Agent Test Runner
# Provides convenient commands for running tests with various options

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored message
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Print usage
usage() {
    cat << EOF
TUPSAFE AI Agent Test Runner

Usage: ./run_tests.sh [OPTIONS] [TEST_PATH]

OPTIONS:
    -h, --help          Show this help message
    -a, --all           Run all tests (default)
    -u, --unit          Run unit tests only
    -i, --integration   Run integration tests only
    -c, --coverage      Run with coverage report
    -v, --verbose       Verbose output
    -f, --fast          Fast mode (skip slow tests)
    -w, --watch         Watch mode (rerun on changes)
    -d, --debug         Debug mode (show print statements)
    -l, --last-failed   Run only last failed tests
    -m, --markers       Run tests with specific marker
    --html              Generate HTML coverage report
    --xml               Generate XML coverage report

TEST_PATH:
    Optional path to specific test file or directory
    Examples:
        ./run_tests.sh tests/test_health.py
        ./run_tests.sh tests/test_chat.py::TestChatAuthentication

EXAMPLES:
    # Run all tests with coverage
    ./run_tests.sh --coverage

    # Run only unit tests
    ./run_tests.sh --unit

    # Run specific test file
    ./run_tests.sh tests/test_health.py

    # Run with verbose output and coverage
    ./run_tests.sh -v -c

    # Watch mode (requires pytest-watch)
    ./run_tests.sh --watch

    # Run last failed tests
    ./run_tests.sh --last-failed

EOF
}

# Default options
COVERAGE=0
VERBOSE=0
FAST=0
WATCH=0
DEBUG=0
LAST_FAILED=0
HTML_REPORT=0
XML_REPORT=0
MARKER=""
TEST_PATH="tests/"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -a|--all)
            TEST_PATH="tests/"
            shift
            ;;
        -u|--unit)
            MARKER="unit"
            shift
            ;;
        -i|--integration)
            MARKER="integration"
            shift
            ;;
        -c|--coverage)
            COVERAGE=1
            shift
            ;;
        -v|--verbose)
            VERBOSE=1
            shift
            ;;
        -f|--fast)
            FAST=1
            shift
            ;;
        -w|--watch)
            WATCH=1
            shift
            ;;
        -d|--debug)
            DEBUG=1
            shift
            ;;
        -l|--last-failed)
            LAST_FAILED=1
            shift
            ;;
        -m|--markers)
            MARKER="$2"
            shift 2
            ;;
        --html)
            HTML_REPORT=1
            COVERAGE=1
            shift
            ;;
        --xml)
            XML_REPORT=1
            COVERAGE=1
            shift
            ;;
        *)
            TEST_PATH="$1"
            shift
            ;;
    esac
done

# Build pytest command
PYTEST_CMD="pytest"

# Add test path
PYTEST_CMD="$PYTEST_CMD $TEST_PATH"

# Add coverage options
if [ $COVERAGE -eq 1 ]; then
    PYTEST_CMD="$PYTEST_CMD --cov=src --cov-report=term-missing"

    if [ $HTML_REPORT -eq 1 ]; then
        PYTEST_CMD="$PYTEST_CMD --cov-report=html"
    fi

    if [ $XML_REPORT -eq 1 ]; then
        PYTEST_CMD="$PYTEST_CMD --cov-report=xml"
    fi
fi

# Add verbose option
if [ $VERBOSE -eq 1 ]; then
    PYTEST_CMD="$PYTEST_CMD -vv"
fi

# Add debug option (show print statements)
if [ $DEBUG -eq 1 ]; then
    PYTEST_CMD="$PYTEST_CMD -s"
fi

# Add fast option (skip slow tests)
if [ $FAST -eq 1 ]; then
    PYTEST_CMD="$PYTEST_CMD -m 'not slow'"
fi

# Add last failed option
if [ $LAST_FAILED -eq 1 ]; then
    PYTEST_CMD="$PYTEST_CMD --lf"
fi

# Add marker filter
if [ -n "$MARKER" ]; then
    PYTEST_CMD="$PYTEST_CMD -m $MARKER"
fi

# Print test configuration
print_message "$BLUE" "================================"
print_message "$BLUE" "TUPSAFE AI Agent Test Runner"
print_message "$BLUE" "================================"
echo ""
print_message "$YELLOW" "Configuration:"
echo "  Test Path: $TEST_PATH"
[ $COVERAGE -eq 1 ] && echo "  Coverage: Enabled"
[ $VERBOSE -eq 1 ] && echo "  Verbose: Enabled"
[ $FAST -eq 1 ] && echo "  Fast Mode: Enabled (skipping slow tests)"
[ $DEBUG -eq 1 ] && echo "  Debug: Enabled"
[ $LAST_FAILED -eq 1 ] && echo "  Last Failed: Enabled"
[ -n "$MARKER" ] && echo "  Marker: $MARKER"
echo ""

# Watch mode
if [ $WATCH -eq 1 ]; then
    print_message "$YELLOW" "Running in watch mode..."
    print_message "$YELLOW" "Tests will rerun on file changes (Ctrl+C to exit)"
    echo ""

    # Check if pytest-watch is installed
    if ! command -v ptw &> /dev/null; then
        print_message "$RED" "Error: pytest-watch not installed"
        echo "Install it with: pip install pytest-watch"
        exit 1
    fi

    ptw -- $PYTEST_CMD
    exit 0
fi

# Run tests
print_message "$YELLOW" "Running tests..."
echo ""
print_message "$BLUE" "Command: $PYTEST_CMD"
echo ""

# Execute pytest
if eval $PYTEST_CMD; then
    echo ""
    print_message "$GREEN" "================================"
    print_message "$GREEN" "✓ All tests passed!"
    print_message "$GREEN" "================================"

    # Show coverage report location if generated
    if [ $HTML_REPORT -eq 1 ]; then
        echo ""
        print_message "$YELLOW" "HTML coverage report: htmlcov/index.html"
    fi

    exit 0
else
    echo ""
    print_message "$RED" "================================"
    print_message "$RED" "✗ Tests failed"
    print_message "$RED" "================================"
    exit 1
fi
