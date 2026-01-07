"""
Test script for data-driven pending rules
"""
import sys
sys.path.insert(0, r'c:\Users\AsusUser\Downloads\InfosysSpringboard-Virtual-Internship-6.0-master\InfosysSpringboard-Virtual-Internship-6.0-master\backend')

from loan_advisor import DecisionEngine

def test_data_driven_pending():
    print("=" * 60)
    print("TESTING DATA-DRIVEN PENDING RULES")
    print("=" * 60)
    
    # Test 1: Medical Loan with borderline probability
    decision, reason = DecisionEngine.decide(
        approval_probability=0.55,
        emi_to_income_ratio=0.3,
        credit_rating="Fair",
        loan_duration=60,
        profile={'loan_purpose': 'MEDICAL', 'cibil_score': 650}
    )
    print(f"\n[TEST 1] Medical Loan (55% prob):")
    print(f"   Decision: {decision}")
    print(f"   Reason: {reason}")
    assert decision == "PENDING_REVIEW", f"Expected PENDING_REVIEW, got {decision}"
    assert "Medical" in reason or "hospital" in reason.lower(), "Should mention Medical"
    print("   PASS")
    
    # Test 2: Debt Consolidation with borderline probability
    decision, reason = DecisionEngine.decide(
        approval_probability=0.60,
        emi_to_income_ratio=0.25,
        credit_rating="Good",
        loan_duration=48,
        profile={'loan_purpose': 'DEBTCONSOLIDATION', 'cibil_score': 680}
    )
    print(f"\n[TEST 2] Debt Consolidation Loan (60% prob):")
    print(f"   Decision: {decision}")
    print(f"   Reason: {reason}")
    assert decision == "PENDING_REVIEW", f"Expected PENDING_REVIEW, got {decision}"
    assert "Consolidation" in reason or "payoff" in reason.lower(), "Should mention Debt Consolidation"
    print("   PASS")
    
    # Test 3: High CIBIL score with borderline probability
    decision, reason = DecisionEngine.decide(
        approval_probability=0.55,
        emi_to_income_ratio=0.2,
        credit_rating="Good",
        loan_duration=36,
        profile={'loan_purpose': 'PERSONAL', 'cibil_score': 750}
    )
    print(f"\n[TEST 3] High CIBIL (750) with borderline (55% prob):")
    print(f"   Decision: {decision}")
    print(f"   Reason: {reason}")
    assert decision == "PENDING_REVIEW", f"Expected PENDING_REVIEW, got {decision}"
    assert "Senior" in reason or "CIBIL" in reason, "Should mention Senior Manager or CIBIL"
    print("   PASS")
    
    # Test 4: Should be APPROVED (high probability, no triggers)
    decision, reason = DecisionEngine.decide(
        approval_probability=0.85,
        emi_to_income_ratio=0.2,
        credit_rating="Good",
        loan_duration=36,
        profile={'loan_purpose': 'PERSONAL', 'cibil_score': 750}
    )
    print(f"\n[TEST 4] High probability (85%), no triggers:")
    print(f"   Decision: {decision}")
    print(f"   Reason: {reason}")
    assert decision == "APPROVED", f"Expected APPROVED, got {decision}"
    print("   PASS")
    
    # Test 5: Should be REJECTED (low probability)
    decision, reason = DecisionEngine.decide(
        approval_probability=0.25,
        emi_to_income_ratio=0.3,
        credit_rating="Poor",
        loan_duration=60,
        profile={'loan_purpose': 'VENTURE', 'cibil_score': 550}
    )
    print(f"\n[TEST 5] Low probability (25%):")
    print(f"   Decision: {decision}")
    print(f"   Reason: {reason}")
    assert decision == "REJECTED", f"Expected REJECTED, got {decision}"
    print("   PASS")
    
    print("\n" + "=" * 60)
    print("ALL TESTS PASSED!")
    print("=" * 60)

if __name__ == "__main__":
    test_data_driven_pending()
