/**
 * Passwords and words that top every breach list, lowercased.
 * Any of these inside a password collapses its strength to "one guess from a list".
 */
export const COMMON_WORDS: string[] = [
  "password", "passw0rd", "pass", "admin", "administrator", "root", "user", "guest", "login", "welcome", "letmein",
  "qwerty", "qwertyuiop", "asdfgh", "asdfghjkl", "zxcvbn", "zxcvbnm", "azerty", "abc", "abcd", "abcdef",
  "iloveyou", "love", "lover", "loveyou", "princess", "prince", "dragon", "monkey", "master", "shadow", "sunshine",
  "superman", "batman", "spiderman", "ironman", "pokemon", "naruto", "freedom", "whatever", "trustno1", "secret",
  "football", "soccer", "cricket", "baseball", "hockey", "basketball", "tennis", "chelsea", "arsenal", "liverpool",
  "barcelona", "realmadrid", "ronaldo", "messi", "dhoni", "virat", "sachin", "kohli",
  "india", "bharat", "hindustan", "mumbai", "delhi", "chennai", "kolkata", "bangalore", "bengaluru", "hyderabad", "pune",
  "krishna", "ganesh", "ganesha", "sairam", "omsairam", "shiva", "jaishriram", "jaihind", "hanuman", "murugan", "balaji",
  "michael", "jennifer", "jordan", "daniel", "thomas", "charlie", "andrew", "joshua", "ashley", "jessica", "hannah",
  "rahul", "priya", "rohit", "amit", "anjali", "vignesh", "karthik", "arjun", "deepak", "pooja", "sneha", "divya",
  "computer", "internet", "samsung", "nokia", "google", "facebook", "instagram", "whatsapp", "apple", "iphone",
  "starwars", "matrix", "hello", "hellokitty", "flower", "summer", "winter", "spring", "autumn", "monday", "friday",
  "blink182", "angel", "angels", "baby", "babygirl", "beautiful", "butterfly", "chocolate", "cookie", "cheese",
  "computer", "killer", "hunter", "ranger", "buster", "tigger", "tiger", "lion", "eagle", "falcon", "phoenix",
  "mustang", "ferrari", "porsche", "harley", "yamaha", "pulsar", "royal", "enfield",
  "money", "rich", "lucky", "happy", "smile", "family", "mother", "father", "sister", "brother", "friend", "friends",
  "nemesis", "hacker", "hackme", "test", "testing", "demo", "default", "changeme", "college", "student", "school",
  "access", "zaq1zaq1", "1q2w3e", "1q2w3e4r", "q1w2e3r4", "qazwsx", "zaq12wsx", "passpass", "aaaaaa", "abc123",
  "123abc", "a1b2c3", "pass123", "admin123", "welcome1", "password1", "iloveu", "loveme", "fuckyou", "biteme",
];

/** Rows of a QWERTY keyboard, for detecting finger-walk sequences. */
export const KEYBOARD_ROWS = ["`1234567890-=", "qwertyuiop[]\\", "asdfghjkl;'", "zxcvbnm,./"];
