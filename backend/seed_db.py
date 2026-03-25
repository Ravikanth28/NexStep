import urllib.request
import json

print('Logging in as Teacher...')
req = urllib.request.Request(
    'http://localhost:8000/api/auth/login',
    data=json.dumps({'email': 'newteacher@test.com', 'password': 'password123'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
res = urllib.request.urlopen(req)
token = json.loads(res.read().decode())['token']
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

questions = [
    {
        'title': 'Basic Power Rule',
        'problem_expr': 'x^2',
        'difficulty': 'easy',
        'hints': ['Use the power rule: add 1 to exponent and divide by new exponent']
    },
    {
        'title': 'Trigonometric Integral',
        'problem_expr': 'sin(x) + cos(x)',
        'difficulty': 'medium',
        'hints': ['Integral of sin is -cos', 'Integral of cos is sin']
    },
    {
        'title': 'Integration by Parts Prep',
        'problem_expr': 'x * exp(x)',
        'difficulty': 'hard',
        'hints': ['Think about integration by parts formula', 'Let u = x and dv = exp(x)']
    }
]

print('\nAdding 3 questions...')
for q in questions:
    req = urllib.request.Request('http://localhost:8000/api/questions', data=json.dumps(q).encode('utf-8'), headers=headers)
    r = urllib.request.urlopen(req)
    print(f"Posted {q['difficulty']}: {r.getcode()}")

print('\nVerifying DB Storage:')
req = urllib.request.Request('http://localhost:8000/api/questions', headers=headers)
r = urllib.request.urlopen(req)
db_qs = json.loads(r.read().decode())
print(f"Total questions in DB: {len(db_qs)}")
for item in db_qs:
    print(f" - ID {item['id']}: {item['title']} [{item['difficulty']}]")

