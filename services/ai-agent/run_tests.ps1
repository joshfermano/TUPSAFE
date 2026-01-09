# TUPSAFE AI Agent Test Runner (PowerShell)
# Provides convenient commands for running tests with various options

param(
    [switch]$Help,
    [switch]$All,
    [switch]$Unit,
    [switch]$Integration,
    [switch]$Coverage,
    [switch]$Verbose,
    [switch]$Fast,
    [switch]$Debug,
    [switch]$LastFailed,
    [switch]$Html,
    [switch]$Xml,
    [string]$Markers = "",
    [string]$TestPath = "tests/"
)

# Colors
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"

function Print-Message {
    param(
        [string]$Color,
        [string]$Message
    )
    Write-Host $Message -ForegroundColor $Color
}

function Show-Usage {
    Write-Host @"
TUPSAFE AI Agent Test Runner

Usage: .\run_tests.ps1 [OPTIONS] [-TestPath <path>]

OPTIONS:
    -Help               Show this help message
    -All                Run all tests (default)
    -Unit               Run unit tests only
    -Integration        Run integration tests only
    -Coverage           Run with coverage report
    -Verbose            Verbose output
    -Fast               Fast mode (skip slow tests)
    -Debug              Debug mode (show print statements)
    -LastFailed         Run only last failed tests
    -Markers <marker>   Run tests with specific marker
    -Html               Generate HTML coverage report
    -Xml                Generate XML coverage report
    -TestPath <path>    Path to specific test file or directory

EXAMPLES:
    # Run all tests with coverage
    .\run_tests.ps1 -Coverage

    # Run only unit tests
    .\run_tests.ps1 -Unit

    # Run specific test file
    .\run_tests.ps1 -TestPath tests\test_health.py

    # Run with verbose output and coverage
    .\run_tests.ps1 -Verbose -Coverage

    # Run last failed tests
    .\run_tests.ps1 -LastFailed

    # Generate HTML coverage report
    .\run_tests.ps1 -Coverage -Html

"@
}

# Show help if requested
if ($Help) {
    Show-Usage
    exit 0
}

# Build pytest command
$PytestCmd = @("pytest")

# Add test path
if ($TestPath) {
    $PytestCmd += $TestPath
}

# Add coverage options
if ($Coverage) {
    $PytestCmd += "--cov=src"
    $PytestCmd += "--cov-report=term-missing"

    if ($Html) {
        $PytestCmd += "--cov-report=html"
    }

    if ($Xml) {
        $PytestCmd += "--cov-report=xml"
    }
}

# Add verbose option
if ($Verbose) {
    $PytestCmd += "-vv"
}

# Add debug option (show print statements)
if ($Debug) {
    $PytestCmd += "-s"
}

# Add fast option (skip slow tests)
if ($Fast) {
    $PytestCmd += "-m"
    $PytestCmd += "not slow"
}

# Add last failed option
if ($LastFailed) {
    $PytestCmd += "--lf"
}

# Add marker filter
if ($Unit) {
    $PytestCmd += "-m"
    $PytestCmd += "unit"
}
elseif ($Integration) {
    $PytestCmd += "-m"
    $PytestCmd += "integration"
}
elseif ($Markers) {
    $PytestCmd += "-m"
    $PytestCmd += $Markers
}

# Print test configuration
Write-Host ""
Print-Message $Blue "================================"
Print-Message $Blue "TUPSAFE AI Agent Test Runner"
Print-Message $Blue "================================"
Write-Host ""
Print-Message $Yellow "Configuration:"
Write-Host "  Test Path: $TestPath"
if ($Coverage) { Write-Host "  Coverage: Enabled" }
if ($Verbose) { Write-Host "  Verbose: Enabled" }
if ($Fast) { Write-Host "  Fast Mode: Enabled (skipping slow tests)" }
if ($Debug) { Write-Host "  Debug: Enabled" }
if ($LastFailed) { Write-Host "  Last Failed: Enabled" }
if ($Markers) { Write-Host "  Marker: $Markers" }
if ($Unit) { Write-Host "  Marker: unit" }
if ($Integration) { Write-Host "  Marker: integration" }
Write-Host ""

# Run tests
Print-Message $Yellow "Running tests..."
Write-Host ""
Print-Message $Blue "Command: $($PytestCmd -join ' ')"
Write-Host ""

# Execute pytest
$process = Start-Process -FilePath "python" -ArgumentList "-m",$($PytestCmd -join " ") -NoNewWindow -PassThru -Wait

# Check exit code
if ($process.ExitCode -eq 0) {
    Write-Host ""
    Print-Message $Green "================================"
    Print-Message $Green "✓ All tests passed!"
    Print-Message $Green "================================"

    # Show coverage report location if generated
    if ($Html) {
        Write-Host ""
        Print-Message $Yellow "HTML coverage report: htmlcov\index.html"
    }

    exit 0
}
else {
    Write-Host ""
    Print-Message $Red "================================"
    Print-Message $Red "✗ Tests failed"
    Print-Message $Red "================================"
    exit 1
}
