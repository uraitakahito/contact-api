#!/bin/bash
set -e

# Configuration
BASE_URL="https://raw.githubusercontent.com/uraitakahito/hello-javascript/refs/tags/1.2.3"

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

# Generate .env.dev / .env.prod files (always regenerated to reflect current host state)
GH_TOKEN=""
if command -v gh &> /dev/null; then
  GH_TOKEN=$(gh auth token 2>/dev/null || true)
fi
if [ -z "$GH_TOKEN" ]; then
  echo "WARNING: gh CLI not found or not authenticated. GH_TOKEN will be empty." >&2
  echo "  Install gh: https://cli.github.com/" >&2
  echo "  Then run: gh auth login" >&2
fi

cat > .env.dev << EOF
USER_ID=$(id -u)
GROUP_ID=$(id -g)
TZ=Asia/Tokyo
GH_TOKEN=${GH_TOKEN}
POSTGRES_USER=postgres_dev
POSTGRES_PASSWORD=postgres_dev
CONTACT_API_DB_USER=contact_api_dev
CONTACT_API_DB_PASSWORD=contact_api_dev
CONTACT_API_DB_NAME=contact_api_dev
OPENFGA_DB_USER=openfga_dev
OPENFGA_DB_PASSWORD=openfga_dev
OPENFGA_DB_NAME=openfga_dev
EOF
echo "Created .env.dev file"

cat > .env.prod << EOF
TZ=Asia/Tokyo
POSTGRES_USER=postgres_prod
POSTGRES_PASSWORD=postgres_prod
CONTACT_API_DB_USER=contact_api_prod
CONTACT_API_DB_PASSWORD=contact_api_prod
CONTACT_API_DB_NAME=contact_api_prod
OPENFGA_DB_USER=openfga_prod
OPENFGA_DB_PASSWORD=openfga_prod
OPENFGA_DB_NAME=openfga_prod
EOF
echo "Created .env.prod file"

echo ""
echo "Setup complete!"
echo ""
echo "Next steps (dev):"
echo "  docker compose --env-file .env.dev --profile dev up -d"
echo ""
echo "Next steps (prod):"
echo "  docker compose --env-file .env.prod --profile prod up -d"
