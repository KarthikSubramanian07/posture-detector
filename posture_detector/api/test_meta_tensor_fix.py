"""
Test script to verify meta tensor fix
"""
import sys
sys.path.insert(0, '.')

# Import get_depth which has all the patches
from get_depth import get_feature

print("\n" + "="*60)
print("Testing meta tensor fix...")
print("="*60 + "\n")

# Try to load the model (this is where the error occurs)
try:
    result = get_feature(1, 1)
    print("\n✅ SUCCESS! Model loaded without meta tensor errors")
    print(f"Result: {result}")
except NotImplementedError as e:
    if "meta tensor" in str(e).lower():
        print("\n❌ FAILED! Meta tensor error still occurring:")
        print(f"Error: {e}")
        sys.exit(1)
    else:
        raise
except Exception as e:
    print(f"\n⚠️ Different error occurred: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
