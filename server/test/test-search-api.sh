#!/bin/bash
# Search API Test Script

# Default values
API_URL="http://localhost:6001"
SEARCH_QUERY="test"

# Help function
function show_help {
  echo "MERN Social Search API Test Tool"
  echo ""
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  -h, --help         Show this help message"
  echo "  -u, --url URL      API URL (default: http://localhost:6001)"
  echo "  -q, --query QUERY  Search query (default: test)"
  echo "  -t, --token TOKEN  Auth token (will prompt if not provided)"
  echo ""
  echo "Example:"
  echo "  $0 --query \"John\" --url \"http://localhost:6001\""
  echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      show_help
      exit 0
      ;;
    -u|--url)
      API_URL="$2"
      shift 2
      ;;
    -q|--query)
      SEARCH_QUERY="$2"
      shift 2
      ;;
    -t|--token)
      TOKEN="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Prompt for token if not provided
if [[ -z "$TOKEN" ]]; then
  echo -n "Enter your authentication token: "
  read -r TOKEN
fi

# Display test information
echo ""
echo "MERN Social Search API Test"
echo "=========================="
echo "API URL:      $API_URL"
echo "Search Query: $SEARCH_QUERY"
echo "Token:        ${TOKEN:0:10}... (truncated)"
echo ""

# Make the API call
echo "Making API call to ${API_URL}/search?query=${SEARCH_QUERY}"
echo ""

curl -s -X GET "${API_URL}/search?query=${SEARCH_QUERY}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  | jq '.'

echo ""
echo "Test completed."