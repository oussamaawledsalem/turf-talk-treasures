from supabase import create_client, Client
from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL: str = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY")

# Service role client — full access, used for all backend operations
def get_client() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Singleton for reuse
supabase: Client = get_client()