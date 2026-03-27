from validation_engine import validate_ode_steps

print("=== TEST 1: WRONG STEPS ===")
wrong = validate_ode_steps([
    "dy/dx = 2x + 2",
    "dy = (2x + 2) dx",
    "y = x**2 + 2*x + C",
    "3 = 1 + 2 + C",
    "C = 0",
    "y = x**2 + 2*x",
], "dy/dx = 2x + 1")
for s in wrong["steps"]:
    status = "VALID  " if s["valid"] else "INVALID"
    print(f"  Step {s['step']}: [{status}] {s['error']}")
print("  VERDICT:", wrong["verdict"])

print()
print("=== TEST 2: CORRECT STEPS ===")
correct = validate_ode_steps([
    "dy/dx = 2x + 1",
    "dy = (2x + 1) dx",
    "y = x**2 + x + C",
    "3 = 1**2 + 1 + C",
    "3 = 2 + C",
    "C = 1",
    "y = x**2 + x + 1",
], "dy/dx = 2x + 1")
for s in correct["steps"]:
    status = "VALID  " if s["valid"] else "INVALID"
    print(f"  Step {s['step']}: [{status}] {s['error']}")
print("  VERDICT:", correct["verdict"])

print()
print("=== TEST 3: PARTIAL WRONG (mix) ===")
mixed = validate_ode_steps([
    "dy/dx = 2x + 1",
    "dy = (5x + 9) dx",
    "y = x**2 + x + C",
], "dy/dx = 2x + 1")
for s in mixed["steps"]:
    status = "VALID  " if s["valid"] else "INVALID"
    print(f"  Step {s['step']}: [{status}] {s['error']}")
print("  VERDICT:", mixed["verdict"])
