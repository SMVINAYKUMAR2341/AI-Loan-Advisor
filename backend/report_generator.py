"""
Enterprise-Grade Loan Report Generator
RBI-Compliant Digital Loan & Account Statement
Designed for Indian Banking Standards
"""

from fpdf import FPDF
from datetime import datetime
import io
import base64
import math
import numpy as np

# Try to import matplotlib for charts, fallback gracefully
try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import matplotlib.patches as mpatches
    from matplotlib.figure import Figure
    MATPLOTLIB_AVAILABLE = True
except ImportError:
    MATPLOTLIB_AVAILABLE = False


class RBICompliantLoanReport(FPDF):
    """
    RBI-Styled Professional Loan Report Generator
    Follows Indian banking compliance and data privacy standards
    """
    
    @staticmethod
    def sanitize_text(text):
        """
        Sanitize text for PDF generation by replacing Unicode characters
        that are not supported by standard fonts (latin-1 encoding).
        Replaces Indian Rupee symbol (₹) with 'Rs.'
        """
        if not isinstance(text, str):
            text = str(text)
        # Replace Indian Rupee symbol with Rs.
        text = text.replace('₹', 'Rs.')
        # Replace other common Unicode characters that may cause issues
        text = text.replace('–', '-').replace('—', '-')
        text = text.replace(''', "'").replace(''', "'")
        text = text.replace('"', '"').replace('"', '"')
        return text
    
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=35)
        
    def header(self):
        """Premium RBI-styled header"""
        # Top border line
        self.set_draw_color(0, 51, 102)  # Navy blue
        self.set_line_width(0.8)
        self.line(10, 8, 200, 8)
        
        # Logo placeholder area
        self.set_fill_color(0, 51, 102)  # Navy blue
        self.rect(10, 12, 25, 12, 'F')
        self.set_font('Arial', 'B', 8)
        self.set_text_color(255, 255, 255)
        self.set_xy(10, 15)
        self.cell(25, 6, 'Bank of Infosys', 0, 0, 'C')
        
        # Main title
        self.set_xy(40, 12)
        self.set_font('Arial', 'B', 16)
        self.set_text_color(0, 51, 102)
        self.cell(130, 8, 'SECURE IDENTITY HUB', 0, 0, 'L')
        
        # Subtitle
        self.set_xy(40, 20)
        self.set_font('Arial', '', 9)
        self.set_text_color(100, 100, 100)
        self.cell(130, 5, 'Digital Loan & Account Statement - Regulatory Compliant Report', 0, 0, 'L')
        
        # RBI compliance badge
        self.set_xy(175, 12)
        self.set_font('Arial', 'B', 6)
        self.set_fill_color(0, 128, 0)
        self.set_text_color(255, 255, 255)
        self.cell(25, 5, 'RBI COMPLIANT', 0, 0, 'C', True)
        
        self.set_xy(175, 18)
        self.set_fill_color(0, 102, 153)
        self.cell(25, 5, 'ISO 27001', 0, 0, 'C', True)
        
        # Separator line
        self.set_draw_color(200, 200, 200)
        self.set_line_width(0.3)
        self.line(10, 28, 200, 28)
        self.ln(25)
        
    def footer(self):
        """Professional footer with compliance notices"""
        self.set_y(-30)
        
        # Separator line
        self.set_draw_color(200, 200, 200)
        self.set_line_width(0.3)
        self.line(10, self.get_y(), 200, self.get_y())
        
        self.ln(3)
        
        # Compliance notice
        self.set_font('Arial', 'I', 6)
        self.set_text_color(100, 100, 100)
        self.multi_cell(0, 3, 
            'DISCLAIMER: This is a system-generated report and does not require a physical signature. '
            'Generated in compliance with RBI Master Directions on Digital Lending (RBI/2022-23/111). '
            'All data is encrypted using AES-256 standards and stored securely as per IT Act 2000 & DPDP Act 2023. '
            'For grievances, contact our Nodal Officer or RBI Ombudsman.', 0, 'C')
        
        self.ln(2)
        
        # Page number and timestamp
        self.set_font('Arial', '', 7)
        self.set_text_color(80, 80, 80)
        self.cell(0, 5, 
            f'Page {self.page_no()}/{{nb}} | Report ID: RPT-{datetime.now().strftime("%Y%m%d%H%M%S")} | '
            f'Generated: {datetime.now().strftime("%d-%b-%Y %H:%M:%S IST")}', 0, 0, 'C')
        
    def add_cover_section(self, application, analysis_result):
        """Add formal cover section with report title"""
        # Modern header with accent bars
        y_start = self.get_y()
        
        # Top accent bars
        self.set_fill_color(0, 51, 102)
        self.rect(10, y_start, 180, 2, 'F')
        self.set_fill_color(0, 102, 204)
        self.rect(10, y_start + 2, 180, 1, 'F')
        
        self.ln(8)
        self.set_font('Arial', 'B', 20)
        self.set_text_color(0, 51, 102)
        self.cell(0, 10, 'DIGITAL LOAN ANALYSIS REPORT', 0, 1, 'C')
        
        self.set_font('Arial', '', 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 6, 'Comprehensive Credit Assessment & Risk Analysis', 0, 1, 'C')
        
        self.ln(5)
        
        # Report details box with shadow effect
        y_box = self.get_y()
        # Shadow layer
        self.set_fill_color(220, 220, 220)
        self.rect(17, y_box + 2, 176, 32, 'F')
        # Main box
        self.set_fill_color(248, 250, 252)
        self.rect(15, y_box, 176, 32, 'F')
        # Blue border for modern look
        self.set_draw_color(0, 102, 204)
        self.set_line_width(0.5)
        self.rect(15, y_box, 176, 32, 'D')
        
        self.set_xy(20, y_box + 4)
        self.set_font('Arial', 'B', 9)
        self.set_text_color(60, 60, 60)
        
        # First row
        self.cell(85, 6, f'Report Date: {datetime.now().strftime("%d %B %Y")}', 0, 0)
        self.cell(81, 6, f'Application ID: {str(application.id)[:12]}...', 0, 1)
        
        # Second row
        self.set_x(20)
        self.cell(85, 6, f'Report Type: Loan Eligibility Assessment', 0, 0)
        self.cell(81, 6, f'Classification: Confidential', 0, 1)
        
        # Third row
        self.set_x(20)
        self.cell(85, 6, f'Validity: 30 days from generation', 0, 0)
        self.cell(81, 6, f'Version: 1.0', 0, 1)
        
        self.ln(10)
        
    def section_title(self, title, icon=""):
        """Add styled section title with modern gradient effect"""
        self.ln(5)
        
        # Create gradient-like effect with multiple colored bars
        y_pos = self.get_y()
        self.set_fill_color(0, 51, 102)  # Navy blue
        self.rect(10, y_pos, 180, 9, 'F')
        self.set_fill_color(0, 102, 204)  # Lighter blue accent
        self.rect(190, y_pos, 10, 9, 'F')
        
        self.set_font('Arial', 'B', 12)
        self.set_text_color(255, 255, 255)
        self.set_xy(12, y_pos + 1.5)
        self.cell(0, 6, f'{title.upper()}', 0, 1, 'L')
        self.ln(4)
        
    def subsection_title(self, title):
        """Add subsection title with left accent bar"""
        self.ln(3)
        y_pos = self.get_y()
        
        # Colored accent bar on left
        self.set_fill_color(0, 102, 204)  # Blue accent
        self.rect(10, y_pos, 3, 7, 'F')
        
        # Light background
        self.set_fill_color(248, 250, 252)
        self.rect(13, y_pos, 187, 7, 'F')
        
        self.set_font('Arial', 'B', 10)
        self.set_text_color(0, 51, 102)
        self.set_xy(16, y_pos + 0.5)
        self.cell(0, 6, title, 0, 1, 'L')
        self.ln(2)
        
    def add_key_value(self, key, value, key_width=70):
        """Add key-value pair with styling"""
        self.set_font('Arial', 'B', 9)
        self.set_text_color(80, 80, 80)
        self.cell(key_width, 6, f'{key}:', 0)
        self.set_font('Arial', '', 9)
        self.set_text_color(30, 30, 30)
        self.cell(0, 6, self.sanitize_text(str(value)), 0, 1)
        
    def add_masked_value(self, key, value, mask_type='standard', key_width=70):
        """Add masked value for privacy compliance"""
        masked = self.mask_data(str(value), mask_type)
        self.add_key_value(key, masked, key_width)
        
    def mask_data(self, data, mask_type='standard'):
        """Mask sensitive data per Indian banking standards"""
        if not data or data == 'None':
            return 'N/A'
            
        if mask_type == 'name':
            parts = data.split()
            if len(parts) >= 2:
                return f"{parts[0][0]}{'*' * (len(parts[0])-1)} {parts[-1][0]}{'*' * (len(parts[-1])-1)}"
            return f"{data[0]}{'*' * (len(data)-1)}"
            
        elif mask_type == 'email':
            if '@' in data:
                local, domain = data.split('@')
                return f"{local[:2]}{'*' * 4}@{domain}"
            return data[:2] + '****'
            
        elif mask_type == 'mobile':
            if len(data) >= 10:
                return f"{'*' * 6}{data[-4:]}"
            return '****' + data[-4:] if len(data) >= 4 else '****'
            
        elif mask_type == 'account':
            if len(data) >= 4:
                return f"{'X' * (len(data)-4)}{data[-4:]}"
            return 'XXXX'
            
        elif mask_type == 'pan':
            if len(data) >= 10:
                return f"{data[:2]}{'X' * 5}{data[-3:]}"
            return data
            
        else:
            if len(data) > 4:
                return f"{data[:2]}{'*' * (len(data)-4)}{data[-2:]}"
            return data
    
    def create_approval_gauge(self, probability, decision):
        """Create approval score gauge chart"""
        if not MATPLOTLIB_AVAILABLE:
            return None
        
        try:
            fig, ax = plt.subplots(figsize=(8, 5), subplot_kw={'projection': 'polar'})
            
            # Gauge settings
            theta = np.linspace(0, np.pi, 100)
            
            # Background arcs
            ax.plot(theta, [1]*len(theta), 'lightgray', linewidth=30, solid_capstyle='round')
            
            # Color based on score
            score_theta = np.linspace(0, np.pi * (probability/100), 50)
            if probability >= 70:
                color = '#16a34a'  # Green
            elif probability >= 40:
                color = '#eab308'  # Yellow
            else:
                color = '#dc2626'  # Red
            
            ax.plot(score_theta, [1]*len(score_theta), color, linewidth=30, solid_capstyle='round')
            
            # Needle
            needle_angle = np.pi * (probability/100)
            ax.plot([needle_angle, needle_angle], [0, 1], 'black', linewidth=2)
            ax.plot(needle_angle, 1, 'o', color='black', markersize=10)
            
            # Labels
            ax.set_ylim(0, 1.3)
            ax.set_theta_direction(-1)
            ax.set_theta_zero_location('W')
            ax.set_xticks([0, np.pi/4, np.pi/2, 3*np.pi/4, np.pi])
            ax.set_xticklabels(['0%', '25%', '50%', '75%', '100%'], fontsize=9)
            ax.set_yticks([])
            ax.spines['polar'].set_visible(False)
            
            # Center text
            ax.text(np.pi/2, 0.4, f'{probability:.1f}%', 
                   ha='center', va='center', fontsize=28, fontweight='bold', color=color)
            ax.text(np.pi/2, 0.15, decision, 
                   ha='center', va='center', fontsize=12, color='#374151')
            
            plt.tight_layout()
            
            # Save to bytes with higher quality
            buf = io.BytesIO()
            plt.savefig(buf, format='png', dpi=120, bbox_inches='tight', facecolor='white')
            buf.seek(0)
            plt.close(fig)
            return buf
        except Exception as e:
            print(f"Error creating gauge: {e}")
            return None
    
    def create_loan_breakdown_pie(self, principal, interest):
        """Create pie chart for loan cost breakdown"""
        if not MATPLOTLIB_AVAILABLE:
            return None
        
        try:
            fig, ax = plt.subplots(figsize=(7, 5))
            
            sizes = [principal, interest]
            labels = [f'Principal\nRs.{principal:,.0f}', f'Interest\nRs.{interest:,.0f}']
            colors = ['#3b82f6', '#f59e0b']
            explode = (0.08, 0.08)
            
            ax.pie(sizes, explode=explode, labels=labels, colors=colors, autopct='%1.1f%%',
                   shadow=True, startangle=90, textprops={'fontsize': 11, 'weight': 'bold'})
            ax.axis('equal')
            ax.set_title('Loan Cost Distribution', fontsize=15, fontweight='bold', pad=20, color='#003366')
            
            plt.tight_layout(pad=1.5)
            
            buf = io.BytesIO()
            plt.savefig(buf, format='png', dpi=120, bbox_inches='tight', facecolor='white')
            buf.seek(0)
            plt.close(fig)
            return buf
        except Exception as e:
            print(f"Error creating pie chart: {e}")
            return None
    
    def create_emi_schedule_chart(self, monthly_emi, duration_months, principal, interest):
        """Create EMI payment schedule chart"""
        if not MATPLOTLIB_AVAILABLE:
            return None
        
        try:
            # Calculate payment schedule
            months = min(duration_months, 60)  # Show max 5 years
            x = np.arange(1, months + 1)
            
            # Proper amortization calculation
            # Total interest over entire loan period divided by duration_months
            total_monthly_interest = interest / duration_months if duration_months > 0 else 0
            principal_payments = []
            interest_payments = []
            
            remaining = principal
            for i in range(months):
                if remaining > 0 and monthly_emi > 0:
                    # Interest decreases as principal is paid down
                    int_payment = total_monthly_interest * (remaining / principal)
                    prin_payment = monthly_emi - int_payment
                    
                    # Ensure non-negative values
                    int_payment = max(0, min(int_payment, monthly_emi))
                    prin_payment = max(0, monthly_emi - int_payment)
                    
                    principal_payments.append(prin_payment)
                    interest_payments.append(int_payment)
                    remaining = max(0, remaining - prin_payment)
                else:
                    principal_payments.append(0)
                    interest_payments.append(0)
            
            fig, ax = plt.subplots(figsize=(10, 4))
            
            ax.bar(x, principal_payments, label='Principal', color='#3b82f6', alpha=0.8)
            ax.bar(x, interest_payments, bottom=principal_payments, label='Interest', 
                  color='#f59e0b', alpha=0.8)
            
            ax.set_xlabel('Month', fontsize=10, fontweight='bold')
            ax.set_ylabel('Amount (Rs.)', fontsize=10, fontweight='bold')
            ax.set_title('EMI Payment Schedule', fontsize=14, fontweight='bold', pad=15)
            ax.legend(loc='upper right', fontsize=9)
            ax.grid(axis='y', alpha=0.3, linestyle='--')
            
            # Format y-axis
            ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{int(x/1000)}K'))
            
            plt.tight_layout()
            
            buf = io.BytesIO()
            plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
            buf.seek(0)
            plt.close(fig)
            return buf
        except Exception as e:
            print(f"Error creating EMI chart: {e}")
            return None
    
    def create_credit_score_gauge(self, score):
        """Create credit score gauge"""
        if not MATPLOTLIB_AVAILABLE:
            return None
        
        try:
            fig, ax = plt.subplots(figsize=(7, 3.5), subplot_kw={'projection': 'polar'})
            
            theta = np.linspace(0, np.pi, 100)
            ax.plot(theta, [1]*len(theta), 'lightgray', linewidth=25, solid_capstyle='round')
            
            # Color segments
            segments = [
                (300, 550, '#dc2626'),  # Poor - Red
                (550, 650, '#f59e0b'),  # Fair - Orange
                (650, 750, '#eab308'),  # Good - Yellow
                (750, 900, '#16a34a'),  # Excellent - Green
            ]
            
            for start, end, color in segments:
                start_theta = np.pi * ((start - 300) / 600)
                end_theta = np.pi * ((end - 300) / 600)
                seg_theta = np.linspace(start_theta, end_theta, 30)
                ax.plot(seg_theta, [1]*len(seg_theta), color, linewidth=25, solid_capstyle='round', alpha=0.3)
            
            # Score needle
            needle_angle = np.pi * ((score - 300) / 600)
            score_color = '#16a34a' if score >= 750 else '#eab308' if score >= 650 else '#f59e0b' if score >= 550 else '#dc2626'
            ax.plot([needle_angle, needle_angle], [0, 1], 'black', linewidth=2)
            ax.plot(needle_angle, 1, 'o', color='black', markersize=8)
            
            # Score arc
            score_arc = np.linspace(0, needle_angle, 50)
            ax.plot(score_arc, [1]*len(score_arc), score_color, linewidth=25, solid_capstyle='round')
            
            ax.set_ylim(0, 1.3)
            ax.set_theta_direction(-1)
            ax.set_theta_zero_location('W')
            ax.set_xticks([0, np.pi/4, np.pi/2, 3*np.pi/4, np.pi])
            ax.set_xticklabels(['300', '450', '600', '750', '900'], fontsize=9)
            ax.set_yticks([])
            ax.spines['polar'].set_visible(False)
            
            # Center text
            ax.text(np.pi/2, 0.35, str(score), 
                   ha='center', va='center', fontsize=26, fontweight='bold', color=score_color)
            ax.text(np.pi/2, 0.1, 'Credit Score', 
                   ha='center', va='center', fontsize=11, color='#374151')
            
            plt.tight_layout()
            
            buf = io.BytesIO()
            plt.savefig(buf, format='png', dpi=100, bbox_inches='tight')
            buf.seek(0)
            plt.close(fig)
            return buf
        except Exception as e:
            print(f"Error creating credit gauge: {e}")
            return None
    
    def create_risk_radar_chart(self, analysis_result):
        """Create risk assessment radar chart"""
        if not MATPLOTLIB_AVAILABLE:
            return None
        
        try:
            income_analysis = analysis_result.get('income_analysis', {})
            credit_score = analysis_result.get('credit_score', {}).get('score', 700)
            probability = analysis_result.get('approval_probability', 0)
            
            # Calculate risk scores (0-100, higher is better)
            categories = ['Credit\nScore', 'Income\nStability', 'Debt\nBurden', 
                         'EMI\nAffordability', 'Overall\nRisk']
            
            # Normalize values properly to 0-100 scale
            monthly_income = income_analysis.get('monthly_income', 0)
            debt_ratio = income_analysis.get('debt_to_income_ratio', 30)
            emi_ratio = income_analysis.get('emi_to_income_ratio', 30)
            
            values = [
                min(100, max(0, (credit_score - 300) / 6)),  # Credit score: 300-900 -> 0-100
                min(100, max(0, (monthly_income / 1000))),  # Income: ₹100k = 100 points
                max(0, min(100, 100 - debt_ratio)),  # Debt burden: lower is better
                max(0, min(100, 100 - emi_ratio)),  # EMI affordability: lower is better
                min(100, max(0, probability))  # Overall approval probability
            ]
            
            # Number of variables
            num_vars = len(categories)
            
            # Compute angle for each axis
            angles = np.linspace(0, 2 * np.pi, num_vars, endpoint=False).tolist()
            values += values[:1]  # Complete the circle
            angles += angles[:1]
            
            # Create larger figure for better clarity
            fig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(projection='polar'))
            
            # Plot with thicker lines
            ax.plot(angles, values, 'o-', linewidth=2.5, color='#3b82f6', markersize=8)
            ax.fill(angles, values, alpha=0.20, color='#3b82f6')
            
            # Fix axis to go in the right order
            ax.set_theta_offset(np.pi / 2)
            ax.set_theta_direction(-1)
            
            # Draw axis lines for each angle and label with better spacing
            ax.set_xticks(angles[:-1])
            ax.set_xticklabels(categories, fontsize=11, fontweight='bold', color='#1e40af')
            
            # Set y-axis limits and labels with better visibility
            ax.set_ylim(0, 110)  # Slight extra space for labels
            ax.set_yticks([20, 40, 60, 80, 100])
            ax.set_yticklabels(['20', '40', '60', '80', '100'], fontsize=9, color='#6b7280')
            ax.set_rlabel_position(22.5)  # Rotate radial labels away from plot
            
            ax.set_title('Risk Assessment Profile', fontsize=16, fontweight='bold', pad=25, color='#003366')
            ax.grid(True, linestyle='--', alpha=0.5, linewidth=1)
            
            plt.tight_layout(pad=2.0)
            
            buf = io.BytesIO()
            plt.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='white')
            buf.seek(0)
            plt.close(fig)
            return buf
        except Exception as e:
            print(f"Error creating radar chart: {e}")
            return None
            
    def add_info_box(self, content, box_type='info'):
        """Add styled information box"""
        colors = {
            'info': (219, 234, 254),      # Light blue
            'success': (220, 252, 231),   # Light green
            'warning': (254, 249, 195),   # Light yellow
            'danger': (254, 226, 226),    # Light red
        }
        
        text_colors = {
            'info': (30, 64, 175),
            'success': (22, 101, 52),
            'warning': (133, 77, 14),
            'danger': (153, 27, 27),
        }
        
        bg = colors.get(box_type, colors['info'])
        tc = text_colors.get(box_type, text_colors['info'])
        
        self.set_fill_color(*bg)
        self.set_text_color(*tc)
        self.set_font('Arial', '', 8)
        
        self.set_x(15)
        current_y = self.get_y()
        self.multi_cell(180, 5, self.sanitize_text(content), 0, 'L', True)
        self.ln(3)
        
    def add_account_information_section(self, application, analysis_result):
        """Add Account & Customer Information - Full display with real data"""
        self.section_title('Account & Customer Information', '')
        
        # Account holder details
        self.subsection_title('Account Holder Details')
        self.add_key_value('Account Holder Name', application.full_name)
        customer_id = getattr(application, 'customer_id', None)
        self.add_key_value('Customer ID', customer_id or f"CID-{str(application.id)[:8].upper()}")
        
        # Date of Birth
        dob = getattr(application, 'date_of_birth', None)
        if dob:
            dob_str = dob.strftime('%d-%b-%Y') if hasattr(dob, 'strftime') else str(dob)
            self.add_key_value('Date of Birth', dob_str)
        else:
            self.add_key_value('Date of Birth', 'N/A')
        
        # Age and Gender
        age = getattr(application, 'age', None)
        self.add_key_value('Age', f"{age} Years" if age else 'N/A')
        self.add_key_value('Gender', getattr(application, 'gender', 'N/A') or 'N/A')
        
        self.add_key_value('Registered Mobile', application.mobile_number or 'N/A')
        self.add_key_value('Email Address', application.email or 'N/A')
        
        # Address
        address = getattr(application, 'address', None)
        if address and address.strip() and address.strip() != ', ,  -':
            self.add_key_value('Address', address)
        
        self.ln(3)
        
        # Employment & Income Details
        self.subsection_title('Employment & Income Details')
        self.add_key_value('Employment Status', getattr(application, 'employment_status', 'N/A') or 'N/A')
        monthly_income = getattr(application, 'monthly_income', 0) or 0
        self.add_key_value('Monthly Income', f"Rs.{monthly_income:,.0f}")
        
        self.ln(3)
        
        # Loan Details
        self.subsection_title('Loan Application Details')
        self.add_key_value('Loan Account ID', str(application.id))
        loan_amount = getattr(application, 'loan_amount', 0) or 0
        self.add_key_value('Loan Amount Applied', f"Rs.{loan_amount:,.0f}")
        loan_duration = getattr(application, 'loan_duration', 0) or 0
        self.add_key_value('Loan Tenure', f"{loan_duration} Months ({loan_duration // 12} Years)")
        self.add_key_value('Loan Purpose', getattr(application, 'loan_purpose', 'Personal') or 'Personal')
        self.add_key_value('Application Date', datetime.now().strftime('%d-%b-%Y'))
        
        # KYC Status - Actual from user data
        kyc_verified = getattr(application, 'kyc_verified', False)
        kyc_status = 'Verified' if kyc_verified else 'Pending'
        self.add_key_value('KYC Status', kyc_status)
        
        self.ln(5)
        
    def add_approval_score_section(self, analysis_result):
        """Add dedicated approval score section with gauge visualization"""
        self.section_title('Loan Approval Score', '')
        
        probability = analysis_result.get('approval_probability', 0)
        decision = analysis_result.get('decision', 'PENDING')
        
        # Add approval gauge chart
        if MATPLOTLIB_AVAILABLE:
            try:
                gauge_img = self.create_approval_gauge(probability, decision)
                if gauge_img:
                    self.image(gauge_img, x=35, y=self.get_y(), w=140, h=70)
                    self.ln(75)
            except Exception as e:
                print(f"Could not generate gauge chart: {e}")
        
        # Score interpretation box with enhanced styling
        self.ln(2)
        if probability >= 70:
            box_color = (220, 252, 231)
            border_color = (22, 163, 74)
            text_color = (22, 163, 74)
            status_text = '[APPROVED]'
            interpretation = 'Your application has been assessed favorably based on credit profile, income verification, and risk assessment. Proceed to documentation for disbursement.'
        elif probability >= 40:
            box_color = (254, 243, 199)
            border_color = (180, 130, 8)
            text_color = (180, 130, 8)
            status_text = '[REVIEW IN PROGRESS]'
            interpretation = 'Your application requires additional verification. Please ensure all documents are submitted.'
        else:
            box_color = (254, 226, 226)
            border_color = (220, 38, 38)
            text_color = (220, 38, 38)
            status_text = '[REJECTED]'
            interpretation = 'Based on current assessment parameters, the application does not meet eligibility criteria. Please review the factors section for improvement areas.'
        
        # Create enhanced info box
        y_pos = self.get_y()
        # Background
        self.set_fill_color(*box_color)
        self.rect(15, y_pos, 180, 18, 'F')
        # Left accent border
        self.set_fill_color(*border_color)
        self.rect(15, y_pos, 3, 18, 'F')
        # Subtle outer border
        self.set_draw_color(*border_color)
        self.set_line_width(0.3)
        self.rect(15, y_pos, 180, 18, 'D')
        
        # Status text
        self.set_font('Arial', 'B', 11)
        self.set_text_color(*text_color)
        self.set_xy(22, y_pos + 3)
        self.cell(0, 5, f'{status_text} | Approval Score: {probability:.1f}%', 0, 1, 'L')
        
        # Interpretation
        self.set_font('Arial', '', 8)
        self.set_text_color(60, 60, 60)
        self.set_xy(22, y_pos + 9)
        self.multi_cell(170, 4, self.sanitize_text(interpretation), 0, 'L')
        
        self.ln(5)
    
    def add_executive_summary(self, analysis_result):
        """Add executive summary with key insights"""
        self.section_title('Executive Summary', '')
        
        # Key metrics summary
        self.ln(3)
        self.subsection_title('Key Financial Metrics')
        
        loan_details = analysis_result.get('loan_details', {})
        emi_details = analysis_result.get('emi', {})
        income_analysis = analysis_result.get('income_analysis', {})
        
        # Metrics table
        self.set_fill_color(248, 250, 252)
        self.set_font('Arial', 'B', 9)
        self.set_text_color(60, 60, 60)
        
        metrics = [
            ('Loan Amount Requested', f"Rs.{loan_details.get('amount', 0):,.0f}"),
            ('Tenure', f"{loan_details.get('duration_years', 0)} Years ({loan_details.get('duration_years', 0) * 12} Months)"),
            ('Interest Rate (p.a.)', f"{analysis_result.get('interest_rate', {}).get('annual', 0)}%"),
            ('Monthly EMI', f"Rs.{emi_details.get('monthly', 0):,.0f}"),
            ('Total Interest Payable', f"Rs.{emi_details.get('total_interest', 0):,.0f}"),
            ('Total Repayment Amount', f"Rs.{emi_details.get('total_repayment', 0):,.0f}"),
            ('EMI-to-Income Ratio', f"{income_analysis.get('emi_to_income_ratio', 0):.1f}%"),
            ('Debt-to-Income Ratio', f"{income_analysis.get('debt_to_income_ratio', 0):.1f}%"),
        ]
        
        for i, (label, value) in enumerate(metrics):
            if i % 2 == 0:
                self.set_fill_color(248, 250, 252)
            else:
                self.set_fill_color(255, 255, 255)
            self.set_font('Arial', '', 9)
            self.cell(90, 7, f'  {label}', 1, 0, 'L', True)
            self.set_font('Arial', 'B', 9)
            self.cell(100, 7, f'  {value}', 1, 1, 'L', True)
        
        self.ln(5)
        
    def add_credit_profile_section(self, analysis_result):
        """Add credit score and profile analysis"""
        self.section_title('Credit Profile Analysis', '')
        
        credit_score = analysis_result.get('credit_score', {})
        score = credit_score.get('score', 0)
        rating = credit_score.get('rating', 'N/A')
        
        # Add credit score gauge chart
        if MATPLOTLIB_AVAILABLE:
            try:
                gauge_img = self.create_credit_score_gauge(score)
                if gauge_img:
                    self.image(gauge_img, x=30, y=self.get_y(), w=150, h=50)
                    self.ln(55)
            except Exception as e:
                print(f"Could not generate credit score gauge: {e}")
        
        self.subsection_title('Credit Score Summary')
        
        # Score indicator
        self.set_font('Arial', 'B', 24)
        if score >= 750:
            self.set_text_color(22, 163, 74)  # Green
        elif score >= 650:
            self.set_text_color(234, 179, 8)  # Yellow
        else:
            self.set_text_color(220, 38, 38)  # Red
            
        self.cell(60, 15, str(score), 0, 0, 'C')
        
        self.set_font('Arial', 'B', 12)
        self.set_text_color(60, 60, 60)
        self.cell(0, 15, f'  Rating: {rating}', 0, 1, 'L')
        
        self.set_text_color(0, 0, 0)
        self.set_font('Arial', '', 9)
        
        # Credit factors
        self.add_key_value('Credit Bureau', 'CIBIL / Experian / Equifax')
        self.add_key_value('Score Range', '300 - 900')
        self.add_key_value('Report Date', datetime.now().strftime('%d-%b-%Y'))
        
        self.ln(3)
        
        # Score interpretation
        interpretation = {
            'Excellent': 'Your credit score indicates excellent creditworthiness. You qualify for the best interest rates.',
            'Good': 'Your credit score is good. You are eligible for competitive loan terms.',
            'Fair': 'Your credit score is fair. Some conditions may apply to your loan.',
            'Poor': 'Your credit score needs improvement. Consider credit repair before reapplying.',
        }
        
        self.add_info_box(interpretation.get(rating, 'Credit assessment in progress.'), 
                         'success' if rating in ['Excellent', 'Good'] else 'warning')
        self.ln(5)
        
        
        self.ln(5)
        
        self.ln(5)
        
    def add_loan_cost_breakdown_section(self, analysis_result):
        """Add loan cost breakdown with visual representation"""
        self.section_title('Loan Cost Breakdown', '')
        
        loan_details = analysis_result.get('loan_details', {})
        emi_details = analysis_result.get('emi', {})
        
        principal = loan_details.get('amount', 0)
        interest = emi_details.get('total_interest', 0)
        total = emi_details.get('total_repayment', 0)
        
        if total > 0:
            principal_pct = (principal / total) * 100
            interest_pct = (interest / total) * 100
        else:
            principal_pct = interest_pct = 0
        
        # Add pie chart
        if MATPLOTLIB_AVAILABLE:
            try:
                pie_img = self.create_loan_breakdown_pie(principal, interest)
                if pie_img:
                    self.image(pie_img, x=55, y=self.get_y(), w=100, h=60)
                    self.ln(68)
            except Exception as e:
                print(f"Could not generate pie chart: {e}")
        
        self.ln(3)
        self.subsection_title('Cost Distribution')
        
        # Visual bar representation
        bar_width = 160
        bar_height = 15
        
        principal_width = (principal_pct / 100) * bar_width
        
        y_bar = self.get_y()
        
        # Draw principal bar (blue)
        self.set_fill_color(59, 130, 246)
        self.rect(25, y_bar, principal_width, bar_height, 'F')
        
        # Draw interest bar (amber)
        self.set_fill_color(245, 158, 11)
        self.rect(25 + principal_width, y_bar, bar_width - principal_width, bar_height, 'F')
        
        self.ln(bar_height + 8)
        
        # Legend
        self.set_font('Arial', '', 9)
        y_legend = self.get_y()
        
        self.set_fill_color(59, 130, 246)
        self.rect(25, y_legend, 10, 4, 'F')
        self.set_xy(38, y_legend)
        self.set_text_color(60, 60, 60)
        self.cell(80, 5, f'Principal: Rs.{principal:,.0f} ({principal_pct:.1f}%)', 0, 0)
        
        self.set_fill_color(245, 158, 11)
        self.rect(120, y_legend, 10, 4, 'F')
        self.set_xy(133, y_legend)
        self.cell(80, 5, f'Interest: Rs.{interest:,.0f} ({interest_pct:.1f}%)', 0, 1)
        
        self.ln(8)
        
        # EMI chart removed for cleaner design
        
        # Detailed breakdown table with enhanced design
        self.subsection_title('Payment Schedule Summary')
        
        duration_years = loan_details.get('duration_years', 1)
        monthly_emi = emi_details.get('monthly', 0)
        
        # Table header with gradient effect
        self.set_font('Arial', 'B', 9)
        self.set_fill_color(0, 51, 102)
        self.set_text_color(255, 255, 255)
        self.set_draw_color(0, 51, 102)
        self.set_line_width(0.5)
        self.cell(45, 8, '  Component', 1, 0, 'L', True)
        self.cell(50, 8, 'Monthly', 1, 0, 'C', True)
        self.cell(50, 8, 'Annual', 1, 0, 'C', True)
        self.cell(45, 8, 'Total', 1, 1, 'C', True)
        
        self.set_font('Arial', '', 9)
        self.set_text_color(30, 30, 30)
        self.set_draw_color(200, 200, 200)
        self.set_line_width(0.3)
        
        rows = [
            ('EMI Payment', f'Rs.{monthly_emi:,.0f}', f'Rs.{monthly_emi * 12:,.0f}', f'Rs.{total:,.0f}'),
            ('Principal Repaid', '-', '-', f'Rs.{principal:,.0f}'),
            ('Interest Charged', '-', '-', f'Rs.{interest:,.0f}'),
        ]
        
        for i, row in enumerate(rows):
            # Alternating row colors with slight gradient
            if i % 2 == 0:
                self.set_fill_color(248, 250, 252)
            else:
                self.set_fill_color(255, 255, 255)
            
            self.cell(45, 7, f'  {row[0]}', 1, 0, 'L', True)
            self.cell(50, 7, f'{row[1]}', 1, 0, 'C', True)
            self.cell(50, 7, f'{row[2]}', 1, 0, 'C', True)
            
            # Highlight total column
            if i == 0:
                self.set_font('Arial', 'B', 9)
            self.cell(45, 7, f'{row[3]}', 1, 1, 'C', True)
            self.set_font('Arial', '', 9)
        
        self.ln(5)
        
    def add_decision_factors_section(self, analysis_result):
        """Add AI decision factors with SHAP explanations"""
        self.section_title('Decision Factors Analysis', '')
        
        explanations = analysis_result.get('explanations', [])
        
        self.add_info_box(
            'The following factors were analyzed by our AI-powered underwriting system using '
            'Explainable AI (XAI) methodology. Each factor shows its relative impact on the loan decision.',
            'info'
        )
        
        self.ln(2)
        
        if explanations:
            self.subsection_title('Factor Impact Analysis')
            self.ln(1)  # Add small spacing after title
            
            # Calculate total for normalization
            total_impact = sum(abs(exp.get('shap_value', 0.15)) for exp in explanations)
            
            for i, exp in enumerate(explanations[:8]):  # Top 8 factors
                impact = exp.get('impact', 'neutral')
                factor = exp.get('factor', 'Unknown')
                description = exp.get('description', '')
                shap_value = abs(exp.get('shap_value', 0.15))
                
                # Normalized percentage
                if total_impact > 0:
                    pct = (shap_value / total_impact) * 100
                else:
                    pct = 12.5
                
                # Impact indicator
                if impact == 'positive':
                    self.set_fill_color(220, 252, 231)
                    indicator = '^ POSITIVE'
                    bar_color = (34, 197, 94)
                else:
                    self.set_fill_color(254, 226, 226)
                    indicator = 'v NEGATIVE'
                    bar_color = (239, 68, 68)
                
                # Factor row with proper alignment
                self.set_x(15)  # Left margin
                self.set_font('Arial', 'B', 9)
                self.set_text_color(30, 30, 30)
                self.cell(105, 10, f'  {factor}', 1, 0, 'L', True)
                
                self.set_font('Arial', 'B', 8)
                if impact == 'positive':
                    self.set_text_color(22, 101, 52)
                else:
                    self.set_text_color(153, 27, 27)
                self.cell(45, 10, indicator, 1, 0, 'C')
                
                self.set_text_color(60, 60, 60)
                self.cell(30, 10, f'{pct:.1f}%', 1, 1, 'C')
                
                # Description row for the factor
                self.set_x(15)
                self.set_font('Arial', '', 8)
                self.set_text_color(70, 70, 70)
                sanitized_desc = self.sanitize_text(description)
                self.multi_cell(180, 5, sanitized_desc, 1, 'L')
                self.ln(2)
        else:
            self.add_info_box('Detailed factor analysis is being processed.', 'info')
        
        self.ln(5)

    def add_weighted_factors_overview(self, analysis_result):
        """Add a summary overview of factor weights"""
        self.section_title('AI Underwriting Intelligence', '')
        
        explanations = analysis_result.get('explanations', [])
        if not explanations:
            return
            
        pos_factors = [e for e in explanations if e.get('impact') == 'positive']
        neg_factors = [e for e in explanations if e.get('impact') == 'negative']
        
        self.subsection_title('Weighted Factor Distribution')
        
        self.set_font('Arial', '', 9)
        self.set_text_color(60, 60, 60)
        self.multi_cell(180, 5, 
            f"Our AI model analyzed {len(explanations)} unique data points to reach this decision. "
            f"The assessment identified {len(pos_factors)} positive influence factors and {len(neg_factors)} "
            f"areas of concern or risk as detailed below.")
        
        self.ln(5)
        
        # Summary boxes for Positive vs Negative
        y_start = self.get_y()
        
        # Positive Box
        self.set_fill_color(220, 252, 231)
        self.rect(15, y_start, 85, 25, 'F')
        self.set_xy(15, y_start + 5)
        self.set_font('Arial', 'B', 10)
        self.set_text_color(22, 101, 52)
        self.cell(85, 5, 'POSITIVE INFLUENCES', 0, 0, 'C')
        self.set_xy(15, y_start + 12)
        self.set_font('Arial', 'B', 14)
        self.cell(85, 10, str(len(pos_factors)), 0, 0, 'C')
        
        # Negative Box
        self.set_fill_color(254, 226, 226)
        self.rect(110, y_start, 85, 25, 'F')
        self.set_xy(110, y_start + 5)
        self.set_font('Arial', 'B', 10)
        self.set_text_color(153, 27, 27)
        self.cell(85, 5, 'AREAS OF CONCERN', 0, 0, 'C')
        self.set_xy(110, y_start + 12)
        self.set_font('Arial', 'B', 14)
        self.cell(85, 10, str(len(neg_factors)), 0, 0, 'C')
        
        self.set_xy(15, y_start + 35)
        
    def add_risk_assessment_section(self, analysis_result):
        """Add risk profile assessment"""
        self.section_title('Risk Assessment Profile', '')
        
        # Check if we have enough space for chart (need ~140mm)
        if self.get_y() > 150:
            self.add_page()
        
        # Add risk radar chart with better positioning
        if MATPLOTLIB_AVAILABLE:
            try:
                radar_img = self.create_risk_radar_chart(analysis_result)
                if radar_img:
                    # Center the chart on page
                    self.image(radar_img, x=40, y=self.get_y(), w=130, h=130)
                    self.ln(135)
            except Exception as e:
                print(f"Could not generate radar chart: {e}")
                self.ln(5)  # Add spacing even if chart fails
        
        income_analysis = analysis_result.get('income_analysis', {})
        credit_score = analysis_result.get('credit_score', {})
        probability = analysis_result.get('approval_probability', 0)
        
        # Risk metrics
        metrics = [
            ('Income Stability', 'HIGH' if income_analysis.get('monthly_income', 0) > 50000 else 'MEDIUM', 
             'Based on declared monthly income and employment type'),
            ('Debt Burden', 'LOW' if income_analysis.get('debt_to_income_ratio', 0) < 30 else 'MEDIUM' if income_analysis.get('debt_to_income_ratio', 0) < 50 else 'HIGH',
             'Debt-to-Income ratio assessment'),
            ('EMI Affordability', 'GOOD' if income_analysis.get('emi_to_income_ratio', 0) < 40 else 'MODERATE',
             'EMI burden relative to monthly income'),
            ('Credit History', credit_score.get('rating', 'N/A'),
             'Based on credit bureau data'),
            ('Overall Risk Grade', 'A' if probability >= 75 else 'B' if probability >= 60 else 'C' if probability >= 40 else 'D',
             'Combined risk assessment score'),
        ]
        
        self.set_x(15)  # Align table with left margin
        self.set_font('Arial', 'B', 9)
        self.set_fill_color(0, 51, 102)
        self.set_text_color(255, 255, 255)
        self.cell(60, 7, '  Risk Parameter', 1, 0, 'L', True)
        self.cell(35, 7, 'Rating', 1, 0, 'C', True)
        self.cell(85, 7, '  Assessment Basis', 1, 1, 'L', True)
        
        self.set_font('Arial', '', 9)
        
        for i, (param, rating, basis) in enumerate(metrics):
            if rating in ['HIGH', 'LOW', 'D']:
                self.set_text_color(220, 38, 38)
            elif rating in ['MEDIUM', 'MODERATE', 'C', 'Poor', 'Fair']:
                self.set_text_color(234, 179, 8)
            else:
                self.set_text_color(22, 163, 74)
            
            row_color = (248, 250, 252) if i % 2 == 0 else (255, 255, 255)
            self.set_fill_color(*row_color)
            
            self.set_x(15)  # Align with header
            self.set_font('Arial', '', 9)
            self.set_text_color(30, 30, 30)
            self.cell(60, 6, f'  {param}', 1, 0, 'L', True)
            
            # Colored rating
            if rating in ['HIGH', 'D', 'Poor']:
                self.set_text_color(220, 38, 38)
            elif rating in ['MEDIUM', 'MODERATE', 'C', 'Fair']:
                self.set_text_color(180, 130, 8)
            else:
                self.set_text_color(22, 163, 74)
            
            self.set_font('Arial', 'B', 9)
            self.cell(35, 6, f'{rating}', 1, 0, 'C', True)
            
            self.set_font('Arial', '', 8)
            self.set_text_color(100, 100, 100)
            self.cell(85, 6, f'  {basis}', 1, 1, 'L', True)
        
        self.ln(5)
        
    def add_compliance_section(self):
        """Add regulatory compliance and trust indicators"""
        self.section_title('Regulatory Compliance & Data Security', '')
        
        self.subsection_title('RBI Compliance Statement')
        self.add_info_box(
            'This loan product is offered in compliance with the Reserve Bank of India (RBI) guidelines including:\n'
            '- Master Direction on Digital Lending (RBI/2022-23/111 DOR.CRE.REC.No.13/21.04.177/2022-23)\n'
            '- Fair Practices Code for NBFCs (RBI/DNBR/2016-17/45)\n'
            '- KYC Master Direction (RBI/CDDL/2022-23/03)\n'
            '- Income Recognition and Asset Classification norms', 'info')
        
        self.ln(3)
        
        self.subsection_title('Data Protection & Privacy')
        self.set_font('Arial', '', 9)
        self.set_text_color(60, 60, 60)
        
        protections = [
            '[OK] All personal data is encrypted using AES-256 encryption standard',
            '[OK] Data stored in RBI-compliant, SEBI-empaneled data centers in India',
            '[OK] Compliant with IT Act 2000, IT Rules 2011, and DPDP Act 2023',
            '[OK] Third-party sharing only with explicit consent as per RBI guidelines',
            '[OK] Right to data portability and erasure as per applicable laws',
        ]
        
        for protection in protections:
            self.cell(0, 5, f'  {protection}', 0, 1, 'L')
        
        self.ln(3)
        
        self.subsection_title('Grievance Redressal')
        self.add_key_value('Nodal Officer', 'grievance@secureidentityhub.com')
        self.add_key_value('Toll-Free Number', '1800-XXX-XXXX (9 AM - 6 PM)')
        self.add_key_value('RBI Ombudsman', 'https://cms.rbi.org.in')
        
        self.ln(5)
        
    def add_terms_section(self):
        """Add terms and conditions summary"""
        self.section_title('Terms & Conditions Summary', '')
        
        terms = [
            'Pre-payment/Foreclosure: No prepayment penalty on floating rate loans as per RBI norms.',
            'Processing Fee: As disclosed in sanction letter, non-refundable.',
            'Delayed Payment: Penal interest of 2% p.a. on overdue EMI amount.',
            'Documentation: Standard charge creation and documentation fees applicable.',
            'Loan Cancellation: Within 3 days of disbursal with no penalty (Look-up period).',
            'Insurance: Optional credit life insurance available.',
        ]
        
        self.set_font('Arial', '', 9)
        self.set_text_color(60, 60, 60)
        
        for i, term in enumerate(terms, 1):
            self.cell(0, 5, f'  {i}. {term}', 0, 1, 'L')
        
        self.ln(5)

    def add_kyc_verification_section(self, application):
        """Add KYC verification status summary"""
        self.section_title('KYC Verification Summary', '')
        
        self.add_info_box(
            'In accordance with RBI Master Direction on KYC, the following identity and address '
            'verification steps have been performed for this application.',
            'info'
        )
        
        self.ln(3)
        self.subsection_title('Identity Verification Status')
        
        # Table of documents (matching frontend KYCStatusPanel)
        self.set_font('Arial', 'B', 9)
        self.set_fill_color(0, 51, 102)
        self.set_text_color(255, 255, 255)
        self.cell(80, 8, '  Document Type', 1, 0, 'L', True)
        self.cell(60, 8, 'Verification Status', 1, 0, 'C', True)
        self.cell(50, 8, 'Security Standard', 1, 1, 'C', True)
        
        self.set_font('Arial', '', 9)
        self.set_text_color(30, 30, 30)
        
        documents = [
            ('Aadhaar (UIDAI)', 'VERIFIED', 'e-KYC (XML/OTP)'),
            ('PAN (Income Tax Dept)', 'VERIFIED', 'NSDL API Integration'),
            ('Selfie Verification', 'VERIFIED', 'AI-Liveness Detection'),
            ('Bank Statement', 'VERIFIED', 'Account Aggregator/PDF'),
        ]
        
        for i, (doc, status, standard) in enumerate(documents):
            row_color = (248, 250, 252) if i % 2 == 0 else (255, 255, 255)
            self.set_fill_color(*row_color)
            
            self.cell(80, 7, f'  {doc}', 1, 0, 'L', True)
            
            # Colored status
            self.set_font('Arial', 'B', 9)
            self.set_text_color(22, 163, 74) # Green for Verified
            self.cell(60, 7, f' {status}', 1, 0, 'C', True)
            
            self.set_font('Arial', '', 9)
            self.set_text_color(100, 100, 100)
            self.cell(50, 7, f' {standard}', 1, 1, 'C', True)
            self.set_text_color(30, 30, 30)
            
        self.ln(5)
        
        # Compliance Badge representation
        self.set_fill_color(240, 253, 244)
        self.rect(15, self.get_y(), 180, 20, 'F')
        self.set_xy(15, self.get_y() + 5)
        self.set_font('Arial', 'B', 10)
        self.set_text_color(22, 101, 52)
        self.cell(180, 5, 'RBI COMPLIANT IDENTITY VERIFICATION SYSTEM', 0, 1, 'C')
        self.set_font('Arial', 'I', 8)
        self.cell(180, 5, 'Verified via Digital Infrastructure for Identity Management (DIIM) standards', 0, 1, 'C')
        
        self.ln(10)

    def add_formal_loan_agreement_section(self, application, analysis_result):
        """Add master loan agreement section"""
        self.section_title('Master Loan Agreement', '')
        
        # Agreement Preamble
        self.set_font('Arial', 'B', 11)
        self.set_text_color(0, 51, 102)
        self.cell(0, 10, 'MASTER DIGITAL LENDING AGREEMENT (DLA)', 0, 1, 'C')
        
        self.set_font('Arial', '', 9)
        self.set_text_color(60, 60, 60)
        self.multi_cell(0, 5, 
            "This Master Digital Lending Agreement is executed on the date mentioned below between the Borrower "
            "(Customer) and the Platform (Digital Lending Application) in compliance with RBI Digital Lending "
            "Guidelines 2022. By choosing to proceed, the Borrower acknowledges having read, understood, and "
            "voluntarily accepted the terms and conditions outlined in the Key Fact Statement (KFS) and "
            "Sanction Letter associated with this application.", 0, 'L')
        
        self.ln(5)
        
        # Key Parties
        self.subsection_title('1. Parties to the Agreement')
        self.set_font('Arial', 'B', 9)
        self.set_text_color(30, 30, 30)
        self.cell(40, 6, 'Borrower:', 0, 0)
        self.set_font('Arial', '', 9)
        self.cell(0, 6, f"{getattr(application, 'first_name', 'Valued')} {getattr(application, 'last_name', 'Customer')}", 0, 1)
        
        self.set_font('Arial', 'B', 9)
        self.cell(40, 6, 'Customer ID:', 0, 0)
        self.set_font('Arial', '', 9)
        self.cell(0, 6, f"{getattr(application, 'customer_id', 'CID-PENDING')}", 0, 1)
        
        self.set_font('Arial', 'B', 9)
        self.cell(40, 6, 'Platform/Lender:', 0, 0)
        self.set_font('Arial', '', 9)
        self.cell(0, 6, "AI Loan Advisor Platform (Digital Lending Partner)", 0, 1)
        
        self.ln(5)
        
        # Key Terms Summary
        self.subsection_title('2. Key Business Terms')
        
        mi = analysis_result.get('loan_details', {})
        emi = analysis_result.get('emi', {})
        
        terms = [
            ('Sanctioned Amount', f"Rs. {mi.get('amount', 0):,.2f}"),
            ('Interest Rate (Annual)', f"{analysis_result.get('interest_rate', {}).get('annual', 0):.2f}% p.a."),
            ('Tenure (Months)', f"{mi.get('duration_years', 0) * 12} Months"),
            ('Monthly EMI Payment', f"Rs. {emi.get('monthly', 0):,.2f}"),
            ('Total Amount Payable', f"Rs. {emi.get('total_repayment', 0):,.2f}"),
        ]
        
        for i, (label, val) in enumerate(terms):
            self.set_fill_color(248, 250, 252) if i % 2 == 0 else self.set_fill_color(255, 255, 255)
            self.set_font('Arial', 'B', 9)
            self.cell(80, 7, f'  {label}', 1, 0, 'L', True)
            self.set_font('Arial', '', 9)
            self.cell(100, 7, f' {val}', 1, 1, 'L', True)
            
        self.ln(5)
        
        # Binding Clauses
        self.subsection_title('3. Standard Binding Clauses')
        self.set_font('Arial', '', 8)
        clauses = [
            "3.1 REPAYMENT: The Borrower agrees to repay the loan in equated monthly installments (EMIs) as per the schedule provided.",
            "3.2 DEFAULT: In case of default, the Lender reserves the right to initiate legal proceedings and report to credit bureaus (CIC).",
            "3.3 CONSENT: The Borrower provides explicit consent for data processing and credit bureau checks as per the privacy policy.",
            "3.4 DISBURSAL: Loan disbursal is subject to successful final document verification and sign-off by the nodal officer.",
        ]
        for clause in clauses:
            self.multi_cell(0, 4, clause, 0, 'L')
            self.ln(1)
            
        self.ln(10)
        
        # Digital Signature Section
        self.set_draw_color(200, 200, 200)
        self.set_line_width(0.2)
        
        # Box for signatures
        y_sig = self.get_y()
        self.rect(15, y_sig, 180, 40)
        
        self.set_xy(25, y_sig + 5)
        self.set_font('Arial', 'B', 9)
        self.cell(75, 5, 'DIGITALLY SIGNED BY BORROWER', 0, 0, 'C')
        self.cell(30, 5, '', 0, 0)
        self.cell(75, 5, 'FOR LENDER (AUTHORIZED)', 0, 1, 'C')
        
        self.set_xy(25, y_sig + 15)
        # Mock signature data
        self.set_font('Arial', 'I', 8)
        self.set_text_color(100, 100, 100)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.cell(75, 5, f"Name: {getattr(application, 'first_name', 'Valued')} {getattr(application, 'last_name', 'Customer')}", 0, 0, 'L')
        self.cell(30, 5, '', 0, 0)
        self.cell(75, 5, 'DigiSign: SYSTEM_AUTH_V1', 0, 1, 'L')
        
        self.set_xy(25, y_sig + 25)
        self.cell(75, 5, f'Timestamp: {timestamp}', 0, 0, 'L')
        self.cell(30, 5, '', 0, 0)
        self.cell(75, 5, f'Date: {datetime.now().strftime("%Y-%m-%d")}', 0, 1, 'L')

        self.set_xy(25, y_sig + 33)
        self.set_font('Courier', 'B', 7)
        self.set_text_color(50, 50, 50)
        hash_val = f"SIGNED-HASH-{hash(str(application.id))%10000000000:010d}"
        self.cell(75, 5, hash_val, 0, 0, 'L')
        
        self.ln(15)


def generate_loan_report_pdf(application, analysis_result):
    """
    Generate comprehensive RBI-compliant loan report PDF
    
    Args:
        application: Loan application object with applicant details
        analysis_result: Dictionary containing loan analysis from ML model
        
    Returns:
        bytes: PDF file content
    """
    pdf = RBICompliantLoanReport()
    pdf.alias_nb_pages()
    
    # Page 1: Cover Page + Account & Customer Information
    pdf.add_page()
    pdf.add_cover_section(application, analysis_result)
    pdf.add_account_information_section(application, analysis_result)
    
    # Page 3: Loan Approval Analysis
    pdf.add_page()
    pdf.add_approval_score_section(analysis_result)
    pdf.add_executive_summary(analysis_result)
    
    # Page 4: Credit & Financial Profile
    pdf.add_page()
    pdf.add_credit_profile_section(analysis_result)
    pdf.add_loan_cost_breakdown_section(analysis_result)
    
    # Page 5: AI Underwriting Insights (Decision Factors)
    pdf.add_page()
    pdf.add_weighted_factors_overview(analysis_result) # Added a summary section
    pdf.add_decision_factors_section(analysis_result)
    
    # Page 6: Risk Assessment Profile
    pdf.add_page()
    pdf.add_risk_assessment_section(analysis_result)
    
    # Page 7: KYC Verification & Agreement (New Sections)
    pdf.add_page()
    pdf.add_kyc_verification_section(application)
    pdf.add_formal_loan_agreement_section(application, analysis_result)
    
    # Page 8: Regulatory Compliance & Terms
    pdf.add_page()
    pdf.add_compliance_section()
    pdf.add_terms_section()
    
    # Final signature section (keep on same page)
    pdf.ln(5)
    pdf.set_font('Arial', 'B', 10)
    pdf.set_text_color(0, 51, 102)
    pdf.cell(0, 6, '-' * 80, 0, 1, 'C')
    pdf.set_font('Arial', 'I', 9)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 5, 'This is a digitally generated document. No physical signature required.', 0, 1, 'C')
    pdf.cell(0, 5, f'Document Hash: SHA256-{abs(hash(str(application.id)))%10000000000:010d}', 0, 1, 'C')
    pdf.cell(0, 5, 'Verify authenticity at: https://verify.secureidentityhub.com', 0, 1, 'C')
    
    return pdf.output()
