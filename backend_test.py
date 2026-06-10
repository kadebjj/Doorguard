#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class DoorGuardAPITester:
    def __init__(self, base_url: str = "https://trainer-marketplace-11.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tokens = {}
        self.users = {}
        self.sessions_data = {}
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log(self, message: str, level: str = "INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict] = None, headers: Optional[Dict] = None, 
                 auth_token: Optional[str] = None) -> tuple[bool, Dict]:
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if auth_token:
            test_headers['Authorization'] = f'Bearer {auth_token}'

        self.tests_run += 1
        self.log(f"Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}")
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                if response.text:
                    self.log(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    'name': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:200] if response.text else ''
                })

            try:
                response_data = response.json() if response.text else {}
            except:
                response_data = {}

            return success, response_data

        except Exception as e:
            self.log(f"❌ {name} - Error: {str(e)}")
            self.failed_tests.append({
                'name': name,
                'expected': expected_status,
                'actual': 'ERROR',
                'response': str(e)
            })
            return False, {}

    def test_health_check(self):
        """Test basic health endpoints"""
        self.log("=== HEALTH CHECK TESTS ===")
        
        success, _ = self.run_test("API Root", "GET", "", 200)
        if not success:
            self.log("❌ API Root endpoint failed - API may be down")
            return False
            
        success, _ = self.run_test("Health Check", "GET", "health", 200)
        return success

    def test_user_registration(self):
        """Test user registration for both client and trainer"""
        self.log("=== USER REGISTRATION TESTS ===")
        
        # Test client registration
        client_data = {
            "email": "newclient@test.com",
            "password": "test123",
            "full_name": "New Client",
            "role": "client",
            "city": "New York",
            "zip_code": "10001"
        }
        
        success, response = self.run_test("Client Registration", "POST", "auth/register", 200, client_data)
        if success and 'token' in response:
            self.tokens['client'] = response['token']
            self.users['client'] = response['user']
            self.log(f"✅ Client registered with ID: {response['user']['id']}")
        
        # Test trainer registration (using existing trainer)
        trainer_data = {
            "email": "trainer1@test.com", 
            "password": "test123",
            "full_name": "Test Trainer",
            "role": "trainer",
            "city": "New York",
            "zip_code": "10001"
        }
        
        # This might fail if trainer already exists, which is expected
        success, response = self.run_test("Trainer Registration", "POST", "auth/register", 200, trainer_data)
        if success and 'token' in response:
            self.tokens['trainer'] = response['token']
            self.users['trainer'] = response['user']
        
        return len(self.tokens) > 0

    def test_user_login(self):
        """Test user login"""
        self.log("=== USER LOGIN TESTS ===")
        
        # Test client login
        client_login = {
            "email": "newclient@test.com",
            "password": "test123"
        }
        
        success, response = self.run_test("Client Login", "POST", "auth/login", 200, client_login)
        if success and 'token' in response:
            self.tokens['client'] = response['token']
            self.users['client'] = response['user']
            self.log(f"✅ Client logged in: {response['user']['full_name']}")
        
        # Test trainer login
        trainer_login = {
            "email": "trainer1@test.com",
            "password": "test123"
        }
        
        success, response = self.run_test("Trainer Login", "POST", "auth/login", 200, trainer_login)
        if success and 'token' in response:
            self.tokens['trainer'] = response['token']
            self.users['trainer'] = response['user']
            self.log(f"✅ Trainer logged in: {response['user']['full_name']}")
        
        # Test invalid credentials
        invalid_login = {
            "email": "invalid@test.com",
            "password": "wrongpass"
        }
        
        self.run_test("Invalid Login", "POST", "auth/login", 401, invalid_login)
        
        return 'client' in self.tokens and 'trainer' in self.tokens

    def test_auth_me(self):
        """Test getting current user info"""
        self.log("=== AUTH ME TESTS ===")
        
        if 'client' in self.tokens:
            success, response = self.run_test("Get Client Profile", "GET", "auth/me", 200, 
                                            auth_token=self.tokens['client'])
            if success:
                self.log(f"✅ Client profile: {response.get('full_name', 'Unknown')}")
        
        if 'trainer' in self.tokens:
            success, response = self.run_test("Get Trainer Profile", "GET", "auth/me", 200,
                                            auth_token=self.tokens['trainer'])
            if success:
                self.log(f"✅ Trainer profile: {response.get('full_name', 'Unknown')}")
        
        # Test without token
        self.run_test("Unauthorized Access", "GET", "auth/me", 401)
        
        return True

    def test_trainers_api(self):
        """Test trainer-related endpoints"""
        self.log("=== TRAINERS API TESTS ===")
        
        # Get all trainers
        success, response = self.run_test("Get All Trainers", "GET", "trainers", 200)
        trainers = response if isinstance(response, list) else []
        
        if trainers:
            trainer_id = trainers[0]['id']
            self.log(f"✅ Found {len(trainers)} trainers")
            
            # Get specific trainer
            success, trainer_data = self.run_test("Get Trainer Details", "GET", f"trainers/{trainer_id}", 200)
            if success:
                self.log(f"✅ Trainer details: {trainer_data.get('full_name', 'Unknown')}")
        
        # Test with filters
        self.run_test("Filter by Category", "GET", "trainers?category=personal_training", 200)
        self.run_test("Filter by City", "GET", "trainers?city=New York", 200)
        
        return len(trainers) > 0

    def test_client_category_selection(self):
        """Test client category selection"""
        self.log("=== CLIENT CATEGORY TESTS ===")
        
        if 'client' not in self.tokens:
            self.log("❌ No client token available")
            return False
        
        # Select category
        success, _ = self.run_test("Select Personal Training", "PUT", "profile/category?category=personal_training", 200,
                                 auth_token=self.tokens['client'])
        
        return success

    def test_challenges_api(self):
        """Test challenges endpoints"""
        self.log("=== CHALLENGES API TESTS ===")
        
        if 'client' not in self.tokens:
            self.log("❌ No client token available")
            return False
        
        # Get challenges
        success, response = self.run_test("Get Challenges", "GET", "challenges", 200,
                                        auth_token=self.tokens['client'])
        
        challenges = response.get('challenges', []) if isinstance(response, dict) else []
        
        if challenges:
            challenge_id = challenges[0]['id']
            self.log(f"✅ Found {len(challenges)} challenges")
            
            # Try to complete a challenge
            success, _ = self.run_test("Complete Challenge", "POST", f"challenges/{challenge_id}/complete", 200,
                                     auth_token=self.tokens['client'])
        
        return True

    def test_session_booking(self):
        """Test session booking flow"""
        self.log("=== SESSION BOOKING TESTS ===")
        
        if 'client' not in self.tokens or 'trainer' not in self.tokens:
            self.log("❌ Missing client or trainer tokens")
            return False
        
        trainer_id = self.users['trainer']['id']
        
        # Book a session
        booking_data = {
            "trainer_id": trainer_id,
            "category": "personal_training",
            "scheduled_date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
            "scheduled_time": "10:00",
            "location_address": "123 Test Street, New York, NY 10001",
            "notes": "Test session booking"
        }
        
        success, response = self.run_test("Book Session", "POST", "sessions/book", 200, booking_data,
                                        auth_token=self.tokens['client'])
        
        if success and 'session' in response:
            session_id = response['session']['id']
            self.sessions_data['test_session'] = session_id
            self.log(f"✅ Session booked with ID: {session_id}")
            
            # Test payment creation
            success, payment_response = self.run_test("Create Payment", "POST", f"payments/create-checkout?session_id={session_id}", 200,
                                                    auth_token=self.tokens['client'])
            
            if success:
                self.log(f"✅ Payment checkout created")
        
        return success

    def test_sessions_api(self):
        """Test sessions retrieval"""
        self.log("=== SESSIONS API TESTS ===")
        
        if 'client' in self.tokens:
            success, response = self.run_test("Get Client Sessions", "GET", "sessions/client", 200,
                                            auth_token=self.tokens['client'])
            if success:
                sessions = response if isinstance(response, list) else []
                self.log(f"✅ Client has {len(sessions)} sessions")
        
        if 'trainer' in self.tokens:
            success, response = self.run_test("Get Trainer Sessions", "GET", "sessions/trainer", 200,
                                            auth_token=self.tokens['trainer'])
            if success:
                sessions = response if isinstance(response, list) else []
                self.log(f"✅ Trainer has {len(sessions)} sessions")
        
        return True

    def test_stats_api(self):
        """Test statistics endpoints"""
        self.log("=== STATS API TESTS ===")
        
        if 'client' in self.tokens:
            success, response = self.run_test("Get Client Stats", "GET", "stats/client", 200,
                                            auth_token=self.tokens['client'])
            if success:
                self.log(f"✅ Client stats: {response.get('current_phase', 'Unknown')} phase")
        
        if 'trainer' in self.tokens:
            success, response = self.run_test("Get Trainer Stats", "GET", "stats/trainer", 200,
                                            auth_token=self.tokens['trainer'])
            if success:
                self.log(f"✅ Trainer stats: {response.get('completed_sessions', 0)} sessions")
        
        return True

    def run_all_tests(self):
        """Run all API tests"""
        self.log("🚀 Starting DoorGuard API Tests")
        self.log(f"Testing against: {self.base_url}")
        
        # Test sequence
        tests = [
            ("Health Check", self.test_health_check),
            ("User Registration", self.test_user_registration),
            ("User Login", self.test_user_login),
            ("Auth Me", self.test_auth_me),
            ("Trainers API", self.test_trainers_api),
            ("Client Category", self.test_client_category_selection),
            ("Challenges API", self.test_challenges_api),
            ("Session Booking", self.test_session_booking),
            ("Sessions API", self.test_sessions_api),
            ("Stats API", self.test_stats_api),
        ]
        
        for test_name, test_func in tests:
            try:
                test_func()
            except Exception as e:
                self.log(f"❌ {test_name} failed with exception: {str(e)}")
        
        # Print summary
        self.log("=" * 50)
        self.log(f"📊 TEST SUMMARY")
        self.log(f"Tests Run: {self.tests_run}")
        self.log(f"Tests Passed: {self.tests_passed}")
        self.log(f"Tests Failed: {self.tests_run - self.tests_passed}")
        self.log(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.failed_tests:
            self.log("\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                self.log(f"  - {test['name']}: Expected {test['expected']}, got {test['actual']}")
                if test['response']:
                    self.log(f"    Response: {test['response']}")
        
        return self.tests_passed, self.tests_run, self.failed_tests

def main():
    tester = DoorGuardAPITester()
    passed, total, failed = tester.run_all_tests()
    
    # Return appropriate exit code
    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())