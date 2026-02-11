import os
import finnhub
from dotenv import load_dotenv

load_dotenv()

client = finnhub.Client(api_key=os.environ["FINNHUB_API_KEY"])

# equities example
print(client.symbol_lookup("USD"))
