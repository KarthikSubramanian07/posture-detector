"""
Setup Letta AI Agent for Posture Feedback

This script creates a new agent if one doesn't exist, or updates the existing
agent with new configuration from letta_agent_config.json.

Usage:
    1. Edit config/letta_agent_config.json
    2. Run: python setup_letta_agent.py
    3. Agent will be created or updated automatically
"""

import os
import json
from pathlib import Path
from dotenv import load_dotenv
import ssl

# Disable SSL verification globally (for corporate proxy/firewall)
ssl._create_default_https_context = ssl._create_unverified_context

# Patch httpx to disable SSL verification (Letta uses httpx)
try:
    import httpx
    # Create custom client that ignores SSL
    _original_client_init = httpx.Client.__init__
    def _patched_client_init(self, *args, **kwargs):
        kwargs['verify'] = False
        return _original_client_init(self, *args, **kwargs)
    httpx.Client.__init__ = _patched_client_init
    print("✓ Patched httpx to disable SSL verification")
except ImportError:
    pass

# Also disable for requests library
try:
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
except ImportError:
    pass

# Load environment variables from .env.local or .env file if it exists
# Check .env.local first (in parent directory), then .env in current directory
env_local_path = Path(__file__).parent.parent / ".env.local"
env_path = Path(__file__).parent / ".env"

if env_local_path.exists():
    load_dotenv(env_local_path)
    print(f"✓ Loaded environment from {env_local_path.name}")
elif env_path.exists():
    load_dotenv(env_path)
    print(f"✓ Loaded environment from {env_path.name}")
else:
    load_dotenv()  # Try default locations

try:
    from letta_client import Letta
    print("✓ Letta client library imported successfully")
except ImportError:
    print("❌ Error: Letta client library not installed")
    print("Run: pip install letta-client")
    exit(1)


# Load configuration from JSON file
CONFIG_PATH = Path(__file__).parent.parent / "config" / "letta_agent_config.json"

try:
    with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
        AGENT_CONFIG = json.load(f)
    print(f"✓ Loaded agent configuration from {CONFIG_PATH.name}")
except FileNotFoundError:
    print(f"❌ Error: Config file not found at {CONFIG_PATH}")
    print("Please ensure letta_agent_config.json exists in the config folder")
    exit(1)
except json.JSONDecodeError as e:
    print(f"❌ Error: Invalid JSON in config file: {e}")
    exit(1)


# Extract configuration values
SYSTEM_PROMPT = AGENT_CONFIG.get("system_prompt", "")
AGENT_NAME = AGENT_CONFIG.get("agent_name", "Posture Coach")
MODEL_NAME = AGENT_CONFIG.get("model", "gpt-3.5-turbo")
INITIAL_MESSAGE = AGENT_CONFIG.get("initial_message", "Hi! I'm your posture coach.")

if not SYSTEM_PROMPT:
    print("❌ Error: No system_prompt found in config file")
    exit(1)


def create_new_agent(client):
    """Create a new Letta agent with the configuration."""
    print("\n🆕 Creating new agent...")
    print("=" * 60)

    try:
        # Create the agent using Letta 0.13.0 API
        agent = client.agents.create(
            name=AGENT_NAME,
            model=f"openai/{MODEL_NAME}",
            embedding="openai/text-embedding-ada-002",
            memory_blocks=[
                {
                    "label": "persona",
                    "value": SYSTEM_PROMPT
                },
                {
                    "label": "system",
                    "value": INITIAL_MESSAGE
                }
            ]
        )

        print("✓ Agent created successfully!")
        print("=" * 60)
        print("\n📋 AGENT DETAILS:")
        print(f"   Name: {agent.name if hasattr(agent, 'name') else AGENT_NAME}")
        print(f"   Agent ID: {agent.id}")
        print(f"   Model: {MODEL_NAME}")
        print(f"   Config source: {CONFIG_PATH.name}")
        print("\n" + "=" * 60)

        return agent

    except Exception as e:
        print(f"\n❌ Error creating agent: {e}")
        print("\nTroubleshooting:")
        print("  - Verify your LETTA_API_KEY is correct")
        print("  - Check your internet connection")
        print("  - Ensure you have API credits/quota available")
        return None


def update_existing_agent(client, agent_id):
    """Update an existing agent with new configuration."""
    print(f"\n🔄 Updating existing agent (ID: {agent_id})...")
    print("=" * 60)

    try:
        # Get existing agent using Letta 0.13.0 API
        agent = client.agents.get(agent_id)
        print(f"✓ Found agent: {agent.name if hasattr(agent, 'name') else agent_id}")

        # Update the agent's memory blocks with new system prompt
        # In Letta 0.13.0, we update memory blocks to change system behavior
        updated_agent = client.agents.update_memory(
            agent_id=agent_id,
            memory_blocks=[
                {
                    "label": "persona",
                    "value": SYSTEM_PROMPT
                },
                {
                    "label": "system",
                    "value": INITIAL_MESSAGE
                }
            ]
        )

        print("✓ Agent updated successfully!")
        print("=" * 60)
        print("\n📋 UPDATED AGENT:")
        print(f"   Name: {agent.name if hasattr(agent, 'name') else agent_id}")
        print(f"   Agent ID: {agent_id}")
        print(f"   Model: {MODEL_NAME}")
        print(f"   System prompt length: {len(SYSTEM_PROMPT)} characters")
        print("\n" + "=" * 60)

        return agent

    except Exception as e:
        print(f"\n❌ Error updating agent: {e}")
        print("\nThis agent ID may not exist. Creating a new one instead...")
        return None


def save_agent_id_to_env(agent_id, env_file):
    """Save agent ID to environment file."""
    try:
        # Read existing content
        env_content = ""
        if os.path.exists(env_file):
            with open(env_file, 'r') as f:
                env_content = f.read()

        # Add or update LETTA_AGENT_ID
        if "LETTA_AGENT_ID" in env_content:
            # Update existing
            lines = env_content.split('\n')
            new_lines = []
            for line in lines:
                if line.startswith("LETTA_AGENT_ID"):
                    new_lines.append(f"LETTA_AGENT_ID={agent_id}")
                else:
                    new_lines.append(line)
            env_content = '\n'.join(new_lines)
        else:
            # Add new
            if env_content and not env_content.endswith('\n'):
                env_content += '\n'
            env_content += f"LETTA_AGENT_ID={agent_id}\n"

        # Write back to file
        with open(env_file, 'w') as f:
            f.write(env_content)

        print(f"✓ Agent ID saved to {env_file}")
        return True

    except Exception as e:
        print(f"❌ Error saving to {env_file}: {e}")
        return False


def setup_agent():
    """Main function to create or update the agent."""

    # Get API key from environment
    api_key = os.environ.get("LETTA_API_KEY")

    if not api_key:
        print("\n❌ Error: LETTA_API_KEY not found in environment variables")
        print("\nPlease set your Letta API key:")
        print("  Windows: $env:LETTA_API_KEY='your-api-key'")
        print("  Linux/Mac: export LETTA_API_KEY='your-api-key'")
        print("  Or add to .env.local: LETTA_API_KEY=your-api-key")
        print("\nGet your API key from: https://www.letta.com")
        return False

    print("\n🚀 Setting up Letta Posture Coach Agent...")
    print("=" * 60)

    try:
        # Initialize Letta client (Letta 0.13.0 API)
        # Try local server first, then cloud API
        local_server = os.environ.get("LETTA_LOCAL_SERVER", "http://localhost:8283")

        try:
            # Try connecting to local Letta server (no API key needed)
            client = Letta(base_url=local_server)
            print(f"✓ Connected to local Letta server at {local_server}")
        except Exception as local_error:
            print(f"⚠️ Local server not available: {local_error}")
            print("Trying cloud API...")
            # Fall back to cloud API
            client = Letta(token=api_key)
            print("✓ Connected to Letta cloud API")

        # Check if agent ID exists in environment
        existing_agent_id = os.environ.get("LETTA_AGENT_ID")

        agent = None

        if existing_agent_id:
            print(f"\n📌 Found existing agent ID: {existing_agent_id}")
            print("Attempting to update...")

            # Try to update existing agent
            agent = update_existing_agent(client, existing_agent_id)

            # If update failed, create new one
            if not agent:
                agent = create_new_agent(client)
        else:
            print("\n📌 No existing agent ID found")
            print("Creating new agent...")

            # Create new agent
            agent = create_new_agent(client)

        if not agent:
            print("\n❌ Failed to create or update agent")
            return False

        # Save agent ID to environment file
        if not existing_agent_id or agent.id != existing_agent_id:
            print("\n💾 Saving agent ID to environment file...")

            # Determine which env file to use
            if env_local_path.exists():
                env_file = env_local_path
            elif env_path.exists():
                env_file = env_path
            else:
                env_file = env_local_path  # Default to .env.local

            save_agent_id_to_env(agent.id, env_file)

        print("\n" + "=" * 60)
        print("✅ SETUP COMPLETE!")
        print("=" * 60)
        print("\n📝 Next Steps:")
        print("   1. Agent is ready to use")
        print("   2. Start AI feedback service: python ai_feedback.py")
        print("   3. Test the agent with sample data")
        print(f"   4. To update instructions: edit {CONFIG_PATH.name} and re-run this script")
        print("\n" + "=" * 60)

        return True

    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return False


def show_current_config():
    """Display current configuration from file."""
    print("\n📄 CURRENT CONFIGURATION:")
    print("=" * 60)
    print(f"Agent Name: {AGENT_NAME}")
    print(f"Model: {MODEL_NAME}")
    print(f"System Prompt Preview:\n{SYSTEM_PROMPT[:200]}...")
    print("=" * 60)


if __name__ == "__main__":
    print("""
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║       Letta Posture Coach Agent Setup & Update          ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
""")

    # Show current config
    show_current_config()

    # Ask for confirmation
    print("\nThis will create a new agent or update the existing one with the")
    print("configuration from letta_agent_config.json")

    confirm = input("\n✓ Proceed? (y/n): ").strip().lower()

    if confirm == 'y':
        success = setup_agent()
        if not success:
            exit(1)
    else:
        print("\n❌ Setup cancelled")
        exit(0)
