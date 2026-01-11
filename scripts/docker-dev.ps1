# TUPSAFE Docker Development Helper Script (PowerShell)
# Usage: .\scripts\docker-dev.ps1 [command]

param(
    [Parameter(Position=0)]
    [string]$Command = "help",

    [Parameter(Position=1)]
    [string]$Service = ""
)

# Get the project root directory
$ProjectRoot = Split-Path -Parent $PSScriptRoot

# Change to project root for docker-compose commands
Push-Location $ProjectRoot

# Function to print colored output
function Print-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Print-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Print-Warning {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Print-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Function to check if Docker is running
function Test-Docker {
    try {
        docker info | Out-Null
        return $true
    } catch {
        Print-Error "Docker is not running. Please start Docker Desktop."
        return $false
    }
}

# Function to start services
function Start-Services {
    Print-Info "Starting TUPSAFE development environment..."
    if (-not (Test-Docker)) { Pop-Location; exit 1 }

    docker compose up -d
    Print-Success "Services started successfully!"
    Write-Host ""
    Print-Info "Access points:"
    Write-Host "  - Employee Portal: http://localhost:3000"
    Write-Host "  - Admin Portal: http://localhost:3001"
    Write-Host "  - AI Agent API: http://localhost:8000"
    Write-Host "  - AI Agent Docs: http://localhost:8000/docs"
}

# Function to stop services
function Stop-Services {
    Print-Info "Stopping TUPSAFE services..."
    docker compose down
    Print-Success "Services stopped successfully!"
}

# Function to restart services
function Restart-Services {
    Print-Info "Restarting TUPSAFE services..."
    docker compose restart
    Print-Success "Services restarted successfully!"
}

# Function to rebuild services
function Rebuild-Services {
    Print-Info "Rebuilding TUPSAFE services..."
    if (-not (Test-Docker)) { Pop-Location; exit 1 }

    docker compose down
    docker compose build --no-cache
    docker compose up -d
    Print-Success "Services rebuilt successfully!"
}

# Function to view logs
function Show-Logs {
    param([string]$ServiceName)

    if ([string]::IsNullOrEmpty($ServiceName)) {
        Print-Info "Showing logs for all services (Ctrl+C to exit)..."
        docker compose logs -f
    } else {
        Print-Info "Showing logs for $ServiceName (Ctrl+C to exit)..."
        docker compose logs -f $ServiceName
    }
}

# Function to check status
function Show-Status {
    Print-Info "Service Status:"
    docker compose ps
    Write-Host ""
    Print-Info "Health Checks:"

    # Check employee portal
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 2 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Print-Success "Employee Portal: Healthy"
        }
    } catch {
        Print-Warning "Employee Portal: Not responding"
    }

    # Check admin portal
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -TimeoutSec 2 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Print-Success "Admin Portal: Healthy"
        }
    } catch {
        Print-Warning "Admin Portal: Not responding"
    }

    # Check AI agent
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/health" -TimeoutSec 2 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Print-Success "AI Agent: Healthy"
        }
    } catch {
        Print-Warning "AI Agent: Not responding"
    }

    # Check Redis
    try {
        $redisTest = docker compose exec -T redis redis-cli ping 2>&1
        if ($redisTest -match "PONG") {
            Print-Success "Redis: Healthy"
        } else {
            Print-Warning "Redis: Not responding"
        }
    } catch {
        Print-Warning "Redis: Not responding"
    }
}

# Function to clean up
function Clean-Services {
    Print-Warning "This will remove all containers, volumes, and images. Continue? (y/N)"
    $response = Read-Host
    if ($response -eq 'y' -or $response -eq 'Y') {
        Print-Info "Cleaning up Docker resources..."
        docker compose down -v
        docker system prune -f
        Print-Success "Cleanup completed!"
    } else {
        Print-Info "Cleanup cancelled."
    }
}

# Function to execute command in container
function Open-Shell {
    param([string]$ServiceName = "employee")

    Print-Info "Opening shell in $ServiceName container..."
    docker compose exec $ServiceName sh
}

# Function to build specific service
function Build-Service {
    param([string]$ServiceName)

    if ([string]::IsNullOrEmpty($ServiceName)) {
        Print-Info "Building all services..."
        docker compose build
    } else {
        Print-Info "Building $ServiceName..."
        docker compose build $ServiceName
    }
    Print-Success "Build completed!"
}

# Function to start production
function Start-Production {
    Print-Info "Starting TUPSAFE production environment..."
    if (-not (Test-Docker)) { Pop-Location; exit 1 }

    docker compose -f docker-compose.prod.yml up -d
    Print-Success "Production services started successfully!"
}

# Function to show help
function Show-Help {
    Write-Host @"
TUPSAFE Docker Development Helper (PowerShell)

Usage: .\scripts\docker-dev.ps1 [command] [service]

Commands:
  start         Start all services in detached mode
  stop          Stop all services
  restart       Restart all services
  rebuild       Rebuild and restart all services (no cache)
  build [svc]   Build services (optionally specific service)
  logs [svc]    Show logs (optionally for specific service)
  status        Show service status and health checks
  clean         Remove all containers, volumes, and images
  shell [svc]   Open shell in service container (default: employee)
  prod          Start production environment
  help          Show this help message

Services:
  - employee    Employee Portal (Next.js) - Port 3000
  - admin       Admin Portal (Next.js) - Port 3001
  - ai-agent    AI Agent Service (FastAPI) - Port 8000
  - redis       Redis Cache - Port 6379

Examples:
  .\scripts\docker-dev.ps1 start              # Start all services
  .\scripts\docker-dev.ps1 logs employee      # View employee logs
  .\scripts\docker-dev.ps1 shell ai-agent     # Open shell in AI agent
  .\scripts\docker-dev.ps1 status             # Check health status
  .\scripts\docker-dev.ps1 build admin        # Build admin service only
  .\scripts\docker-dev.ps1 prod               # Start production

For detailed documentation, see:
  - DOCKER_QUICKSTART.md
  - DOCKER.md
"@
}

# Main command handler
switch ($Command.ToLower()) {
    "start" {
        Start-Services
    }
    "stop" {
        Stop-Services
    }
    "restart" {
        Restart-Services
    }
    "rebuild" {
        Rebuild-Services
    }
    "build" {
        Build-Service -ServiceName $Service
    }
    "logs" {
        Show-Logs -ServiceName $Service
    }
    "status" {
        Show-Status
    }
    "clean" {
        Clean-Services
    }
    "shell" {
        if ([string]::IsNullOrEmpty($Service)) {
            $Service = "employee"
        }
        Open-Shell -ServiceName $Service
    }
    "prod" {
        Start-Production
    }
    "help" {
        Show-Help
    }
    default {
        Print-Error "Unknown command: $Command"
        Write-Host ""
        Show-Help
        Pop-Location
        exit 1
    }
}

# Return to original directory
Pop-Location
