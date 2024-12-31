-- Create the users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY, -- Matches SuperTokens user ID
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- Placeholder, since SuperTokens handles this
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the logs table
CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
