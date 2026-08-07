CREATE TABLE users (
    id             SERIAL PRIMARY KEY,
    name           VARCHAR(255) NOT NULL,
    email          VARCHAR(255) UNIQUE,
    password_hash  VARCHAR(255),
    photo_url      TEXT,
    dob            DATE,
    created_at     TIMESTAMP DEFAULT now()
);

CREATE TABLE oauth_accounts (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER NOT NULL,
    provider     VARCHAR(32) NOT NULL,
    provider_id  VARCHAR(255) NOT NULL,
    created_at   TIMESTAMP DEFAULT now(),

    CONSTRAINT oauth_accounts_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE,
    CONSTRAINT oauth_accounts_provider_provider_id_key
        UNIQUE (provider, provider_id)
);

CREATE INDEX idx_oauth_provider
    ON oauth_accounts USING BTREE (provider, provider_id);

CREATE TABLE memories (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER NOT NULL,
    country      VARCHAR(255) NOT NULL,
    photo_url    TEXT NOT NULL,
    description  TEXT,
    public_id    VARCHAR(255),
    created_at   TIMESTAMP DEFAULT now(),

    CONSTRAINT memories_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE
);
