"""
Debug script to check available Letta API methods
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment
env_local_path = Path(__file__).parent.parent / ".env.local"
if env_local_path.exists():
    load_dotenv(env_local_path)

from letta_client import Letta

# Get API key
LETTA_API_KEY = os.environ.get("LETTA_API_KEY")
agent_id = os.environ.get("LETTA_AGENT_ID")

if not LETTA_API_KEY:
    print("❌ LETTA_API_KEY not found")
    exit(1)

if not agent_id:
    print("❌ LETTA_AGENT_ID not found")
    exit(1)

print(f"✓ API Key found: {LETTA_API_KEY[:10]}...")
print(f"✓ Agent ID: {agent_id}")

# Initialize client
client = Letta(token=LETTA_API_KEY)

print("\n📋 Available attributes on Letta client:")
print([attr for attr in dir(client) if not attr.startswith('_')])

print("\n🔍 Checking for common methods:")
print(f"  - has 'messages': {hasattr(client, 'messages')}")
print(f"  - has 'agents': {hasattr(client, 'agents')}")
print(f"  - has 'send_message': {hasattr(client, 'send_message')}")
print(f"  - has 'user_message': {hasattr(client, 'user_message')}")

if hasattr(client, 'agents'):
    print("\n📋 Available methods on client.agents:")
    print([attr for attr in dir(client.agents) if not attr.startswith('_')])

if hasattr(client, 'messages'):
    print("\n📋 Available methods on client.messages:")
    print([attr for attr in dir(client.messages) if not attr.startswith('_')])

print("\n✅ Debug complete!")
