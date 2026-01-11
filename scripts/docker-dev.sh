#!/bin/bash
# TUPSAFE Docker Development Helper Script
# Usage: ./scripts/docker-dev.sh [command]

set -e

# Get the project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to project root for docker-compose commands
cd "$PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi
}

# Function to start services
start() {
    print_info "Starting TUPSAFE development environment..."
    check_docker
    docker compose up -d
    print_success "Services started successfully!"
    echo ""
    print_info "Access points:"
    echo "  - Employee Portal: http://localhost:3000"
    echo "  - Admin Portal: http://localhost:3001"
    echo "  - AI Agent API: http://localhost:8000"
    echo "  - AI Agent Docs: http://localhost:8000/docs"
}

# Function to stop services
stop() {
    print_info "Stopping TUPSAFE services..."
    docker compose down
    print_success "Services stopped successfully!"
}

# Function to restart services
restart() {
    print_info "Restarting TUPSAFE services..."
    docker compose restart
    print_success "Services restarted successfully!"
}

# Function to rebuild services
rebuild() {
    print_info "Rebuilding TUPSAFE services..."
    check_docker
    docker compose down
    docker compose build --no-cache
    docker compose up -d
    print_success "Services rebuilt successfully!"
}

# Function to build specific service
build() {
    SERVICE=${1:-}
    if [ -z "$SERVICE" ]; then
        print_info "Building all services..."
        docker compose build
    else
        print_info "Building $SERVICE..."
        docker compose build "$SERVICE"
    fi
    print_success "Build completed!"
}

# Function to view logs
logs() {
    SERVICE=${1:-}
    if [ -z "$SERVICE" ]; then
        print_info "Showing logs for all services (Ctrl+C to exit)..."
        docker compose logs -f
    else
        print_info "Showing logs for $SERVICE (Ctrl+C to exit)..."
        docker compose logs -f "$SERVICE"
    fi
}

# Function to check status
status() {
    print_info "Service Status:"
    docker compose ps
    echo ""
    print_info "Health Checks:"

    # Check employee portal
    if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
        print_success "Employee Portal: Healthy"
    else
        print_warning "Employee Portal: Not responding"
    fi

    # Check admin portal
    if curl -sf http://localhost:3001/api/health > /dev/null 2>&1; then
        print_success "Admin Portal: Healthy"
    else
        print_warning "Admin Portal: Not responding"
    fi

    # Check AI agent
    if curl -sf http://localhost:8000/api/v1/health > /dev/null 2>&1; then
        print_success "AI Agent: Healthy"
    else
        print_warning "AI Agent: Not responding"
    fi

    # Check Redis
    if docker compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        print_success "Redis: Healthy"
    else
        print_warning "Redis: Not responding"
    fi
}

# Function to clean up
clean() {
    print_warning "This will remove all containers, volumes, and images. Continue? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_info "Cleaning up Docker resources..."
        docker compose down -v
        docker system prune -f
        print_success "Cleanup completed!"
    else
        print_info "Cleanup cancelled."
    fi
}

# Function to execute command in container
shell() {
    SERVICE=${1:-employee}
    print_info "Opening shell in $SERVICE container..."
    docker compose exec "$SERVICE" sh
}

# Function to start production
prod() {
    print_info "Starting TUPSAFE production environment..."
    check_docker
    docker compose -f docker-compose.prod.yml up -d
    print_success "Production services started successfully!"
}

# Function to show help
help() {
    cat << EOF
TUPSAFE Docker Development Helper

Usage: ./scripts/docker-dev.sh [command] [service]

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
  ./scripts/docker-dev.sh start              # Start all services
  ./scripts/docker-dev.sh logs employee      # View employee logs
  ./scripts/docker-dev.sh shell ai-agent     # Open shell in AI agent
  ./scripts/docker-dev.sh status             # Check health status
  ./scripts/docker-dev.sh build admin        # Build admin service only
  ./scripts/docker-dev.sh prod               # Start production

For detailed documentation, see:
  - DOCKER_QUICKSTART.md
  - DOCKER.md
EOF
}

# Main command handler
case "${1:-help}" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    rebuild)
        rebuild
        ;;
    build)
        build "${2:-}"
        ;;
    logs)
        logs "${2:-}"
        ;;
    status)
        status
        ;;
    clean)
        clean
        ;;
    shell)
        shell "${2:-employee}"
        ;;
    prod)
        prod
        ;;
    help|--help|-h)
        help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        help
        exit 1
        ;;
esac
