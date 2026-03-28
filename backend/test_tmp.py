from validation_engine import validate_fourier_series_steps
import json

steps = [
    f'f(-x) = f(x)',
    f'a0 = 1/pi * integral(-pi to pi) x^2 dx',
    f'a0 = 2*pi^2/3',
    f'an = 1/pi * integral(-pi to pi) x^2 * cos(n*x) dx',
    f'Let I = integral x^2 cos(n*x) dx',
    f'u = x^2\ndv = cos(n*x) dx\ndu = 2x dx\nv = sin(n*x)/n',
    f'I = x^2 * sin(n*x)/n - integral (2x * sin(n*x)/n) dx',
    f'I = x^2 sin(n*x)/n - (2/n) integral x sin(n*x) dx',
    f'u = x\ndv = sin(n*x) dx\n...',
    f'I = (2π (-1)^n)/n^2',
    f'an = 4(-1)^n / n^2',
    f'bn = 0',
    f'f(x) = pi^2/3 + sum(4(-1)^n / n^2 * cos(nx))'
]

r = validate_fourier_series_steps(steps, 'f(x) = x^2')
for s in r['steps']:
    status = "VALID" if s["valid"] else "INVALID"
    print(f"[{status}] {s['step']}: {s['error']}")
print("VERDICT:", r['verdict'])
