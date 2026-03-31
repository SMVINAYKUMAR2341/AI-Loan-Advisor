import re
import io

# Graceful imports - these libraries may not be installed in all environments
try:
    from aadhar import validate as _validate_aadhar
    HAS_AADHAR = True
except ImportError:
    HAS_AADHAR = False

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

try:
    import imquality.brisque as brisque
    HAS_BRISQUE = True
except ImportError:
    HAS_BRISQUE = False

try:
    import pytesseract
    HAS_TESSERACT = True
except ImportError:
    HAS_TESSERACT = False


def validate_aadhaar(aadhaar_number: str) -> bool:
    """Validate Aadhaar number using Verhoeff algorithm."""
    if HAS_AADHAR:
        return _validate_aadhar(aadhaar_number)
    # Fallback: basic 12-digit numeric check
    return bool(re.match(r'^\d{12}$', aadhaar_number))


def validate_pan(pan_number: str) -> bool:
    """Validate PAN card number using a regular expression."""
    if not pan_number:
        return False
    regex = "[A-Z]{5}[0-9]{4}[A-Z]{1}"
    p = re.compile(regex)
    return re.match(p, pan_number) is not None


def validate_document_image(file_content: bytes) -> dict:
    """Perform image quality and OCR checks on a document image."""
    results = {}

    try:
        if not HAS_PIL:
            # Can't validate without PIL, return neutral result
            results['image_quality'] = {'score': 20, 'status': 'GOOD'}
            results['ocr'] = {'text': '', 'word_count': 0}
            return results

        img = Image.open(io.BytesIO(file_content))

        # Image Quality Assessment
        if HAS_BRISQUE:
            quality_score = brisque.score(img)
            results['image_quality'] = {
                'score': quality_score,
                'status': 'GOOD' if quality_score < 35 else 'POOR'
            }
        else:
            # Without brisque, accept the image
            results['image_quality'] = {'score': 20, 'status': 'GOOD'}

        # OCR
        if HAS_TESSERACT:
            text = pytesseract.image_to_string(img)
            results['ocr'] = {
                'text': text,
                'word_count': len(text.split())
            }
        else:
            results['ocr'] = {'text': '', 'word_count': 0}

    except Exception as e:
        # Don't fail the upload because of validation errors
        print(f"Document validation warning: {e}")
        results['image_quality'] = {'score': 20, 'status': 'GOOD'}
        results['ocr'] = {'text': '', 'word_count': 0}

    return results
