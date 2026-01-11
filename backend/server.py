from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'doorguard-secret-key-2025')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Stripe Config
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

app = FastAPI(title="DoorGuard API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== MODELS ==============

# Belt phases for progression
BELT_PHASES = ["white", "blue", "purple", "brown", "black"]
TRAINING_CATEGORIES = ["personal_training", "self_defense", "jiujitsu"]
TRAINER_VERIFICATION_LEVELS = ["verified", "elite", "specialist"]

# Session pricing (in USD)
SESSION_PRICES = {
    "personal_training": 75.00,
    "self_defense": 85.00,
    "jiujitsu": 95.00
}
PLATFORM_FEE_PERCENT = 20  # 20% platform fee

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str  # "client" or "trainer"
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    zip_code: Optional[str] = None

class UserCreate(UserBase):
    password: str

class TrainerProfile(BaseModel):
    bio: Optional[str] = None
    specializations: List[str] = []
    categories: List[str] = []
    verification_level: str = "verified"
    certifications: List[str] = []
    experience_years: int = 0
    hourly_rate: Optional[float] = None
    available_areas: List[str] = []
    profile_image: Optional[str] = None

class ClientProfile(BaseModel):
    fitness_goals: Optional[str] = None
    current_category: Optional[str] = None
    current_phase: str = "white"
    total_points: int = 0
    completed_sessions: int = 0
    profile_image: Optional[str] = None

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    trainer_profile: Optional[TrainerProfile] = None
    client_profile: Optional[ClientProfile] = None
    is_active: bool = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    token: str
    user: dict

class SessionBooking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    trainer_id: str
    category: str
    scheduled_date: str
    scheduled_time: str
    duration_minutes: int = 60
    status: str = "pending"  # pending, confirmed, completed, cancelled
    location_address: str
    notes: Optional[str] = None
    price: float
    platform_fee: float
    trainer_earnings: float
    payment_status: str = "unpaid"
    payment_session_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SessionBookingCreate(BaseModel):
    trainer_id: str
    category: str
    scheduled_date: str
    scheduled_time: str
    duration_minutes: int = 60
    location_address: str
    notes: Optional[str] = None

class Challenge(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    category: str
    phase: str
    name: str
    description: str
    points: int
    is_completed: bool = False
    completed_at: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    client_id: str
    trainer_id: str
    rating: int  # 1-5
    comment: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ReviewCreate(BaseModel):
    session_id: str
    rating: int
    comment: Optional[str] = None

class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    user_id: str
    amount: float
    currency: str = "usd"
    stripe_session_id: str
    status: str = "pending"
    payment_status: str = "pending"
    metadata: Dict = {}
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Challenge definitions per category and phase
CHALLENGES = {
    "personal_training": {
        "white": [
            {"name": "First Steps", "description": "Complete your first 3 sessions", "points": 50},
            {"name": "Plank Master", "description": "Hold a plank for 60 seconds", "points": 30},
            {"name": "Consistency", "description": "Train 3 times in one week", "points": 40},
        ],
        "blue": [
            {"name": "Strength Builder", "description": "Complete 20 push-ups in one set", "points": 60},
            {"name": "Endurance", "description": "Complete 10 sessions this phase", "points": 80},
        ],
        "purple": [
            {"name": "Athletic Control", "description": "Sprint 100m under 15 seconds", "points": 100},
            {"name": "Power Move", "description": "Deadlift your bodyweight", "points": 120},
        ],
        "brown": [
            {"name": "Elite Performance", "description": "Complete advanced circuit in under 10 mins", "points": 150},
        ],
        "black": [
            {"name": "Mastery", "description": "Maintain elite benchmarks for 3 months", "points": 200},
        ]
    },
    "self_defense": {
        "white": [
            {"name": "Awareness", "description": "Complete awareness drill scenarios", "points": 50},
            {"name": "Basic Strikes", "description": "Master jab, cross, and kick", "points": 40},
            {"name": "Escape Artist", "description": "Escape 3 common grabs", "points": 45},
        ],
        "blue": [
            {"name": "Clinch Control", "description": "Control clinch position for 30 seconds", "points": 70},
            {"name": "Ground Safety", "description": "Stand up safely from mount", "points": 65},
        ],
        "purple": [
            {"name": "Dominant", "description": "Control opponent for 60 seconds", "points": 100},
            {"name": "Multi-threat", "description": "Handle multiple attack scenarios", "points": 110},
        ],
        "brown": [
            {"name": "Scenario Ready", "description": "Pass confined space defense test", "points": 140},
        ],
        "black": [
            {"name": "Protector", "description": "Teach a self-defense concept successfully", "points": 200},
        ]
    },
    "jiujitsu": {
        "white": [
            {"name": "Survival", "description": "Escape side control 3 times", "points": 50},
            {"name": "Base Building", "description": "Maintain base under pressure", "points": 45},
            {"name": "Position", "description": "Hold guard for 2 minutes", "points": 40},
        ],
        "blue": [
            {"name": "Submit", "description": "Apply your first submission", "points": 80},
            {"name": "Pass", "description": "Pass guard successfully 5 times", "points": 70},
        ],
        "purple": [
            {"name": "Flow", "description": "Chain 3 submission attempts in one round", "points": 110},
            {"name": "Adapt", "description": "Win from disadvantaged position", "points": 100},
        ],
        "brown": [
            {"name": "Precision", "description": "Execute pressure pass in competition sim", "points": 150},
        ],
        "black": [
            {"name": "Expression", "description": "Develop and demonstrate personal game", "points": 200},
        ]
    }
}

# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user_data.model_dump()
    password = user_dict.pop("password")
    user_dict["password"] = hash_password(password)
    user_dict["id"] = str(uuid.uuid4())
    user_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    user_dict["is_active"] = True
    
    if user_data.role == "client":
        user_dict["client_profile"] = ClientProfile().model_dump()
    elif user_data.role == "trainer":
        user_dict["trainer_profile"] = TrainerProfile().model_dump()
    
    await db.users.insert_one(user_dict)
    
    token = create_token(user_dict["id"], user_dict["email"], user_dict["role"])
    user_response = {k: v for k, v in user_dict.items() if k != "password"}
    
    return {"token": token, "user": user_response}

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["email"], user["role"])
    user_response = {k: v for k, v in user.items() if k not in ["password", "_id"]}
    
    return {"token": token, "user": user_response}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

# ============== USER/PROFILE ROUTES ==============

@api_router.put("/profile/client")
async def update_client_profile(profile: ClientProfile, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "client":
        raise HTTPException(status_code=403, detail="Only clients can update client profile")
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"client_profile": profile.model_dump()}}
    )
    return {"message": "Profile updated"}

@api_router.put("/profile/trainer")
async def update_trainer_profile(profile: TrainerProfile, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "trainer":
        raise HTTPException(status_code=403, detail="Only trainers can update trainer profile")
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"trainer_profile": profile.model_dump()}}
    )
    return {"message": "Profile updated"}

@api_router.get("/trainers")
async def get_trainers(category: Optional[str] = None, city: Optional[str] = None):
    query = {"role": "trainer", "is_active": True}
    if category:
        query["trainer_profile.categories"] = category
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    
    trainers = await db.users.find(query, {"_id": 0, "password": 0}).to_list(100)
    
    # Add average rating for each trainer
    for trainer in trainers:
        reviews = await db.reviews.find({"trainer_id": trainer["id"]}).to_list(1000)
        if reviews:
            trainer["avg_rating"] = sum(r["rating"] for r in reviews) / len(reviews)
            trainer["review_count"] = len(reviews)
        else:
            trainer["avg_rating"] = 0
            trainer["review_count"] = 0
    
    return trainers

@api_router.get("/trainers/{trainer_id}")
async def get_trainer(trainer_id: str):
    trainer = await db.users.find_one({"id": trainer_id, "role": "trainer"}, {"_id": 0, "password": 0})
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    
    reviews = await db.reviews.find({"trainer_id": trainer_id}, {"_id": 0}).to_list(100)
    trainer["reviews"] = reviews
    if reviews:
        trainer["avg_rating"] = sum(r["rating"] for r in reviews) / len(reviews)
        trainer["review_count"] = len(reviews)
    else:
        trainer["avg_rating"] = 0
        trainer["review_count"] = 0
    
    return trainer

# ============== SESSION/BOOKING ROUTES ==============

@api_router.post("/sessions/book")
async def book_session(booking: SessionBookingCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "client":
        raise HTTPException(status_code=403, detail="Only clients can book sessions")
    
    trainer = await db.users.find_one({"id": booking.trainer_id, "role": "trainer"})
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    
    price = SESSION_PRICES.get(booking.category, 80.00)
    platform_fee = price * (PLATFORM_FEE_PERCENT / 100)
    trainer_earnings = price - platform_fee
    
    session_dict = {
        "id": str(uuid.uuid4()),
        "client_id": current_user["id"],
        "trainer_id": booking.trainer_id,
        "category": booking.category,
        "scheduled_date": booking.scheduled_date,
        "scheduled_time": booking.scheduled_time,
        "duration_minutes": booking.duration_minutes,
        "status": "pending",
        "location_address": booking.location_address,
        "notes": booking.notes,
        "price": price,
        "platform_fee": platform_fee,
        "trainer_earnings": trainer_earnings,
        "payment_status": "unpaid",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.sessions.insert_one(session_dict)
    return {"session": session_dict, "message": "Session booked successfully"}

@api_router.get("/sessions/client")
async def get_client_sessions(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "client":
        raise HTTPException(status_code=403, detail="Only clients can view their sessions")
    
    sessions = await db.sessions.find({"client_id": current_user["id"]}, {"_id": 0}).to_list(100)
    
    # Add trainer info to each session
    for session in sessions:
        trainer = await db.users.find_one({"id": session["trainer_id"]}, {"_id": 0, "password": 0})
        session["trainer"] = trainer
    
    return sessions

@api_router.get("/sessions/trainer")
async def get_trainer_sessions(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "trainer":
        raise HTTPException(status_code=403, detail="Only trainers can view their sessions")
    
    sessions = await db.sessions.find({"trainer_id": current_user["id"]}, {"_id": 0}).to_list(100)
    
    # Add client info to each session
    for session in sessions:
        client = await db.users.find_one({"id": session["client_id"]}, {"_id": 0, "password": 0})
        session["client"] = client
    
    return sessions

@api_router.put("/sessions/{session_id}/status")
async def update_session_status(session_id: str, status: str, current_user: dict = Depends(get_current_user)):
    session = await db.sessions.find_one({"id": session_id})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if current_user["role"] == "trainer" and session["trainer_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if status not in ["confirmed", "completed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    await db.sessions.update_one({"id": session_id}, {"$set": {"status": status}})
    
    # If completed, increment client's session count
    if status == "completed":
        await db.users.update_one(
            {"id": session["client_id"]},
            {"$inc": {"client_profile.completed_sessions": 1}}
        )
    
    return {"message": f"Session {status}"}

# ============== CHALLENGES/PROGRESS ROUTES ==============

@api_router.get("/challenges")
async def get_challenges(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "client":
        raise HTTPException(status_code=403, detail="Only clients can view challenges")
    
    profile = current_user.get("client_profile", {})
    category = profile.get("current_category")
    phase = profile.get("current_phase", "white")
    
    if not category:
        return {"challenges": [], "message": "Select a training category first"}
    
    # Get or create challenges for user
    user_challenges = await db.challenges.find(
        {"user_id": current_user["id"], "category": category, "phase": phase},
        {"_id": 0}
    ).to_list(100)
    
    if not user_challenges:
        # Create challenges from template
        challenge_templates = CHALLENGES.get(category, {}).get(phase, [])
        for template in challenge_templates:
            challenge = {
                "id": str(uuid.uuid4()),
                "user_id": current_user["id"],
                "category": category,
                "phase": phase,
                "name": template["name"],
                "description": template["description"],
                "points": template["points"],
                "is_completed": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.challenges.insert_one(challenge)
            user_challenges.append(challenge)
    
    return {"challenges": user_challenges, "phase": phase, "category": category}

@api_router.post("/challenges/{challenge_id}/complete")
async def complete_challenge(challenge_id: str, current_user: dict = Depends(get_current_user)):
    challenge = await db.challenges.find_one({"id": challenge_id, "user_id": current_user["id"]})
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    if challenge["is_completed"]:
        raise HTTPException(status_code=400, detail="Challenge already completed")
    
    await db.challenges.update_one(
        {"id": challenge_id},
        {"$set": {"is_completed": True, "completed_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Add points to user
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$inc": {"client_profile.total_points": challenge["points"]}}
    )
    
    return {"message": "Challenge completed!", "points_earned": challenge["points"]}

@api_router.post("/progress/phase-up")
async def phase_up(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "client":
        raise HTTPException(status_code=403, detail="Only clients can phase up")
    
    profile = current_user.get("client_profile", {})
    current_phase = profile.get("current_phase", "white")
    completed_sessions = profile.get("completed_sessions", 0)
    
    # Check minimum sessions requirement (12 per phase)
    if completed_sessions < 12:
        raise HTTPException(status_code=400, detail=f"Need at least 12 sessions to advance (current: {completed_sessions})")
    
    # Check if all challenges completed
    category = profile.get("current_category")
    challenges = await db.challenges.find({
        "user_id": current_user["id"],
        "category": category,
        "phase": current_phase
    }).to_list(100)
    
    incomplete = [c for c in challenges if not c.get("is_completed")]
    if incomplete:
        raise HTTPException(status_code=400, detail=f"Complete all challenges first ({len(incomplete)} remaining)")
    
    # Advance to next phase
    current_index = BELT_PHASES.index(current_phase)
    if current_index >= len(BELT_PHASES) - 1:
        raise HTTPException(status_code=400, detail="Already at highest phase")
    
    new_phase = BELT_PHASES[current_index + 1]
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"client_profile.current_phase": new_phase, "client_profile.completed_sessions": 0}}
    )
    
    return {"message": f"Congratulations! You've advanced to {new_phase.upper()} belt!", "new_phase": new_phase}

@api_router.put("/profile/category")
async def select_category(category: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "client":
        raise HTTPException(status_code=403, detail="Only clients can select category")
    
    if category not in TRAINING_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"client_profile.current_category": category}}
    )
    
    return {"message": f"Category set to {category}"}

# ============== REVIEW ROUTES ==============

@api_router.post("/reviews")
async def create_review(review: ReviewCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "client":
        raise HTTPException(status_code=403, detail="Only clients can leave reviews")
    
    session = await db.sessions.find_one({"id": review.session_id, "client_id": current_user["id"]})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session["status"] != "completed":
        raise HTTPException(status_code=400, detail="Can only review completed sessions")
    
    existing = await db.reviews.find_one({"session_id": review.session_id})
    if existing:
        raise HTTPException(status_code=400, detail="Already reviewed")
    
    review_dict = {
        "id": str(uuid.uuid4()),
        "session_id": review.session_id,
        "client_id": current_user["id"],
        "trainer_id": session["trainer_id"],
        "rating": min(max(review.rating, 1), 5),
        "comment": review.comment,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.reviews.insert_one(review_dict)
    return review_dict

@api_router.get("/reviews/trainer/{trainer_id}")
async def get_trainer_reviews(trainer_id: str):
    reviews = await db.reviews.find({"trainer_id": trainer_id}, {"_id": 0}).to_list(100)
    
    # Add client names
    for review in reviews:
        client = await db.users.find_one({"id": review["client_id"]}, {"_id": 0, "full_name": 1})
        review["client_name"] = client["full_name"] if client else "Anonymous"
    
    return reviews

# ============== PAYMENT ROUTES ==============

@api_router.post("/payments/create-checkout")
async def create_checkout(session_id: str, request: Request, current_user: dict = Depends(get_current_user)):
    session = await db.sessions.find_one({"id": session_id, "client_id": current_user["id"]})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session["payment_status"] == "paid":
        raise HTTPException(status_code=400, detail="Session already paid")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    # Get origin from request headers
    origin = request.headers.get("origin", host_url)
    success_url = f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/payment/cancel"
    
    checkout_request = CheckoutSessionRequest(
        amount=float(session["price"]),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "booking_session_id": session_id,
            "client_id": current_user["id"],
            "trainer_id": session["trainer_id"]
        }
    )
    
    checkout_response: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction = {
        "id": str(uuid.uuid4()),
        "session_id": session_id,
        "user_id": current_user["id"],
        "amount": float(session["price"]),
        "currency": "usd",
        "stripe_session_id": checkout_response.session_id,
        "status": "pending",
        "payment_status": "pending",
        "metadata": {"booking_session_id": session_id},
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(transaction)
    
    # Update session with stripe session id
    await db.sessions.update_one(
        {"id": session_id},
        {"$set": {"payment_session_id": checkout_response.session_id}}
    )
    
    return {"checkout_url": checkout_response.url, "stripe_session_id": checkout_response.session_id}

@api_router.get("/payments/status/{stripe_session_id}")
async def get_payment_status(stripe_session_id: str, request: Request):
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(stripe_session_id)
    
    # Update transaction and session if paid
    if status.payment_status == "paid":
        transaction = await db.payment_transactions.find_one({"stripe_session_id": stripe_session_id})
        if transaction and transaction["payment_status"] != "paid":
            await db.payment_transactions.update_one(
                {"stripe_session_id": stripe_session_id},
                {"$set": {"status": "complete", "payment_status": "paid"}}
            )
            await db.sessions.update_one(
                {"payment_session_id": stripe_session_id},
                {"$set": {"payment_status": "paid", "status": "confirmed"}}
            )
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount": status.amount_total,
        "currency": status.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"stripe_session_id": webhook_response.session_id},
                {"$set": {"status": "complete", "payment_status": "paid"}}
            )
            await db.sessions.update_one(
                {"payment_session_id": webhook_response.session_id},
                {"$set": {"payment_status": "paid", "status": "confirmed"}}
            )
        
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"received": True}

# ============== STATS ROUTES ==============

@api_router.get("/stats/trainer")
async def get_trainer_stats(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "trainer":
        raise HTTPException(status_code=403, detail="Only trainers can view trainer stats")
    
    sessions = await db.sessions.find({"trainer_id": current_user["id"]}).to_list(1000)
    
    total_earnings = sum(s.get("trainer_earnings", 0) for s in sessions if s.get("payment_status") == "paid")
    completed_sessions = len([s for s in sessions if s.get("status") == "completed"])
    pending_sessions = len([s for s in sessions if s.get("status") == "pending"])
    
    reviews = await db.reviews.find({"trainer_id": current_user["id"]}).to_list(1000)
    avg_rating = sum(r["rating"] for r in reviews) / len(reviews) if reviews else 0
    
    return {
        "total_earnings": total_earnings,
        "completed_sessions": completed_sessions,
        "pending_sessions": pending_sessions,
        "avg_rating": round(avg_rating, 1),
        "total_reviews": len(reviews)
    }

@api_router.get("/stats/client")
async def get_client_stats(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "client":
        raise HTTPException(status_code=403, detail="Only clients can view client stats")
    
    profile = current_user.get("client_profile", {})
    sessions = await db.sessions.find({"client_id": current_user["id"]}).to_list(1000)
    challenges = await db.challenges.find({"user_id": current_user["id"]}).to_list(1000)
    
    completed_challenges = len([c for c in challenges if c.get("is_completed")])
    
    return {
        "current_phase": profile.get("current_phase", "white"),
        "current_category": profile.get("current_category"),
        "total_points": profile.get("total_points", 0),
        "completed_sessions": profile.get("completed_sessions", 0),
        "total_bookings": len(sessions),
        "completed_challenges": completed_challenges,
        "total_challenges": len(challenges)
    }

# ============== ROOT ==============

@api_router.get("/")
async def root():
    return {"message": "DoorGuard API", "version": "1.0.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
