"""
Apply the fix to loan_predictor.py - adds PENDING_REVIEW rules
"""

# Read the file
with open('loan_predictor.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the decision logic block
# We'll search for the specific marker text and replace

old_marker = "# Determine status based on probability (adjusted thresholds)"
new_decision_logic = """# Determine status based on probability AND risk factors
            # Since model outputs extreme probabilities, we use rule-based PENDING_REVIEW triggers
            has_defaults = str(loan_data.get('previous_loan_defaults', 'No')).lower() in ['yes', 'true', '1']
            
            # OVERRIDE 1: Very favorable LTI (<0.7x) with good credit, no defaults
            if loan_to_income_ratio < 0.7 and credit_score >= 650 and emi_to_income_ratio < 0.50 and not has_defaults:
                status = 'APPROVED'
                approval_prob = max(approval_prob, 75)
            
            # OVERRIDE 2: Reasonable LTI (<1.0x) with excellent credit, no defaults
            elif loan_to_income_ratio < 1.0 and credit_score >= 700 and emi_to_income_ratio < 0.45 and not has_defaults:
                status = 'APPROVED'
                approval_prob = max(approval_prob, 72)
            
            # PENDING_REVIEW Case 1: Has defaults but otherwise good profile
            elif has_defaults and credit_score >= 600 and loan_to_income_ratio < 1.0:
                status = 'PENDING_REVIEW'
                approval_prob = 55
            
            # PENDING_REVIEW Case 2: Low credit (500-600) but low LTI (<0.5)
            elif credit_score < 600 and credit_score >= 500 and loan_to_income_ratio < 0.5 and not has_defaults:
                status = 'PENDING_REVIEW'
                approval_prob = 50
            
            # PENDING_REVIEW Case 3: High LTI (1.0-1.5) with fair credit
            elif loan_to_income_ratio >= 1.0 and loan_to_income_ratio < 1.5 and credit_score >= 600 and not has_defaults:
                status = 'PENDING_REVIEW'
                approval_prob = 48
            
            # PENDING_REVIEW Case 4: Young applicant with limited experience
            elif loan_data.get('age', 30) < 25 and loan_data.get('experience', 5) < 2 and credit_score < 650 and not has_defaults:
                status = 'PENDING_REVIEW'
                approval_prob = 52
            
            # Standard ML-based thresholds for remaining cases
            elif approval_prob >= 65:
                status = 'APPROVED'
            elif approval_prob >= 40:
                status = 'PENDING_REVIEW'
            else:
                status = 'REJECTED'"""

# Also replace the old OVERRIDE code that follows the marker
old_override_block = """            # OVERRIDE 1: Very favorable loan-to-income ratio (<0.7x) with good credit score
            if loan_to_income_ratio < 0.7 and credit_score >= 650 and emi_to_income_ratio < 0.50:
                status = 'APPROVED'
                approval_prob = max(approval_prob, 75)  # Boost probability display
            # OVERRIDE 2: Reasonable loan-to-income ratio (<1.0x) with excellent credit
            elif loan_to_income_ratio < 1.0 and credit_score >= 700 and emi_to_income_ratio < 0.45:
                status = 'APPROVED'
                approval_prob = max(approval_prob, 72)
            # Standard ML-based thresholds (lowered from 75 to 65)
            elif approval_prob >= 65:
                status = 'APPROVED'
            elif approval_prob >= 40:
                status = 'PENDING_REVIEW'
            else:
                status = 'REJECTED'"""

# Normalize line endings
content = content.replace('\r\n', '\n')

# Step 1: Replace the marker comment
if old_marker in content:
    content = content.replace(old_marker, new_decision_logic)
    
    # Step 2: Remove the old override block if it exists
    # This might be duplicated now, need to clean up
    if old_override_block.replace('\r\n', '\n') in content:
        content = content.replace(old_override_block.replace('\r\n', '\n'), '')
    
    # Write back
    with open('loan_predictor.py', 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)
    print("Fix applied successfully!")
else:
    print("Could not find marker in file")
    # Show where we are
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'Determine status' in line:
            print(f"Line {i+1}: {line}")
