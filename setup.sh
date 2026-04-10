#!/bin/bash
set -e

# Configuration
BASE_URL="https://raw.githubusercontent.com/uraitakahito/hello-javascript/refs/tags/1.2.1"

echo "Starting contact-api setup..."

echo "Downloading Dockerfile.dev..."
if ! curl -fL -O "${BASE_URL}/Dockerfile.dev"; then
  echo "ERROR: Failed to download Dockerfile.dev from:" >&2
  echo "  ${BASE_URL}/Dockerfile.dev" >&2
  echo "Please check if the URL is accessible." >&2
  exit 1
fi

echo "Downloading docker-entrypoint.sh..."
if ! curl -fL -O "${BASE_URL}/docker-entrypoint.sh"; then
  echo "ERROR: Failed to download docker-entrypoint.sh from:" >&2
  echo "  ${BASE_URL}/docker-entrypoint.sh" >&2
  echo "Please check if the URL is accessible." >&2
  exit 1
fi
chmod 755 docker-entrypoint.sh

# Generate .env file (always regenerated to reflect current host state)
GH_TOKEN=""
if command -v gh &> /dev/null; then
  GH_TOKEN=$(gh auth token 2>/dev/null || true)
fi
if [ -z "$GH_TOKEN" ]; then
  echo "WARNING: gh CLI not found or not authenticated. GH_TOKEN will be empty." >&2
  echo "  Install gh: https://cli.github.com/" >&2
  echo "  Then run: gh auth login" >&2
fi

cat > .env << EOF
USER_ID=$(id -u)
GROUP_ID=$(id -g)
TZ=Asia/Tokyo
GH_TOKEN=${GH_TOKEN}
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
CONTACT_API_DB_USER=contact_api
CONTACT_API_DB_PASSWORD=contact_api
CONTACT_API_DB_NAME=contact_api
OPENFGA_DB_USER=openfga
OPENFGA_DB_PASSWORD=openfga
OPENFGA_DB_NAME=openfga
EOF
echo "Created .env file"

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "  docker compose --profile dev up -d"
