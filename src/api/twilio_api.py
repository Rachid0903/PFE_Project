import os
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Get Twilio credentials from environment variables
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER")

# Check if Twilio is configured
TWILIO_ENABLED = all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER])

if not TWILIO_ENABLED:
    logger.warning(
        "Twilio credentials not found. SMS functionality will be simulated. "
        "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER in .env file to enable actual SMS sending."
    )

def send_sms(to_number, message):
    """
    Send SMS using Twilio API or simulate sending in development mode
    
    Args:
        to_number (str): The recipient's phone number
        message (str): The message content
        
    Returns:
        dict: The response from Twilio API or a simulated response
    """
    if not TWILIO_ENABLED:
        # Simulate sending SMS in development mode
        logger.info(f"[SIMULATED SMS] To: {to_number}, Message: {message}")
        return {
            "sid": "SM00000000000000000000000000000000",
            "status": "simulated",
            "to": to_number,
            "from": "SIMULATOR",
            "body": message
        }
    
    # Real SMS sending with Twilio
    try:
        import requests
        url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
        
        payload = {
            "To": to_number,
            "From": TWILIO_FROM_NUMBER,
            "Body": message
        }
        
        response = requests.post(
            url,
            data=payload,
            auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        )
        
        return response.json()
    except ImportError:
        logger.error("The 'requests' package is required to send actual SMS. Install it with 'pip install requests'")
        raise

def get_twilio_config():
    """
    Get Twilio configuration from environment variables
    
    Returns:
        dict: Twilio configuration
    """
    return {
        "accountSid": TWILIO_ACCOUNT_SID or "SIMULATED_ACCOUNT_SID",
        "authToken": TWILIO_AUTH_TOKEN or "SIMULATED_AUTH_TOKEN",
        "fromNumber": TWILIO_FROM_NUMBER or "SIMULATED_FROM_NUMBER",
        "enabled": TWILIO_ENABLED
    }


