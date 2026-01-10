import requests
import time

BASE_URL = "http://localhost:8002"

def test_ticket_flow():
    print("Starting Ticket Flow Test...")
    
    # 1. Login/Signup Customer
    # Generate unique mobile from time, ensure 10 digits
    timestamp = str(int(time.time()))
    mobile = timestamp if len(timestamp) >= 10 else timestamp.ljust(10, '0')
    mobile = mobile[-10:]
    
    password = "password123"
    cust_token = None
    
    print(f"1. Authenticating Customer ({mobile})...")
    login_resp = requests.post(f"{BASE_URL}/login", json={"mobile_number": mobile, "password": password})
    
    if login_resp.status_code == 200:
        cust_token = login_resp.json()["access_token"]
        print("   - Customer Logged In")
    else:
        # Signup
        print("   - Customer not found, signing up...")
        signup_resp = requests.post(f"{BASE_URL}/signup", json={
            "mobile_number": mobile, 
            "password": password, 
            "role": "customer",
            "first_name": "Test",
            "last_name": "User",
            "email": f"test_{timestamp}@example.com"
        })
        if signup_resp.status_code == 200:
             login_resp = requests.post(f"{BASE_URL}/login", json={"mobile_number": mobile, "password": password})
             cust_token = login_resp.json()["access_token"]
             print("   - Customer Signed Up and Logged In")
        else:
             print(f"   - Signup Failed: {signup_resp.text}")
             return

    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    
    # 2. Create Ticket
    print("2. Creating Ticket...")
    ticket_data = {
        "subject": "Test Ticket API Verification",
        "category": "Technical",
        "priority": "High",
        "initial_message": "This is a test ticket from the verification script."
    }
    resp = requests.post(f"{BASE_URL}/tickets", json=ticket_data, headers=cust_headers)
    if resp.status_code != 200:
        print(f"   - Failed: {resp.text}")
        return
        
    ticket_id = resp.json()["id"]
    display_id = resp.json()["ticket_id"]
    print(f"   - Ticket Created: {display_id} (UUID: {ticket_id})")
    
    # 3. Customer List Tickets
    print("3. Listing Customer Tickets...")
    resp = requests.get(f"{BASE_URL}/tickets", headers=cust_headers)
    assert len(resp.json()) > 0
    print(f"   - Found {len(resp.json())} tickets")
    
    # 4. Admin Login
    print("4. Authenticating Admin...")
    admin_data = {"admin_id": "LAAD202501", "email": "Vinaykumarsm2341@gmail.com", "password": "Vinay@123", "pin": "234124"}
    
    resp = requests.post(f"{BASE_URL}/admin/login", json=admin_data)
    if resp.status_code != 200:
        print(f"   - Admin Login Failed: {resp.text}")
        return
        
    admin_token = resp.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("   - Admin Logged In")
    
    # 5. Admin List Tickets
    print("5. Admin Listing Tickets...")
    resp = requests.get(f"{BASE_URL}/admin/tickets", headers=admin_headers)
    all_tickets = resp.json()
    found = any(t['id'] == ticket_id for t in all_tickets)
    if found:
        print("   - Admin can see the new ticket")
    else:
        print("   - Admin CANNOT see the ticket. Test Failed.")
        return
    
    # 6. Admin Reply
    print("6. Admin Replying...")
    reply_data = {"message": "Admin reply verification."}
    resp = requests.post(f"{BASE_URL}/admin/tickets/{ticket_id}/messages", json=reply_data, headers=admin_headers)
    if resp.status_code == 200:
        print("   - Reply sent successfully")
    else:
        print(f"   - Reply Failed: {resp.text}")
        return
        
    # 7. Admin Update Status
    print("7. Admin Updating Status...")
    resp = requests.put(f"{BASE_URL}/admin/tickets/{ticket_id}/status", json={"status": "IN_PROGRESS"}, headers=admin_headers)
    if resp.status_code == 200:
        print("   - Status updated to IN_PROGRESS")
    else:
        print(f"   - Status Update Failed: {resp.text}")
        return
        
    # 8. Customer Check Messages
    print("8. Customer Checking Messages...")
    resp = requests.get(f"{BASE_URL}/tickets/{ticket_id}", headers=cust_headers)
    details = resp.json()
    messages = details.get('messages', [])
    if len(messages) >= 2:
        print(f"   - Ticket has {len(messages)} messages (Expected >= 2)")
        last_msg = messages[-1]
        print(f"   - Last message sender: {last_msg.get('sender_type')}")
        if last_msg.get('sender_type') == 'ADMIN':
             print("   - SUCCESS: Admin reply received by customer.")
        else:
             print("   - FAILURE: Last message is not from Admin.")
    else:
        print(f"   - Ticket has {len(messages)} messages. Admin reply missing?")
    
    print("\n✅ TICKET SYSTEM VERIFICATION COMPLETE")

if __name__ == "__main__":
    test_ticket_flow()
