"""Built-in starter questions so recruiters can run a drive without writing or generating questions first."""

APTITUDE = [
    # Quantitative
    ("A train 150 m long passes a pole in 15 seconds. What is its speed in km/h?", ["36", "40", "45", "54"], 0, "Quantitative", "easy"),
    ("What is 35% of 240?", ["74", "84", "88", "96"], 1, "Quantitative", "easy"),
    ("The average of 5 numbers is 18. If one number is removed the average becomes 16. What number was removed?", ["22", "24", "26", "28"], 2, "Quantitative", "medium"),
    ("A shopkeeper sells an item for Rs 720 at a 20% profit. What was the cost price?", ["Rs 560", "Rs 576", "Rs 600", "Rs 620"], 2, "Quantitative", "easy"),
    ("A can finish a job in 12 days and B in 18 days. Working together, how many days will they take?", ["6", "7.2", "7.5", "8"], 1, "Quantitative", "medium"),
    ("Simple interest on Rs 5000 at 8% per annum for 3 years is:", ["Rs 1000", "Rs 1200", "Rs 1250", "Rs 1400"], 1, "Quantitative", "easy"),
    ("The ratio of boys to girls in a class is 3:5. If there are 40 students, how many are girls?", ["15", "20", "24", "25"], 3, "Quantitative", "easy"),
    ("A number increased by 25% and then decreased by 20% gives:", ["The same number", "5% more", "5% less", "10% less"], 0, "Quantitative", "medium"),
    ("Two dice are thrown. What is the probability that the sum is 7?", ["1/12", "1/9", "1/6", "1/4"], 2, "Quantitative", "medium"),
    ("A pipe fills a tank in 6 hours and another empties it in 9 hours. Both open, the tank fills in:", ["12 h", "15 h", "18 h", "20 h"], 2, "Quantitative", "medium"),
    ("What is the next number: 2, 6, 12, 20, 30, ?", ["40", "42", "44", "48"], 1, "Quantitative", "easy"),
    ("A car covers 240 km at 60 km/h and returns at 40 km/h. What is the average speed for the round trip?", ["45 km/h", "48 km/h", "50 km/h", "52 km/h"], 1, "Quantitative", "hard"),
    # Logical
    ("If all roses are flowers and some flowers fade quickly, which is definitely true?", ["All roses fade quickly", "Some roses fade quickly", "No rose fades quickly", "None of these follows"], 3, "Logical", "medium"),
    ("Find the odd one out: 3, 5, 11, 14, 17", ["3", "11", "14", "17"], 2, "Logical", "easy"),
    ("If CAT is coded as DBU, how is DOG coded?", ["EPH", "EOH", "FPH", "EPG"], 0, "Logical", "easy"),
    ("Pointing to a man, Riya says 'He is the son of my grandfather's only son.' How is the man related to Riya?", ["Cousin", "Brother", "Uncle", "Father"], 1, "Logical", "medium"),
    ("Facing north, you turn right, then right again, then left. Which direction are you facing?", ["North", "South", "East", "West"], 2, "Logical", "easy"),
    ("Which comes next: AZ, BY, CX, ?", ["DW", "DV", "EW", "DX"], 0, "Logical", "easy"),
    ("In a row of 25 students, Amit is 9th from the left. What is his position from the right?", ["16th", "17th", "18th", "15th"], 1, "Logical", "easy"),
    ("Statements: Some pens are books. All books are pages. Conclusion I: Some pens are pages. II: All pages are pens.", ["Only I follows", "Only II follows", "Both follow", "Neither follows"], 0, "Logical", "medium"),
    # Verbal
    ("Choose the synonym of 'Meticulous'.", ["Careless", "Thorough", "Hasty", "Generous"], 1, "Verbal", "easy"),
    ("Choose the antonym of 'Transparent'.", ["Opaque", "Clear", "Obvious", "Lucid"], 0, "Verbal", "easy"),
    ("Pick the correctly spelt word.", ["Accomodate", "Acommodate", "Accommodate", "Acomodate"], 2, "Verbal", "easy"),
    ("Fill in the blank: She has been working here ___ 2019.", ["for", "since", "from", "by"], 1, "Verbal", "easy"),
    ("Identify the error: 'Each of the students have submitted their assignment.'", ["Each of", "the students", "have submitted", "No error"], 2, "Verbal", "medium"),
    # Technical basics
    ("Which data structure follows First-In-First-Out order?", ["Stack", "Queue", "Binary tree", "Hash map"], 1, "Technical", "easy"),
    ("What is the time complexity of binary search on a sorted array?", ["O(n)", "O(log n)", "O(n log n)", "O(1)"], 1, "Technical", "easy"),
    ("Which SQL clause filters rows after aggregation?", ["WHERE", "GROUP BY", "HAVING", "ORDER BY"], 2, "Technical", "medium"),
    ("Which HTTP status code means 'Not Found'?", ["200", "301", "404", "500"], 2, "Technical", "easy"),
    ("In object-oriented programming, which concept lets a subclass provide its own version of a parent method?", ["Encapsulation", "Overriding", "Overloading", "Abstraction"], 1, "Technical", "easy"),
]

PY_IO = "import sys\n\ndef main():\n    data = sys.stdin.read().split()\n    # write your solution here\n\nif __name__ == '__main__':\n    main()\n"
JS_IO = "const data = require('fs').readFileSync(0, 'utf8').trim().split(/\\s+/);\n// write your solution here\n"
CPP_IO = "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // write your solution here\n    return 0;\n}\n"
JAVA_IO = "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // write your solution here\n    }\n}\n"
STARTER = {"python": PY_IO, "javascript": JS_IO, "cpp": CPP_IO, "java": JAVA_IO}

CODING = [
    {
        "title": "Sum of Even Numbers",
        "difficulty": "easy",
        "text": "Given N integers, print the sum of the even numbers among them.\n\n"
        "Input: the first line contains N. The second line contains N space-separated integers.\n"
        "Output: a single integer - the sum of all even numbers.\n\nExample\nInput:\n5\n1 2 3 4 5\nOutput:\n6",
        "tests": [
            ("5\n1 2 3 4 5\n", "6", False),
            ("3\n7 9 11\n", "0", False),
            ("6\n-2 -4 3 8 10 1\n", "12", True),
            ("1\n1000000\n", "1000000", True),
        ],
    },
    {
        "title": "Palindrome Check",
        "difficulty": "easy",
        "text": "Given a string S, print YES if it reads the same forwards and backwards after removing every "
        "non-alphanumeric character and ignoring case. Otherwise print NO.\n\n"
        "Input: a single line containing S.\nOutput: YES or NO.\n\nExample\nInput:\nRace car\nOutput:\nYES",
        "tests": [
            ("Race car\n", "YES", False),
            ("hello\n", "NO", False),
            ("A man, a plan, a canal: Panama\n", "YES", True),
            ("ab\n", "NO", True),
        ],
    },
    {
        "title": "Two Sum Count",
        "difficulty": "medium",
        "text": "Given N integers and a target T, count the pairs (i, j) with i < j such that a[i] + a[j] = T.\n\n"
        "Input: the first line contains N and T. The second line contains N integers.\n"
        "Output: the number of such pairs.\n\nConstraints: 1 <= N <= 200000\n\n"
        "Example\nInput:\n5 6\n1 5 3 3 2\nOutput:\n2",
        "tests": [
            ("5 6\n1 5 3 3 2\n", "2", False),
            ("4 10\n1 2 3 4\n", "0", False),
            ("6 4\n2 2 2 2 2 2\n", "15", True),
            ("5 0\n-1 1 -2 2 0\n", "2", True),
        ],
    },
    {
        "title": "Balanced Brackets",
        "difficulty": "medium",
        "text": "Given a string made of the characters ()[]{} print YES if the brackets are balanced, else NO.\n\n"
        "Input: a single line with the bracket string (length up to 100000).\nOutput: YES or NO.\n\n"
        "Example\nInput:\n{[()]}\nOutput:\nYES",
        "tests": [
            ("{[()]}\n", "YES", False),
            ("([)]\n", "NO", False),
            ("((((\n", "NO", True),
            ("()[]{}({[]})\n", "YES", True),
        ],
    },
    {
        "title": "Longest Increasing Run",
        "difficulty": "medium",
        "text": "Given N integers, print the length of the longest contiguous strictly increasing subarray.\n\n"
        "Input: the first line contains N. The second line contains N integers.\n"
        "Output: a single integer.\n\nExample\nInput:\n7\n1 2 2 3 4 5 1\nOutput:\n4",
        "tests": [
            ("7\n1 2 2 3 4 5 1\n", "4", False),
            ("3\n5 4 3\n", "1", False),
            ("6\n1 2 3 4 5 6\n", "6", True),
            ("1\n42\n", "1", True),
        ],
    },
]

INTERVIEW = [
    ("Walk me through a project you are most proud of. What was your role and what was the hardest technical challenge?",
     "Clear description of the project and the candidate's own contribution, a concrete technical challenge, the options considered, the solution chosen and the measurable outcome.", "Behavioural"),
    ("Explain the difference between a process and a thread.",
     "A process has its own memory/address space and resources; threads are units of execution within a process that share its memory. Threads are cheaper to create and switch but need synchronisation; processes give isolation.", "Technical"),
    ("What happens when you type a URL into the browser and press Enter?",
     "DNS resolution, TCP connection and TLS handshake, HTTP request, server processing, response, browser parsing HTML, fetching CSS/JS/images, rendering, caching.", "Technical"),
    ("How would you find and fix a slow database query?",
     "Measure first (slow query log, EXPLAIN plan), check missing or unused indexes, avoid SELECT *, reduce N+1 queries, rewrite joins/subqueries, add caching, paginate, and verify improvements with metrics.", "Technical"),
    ("What are the four pillars of object-oriented programming? Give an example of each.",
     "Encapsulation (hiding state behind methods), abstraction (exposing essential behaviour), inheritance (reusing a base class), polymorphism (same interface, different implementations / method overriding).", "Technical"),
    ("Explain what a REST API is and how you would design one for a to-do application.",
     "Resource-oriented endpoints using HTTP verbs (GET/POST/PUT/PATCH/DELETE) on /todos and /todos/{id}, stateless requests, JSON bodies, proper status codes, validation, pagination, authentication.", "Technical"),
    ("Tell me about a time you disagreed with a teammate. How did you resolve it?",
     "A specific situation, listening to the other view, using data or experiments to decide, reaching a compromise or escalating respectfully, and what was learned.", "Behavioural"),
    ("What is the difference between SQL and NoSQL databases, and when would you choose each?",
     "SQL: relational schema, joins, ACID transactions, strong consistency - good for structured data. NoSQL: document/key-value/column/graph, flexible schema, horizontal scaling - good for large-scale or rapidly changing data.", "Technical"),
    ("How do you make sure the code you write is correct and maintainable?",
     "Unit and integration tests, code review, readable naming and small functions, linting and static typing, documentation, CI pipelines, refactoring.", "Technical"),
    ("Why do you want to join this role, and where do you see yourself in two years?",
     "Genuine interest in the company/role, alignment of skills with the job, realistic growth goals and willingness to learn.", "Behavioural"),
]


def aptitude_questions():
    return [
        {"kind": "mcq", "text": q, "options": opts, "answer": ans, "topic": topic, "difficulty": diff, "marks": 1}
        for q, opts, ans, topic, diff in APTITUDE
    ]


def coding_questions():
    out = []
    for p in CODING:
        out.append(
            {
                "kind": "coding",
                "text": p["text"],
                "answer": None,
                "topic": "Programming",
                "difficulty": p["difficulty"],
                "marks": 10 if p["difficulty"] == "easy" else 20,
                "meta": {
                    "title": p["title"],
                    "starter_code": dict(STARTER),
                    "time_limit_sec": 2,
                    "test_cases": [{"input": i, "output": o, "hidden": h} for i, o, h in p["tests"]],
                },
            }
        )
    return out


def interview_questions():
    return [
        {"kind": "interview", "text": q, "answer": ref, "topic": topic, "difficulty": "medium", "marks": 10}
        for q, ref, topic in INTERVIEW
    ]


def samples_for(round_type):
    return {
        "aptitude": aptitude_questions,
        "coding": coding_questions,
        "interview": interview_questions,
    }.get(round_type, lambda: [])()


KIND_FOR_ROUND = {"aptitude": "mcq", "coding": "coding", "interview": "interview"}
